const totalBTCAdd = 1_000_000_000n;
const dilithiumPublicKeySmall = 1312n;
const dilithiumSignatureSmall = 2420n;
const dilithium3PublicKeySmall = 1952n;
const dilithium3SignatureSmall = 3293n;
const postQTHash = 64n;
// Parameter set	Parameter set alias	Security model	Claimed NIST Level	Public key size (bytes)	Secret key size (bytes)	Signature size (bytes)
// Dilithium2	NA	SUF-CMA	2	1312	2528	2420
// Dilithium3	NA	SUF-CMA	3	1952	4000	3293
// Dilithium5	NA	SUF-CMA	5	2592	4864 	4595
function estimateAdditionalOverheadHybridWallets(pubkey, sigsize) {
	const perOverhead = pubkey + sigsize;
	return totalBTCAdd * perOverhead;
}
function estimateBlockSizes(sigsize, hashsize, blockSizeDefault = 300n) {
	const perOverhead = sigsize + hashsize;
	return blockSizeDefault + perOverhead + 256n;
}
function pretty(source) {
	return source.toLocaleString('en-US');
}
const bytesToKB = (bytes) => {
	return Number(bytes) / 1024;
};
function convertBytesToGB(bytes) {
	return bytes / 1000000000n;
}
const estimateHybridLow = estimateAdditionalOverheadHybridWallets(dilithiumPublicKeySmall, dilithiumSignatureSmall);
console.log(pretty(estimateHybridLow));
console.log(`Estimated additional overhead in GB: ${convertBytesToGB(estimateHybridLow) / 1000n} TB`);
const blockSizeEstimate = estimateBlockSizes(dilithiumSignatureSmall, postQTHash, 300n);
console.log(pretty(blockSizeEstimate));
console.log(`Dilithium2 Estimated block size in KB: ${bytesToKB(blockSizeEstimate)} KB`);
const blockSizeEstimateD3 = estimateBlockSizes(dilithium3SignatureSmall, postQTHash, 300n);
console.log(`Dilithium3 Estimated block size in KB: ${bytesToKB(blockSizeEstimateD3)} KB`);
