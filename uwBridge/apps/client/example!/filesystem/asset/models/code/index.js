(async () => {
	const {
		request,
		createAlert
	} = app;
	const codeEventsCompile = async (options) => {
		const {
			rootProp,
			source,
			batch,
		} = options;
		const role = source.get('@shared.account.role');
		const createAPI = `${role}.universal.create`;
		const generateCodesAPI = `${role}.universal.generateCodes`;
		const codeEvents = {};
		source.on({
			async '*.codes.create'() {
				console.log('Create Batch');
				const amount = source.get(`${rootProp}.create.amount`);
				const batchtArg = batch || source.get(`${rootProp}.create.batch._id`);
				const item = {
					amount,
					batch: batchtArg
				};
				await source.set('generatingCodes', true);
				const results = await request(createAPI, {
					type: 'code',
					item
				});
				await source.set('generatingCodes', false);
				if (results && results.item) {
					createAlert({
						message: 'Code created!'
					});
					source.fire('codes.generated');
					window.UIkit.modal(source.find('#createCode')).hide();
				} else {
					createAlert({
						message: 'Failed Code creation!',
						type: 'danger'
					});
				}
				console.log(results);
			},
			async '*.codes.generate'() {
				const batchtArg = batch || source.get(`${rootProp}.create.batch._id`);
				const item = {
					batch: batchtArg
				};
				const results = await request(generateCodesAPI, {
					type: 'code',
					item
				});
				if (results && results.item) {
					createAlert({
						message: 'Akerna Codes generated!'
					});
					await source.set('downloadLink', results.item.downloadLink);
					source.fire('codes.archive');
				} else {
					createAlert({
						message: 'Akerna Codes failed to generate!',
						type: 'danger'
					});
				}
				console.log(results);
			}
		});
		return codeEvents;
	};
	exports.codeEventsCompile = codeEventsCompile;
})();
