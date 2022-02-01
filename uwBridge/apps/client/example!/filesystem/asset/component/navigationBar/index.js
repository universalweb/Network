(async () => {
	const dirname = exports.dirname;
	const {
		component,
		utility: { cnsl }
	} = app;
	import { items } from '${dirname}items/';
	import 'component/dropPanel/';
	await component('navigationbar', {
		asset: {
			template: `${dirname}template`,
			css: [`${dirname}style`]
		},
		data() {
			return {
				items
			};
		},
		onrender() {
			const source = this;
			console.log(source);
			cnsl('Navigationbar Component', 'notify');
			source.on({
				async '*.toggleDropdown'(evnt) {
					console.log(this);
					const state = evnt.get('dropdown.state');
					await source.set('items.*.dropdown.state', 0);
					await evnt.set('dropdown.state', !state);
				},
			});
		}
	});
})();
