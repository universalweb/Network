import app from '../../app';
const {
	watch,
	demand,
	utility: {
		eachObject,
		eachArray
	},
	crate
} = app;
const onHtml = async (matchFilename, json, callback) => {
	if (callback) {
		return callback(matchFilename, json);
	}
	const filePath = json.name;
	app.log('WATCH HTML', matchFilename, json);
	const html = await demand(filePath);
	crate.setItem(filePath, html);
	app.log(filePath, html.length);
	eachObject(Ractive.components, (item, key) => {
		const asset = item.asset;
		if (asset.template === filePath) {
			item.defaults.template = Ractive.parse(html);
			const matchedComponents = app.view.findAllComponents(key);
			if (matchedComponents) {
				eachArray(matchedComponents, (matchedComponent) => {
					matchedComponent.resetTemplate(html);
				});
			}
		}
		if (asset.partials) {
			eachObject(asset.partials, (partialPath, partialName) => {
				if (partialPath === filePath) {
					item.partials[partialName] = Ractive.parse(html);
					const matchedComponents = app.view.findAllComponents(key);
					if (matchedComponents) {
						eachArray(matchedComponents, (matchedComponent) => {
							// app.log('reset partial', partialName);
							matchedComponent.resetPartial(partialName, html);
						});
					}
				}
			});
		}
	});
	window.UIkit.update(document.body, 'update');
};
const watchHtml = (matchFilename, callback) => {
	app.log('WATCH HTML', matchFilename);
	return watch(matchFilename, (json) => {
		app.log('HTML FILE CHANGED WATCH EVENT', matchFilename);
		onHtml(matchFilename, json, callback);
	});
};
watch.html = watchHtml;
watchHtml(/\.html/);
export default watchHtml;
