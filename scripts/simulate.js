console.clear();
console.log('STARTING CLIENT');
console.time('FULL');
import { createClient, getCertificate } from '../client/index.js';
const service = await getCertificate(`${__dirname}/../services/universal.web.cert`);
const profile = await getCertificate(`${__dirname}/../profiles/default.cert`);
// Universal Web Socket
const uws = await createClient({
	service,
	profile,
	server: {
		ip: 'localhost',
		port: 8888
	}
});
console.time('CONNECTING');
await uws.connect({
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
console.log('Connected', uws);
console.log('INTRO =>', uws.response.body);
console.time('Request');
const stateRequest = await uws.request('state', {
	state: '/'
});
console.timeEnd('Request');
console.timeEnd('Full');
console.log('Request state', stateRequest, stateRequest.response.body.data.toString('UTF8'));

