import app from '../../app';
import {
  componentsWithCss,
  importedCss,
} from '../css';
const {
  demand,
  watch,
  utility: {
    each,
    querySelector,
    isDom
  }
} = app;
export const onCss = async (json) => {
  const filePath = json.name;
  const componentName = json.type;
  const componentsUsingCss = componentsWithCss[componentName];
  const node = importedCss[filePath] || importedCss[componentName] || querySelector(`[data-src="${filePath}"]`);
  if (node || componentsUsingCss) {
    const content = await demand(filePath);
    if (isDom(node)) {
      node.innerHTML = content;
    }
    if (componentsUsingCss) {
      each(componentsUsingCss, (item) => {
        item.asset.css[componentName] = content;
      });
    }
  }
};
watch(/\.css/, onCss);
