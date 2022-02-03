(async () => {
	const { component } = app;
	app.debug = true;
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		asset: {
			partials: {
				organizationEditModal: `models/organization/modal/edit`,
			},
			template: `models/organization/page`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const _id = app.view.get('@shared.account.organization');
			const codeEvents = await eventsCompile({
				rootProp: 'organization',
				type: 'organization',
				source,
				_id,
			});
			console.log(_id);
			console.log(codeEvents);
			source.on('*.organization.edited', codeEvents.loadPage);
		},
	});
})();
