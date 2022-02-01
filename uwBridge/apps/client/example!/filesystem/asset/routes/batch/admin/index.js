(async () => {
	const {
		request,
		component,
		utility: { findItem },
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
				title: 'Batch Name',
				description: 'Item description',
				tabViews: [{
					id: 'info',
					opened: true,
					tab: {
						title: 'Batch Info',
						icon: {
							name: 'info'
						}
					},
					async loadView() {
						const resultsFirstLoad = await request('batch.locate', {
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
						await source.set('tabViews.0.data', merged);
						const formInputs = source.get('tabViews.0.footer.actions.1.modal.form');
						findItem(formInputs, 'name', 'label').value = item.name;
						findItem(formInputs, 'description', 'label').value = item.description;
						await source.update('tabViews.0.footer.actions.1.modal.form');
					},
					data: {},
					footer: {
						actions: [{
							toggleID: 'deleteBatch',
							title: 'Delete',
							type: 'danger',
							icon: {
								name: 'trash'
							},
							modal: {
								actionBtn: {
									click: 'deleteBatch',
									title: 'Delete',
									type: 'danger',
									icon: {
										name: 'trash'
									}
								},
								modalContent: `<p>Are you sure you want to delete this batch?</p>`
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
									id: 'name',
									placeholder: `Batch's Name`,
									value: ''
								}, {
									label: 'description',
									id: 'description',
									placeholder: `Batch's Description`,
									value: ''
								}]
							}
						}]
					}
				}, {
					id: 'code',
					tab: {
						title: 'Codes',
						icon: {
							name: 'fa-qrcode'
						}
					},
					buildRequest() {
						return {
							batch: urlID
						};
					},
					list: [],
					search: '',
					loadRequest: 'code.findAll',
					searchRequest: 'code.findAll',
					actions: [{
						toggleID: 'addCodes',
						title: 'Add',
						icon: {
							name: 'plus'
						},
						type: 'primary',
						modal: {
							title: 'Add More Codes',
							actionBtn: {
								click: 'addCodes',
								title: 'create',
								type: 'primary',
								icon: {
									name: 'save'
								}
							},
							form: [{
								label: 'amount',
								id: 'amount',
								placeholder: `Amount of codes to create`,
								value: 5
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
					console.log('Update Batch');
					const formInputs = source.get('tabViews.0.footer.actions.1.modal.form');
					const itemName = findItem(formInputs, 'name').value;
					const description = findItem(formInputs, 'description').value;
					const item = {
						name: itemName,
						description,
						_id: urlID
					};
					const results = await request('batch.update', {
						item
					});
					if (results && results.item === true) {
						createAlert({
							message: 'Batch Updated!'
						});
						await source.get('tabViews.0.loadView')();
					} else {
						createAlert({
							message: 'Batch failed to updated!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#editMain')).hide();
					console.log(results);
				},
				async '*.deleteBatch'() {
					console.log('Delete product');
					const organization = source.get('organization');
					const facility = source.get('facility');
					const item = {
						_id: urlID
					};
					const results = await request('batch.remove', {
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'Batch Deleted!'
						});
						window.UIkit.modal(source.find('#deleteBatch')).hide();
						const rootFolder = (facility) ? 'facility' : 'organization';
						const endFolder = (facility) ? facility : organization;
						router.pushState(`/${rootFolder}/${endFolder}`);
					} else {
						window.UIkit.modal(source.find('#deleteBatch')).hide();
						createAlert({
							message: 'Batch failed to delete!',
							type: 'danger'
						});
					}
					console.log(results);
				},
				async '*.addCodes'(context) {
					console.log('Add More Codes', context);
					const formInputs = source.get('tabViews.1.actions.0.modal.form');
					const amount = Number(findItem(formInputs, 'amount').value);
					if (!amount || amount <= 0) {
						return createAlert({
							message: 'Please use numbers only for amount.',
							type: 'danger'
						});
					}
					const item = {
						_id: urlID
					};
					console.log(item);
					await source.set('creatingCodes', true);
					const results = await request('batch.addCodes', {
						amount,
						item
					});
					await source.set('creatingCodes', false);
					if (results && results.item) {
						createAlert({
							message: 'Codes created!'
						});
						await source.get('tabViews.1').reloadView();
					} else {
						createAlert({
							message: 'Codes creation failed!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#addCodes')).hide();
					console.log(results);
				}
			});
		},
	});
	exports.compile = () => {};
})();
