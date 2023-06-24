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
console.timeEnd('Connected');
// console.log('INTRO =>', uwClient);
console.time('FileRequest');
const fileRequest = await uwClient.request({
	method: 'get',
	data: {
		path: 'index.html'
	}
});
// Get Method
fileRequest.on({
	data(...args) {
		console.log('onData for simulate client', ...args);
	}
});
const response = await fileRequest.fetch();
console.log(response.data);
console.timeEnd('FileRequest');
const fileFetch = await uwClient.fetch('index.html');
console.log(fileFetch.toString());
console.timeEnd('Full');
// console.log('Request state', fileRequest);
/** */
// await uwClient.request('event', {
// 	head: {
// 		name: 'like.post',
// 	},
// 	data: {}
// });
// await uwClient.request({
// 	head: {
// 		name: 'like.post',
// 	},
// 	data: {}
// });

