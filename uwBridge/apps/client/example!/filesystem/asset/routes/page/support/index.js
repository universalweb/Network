(async () => {
	const { page } = app;
	exports.config = {
		data: {
			title: 'Support',
			description: 'Need help?',
			icon: { name: 'question' },
		}
	};
	exports.compile = () => {
		return page.compile(exports);
	};
})();
