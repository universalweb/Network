(async () => {
	const { translate } = app;
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
	}, {
		click: 'routerLoad',
		href: '/products/',
		icon: {
			name: 'fa-tag'
		},
		pathMatch: /\/products\/$/,
		loginState: true,
		role: /admin|owner|operator/,
		text: 'Products',
	}, {
		click: 'routerLoad',
		href: '/campaigns/',
		icon: {
			name: 'fa-tasks'
		},
		pathMatch: /\/campaigns\/$/,
		role: /admin|owner|operator/,
		loginState: true,
		text: 'Campaigns',
	}, {
		click: 'routerLoad',
		href: '/organization/',
		icon: {
			name: 'fa-building'
		},
		pathMatch: /\/organization\/$/,
		loginState: true,
		role: /owner/,
		text: 'organization',
	}, {
		click: 'routerLoad',
		href: '/feedback/',
		icon: {
			name: 'fa-comments'
		},
		pathMatch: /\/feedback\/$/,
		loginState: true,
		role: /admin|owner|operator/,
		text: 'Feedback',
	}, {
		click: 'routerLoad',
		href: '/page/about/',
		icon: {
			name: 'info'
		},
		pathMatch: /\/page\/about\/$/,
		section: false,
		text: translate.about.label,
	}, {
		click: 'routerLoad',
		href: '/page/support/',
		icon: {
			name: 'question'
		},
		pathMatch: /\/page\/support\/$/,
		section: false,
		text: 'support',
	}, {
		click: 'routerLoad',
		href: '/page/privacypolicy/',
		icon: {
			name: 'warning'
		},
		pathMatch: /\/page\/privacypolicy\/$/,
		text: translate.privacypolicy.label,
	}, {
		click: 'logoutForce',
		icon: {
			name: ' sign-out'
		},
		loginState: true,
		text: 'Logout',
	}];
	console.log(exports);
})();
