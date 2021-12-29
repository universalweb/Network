import app from '../app';
import getComponentName from './getComponentName';
import watchHtml from './watch/html';
const importTemplate = (componentName, componentModel, asset) => {
	let template = asset.template;
	if (!template.includes('.html') && !template.includes('.hbs') && !template.includes('.mustache')) {
		template = asset.template = asset.template = `${template}.html`;
	}
	if (template) {
		watchHtml(template, (html) => {
			const realName = getComponentName(componentModel, componentName);
			if (realName) {
				app.view.findComponent(realName)
					.resetTemplate(html);
			}
		});
	}
};
export default importTemplate;
