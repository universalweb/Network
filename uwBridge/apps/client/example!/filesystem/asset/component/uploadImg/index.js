(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	cnsl('btn Component', 'notify');
	const dirname = exports.dirname;
	await component('uploadImg', {
		asset: {
			template: `${dirname}template`
		}
	});
})();
