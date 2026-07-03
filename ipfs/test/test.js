const assert = require("assert");
const ipfs = require("../src/index");

function run() {
  assert.strictEqual(typeof ipfs.uploadMetadata, "function", "uploadMetadata should be exported");
  assert.strictEqual(typeof ipfs.uploadFile, "function", "uploadFile should be exported");
  assert.strictEqual(typeof ipfs.getMetadata, "function", "getMetadata should be exported");
  assert.strictEqual(typeof ipfs.uploadLotMetadata, "function", "uploadLotMetadata should be exported");
  assert.strictEqual(typeof ipfs.uploadFarmerProfile, "function", "uploadFarmerProfile should be exported");
  assert.strictEqual(typeof ipfs.getGatewayUrl, "function", "getGatewayUrl should be exported");

  const sampleCid = "QmTestCid123";
  const gatewayUrl = ipfs.getGatewayUrl(sampleCid);
  assert.ok(gatewayUrl.includes(sampleCid), "gateway URL should include CID");

  console.log("IPFS module smoke tests passed");
}

run();
