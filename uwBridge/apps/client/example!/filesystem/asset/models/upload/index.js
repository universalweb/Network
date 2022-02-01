(async () => {
	const {
		request,
		utility: {
			eachAsync,
			assign,
			pluck,
			upperFirst
		},
		createAlert,
	} = app;
	import { dragEvents } from 'models/dragDrop/index.js';
	exports.upload = {
		async image(apiName, files, imageType, _id, type, requestExtras = {}) {
			console.log(apiName, files, imageType, _id, type, requestExtras);
			const results = {
				get items() {
					return pluck(results.responses, 'item');
				},
				responses: [],
			};
			console.log(files);
			if (files && files.length) {
				const filtered = files.filter((img) => {
					if (img.file) {
						return true;
					}
					return false;
				});
				await eachAsync(filtered, async (attachment, index) => {
					const result = await request(apiName, assign({
						imageType,
						type,
						item: {
							_id,
							file: attachment.file,
							position: attachment.position,
						}
					}, requestExtras));
					results.responses.push(result);
					console.log('IMAGE UPLOADED', index);
				});
			}
			return results;
		},
		async imageSingle(apiName, file, imageType, type, _id, requestExtras = {}) {
			const results = {
				get items() {
					return pluck(results.responses, 'item');
				},
				responses: [],
			};
			console.log(file);
			if (file && file.length && file.includes('base64')) {
				const result = await request(apiName, assign({
					imageType,
					type,
					item: {
						_id,
						file,
					}
				}, requestExtras));
				results.responses.push(result);
				console.log('IMAGE UPLOADED', imageType, file.length);
			}
			return results;
		}
	};
	exports.buildUploadEvents = async (options) => {
		const {
			rootProp,
			source,
			itemType,
			type,
			imageType,
			imageAPI,
			removeQuery,
			singleObject,
			single
		} = options;
		const cameled = upperFirst(itemType);
		let propList;
		if (singleObject) {
			propList = `${rootProp}.${itemType}.path`;
		} else if (single) {
			propList = `${rootProp}.${itemType}`;
		} else {
			propList = `${rootProp}.${itemType}s`;
		}
		if (single) {
			await source.set(propList, '');
		} else {
			await source.set(propList, []);
		}
		source.on({
			async [`*.${rootProp}.remove${cameled}`](componentEvent, file, index) {
				const { original } = componentEvent;
				console.log(componentEvent, index);
				original.preventDefault();
				original.stopPropagation();
				let results;
				if (!file.includes('data:image')) {
					if (singleObject || single) {
						results = await request(`${imageAPI}Remove`, removeQuery({
							imageType,
							type,
							item: {
								file: ''
							}
						}));
					} else {
						results = await request(`${imageAPI}Remove`, removeQuery({
							imageType,
							type,
							item: {
								file
							}
						}));
					}
					if (results.item) {
						createAlert({
							message: `Removed!`
						});
						source.fire(`${rootProp}.${imageAPI}.removed`);
						source.fire(`${rootProp}.image.removed`);
					} else {
						createAlert({
							message: 'Failed to remove!',
							type: 'danger'
						});
					}
				}
				if (singleObject || single) {
					await source.set(`${propList}`, '');
				} else {
					await source.splice(propList, index, 1);
				}
			},
			[`*.${rootProp}.drop${cameled}`](context) {
				const {
					original, node
				} = context;
				original.preventDefault();
				original.stopPropagation();
				dragEvents.dropImage(original, node, async (result) => {
					if (singleObject || single) {
						await source.set(propList, result);
					} else {
						await source.push(propList, {
							file: result,
						});
					}
				});
				return false;
			},
			async [`*.${rootProp}.load${cameled}`](context) {
				await source.set(`${rootProp}.${itemType}Loading`, true);
				console.log(context);
				const result = await dragEvents.loadTemplateImage(context.node);
				console.log(result);
				if (singleObject || single) {
					await source.set(propList, result[0].file);
				} else {
					await source.push(propList, ...result);
				}
				await source.set(`${rootProp}.${itemType}Loading`, false);
			},
		});
	};
})();
