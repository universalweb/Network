console.clear();
console.log('STARTING CLIENT');
console.time('FULL');
import { currentPath } from '#directory';
import { client } from '#udsp';
// Universal Web Socket
const uwClient = await client({
	service: `${currentPath(import.meta)}/../services/universal.web.cert`,
	profile: `${currentPath(import.meta)}/../profiles/default.cert`,
	ip: 'localhost',
	port: 8888
});
console.log('INTRO =>', uwClient);
console.time('Request');
const stateRequest = await uwClient.request({
	act: 'file',
	body: {
		path: 'index.js'
	}
});
console.timeEnd('Request');
console.timeEnd('Full');
console.log('Request state', stateRequest, stateRequest.response.body.data.toString('UTF8'));

