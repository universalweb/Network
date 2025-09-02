// dilithiumAPI+ed25519+shake256
import {
	assign,
	everyArray,
	isArray,
	isBuffer,
	returnValue,
	untilFalseArray,
} from '@universalweb/utilitylib';
import { decode, encode, encodeStrict } from '#utilities/serialize';
import { hash256, hash512 } from '../hash/shake256.js';
import {
	randomBuffer,
	toBase64,
	toHex,
} from '#utilities/cryptography/utils';
import dilithiumAPI from './dilithium87.js';
import ed25519Utils from './ed25519.js';
import signatureScheme from './signatureScheme.js';
// SEED SIZE COMBINED
const seedSize = ed25519Utils.seedSize + dilithiumAPI.seedSize;
console.log(seedSize);
// KEY SIZES
const publicKeySize = dilithiumAPI.publicKeySize + ed25519Utils.publicKeySize;
const privateKeySize = dilithiumAPI.privateKeySize + ed25519Utils.privateKeySize;
const signatureSize = dilithiumAPI.signatureSize + ed25519Utils.signatureSize;
// KEY END INDEXES
const ed25519PublicKeyEndIndex = ed25519Utils.publicKeySize;
const ed25519PrivateKeyEndIndex = ed25519Utils.privateKeySize;
const dilithiumPublicKeyEndIndex = ed25519Utils.publicKeySize + dilithiumAPI.publicKeySize;
const dilithiumPrivateKeyEndIndex = ed25519Utils.privateKeySize + dilithiumAPI.privateKeySize;
// SIGNATURE END INDEXES
const ed25519SignatureEndIndex = ed25519Utils.signatureSize;
const dilithiumSignatureEndIndex = ed25519Utils.signatureSize + dilithiumAPI.signatureSize;
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
	return dilithiumAPI.initializeKeypair(assembleKeypairObject(source, 1));
}
export async function createKeypair() {
	const dilithium = await dilithiumAPI.signatureKeypair();
	const ed25519 = await ed25519Utils.signatureKeypair();
	const ed25519Keypair = await ed25519Utils.exportKeypair(ed25519);
	const dilithiumKeypair = await dilithiumAPI.exportKeypair(dilithium);
	// console.log('createKeypair', ed25519Keypair, dilithiumKeypair);
	const publicKey = [ed25519Keypair.publicKey, dilithiumKeypair.publicKey];
	const privateKey = [ed25519Keypair.privateKey, dilithiumKeypair.privateKey];
	return {
		publicKey,
		privateKey,
		ed25519,
		dilithium,
	};
}
export async function initializeKeypair(sourceArg) {
	const source = (isBuffer(sourceArg)) ? await decode(sourceArg) : sourceArg;
	const target = assign({}, source);
	const ed25519 = await getEd25519Keypair(target);
	const dilithium = await getDilithiumKeypair(target);
	target.ed25519 = ed25519;
	target.dilithium = dilithium;
	return target;
}
async function isKeypairInitialized(source) {
	if (source.ed25519 && source.dilithium) {
		return true;
	}
	return false;
}
export async function signMethod(message, source) {
	const signatureArray = [];
	const {
		ed25519,
		dilithium,
	} = source;
	// console.log('signMethod', source);
	if (ed25519) {
		const ed25519Sig = await ed25519Utils.sign(message, ed25519);
		// console.log('ed25519Keypair', ed25519Sig.length);
		signatureArray[0] = ed25519Sig;
	}
	if (dilithium) {
		const dilithiumSig = await dilithiumAPI.sign(message, dilithium);
		// console.log('dilithiumSig', dilithiumSig.length);
		signatureArray[1] = dilithiumSig;
	}
	return encodeStrict(signatureArray);
}
export async function signPartial(message, source) {
	const signatureArray = [];
	const {
		ed25519,
		dilithium,
	} = source;
	// console.log('signMethod', source);
	if (ed25519) {
		const ed25519Sig = await ed25519Utils.sign(message, ed25519);
		// console.log('ed25519Keypair', ed25519Sig.length);
		signatureArray[0] = ed25519Sig;
	}
	if (dilithium) {
		const dilithiumSig = await dilithiumAPI.sign(message, dilithium);
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
		sphincs,
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
		// console.log('dilithiumSig', dilithiumSig?.length, dilithiumAPI?.signatureSize);
		const verified = await dilithiumAPI.verifySignature(dilithiumSig, message, dilithium);
		verificationArray[1] = verified;
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
	return ed25519Verify && dilithiumVerify;
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
		privateKey: source.privateKey,
	};
	return target;
}
export const ed25519Dilithium87 = signatureScheme({
	name: 'ed25519Dilithium87',
	alias: 'ed25519Dilithium87',
	description: 'ed25519 dilithium87 SHAKE256',
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
	exportKeypair,
});
export default ed25519Dilithium87;
// const key = await ed25519Dilithium87.signatureKeypair();
// console.log(key);
// const exported = await ed25519Dilithium87.exportKeypair(key);
// console.log('exported', exported);
// const bexport = await ed25519Dilithium87.exportBinary(exported);
// console.log('Binary Export', bexport, bexport.length);
// const bimport = await ed25519Dilithium87.initializeBinary(bexport);
// console.log('Binary Import', bimport);
// const msg = Buffer.from('hello world');
// console.log(exported.publicKey.length, exported.privateKey.length);
// const sig = await ed25519Dilithium87.sign(msg, key);
// console.log('signature', sig.length, await decode(sig));
// console.log(await ed25519Dilithium87.verify(sig, msg, key));
// const imported = await ed25519Dilithium87.initializeKeypair(exported);
// console.log('imported', imported);
// console.log(await ed25519Dilithium87.verify(sig, msg, imported));
// const sig2 = await ed25519Dilithium87.sign(msg, imported);
// console.log('sig2', sig2.length, await decode(sig2));
// console.log(await ed25519Dilithium87.verifyPartial(sig, msg, imported));
