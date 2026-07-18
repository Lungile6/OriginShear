// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MultiSigTreasury
 * @author Lungile Mabelebele — ALU Capstone 2026
 * @notice Multi-signature treasury for managing platform fees and gas subsidies
 *         Requires multiple signatories for withdrawals and fund management.
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE  — LNWMGA system admin
 *   SIGNER_ROLE        — Authorized signatories
 */
contract MultiSigTreasury is AccessControl, Pausable {

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    enum TransactionType { WITHDRAWAL, TRANSFER, GRANT_SUBSIDY }
    enum TransactionStatus { PENDING, EXECUTED, CANCELLED }

    struct Transaction {
        uint256 transactionId;
        TransactionType txType;
        address token;
        address to;
        uint256 amount;
        TransactionStatus status;
        address proposedBy;
        uint256 proposedAt;
        uint256 executedAt;
        bytes data;
        string description;
    }

    uint256 private _transactionCounter;
    uint256 public requiredSignatures; // Number of signatures required
    uint256 public executionDelay; // Delay in seconds before execution

    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public signatures;
    mapping(address => uint256[]) private _proposedTransactions;
    mapping(address => uint256[]) private _signedTransactions;

    address[] private _signers;
    mapping(address => bool) private _isSignerListed;

    IERC20 public immutable cUSD;

    event TransactionProposed(uint256 indexed transactionId, TransactionType txType, address indexed proposedBy);
    event TransactionSigned(uint256 indexed transactionId, address indexed signer);
    event TransactionExecuted(uint256 indexed transactionId, address executedBy);
    event TransactionCancelled(uint256 indexed transactionId, address cancelledBy);
    event RequiredSignaturesUpdated(uint256 newRequired);
    event ExecutionDelayUpdated(uint256 newDelay);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);

    error TransactionNotFound(uint256 transactionId);
    error AlreadySigned(uint256 transactionId, address signer);
    error InsufficientSignatures(uint256 current, uint256 required);
    error ExecutionDelayNotMet(uint256 proposedAt, uint256 delay);
    error InvalidAmount(uint256 amount);
    error InvalidAddress(address addr);
    error NotSigner(address caller);
    error TransactionAlreadyExecuted(uint256 transactionId);
    error InvalidRequiredSignatures(uint256 value);

    constructor(address _cUSD, address admin, address[] memory initialSigners) {
        cUSD = IERC20(_cUSD);
        requiredSignatures = 2; // Default: 2 signatures required
        executionDelay = 1 hours; // Default: 1 hour delay
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _addSigner(admin);
        
        // Add initial signers
        for (uint256 i = 0; i < initialSigners.length; i++) {
            _addSigner(initialSigners[i]);
        }
    }

    /**
     * @notice Propose a new transaction
     * @dev Signer-only.
     */
    function proposeTransaction(
        TransactionType txType,
        address token,
        address to,
        uint256 amount,
        bytes calldata data,
        string calldata description
    ) external onlyRole(SIGNER_ROLE) whenNotPaused returns (uint256 transactionId) {
        if (amount == 0) revert InvalidAmount(amount);
        if (to == address(0)) revert InvalidAddress(to);
        
        transactionId = ++_transactionCounter;
        transactions[transactionId] = Transaction({
            transactionId: transactionId,
            txType: txType,
            token: token,
            to: to,
            amount: amount,
            status: TransactionStatus.PENDING,
            proposedBy: msg.sender,
            proposedAt: block.timestamp,
            executedAt: 0,
            data: data,
            description: description
        });
        
        _proposedTransactions[msg.sender].push(transactionId);
        
        // Proposer automatically signs
        signatures[transactionId][msg.sender] = true;
        _signedTransactions[msg.sender].push(transactionId);
        
        emit TransactionProposed(transactionId, txType, msg.sender);
        emit TransactionSigned(transactionId, msg.sender);
    }

    /**
     * @notice Sign a pending transaction
     * @dev Signer-only.
     */
    function signTransaction(uint256 transactionId) external onlyRole(SIGNER_ROLE) {
        Transaction storage transaction = _getTransaction(transactionId);
        
        if (transaction.status != TransactionStatus.PENDING) {
            revert TransactionAlreadyExecuted(transactionId);
        }
        
        if (signatures[transactionId][msg.sender]) {
            revert AlreadySigned(transactionId, msg.sender);
        }
        
        signatures[transactionId][msg.sender] = true;
        _signedTransactions[msg.sender].push(transactionId);
        
        emit TransactionSigned(transactionId, msg.sender);
    }

    /**
     * @notice Execute a transaction once it has enough signatures and delay has passed
     * @dev Signer-only.
     */
    function executeTransaction(uint256 transactionId) external onlyRole(SIGNER_ROLE) whenNotPaused {
        Transaction storage transaction = _getTransaction(transactionId);
        
        if (transaction.status != TransactionStatus.PENDING) {
            revert TransactionAlreadyExecuted(transactionId);
        }
        
        uint256 sigCount = _countSignatures(transactionId);
        if (sigCount < requiredSignatures) {
            revert InsufficientSignatures(sigCount, requiredSignatures);
        }
        
        if (block.timestamp < transaction.proposedAt + executionDelay) {
            revert ExecutionDelayNotMet(transaction.proposedAt, executionDelay);
        }
        
        // Execute based on transaction type
        if (transaction.txType == TransactionType.WITHDRAWAL || transaction.txType == TransactionType.TRANSFER) {
            IERC20 token = IERC20(transaction.token);
            bool success = token.transfer(transaction.to, transaction.amount);
            require(success, "Transfer failed");
        } else if (transaction.txType == TransactionType.GRANT_SUBSIDY) {
            // Special handling for subsidy grants
            bool success = cUSD.transfer(transaction.to, transaction.amount);
            require(success, "Subsidy transfer failed");
        }
        
        transaction.status = TransactionStatus.EXECUTED;
        transaction.executedAt = block.timestamp;
        
        emit TransactionExecuted(transactionId, msg.sender);
    }

    /**
     * @notice Cancel a pending transaction
     * @dev Can only be cancelled by the proposer or admin.
     */
    function cancelTransaction(uint256 transactionId) external {
        Transaction storage transaction = _getTransaction(transactionId);
        
        if (transaction.status != TransactionStatus.PENDING) {
            revert TransactionAlreadyExecuted(transactionId);
        }
        
        require(
            msg.sender == transaction.proposedBy || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to cancel"
        );
        
        transaction.status = TransactionStatus.CANCELLED;
        emit TransactionCancelled(transactionId, msg.sender);
    }

    /**
     * @notice Update required signatures
     * @dev Admin-only.
     */
    function setRequiredSignatures(uint256 newRequired) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newRequired < 1 || newRequired > 10) revert InvalidRequiredSignatures(newRequired);
        requiredSignatures = newRequired;
        emit RequiredSignaturesUpdated(newRequired);
    }

    /**
     * @notice Update execution delay
     * @dev Admin-only.
     */
    function setExecutionDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        executionDelay = newDelay;
        emit ExecutionDelayUpdated(newDelay);
    }

    /**
     * @notice Add a new signer
     * @dev Admin-only.
     */
    function addSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (signer == address(0)) revert InvalidAddress(signer);
        _addSigner(signer);
    }

    /**
     * @notice Remove a signer
     * @dev Admin-only.
     */
    function removeSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (signer == address(0)) revert InvalidAddress(signer);
        _removeSigner(signer);
    }

    /**
     * @notice Get transaction details
     */
    function getTransaction(uint256 transactionId) external view returns (Transaction memory) {
        return _getTransaction(transactionId);
    }

    /**
     * @notice Get all transactions proposed by an address
     */
    function getProposedTransactions(address proposer) external view returns (uint256[] memory) {
        return _proposedTransactions[proposer];
    }

    /**
     * @notice Get all transactions signed by an address
     */
    function getSignedTransactions(address signer) external view returns (uint256[] memory) {
        return _signedTransactions[signer];
    }

    /**
     * @notice Count signatures for a transaction
     */
    function countSignatures(uint256 transactionId) external view returns (uint256) {
        return _countSignatures(transactionId);
    }

    /**
     * @notice Check if a transaction can be executed
     */
    function canExecute(uint256 transactionId) external view returns (bool) {
        Transaction storage transaction = transactions[transactionId];
        if (transaction.transactionId == 0 || transaction.status != TransactionStatus.PENDING) return false;
        
        uint256 sigCount = _countSignatures(transactionId);
        if (sigCount < requiredSignatures) return false;
        
        if (block.timestamp < transaction.proposedAt + executionDelay) return false;
        
        return true;
    }

    /**
     * @notice Get treasury balance for a token
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Get all signers
     */
    function getSigners() external view returns (address[] memory) {
        return _signers;
    }

    function _getTransaction(uint256 transactionId) internal view returns (Transaction storage) {
        if (transactionId == 0 || transactionId > _transactionCounter) revert TransactionNotFound(transactionId);
        return transactions[transactionId];
    }

    function _addSigner(address signer) internal {
        if (_isSignerListed[signer]) {
            if (!hasRole(SIGNER_ROLE, signer)) {
                _grantRole(SIGNER_ROLE, signer);
            }
            return;
        }
        _isSignerListed[signer] = true;
        _signers.push(signer);
        _grantRole(SIGNER_ROLE, signer);
        emit SignerAdded(signer);
    }

    function _removeSigner(address signer) internal {
        if (!_isSignerListed[signer]) {
            if (hasRole(SIGNER_ROLE, signer)) {
                _revokeRole(SIGNER_ROLE, signer);
            }
            return;
        }
        _isSignerListed[signer] = false;
        _revokeRole(SIGNER_ROLE, signer);

        uint256 len = _signers.length;
        for (uint256 i = 0; i < len; i++) {
            if (_signers[i] == signer) {
                _signers[i] = _signers[len - 1];
                _signers.pop();
                break;
            }
        }
        emit SignerRemoved(signer);
    }

    function _countSignatures(uint256 transactionId) internal view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _signers.length; i++) {
            if (signatures[transactionId][_signers[i]]) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Emergency withdraw (admin only, bypasses multi-sig)
     */
    function emergencyWithdraw(address token, address to, uint256 amount) 
        external onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        bool success = IERC20(token).transfer(to, amount);
        require(success, "Transfer failed");
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
