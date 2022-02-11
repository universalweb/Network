import onConstruct from './onConstruct';
import { registerCssComponent } from './css';
const buildComponent = (componentConfig) => {
	const {
		name: componentName,
		asset,
		styles
	} = componentConfig;
	registerCssComponent(styles, componentConfig);
	onConstruct(componentConfig);
	const cmpntConfigClean = componentConfig;
	const Component = Ractive.extend(cmpntConfigClean);
	if (componentName) {
		Ractive.components[componentName] = Component;
	}
	Component.asset = asset;
	return Component;
};
export default buildComponent;
