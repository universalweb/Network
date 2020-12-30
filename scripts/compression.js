(async () => {
	const state = {
		type: 'Domain Certificate Creation',
		utility: require('Lucy'),
		msgPack: require('msgpackr'),
		compression: require('iltorb')
	};
	await require('../utilities/console/')(state);
	await require('../utilities/file/')(state);
	const {
		compression: {
			compress
		},
		file: {
			read
		},
		decode,
		encode,
		utility: {
			stringify
		}
	} = state;
	const file = await read(`${__dirname}/../root/root.cert`);
	const certObj = decode(file);
	console.log(certObj);
	const input = encode(certObj);
	certObj.ephemeral.signature = certObj.ephemeral.signature.toString('base64');
	certObj.ephemeral.key = certObj.ephemeral.key.toString('base64');
	certObj.ephemeral.private = certObj.ephemeral.private.toString('base64');
	certObj.master.private = certObj.master.private.toString('base64');
	certObj.master.key = certObj.master.key.toString('base64');
	console.log('Brotli compression');
	console.log('MsgPack', input.length);
	console.log('After with Compression', (await compress(input)).length);
	const oldCertificate = Buffer.from(stringify(certObj));
	console.log('Base64 JSON', oldCertificate.length);
	console.log('Base64 JSON With Compression', (await compress(oldCertificate)).length);
})();
