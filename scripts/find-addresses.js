const { JsonRpcProvider, getCreateAddress } = require("ethers");

async function main() {
  const provider = new JsonRpcProvider("https://celo-sepolia.g.alchemy.com/v2/guusXcuDWSTypMk8NFB4_");
  const deployer = "0x4b8eEDd24270579A8D61a7F4Eaa0cf05b3Aa7672";

  console.log("Checking nonces for deployer:", deployer);
  
  // Let's compute contract addresses for nonces 0 to 50
  for (let nonce = 0; nonce < 100; nonce++) {
    const address = getCreateAddress({ from: deployer, nonce });
    const code = await provider.getCode(address);
    if (code !== "0x") {
      console.log(`Nonce ${nonce}: ${address} (Contract exists!)`);
    }
  }
}

main().catch(console.error);
