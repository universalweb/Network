import app from '../app';
import getComponentName from './getComponentName';
import watchHtml from './watch/html';
const importTemplate = (componentName, componentModel, asset) => {
	let template = asset.template;
	if (!template.includes('.html') && !template.includes('.hbs') && !template.includes('.mustache')) {
		template = asset.template = `${template}.html`;
	}
	if (template) {
		watchHtml(template, (html) => {
			const realName = getComponentName(componentModel, componentName);
			console.lo(realName);
			if (realName) {
				const matchedComponent = app.view.findComponent(realName);
				if (matchedComponent) {
					matchedComponent.resetTemplate(html);
				}
			}
		});
	}
};
export default importTemplate;
