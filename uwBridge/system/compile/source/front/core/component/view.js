import app from '../app';
const {
	demand,
	demandJs,
	utility: {
		assign,
		each,
		isFunction,
		cnsl
	},
} = app;
Ractive.sharedData.classes = {};
Ractive.sharedData.classList = {};
const view = new Ractive({
	template: `{{#@shared.components.main:key}}{{>getComponent(key)}}{{/}}`,
	async oninit() {
		cnsl('App Initialize Component', 'warning');
		const source = this;
		await app.initializeScreen();
		source.on('@shared.sizeTrigger', () => {
			app.computeLayoutClasses();
		});
		source.observe('@shared.classes', () => {
			app.computeLayoutClasses();
		});
		source.observe('@shared.classList', () => {
			app.computeLayoutClasses();
		});
	},
	async onrender() {
		app.computeLayoutClasses();
	}
});
view.on({
	async '*.loadComponent'(componentEvent) {
		const imported = await demand(componentEvent.get('demand'));
		const afterDemand = componentEvent.get('afterDemand');
		if (afterDemand) {
			const afterDemandEvents = afterDemand[componentEvent.original.type];
			each(afterDemandEvents, (item, key) => {
				if (isFunction(item)) {
					item(imported, item, key);
				} else {
					app.view.findComponent(key)
						.fire(item);
				}
			});
		}
	},
	'*.preventDefault'(context) {
		const { original } = context;
		original.preventDefault();
		original.stopPropagation();
	},
});
app.importComponent = async (componentName, importURL, type = 'dynamic') => {
	if (importURL) {
		await demandJs(importURL);
	}
	await view.set(`@shared.components.${type}.${componentName}`, true);
	await view.update('@shared.components.${type}');
};
app.title = new Ractive({
	target: 'head',
	append: true,
	data() {
		return {};
	},
	template: `<title>{{@shared.pageTitle}}</title>`,
});
assign(app, {
	async render() {
		await view.render('body');
	},
	view,
});
