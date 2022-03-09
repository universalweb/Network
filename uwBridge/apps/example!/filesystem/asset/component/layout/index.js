(async () => {
	const {
		component,
		utility: { cnsl },
		watch
	} = app;
	cnsl('Layout Component', '!important');
	await component('layout', {
		asset: {
			styles: [`${import.meta.path}style`],
			template: `${import.meta.path}template`,
		},
		data() {
			return {
				alerts: [],
				classes: {},
			};
		},
		async onrender() {
			const source = this;
			console.log(source);
			cnsl('Layout Component Rendered');
			source.on({
				'*.refresh'() {
					window.location.reload();
				},
			});
			app.createAlert = (data) => {
				return window.UIkit.notification({
					message: data.message,
					status: data.type || 'primary',
					pos: data.location || 'top-right',
					timeout: data.time || 5000
				});
			};
			watch('notify', (json) => {
				console.log(json);
				app.createAlert(json);
			});
			cnsl('Layout rendered', 'notify');
		}
	});
})();
