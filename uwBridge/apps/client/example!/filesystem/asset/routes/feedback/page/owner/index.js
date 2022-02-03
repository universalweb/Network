(async () => {
	const {
		component,
		router
	} = app;
	app.debug = true;
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		asset: {
			template: `models/feedback/page`,
		},
		data() {
			return {};
		},
		async onrender() {
			const source = this;
			const _id = router.location.paths[1];
			console.log(_id);
			const feedbackEvents = await eventsCompile({
				rootProp: 'feedback',
				type: 'feedback',
				source,
				_id
			});
		},
	});
})();
