(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('modal Component', 'notify');
	await component('modal', {
		asset: {
			template: `${import.meta.path}template`,
			styles: [`${import.meta.path}style`]
		}
	});
})();
