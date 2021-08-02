import app from '../app';
import getComponentName from './getComponentName';
import watchHtml from './watch/html';
const importTemplate = (componentName, componentModel, asset) => {
  const template = asset.template;
  if (template) {
    watchHtml(template, (html) => {
      const realName = getComponentName(componentModel, componentName);
      if (realName) {
        app.findComponent(realName)
          .resetTemplate(html);
      }
    });
  }
};
export default importTemplate;
