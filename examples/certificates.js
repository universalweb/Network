import { PublicDomainCertificate, domainCertificate, publicDomainCertificate } from '#components/certificate/index';
import { cryptoID } from '#components/cryptoID/index';
import { currentPath } from '@universalweb/utilitylib';
import { decode } from '#utilities/serialize';
const dirname = currentPath(import.meta);
const uwProfile = await cryptoID();
// await uwProfile.saveToFile('profile.cert', `${dirname}/profiles`, 'password');
// await uwProfile.saveToKeychain('profile.cert', `${dirname}/profiles`, 'password');
const domainCert = await domainCertificate();
await domainCert.generate({
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
await domainCert.save(`${dirname}/../examples/serverApp/certs`, 'universalWeb.cert');
await domainCert.savePublic(`${dirname}/../examples/serverApp/certs`, 'universalWebPublic.cert');
await domainCert.savePublic('universalWebPublic.cert', `${dirname}/../components/dis/cache`);
const cert = await publicDomainCertificate(`${dirname}/../examples/serverApp/certs/universalWebPublic.cert`);
// await cert.loadCryptography();
// console.log(await cert.getCiphers(), cert.getCipher(0));
// console.log(cert.object.keyExchangeKeypair.publicKey.length);
