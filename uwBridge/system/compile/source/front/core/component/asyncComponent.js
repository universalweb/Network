import app from '../app';
import buildComponent from './buildComponent.js';
const {
	demand,
	demandCss,
	demandHtml,
	utility: {
		eachAsync,
		ensureArray,
		isString,
		getFileExtension,
		hasValue,
		eachObjectAsync,
		isKindAsync
	}
} = app;
function buildFilePath(template, extType = 'html') {
	const templateExt = template && getFileExtension(template);
	return !templateExt && `${template}.${extType}` || template;
}
const asyncComponent = async function(componentConfig) {
	const { data } = componentConfig;
	componentConfig.asset ||= {};
	let asset = componentConfig.asset || {};
	if (isString(asset)) {
		asset = {
			template: asset,
		};
	}
	componentConfig.styles = componentConfig.styles || {};
	componentConfig.partials = componentConfig.partials || {};
	if (asset) {
		const {
			partials,
			template,
			styles
		} = asset;
		if (hasValue(template)) {
			asset.template = buildFilePath(template);
			// app.log('Async Template COMPILED URL', asset.template);
			componentConfig.template = await demandHtml(asset.template);
		}
		if (asset.demand) {
			componentConfig.demand = await demand(asset.demand);
		}
		if (partials) {
			await eachObjectAsync(partials, async (item, key) => {
				const compiledPartialPath = partials[key] = buildFilePath(item);
				componentConfig.partials[key] = await demandHtml(compiledPartialPath);
			});
			console.log(asset);
		}
		if (styles) {
			await eachAsync(ensureArray(styles), async (item, key) => {
				const compiledCssPath = styles[key] = buildFilePath(item, 'css');
				// app.log('compiled css path', compiledCssPath);
				componentConfig.styles[compiledCssPath] = await demandCss(compiledCssPath);
			});
		}
	}
	if (data && isKindAsync(data)) {
		componentConfig.data = await data(componentConfig);
	}
	const componentPromise = await buildComponent(componentConfig);
	// app.log('Async Component Config', componentConfig);
	return componentPromise;
};
export default asyncComponent;
