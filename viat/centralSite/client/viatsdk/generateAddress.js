import VIAT_DEFAULTS from '#viat/defaults';
import { isBuffer } from '@universalweb/utilitylib';
import { shake256 } from '@noble/hashes/sha3.js';
const hashConfig = {
	dkLen: VIAT_DEFAULTS.WALLETS.LEGACY.WALLET_SIZE,
};
// TODO: Switch from buffers to native Uint8Arrays and ArrayBuffers for better performance and compatibility with Web APIs
export async function generateLegacyAddress(publicKey, trapdoor) {
	const publicKeyBuffer = (isBuffer(publicKey)) ? publicKey : Buffer.from(publicKey);
	const trapdoorBuffer = (isBuffer(trapdoor)) ? trapdoor : Buffer.from(trapdoor);
	const concat = Buffer.concat([publicKeyBuffer, trapdoorBuffer]);
	return shake256(concat, hashConfig);
}
function example() {
	const publicKey = Buffer.from('publicKeyExample');
	const trapdoor = Buffer.from('trapdoorExample');
	generateLegacyAddress(publicKey, trapdoor).then((address) => {
		console.log('Generated Legacy Address SIZE:', address.length);
	});
}
// example();
