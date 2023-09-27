process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
import https from 'https';
const serverIp = '::1';
const hostname = `[${serverIp}]`;
const port = 8888;
import fs from 'fs';
import { currentPath } from '@universalweb/acid';
const dirname = currentPath(import.meta);
const options = {
	key: fs.readFileSync(`${currentPath(import.meta)}/key.pem`),
	cert: fs.readFileSync(`${currentPath(import.meta)}/cert.pem`)
};
const server = https.createServer(options, (req, res) => {
	res.writeHead(200, {
		contentType: 'html'
	});
	const indexFile = fs.readFileSync(`${currentPath(import.meta)}/../../serverApp/resources/index.html`);
	res.end(indexFile);
});
server.listen(port, serverIp, () => {
	console.log(`Server running at ${serverIp}:${port}`);
});
import fetchIt from 'node-fetch';
console.time('http');
const response = await fetchIt('https://[::1]:8888/');
const body = await response.text();
console.timeEnd('http');
console.log(body);
