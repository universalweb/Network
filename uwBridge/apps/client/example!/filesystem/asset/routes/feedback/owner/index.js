(async () => {
	const {
		component,
		utility: { assign },
	} = app;
	app.debug = true;
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		asset: {
			partials: {
				feedback: `models/feedback/list`,
			},
			template: `models/feedback/template`
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const productEvents = await eventsCompile({
				rootProp: 'feedback',
				type: 'feedback',
				source,
			});
			console.log(productEvents);
			await source.update('product.create');
			await source.update('batch.create');
			await productEvents.loadMain(true);
		},
	});
})();
