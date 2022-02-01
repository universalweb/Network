(async () => {
	const {
		request,
		component,
		utility: {
			findItem,
			throttle,
			assign
		},
		createAlert
	} = app;
	const dirname = exports.dirname;
	await component({
		model: exports,
		asset: {
			partials: {
				createModal: `${dirname}modalCreate`,
			},
			template: `${dirname}template`,
			css: [`${dirname}style`],
		},
		data() {
			return {
				title: 'Organizations',
				description: 'View All',
				id: 'organization',
				opened: true,
				list: [],
				search: '',
				loadRequest: 'organization.findMine',
				searchRequest: 'organization.findAll',
				actions: [{
					toggleID: 'createOrg',
					title: 'Create',
					type: 'primary',
					icon: {
						name: 'plus'
					},
					modal: {
						title: 'Create Organization',
						actionBtn: {
							click: 'createOrganization',
							title: 'Save',
							type: 'primary',
							icon: {
								name: 'check'
							},
						},
						form: [{
							label: 'name',
							id: 'name',
							placeholder: `Organization's Name`,
							value: 'Org 1'
						}, {
							label: 'email',
							id: 'email',
							placeholder: `Organization's Email`,
							value: 'org@org.com'
						}, {
							label: 'phone',
							id: 'phone',
							placeholder: `Organization's Phone Number`,
							value: '7324728901'
						}, {
							label: 'contact',
							id: 'contact',
							placeholder: `Organization's Contact Name`,
							value: 'Jim'
						}, {
							label: 'address',
							id: 'address',
							placeholder: `Organization's address`,
							value: '4 Jim Court Eatonplace NJ 07724'
						}, {
							label: 'fax',
							id: 'fax',
							placeholder: `Organization's Fax Number`,
							value: '7324728901'
						}, {
							label: 'tax ID',
							id: 'tax',
							placeholder: `Organization's tax ID`,
							value: '732472901'
						}]
					}
				}]
			};
		},
		async onrender() {
			const source = this;
			const statsResults = await request('stats.load', {});
			source.set(statsResults.results);
			async function loadMain() {
				const loadRequest = source.get('loadRequest');
				if (!loadRequest) {
					const loadView = source.get('loadView');
					if (loadView) {
						return loadView();
					}
					return;
				}
				const buildRequest = source.get('buildRequest');
				console.log(loadRequest);
				const query = {};
				if (buildRequest) {
					assign(query, await buildRequest(source));
				}
				const resultsFirstLoad = await request(loadRequest, query);
				console.log(resultsFirstLoad);
				await source.set('list', resultsFirstLoad.items);
				console.log(source.get());
			}
			const search = throttle(async () => {
				const searchCriteria = source.get('search');
				const searchRequest = source.get('searchRequest');
				console.log(searchCriteria, searchRequest);
				if (searchCriteria.length === 0) {
					return loadMain();
				}
				const buildRequest = source.get('buildRequest');
				const query = {
					match: {
						search: searchCriteria
					}
				};
				if (buildRequest) {
					assign(query, await buildRequest(source));
				}
				const results = await request(searchRequest, query);
				await source.set('list', results.items);
				console.log(source.get());
			}, 1000);
			source.on({
				'*.searchOrganizations'(evnt) {
					console.log(evnt);
					console.log(source.get());
					const searchCriteria = source.get('search');
					if (searchCriteria.length === 0) {
						return loadMain();
					}
					search();
				},
				async '*.createOrganization'(cntxt) {
					console.log(cntxt.component.get());
					console.log('Create Organizatiion');
					const formInputs = source.get('actions.0.modal.form');
					const orgName = findItem(formInputs, 'name').value;
					const email = findItem(formInputs, 'email').value;
					const address = findItem(formInputs, 'address').value;
					const contact = findItem(formInputs, 'contact').value;
					const tax = findItem(formInputs, 'tax').value;
					const creator = findItem(formInputs, 'admin');
					const fax = findItem(formInputs, 'fax').value;
					const phone = findItem(formInputs, 'phone').value;
					const item = {
						name: orgName,
						email,
						address,
						contact,
						tax,
						creator: (creator) ? creator.value : undefined,
						fax,
						phone
					};
					const results = await request('organization.create', {
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'Organization created!'
						});
						await source.unshift('list', results.item);
					} else {
						createAlert({
							message: 'Failed Organization creation!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#createOrg')).hide();
					console.log(results);
				}
			});
			await loadMain();
		},
	});
	exports.compile = () => {
	};
})();
