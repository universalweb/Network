(async () => {
	const {
		component,
		router,
	} = app;
	app.debug = true;
	import { feedbackEventsCompile } from 'models/feedback/index.js';
	await component({
		model: exports,
		asset: {
			partials: {
				code: `models/feedback/list`,
				codeCreateModal: `models/feedback/modal/create`,
			},
			template: `models/feedback/template`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const batch = router.location.paths[1];
			const feedbackEvents = await feedbackEventsCompile({
				rootProp: 'feedback',
				rootAPI: 'feedback.operator',
				source,
				batch,
			});
			source.on('feedback.generated', () => {
				feedbackEvents.loadMain();
			});
		},
	});
	exports.compile = () => {};
})();
