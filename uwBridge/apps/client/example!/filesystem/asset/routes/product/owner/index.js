(async () => {
	const {
		component,
		router
	} = app;
	app.debug = true;
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		asset: {
			partials: {
				productEditModal: `models/product/modal/edit`,
				productRemoveModal: `models/product/modal/remove`,
			},
			template: `models/product/page`,
			css: [`models/product/page`],
		},
		data() {
			return {};
		},
		async onrender() {
			const source = this;
			const _id = router.location.paths[1];
			const productEvents = await eventsCompile({
				rootProp: 'product',
				type: 'product',
				source,
				_id
			});
			const batchEvents = await eventsCompile({
				rootProp: 'batch',
				type: 'batch',
				source,
			});
			console.log(productEvents, batchEvents);
			source.on('*.product.edited', productEvents.loadPage);
			source.on('*.product.removed', () => {
				router.pushState(`/products/`);
			});
		},
	});
})();
