(async () => {
	const { page } = app;
	exports.config = {
		data: {
			title: 'Contact',
			description: 'Drop us a line',
			icon: { name: 'receiver' },
		}
	};
	exports.compile = () => {
		return page.compile(exports);
	};
})();
