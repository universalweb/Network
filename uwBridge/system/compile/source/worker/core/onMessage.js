import app from './app';
const {
	utility: {
		get
	},
	events,
	events: {
		post
	}
} = app;
self.onmessage = (evnt) => {
	const data = evnt.data;
	const requestName = data.request;
	const id = data.id;
	const body = data.data;
	const eventCallback = get(requestName, events);
	if (eventCallback) {
		const returned = eventCallback(body, {
			id
		});
		if (returned) {
			post(returned, id);
		}
		console.log(`Worker api.${requestName}`);
	} else {
		console.log(`FAILED Worker api.${requestName}`);
	}
};
