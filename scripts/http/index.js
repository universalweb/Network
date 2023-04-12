process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
import http from 'https';
const hostname = '127.0.0.1';
const port = 8888;
import fs from 'fs';
const options = {
	key: fs.readFileSync(`${__dirname}/key.pem`),
	cert: fs.readFileSync(`${__dirname}/cert.pem`)
};
const server = http.createServer(options, (req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end(`TESTING`);
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
