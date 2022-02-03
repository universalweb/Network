(async () => {
	const { component, } = app;
	app.debug = true;
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		asset: {
			partials: {
				campaign: `models/campaign/list`,
				campaignCreateModal: `models/campaign/modal/create`,
			},
			template: `models/campaign/template`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const campaignEvents = await eventsCompile({
				rootProp: 'campaign',
				type: 'campaign',
				source,
			});
			source.set('campaign.create', {
				name: 'iPhone Campaign',
				description: `The iPhone campaign. https://www.apple.com`,
				html: `<b>This is an HTML field for the iphone campaign</b>`,
				homepage: `https://www.apple.com/iphone`,
				releasedate: `2022-09-04`,
				startDate: `2022-01-27`,
				endDate: `2022-01-29`,
				ageStart: '18',
				ageEnd: '26',
			});
			console.log(campaignEvents);
			await campaignEvents.loadMain(true);
		},
	});
})();
