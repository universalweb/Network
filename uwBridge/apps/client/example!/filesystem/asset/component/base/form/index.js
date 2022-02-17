(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('Form Component', 'notify');
	await component('frm', {
		asset: {
			template: `${import.meta.path}template`,
			styles: [`${import.meta.path}style`]
		}
	});
})();
