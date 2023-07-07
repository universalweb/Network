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
//  await client('universalweb.io', {keychain: 'Universal Web Profile'});
// await request('universalweb.io/index.html');
console.timeEnd('Connected');
// console.log('INTRO =>', uwClient);
console.time('FileRequest');
// short hand get request
const fileRequest = await uwClient.request('index.html');
// medium hand
// const fileRequest = await uwClient.request({
// 	path: 'index.html'
// });
fileRequest.on({
	data(...args) {
		console.log('custom onData event', ...args);
	},
	head(...args) {
		console.log('custom onHead event', ...args);
	}
});
const response = await fileRequest.send();
// const response = await uwClient.request('index.html').on({
// 	data(...args) {
// 		console.log('onData for simulate client', ...args);
// 	}
// }).send();
console.log('head', response.head);
console.log('data', response.data);
console.timeEnd('FileRequest');
const fileFetch = await uwClient.fetch('index.html');
console.log(fileFetch.toString());
console.timeEnd('Full');
// console.log('Request state', fileRequest);

