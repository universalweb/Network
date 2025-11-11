import KyberKeyExchange from './kyberKeyExchange.js';
// Define the ML-KEM-768 algorithm
const algorithm = 'ml-kem-768';
// console.log('Supported Algorithms', algoList);
const kyber768 = new KyberKeyExchange({
	name: 'kyber768',
	algorithm,
	alias: 'kyber768',
	id: 1,
	preferred: true,
});
