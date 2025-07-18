import { decode, encode, encodeStrict } from '#utilities/serialize';
import { isBuffer, promise } from '@universalweb/acid';
import keychain from 'keychain';
import { toBase64 } from '#utilities/cryptography/utils';
export const keychainService = 'UniversalWeb';
export async function keychainGetPromise(account, accept, reject) {
	console.log('Keychain Account', account);
	await keychain.getPassword({
		account,
		service: keychainService,
	}, async (err, data) => {
		if (err) {
			return console.log(`Keychain couldn't locate record`, err);
		}
		console.log(`Keychain found ${account}`);
		const dataBuffer = Buffer.from(data, 'base64');
		const dataDecoded = await decode(dataBuffer);
		accept(dataDecoded);
	});
}
export function keychainGet(account) {
	return promise((accept, reject) => {
		keychainGetPromise(account, accept, reject);
	});
}
export async function keychainCallback(config, accept, reject) {
	if (!isBuffer(config.password)) {
		config.password = await encodeStrict(config.password);
	}
	const password = toBase64(config.password);
	await keychain.setPassword({
		account: config.account,
		service: keychainService,
		type: 'generic',
		password,
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
		keychainCallback(config, accept, reject);
	});
}
