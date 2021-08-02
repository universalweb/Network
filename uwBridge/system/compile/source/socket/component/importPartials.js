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
      watchHtml(item, (html) => {
        const realName = getComponentName(componentModel, componentName);
        each(app.findAllComponents(realName), (subItem) => {
          subItem.resetPartial(key, html);
        });
      });
    });
  }
};
export default importPartials;
