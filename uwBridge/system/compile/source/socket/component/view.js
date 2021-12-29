import app from '../app';
const {
	demand,
	utility: {
		assign,
		each,
		isFunction
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
	template: `{{#components.main:key}}{{>getComponent(key)}}{{/}}`,
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
	'*.preventDefault'() {
		return false;
	},
});
app.importComponent = async (componentName, importURL, type = 'dynamic') => {
	if (importURL) {
		await demand(importURL);
	}
	await app.view.set(`components.${type}.${componentName}`, true);
	await view.update('components.${type}');
};
const pageTitleComponent = new Ractive({
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
		await pageTitleComponent.render('head');
	},
	view,
});
