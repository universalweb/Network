import app from '../app';
const {
	demand,
	utility: {
		assign,
		each,
		isFunction,
		compactKeys,
		pluckObject
	},
	componentStore
} = app;
Ractive.sharedData.classes = {};
Ractive.sharedData.classList = {};
const view = new Ractive({
	template: `{{#@shared.components.main:key}}{{>getComponent(key)}}{{/}}`,
	onrender() {
		const source = this;
		source.observe('@shared.classes', () => {
			const classes = compactKeys(componentStore('classes'));
			const classList = componentStore('classList');
			classes.push(...pluckObject(classList, compactKeys(classList)));
			document.body.className = classes.join(' ');
		});
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
		await demand(importURL);
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
		await app.initializeScreen();
		await view.render('body');
	},
	view,
});
