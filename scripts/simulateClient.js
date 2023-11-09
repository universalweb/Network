console.clear();
const logFunction = console.log;
// console.log = () => {};
console.log('STARTING CLIENT');
console.time('Full');
import { currentPath } from '@universalweb/acid';
import { client } from '#udsp';
console.time('Connected');
// Universal Web Socket
const uwClient = await client({
	destinationCertificate: `${currentPath(import.meta)}/../services/universal.web-EphemeralPublic.cert`,
	// Load Profile Certificate from Keychain
	// keychain: 'Universal Web Profile',
	// Load Profile Certificate from file
	profile: `${currentPath(import.meta)}/../profiles/default-Ephemeral.cert`
});
// const connection = await uwClient.connect();
//  await client('universalweb.io', {keychain: 'Universal Web Profile'});
console.timeEnd('Connected');
// console.log('INTRO =>', uwClient);
// short hand get request
const fileRequest = await uwClient.request('get', 'index.html');
// console.log(fileRequest);
console.time('FileRequest');
const response = await fileRequest.send();
// console.log = logFunction;
console.timeEnd('FileRequest');
console.timeEnd('Full');
// console.log('fileRequest', fileRequest);
// console.log(response);
console.log('headers', response.headers);
console.log('data', response.text());
// const fileFetch = await uwClient.fetch('index.html');
// Missing file example
// const fileFetch = await uwClient.fetch('missing.file');
// const fileFetch = await uwClient.fetch('images/test.gif');
// console.log(fileRequest.head);
// console.log(fileFetch.data.toString('base64'));
// console.log('data', fileRequest.toString());
// console.log(fileFetch);

