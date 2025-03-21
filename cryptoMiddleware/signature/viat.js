// dilithium65+ed25519+SPHINCS+shake256
import {
	assign,
	everyArray,
	isArray,
	isBuffer,
	returnValue,
	untilFalseArray
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
// VIAT HYBRID SIGNATURE SCHEME
// Permit partial signature possibility
import { hash256, hash512 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex
} from '#crypto';
import dilithium65 from './dilithium65.js';
import ed25519 from './ed25519.js';
import signatureScheme from './signatureScheme.js';
import sphincs192 from './sphincs192.js';
// KEY SIZES
const seedSize = 64;
const publicKeySize = dilithium65.publicKeySize + ed25519.publicKeySize + sphincs192.publicKeySize;
const privateKeySize = dilithium65.privateKeySize + ed25519.privateKeySize + sphincs192.privateKeySize;
const signatureSize = dilithium65.signatureSize + ed25519.signatureSize + sphincs192.signatureSize;
// KEY END INDEXES
const ed25519PublicKeyEndIndex = ed25519.publicKeySize;
const ed25519PrivateKeyEndIndex = ed25519.privateKeySize;
const dilithiumPublicKeyEndIndex = ed25519.publicKeySize + dilithium65.publicKeySize;
const dilithiumPrivateKeyEndIndex = ed25519.privateKeySize + dilithium65.privateKeySize;
const sphincsPublicKeyEndIndex = dilithiumPublicKeyEndIndex + sphincs192.publicKeySize;
const sphincsPrivateKeyEndIndex = dilithiumPrivateKeyEndIndex + sphincs192.privateKeySize;
// SIGNATURE END INDEXES
const ed25519SignatureEndIndex = ed25519.signatureSize;
const dilithiumSignatureEndIndex = ed25519.signatureSize + dilithium65.signatureSize;
const sphincsSignatureEndIndex = dilithiumSignatureEndIndex + sphincs192.signatureSize;
function getEd25519Key(publicKey) {
	return publicKey.subarray(0, ed25519PublicKeyEndIndex);
}
function getDilithiumPublicKey(publicKey) {
	return publicKey.subarray(ed25519.publicKeySize, dilithiumPublicKeyEndIndex);
}
function getDilithiumPrivateKey(publicKey) {
	return publicKey.subarray(ed25519.privateKeySize, dilithiumPrivateKeyEndIndex);
}
function getSphincsPublicKey(publicKey) {
	return publicKey.subarray(dilithiumPublicKeyEndIndex, sphincsPublicKeyEndIndex);
}
function getSphincsPrivateKey(publicKey) {
	return publicKey.subarray(dilithiumPrivateKeyEndIndex, sphincsPrivateKeyEndIndex);
}
function assembleKeypairObject(source, index) {
	const target = {};
	if (source.publicKey) {
		target.publicKey = source.publicKey[index];
	}
	if (source.privateKey) {
		target.privateKey = source.privateKey[index];
	}
	return target;
}
function getEd25519Keypair(source) {
	return ed25519.initializeKeypair(assembleKeypairObject(source, 0));
}
function getDilithiumKeypair(source) {
	return dilithium65.initializeKeypair(assembleKeypairObject(source, 1));
}
function getSphincsKeypair(source) {
	return sphincs192.initializeKeypair(assembleKeypairObject(source, 2));
}
export async function createKeypair() {
	const dilithium = await dilithium65.signatureKeypair();
	const sphincs = await sphincs192.signatureKeypair();
	const ed25519Instance = await ed25519.signatureKeypair();
	const ed25519Keypair = await ed25519.exportKeypair(ed25519Instance);
	const dilithiumKeypair = await dilithium65.exportKeypair(dilithium);
	const sphincsKeypair = await sphincs192.exportKeypair(sphincs);
	// console.log('createKeypair', ed25519Keypair, dilithiumKeypair, sphincsKeypair);
	const publicKey = [
		ed25519Keypair.publicKey, dilithiumKeypair.publicKey, sphincsKeypair.publicKey
	];
	const privateKey = [
		ed25519Keypair.privateKey, dilithiumKeypair.privateKey, sphincsKeypair.privateKey
	];
	return {
		publicKey,
		privateKey,
		ed25519Instance,
		dilithium,
		sphincs
	};
}
export async function initializeKeypair(sourceArg) {
	const source = (isBuffer(sourceArg)) ? decode(sourceArg) : sourceArg;
	const target = assign({}, source);
	const ed25519Instance = await getEd25519Keypair(target);
	const dilithium = await getDilithiumKeypair(target);
	const sphincs = await getSphincsKeypair(target);
	target.ed25519Instance = ed25519Instance;
	target.dilithium = dilithium;
	target.sphincs = sphincs;
	return target;
}
export async function signMethod(message, source) {
	const signatureArray = [];
	const {
		ed25519Instance,
		dilithium,
		sphincs
	} = source;
	// console.log('signMethod', source);
	if (ed25519Instance) {
		const ed25519Sig = await ed25519.sign(message, ed25519Instance);
		// console.log('ed25519Keypair', ed25519Sig.length);
		signatureArray[0] = ed25519Sig;
	}
	if (dilithium) {
		const dilithiumSig = await dilithium65.sign(message, dilithium);
		// console.log('dilithiumSig', dilithiumSig.length);
		signatureArray[1] = dilithiumSig;
	}
	if (sphincs) {
		const sphincsSig = await sphincs192.sign(message, sphincs);
		// console.log('sphincsSig', sphincsSig.length);
		signatureArray[2] = sphincsSig;
	}
	return encode(signatureArray);
}
export async function signPartial(message, source) {
	const signatureArray = [];
	const {
		ed25519Instance,
		dilithium
	} = source;
	// console.log('signMethod', source);
	if (ed25519Instance) {
		const ed25519Sig = await ed25519.sign(message, ed25519Instance);
		// console.log('ed25519Keypair', ed25519Sig.length);
		signatureArray[0] = ed25519Sig;
	}
	if (dilithium) {
		const dilithiumSig = await dilithium65.sign(message, dilithium);
		// console.log('dilithiumSig', dilithiumSig.length);
		signatureArray[1] = dilithiumSig;
	}
	return encode(signatureArray);
}
export async function verifyEach(signatureArg, message, source) {
	const signature = (isBuffer(signatureArg)) ? decode(signatureArg) : signatureArg;
	if (!isArray(signature)) {
		return false;
	}
	const verificationArray = [];
	const {
		ed25519Instance,
		dilithium,
		sphincs
	} = source;
	// console.log('verifyEach', source);
	const ed25519Sig = signature[0];
	if (ed25519Instance && ed25519Sig) {
		const verified = await ed25519.verifySignature(ed25519Sig, message, ed25519Instance);
		// console.log('ed25519Sig', verified?.length, verified);
		verificationArray[0] = verified;
	}
	const dilithiumSig = signature[1];
	if (dilithium && dilithiumSig) {
		// console.log('dilithiumSig', dilithiumSig?.length, dilithium65?.signatureSize);
		const verified = await dilithium65.verifySignature(dilithiumSig, message, dilithium);
		verificationArray[1] = verified;
	}
	const sphincsSig = signature[2];
	if (sphincs && sphincsSig) {
		// console.log('sphincsSig', sphincsSig?.length);
		const verified = await sphincs192.verifySignature(sphincsSig, message, sphincs);
		verificationArray[2] = verified;
	}
	if (verificationArray.length === 0) {
		return false;
	}
	return verificationArray;
}
async function verifyMethod(signature, message, source) {
	const verificationArray = await this.verifyEach(signature, message, source);
	// console.log('verifyMethod', verificationArray);
	if (!verificationArray || !verificationArray?.length) {
		return false;
	}
	const ed25519Verify = verificationArray[0];
	const dilithiumVerify = verificationArray[1];
	const sphincsVerify = verificationArray[2];
	return ed25519Verify && dilithiumVerify && sphincsVerify;
}
async function verifySignaturePartial(signature, message, source) {
	const verificationArray = await verifyEach(signature, message, source);
	// console.log('verifySignaturePartial', verificationArray);
	if (!verificationArray || !verificationArray?.length) {
		return false;
	}
	const ed25519Verify = verificationArray[0];
	const dilithiumVerify = verificationArray[1];
	return ed25519Verify && dilithiumVerify;
}
async function exportKeypair(source) {
	const target = {
		publicKey: source.publicKey,
		privateKey: source.privateKey
	};
	return target;
}
export const viat = signatureScheme({
	name: 'viat',
	alias: 'viat',
	description: 'VIAT Hybrid Signature Scheme - ed25519+dilithium65+slh_dsa_shake_192s+SHAKE256.',
	id: 6,
	publicKeySize,
	privateKeySize,
	signatureSize,
	seedSize,
	createKeypair,
	verifyMethod,
	signMethod,
	signPartial,
	getEd25519Key,
	getDilithiumPublicKey,
	getDilithiumPrivateKey,
	getSphincsPublicKey,
	getSphincsPrivateKey,
	initializeKeypair,
	verifyEach,
	verifySignaturePartial,
	exportKeypair
});
export default viat;
// const key = await viat.signatureKeypair();
// console.log(key);
// const exported = await viat.exportKeypair(key);
// console.log('exported', exported);
// const bexport = await viat.exportBinary(exported);
// console.log('Binary Export', bexport, bexport.length);
// const bimport = await viat.initializeBinary(bexport);
// console.log('Binary Import', bimport);
// const msg = Buffer.from('hello world');
// console.log(exported.publicKey.length, exported.privateKey.length);
// const sig = await viat.sign(msg, key);
// console.log('signature', sig.length, decode(sig));
// console.log(await viat.verify(sig, msg, key));
// const imported = await viat.initializeKeypair(exported);
// console.log('imported', imported);
// console.log(await viat.verify(sig, msg, imported));
// const sig2 = await viat.sign(msg, imported);
// console.log('sig2', sig2.length, decode(sig2));
// console.log('sig2 verifyAll', await viat.verifyAll(sig2, msg, key));
// console.log('sig2 verifyPrimary', await viat.verifyPrimary(sig2, msg, key));
