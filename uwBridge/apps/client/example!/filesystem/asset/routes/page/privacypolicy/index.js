(async () => {
	const { page } = app;
	exports.config = {
		data: {
			title: 'Privacy Policy',
			description: 'Terms of service',
			icon: { name: 'warning' },
		}
	};
	exports.compile = () => {
		return page.compile(exports);
	};
})();
