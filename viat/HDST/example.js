import { HDSeed } from './index.js';
import { SCHEME_TYPES } from './defaults.js';
import { hash } from './utils.js';
async function manual(walletExample) {
	const key = await walletExample.getKey({
		scheme: SCHEME_TYPES.ML_DSA_65,
		id: 'namespace',
	});
	const nonce = await walletExample.getNonce({
		scheme: SCHEME_TYPES.ML_DSA_65,
		id: 'namespace',
	});
	// const checkpoint = await walletExample.getPreSeed({
	// 	scheme: SCHEME_TYPES.ML_DSA_65,
	// 	id: 0,˜
	// }, key);
	// console.log('CHECKPOINT SEED CHECKPOI˜NT', checkpoint);
	const seed = await walletExample.getSeed({
		scheme: SCHEME_TYPES.ML_DSA_65,
		id: 0,
	}, key, nonce);
}
async function example() {
	const exampleRootSeed = await hash(Buffer.from('seed'), 256);
	const exampleRootKey = await hash(Buffer.from('key'), 256);
	const exampleRootNonce = await hash(Buffer.from('nonce'), 256);
	const walletExample = new HDSeed({});
	await walletExample.create();
	const exported = await walletExample.exportObject();
	console.log('EXPORTED WALLET', exported);
	const walletExample2 = new HDSeed(exported);
	console.log('master_seeds', walletExample.get('master_seed'), walletExample2.get('master_seed'));
	console.log('Compare wallets are equal', Buffer.compare(Buffer.from(walletExample.get('master_seed')), Buffer.from(walletExample2.get('master_seed'))) === 0);
	// await walletExample.logInfo();
	// await manual(walletExample);
	// TODO: Create master seed creation function with single config object
	const seed = await walletExample.getSeed({
		scheme: SCHEME_TYPES.ML_DSA_65,
		id: 0,
	});
	console.log('SEED FINAL SIZE', seed);
}
await example();
