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
		asset: {
			template: `${dirname}template`,
			css: [`${dirname}style`],
		},
		data() {
			const account = app.view.get('@shared.account');
			// const source = this;
			const urlID = account._id;
			if (!urlID || urlID.length !== 24) {
				return router.pushState('/');
			}
			return {
				canEdit() {
					return true;
				},
				title: 'Settings',
				modal: {
					edit: {
						actionBtn: {
							click: 'updateMain',
							title: 'Update',
							type: 'primary',
							icon: {
								name: 'check'
							}
						},
						form: [{
							label: 'name',
							placeholder: `Name`,
							value: ''
						}, {
							label: 'email',
							placeholder: `Email`,
							value: ''
						}, {
							label: 'password',
							placeholder: `Password`,
							value: ''
						}]
					},
					delete: {
						actionBtn: {
							click: 'deleteMain',
							title: 'DELETE',
							type: 'danger',
							icon: {
								name: 'trash'
							}
						}
					}
				}
			};
		},
		async onrender() {
			const source = this;
			const account = app.view.get('@shared.account');
			const urlID = account._id;
			async function loadMain() {
				const resultsFirstLoad = await request('universal.me', {
					item: {
						_id: urlID,
					}
				});
				if (!resultsFirstLoad.item) {
					return router.pushState(`/`);
				}
				console.log(resultsFirstLoad);
				const item = resultsFirstLoad.item;
				await source.set('title', item.name);
				await source.set('role', item.role);
				await source.set(item);
				const formInputs = source.get('modal.edit.form');
				findItem(formInputs, 'name', 'label').value = item.name;
				findItem(formInputs, 'email', 'label').value = item.email;
				await source.update('modal.edit.form');
			}
			await source.set(urlID);
			source.on({
				async '*.updateMain'() {
					console.log('Update User');
					const formInputs = source.get('modal.edit.form');
					const itemName = findItem(formInputs, 'name', 'label').value;
					const email = findItem(formInputs, 'email', 'label').value;
					const password = findItem(formInputs, 'password', 'label').value;
					const item = {
						name: itemName,
						email,
						password,
						_id: urlID
					};
					const results = await request('user.update', {
						item
					});
					if (results && results.item === true) {
						createAlert({
							message: 'User Updated!'
						});
						await loadMain();
					} else {
						createAlert({
							message: 'User failed to updated!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find('#editMain')).hide();
					console.log(results);
				},
				async '*.deleteMain'() {
					console.log('Delete User');
					const organization = source.get('organization');
					const item = {
						organization,
						_id: urlID
					};
					const results = await request('organization.deleteUser', {
						item
					});
					if (results && results.item) {
						createAlert({
							message: 'User Deleted!'
						});
						window.UIkit.modal(source.find('#deleteMain')).hide();
						router.pushState(`/organization/${organization}`);
					} else {
						window.UIkit.modal(source.find('#deleteMain')).hide();
						createAlert({
							message: 'User failed to delete!',
							type: 'danger'
						});
					}
					console.log(results);
				}
			});
			await loadMain();
		},
	});
	exports.compile = () => {
	};
})();
