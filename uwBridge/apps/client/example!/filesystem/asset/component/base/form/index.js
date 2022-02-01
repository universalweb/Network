(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('Form Component', 'notify');
	const dirname = exports.dirname;
	await component('frm', {
		asset: {
			template: `${dirname}template`,
			css: [`${dirname}style`]
		}
	});
})();
