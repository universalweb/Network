import { cryptoID } from '#components/cryptoID/index';
import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
import { domainCertificate } from '#components/certificate/index';
const dirname = currentPath(import.meta);
const uwProfile = await cryptoID();
await uwProfile.saveToFile('profile.cert', `${dirname}/profiles`, 'password');
await uwProfile.saveToKeychain('profile.cert', `${dirname}/profiles`, 'password');
const domainCert = await domainCertificate({
	entity: 'universalweb.io',
	// ownerHash: profile.getSignature(),
	signatureAlgorithm: 0,
	ciphers: [
		0,
		// 1,
	],
	keyExchangeAlgorithm: 0,
	protocolOptions: {
		realtime: true,
	},
	records: [
		[
			'aaaa',
			'@',
			'::1',
			8888,
			// PRIORITY
			0,
			// GEOLOCATION FEATURE FOR GEO PRIORITIZATION
			// '27.950575 -82.457176'
		],
		[
			'a',
			'@',
			'127.0.0.1',
			8888,
			// PRIORITY
			0,
			// GEOLOCATION FEATURE FOR GEO PRIORITIZATION
			// '27.950575 -82.457176'
		],
	],
});
console.log(domainCert);
// await domainCert.save('universalWeb.cert', `${dirname}/../serverApp/certs`);
// await domainCert.savePublic('universalWebPublic.cert', `${dirname}/../serverApp/certs`);
// // TODO: DECIDE DEFAULT FOLDER
// await domainCert.savePublic('universalWebPublic.cert', `${dirname}/../udsp/dis/cache`);
// const cert = await domainCertificate(`${dirname}/../serverApp/certs/universalWebPublic.cert`);
// console.log(cert);
// console.log(cert.object.keyExchangeKeypair.publicKey.length);
