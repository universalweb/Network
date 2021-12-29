// npm install uNetworking/uWebSockets.js#v16.2.0
const uWS = require('./uWebSockets.js.js');
// uWebSockets.js is binary by default
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
// an "app" is much like Express.js apps with URL routes,
// here we handle WebSocket traffic on the wildcard "/*" route
const app = uWS.App().ws('/*', {
	// handle messages from client
	message: (socket, message, isBinary) => {
		// parse JSON and perform the action
		if (isBinary) {
			console.log('isBinary');
		}
		const json = JSON.parse(decoder.write(Buffer.from(message)));
		switch (json.action) {
		    case 'join': {
			    // subscribe to messages in said drawing room
			    socket.subscribe(json.room);
			    break;
		    }
		    case 'draw': {
		        // draw something in drawing room
			    app.publish(json.room, json.message);
			    break;
		    }
		    case 'leave': {
			    // unsubscribe from the said drawing room
			    socket.unsubscribe(json.room);
			    break;
		    }
		    default: {
			    console.log('NONE MATCHING WEBSOCKET');
		    }
		}
	}
});
// finally listen using the app on port 3000
app.listen(3000, (listenSocket) => {
	if (listenSocket) {
		console.log('Listening to port 3000');
	}
});
