console.clear();
console.log('STARTING CLIENT');
console.time('FULL');
import { currentPath } from '#directory';
import { createClient, getCertificate } from '../client/index.js';
const service = await getCertificate(`${currentPath(import.meta)}/../services/universal.web.cert`);
const profile = await getCertificate(`${currentPath(import.meta)}/../profiles/default.cert`);
// Universal Web Socket
const uwClient = await createClient({
	service,
	profile,
	ip: 'localhost',
	port: 8888
});
console.time('CONNECTING');
const connectRequest = await uwClient.connect({
	agent: 'node',
	entity: 'bot',
	req: {
		n: 'state',
		d: {
			state: '/'
		}
	}
});
console.timeEnd('CONNECTING');
console.log('Connected', uwClient);
console.log('INTRO =>', connectRequest.response.body);
console.time('Request');
const stateRequest = await uwClient.request('state', {
	state: '/'
});
console.timeEnd('Request');
console.timeEnd('Full');
console.log('Request state', stateRequest, stateRequest.response.body.data.toString('UTF8'));

