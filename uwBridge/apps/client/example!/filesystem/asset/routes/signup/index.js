(async () => {
	const {
		component,
		request,
		router,
		utility: { stringify }
	} = app;
	app.debug = true;
	await component({
		model: exports,
		asset: {
			template: `models/signup/page`,
		},
		data() {
			return {
				login: {},
				signup: {}
			};
		},
		async onrender() {
			this.on({
				async '*.signup'(context, parentContext) {
					console.log(context, parentContext.get());
					const results = await request('open.signup', {
						account: parentContext.get()
					});
					if (results.account) {
						await app.view.set('@shared.account', results.account);
						await app.view.set('@shared.credit', results.credit);
						await app.crate.setItem('credit', stringify(results.credit));
						await app.view.set('@shared.loginStatus', true);
						router.pushState('/');
					}
					console.log(results);
				}
			});
		},
	});
})();
