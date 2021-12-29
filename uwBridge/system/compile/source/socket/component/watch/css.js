import app from '../../app';
import { componentsWithCss, importedCss } from '../css';
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
	const componentsUsingCss = componentsWithCss[filePath];
	console.log('CSS UPDATE', filePath, componentsUsingCss);
	const node = importedCss[filePath] || importedCss[componentName] || querySelector(`[data-src="${filePath}"]`);
	if (node || componentsUsingCss) {
		const content = await demand(filePath);
		if (isDom(node)) {
			node.innerHTML = content;
		}
		if (componentsUsingCss) {
			each(componentsUsingCss, (item) => {
				console.log(item);
				item.css[filePath] = content;
			});
		}
	}
};
watch(/\.css/, onCss);
