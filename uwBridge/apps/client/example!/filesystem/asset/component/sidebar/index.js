(async () => {
	const dirname = exports.dirname;
	const {
		component,
		view,
		utility: { cnsl }
	} = app;
	import { items } from '${dirname}items/';
	await component('sidebar', {
		asset: {
			template: `${dirname}template`,
			partials: {
				sidebarItem: `${dirname}item`
			},
			styles: [`${dirname}style`]
		},
		data() {
			return {
				items,
				state: false
			};
		},
		async onrender() {
			cnsl('Sidebar Component', 'notify');
			const source = this;
			view.on({
				'*.open'() {
					app.view.animate('@shared.sidebarPosition', 0, {
						duration: 400
					});
				},
				'*.close'() {
					app.view.animate('@shared.sidebarPosition', -150, {
						duration: 400
					});
				},
				'*.sidebar.section.toggle'(evnt) {
					evnt.toggle('hide');
				},
				'*.sidebar.toggle'(evnt) {
					evnt.toggle('active');
					source.toggle('state');
					source.toggle('@shared.classes.sidebarOpen');
				}
			});
			source.observe('state', (newVal, oldValue) => {
				if (oldValue === undefined || newVal === false) {
					source.fire('close');
				} else {
					source.fire('open');
				}
			});
		}
	});
})();
