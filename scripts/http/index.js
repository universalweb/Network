process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
import http from 'https';
const hostname = '127.0.0.1';
const port = 8888;
import fs from 'fs';
import { currentPath } from '@universalweb/acid';
const dirname = currentPath(import.meta);
const options = {
	key: fs.readFileSync(`${currentPath(import.meta)}/key.pem`),
	cert: fs.readFileSync(`${currentPath(import.meta)}/cert.pem`)
};
const indexFile = fs.readFileSync(`${currentPath(import.meta)}/../../serverApp/resources/index.html`);
const server = http.createServer(options, (req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end(indexFile);
});
server.listen(port, hostname, () => {
	console.log(`Server running at https://${hostname}:${port}/`);
});
import fetchIt from 'node-fetch';
console.time('http');
const response = await fetchIt('https://127.0.0.1:8888');
const body = await response.text();
console.timeEnd('http');
console.log(body);
