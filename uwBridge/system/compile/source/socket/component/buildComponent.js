import app from '../app';
import initializeComponent from './initializeComponent.js';
const {
	utility: {
		omit,
	}
} = app;
const buildComponent = (componentConfig) => {
	initializeComponent(componentConfig);
	const componentName = componentConfig.name;
	const componentModel = componentConfig.model;
	console.log(componentConfig);
	const cmpntConfigClean = omit(componentConfig, ['css', 'asset']);
	if (componentConfig.CSS) {
		cmpntConfigClean.css = componentConfig.CSS;
	}
	console.log(cmpntConfigClean);
	const Component = Ractive.extend(cmpntConfigClean);
	if (componentName) {
		Ractive.components[componentName] = Component;
	}
	if (componentModel) {
		componentModel.component = Component;
	}
	return Component;
};
export default buildComponent;
