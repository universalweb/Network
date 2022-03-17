const {
	uid,
	promise,
	construct,
	isPlainObject,
	isString,
	stringify,
	jsonParse,
	hasValue
} = self.$;
export class ClientSocket {
	constructor(app) {
		this.app = app;
		console.log('Worker Socket Module', 'notify');
		this.hostDomain = `${(app.config.socketHostname || location.hostname)}`;
		if (app.config.port) {
			this.hostDomain = `${this.hostDomain}:${app.config.port}`;
		}
		console.log(this.hostDomain);
		this.connect();
		clearInterval();
	}
	callbacks = {};
	status = 0;
	ready() {
		console.log('Socket Is Ready');
		if (this.status) {
			this.app.update({
				type: 'connection',
				status: 'reconnected'
			});
		} else {
			this.app.post('ready', {
				type: 'connection',
				status: 'connected'
			});
			this.status = 1;
			console.log('connected');
		}
	}
	process(response) {
		const compiledResponse = jsonParse(response);
		console.log(compiledResponse);
		if (!compiledResponse.id) {
			return this.app.update(compiledResponse);
		}
		const callback = this.callbacks[compiledResponse.id];
		if (callback) {
			return callback(compiledResponse);
		}
	}
	reconnect() {
		const thisContext = this;
		if (!hasValue(thisContext.connectInterval)) {
			this.socket.close();
			thisContext.connectInterval = setInterval(() => {
				thisContext.connect();
			}, 2000);
		}
	}
	connect() {
		const thisContext = this;
		thisContext.socket = construct(WebSocket, [thisContext.hostDomain]);
		thisContext.socket.addEventListener('open', () => {
			if (hasValue(thisContext.connectInterval)) {
			  clearInterval(thisContext.connectInterval);
			}
			this.ready();
		});
		// Listen for messages
		thisContext.socket.addEventListener('message', (socketEvent) => {
			console.log('Message from server ', socketEvent.data);
			thisContext.process(socketEvent.data);
		});
		thisContext.socket.addEventListener('disconnect', () => {
			console.log('disconnected');
			if (!hasValue(thisContext.connectInterval)) {
				thisContext.app.update({
					type: 'connection',
					status: 'disconnected'
				});
			}
			thisContext.reconnect();
		});
		thisContext.socket.addEventListener('close', () => {
			console.log('close');
			if (!hasValue(thisContext.connectInterval)) {
				thisContext.app.update({
					type: 'connection',
					status: 'closed'
				});
			}
			thisContext.reconnect();
		});
	}
	send(data) {
		if (isPlainObject(data)) {
			this.socket.send(stringify(data));
		} else if (isString(data)) {
			this.socket.send(data);
		} else {
			this.socket.send(data);
		}
	}
	async request(configObj) {
		const results = await promise((accept) => {
			const {
				data,
				callback,
			} = configObj;
			if (data.id) {
				data.id = null;
			} else {
				const uuid = uid().toString();
				data.id = uuid;
				this.callbacks[uuid] = async (requestData) => {
					if (callback) {
						const returned = await callback(requestData);
						if (returned) {
							this.callbacks[uuid] = null;
							uid.free(uuid);
							accept(returned);
						}
					} else {
						accept(requestData.data);
					}
				};
			}
			this.send(data);
		});
		return results;
	}
}
