console.clear();
console.log('STARTING CLIENT');
import { client } from '#udsp';
import { currentPath } from '@universalweb/utilitylib';
console.time('Full');
// Universal Web Client Socket
const uwClient = await client({
	destinationCertificate: `${currentPath(import.meta)}/../serverApp/certs/universalWebPublic.cert`,
	logLevel: 4,
});
function connected(context, evnt) {
	context.logSuccess('CONNECTION => CONNECTED', evnt);
}
uwClient.on('connected', connected);
function closedEvent(context, evnt) {
	context.logError('CONNECTION => CLOSED', evnt);
}
uwClient.on('closed', closedEvent);
console.time('Connected');
const connection = await uwClient.connect();
console.timeEnd('Connected');
console.timeEnd('Full');
