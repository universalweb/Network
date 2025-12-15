(import { cSHAKE } from './cshake.js';
(async function() {
	try {
		const data = Buffer.from('abc');
		const digest256 = await cSHAKE(data, 256);
		console.log('cSHAKE256-256 (hex):', Buffer.from(digest256).toString('hex'));
	} catch (err) {
		console.error('Error running cSHAKE tests', err);
	}
})();
