(async () => {
	exports.item = {
		text: 'Team',
		icon: true,
		section: true,
		hide: false,
		loginState: true,
		options: {
			feed: {
				text: 'Manage',
				icon: 'settings',
				section: false,
				click: 'routerLoad',
				href: '/team/manage',
			},
			members: {
				text: 'Members',
				icon: 'group',
				section: false,
				click: 'routerLoad',
				href: '/team/members',
			}
		},
	};
})();
