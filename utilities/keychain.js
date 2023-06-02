import { decode, encode } from 'msgpackr';
import { toBase64 } from '#crypto';
import keychain from 'keychain';
import { promise, isBuffer } from 'Acid';
export function keychainGetPromise(account, accept, reject) {
	console.log(account);
	keychain.getPassword({
		account,
		service: 'Universal Web'
	}, (err, data) => {
		if (err) {
			return console.log(`Keychain couldn't locate record`, err);
		}
		console.log(`Keychain found ${account}`);
		const dataBuffer = Buffer.from(data, 'base64');
		const dataDecoded = decode(dataBuffer);
		accept(dataDecoded);
	});
}
export function keychainGet(account) {
	return promise((accept, reject) => {
		keychainGetPromise(account, accept, reject);
	});
}
export function keychainPromise(config, accept, reject) {
	if (!isBuffer(config.certificate)) {
		config.certificate = encode(config.certificate);
	}
	config.certificate = toBase64(config.certificate);
	keychain.setPassword({
		account: config.account,
		service: 'Universal Web',
		type: 'generic',
		password: config.certificate
	}, (err) => {
		if (err) {
			return console.log('Keychain Access Save Failed', err);
		}
		console.log(`Certificate saved to Keychain as ${config.account}`);
		accept(true);
	});
}
export async function keychainSave(config) {
	return promise((accept, reject) => {
		keychainPromise(config, accept, reject);
	});
}
