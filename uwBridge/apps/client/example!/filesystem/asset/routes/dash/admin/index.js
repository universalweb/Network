(async () => {
	const {
		request,
		component,
		utility: {
			eachObjectAsync, findItem
		},
		createAlert
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
					userCount: {
						title: 'Users'
					},
					organizationCount: {
						title: 'Organizations',
						href: '/organizations/'
					},
					facilityCount: {
						title: 'Facilities'
					},
					batchCount: {
						title: 'Batches'
					},
					codeCount: {
						title: 'Codes'
					},
					feedbackCount: {
						title: 'Feedback'
					},
					productCount: {
						title: 'Products'
					},
					campaignCount: {
						title: 'Campaigns'
					},
					scanCount: {
						title: 'Scans'
					}
				},
				actions: [{
					toggleID: 'createFullOrg',
					title: 'Add Organization & Owner',
					type: 'primary',
					icon: {
						name: 'plus'
					},
					modal: {
						title: 'Create Organization & Owner',
						actionBtn: {
							click: 'createOrganization',
							title: 'Save',
							type: 'primary',
							icon: {
								name: 'check'
							},
						},
						form: [{
							label: `User's Name`,
							id: 'username',
							placeholder: `User's Name`,
							value: 'David Test'
						}, {
							label: 'password',
							id: `password`,
							placeholder: `User's password`,
							value: 'test'
						}, {
							label: `User's Email`,
							id: `usermail`,
							placeholder: `email`,
							value: 'dmc2@akerna.com'
						}, {
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
				}, {
					toggleID: 'createNotification',
					title: 'Notify',
					type: 'primary',
					icon: {
						name: 'plus'
					},
					class: 'uk-margin-right',
					modal: {
						title: 'Notify all users',
						actionBtn: {
							click: 'createNotify',
							title: 'Send',
							type: 'primary',
							icon: {
								name: 'check'
							},
						},
						form: [{
							label: 'Message',
							id: 'message',
							placeholder: `Notification Message`,
							value: ''
						}]
					}
				}]
			};
		},
		async onrender() {
			const source = this;
			const statsResults = await request('stats.load', {});
			console.log(statsResults.results);
			await eachObjectAsync(statsResults.results, async (item, key) => {
				if ((/count/i).test(key)) {
					await source.set(`stats.${key}.count`, item);
				}
			});
			source.on({
				async '*.createOrganization'(cntxt) {
					console.log(cntxt.component.get());
					console.log('Create Organizatiion');
					const formInputs = source.get('actions.0.modal.form');
					const orgName = findItem(formInputs, 'name').value;
					const email = findItem(formInputs, 'email').value;
					const address = findItem(formInputs, 'address').value;
					const contact = findItem(formInputs, 'contact').value;
					const tax = findItem(formInputs, 'tax').value;
					const fax = findItem(formInputs, 'fax').value;
					const phone = findItem(formInputs, 'phone').value;
					const userName = findItem(formInputs, 'username').value;
					const userEmail = findItem(formInputs, 'useremail').value;
					const password = findItem(formInputs, 'password').value;
					const item = {
						user: {
							name: userName,
							email: userEmail,
							password
						},
						organization: {
							name: orgName,
							email,
							address,
							contact,
							tax,
							fax,
							phone,
						}
					};
					const results = await request('organization.createOwner', {
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
				},
				async '*.createNotify'() {
					const formInputs = source.get('actions.1.modal.form');
					const message = findItem(formInputs, 'message').value;
					const item = {
						message
					};
					const results = await request('notification.sendNow', {
						item
					});
					console.log(results);
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
