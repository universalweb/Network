(async () => {
	const {
		component,
		router,
		utility: { assign }
	} = app;
	app.debug = true;
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		asset: {
			partials: {
				batch: `models/batch/list`,
				batchCreateModal: `models/batch/modal/create`,
			},
			template: `models/batch/template`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const product = router.location.paths[1];
			const batchEvents = await eventsCompile({
				rootProp: 'batch',
				type: 'batch',
				rootAPI: 'batch.operator',
				source,
				product,
			});
			console.log(batchEvents);
			assign(source.get('batch.create'), {
				name: 'iPhone 13 Pro Max',
				description: `The iPhone is a line of smartphones designed and marketed by Apple Inc. that use Apple's iOS mobile operating system. The first-generation iPhone was announced by then-Apple CEO Steve Jobs on January 9, 2007. Since then, Apple has annually released new iPhone models and iOS updates. As of November 1, 2018, more than 2.2 billion iPhones had been sold. https://www.apple.com`,
				html: `<b>This is an HTML field</b>`,
				homepage: `https://www.apple.com/iphone`,
				releasedate: `2022-09-04`,
				ageRestriction: '18',
			});
			await source.update('batch.create');
			await batchEvents.loadMain(true);
			source.on('batches.generated', () => {
				batchEvents.loadMain(true);
			});
			const productEvents = await eventsCompile({
				rootProp: 'product',
				type: 'product',
				rootAPI: 'product.operator',
				source,
				_id: product
			});
			await productEvents.loadPage();
		},
	});
})();
