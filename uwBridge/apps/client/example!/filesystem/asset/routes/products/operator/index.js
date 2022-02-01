(async () => {
	const { component, } = app;
	app.debug = true;
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		model: exports,
		asset: {
			partials: {
				product: `models/product/list`,
				productCreateModal: `models/product/modal/create`,
				productRemoveModal: `models/product/modal/remove`,
				productsCreateModal: `models/product/modal/csvCreate`,
				batchCreateModal: `models/batch/modal/create`,
			},
			template: `models/product/template`,
			css: [`models/product/style`],
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const productEvents = await eventsCompile({
				rootProp: 'product',
				type: 'product',
				rootAPI: 'product.operator',
				source,
			});
			const batchEvents = await eventsCompile({
				rootProp: 'batch',
				type: 'batch',
				rootAPI: 'batch.operator',
				source,
			});
			console.log(productEvents, batchEvents);
			await source.update('product.create');
			await source.update('batch.create');
			await productEvents.loadMain(true);
		},
	});
	exports.compile = () => {};
})();
