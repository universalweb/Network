exports.items = {
	left: [{
		click: 'sidebar.toggle',
		icons() {
			return (app.view.get(`@shared.classes.sidebarOpen`)) ? 'chevron-left' : 'menu';
		},
		tooltips() {
			return (app.view.get(`@shared.classes.sidebarOpen`)) ? 'Close Sidebar' : 'Open Sidebar';
		},
		id: 'sidebar'
	}],
	right: [{
		id: 'back',
		click: 'routerLoad',
		icon: {
			name: 'settings',
		},
		tooltip: 'Settings',
		href: '/settings/',
		loginState: true,
		right: true
	}]
};
