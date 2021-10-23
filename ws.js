const uWS = require('./uWebSockets.js').App;
const port = 9001;
class WebSocketApp {
	constructor(websocketOptions = {}, appOptions = {}) {
		let app;
		if (appOptions.key_file_name) {
			app = uWS.SSLApp(appOptions);
		} else {
			app = uWS.App(appOptions);
		}
		websocketOptions.compression = websocketOptions.compression || uWS.SHARED_COMPRESSOR;
		websocketOptions.maxPayloadLength = websocketOptions.maxPayloadLength || 16 * 1024 * 1024;
		websocketOptions.compression = websocketOptions.compression || 10;
		app.ws('/*', websocketOptions);
		return app;
	}
}
const app = uWS({}).get('/headerModificationExample', (res, req) => {
	modifyHeader('IsExample', 'Yes').end('Hello world');
})
	.get('/fileUploadExample', (res, req) => {
		asyncFileReadandWrite(res, __dirname);
	})
	.listen(port, (token) => {
		if (token) {
			console.log(`Listening to port ${port}`);
		} else {
			console.log(`Failed to listen to port ${port}`);
		}
	});
