(async () => {
	const {
		request,
		utility: {
			pick,
			eachAsync,
			debounce,
			upperFirst,
			compactMapObject,
			isPlainObject,
			hasValue,
			objectSize,
			last,
			clear,
			mapArray,
			eachArray
		},
		router,
		createAlert
	} = app;
	import { dragEvents } from 'models/dragDrop/index.js';
	import { feed } from 'models/feed/index.js';
	import { buildUploadEvents, upload } from 'models/upload/index.js';
	console.log(dragEvents, feed);
	const csvHeaders = {
		field1: 'name',
		field2: 'description',
		field3: 'html',
		field4: 'homepage',
		field5: 'releaseDate',
		field6: 'productAgeRestriction',
		field7: 'images',
		field8: 'attachments',
		field9: 'headers',
	};
	function grabInputs(rootProp, source, product, facility, organization, batch, code, _id) {
		console.log(rootProp, source, product, facility, organization, batch, code, _id);
		const productName = source.get(`${rootProp}.name`);
		const title = source.get(`${rootProp}.title`);
		const description = source.get(`${rootProp}.description`);
		const productHtml = source.get(`${rootProp}.html`);
		const message = source.get(`${rootProp}.message`);
		const homepage = source.get(`${rootProp}.homepage`);
		const releaseDate = source.get(`${rootProp}.releasedate`);
		const x = source.get(`${rootProp}.label.x`) || 0;
		const y = source.get(`${rootProp}.label.y`) || 0;
		const qrColor = source.get(`${rootProp}.qrColor`);
		const qrBackground = source.get(`${rootProp}.qrBackground`);
		const qrSize = source.get(`${rootProp}.qrSize`);
		const ageRestriction = source.get(`${rootProp}.ageRestriction`);
		const startDate = source.get(`${rootProp}.startDate`);
		const endDate = source.get(`${rootProp}.endDate`);
		const ageStart = source.get(`${rootProp}.ageStart`);
		const ageEnd = source.get(`${rootProp}.ageEnd`);
		const questions = source.get(`${rootProp}.questions`);
		const email = source.get(`${rootProp}.email`);
		const contact = source.get(`${rootProp}.contact`);
		const address = source.get(`${rootProp}.address`);
		const password = source.get(`${rootProp}.password`);
		const phone = source.get(`${rootProp}.phone`);
		const confirmPassword = source.get(`${rootProp}.confirmPassword`);
		const gender = source.get(`${rootProp}.gender`);
		const gendered = source.get(`${rootProp}.gendered`);
		const username = source.get(`${rootProp}.username`);
		const birthday = source.get(`${rootProp}.birthday`);
		let products = source.get(`${rootProp}.products`);
		const firstName = source.get(`${rootProp}.firstName`);
		const lastName = source.get(`${rootProp}.lastName`);
		const fullName = source.get(`${rootProp}.fullName`);
		const productObject = source.get(`${rootProp}.product`);
		let productArg = (hasValue(productObject)) ? source.get(`${rootProp}.product`) : product;
		const batchObject = source.get(`${rootProp}.batch`);
		let batchArg = (hasValue(batchObject)) ? batchObject : batch;
		const codeObject = source.get(`${rootProp}.product`);
		let codeArg = (hasValue(codeObject)) ? codeObject : code;
		const facilityObject = source.get(`${rootProp}.facility`);
		let facilityArg = (hasValue(facilityObject)) ? facilityObject : facility;
		const organizationObject = source.get(`${rootProp}.organization`);
		let organizationArg = (hasValue(batchObject)) ? organizationObject : organization;
		const feedbackArg = source.get(`${rootProp}.feedback`);
		const display = source.get(`${rootProp}.display`);
		const amount = source.get(`${rootProp}.amount`);
		const tax = source.get(`${rootProp}.tax`);
		const fax = source.get(`${rootProp}.fax`);
		if (isPlainObject(productArg) && objectSize(productArg)) {
			productArg = productArg._id;
		} else if (product) {
			productArg = product;
		}
		if (isPlainObject(batchArg) && objectSize(batchArg)) {
			batchArg = batchArg._id;
		} else if (batch) {
			batchArg = batch;
		}
		if (isPlainObject(codeArg) && objectSize(codeArg)) {
			codeArg = codeArg._id;
		} else if (code) {
			codeArg = code;
		}
		if (isPlainObject(facilityArg) && objectSize(facilityArg)) {
			facilityArg = facilityArg._id;
		} else if (facility) {
			facilityArg = product;
		}
		if (isPlainObject(organizationArg) && objectSize(organizationArg)) {
			organizationArg = organizationArg._id;
		} else if (organization) {
			organizationArg = organization;
		}
		if (confirmPassword) {
			if (password !== confirmPassword) {
				console.log(`Password doesn't match`);
			}
		}
		if (products) {
			products = mapArray(products, (productItem) => {
				return productItem._id;
			});
		}
		const item = compactMapObject({
			amount,
			product: productArg,
			batch: batchArg,
			name: productName,
			title,
			username,
			description,
			html: productHtml,
			message,
			facility: facilityArg,
			organization: organizationArg,
			firstName,
			lastName,
			fullName,
			products,
			email,
			phone,
			contact,
			address,
			tax,
			fax,
			password,
			birthday,
			gender,
			gendered,
			homepage,
			releaseDate,
			ageRestriction,
			qrSize,
			qrBackground,
			qrColor,
			ageStart,
			ageEnd,
			startDate,
			endDate,
			questions,
			feedback: feedbackArg,
			display,
			label: {
				x,
				y
			},
			_id
		}, (value) => {
			return value;
		});
		console.log(item);
		return item;
	}
	const eventsCompile = async (options) => {
		const {
			rootProp,
			source,
			_id,
			type,
			product,
			batch,
			campaign,
			feedback,
			facility,
			organization,
			code,
			hash
		} = options;
		const role = source.get('@shared.account.role') || 'open';
		// const creator = source.get('@shared.account._id');
		const loadingAttachmentsProp = `${rootProp}.create.loadingAttachments`;
		const queuedAttachmentsProp = `${rootProp}.create.attachments`;
		const csvReadyQueueProp = `${rootProp}.create.csv.readyQueue`;
		const loadingCSVProp = `${rootProp}.create.csv.loading`;
		const searchProp = `${rootProp}.search`;
		const oldSearchProp = `${rootProp}.oldSearch`;
		const moreProp = `${rootProp}.loadMoreId`;
		const feedProp = `${rootProp}.feed`;
		const feedAPI = `${role}.universal.feed`;
		const findAPI = `${role}.universal.locate`;
		const imageAPI = `${role}.universal.image`;
		const removeAPI = `${role}.universal.remove`;
		const createAPI = `${role}.universal.create`;
		const editAPI = `${role}.universal.edit`;
		const events = {};
		await source.set(rootProp, {
			current: {},
			create: {
				csv: {
					readyQueue: [],
				},
				label: {
					path: '',
				},
				logo: '',
				display: {
					product: {
						all: true
					},
					batch: {
						all: true
					},
					organization: {
						all: true
					}
				},
				feedback: [],
				product: {},
				batch: {},
				productsFeed: [],
				question: {
					title: '',
					options: []
				}
			},
			edit: {
				attachments: [],
				images: [],
				csv: {
					readyQueue: [],
				},
				label: {
					path: ''
				},
				logo: '',
				display: {
					product: {
						all: true
					},
					batch: {
						all: true
					},
					organization: {
						all: true
					}
				},
				product: {},
				batch: {},
				productsFeed: [],
				question: {
					title: '',
					options: []
				}
			},
			feed: [],
			vars: {
				loadingAttachmentsProp,
				queuedAttachmentsProp,
				csvReadyQueueProp,
				loadingCSVProp,
				searchProp,
				oldSearchProp,
				moreProp,
				feedProp,
			}
		});
		await source.update(rootProp);
		events.search = async () => {
			const results = await feed.search(feedAPI, {
				type,
				searchProp,
				feedProp,
				moreProp,
				debounced: events.searchDebounce,
				source,
				product,
				batch,
				campaign,
				feedback,
				facility,
				code,
				organization,
			});
			return results;
		};
		events.searchDebounce = debounce(events.search, 500);
		events.loadMain = async function(fresh) {
			const results = await feed.load(feedAPI, {
				type,
				searchProp,
				feedProp,
				moreProp,
				debounced: events.searchDebounce,
				fresh,
				source,
				product,
				batch,
				campaign,
				feedback,
				facility,
				code,
				organization,
			});
			return results;
		};
		events.loadPage = async () => {
			if (!hash && (!_id || _id.length !== 24)) {
				return router.pushState('/');
			}
			const resultsFirstLoad = await request(findAPI, {
				type,
				item: {
					_id,
					hash
				}
			});
			console.log('Load Page', resultsFirstLoad);
			if (!resultsFirstLoad.item) {
				return router.pushState(`/`);
			}
			const item = resultsFirstLoad.item;
			if (item && item.productData && item.productData.answers) {
				console.log(item.productData);
				eachArray(item.productData.answers.answers, (answers, index) => {
					console.log(answers, item.productData.questions[index].options[answers]);
					item.productData.questions[index].options[answers].active = true;
				});
			}
			if (item && item.organizationData && item.organizationData.answers) {
				console.log(item.organizationData);
				eachArray(item.organizationData.answers.answers, (answers, index) => {
					console.log(answers, item.organizationData.questions[index].options[answers]);
					item.organizationData.questions[index].options[answers].active = true;
				});
			}
			if (item && item.batchData && item.batchData.answers) {
				console.log(item.batchData);
				eachArray(item.batchData.answers.answers, (answers, index) => {
					console.log(answers, item.batchData.questions[index].options[answers]);
					item.batchData.questions[index].options[answers].active = true;
				});
			}
			if (item && item.facilityData && item.facilityData.answers) {
				console.log(item.facilityData);
				eachArray(item.facilityData.answers.answers, (answers, index) => {
					console.log(answers, item.facilityData.questions[index].options[answers]);
					item.facilityData.questions[index].options[answers].active = true;
				});
			}
			await source.set(`${rootProp}.current`, item);
			await source.set(`${rootProp}.edit`, item);
			await source.update(`${rootProp}.current`);
		};
		if (_id || hash) {
			events.loadPage();
		}
		source.on({
			async [`*.${type}.search`](context) {
				console.log(context);
				const newVal = source.get(searchProp);
				const oldSearch = source.get(oldSearchProp);
				if (newVal === oldSearch) {
					return;
				}
				await source.set(oldSearchProp, newVal);
				if (!newVal.trim()) {
					return events.loadMain(true);
				}
				await source.clearArray(feedProp);
				await source.set(moreProp, false);
				events.searchDebounce();
			},
			async [`*.${type}.loadMore`](context) {
				console.log(context);
				const searchCriteria = source.get(searchProp);
				if (searchCriteria && searchCriteria.length > 0) {
					await events.search();
				} else {
					await events.loadMain();
				}
			},
			async [`*.${type}.create.load`](context, args) {
				const [propName, dataObject, modalId] = args;
				console.log(context, dataObject.get(), dataObject);
				await source.set(propName, dataObject.get());
				await source.update(propName);
				if (modalId) {
					window.UIkit.modal(source.find(`#${modalId}`)).show();
				}
			},
			[`*.${type}.create.csv.drop`](context) {
				const {
					original, node
				} = context;
				original.preventDefault();
				original.stopPropagation();
				dragEvents.dropCSV(original, node, csvHeaders, async (result) => {
					console.log(result);
					await source.push(csvReadyQueueProp, ...result);
				});
				return false;
			},
			async [`*.${type}.create.csv.load`](context) {
				await source.set(loadingCSVProp, true);
				console.log(context);
				const result = await dragEvents.loadCSV(context.node, csvHeaders);
				await source.push(csvReadyQueueProp, ...result);
				await source.set(loadingCSVProp, false);
			},
			async [`*.${type}.create.csv.clear`]() {
				await source.clearArray(csvReadyQueueProp);
			},
			async [`*.${type}.create.csv`]() {
				console.log('Create CSV');
				const csvProducts = source.get(csvReadyQueueProp);
				if (csvProducts.length) {
					const completed = [];
					await eachAsync(csvProducts, async (file, index) => {
						const {
							name: productName,
							description,
							html: productHtml,
							homepage,
							releaseDate
						} = file;
						const item = {
							name: productName,
							description,
							html: productHtml,
							homepage,
							releaseDate
						};
						const results = await request(createAPI, {
							type,
							item
						});
						completed.push(results);
						console.log(`File ${index} complete`);
					});
					await source.clearArray(csvReadyQueueProp);
					if (completed.length) {
						createAlert({
							message: `#${completed.length} items have been created!`
						});
						await events.loadMain(true);
					} else {
						createAlert({
							message: 'Failed item creation!',
							type: 'danger'
						});
					}
					window.UIkit.modal(source.find(`#createCsv${upperFirst(type)}`)).hide();
				}
			},
			[`*.${type}.create.moved *.${type}.edit.moved`](context) {
				const {
					original, node
				} = context;
				original.preventDefault();
				original.stopPropagation();
				const parentPath = node.getAttribute('data-keypath');
				const ogArray = context.get(parentPath);
				const newArray = [];
				console.log(context, parentPath, context.get(parentPath));
				eachArray(node.childNodes, (item, index) => {
					console.log(item);
					const keypathIndex = last(item.getAttribute('data-keypath').split('.'));
					newArray[index] = ogArray[keypathIndex];
					// await source.splice(parentPath, current, 1);
					console.log(parentPath, keypathIndex, index);
				});
				clear(ogArray);
				ogArray.push(...newArray);
				console.log(ogArray);
				context.updateModel(parentPath);
			},
			async [`*.${type}.edit.searchProducts`](context) {
				const { value: search, } = context.get();
				console.log(search);
				if (search.length < 1) {
					await source.set(`${rootProp}.edit.productsFeed`, []);
					return false;
				}
				const results = await request(`${role}.universal.feed`, {
					type: 'product',
					search
				});
				console.log(results);
				await source.set(`${rootProp}.edit.productsFeed`, results.items);
			},
			async [`*.${type}.select.feedback`](context) {
				const { node } = context;
				const parentPath = node.getAttribute('data-keypath');
				console.log(parentPath);
				console.log(node.selectedIndex);
				const selectedIndex = node.selectedIndex;
				eachArray(context.get(`${parentPath}.options`), (item, index) => {
					console.log(item, index);
					if (index === selectedIndex) {
						item.active = true;
					} else {
						item.active = false;
					}
				});
				context.update(`${parentPath}.options`);
			},
			async [`*.${type}.feedback.create`](context) {
				const productId = source.get(`code.current.productData._id`);
				const codeId = source.get(`code.current._id`);
				const productQuestions = source.get(`code.current.productData.questions`) || [];
				const productAnswers = [];
				eachArray(productQuestions, (question) => {
					eachArray(question.options, (answer, index) => {
						if (answer.active) {
							productAnswers.push(index);
						}
					});
				});
				if (productAnswers.length === 0 && productQuestions.length > 0) {
					productAnswers.push(0);
				}
				console.log(productAnswers);
				const productFeedBackResults = await request(`${role}.universal.create`, {
					type: 'feedback',
					item: {
						product: productId,
						answers: productAnswers,
						code: codeId
					}
				});
				console.log(productFeedBackResults);
				const batchId = source.get(`code.current.batchData._id`);
				const batchQuestions = source.get(`code.current.batchData.questions`) || [];
				const batchAnswers = [];
				eachArray(batchQuestions, (question) => {
					eachArray(question.options, (answer, index) => {
						if (answer.active) {
							batchAnswers.push(index);
						}
					});
				});
				if (batchAnswers.length === 0 && batchQuestions.length > 0) {
					batchAnswers.push(0);
				}
				console.log('Batch Answers', batchAnswers);
				if (batchAnswers.length) {
					const batchBackResults = await request(`${role}.universal.create`, {
						type: 'feedback',
						item: {
							batch: batchId,
							code: codeId,
							answers: batchAnswers
						}
					});
					console.log(batchBackResults);
				}
				const organizationId = source.get(`code.current.organizationData._id`);
				const organizationQuestions = source.get(`code.current.organizationData.questions`) || [];
				const organizationAnswers = [];
				eachArray(organizationQuestions, (question) => {
					eachArray(question.options, (answer, index) => {
						if (answer.active) {
							organizationAnswers.push(index);
						}
					});
				});
				if (organizationAnswers.length === 0 && organizationQuestions.length > 0) {
					organizationAnswers.push(0);
				}
				if (organizationAnswers.length) {
					const organizationBackResults = await request(`${role}.universal.create`, {
						type: 'feedback',
						item: {
							organization: organizationId,
							code: codeId,
							answers: organizationAnswers
						}
					});
					console.log(organizationBackResults);
				}
				console.log(organizationAnswers);
				const facilityId = source.get(`code.current.facilityData._id`);
				const facilityQuestions = source.get(`code.current.facilityData.questions`) || [];
				const facilityAnswers = [];
				eachArray(facilityQuestions, (question) => {
					eachArray(question.options, (answer, index) => {
						if (answer.active) {
							facilityAnswers.push(index);
						}
					});
				});
				if (facilityAnswers.length === 0 && facilityQuestions.length > 0) {
					facilityAnswers.push(0);
				}
				console.log(facilityAnswers);
				if (facilityAnswers.length) {
					const facilityBackResults = await request(`${role}.universal.create`, {
						type: 'feedback',
						item: {
							facility: facilityId,
							code: codeId,
							answers: facilityAnswers
						}
					});
					console.log(facilityBackResults);
				}
				console.log(productId, productQuestions);
				console.log(batchId, batchQuestions);
				console.log(organizationId, organizationQuestions);
				console.log(facilityId, facilityQuestions);
				console.log(context);
				window.UIkit.modal(source.find(`#createFeedback`)).hide();
				createAlert({
					message: 'Feedback submitted'
				});
			},
			async [`*.${type}.edit.addProduct`](context) {
				const data = context.get();
				await source.push(`${rootProp}.edit.products`, data);
				const products = source.get(`${rootProp}.edit.products`);
				console.log(data);
				const results = await request(`${role}.universal.edit`, {
					type: 'campaign',
					item: {
						_id,
						products: mapArray(products, (productItem) => {
							return productItem._id;
						})
					}
				});
				console.log(results);
			},
			async [`*.${type}.edit.removeProduct`](context, kypath, indx) {
				console.log(context.get(), kypath, indx);
				const item = source.get(`${rootProp}.edit.products.${indx}`);
				await source.splice(`${rootProp}.edit.products`, indx, 1);
				const products = source.get(`${rootProp}.edit.products`);
				console.log(item);
				const results = await request(`${role}.universal.edit`, {
					type: 'campaign',
					item: {
						_id,
						products: mapArray(products, (productItem) => {
							return productItem._id;
						})
					}
				});
				console.log(results);
			},
			async [`*.${type}.create.searchProducts`](context) {
				const { value: search, } = context.get();
				console.log(search);
				if (search.length < 1) {
					await source.set(`${rootProp}.create.productsFeed`, []);
					return false;
				}
				const results = await request(`${role}.universal.feed`, {
					type: 'product',
					search
				});
				console.log(results);
				await source.set(`${rootProp}.create.productsFeed`, results.items);
			},
			async [`*.${type}.create.addProduct`](context) {
				const data = context.get();
				await source.push(`${rootProp}.create.products`, data);
			},
			async [`*.${type}.create.removeProduct`](context, kypath, indx) {
				console.log(context.get(), kypath, indx);
				await source.splice(`${rootProp}.create.products`, indx, 1);
			},
			async [`*.${type}.create.question`](context) {
				const { event: componentEvent } = context;
				const { value: title, } = context.get();
				console.log(context.get());
				if (componentEvent.key === 'Enter') {
					if (title.length < 1) {
						return false;
					}
					await source.push(`${rootProp}.create.questions`, {
						title,
						options: [],
						value: '',
					});
					await context.set('value', '');
				}
			},
			async [`*.${type}.edit.question`](context) {
				const { event: componentEvent } = context;
				const { value: title, } = context.get();
				console.log(context.get());
				if (componentEvent.key === 'Enter') {
					if (title.length < 1) {
						return false;
					}
					await source.push(`${rootProp}.edit.questions`, {
						title,
						options: [],
						value: '',
					});
					await context.set('value', '');
				}
			},
			async [`*.${type}.create.answer *.${type}.edit.answer`](context) {
				const { event: componentEvent } = context;
				const {
					value: title,
					keypath: path
				} = context.get();
				console.log(path);
				if (componentEvent.key === 'Enter') {
					if (title.length < 1) {
						return false;
					}
					await source.push(`${path}.options`, {
						title,
					});
					await source.set(`${path}.value`, '');
				}
			},
			async [`*.${type}.create.removeQuestion`](context, kypath, indx) {
				console.log(context.get(), kypath, indx);
				await source.splice(`${rootProp}.create.questions`, indx, 1);
			},
			async [`*.${type}.edit.removeQuestion`](context, kypath, indx) {
				console.log(context.get(), kypath, indx);
				await source.splice(`${rootProp}.edit.questions`, indx, 1);
			},
			async [`*.${type}.create.removeAnswer`](context, kypath) {
				console.log(context.get());
				const full = kypath.split('.');
				const current = full.pop();
				await source.splice(full.join('.'), current, 1);
			},
			async [`*.${type}.edit.removeAnswer`](context, kypath) {
				console.log(context.get());
				const full = kypath.split('.');
				const current = full.pop();
				await source.splice(full.join('.'), current, 1);
			},
			async [`*.${type}.create`]() {
				console.log('Create Universal');
				const item = grabInputs(`${rootProp}.create`, source, product, facility, organization, batch, code, _id);
				const results = await request(createAPI, {
					type,
					item
				});
				if (results && results.item) {
					if (source.get(`${rootProp}.create.attachments`)) {
						results.item.attachments.push((await upload.image(imageAPI, source.get(`${rootProp}.create.attachments`), 2, results.item._id, type)).items);
					}
					if (source.get(`${rootProp}.create.images`)) {
						results.item.images.push((await upload.image(imageAPI, source.get(`${rootProp}.create.images`), 1, results.item._id, type)).items);
					}
					if (source.get(`${rootProp}.create.label.path`)) {
						results.item.label.path = (await upload.imageSingle(imageAPI, source.get(`${rootProp}.create.label.path`), 5, results.item._id, type)).items;
					}
					if (source.get(`${rootProp}.create.logo`)) {
						results.item.logo = (await upload.imageSingle(imageAPI, source.get(`${rootProp}.create.logo`), 6, results.item._id, type)).items;
					}
					if (source.get(`${rootProp}.create.avatar`)) {
						results.item.logo = (await upload.imageSingle(imageAPI, source.get(`${rootProp}.create.logo`), 7, results.item._id, type)).items;
					}
					createAlert({
						message: 'Item created!'
					});
					await source.syncCollection(feedProp, results.item, 'unshift', '_id');
					source.fire(`${type}.created`);
				} else {
					createAlert({
						message: 'Failed item creation!',
						type: 'danger'
					});
				}
				window.UIkit.modal(source.find(`#create${upperFirst(type)}`)).hide();
				console.log(results);
			},
			async [`*.${type}.edit`]() {
				console.log('Edit', type);
				const item = grabInputs(`${rootProp}.edit`, source, product, facility, organization, batch, code, _id);
				console.log('Edit', item, type);
				const results = await request(editAPI, {
					type,
					item
				});
				if (results && results.item) {
					if (source.get(`${rootProp}.edit.attachments`)) {
						await upload.image(imageAPI, source.get(`${rootProp}.edit.attachments`), 2, _id, type);
					}
					if (source.get(`${rootProp}.edit.images`)) {
						await upload.image(imageAPI, source.get(`${rootProp}.edit.images`), 1, _id, type);
					}
					if (source.get(`${rootProp}.edit.label.path`)) {
						await upload.imageSingle(imageAPI, source.get(`${rootProp}.edit.label.path`), 5, _id, type);
					}
					if (source.get(`${rootProp}.edit.logo`)) {
						await upload.imageSingle(imageAPI, source.get(`${rootProp}.edit.logo`), 6, _id, type);
					}
					if (source.get(`${rootProp}.edit.avatar`)) {
						await upload.imageSingle(imageAPI, source.get(`${rootProp}.edit.avatar`), 7, _id, type);
					}
					console.log(results);
					createAlert({
						message: 'Edit successful!'
					});
					source.fire(`${type}.edited`);
				} else {
					createAlert({
						message: 'Failed to edit!',
						type: 'danger'
					});
				}
				window.UIkit.modal(source.find(`#edit${upperFirst(type)}`)).hide();
				console.log(results);
			},
			async [`*.${type}.remove`](contex, dataObject) {
				console.log('Delete Item');
				const removeId = _id || pick(dataObject, ['_id']);
				const results = await request(removeAPI, {
					type,
					item: {
						_id: removeId,
						hash
					}
				});
				if (results && results.item.deletedCount) {
					createAlert({
						message: `Removed ${results.item.deletedCount} ${$.upperCase(type)}!`
					});
					window.UIkit.modal(source.find(`#remove${upperFirst(type)}`)).hide();
					await source.removeIndex(feedProp, _id, 'unshift', '_id');
					console.log(`${type}.removed`);
					source.fire(`${type}.removed`, dataObject);
				} else {
					createAlert({
						message: `${type} failed to delete!`,
						type: 'danger'
					});
				}
				console.log(results);
			}
		});
		await buildUploadEvents({
			source,
			rootProp: `${rootProp}.create`,
			imageAPI,
			imageType: 1,
			itemType: 'image',
		});
		await buildUploadEvents({
			source,
			rootProp: `${rootProp}.create`,
			imageAPI,
			imageType: 2,
			itemType: 'attachment',
		});
		await buildUploadEvents({
			source,
			rootProp: `${rootProp}.create`,
			imageAPI,
			imageType: 5,
			singleObject: true,
			itemType: 'label',
		});
		await buildUploadEvents({
			source,
			rootProp: `${rootProp}.create`,
			imageAPI,
			imageType: 6,
			single: true,
			itemType: 'logo',
		});
		await buildUploadEvents({
			source,
			rootProp: `${rootProp}.edit`,
			imageAPI,
			imageType: 1,
			itemType: 'image',
			type,
			removeQuery(query) {
				query.item._id = source.get(`${rootProp}.edit._id`);
				return query;
			}
		});
		await buildUploadEvents({
			source,
			rootProp: `${rootProp}.edit`,
			imageAPI,
			imageType: 2,
			type,
			itemType: 'attachment',
			removeQuery(query) {
				query.item._id = source.get(`${rootProp}.edit._id`);
				return query;
			}
		});
		await buildUploadEvents({
			source,
			rootProp: `${rootProp}.edit`,
			imageAPI,
			imageType: 5,
			singleObject: true,
			itemType: 'label',
			type,
			removeQuery(query) {
				query.item._id = source.get(`${rootProp}.edit._id`);
				return query;
			}
		});
		await buildUploadEvents({
			source,
			rootProp: `${rootProp}.edit`,
			imageAPI,
			imageType: 6,
			single: true,
			itemType: 'logo',
			type,
			removeQuery(query) {
				query.item._id = source.get(`${rootProp}.edit._id`);
				return query;
			}
		});
		return events;
	};
	exports.eventsCompile = eventsCompile;
})();
