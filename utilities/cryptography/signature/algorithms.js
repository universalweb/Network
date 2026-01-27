import { ed25519Dilithium65 } from './ed25519_dilithium65.js';
import { ed25519Dilithium87 } from './ed25519_dilithium87.js';
import { falcon1024 } from './falcon1024.js';
import { sphincs192 } from './sphincs192.js';
import { viat } from './viat.js';
const supportedAlgorithms = {
	ed25519: 0,
	dilithium44: 1,
	dilithium65: 2,
	dilithium87: 3,
	[ed25519Dilithium65.name]: ed25519Dilithium65.id,
	[ed25519Dilithium87.name]: ed25519Dilithium87.id,
	[sphincs192.name]: sphincs192.id,
	[viat.name]: viat.id,
	[falcon1024.name]: falcon1024.id,
};
const supportedAlgorithmsList = [
	'ed25519',
	'dilithium44',
	'dilithium65',
	'dilithium87',
	ed25519Dilithium65.name,
	ed25519Dilithium87.name,
	sphincs192.name,
	viat.name,
	falcon1024.name,
];
