globalThis.Bun = {};
(async function() {
	try {
		const {
			cSHAKE256, cSHAKE128,
		} = await import('./cshake.js');
		const data = Buffer.from('abc');
		const digest256 = await cSHAKE256(data, 256);
		console.log('addon cSHAKE256-256 (hex):', Buffer.from(digest256).toString('hex'));
		const digest128 = await cSHAKE128(data, 128);
		console.log('addon cSHAKE128-128 (hex):', Buffer.from(digest128).toString('hex'));
	} catch (err) {
		console.error('Error running addon cSHAKE tests', err);
	}
})();
