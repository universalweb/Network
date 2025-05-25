// dilithium65+ed25519+SPHINCS192s+shake256
// VIAT HYBRID SIGNATURE SCHEME
import {
	assign,
	everyArray,
	isArray,
	isBuffer,
	returnValue,
	untilFalseArray
} from '@universalweb/acid';
import { decode, encode, encodeStrict } from '#utilities/serialize';
import { hash256, hash512 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex
} from '#utilities/cryptography/utils';
import dilithium65 from './dilithium65.js';
import ed25519Utils from './ed25519.js';
import signatureScheme from './signatureScheme.js';
import sphincs192 from './sphincs192.js';
// SEED SIZE COMBINED
const seedSize = ed25519Utils.seedSize + dilithium65.seedSize + sphincs192.seedSize;
// console.log(seedSize);
// KEY SIZES
const publicKeySize = dilithium65.publicKeySize + ed25519Utils.publicKeySize + sphincs192.publicKeySize;
const privateKeySize = dilithium65.privateKeySize + ed25519Utils.privateKeySize + sphincs192.privateKeySize;
const signatureSize = dilithium65.signatureSize + ed25519Utils.signatureSize + sphincs192.signatureSize;
// KEY END INDEXES
const ed25519PublicKeyEndIndex = ed25519Utils.publicKeySize;
const ed25519PrivateKeyEndIndex = ed25519Utils.privateKeySize;
const dilithiumPublicKeyEndIndex = ed25519Utils.publicKeySize + dilithium65.publicKeySize;
const dilithiumPrivateKeyEndIndex = ed25519Utils.privateKeySize + dilithium65.privateKeySize;
const sphincsPublicKeyEndIndex = dilithiumPublicKeyEndIndex + sphincs192.publicKeySize;
const sphincsPrivateKeyEndIndex = dilithiumPrivateKeyEndIndex + sphincs192.privateKeySize;
// SIGNATURE END INDEXES
const ed25519SignatureEndIndex = ed25519Utils.signatureSize;
const dilithiumSignatureEndIndex = ed25519Utils.signatureSize + dilithium65.signatureSize;
const sphincsSignatureEndIndex = dilithiumSignatureEndIndex + sphincs192.signatureSize;
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
	return ed25519Utils.initializeKeypair(assembleKeypairObject(source, 0));
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
	const ed25519 = await ed25519Utils.signatureKeypair();
	const ed25519Keypair = await ed25519Utils.exportKeypair(ed25519);
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
		ed25519,
		dilithium,
		sphincs
	};
}
export async function initializeKeypair(sourceArg) {
	const source = (isBuffer(sourceArg)) ? await decode(sourceArg) : sourceArg;
	const target = assign({}, source);
	const ed25519 = await getEd25519Keypair(target);
	const dilithium = await getDilithiumKeypair(target);
	const sphincs = await getSphincsKeypair(target);
	target.ed25519 = ed25519;
	target.dilithium = dilithium;
	target.sphincs = sphincs;
	return target;
}
async function isKeypairInitialized(source) {
	if (source.ed25519 && source.dilithium && source.sphincs) {
		return true;
	}
	return false;
}
export async function signMethod(message, source) {
	const signatureArray = [];
	const {
		ed25519,
		dilithium,
		sphincs
	} = source;
	// console.log('signMethod', source);
	if (ed25519) {
		const ed25519Sig = await ed25519Utils.sign(message, ed25519);
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
	return encodeStrict(signatureArray);
}
export async function signPartial(message, source) {
	const signatureArray = [];
	const {
		ed25519,
		dilithium
	} = source;
	// console.log('signMethod', source);
	if (ed25519) {
		const ed25519Sig = await ed25519Utils.sign(message, ed25519);
		// console.log('ed25519Keypair', ed25519Sig.length);
		signatureArray[0] = ed25519Sig;
	}
	if (dilithium) {
		const dilithiumSig = await dilithium65.sign(message, dilithium);
		// console.log('dilithiumSig', dilithiumSig.length);
		signatureArray[1] = dilithiumSig;
	}
	return encodeStrict(signatureArray);
}
export async function verifyEach(signatureArg, message, source) {
	const signature = (isBuffer(signatureArg)) ? await decode(signatureArg) : signatureArg;
	if (!isArray(signature)) {
		return false;
	}
	const verificationArray = [];
	const {
		ed25519,
		dilithium,
		sphincs
	} = source;
	// console.log('verifyEach', source);
	const ed25519Sig = signature[0];
	if (ed25519 && ed25519Sig) {
		const verified = await ed25519Utils.verifySignature(ed25519Sig, message, ed25519);
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
async function verifyPartial(signature, message, source) {
	const verificationArray = await verifyEach(signature, message, source);
	// console.log('verifyPartial', verificationArray);
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
	description: 'ed25519 dilithium65 SPHINCS192s SHAKE256',
	id: 6,
	publicKeySize,
	privateKeySize,
	signatureSize,
	seedSize,
	isKeypairInitialized,
	createKeypair,
	verifyMethod,
	signMethod,
	signPartial,
	initializeKeypair,
	verifyEach,
	verifyPartial,
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
// console.log('signature', sig.length, await decode(sig));
// console.log(await viat.verify(sig, msg, key));
// const imported = await viat.initializeKeypair(exported);
// console.log('imported', imported);
// console.log(await viat.verify(sig, msg, imported));
// const sig2 = await viat.sign(msg, imported);
// console.log('sig2', sig2.length, await decode(sig2));
// console.log(await viat.verifyPartial(sig, msg, imported));
