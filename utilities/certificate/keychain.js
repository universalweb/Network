import { decode, encode } from '#utilities/serialize';
import { isBuffer, promise } from '@universalweb/acid';
import keychain from 'keychain';
import { toBase64 } from '#crypto';
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
	if (!isBuffer(config.profile)) {
		config.profile = encode(config.profile);
	}
	const password = toBase64(config.profile);
	keychain.setPassword({
		account: config.account,
		service: 'Universal Web',
		type: 'generic',
		password
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
