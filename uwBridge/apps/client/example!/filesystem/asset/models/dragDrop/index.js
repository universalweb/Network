(async () => {
	const {
		request,
		utility: {
			promise,
			mapAsync,
			eachObject,
			mapArray,
			flattenDeep
		},
	} = app;
	import 'js/lib/csv';
	function convertImageToBase64(elmnt) {
		const files = elmnt.files;
		return mapAsync(files, (file, index) => {
			return promise((accept) => {
				const reader = new FileReader();
				reader.onloadend = function() {
					console.log('RESULT', reader.result);
					accept({
						file: reader.result,
						index
					});
				};
				reader.readAsDataURL(file);
			});
		});
	}
	async function buildCSVJSON(result, csvToJsonHeaders) {
		const converted = await window.csv({
			noheader: true,
			trim: true,
			ignoreEmpty: true,
		}).fromString(result);
		converted.shift();
		const formatted = mapArray(converted, (item) => {
			const patched = {};
			eachObject(item, (field, key) => {
				patched[csvToJsonHeaders[key]] = field;
			});
			return patched;
		});
		console.log('RESULT', formatted);
		return formatted;
	}
	exports.dragEvents = {
		async 'dropImage'(original, dropArea, asyncCallback) {
			const dt = original.dataTransfer;
			const files = dt.files;
			console.log(files.length);
			const results = await promise((accept) => {
				const file = files[0];
				const reader = new FileReader();
				reader.onloadend = function() {
					console.log('RESULT', reader.result.length);
					accept(reader.result);
				};
				reader.readAsDataURL(file);
			});
			console.log(results);
			dropArea.classList.remove('uk-dragover');
			await asyncCallback(results);
			return results;
		},
		async 'dropCSV'(original, dropArea, csvHeaders, asyncCallback) {
			const dt = original.dataTransfer;
			const files = dt.files;
			console.log(files.length);
			const results = await promise((accept) => {
				const file = files[0];
				const reader = new FileReader();
				reader.onloadend = async function() {
					const converted = await buildCSVJSON(reader.result, csvHeaders);
					accept(converted);
				};
				reader.readAsText(file);
			});
			console.log(results);
			dropArea.classList.remove('uk-dragover');
			await asyncCallback(results);
			return results;
		},
		'dragleave'(context, dropArea) {
			const { original } = context;
			dropArea.classList.remove('uk-dragover');
			console.log(context);
			original.preventDefault();
			original.stopPropagation();
		},
		'dragenter'(context, dropArea) {
			const { original } = context;
			dropArea.classList.add('uk-dragover');
			original.preventDefault();
			original.stopPropagation();
		},
		'dragover'(context, dropArea) {
			const { original } = context;
			dropArea.classList.add('uk-dragover');
			console.log(context);
			original.preventDefault();
			original.stopPropagation();
		},
		async loadTemplateImage(node) {
			if (node) {
				const files = await convertImageToBase64(node);
				console.log(files);
				return files;
			}
			return false;
		},
		async loadCSV(node, csvToJsonHeaders) {
			const files = node.files;
			return flattenDeep(await mapAsync(files, (file) => {
				return promise((accept) => {
					const reader = new FileReader();
					reader.onloadend = async function() {
						const converted = await buildCSVJSON(reader.result, csvToJsonHeaders);
						accept(converted);
					};
					reader.readAsText(file);
				});
			}));
		},
		async 'uploadLabel'(item, uploadVar, file, requestName) {
			if (file) {
				item.file = file;
				const results = await request(requestName, {
					item
				});
				console.log(results);
				return results;
			}
			return false;
		}
	};
	app.view.on({
		'*.dragleave'(context) {
			exports.dragEvents.dragleave(context, context.node);
		},
		'*.dragenter'(context) {
			exports.dragEvents.dragenter(context, context.node);
		},
		'*.dragover'(context) {
			exports.dragEvents.dragover(context, context.node);
		},
	});
})();
