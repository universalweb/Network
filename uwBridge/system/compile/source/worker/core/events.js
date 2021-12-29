import app from './app';
import { post } from './post';
const {
	utility: {
		assign
	}
} = app;
const events = {
	appStatus: {
		state: 0
	},
	credit(data) {
		app.creditSave = data;
		console.log('Credits Saved in worker');
	},
	post,
	socket: {}
};
assign(app.events, events);
