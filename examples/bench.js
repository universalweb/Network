console.clear();
const logFunction = console.log;
console.log = () => {};
console.log('STARTING CLIENT');
import { client } from '#udsp';
import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
// Universal Web Socket
const uwClient = await client({
	destinationCertificate: `${currentPath(import.meta)}/../services/universal.web-EphemeralPublic.cert`,
	// Load Profile Certificate from Keychain
	// keychain: 'Universal Web Profile',
	// Load Profile Certificate from file
	profile: `${currentPath(import.meta)}/profiles/default-Ephemeral.cert`
});
const timenow = Date.now();
for (let i = 0; i < 5; i++) {
	const response = await uwClient.get('index.html');
	logFunction(response.text());
}
logFunction(Date.now() - timenow);
