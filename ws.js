const uWS = require('uWebSockets.js');
const port = 9001;
const {
	utility: {
		asyncFileReadandWrite,
		modifyHeader
	}
} = state;
const app = uWS./* SSL*/App({
	key_file_name: 'misc/key.pem',
	cert_file_name: 'misc/cert.pem',
	passphrase: '1234'
}).get('/headerModificationExample', (res, req) => {
	modifyHeader('IsExample', 'Yes').end('Hello world')
}).get('/fileUploadExample', (res, req) => {
	asyncFileReadandWrite(res, __dirname)
})
	.listen(port, (token) => {
		if (token) {
			console.log(`Listening to port ${port}`);
		} else {
			console.log(`Failed to listen to port ${port}`);
		}
	});
