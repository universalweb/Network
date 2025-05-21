import { isBuffer, isString } from '@universalweb/acid';
import { toBase64Url } from '#crypto/utils.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export function getUTF8Size(source) {
	if (isString(source)) {
		return Buffer.byteLength(source, 'utf8');
	}
}
export function getBase64URLSafeUTF8SizeFromBuffer(source) {
	if (isBuffer(source)) {
		return Buffer.byteLength(toBase64Url(source), 'utf8');
	}
}
const walletAddressBufferex = viatCipherSuite.createBlockNonce(64);
console.log('getBase64URLSafeUTF8SizeFromBuffer', getBase64URLSafeUTF8SizeFromBuffer(walletAddressBufferex));
