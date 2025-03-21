console.clear();
console.log('STARTING CLIENT');
console.time('Full');
import { client } from '#udsp';
import { currentPath } from '@universalweb/acid';
console.time('Connected');
// Universal Web Client Socket
const uwClient = await client({
	destinationCertificate: `${currentPath(import.meta)}/../../udsp/dis/cache/universalWebPublic.cert`,
	logLevel: 3,
});
const connection = await uwClient.connect();
console.timeEnd('Connected');
console.log('INTRO =>', uwClient);
console.timeEnd('Full');
