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
				feedbackCreateModal: `models/feedback/modal/create`,
			},
			template: `models/nft/page`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const hash = router.location.paths[1];
			const codeEvents = await eventsCompile({
				rootProp: 'code',
				type: 'code',
				source,
				hash,
			});
			console.log(hash);
			console.log(codeEvents);
			source.on('*.code.edited', codeEvents.loadPage);
		},
	});
	exports.compile = () => {};
})();
