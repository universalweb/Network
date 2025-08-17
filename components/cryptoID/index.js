// Cryptographic Identity
// Used for creating a Nexus profile/ID
// Used to generate a cryptographic identity number & cryptographic Identity Card
import {
	assign,
	currentPath,
	extendClass,
	hasDot,
	hasValue,
	isArray,
	isBuffer,
	isPlainObject,
	isString,
} from '@universalweb/utilitylib';
import { decode, encode, encodeStrict } from '#utilities/serialize';
import { getHomeDirectory, getWalletsDirectory } from '#utilities/directory';
import { keychainGet, keychainSave } from '#components/certificate/keychain';
import { read, readStructured, write } from '#utilities/file';
import { cryptoIDVersion } from '#components/cryptoID/defaults';
import logMethods from '#utilities/logs/classLogMethods';
import path from 'node:path';
import { toBase64Url } from '#crypto/utils.js';
import viat from '#crypto/cipherSuite/viat.js';
export class CryptoID {
	constructor(config, optionalArg) {
		if (config === false) {
			return this;
		}
		return this.initialize(config, optionalArg);
	}
	cipherSuite = viat;
	version = cryptoIDVersion;
	async initialize(config, optionalArg) {
		if (isString(config)) {
			if (config.includes('/') || config.includes('\\') || hasDot(config)) {
				await this.importFile(config, optionalArg);
			} else {
				await this.importFromKeychain(config, optionalArg);
			}
		} else if (isBuffer(config)) {
			await this.importFromBinary(config, optionalArg);
		} else if (isPlainObject(config)) {
			await this.importFromObject(config, optionalArg);
		} else {
			await this.generate(optionalArg);
		}
		return this;
	}
	async initializeKeypairs() {
		if (await this.cipherSuite.signature.isKeypairInitialized(this.signatureKeypair) === false) {
			this.signatureKeypair = await this.cipherSuite.signature.initializeKeypair(this.signatureKeypair);
		}
		if (await this.cipherSuite.keyExchange.isKeypairInitialized(this.keyExchangeKeypair) === false) {
			this.keyExchangeKeypair = await this.cipherSuite.keyExchange.initializeKeypair(this.keyExchangeKeypair);
		}
		this.generateAddress();
	}
	async importKeypairs(core) {
		const {
			signatureKeypair,
			keyExchangeKeypair,
		} = core;
		if (signatureKeypair) {
			this.signatureKeypair = signatureKeypair;
		}
		if (keyExchangeKeypair) {
			this.keyExchangeKeypair = keyExchangeKeypair;
		}
		await this.initializeKeypairs();
		return this;
	}
	async generate(options) {
		this.signatureKeypair = await this.cipherSuite.signature.signatureKeypair();
		this.keyExchangeKeypair = await this.cipherSuite.keyExchange.keyExchangeKeypair();
		this.generateAddress();
		// console.log('KEY EXCHANGE', this.keyExchangeKeypair);
	}
	async importFromBinary(data, encryptionKey) {
		const password = (isString(encryptionKey)) ? await this.cipherSuite.hash.hash256(Buffer.from(encryptionKey)) : encryptionKey;
		const encodedData = decode(data);
		const decodedCore = (password) ? await this.decryptBinary(encodedData.core, password) : encodedData.core;
		encodedData.core = decodedCore;
		await this.importFromObject(encodedData, password);
		return this;
	}
	async importFromObject(decodedData, encryptionKey) {
		const password = (isString(encryptionKey)) ? await this.cipherSuite.hash.hash256(Buffer.from(encryptionKey)) : encryptionKey;
		const data = (password) ? await this.decryptBinary(decodedData.encrypted, password) : decodedData;
		const {
			version,
			cipherID,
			core: {
				keyExchangeKeypair,
				signatureKeypair,
			},
			networkName,
		} = data;
		if (version) {
			this.version = version;
		}
		this.keyExchangeKeypair = keyExchangeKeypair;
		this.signatureKeypair = signatureKeypair;
		if (hasValue(cipherID)) {
			this.cipherID = cipherID;
		}
		if (hasValue(networkName)) {
			this.networkName = networkName;
		}
		await this.initializeKeypairs();
		return this;
	}
	async decryptBinary(encryptedObject, encryptionPassword) {
		const decrypted = await this.cipherSuite.encryption.decrypt(encryptedObject, encryptionPassword);
		return decode(decrypted);
	}
	async exportSignatureKeypair() {
		// console.log('keyExchangeKeypair', this.keyExchangeKeypair);
		const signatureKeypair = await this.cipherSuite.signature.exportKeypair(this.signatureKeypair);
		return signatureKeypair;
	}
	async exportExchangeKeypair() {
		// console.log('keyExchangeKeypair', this.keyExchangeKeypair);
		const keyExchangeKeypair = await this.cipherSuite.keyExchange.exportKeypair(this.keyExchangeKeypair);
		return keyExchangeKeypair;
	}
	async exportKeypairs() {
		// console.log('keyExchangeKeypair', this.keyExchangeKeypair);
		const keyExchangeKeypair = await this.exportExchangeKeypair();
		const signatureKeypair = await this.exportSignatureKeypair();
		return {
			keyExchangeKeypair,
			signatureKeypair,
		};
	}
	async exportPublicKeys() {
		// console.log('keyExchangeKeypair', this.keyExchangeKeypair);
		const { publicKey: signaturePublicKey } = await this.exportSignatureKeypair();
		const { publicKey: keyExchangePublicKey } = await this.exportExchangeKeypair();
		return {
			signaturePublicKey,
			keyExchangePublicKey,
		};
	}
	async exportPublicKey() {
		// console.log('keyExchangeKeypair', this.keyExchangeKeypair);
		const signatureKeypair = await this.exportSignatureKeypair();
		return signatureKeypair.publicKey;
	}
	async exportPrivateKey() {
		// console.log('keyExchangeKeypair', this.keyExchangeKeypair);
		const signatureKeypair = await this.exportSignatureKeypair();
		return signatureKeypair.privateKey;
	}
	async exportObject() {
		const {
			version,
			address,
		} = this;
		const data = {
			version,
			date: Date.now(),
			cipherID: this.cipherSuite.id,
			address,
			core: {},
		};
		assign(data.core, await this.exportKeypairs());
		return data;
	}
	async exportPublicObject() {
		const {
			version,
			address,
		} = this;
		const data = {
			version,
			date: Date.now(),
			cipherID: this.cipherSuite.id,
			address,
			core: {},
		};
		assign(data.core, await this.exportPublicKey());
		return data;
	}
	async exportBinary(encryptionKey) {
		const data = await this.exportObject();
		const dataEncoded = await encodeStrict(data);
		if (encryptionKey) {
			const password = (isString(encryptionKey)) ? await this.cipherSuite.hash.hash256(Buffer.from(encryptionKey)) : encryptionKey;
			const encryptedData = await this.cipherSuite.encryption.encrypt(dataEncoded, password);
			return encryptedData;
		}
		return dataEncoded;
	}
	async saveToFile(fileName, fileLocation, encryptionPassword) {
		const binaryData = await this.exportBinary(encryptionPassword);
		const fullPath = path.join(fileLocation, fileName);
		// console.log('FILE WRITE', fullPath, binaryData, encryptionPassword);
		return write(fullPath, binaryData, 'binary', true);
	}
	async save(fileLocationArg, fileNameArg, encryptionPassword, encoding) {
		const fileLocation = (fileLocationArg) ? fileLocationArg : await getWalletsDirectory();
		const fileName = (fileNameArg) ? fileNameArg : await this.getAddressString(encoding);
		return this.saveToFile(fileName, fileLocation, encryptionPassword);
	}
	async importFile(filePath, encryptionPassword) {
		const data = await readStructured(filePath);
		if (data) {
			const loadedFile = await this.importFromObject(data, encryptionPassword);
		}
		return false;
	}
	async saveToKeychain(accountName = 'profile', encryptionPassword) {
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
	async importFromKeychain(accountName = 'profile', encryptionPassword) {
		try {
			const keychainObject = await keychainGet(this.accountName || accountName);
			await this.importFromObject(keychainObject, encryptionPassword);
		} catch (error) {
			console.log('No Keychain Access');
			return false;
		}
	}
	async verifySignature(signature, message) {
		return this.cipherSuite.signature.verify(signature, message, this.signatureKeypair);
	}
	async sign(message) {
		return this.cipherSuite.signature.sign(message, this.signatureKeypair);
	}
	async signBlock(block) {
		await block.sign(this);
	}
	async signPartial(message) {
		return this.cipherSuite.signature.signPartial(message, this.signatureKeypair);
	}
	async verifyPartialSignature(signature, message) {
		return this.cipherSuite.signature.verifyPartial(signature, message, this.signatureKeypair);
	}
	async signCertificate(certificate) {
		const [certificateData] = certificate;
		const signature = await this.sign(certificateData, this.signatureKeypair);
		return signature;
	}
	cryptoIDVersion = cryptoIDVersion;
	async generateAddress() {
		const publicKey = await this.exportPublicKey();
		const publicKeyCombined = (isBuffer(publicKey)) ? publicKey : await encodeStrict(publicKey);
		const address = await this.cipherSuite.hash.hash512(publicKeyCombined);
		this.address = address;
		return address;
	}
	async getAddress() {
		const address = this.address || await this.generateAddress();
		return address;
	}
	async getAddressString(encoding) {
		const address = await this.getAddress();
		return (encoding) ? address.toString(encoding) : toBase64Url(address);
	}
	setAlias(value) {
		this.alias = value;
	}
}
extendClass(CryptoID, logMethods);
export async function cryptoID(config, optionalArg) {
	const source = new CryptoID(config, optionalArg);
	return source;
}
export default cryptoID;
// const dirname = currentPath(import.meta);
// const exampleCryptoIDExample = await cryptoID();
// const encryptionPasswordExample = 'password';
// console.log(await exampleCryptoIDExample.exportBinary());
// console.log((await exampleCryptoIDExample.getAddress()).length);
// const exportedKeypairs = await exampleCryptoIDExample.exportKeypairs();
// console.log(exportedKeypairs);
// console.log(`Version: ${exampleProfileExample.version}`);
// const messageExample = Buffer.from('Hello, World!');
// const sig = await exampleProfileExample.sign(messageExample);
// console.log(sig);
// console.log(await exampleProfileExample.verifySignature(sig, messageExample));
// console.log(await exampleProfileExample.verifyPartialSignature(sig, messageExample));
// const sigPartial = await exampleProfileExample.signPartial(messageExample);
// console.log(sigPartial);
// console.log(await exampleProfileExample.verifyPartialSignature(sigPartial, messageExample));
// await exampleProfileExample.saveToKeychain('exampleprofile', encryptionPasswordExample);
// await exampleProfileExample.saveToFile('profile.cert', `${dirname}/../profiles`, encryptionPasswordExample);
// console.log(await cryptoID('exampleprofile', encryptionPasswordExample));
// console.log(await cryptoID(`${dirname}/../profiles/profile.cert`, 'password'));
