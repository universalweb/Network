import app from './app';
const {
	utility: {
		assign
	}
} = app;
const view = new Ractive({
	target: 'body',
	data() {
		return {
			components: {
				dynamic: {},
				layout: {},
				main: {},
			},
			notification: [],
			pageTitle: '',
			screenSize: '',
		};
	},
	template: `{{#components.main:key}}{{>getComponent(key)}}{{/}}`,
});
const pageTitle = new Ractive({
	target: 'head',
	append: true,
	data() {
		return {
			text() {
				return view.get('pageTitle');
			}
		};
	},
	template: `<title>{{text()}}</title>`,
});
assign(app, {
	view,
	pageTitle
});
