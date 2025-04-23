// Cryptographic Identity
// Used for creating a Nexus profile/ID
// Used to generate a cryptographic identity number & cryptographic Identity Card
import {
	assign,
	currentPath,
	hasDot,
	isBuffer,
	isPlainObject,
	isString
} from '@universalweb/acid';
import { decode, encode, encodeStrict } from '#utilities/serialize';
import { keychainGet, keychainSave } from '#components/certificate/keychain';
import {
	logError,
	logInfo,
	logSuccess,
	logVerbose,
	logWarning
} from '#utilities/logs/classLogMethods';
import { read, readStructured, write } from '#utilities/file';
import { cryptoIDVersion } from '#components/cryptoID/defaults';
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
	cipherSuiteId = this.cipherSuite.id;
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
		if (isBuffer(this.signatureKeypair)) {
			this.signatureKeypair = await this.cipherSuite.signature.initializeKeypair(this.signatureKeypair);
		}
		if (isBuffer(this.keyExchangeKeypair)) {
			this.keyExchangeKeypair = await this.cipherSuite.keyExchange.initializeKeypair(this.keyExchangeKeypair);
		}
	}
	async importKeypairs(config) {
		const {
			version,
			signatureKeypair,
			keyExchangeKeypair,
			cipherSuiteId
		} = config;
		if (signatureKeypair) {
			this.signatureKeypair = signatureKeypair;
		}
		if (keyExchangeKeypair) {
			this.keyExchangeKeypair = keyExchangeKeypair;
		}
		if (version) {
			this.version = version;
		}
		if (cipherSuiteId) {
			this.cipherSuiteId = cipherSuiteId;
		}
		await this.initializeKeypairs();
	}
	async generate(options) {
		this.signatureKeypair = await this.cipherSuite.signature.signatureKeypair();
		this.keyExchangeKeypair = await this.cipherSuite.keyExchange.keyExchangeKeypair();
		console.log('KEY EXCHANGE', this.keyExchangeKeypair);
	}
	async importFromBinary(data, encryptionKey) {
		const password = (isString(encryptionKey)) ? await this.cipherSuite.hash.hash256(Buffer.from(encryptionKey)) : encryptionKey;
		const decodedData = (password) ? await this.decryptBinary(data, password) : decode(data);
		await this.importFromObject(decodedData, password);
		return this;
	}
	async importFromObject(decodedData, encryptionKey) {
		const password = (isString(encryptionKey)) ? await this.cipherSuite.hash.hash256(Buffer.from(encryptionKey)) : encryptionKey;
		const data = (password) ? await this.decryptBinary(decodedData.encrypted, password) : decodedData;
		const {
			version,
			keyExchangeKeypair,
			signatureKeypair,
			cipherSuiteId
		} = data;
		this.version = version;
		this.keyExchangeKeypair = keyExchangeKeypair;
		this.signatureKeypair = signatureKeypair;
		this.cipherSuiteId = cipherSuiteId;
		await this.initializeKeypairs();
		return this;
	}
	async decryptBinary(encryptedObject, encryptionPassword) {
		const decrypted = await this.cipherSuite.encryption.decrypt(encryptedObject, encryptionPassword);
		return decode(decrypted);
	}
	async exportKeypairs() {
		const keyExchangeKeypair = await this.cipherSuite.keyExchange.exportKeypair(this.keyExchangeKeypair);
		const signatureKeypair = await this.cipherSuite.signature.exportKeypair(this.signatureKeypair);
		return {
			keyExchangeKeypair,
			signatureKeypair
		};
	}
	async exportBinary(encryptionKey) {
		const {
			version,
			cipherSuiteId
		} = this;
		const data = {
			version,
			cipherSuiteId
		};
		assign(data, await this.exportKeypairs());
		const dataEncoded = encodeStrict(data);
		if (encryptionKey) {
			const password = (isString(encryptionKey)) ? await this.cipherSuite.hash.hash256(Buffer.from(encryptionKey)) : encryptionKey;
			const encryptedData = await this.cipherSuite.encryption.encrypt(dataEncoded, password);
			const encryptedObject = {
				encrypted: encryptedData,
			};
			return encodeStrict(encryptedObject);
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
		const publicKeyCombined = Buffer.concat(this.signatureKeypair.publicKey);
		const address = this.cipherSuite.hash.hash512(publicKeyCombined);
		this.address = address;
		return address;
	}
	setAlias(value) {
		this.alias = value;
	}
	logError = logError;
	logWarning = logWarning;
	logInfo = logInfo;
	logVerbose = logVerbose;
	logSuccess = logSuccess;
}
export async function cryptoID(config, optionalArg) {
	const source = new CryptoID(config, optionalArg);
	return source;
}
export default cryptoID;
// const dirname = currentPath(import.meta);
const exampleCryptoIDExample = await cryptoID();
// const encryptionPasswordExample = 'password';
console.log(exampleCryptoIDExample);
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
