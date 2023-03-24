import { decode, encode } from 'msgpackr';
import { stringify } from 'Acid';
import { read } from 'utilities/file.js';
import { info } from 'utilities/console.js';
import {
	keypair,
	toBase64
} from 'utilities/crypto.js';
const keys = keypair();
const cert = {
	publicKey: keys.publicKey,
	secretKey: keys.secretKey,
	id: '1',
	parent: '0',
	version: 1,
	host: 'identity.registrar',
	addrs: '192.168.1.1',
	port: 80,
	pad: 900,
	issuer: 'Sentivate',
	issuerID: '0',
	algo: 'default',
	end: Date.now() + 99999999990,
	master: '0'
};
const certBase64 = {
	publicKey: toBase64(cert.publicKey),
	secretKey: toBase64(cert.secretKey),
	id: '1',
	parent: '0',
	version: 1,
	host: 'identity.registrar',
	ip: '192.168.1.1',
	port: 80,
	pad: 900,
	issuer: 'Sentivate',
	issuerID: '0',
	algo: 'default',
	end: Date.now() + 99999999990,
	master: '0'
};
console.log('Binary Public Key', cert.publicKey.toString().length);
console.log('Base64 Public Key', toBase64(cert.publicKey).length);
console.log('Binary Private Key', cert.secretKey.toString().length);
console.log('Base64 Private Key', toBase64(cert.secretKey).length);
console.log('Key Saved', `${((certBase64.publicKey.length / cert.publicKey.length) - 1) * 100}% Key Size Saved`);
const encoded = encode(cert);
const decoded = decode(encoded);
console.log('MSGPack Cert Encoded', encoded);
console.log('MSGPack Cert Decoded', decoded);
console.log('MessagePack CERT', encoded.length);
console.log('JSON CERT', stringify(certBase64).length);
console.log('Cert Saved', `${((stringify(certBase64).length / encoded.length) - 1) * 100}% Size Saved`);
