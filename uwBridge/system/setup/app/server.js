const uWS = require('./uWebSockets/uws.js');
const decoder = new TextDecoder('utf-8');
const {
	v4: uuid
} = require('uuid');
const MESSAGE_ENUM = Object.freeze({
	SELF_CONNECTED: 'SELF_CONNECTED',
	CLIENT_CONNECTED: 'CLIENT_CONNECTED',
	CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
	CLIENT_MESSAGE: 'CLIENT_MESSAGE',
	PING: 'PING'
});
module.exports = function() {
	const app = uWS.SSLApp({
		key_file_name: '/etc/letsencrypt/live/your-domain/privkey.pem',
		cert_file_name: '/etc/letsencrypt/live/your-domain/cert.pem'
	})
		.ws('/ws', {
			compression: 0,
			maxPayloadLength: 16 * 1024 * 1024,
			idleTimeout: 60,
			open: (ws, req) => {
				ws.id = uuid();
				ws.username = createName(getRandomInt());
				// subscribe to topics
				ws.subscribe(MESSAGE_ENUM.CLIENT_CONNECTED);
				ws.subscribe(MESSAGE_ENUM.CLIENT_DISCONNECTED);
				ws.subscribe(MESSAGE_ENUM.CLIENT_MESSAGE);
				sockets.push(ws);
				// SELF_CONNECTED sent to self only ONCE upon ws open
				const selfMsg = {
					type: MESSAGE_ENUM.SELF_CONNECTED,
					body: {
						id: ws.id,
						name: ws.username
					}
				};
				const pubMsg = {
					type: MESSAGE_ENUM.CLIENT_CONNECTED,
					body: {
						id: ws.id,
						name: ws.username
					}
				};
				// send to connecting socket only
				ws.send(JSON.stringify(selfMsg));
				// send to *all* subscribed sockets
				app.publish(MESSAGE_ENUM.CLIENT_CONNECTED, pubMsg);
			},
			message: (ws, message, isBinary) => {
				// decode message from client
				const clientMsg = JSON.parse(decoder.decode(message));
				let serverMsg = {};
				switch (clientMsg.type) {
				case MESSAGE_ENUM.CLIENT_MESSAGE:
					serverMsg = {
						type: MESSAGE_ENUM.CLIENT_MESSAGE,
						sender: ws.username,
						body: clientMsg.body
					};
					app.publish(MESSAGE_ENUM.CLIENT_MESSAGE, JSON.stringify(serverMsg));
					break;
				default:
					console.log('Unknown message type.');
				}
			},
			close: (ws, code, message) => {
				/* The library guarantees proper unsubscription at close */
				SOCKETS.find((socket, index) => {
					if (socket && socket.id === ws.id) {
						SOCKETS.splice(index, 1);
					}
				});
				const pubMsg = {
					type: MESSAGE_ENUM.CLIENT_DISCONNECTED,
					body: {
						id: ws.id,
						name: ws.name
					}
				};
				app.publish(MESSAGE_ENUM.CLIENT_DISCONNECTED, JSON.stringify(pubMsg));
			}
		})
		.listen(port, (token) => {
			token ?
				console.log(`Listening to port ${port}`) :
				console.log(`Failed to listen to port ${port}`);
		});
	function getRandomInt() {
		return Math.floor(Math.random() * Math.floor(9999));
	}
	function createName(randomInt) {
		return sockets.find((ws) => {
			return ws.name === `user-${randomInt}`;
		}) ?
			createName(getRandomInt()) :
			`user-${randomInt}`;
	}
};
