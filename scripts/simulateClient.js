console.clear();
console.log('STARTING CLIENT');
console.time('Full');
import { currentPath } from '@universalweb/acid';
import { client } from '#udsp';
import { decode } from 'msgpackr';
console.time('Connected');
// Universal Web Socket
const uwClient = await client({
	destinationCertificate: `${currentPath(import.meta)}/../services/universal.web-EphemeralPublic.cert`,
	// Load Profile Certificate from Keychain
	// keychain: 'Universal Web Profile',
	// Load Profile Certificate from file
	certificate: `${currentPath(import.meta)}/../profiles/default-Ephemeral.cert`,
});
// const connection = await uwClient.connect();
//  await client('universalweb.io', {keychain: 'Universal Web Profile'});
console.timeEnd('Connected');
// console.log('INTRO =>', uwClient);
console.time('FileRequest');
// short hand get request
const fileRequest = await uwClient.request('get', 'index.html');
console.log(fileRequest);
const response = await fileRequest.send();
// console.log('head', response.head);
console.log('data', response.toString());
// const fileFetch = await uwClient.fetch('index.html');
// Missing file example
// const fileFetch = await uwClient.fetch('missing.file');
// const fileFetch = await uwClient.fetch('images/test.gif');
// console.log(fileRequest.head);
// console.log(fileFetch.data.toString('base64'));
// console.log('data', fileRequest.toString());
// console.log(fileFetch);
console.timeEnd('FileRequest');
console.timeEnd('Full');
// console.log('Request state', fileRequest);

