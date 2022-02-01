(async () => {
	const {
		request,
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
					organization: {
						batchCount: {
							title: 'Batches',
						},
						codeCount: {
							title: 'Codes',
						},
						feedbackCount: {
							title: 'Feedback',
						},
						productCount: {
							title: 'Products',
							href: '/products/'
						},
						scanCount: {
							title: 'Scans',
						}
					},
					facility: {
						batchCount: {
							title: 'Batches',
						},
						codeCount: {
							title: 'Codes',
						},
						feedbackCount: {
							title: 'Feedback',
						},
						productCount: {
							title: 'Products',
							href: '/products/'
						},
						scanCount: {
							title: 'Scans',
						}
					}
				},
			};
		},
		async onrender() {
			const source = this;
			source.observe('@shared.stats', async (newValue) => {
				if (!newValue) {
					return;
				}
				if (newValue.organization) {
					await eachObjectAsync(newValue.organization, async (item, key) => {
						if ((/count/i).test(key)) {
							await source.set(`stats.organization.${key}.count`, item);
						}
					});
				}
				if (newValue.facility) {
					await eachObjectAsync(newValue.facility, async (item, key) => {
						if ((/count/i).test(key)) {
							await source.set(`stats.facility.${key}.count`, item);
						}
					});
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
