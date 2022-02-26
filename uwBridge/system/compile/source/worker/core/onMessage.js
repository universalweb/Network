import app from './app';
const {
	utility: { get },
	events,
	events: { post }
} = app;
self.onmessage = async (workerEvent) => {
	const {
		request,
		id,
		data
	} = workerEvent.data;
	const eventCallback = get(request, events);
	console.log(request, data);
	if (eventCallback) {
	  const results = await eventCallback(data, {
			id
		});
		if (results) {
			post(id, results);
		}
		if (app.debug) {
			console.log(`Worker api.${request}`);
		}
	} else {
		console.log(`FAILED Worker api.${request}`);
	}
};
