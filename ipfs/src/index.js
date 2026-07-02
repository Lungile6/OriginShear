require('dotenv').config();
const { create } = require('ipfs-http-client');

// Connect to IPFS (uses public gateway by default, or local node if configured)
const ipfs = create({
  url: process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001/api/v0',
  headers: {
    authorization: `Basic ${Buffer.from(
      `${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`
    ).toString('base64')}`
  }
});

/**
 * Upload metadata to IPFS
 * @param {Object} metadata - Metadata object to upload
 * @returns {Promise<string>} IPFS CID
 */
async function uploadMetadata(metadata) {
  try {
    const result = await ipfs.add(JSON.stringify(metadata));
    return result.path;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload to IPFS');
  }
}

/**
 * Upload file to IPFS
 * @param {Buffer|String} file - File content to upload
 * @returns {Promise<string>} IPFS CID
 */
async function uploadFile(file) {
  try {
    const result = await ipfs.add(file);
    return result.path;
  } catch (error) {
    console.error('IPFS file upload error:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

/**
 * Retrieve metadata from IPFS
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>} Metadata object
 */
async function getMetadata(cid) {
  try {
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks).toString();
    return JSON.parse(data);
  } catch (error) {
    console.error('IPFS retrieval error:', error);
    throw new Error('Failed to retrieve from IPFS');
  }
}

/**
 * Upload lot metadata with photos
 * @param {Object} lotData - Lot data
 * @param {Array} photos - Array of photo buffers
 * @returns {Promise<string>} IPFS CID
 */
async function uploadLotMetadata(lotData, photos = []) {
  try {
    // Upload photos first
    const photoCids = [];
    for (const photo of photos) {
      const cid = await uploadFile(photo);
      photoCids.push(`ipfs://${cid}`);
    }

    // Create metadata with photo references
    const metadata = {
      ...lotData,
      photos: photoCids,
      uploadedAt: new Date().toISOString(),
      version: '1.0'
    };

    return await uploadMetadata(metadata);
  } catch (error) {
    console.error('Lot metadata upload error:', error);
    throw error;
  }
}

/**
 * Upload farmer profile with documents
 * @param {Object} farmerData - Farmer data
 * @param {Object} documents - Document buffers (ID, registration, etc.)
 * @returns {Promise<string>} IPFS CID
 */
async function uploadFarmerProfile(farmerData, documents = {}) {
  try {
    // Upload documents
    const documentCids = {};
    for (const [docType, docBuffer] of Object.entries(documents)) {
      const cid = await uploadFile(docBuffer);
      documentCids[docType] = `ipfs://${cid}`;
    }

    // Create metadata
    const metadata = {
      ...farmerData,
      documents: documentCids,
      uploadedAt: new Date().toISOString(),
      version: '1.0'
    };

    return await uploadMetadata(metadata);
  } catch (error) {
    console.error('Farmer profile upload error:', error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL for a CID
 * @param {string} cid - IPFS CID
 * @returns {string} Gateway URL
 */
function getGatewayUrl(cid) {
  const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs';
  return `${gateway}/${cid}`;
}

module.exports = {
  uploadMetadata,
  uploadFile,
  getMetadata,
  uploadLotMetadata,
  uploadFarmerProfile,
  getGatewayUrl
};
