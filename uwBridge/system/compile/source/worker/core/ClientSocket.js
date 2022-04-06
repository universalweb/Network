const {
	uid,
	promise,
	construct,
	isPlainObject,
	isString,
	stringify,
	jsonParse,
	hasValue,
	apply
} = self.$;
export class ClientSocket {
	constructor(app, configData) {
		this.app = app;
		console.log('Worker Socket Module', 'notify');
		this.hostDomain = `${(app.config.socketHostname || location.hostname)}`;
		if (app.config.port) {
			this.hostDomain = `${this.hostDomain}:${app.config.port}`;
		}
		if (app.config.uuid) {
			this.hostDomain = `${this.hostDomain}?uuid=${app.config.uuid}`;
		}
		console.log(this.hostDomain);
		return this.connect(configData);
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
		console.log(compiledResponse.id, this.callbacks[compiledResponse.id]);
		const callback = this.callbacks[compiledResponse.id];
		if (callback) {
			return callback(compiledResponse);
		}
	}
	reconnect() {
		console.log('RECONNECT CALLED');
		const thisContext = this;
		if (!hasValue(thisContext.connectInterval)) {
			thisContext.socket.onopen = null;
			thisContext.socket.onmessage = null;
			thisContext.socket.onclose = null;
			thisContext.socket.onerror = null;
			thisContext.socket.close();
			thisContext.connectInterval = setInterval(() => {
				console.log('RECONNECT INTERVAL CALLED');
				return thisContext.connect();
			}, 2000);
			console.log('RECONNECT INTERVAL STARTED');
		}
	}
	connect() {
		const thisContext = this;
		return promise((accept) => {
			thisContext.socket = construct(WebSocket, [thisContext.hostDomain]);
			thisContext.socket.onopen = () => {
				if (hasValue(thisContext.connectInterval)) {
					console.log('Reconnect Cleared', thisContext.connectInterval);
					clearInterval(thisContext.connectInterval);
					thisContext.connectInterval = null;
				}
				thisContext.socket.onmessage = (socketEvent) => {
					console.log('Message from server ', socketEvent.data);
					apply(thisContext.process, thisContext, [socketEvent.data]);
				};
				thisContext.socket.onclose = () => {
					console.log('close', thisContext.connectInterval, !hasValue(thisContext.connectInterval));
					if (!hasValue(thisContext.connectInterval)) {
						thisContext.app.update({
							type: 'connection',
							status: 'closed'
						});
						thisContext.reconnect();
					}
				};
				thisContext.ready();
				accept(thisContext);
			};
			thisContext.socket.onerror = () => {
				console.log('error', thisContext.connectInterval, !hasValue(thisContext.connectInterval));
				if (!hasValue(thisContext.connectInterval)) {
					thisContext.app.update({
						type: 'connection',
						status: 'error'
					});
					thisContext.reconnect();
				}
			};
		});
	}
	send(data) {
		if (this.socket.readyState === 1) {
			if (isPlainObject(data)) {
				this.socket.send(stringify(data));
			} else if (isString(data)) {
				this.socket.send(data);
			} else {
				this.socket.send(data);
			}
		} else {
			console.log(this, this.socket);
			this.reconnect();
		}
	}
	taskCleanup(id) {
		this.callbacks[id] = null;
		uid.free(id);
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
					console.log(callback);
					if (callback) {
						const returned = await callback(requestData);
						if (returned) {
							this.taskCleanup(uuid);
							accept(returned);
						}
					} else {
						this.taskCleanup(uuid);
						accept(requestData);
					}
				};
			}
			this.send(data);
		});
		return results;
	}
}
