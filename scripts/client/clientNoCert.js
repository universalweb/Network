console.clear();
const logFunction = console.log;
// console.log = () => {};
console.log('STARTING CLIENT');
console.time('Full');
import { client } from '#udsp';
import { currentPath } from '@universalweb/acid';
const uwClient = await client({
	url: '127.0.0.1:8888',
});
const fileRequest = await uwClient.request('get', 'index.html');
const response = await fileRequest.send();
console.log('headers', response.headers);
console.log('data', response.text());
