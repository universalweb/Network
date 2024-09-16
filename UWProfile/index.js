import {
	currentPath,
	hasDot,
	isBuffer,
	isString
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import { keychainGet, keychainSave } from '../utilities/certificate/keychain.js';
import { read, readStructured, write } from '../utilities/file.js';
import { blake3 } from '@noble/hashes/blake3';
import { currentCertificateVersion } from '../defaults.js';
import { dilithium44 } from '../utilities/cryptoMiddleware/dilithium44.js';
import { ed25519 } from '../utilities/cryptoMiddleware/ed25519.js';
import { x25519_kyber768Half_xchacha20 } from '../utilities/cryptoMiddleware/x25519_Kyber768Half_xChaCha.js';
const defaultEncryptionAlgorithm = 1;
const defaultSignatureAlgorithm = 1;
const dirname = currentPath(import.meta);
export class UWProfile {
	constructor(config = {}, optionalArg) {
		if (config === false) {
			return this;
		}
		return this.initialize(config, optionalArg);
	}
	async initialize(config, optionalArg) {
		if (isString(config)) {
			if (config.includes('/') || config.includes('\\') || hasDot(config)) {
				await this.importFile(config, optionalArg);
			} else {
				await this.importFromKeychain(config, optionalArg);
			}
		} else if (isBuffer(config)) {
			await this.importFromBinary(config, optionalArg);
		} else if (config?.publicKey || config?.privateKey) {
			const {
				version,
				publicKey,
				privateKey
			} = config;
			if (publicKey) {
				this.publicKey = publicKey;
			}
			if (privateKey) {
				this.privateKey = privateKey;
			}
			if (version) {
				this.version = version;
			}
		} else {
			await this.generate(config);
		}
		return this;
	}
	async generateSignatureKeypair() {
		this.version = currentCertificateVersion;
		const ed25519NewKeypair = await ed25519.signatureKeypair();
		const dilithiumNewKeypair =	await dilithium44.signatureKeypair();
		console.log(ed25519NewKeypair.publicKey, ed25519NewKeypair.privateKey);
		this.publicKey = Buffer.concat([ed25519NewKeypair.publicKey, dilithiumNewKeypair.publicKey]);
		this.privateKey = Buffer.concat([ed25519NewKeypair.privateKey, dilithiumNewKeypair.privateKey]);
	}
	async generateEncryptionKeypair() {
		const encryptionkeypair = await x25519_kyber768Half_xchacha20.keypair();
		this.encryptionkeypair = encryptionkeypair;
	}
	async generate(config) {
		await this.generateSignatureKeypair();
		await this.generateEncryptionKeypair();
	}
	get ed25519PublicKey() {
		return this.publicKey.slice(0, 32);
	}
	get ed25519PrivateKey() {
		return this.privateKey.slice(0, 64);
	}
	get dilithiumPublicKey() {
		return this.publicKey.slice(32);
	}
	get dilithiumPrivateKey() {
		return this.privateKey.slice(64);
	}
	async sign(message) {
		const ed25519Signature = await ed25519.signDetached(message, this.ed25519PrivateKey);
		console.log(ed25519Signature.length);
		const dilithiumSignature = await dilithium44.sign(message, this.dilithiumPrivateKey);
		console.log(dilithiumSignature.length);
		const signature = Buffer.concat([ed25519Signature, dilithiumSignature]);
		return signature;
	}
	async verifySignature(signature, message) {
		const ed25519Signature = signature.slice(0, 64);
		const dilithiumSignature = signature.slice(64);
		const ed25519Verify = ed25519.verifySignatureDetached(ed25519Signature, this.ed25519PublicKey, message);
		const dilithiumVerify = await dilithium44.verifySignature(dilithiumSignature, this.dilithiumPublicKey, message);
		console.log(ed25519Verify, dilithiumVerify);
		return (ed25519Verify === dilithiumVerify) ? ed25519Verify : false;
	}
	async hash(message) {
		const hashedMessage = blake3(message);
		return hashedMessage;
	}
	async importFromBinary(data, encryptionKey) {
		const password = (isString(encryptionKey)) ? await this.hash(Buffer.from(encryptionKey)) : encryptionKey;
		const decodedData = (password) ? await this.decryptBinary(data, password) : decode(data);
		await this.importFromObject(decodedData);
		return this;
	}
	async importFromObject(decodedData, encryptionKey) {
		const password = (isString(encryptionKey)) ? await this.hash(Buffer.from(encryptionKey)) : encryptionKey;
		const data = (password) ?	await this.decryptBinary(decodedData.encrypted, password) : decodedData;
		this.version = data.version;
		this.publicKey = data.publicKey;
		this.privateKey = data.privateKey;
		this.encryptionKeypair = data.encryptionKeypair;
		return this;
	}
	async decryptBinary(encryptedObject, encryptionPassword) {
		const decrypted = await x25519_kyber768Half_xchacha20.decrypt(encryptedObject, encryptionPassword);
		return decode(decrypted);
	}
	async exportBinary(encryptionKey) {
		const data = {
			version: this.version,
			publicKey: this.publicKey,
			privateKey: this.privateKey,
			encryptionKeypair: this.encryptionkeypair
		};
		const dataEncoded = encode(data);
		if (encryptionKey) {
			const password = (isString(encryptionKey)) ? await this.hash(Buffer.from(encryptionKey)) : encryptionKey;
			console.log(password);
			const encryptedData = await x25519_kyber768Half_xchacha20.encrypt(dataEncoded, password);
			const encryptedObject = {
				encrypted: encryptedData,
			};
			return encode(encryptedObject);
		}
		return dataEncoded;
	}
	async saveToFile(fileName, fileLocation, encryptionPassword) {
		const binaryData = await this.exportBinary(encryptionPassword);
		const fullPath = `${fileLocation}/${fileName}`;
		return write(fullPath, binaryData, 'binary', true);
	}
	async importFile(filePath, encryptionPassword) {
		const data = await readStructured(filePath);
		if (data) {
			return this.importFromObject(data, encryptionPassword);
		}
		console.log('Error Importing Profile', filePath);
		return false;
	}
	async saveToKeychain(accountName = 'UWProfile', encryptionPassword) {
		const binaryData = await this.exportBinary(encryptionPassword);
		const config = {
			account: this.accountName || accountName,
			password: binaryData,
		};
		console.log('Profile Size', binaryData.length);
		return keychainSave(config);
	}
	async importFromKeychain(accountName = 'UWProfile', encryptionPassword) {
		const keychainObject = await keychainGet(this.accountName || accountName);
		await this.importFromObject(keychainObject, encryptionPassword);
	}
}
export async function uwProfile(config, optionalArg) {
	const source = new UWProfile(config, optionalArg);
	return source;
}
// const exampleProfileExample = await uwProfile();
// const encryptionPasswordExample = 'password';
// console.log(await exampleProfileExample);
// console.log(`Version: ${exampleProfileExample.version}`);
// console.log(`Public Key Size: ${exampleProfileExample.publicKey.length}`);
// console.log(`Private Key Size: ${exampleProfileExample.privateKey.length}`);
// console.log(exampleProfileExample.ed25519PublicKey);
// console.log(exampleProfileExample.ed25519PrivateKey);
// const messageExample = Buffer.from('Hello, World!');
// const sig = await exampleProfileExample.sign(messageExample);
// console.log(sig);
// console.log(await exampleProfileExample.verifySignature(sig, messageExample));
// await exampleProfileExample.saveToKeychain('exampleUWProfile', encryptionPasswordExample);
// await exampleProfileExample.saveToFile('profile.cert', `${dirname}/../profiles`, encryptionPasswordExample);
// console.log(await uwProfile('exampleUWProfile', encryptionPasswordExample));
// console.log(await uwProfile(`${dirname}/../profiles/profile.cert`, encryptionPasswordExample));
