console.clear();
console.log('STARTING CLIENT');
console.time('Full script runtime');
import '../serverApp/index.js';
import { createClient, getCertificate } from '../udsp/client/index.js';
const service = await getCertificate(`${__dirname}/../services/universal.web.cert`);
const profile = await getCertificate(`${__dirname}/../profiles/default.cert`);
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
console.timeEnd('Full script runtime');
console.log('Request state', stateRequest, stateRequest.response.body.data.toString('UTF8'));

