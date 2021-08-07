const uWS = require('uWebSockets.js');
const port = 9001;
const app = uWS./* SSL*/App({
	key_file_name: 'misc/key.pem',
	cert_file_name: 'misc/cert.pem',
	passphrase: '1234'
}).get('/headerModificationExample', (res, req) => {
	res.writeHeader('IsExample', 'Yes').end('Hello World!');
}).get('/fileUploadExample', (res, req) => {
	 res.onData((chunk, isLast) => {
    /* Buffer this anywhere you want to */
    console.log('Got chunk of data with length ' + chunk.byteLength + ', isLast: ' + isLast);

    /* We respond when we are done */
    if (isLast) {
      res.end('Thanks for the data!');
    }
  });
})
	.listen(port, (token) => {
		if (token) {
			console.log(`Listening to port ${port}`);
		} else {
			console.log(`Failed to listen to port ${port}`);
		}
	});
