(async () => {
	const {
		component,
		utility: { cnsl }
	} = app;
	import { items } from '${import.meta.path}items/';
	import 'component/dropPanel/';
	await component('navigationbar', {
		asset: {
			template: `${import.meta.path}template`,
			styles: [`${import.meta.path}style`]
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
