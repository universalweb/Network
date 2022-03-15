const {
	construct,
	assign,
	stringify,
	isPlainObject,
	isString,
	jsonParse,
	hasDot,
	apply,
	isFunction,
	hasValue
} = require('Acid');
const {
	v4: uuid
} = require('uuid');
const hasProperty = Object.prototype.hasOwnProperty;
class ClientRequest {
	constructor(socket, requested) {
		this.socket = socket;
		this.body = requested.body;
		this.task = requested.task;
		this.response = {
			body: {},
		};
		if (requested.id) {
			this.response.id = requested.id;
			this.id = requested.id;
		}
	}
	send(data) {
		let responseData;
		if (data) {
			responseData = assign({}, this.response);
			data.body = data;
		} else {
			responseData = this.response;
		}
		this.socket.send(responseData);
	}
}
const zeroInt = 0;
class Client {
	status = 0;
	async onMessage(requested) {
		console.log(`user ${this.id} message`);
		let compiledRequest = requested;
		console.log(requested);
		if (isString(requested)) {
			try {
				compiledRequest = jsonParse(requested);
			} catch (errorMessage) {
				console.log('Failed to parse client request');
				return;
			}
		}
		const clientRequest = construct(ClientRequest, [this, compiledRequest]);
		console.log(clientRequest.body);
		const {
			app: {
				client
			}
		} = this;
		const {
			task
		} = clientRequest;
		if (hasDot(task)) {
			const rootProperty = task.substring(zeroInt, task.indexOf('.'));
			if (apply(hasProperty, client, [rootProperty])) {
				const security = client[rootProperty];
				if (isFunction(security)) {
					try {
						const securityCheckRoot = await security(clientRequest);
						if (securityCheckRoot === false) {
							console.log('Main Security Check failed');
							return;
						}
					} catch (err) {
						clientRequest.body.item = false;
						clientRequest.body.errorMessage = 'Security Check Failed';
						return console.log(err);
					}
				}
			}
		}
		if (apply(hasProperty, client, [task])) {
			const requestFunction = client[task];
			if (isFunction(requestFunction)) {
				const requestFunctionSecurity = requestFunction.security;
				if (isFunction(requestFunctionSecurity)) {
					try {
						const securityCheck = await requestFunctionSecurity(clientRequest);
						if (securityCheck === false) {
							console.log('Propertry Specific Security Check failed');
							return;
						}
					} catch (err) {
						return console.log(err);
					}
				}
				try {
					const results = await requestFunction(clientRequest);
					if (results && hasValue(clientRequest.id)) {
						clientRequest.send();
					}
				} catch (errorMessage) {
					console.log('Failed to complete client request');
					return;
				}
			} else {
				console.log(`Invalid property entered. Attack made. ${task}`, this.socket.id);
				return false;
			}
		}
	}
	onClose() {
		console.log(`use ${this.socket.context} is no longer listening for news events.`);
		this.socket.unsubscribe('all');
		this.app.clients.delete(this.id);
		return console.log(`${this.socket.ip} has now disconnected!`);
	}
	constructor(socket, app) {
		this.socket = socket;
		this.app = app;
		this.status = 1;
		this.id = uuid();
		socket.on('message', (message) => {
			this.onMessage(message);
		});
		socket.on('close', () => {
			this.onClose();
		});
		socket.subscribe('all');
		app.clients.set(this.id, this);
	}
	send(message, is_binary, compress) {
		const {
			socket
		} = this;
		let messageCompiled = message;
		if (isPlainObject(message)) {
			messageCompiled = stringify(message);
		}
		socket.atomic(() => {
			socket.send(messageCompiled, is_binary, compress);
		});
	}
	render() {
		this.app.clients.set(this.id, this);
	}
	detach() {
		this.app.clients.delete(this.id);
	}
	close(code, message) {
		const {
			socket
		} = this;
		socket.atomic(() => {
			socket.close(code, message);
		});
	}
	async destroy(data) {
		const {
			socket
		} = this;
		console.log('Websocket KILL START', socket.id);
		this.socket.destroy();
		if (this.client?.socketEvent?.kill) {
			await this.client.socketEvent.kill(data, socket);
		}
	}
}
module.exports = {
	Client,
	client(socket, app) {
		return construct(Client, [socket, app]);
	}
};
