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
	post,
	socket: {}
};
assign(app.events, events);
