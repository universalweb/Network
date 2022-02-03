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
				campaignEditModal: `models/campaign/modal/edit`,
				campaignRemoveModal: `models/campaign/modal/remove`,
			},
			template: `models/campaign/page`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const _id = router.location.paths[1];
			const campaignEvents = await eventsCompile({
				rootProp: 'campaign',
				type: 'campaign',
				source,
				_id,
			});
			console.log(campaignEvents);
			source.on('*.campaign.edited', campaignEvents.loadPage);
			source.on('*.campaign.removed', () => {
				router.pushState(`/campaigns/`);
			});
		},
	});
})();
