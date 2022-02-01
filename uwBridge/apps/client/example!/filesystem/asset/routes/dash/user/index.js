(async () => {
	const {
		component,
		utility: { eachObjectAsync },
	} = app;
	const dirname = exports.dirname;
	await component({
		model: exports,
		asset: {
			template: `${dirname}template`,
			css: [`${dirname}style`],
		},
		data() {
			return {
				title: 'Dashboard',
				description: 'System Wide Stats',
				stats: {
					scanCount: {
						title: 'Scans',
						href: '/feedback/'
					},
					feedbackCount: {
						title: 'Feedback',
						href: '/feedback/'
					},
					productCount: {
						title: 'Products',
						href: '/products/'
					}
				},
			};
		},
		async onrender() {
			const source = this;
			source.observe('@shared.stats', async (newValue) => {
				if (newValue && newValue.results) {
					await eachObjectAsync(newValue.results, async (item, key) => {
						if ((/count/i).test(key)) {
							console.log(key);
							await source.set(`stats.${key}.count`, item);
						}
					});
					await source.update(`stats`);
				}
			});
		}
	});
	exports.open = async () => {
		await Ractive.sharedSet('dash', true);
		const backBtn = app.view.findComponent('navigationbar').get('items.right.1');
		if (backBtn) {
			await app.view.findComponent('navigationbar').set('items.right.1.hide', true);
		}
	};
	exports.close = async () => {
		await Ractive.sharedSet('dash', false);
		const backBtn = app.view.findComponent('navigationbar').get('items.right.1');
		if (backBtn) {
			await app.view.findComponent('navigationbar').set('items.right.1.hide', false);
		}
	};
})();
