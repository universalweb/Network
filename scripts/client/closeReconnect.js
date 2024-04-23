console.clear();
console.log('STARTING CLIENT');
console.time('Full');
import { client } from '#udsp';
import { currentPath } from '@universalweb/acid';
console.time('Connected');
// Universal Web Client Socket
const uwClient = await client({
	destinationCertificate: `${currentPath(import.meta)}/../../serverApp/certs/universalWebPublic.cert`,
	// Load Profile Certificate from Keychain
	keychain: 'Universal Web Profile',
	// Load Profile Certificate from file
	profile: `${currentPath(import.meta)}/../../profiles/default/profile.cert`
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
