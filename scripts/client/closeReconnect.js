console.clear();
console.log('STARTING CLIENT');
console.time('Full');
import { client } from '#udsp';
import { currentPath } from '@universalweb/utilitylib';
console.time('Connected');
// Universal Web Client Socket
const uwClient = await client({
	destinationCertificate: `${currentPath(import.meta)}/../../udsp/dis/cache/universalWebPublic.cert`,
});
const connection = await uwClient.connect();
console.log(uwClient);
await uwClient.close();
console.log(uwClient);
console.timeEnd('Connected');
console.log('INTRO =>', uwClient);
// GET Request
const fileRequest = await uwClient.request('get', 'index.html');
// console.log(fileRequest);
console.time('FileRequest');
// Send Request
const response = await fileRequest.send();
// Close Connection
console.timeEnd('FileRequest');
console.timeEnd('Full');
console.log('headers', response.headers);
console.log('data', response.text());
