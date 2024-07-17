import * as dilithium from '../utilities/cryptoMiddleware/dilithium.js';
import * as ed25519 from '../utilities/cryptoMiddleware/ed25519.js';
import { decode, encode } from '#utilities/serialize';
import { UWProfile } from '../UWProfile/index.js';
import { blake3Hash } from '../utilities/cryptoMiddleware/blake3.js';
import { currentCertificateVersion } from '../defaults.js';
import { isBuffer } from '@universalweb/acid';
import { write } from '../utilities/file.js';
export class ViatWallet extends UWProfile {
	constructor(config = {}) {
		super(false);
		return this.walletInitialize(config);
	}
	async walletInitialize(config) {
		await this.initialize(config);
		return this;
	}
}
export function viatWallet(config) {
	const source = new ViatWallet();
	return source;
}
const viatWalletExample = await viatWallet();
console.log(await viatWalletExample);
console.log(`Version: ${viatWalletExample.version}`);
console.log(`Public Key Size: ${viatWalletExample.publicKey.length}`);
console.log(`Private Key Size: ${viatWalletExample.privateKey.length}`);
console.log(viatWalletExample.ed25519PublicKey);
console.log(viatWalletExample.ed25519PrivateKey);
const messageExample = Buffer.from('Hello, World!');
const sig = await viatWalletExample.sign(messageExample);
console.log(sig);
console.log(await viatWalletExample.verifySignature(sig, messageExample));
