(async () => {
	const {
		request,
		component,
		utility: {
			findItem,
			assign,
		},
		createAlert,
		router
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
			const urlID = router.location.paths[1];
			if (!urlID || urlID.length !== 24) {
				return router.pushState('/');
			}
			const source = this;
			return {
				title: 'Facility Name',
				description: 'Facility contact',
				tabViews: [{
					id: 'info',
					opened: true,
					tab: {
						title: 'Info',
						icon: {
							name: 'info'
						}
					},
					async loadView() {
						const resultsFirstLoad = await request('facility.locate', {
							obj: {
								_id: urlID
							}
						});
						if (!resultsFirstLoad.item) {
							return router.pushState(`/`);
						}
						console.log(resultsFirstLoad);
						const item = resultsFirstLoad.item;
						const merged = item;
						await source.set(merged);
						await source.set('title', item.name);
						await source.set('description', item.contact);
						await source.set('tabViews.0.data', merged);
						const formInputs = source.get('tabViews.0.footer.actions.1.modal.form');
						findItem(formInputs, 'name', 'label').value = item.name;
						findItem(formInputs, 'email', 'label').value = item.email;
						findItem(formInputs, 'address', 'label').value = item.address;
						findItem(formInputs, 'contact', 'label').value = item.contact;
						findItem(formInputs, 'phone', 'label').value = item.phone;
						findItem(formInputs, 'tax ID', 'label').value = item.tax;
						findItem(formInputs, 'fax', 'label').value = item.fax;
						const creator = findItem(formInputs, 'creator', 'label');
						if (creator) {
							creator.value = item.creator || '';
						}
						await source.update('tabViews.0.footer.actions.1.modal.form');
					},
					data: {},
					footer: {
						actions: [{
							toggleID: 'deleteMain',
							title: 'Delete',
							type: 'danger',
							icon: {
								name: 'trash'
							},
							modal: {
								actionBtn: {
									click: 'deleteFacility',
									title: 'Delete',
									type: 'danger',
									icon: {
										name: 'trash'
									}
								},
								modalContent: `<p>Are you sure you want to delete the <b>{{item.data.name}}</b> facility?</p>`
							}
						}, {
							toggleID: 'editMain',
							title: 'Edit Facility',
							type: 'primary',
							icon: {
								name: 'plus'
							},
							actionBtn: {
								click: 'updateMain',
								title: 'Save',
								type: 'primary',
								icon: {
									name: 'check'
								}
							},
							class: 'uk-margin-right',
							modal: {
								form: [{
									label: 'name',
									placeholder: `Organization's Name`,
									value: ''
								}, {
									label: 'email',
									placeholder: `Organization's Email`,
									value: ''
								}, {
									label: 'phone',
									placeholder: `Organization's Phone Number`,
									value: ''
								}, {
									label: 'contact',
									placeholder: `Organization's Contact Name`,
									value: ''
								}, {
									label: 'address',
									placeholder: `Organization's address`,
									value: ''
								}, {
									label: 'fax',
									placeholder: `Organization's Fax Number`,
									value: ''
								}, {
									label: 'tax ID',
									placeholder: `Organization's tax ID`,
									value: ''
								}]
							}
						}]
					}
				}, {
					id: 'product',
					tab: {
						title: 'Products',
						icon: {
							name: 'tag'
						}
					},
					buildRequest() {
						return {
							facility: urlID
						};
					},
					list: [],
					search: '',
					loadRequest: 'product.findAll',
					searchRequest: 'product.findAll',
					actions: [{
						toggleID: 'createProduct',
						title: 'Create',
						icon: {
							name: 'plus'
						},
						type: 'primary',
						modal: {
							title: 'Create A Product',
							actionBtn: {
								click: 'createProduct',
								title: 'Save',
								type: 'primary',
								icon: {
									name: 'check'
								}
							},
							form: [{
								label: 'name',
								placeholder: `Product's Name`,
								value: 'Xbox'
							}, {
								label: 'description',
								placeholder: `Product's Description`,
								value: 'Play video games'
							}]
						}
					}]
				}]
			};
		},
		async onrender() {
			const source = this;
			const urlID = router.location.paths[1];
			await source.set(urlID);
			source.on({
				async '*.changeTab'(evnt, item, index) {
					console.log('Change Tab', item, index);
					await source.set('tabViews.*.opened', false);
					await source.set(`tabViews.${index}.opened`, true);
				},
				async '*.updateMain'() {
					console.log('Update Facility');
					const formInputs = source.get('tabViews.0.footer.actions.1.modal.form');
					const orgName = findItem(formInputs, 'name', 'label').value;
					const email = findItem(formInputs, 'email', 'label').value;
					const address = findItem(formInputs, 'address', 'label').value;
					const contact = findItem(formInputs, 'contact', 'label').value;
					const tax = findItem(formInputs, 'tax ID', 'label').value;
					const creator = findItem(formInputs, 'creator', 'label');
					const fax = findItem(formInputs, 'fax', 'label').value;
					const phone = findItem(formInputs, 'phone', 'label').value;
					const item = {
						name: orgName,
						email,
						address,
						contact,
						tax,
						creator: (creator) ? creator.value : undefined,
						fax,
						phone,
						_id: urlID
					};
					const results = await request('facility.update', {
						item
					});
					if (results && results.item === true) {
						createAlert({
							message: 'Facility Updated!'
						});
						await source.get('tabViews.0.loadView')();
					} else {
						createAlert({
							message: 'Facility failed to updated!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#editMain')).hide();
					console.log(results);
				},
				async '*.createProduct'() {
					console.log('Create Facility');
					const context = source.get('tabViews')[1];
					const formInputs = context.actions[0].modal.form;
					const itemName = findItem(formInputs, 'name', 'label').value;
					const description = findItem(formInputs, 'description', 'label').value;
					const creator = findItem(formInputs, 'creator', 'label');
					const item = {
						name: itemName,
						description,
						creator: (creator) ? creator.value : undefined,
						facility: urlID,
						organization: source.get('organization'),
					};
					const results = await request('product.create', {
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'Item created!'
						});
						await source.unshift('tabViews.1.list', results.item);
					} else {
						createAlert({
							message: 'Failed Item creation!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#createProduct')).hide();
					console.log(results);
				},
				async '*.deleteFacility'() {
					console.log('Delete Facility');
					const organization = source.get('organization');
					const item = {
						_id: urlID
					};
					const results = await request('facility.remove', {
						organization,
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'Facility Deleted!'
						});
						window.UIkit.modal(source.find('#deleteMain')).hide();
						router.pushState(`/organization/${organization}`);
					} else {
						window.UIkit.modal(source.find('#deleteMain')).hide();
						createAlert({
							message: 'Facility failed to delete!',
							type: 'danger'
						});
					}
					console.log(results);
				}
			});
		},
	});
	exports.compile = () => {
	};
})();
