import app from '../app';
import getComponentName from './getComponentName';
import watchHtml from './watch/html';
const {
	utility: {
		each,
	}
} = app;
const importPartials = (componentName, componentModel, asset) => {
	if (asset.partials) {
		each(asset.partials, (item, key) => {
			watchHtml((item.includes('.html')) ? item : `${item}.html`, (html) => {
				const realName = getComponentName(componentModel, componentName);
				each(app.view.findAllComponents(realName), (subItem) => {
					subItem.resetPartial(key, html);
				});
			});
		});
	}
};
export default importPartials;
