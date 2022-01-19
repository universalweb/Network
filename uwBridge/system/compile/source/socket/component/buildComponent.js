import app from '../app';
import initializeComponent from './initializeComponent.js';
const {
	utility: {
		omit,
	}
} = app;
const buildComponent = (componentConfig) => {
	initializeComponent(componentConfig);
	const {
		name: componentName,
		model
	} = componentConfig;
	const cmpntConfigClean = omit(componentConfig, ['css', 'asset']);
	if (componentConfig.CSS) {
		cmpntConfigClean.css = componentConfig.CSS;
	}
	const Component = Ractive.extend(cmpntConfigClean);
	if (componentName) {
		Ractive.components[componentName] = Component;
	}
	if (model) {
		model.component = Component;
	}
	return Component;
};
export default buildComponent;
