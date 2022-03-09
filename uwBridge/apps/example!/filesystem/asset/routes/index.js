(async () => {
	import 'js/action/geoLocation';
	const {
		router,
		view,
		request,
		utility: { cnsl }
	} = app;
	cnsl('app router Module', 'important');
	await router.setup({
		methods: {
			async security() {
				return view.get('@shared.loginStatus');
			},
			async fail() {
				return 'login';
			},
			async success() {
				return view.get('@shared.account.role');
			},
			async onLoad() {
				if (view.get('@shared.loginStatus')) {
					const statsResults = await request('stats.load', {});
					console.log(statsResults);
					await view.set('@shared.stats', statsResults);
					await view.update('@shared.stats');
				}
			},
		},
		defaults: {
			secured: true,
			role: true,
			root: 'routes',
			route: {
				default: 'dash',
				failed: '404'
			}
		},
		routes: [{
			match: '^/$',
			path: `dash`,
		}, {
			match: '^/page/',
			secured: false,
			role: false
		}]
	});
})();
