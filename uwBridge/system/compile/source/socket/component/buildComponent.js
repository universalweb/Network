import initializeComponent from './initializeComponent.js';
const ractive = window.Ractive;
const buildComponent = (componentConfig) => {
  initializeComponent(componentConfig);
  const componentName = componentConfig.name;
  const componentModel = componentConfig.model;
  const Component = ractive.extend(componentConfig);
  if (componentName) {
    ractive.components[componentName] = Component;
  }
  if (componentModel) {
    componentModel.component = Component;
  }
  return Component;
};
export default buildComponent;
