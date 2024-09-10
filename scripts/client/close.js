console.clear();
console.log('STARTING CLIENT');
console.time('Full');
import { client } from '#udsp';
import { currentPath } from '@universalweb/acid';
console.time('Benchmark');
// Universal Web Client Socket
const uwClient = await client({
	destinationCertificate: `${currentPath(import.meta)}/../../udsp/dis/cache/universalWebPublic.cert`,
	profile: `${currentPath(import.meta)}/../../profiles/profile.cert`,
	profilePassword: 'password',
});
const connection = await uwClient.connect();
await uwClient.close();
console.timeEnd('Benchmark');
