import KyberKeyExchange from './kyber.js';
// Define the ML-KEM-768 algorithm
export const algorithm = 'ml-kem-768';
// console.log('Supported Algorithms', algoList);
export const kyber768 = new KyberKeyExchange({
	name: 'kyber768',
	algorithm,
	alias: 'kyber768',
	id: 1,
	preferred: true,
});
export default kyber768;
