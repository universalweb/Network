(async () => {
	const {
		component,
		router
	} = app;
	app.debug = true;
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		model: exports,
		asset: {
			partials: {
				batchEditModal: `models/batch/modal/edit`,
				batchRemoveModal: `models/batch/modal/remove`,
			},
			template: `models/batch/page`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const _id = router.location.paths[1];
			const batchEvents = await eventsCompile({
				rootProp: 'batch',
				type: 'batch',
				source,
				_id
			});
			source.on('*.batch.edited', batchEvents.loadPage);
			source.on('*.batch.removed', () => {
				const product = source.get('batch.current.product');
				router.pushState(`/batches/${product}`);
			});
		},
	});
	exports.compile = () => {};
})();
