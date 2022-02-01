(async () => {
	const {
		request,
		component,
		utility: {
			findItem,
			assign,
			isNumber
		},
		createAlert,
		router
	} = app;
	const dirname = exports.dirname;
	await component({
		model: exports,
		asset: {
			template: `${dirname}template`,
			css: [`${dirname}style`],
			partials: {
				batchAttachments: `${dirname}batchAttachments`
			},
		},
		data() {
			const urlID = router.location.paths[1];
			if (!urlID || urlID.length !== 24) {
				return router.pushState('/');
			}
			const source = this;
			return {
				title: 'Product Name',
				description: 'Item description',
				tabViews: [{
					id: 'info',
					opened: true,
					tab: {
						title: 'Product Info',
						icon: {
							name: 'info'
						}
					},
					async loadView() {
						const resultsFirstLoad = await request('product.locate', {
							obj: {
								_id: urlID
							}
						});
						if (!resultsFirstLoad.item) {
							return router.pushState(`/`);
						}
						console.log(resultsFirstLoad);
						const item = resultsFirstLoad.item;
						const count = resultsFirstLoad.count || {};
						const merged = assign(item, count);
						await source.set(merged);
						await source.set('title', item.name);
						await source.set('tabViews.0.data', merged);
						const formInputs = source.get('tabViews.0.footer.actions.1.modal.form');
						findItem(formInputs, 'name', 'label').value = item.name;
						findItem(formInputs, 'description', 'label').value = item.description;
						const creator = findItem(formInputs, 'creator', 'label');
						if (creator) {
							creator.value = item.creator || '';
						}
						await source.update('tabViews.0.footer.actions.1.modal.form');
					},
					data: {},
					footer: {
						actions: [{
							toggleID: 'deleteProduct',
							title: 'Delete',
							type: 'danger',
							icon: {
								name: 'trash'
							},
							modal: {
								actionBtn: {
									click: 'deleteProduct',
									title: 'Delete',
									type: 'danger',
									icon: {
										name: 'trash'
									}
								},
								modalContent: `<p>Are you sure you want to delete this product?</p>`
							}
						}, {
							toggleID: 'editMain',
							title: 'Edit',
							type: 'primary',
							icon: {
								name: ' file-edit'
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
									placeholder: `Product's Name`,
									value: ''
								}, {
									label: 'description',
									placeholder: `Product's Description`,
									value: ''
								}]
							}
						}]
					}
				}, {
					id: 'batch',
					tab: {
						title: 'Batches',
						icon: {
							name: 'album'
						}
					},
					buildRequest() {
						return {
							product: urlID
						};
					},
					list: [],
					search: '',
					loadRequest: 'batch.findAll',
					searchRequest: 'batch.findAll',
					actions: [{
						toggleID: 'createBatch',
						title: 'Create',
						icon: {
							name: 'album'
						},
						type: 'primary',
						modal: {
							title: 'Create Batch',
							actionBtn: {
								click: 'createBatch',
								title: 'Save',
								type: 'primary',
								icon: {
									name: 'plus'
								}
							},
							partialsAppend: [{
								name: 'batchAttachments',
								body: source.partials.batchAttachments
							}],
							form: [{
								label: 'name',
								placeholder: `Name of this batch`,
								value: 'Example Title Dummy Text'
							}, {
								label: 'description',
								placeholder: `Describe this batch`,
								input: 'textarea',
								value: 'Example Description Dummy Text'
							}, {
								label: 'quantity',
								placeholder: `Amount of codes to create`,
								value: 5
							}]
						}
					}, {
						toggleID: 'csvToBatch',
						title: 'CSV',
						icon: {
							name: 'file-text'
						},
						type: 'secondary',
						class: 'uk-margin-left',
						modal: {
							title: 'Create Batch from CSV',
							actionBtn: {
								click: 'csvToBatch',
								title: 'Save',
								type: 'primary',
								icon: {
									name: 'check'
								}
							},
							partialsAppend: [{
								name: 'batchAttachments',
								body: source.partials.batchAttachments
							}],
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
					console.log('Update Product');
					const formInputs = source.get('tabViews.0.footer.actions.1.modal.form');
					const itemName = findItem(formInputs, 'name', 'label').value;
					const description = findItem(formInputs, 'description', 'label').value;
					const item = {
						name: itemName,
						description,
						_id: urlID
					};
					const results = await request('product.update', {
						item
					});
					if (results && results.item === true) {
						createAlert({
							message: 'Item Updated!'
						});
						await source.get('tabViews.0.loadView')();
					} else {
						createAlert({
							message: 'Item failed to updated!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#editMain')).hide();
					console.log(results);
				},
				async '*.deleteProduct'() {
					console.log('Delete product');
					const organization = source.get('organization');
					const facility = source.get('facility');
					const item = {
						_id: urlID
					};
					const results = await request('product.remove', {
						organization,
						facility,
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'Product Deleted!'
						});
						window.UIkit.modal(source.find('#deleteProduct')).hide();
						const rootFolder = (facility) ? 'facility' : 'organization';
						const endFolder = (facility) ? facility : organization;
						router.pushState(`/${rootFolder}/${endFolder}`);
					} else {
						window.UIkit.modal(source.find('#deleteProduct')).hide();
						createAlert({
							message: 'Product failed to delete!',
							type: 'danger'
						});
					}
					console.log(results);
				},
				async '*.createBatch'(context) {
					console.log('Create Batch', context);
					const organization = source.get('organization');
					const facility = source.get('facility');
					const formInputs = source.get('tabViews.1.actions.0.modal.form');
					const batchName = findItem(formInputs, 'name', 'label').value;
					const description = findItem(formInputs, 'description', 'label').value;
					const amount = Number(findItem(formInputs, 'quantity', 'label').value);
					if (!amount || !isNumber(amount)) {
						return createAlert({
							message: 'Please use numbers only for batch amount.',
							type: 'danger'
						});
					}
					const item = {
						organization,
						facility,
						amount,
						product: urlID,
						name: batchName,
						description
					};
					console.log(item);
					await source.set('tabViews.1.creatingBatches', true);
					const results = await request('batch.create', {
						item
					});
					await source.set('tabViews.1.creatingBatches', false);
					if (results && results.item) {
						createAlert({
							message: 'batches created!'
						});
						await source.get('tabViews.1').reloadView();
					} else {
						createAlert({
							message: 'batches creation failed!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#createBatch')).hide();
					console.log(results);
				},
				async '*.createCodes'(context) {
					console.log('Create Code', context);
					const organization = source.get('organization');
					const facility = source.get('facility');
					const formInputs = source.get('tabViews.1.actions.1.modal.form');
					const amount = Number(findItem(formInputs, 'quantity', 'label').value);
					if (!amount || !isNumber(amount)) {
						return createAlert({
							message: 'Please use numbers only for batch amount.',
							type: 'danger'
						});
					}
					const item = {
						product: urlID,
						organization,
						facility
					};
					console.log(item);
					await source.set('creatingCodes', true);
					const results = await request('code.createMany', {
						amount,
						item
					});
					await source.set('creatingCodes', false);
					if (results && results.item) {
						createAlert({
							message: 'products created!'
						});
						await source.get('tabViews.1').reloadView();
					} else {
						createAlert({
							message: 'products creation failed!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#createCodes')).hide();
					console.log(results);
				}
			});
		},
	});
	exports.compile = () => {};
})();
