import app from '../../app';
const {
	watch,
	demand,
	utility: {
		each,
		isFunction,
	}
} = app;
const onHtml = async (matchFilename, componentName, json) => {
	const type = json.type;
	const filePath = json.name;
	if (app.debug) {
		console.log('WATCH HTML', matchFilename, json);
	}
	if (!filePath.includes(matchFilename)) {
		return;
	}
	const html = await demand(filePath);
	localStorage[filePath] = html;
	if (app.debug) {
		console.log(type, filePath, html);
	}
	if (isFunction(componentName)) {
		componentName(html);
	} else {
		each(app.view.findAllComponents(componentName), (item) => {
			if (app.debug) {
				console.log(item);
			}
			item.resetTemplate(html);
		});
	}
};
const watchHtml = (matchFilename, componentName) => {
	if (app.debug) {
		console.log('WATCH HTML', matchFilename);
	}
	return watch(matchFilename, (json) => {
		onHtml(matchFilename, componentName, json);
	});
};
watch.html = watchHtml;
export default watchHtml;
