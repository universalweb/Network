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
const fileRequest = await uwClient.request('file', {
	path: 'index.html'
});
console.timeEnd('FileRequest');
console.timeEnd('Full');
console.log('Request state', fileRequest);
console.log(fileRequest.message.body.toString());
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

