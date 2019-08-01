import app from './app';
const {
	utility: {
		assign
	}
} = app;
const view = new Ractive({
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
	template: `<div>RENDERED</div>`,
});
const pageTitle = new Ractive({
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
	async render() {
		await view.render('body');
		await pageTitle.render('head');
	},
	view,
	pageTitle
});
app.render();
