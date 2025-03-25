import { assign, findItem } from '@universalweb/acid';
// Auto Generate SignatureSchemes for Post Quantum Cryptography
/**
	* @NAME SPHINCS+ with SHAKE256 - slh_dsa_shake_192s sphincs-shake-192s-simple
 */
import { hash256, hash512, shake256 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex,
} from '#utilities/cryptography/utils';
import pqclean from 'pqclean';
import { signatureScheme } from './signatureScheme.js';
const seedSize = 64;
const algoList = pqclean.sign.supportedAlgorithms;
const generateKeyPair = pqclean.sign.generateKeyPair;
/* const supportedAlgorithms = [
	'falcon-1024',
	'falcon-512',
	'falcon-padded-1024',
	'falcon-padded-512',
	'ml-dsa-44',
	'ml-dsa-65',
	'ml-dsa-87',
	'sphincs-sha2-128f-simple',
	'sphincs-sha2-128s-simple',
	'sphincs-sha2-192f-simple',
	'sphincs-sha2-192s-simple',
	'sphincs-sha2-256f-simple',
	'sphincs-sha2-256s-simple',
	'sphincs-shake-128f-simple',
	'sphincs-shake-128s-simple',
	'sphincs-shake-192f-simple',
	'sphincs-shake-192s-simple',
	'sphincs-shake-256f-simple',
	'sphincs-shake-256s-simple'
]; */
// console.log(algoList);
const PrivateKey = pqclean.sign.PrivateKey;
const PublicKey = pqclean.sign.PublicKey;
function generateScheme(schemeName, options = {}) {
	const scheme = findItem(algoList, schemeName, 'name');
	const {
		publicKeySize,
		privateKeySize,
		signatureSize,
		description
	} = scheme;
	// console.log(scheme);
	async function createKeypair() {
		const keypair = await generateKeyPair(schemeName);
		return keypair;
	}
	async function initializeKeypair(source) {
		const keypair = {};
		if (source.publicKey) {
			keypair.publicKey = new PublicKey(schemeName, source.publicKey);
		}
		if (source.privateKey) {
			keypair.privateKey = new PrivateKey(schemeName, source.privateKey);
		}
		return keypair;
	}
	// console.log(await genKey());
	const schemeObject = {
		name: schemeName,
		alias: schemeName,
		publicKeySize,
		privateKeySize,
		signatureSize,
		seedSize,
		createKeypair,
		initializeKeypair,
		hash256,
		hash512,
		hash: shake256
	};
	assign(schemeObject, options);
	const sigScheme = signatureScheme(schemeObject);
	return sigScheme;
}
export default generateScheme;
// const key = await sphincs192.signatureKeypair();
// const msg = Buffer.from('hello world');
// console.log(key);
// console.log(key.publicKey.length, key.privateKey.length);
// const sig = await sphincs192.sign(msg, key);
// console.log(sig);
// console.log(await sphincs192.verify(sig, key, msg));

