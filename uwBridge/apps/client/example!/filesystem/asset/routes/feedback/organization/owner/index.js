(async () => {
	const {
		component, router
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
			const organization = router.location.paths[2];
			const feedbackEvents = await eventsCompile({
				rootProp: 'feedback',
				type: 'feedback',
				source,
				organization,
			});
			console.log(feedbackEvents);
			await feedbackEvents.loadMain(true);
		},
	});
})();
