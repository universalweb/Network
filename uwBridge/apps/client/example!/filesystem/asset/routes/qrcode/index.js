(async () => {
	const dirname = exports.dirname;
	console.log('LOGIN PAGE');
	const {
		page,
		utility: { isEnter },
		request,
		view
	} = app;
	exports.config = {
		data: {
			pageTitle: 'Dash',
			hero: {
				icon: 'qr_code_2',
				headline: 'Dashboard',
				description: 'Akerna Code Root Debug Dashboard'
			},
			dynamic: {
				login: true
			},
			loginStatus() {
				return view.get('@shared.loginStatus');
			},
			qrcode: {
				value: ''
			},
			tabState: 'qrcode',
			tabs: [{
				active: true,
				icon: 'qr_code_2',
				state: 'qrcode',
				title: 'QR Code',
			}, {
				active: false,
				icon: 'face',
				state: 'createUser',
				title: 'Create User',
			}]
		},
		async onrender() {
			const source = this;
			source.on({
				async qrcodeEnter(evnt) {
					console.log(evnt.original.key);
					if (!evnt.original.key || !isEnter(evnt.original)) {
						return;
					}
					await source.set('qrcode.url', false);
					const getNewQR = await request('qrcode.build', {
						text: source.get('qrcode.value')
					});
					getNewQR.value = source.get('qrcode.value');
					await source.set('qrcode', getNewQR);
					console.log(getNewQR);
				},
				async changeTab(evnt) {
					await source.set('tabState', evnt.get('state'));
					await source.set('tabs.*.active', false);
					await source.set(`${evnt.resolve()}.active`, true);
				}
			});
			await source.set({
				'email': 'tom@universalweb.io',
				'password': 'admin',
			});
			await source.set({
				'signup.email': 'dmc@akerna.com',
				'signup.agreed': true,
				'signup.password': 'admin',
				'signup.confirmPassword': 'admin',
			});
		},
	};
	exports.asset = {
		partials: {
			login: `${dirname}template`
		}
	};
	exports.compile = () => {
		return page.compile(exports);
	};
})();
