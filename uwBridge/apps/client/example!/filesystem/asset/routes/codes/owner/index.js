(async () => {
	const {
		component,
		router,
	} = app;
	app.debug = true;
	import { codeEventsCompile } from 'models/code/index.js';
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		asset: {
			partials: {
				code: `models/code/list`,
				codeCreateModal: `models/code/modal/create`,
				codeDownloadModal: `models/code/modal/download`,
			},
			template: `models/code/template`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const batch = router.location.paths[1];
			const codeEvents = await eventsCompile({
				rootProp: 'code',
				type: 'code',
				source,
				batch,
			});
			const batchEvents = await eventsCompile({
				rootProp: 'batch',
				type: 'batch',
				source,
				_id: batch
			});
			await codeEventsCompile({
				rootProp: 'code',
				source,
				batch
			});
			await codeEvents.loadMain(true);
			source.on('codes.generated', async () => {
				await codeEvents.loadMain(true);
				await batchEvents.loadPage();
			});
			source.on('codes.archive', async () => {
				await batchEvents.loadPage();
			});
		},
	});
})();
