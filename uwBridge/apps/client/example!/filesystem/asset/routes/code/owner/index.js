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
				codeEditModal: `models/code/modal/edit`,
				codeRemoveModal: `models/code/modal/remove`,
			},
			template: `models/code/page`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const _id = router.location.paths[1];
			const codeEvents = await eventsCompile({
				rootProp: 'code',
				type: 'code',
				source,
				_id,
			});
			console.log(codeEvents);
			source.on('*.code.edited', codeEvents.loadPage);
		},
	});
})();
