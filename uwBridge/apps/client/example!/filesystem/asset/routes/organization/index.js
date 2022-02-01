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
				title: 'Organization Name',
				description: 'Organization contact',
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
						const resultsFirstLoad = await request('organization.locate', {
							obj: {
								_id: urlID
							}
						});
						if (!resultsFirstLoad.item) {
							return router.pushState(`/`);
						}
						console.log(resultsFirstLoad);
						const item = resultsFirstLoad.item;
						await source.set(item);
						await source.set('title', item.name);
						await source.set('description', item.contact);
						await source.set('tabViews.0.data', item);
						const formInputs = source.get('tabViews.0.footer.actions.1.modal.form');
						findItem(formInputs, 'name', 'label').value = item.name;
						findItem(formInputs, 'email', 'label').value = item.email;
						findItem(formInputs, 'address', 'label').value = item.address;
						findItem(formInputs, 'contact', 'label').value = item.contact;
						findItem(formInputs, 'phone', 'label').value = item.phone;
						findItem(formInputs, 'tax ID', 'label').value = item.tax;
						const creator = findItem(formInputs, 'creator', 'label');
						if (creator) {
							creator.value = item.creator || '';
						}
						findItem(formInputs, 'fax', 'label').value = item.fax;
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
									click: 'deleteMain',
									title: 'Delete',
									type: 'danger',
									icon: {
										name: 'trash'
									}
								},
								modalContent: `<p>Are you sure you want to delete the <b>{{item.data.name}}</b> organization?</p>`
							}
						}, {
							toggleID: 'editOrg',
							title: 'Edit',
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
					id: 'facility',
					tab: {
						title: 'Facility',
						icon: {
							name: 'fa-building'
						}
					},
					buildRequest() {
						return {
							organization: urlID
						};
					},
					list: [],
					search: '',
					loadRequest: 'facility.findAll',
					searchRequest: 'facility.findAll',
					actions: [{
						toggleID: 'createFacility',
						title: 'Create',
						type: 'primary',
						icon: {
							name: 'plus'
						},
						modal: {
							title: 'Create Facility',
							actionBtn: {
								click: 'createFacility',
								title: 'Save',
								type: 'primary',
								icon: {
									name: 'check'
								}
							},
							form: [{
								label: 'name',
								id: 'name',
								placeholder: `Facility's Name`,
								value: 'Facility 1'
							}, {
								label: 'email',
								id: 'email',
								placeholder: `Facility's Email`,
								value: 'Facility@org.com'
							}, {
								label: 'phone',
								id: 'phone',
								placeholder: `Facility's Phone Number`,
								value: '7324728901'
							}, {
								label: 'contact',
								id: 'contact',
								placeholder: `Facility's Contact Name`,
								value: 'Tim'
							}, {
								label: 'address',
								id: 'address',
								placeholder: `Facility's address`,
								value: 'Facility 4 Jim Court Eatonplace NJ 07724'
							}, {
								label: 'fax',
								id: 'fax',
								placeholder: `Facility's Fax Number`,
								value: '7324728901'
							}, {
								label: 'tax ID',
								id: 'tax',
								placeholder: `Facility's tax ID`,
								value: '732472901'
							}]
						}
					}]
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
							organization: urlID
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
				}, {
					id: 'user',
					tab: {
						title: 'Users',
						icon: {
							name: 'users'
						}
					},
					buildRequest() {
						return {
							organization: urlID
						};
					},
					list: [],
					search: '',
					loadRequest: 'user.findAll',
					searchRequest: 'user.findAll',
					actions: [{
						toggleID: 'createUser',
						title: 'Create',
						icon: {
							name: 'plus'
						},
						type: 'primary',
						modal: {
							title: 'Create User',
							actionBtn: {
								click: 'createUser',
								title: 'Save',
								type: 'primary',
								icon: {
									name: 'check'
								}
							},
							form: [{
								label: 'name',
								id: 'name',
								placeholder: `Name`,
								value: 'David Test'
							}, {
								label: 'password',
								placeholder: `password`,
								value: 'test'
							}, {
								label: 'email',
								placeholder: `email`,
								value: 'dmc2@akerna.com'
							}]
						}
					}]
				}]
			};
		},
		async onrender() {
			const source = this;
			const urlID = router.location.paths[1];
			if (!urlID) {
				return router.pushState('/organizations/');
			}
			await source.set(urlID);
			source.on({
				async '*.changeTab'(evnt, item, index) {
					console.log('Change Tab', item, index);
					await source.set('tabViews.*.opened', false);
					await source.set(`tabViews.${index}.opened`, true);
				},
				async '*.updateMain'() {
					console.log('Update Organizatiion');
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
					const results = await request('organization.update', {
						item
					});
					if (results && results.item === true) {
						createAlert({
							message: 'Organization Updated!'
						});
						await source.get('tabViews.0.loadView')();
					} else {
						createAlert({
							message: 'Organization failed to updated!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#editOrg')).hide();
					console.log(results);
				},
				async '*.createFacility'(evnt) {
					console.log('Create Facility');
					console.log(evnt.component.get());
					const context = source.get('tabViews')[1];
					const formInputs = context.actions[0].modal.form;
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
						organization: urlID,
						phone
					};
					console.log(item);
					const results = await request('facility.create', {
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'Facility created!'
						});
						await source.unshift('tabViews.1.list', results.item);
					} else {
						createAlert({
							message: 'Failed Facility creation!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#createFacility')).hide();
					console.log(results);
				},
				async '*.createProduct'() {
					console.log('Create Product');
					const context = source.get('tabViews')[2];
					const formInputs = context.actions[0].modal.form;
					const itemName = findItem(formInputs, 'name', 'label').value;
					const description = findItem(formInputs, 'description', 'label').value;
					const creator = findItem(formInputs, 'creator', 'label');
					const facility = findItem(formInputs, 'facility', 'label');
					const item = {
						name: itemName,
						description,
						creator: (creator) ? creator.value : undefined,
						organization: urlID,
						facility: (facility) ? facility.value : undefined,
					};
					const results = await request('product.create', {
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'Item created!'
						});
						await source.unshift('tabViews.2.list', results.item);
					} else {
						createAlert({
							message: 'Failed Item creation!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#createProduct')).hide();
					console.log(results);
				},
				async '*.createUser'() {
					console.log('Create User');
					const context = source.get('tabViews')[3];
					const formInputs = context.actions[0].modal.form;
					const itemName = findItem(formInputs, 'name', 'label').value;
					const email = findItem(formInputs, 'email', 'label').value;
					const password = findItem(formInputs, 'password', 'label').value;
					const item = {
						name: itemName,
						email,
						password,
						organization: urlID,
						role: 'operator'
					};
					const results = await request('organization.createUser', {
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'User created!'
						});
						await source.unshift('tabViews.3.list', results.item);
					} else {
						createAlert({
							message: 'Failed user creation!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#createUser')).hide();
					console.log(results);
				},
				async '*.deleteMain'() {
					console.log('Delete Organizatiion');
					const item = {
						_id: urlID
					};
					const results = await request('organization.remove', {
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'Organization Deleted!'
						});
						window.UIkit.modal(source.find('#deleteMain')).hide();
						router.pushState('/organizations/');
					} else {
						window.UIkit.modal(source.find('#deleteMain')).hide();
						createAlert({
							message: 'Organization failed to delete!',
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
