(async () => {
	const {
		component,
		request,
		utility: { stringify }
	} = app;
	app.debug = true;
	await component({
		model: exports,
		asset: {
			template: `models/login/page`,
		},
		data() {
			return {
				login: {},
				signup: {}
			};
		},
		async onrender() {
			this.on({
				async '*.login'(context, parentContext) {
					console.log(context, parentContext.get());
					const results = await request('open.login', {
						account: parentContext.get()
					});
					if (results.account) {
						await app.view.set('@shared.account', results.account);
						await app.view.set('@shared.credit', results.credit);
						await app.crate.setItem('credit', stringify(results.credit));
						await app.view.set('@shared.loginStatus', true);
						app.router.pushState('/');
					}
					console.log(results);
				},
			});
		},
	});
})();
