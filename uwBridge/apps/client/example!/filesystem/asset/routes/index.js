(async () => {
	import 'js/action/geoLocation';
	const {
		router,
		push,
		view,
		request,
		utility: { cnsl }
	} = app;
	cnsl('app router Module', 'important');
	Ractive.routerLoad(view);
	router.analytics = async () => {
		push('analytic.view', {
			item: router.location,
			type: 'route',
		});
		if (view.get('@shared.account')) {
			const statsResults = await request('stats.load', {});
			console.log(statsResults);
			await view.set('@shared.stats', statsResults);
			await view.update('@shared.stats');
		}
	};
	router.add({
		'^/user/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `user/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/settings/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `settings/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/code/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `code/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/nft/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `nft/${role}`,
					};
				} else {
					return {
						path: 'nft',
					};
				}
			}
		},
		'^/feedback/$': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `feedback/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/feedback/product/(.+)': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `feedback/product/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/feedback/batch/(.+)': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `feedback/batch/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/feedback/organization/(.+)': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `feedback/organization/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/feedback/code/(.+)': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `feedback/batch/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/feedback/facility/(.+)': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `feedback/facility/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/feedback/(?!product|code|batch|organization|facility)(.+)': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `feedback/page/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/organizations/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `organizations/${role}`,
					};
				} else {
					return {
						path: '/',
					};
				}
			}
		},
		'^/organization/(.+)/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `organization/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/organization/$': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `organization/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/batch/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `batch/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/batches/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `batches/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/codes/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `codes/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/products/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `products/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/product/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `product/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/campaign/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `campaign/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/campaigns/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `campaigns/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/facility/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `facility/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/login/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `dash/${role}`,
					};
				} else {
					return {
						path: 'login',
					};
				}
			}
		},
		'^/signup/': {
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `dash/${role}`,
					};
				} else {
					return {
						path: 'signup',
					};
				}
			}
		},
		'^/$': {
			require: ['component/page/'],
			route() {
				cnsl('HOME', 'notify');
				if (view.get('@shared.loginStatus') === true) {
					const role = view.get('@shared.account.role');
					return {
						path: `dash/${role}`,
					};
				} else {
					return {
						path: 'dash/open',
					};
				}
			}
		},
		'^/page/': {
			require: ['component/page/'],
			route() {
				cnsl(router.location.pathname, 'notify');
				return {
					path: router.location.pathname,
				};
			}
		}
	});
})();
