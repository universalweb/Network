const {
	assign,
	construct,
	get,
	map,
	apply
} = self.$;
import { processScriptRequest } from './scriptCompile';
import { ClientSocket } from './ClientSocket';
export class AppWorker {
	constructor() {
		self.onmessage = async (workerEvent) => {
			this.onmessage(workerEvent);
		};
	}
	async onmessage(workerEvent) {
		console.log(workerEvent.data);
		const {
			task,
			id,
			data
		} = workerEvent.data;
		const eventCallback = get(task, this.tasks);
		console.log(task, data);
		if (eventCallback) {
			const results = await apply(eventCallback, this, [data, {
				id
			}]);
			if (results) {
				this.post(id, results);
			}
			if (this.debug) {
				console.log(`Worker api.${task}`);
			}
		} else {
			console.log(`FAILED Worker api.${task}`);
		}
	}
	update(body) {
		console.log(body);
		this.post('_', {
			body
		});
	}
	post(id, data, options) {
		const responseData = {
			data,
			id
		};
		assign(responseData, options);
		postMessage(responseData);
	}
	state = 1;
	config = {};
	tasks = {
		configure(data) {
			assign(this.config, data);
			console.log('STARTING');
			this.socket = construct(ClientSocket, [this]);
		},
		post(id, data, options) {
			const responseData = {
				data,
				id
			};
			assign(responseData, options);
			postMessage(responseData);
		},
		socket: {
			async get(options, workerInfo) {
				const context = this;
				const { body } = options;
				const fileList = body.files;
				const configObj = {
					checksum: [],
					completedFiles: map(fileList, () => {
						return '';
					}),
					fileList: body,
					fileListLength: fileList.length,
					filesLoaded: 0,
					progress: options.progress,
				};
				const requestConfig = {
					async callback(json) {
						return processScriptRequest(context, json, configObj, workerInfo);
					},
					data: {
						task: 'file.get',
						body
					},
				};
				const results = await this.socket.request(requestConfig);
				return results;
			},
			async request(data) {
				const results = await this.socket.request(data);
				return results;
			},
		}
	};
	utility = self.$;
}
