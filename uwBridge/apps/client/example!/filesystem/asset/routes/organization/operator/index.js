(async () => {
	const {
		component,
		router
	} = app;
	app.debug = true;
	import { organizationEventsCompile } from 'models/organization/index.js';
	
	await component({
		model: exports,
		asset: {
			partials: {
				batchEditModal: `models/organization/modal/edit`,
				batchRemoveModal: `models/organization/modal/remove`,
			},
			template: `models/organization/page`,
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const _id = router.location.paths[1];
			const organizationEvents = await organizationEventsCompile({
				rootProp: 'organization',
				rootAPI: 'organization.operator',
				source,
				_id
			});
			console.log(organizationEvents);
			source.on('*.organization.edited', organizationEvents.loadPage);
		},
	});
	exports.compile = () => {};
})();
