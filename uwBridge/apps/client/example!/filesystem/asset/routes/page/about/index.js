(async () => {
	const { page } = app;
	exports.config = {
		data: {
			title: 'About',
			description: 'What is Akerna?',
			icon: {
				name: 'info'
			},
		}
	};
	exports.compile = () => {
		return page.compile(exports);
	};
})();
