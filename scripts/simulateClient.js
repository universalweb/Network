console.clear();
console.log('STARTING CLIENT');
console.time('Full script runtime');
import { currentPath } from '#directory';
import { client } from '#udsp';
import { decode } from 'msgpackr';
console.time('Connected');
// Universal Web Socket
const uwClient = await client({
	service: `${currentPath(import.meta)}/../services/universal.web.cert`,
	profile: `${currentPath(import.meta)}/../profiles/default.cert`,
	ip: '::1',
	port: 8888
});
console.timeEnd('Connected');
console.log('INTRO =>', uwClient);
console.time('File Request');
const fileRequest = await uwClient.request('file', {
	path: 'index.html'
});
console.timeEnd('File Request');
console.timeEnd('Full script runtime');
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

