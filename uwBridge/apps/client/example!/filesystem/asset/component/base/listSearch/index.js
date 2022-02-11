(async () => {
	const {
		component,
		request,
		utility: {
			cnsl,
			throttle,
			assign
		}
	} = app;
	cnsl('List Search Component', 'notify');
	const dirname = exports.dirname;
	await component('listSearch', {
		asset: {
			template: `${dirname}template`,
			styles: [`${dirname}style`]
		},
		async onrender() {
			const source = this;
			async function loadMain() {
				const loadRequest = source.get('item.loadRequest');
				if (!loadRequest) {
					const loadView = source.get('item.loadView');
					if (loadView) {
						return loadView();
					}
					return;
				}
				const buildRequest = source.get('item.buildRequest');
				console.log(loadRequest);
				const query = {};
				if (buildRequest) {
					assign(query, await buildRequest(source));
				}
				const resultsFirstLoad = await request(loadRequest, query);
				console.log(resultsFirstLoad);
				await source.set('item.list', resultsFirstLoad.items);
				console.log(source.get());
			}
			const search = throttle(async () => {
				const searchCriteria = source.get('item.search');
				const searchRequest = source.get('item.searchRequest');
				console.log(searchCriteria, searchRequest);
				if (searchCriteria.length === 0) {
					return loadMain();
				}
				const buildRequest = source.get('item.buildRequest');
				const query = {
					match: {
						search: searchCriteria
					}
				};
				if (buildRequest) {
					assign(query, await buildRequest(source));
				}
				const results = await request(searchRequest, query);
				await source.set('item.list', results.items);
				console.log(source.get());
			}, 1000);
			source.on({
				'*.search'(evnt) {
					console.log(evnt);
					console.log(source.get());
					const searchCriteria = source.get('item.search');
					if (searchCriteria.length === 0) {
						return loadMain();
					}
					search();
				},
				'*.reloadList'() {
					loadMain();
				}
			});
			source.get('item').reloadView = loadMain;
			source.observe('item.opened', async (value) => {
				console.log('OPENED TAB', value, source.get());
				if (value === true) {
					await loadMain();
				}
			}, {
				defer: true
			});
		}
	});
})();
