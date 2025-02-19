import {
	currentPath,
	hasDot,
	isBuffer,
	isString
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import {
	getDilithiumPrivateKey,
	getDilithiumPublicKey,
	getDilithiumSignature,
	getEd25519PrivateKey,
	getEd25519PublicKey,
	getEd5519Signature
} from '../cryptoMiddleware/signature/dilithium_ed25519.js';
import { keychainGet, keychainSave } from '../udsp/certificate/keychain.js';
import { read, readStructured, write } from '../utilities/file.js';
import {
	sign,
	signatureKeypair,
	verifySignature
} from '../cryptoMiddleware/signature/dilithium65_ed25519.js';
import { currentCertificateVersion } from '../defaults.js';
import { shake256 } from '@noble/hashes/sha3';
import { x25519_kyber768_xchacha20 } from '../cryptoMiddleware/cipherSuite/x25519_Kyber768_xChaCha.js';
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
			this.importKeys(config);
		} else {
			await this.generate(config);
		}
		return this;
	}
	importKeys(config) {
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
	}
	async generateSignatureKeypair() {
		this.version = currentCertificateVersion;
		await signatureKeypair(this);
		console.log(this.publicKey, this.privateKey);
		return this;
	}
	async generateEncryptionKeypair() {
		const encryptionkeypair = await x25519_kyber768_xchacha20.keypair();
		this.encryptionkeypair = encryptionkeypair;
	}
	async generate(config) {
		await this.generateSignatureKeypair();
		await this.generateEncryptionKeypair();
	}
	get ed25519PublicKey() {
		return getEd25519PublicKey(this.publicKey);
	}
	get ed25519PrivateKey() {
		return getEd25519PrivateKey(this.privateKey);
	}
	get dilithiumPublicKey() {
		return getDilithiumPublicKey(this.publicKey);
	}
	get dilithiumPrivateKey() {
		return getDilithiumPrivateKey(this.privateKey);
	}
	async sign(message) {
		const signature = await sign(message, this.privateKey);
		return signature;
	}
	async verifySignature(signature, message) {
		return verifySignature(signature, message, this.publicKey);
	}
	async hash(message) {
		const hashedMessage = shake256(message);
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
		const decrypted = await x25519_kyber768_xchacha20.decrypt(encryptedObject, encryptionPassword);
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
			const encryptedData = await x25519_kyber768_xchacha20.encrypt(dataEncoded, password);
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
		try {
			return keychainSave(config);
		} catch (error) {
			console.log('No Keychain Access');
			return false;
		}
	}
	async importFromKeychain(accountName = 'UWProfile', encryptionPassword) {
		try {
			const keychainObject = await keychainGet(this.accountName || accountName);
			await this.importFromObject(keychainObject, encryptionPassword);
		} catch (error) {
			console.log('No Keychain Access');
			return false;
		}
	}
}
export async function uwProfile(config, optionalArg) {
	const source = new UWProfile(config, optionalArg);
	return source;
}
const exampleProfileExample = await uwProfile();
// const encryptionPasswordExample = 'password';
// console.log(exampleProfileExample);
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
// console.log(await uwProfile(`${dirname}/../profiles/profile.cert`, 'password'));
