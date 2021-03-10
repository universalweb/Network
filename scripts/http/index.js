process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const http = require('https');
const hostname = '127.0.0.1';
const port = 8888;
const fs = require('fs');
const options = {
	key: fs.readFileSync('/home/main/MEGAsync/Github/Network/scripts/http/key.pem'),
	cert: fs.readFileSync('/home/main/MEGAsync/Github/Network/scripts/http/cert.pem')
};
const server = http.createServer(options, (req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end(`(async () => {
	console.log('TESTING');
	await app.view.set('pageTitle', 'DEMO SITE');
	const state = app.component({
		name: 'exampleApp',
		template: '<h1>HELLO WORLD</h1><p>The first UW Website using UDSP</p>'
	});
	console.log(state);
	await app.view.set('components.main.exampleApp', true);
})();
`);
});
server.listen(port, hostname, () => {
	console.log(`Server running at https://${hostname}:${port}/`);
});
(async () => {
	const fetch = require('node-fetch');
	console.time('http');
	const response = await fetch('https://127.0.0.1:8888');
	const body = await response.text();
	console.timeEnd('http');
	console.log(body);
})();
