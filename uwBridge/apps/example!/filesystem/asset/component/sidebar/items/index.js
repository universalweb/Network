(async () => {
	exports.items = [{
		click: 'routerLoad',
		href: '/',
		icon: {
			name: 'fa-th-large'
		},
		text: 'Dashboard',
		pathMatch: /^\/$/,
	}, {
		click: 'routerLoad',
		href: '/organizations/',
		icon: {
			name: 'fa-industry'
		},
		loginState: true,
		role: /admin/,
		pathMatch: /\/organizations\/$/,
		text: 'Organizations',
	}];
	console.log(exports);
})();
