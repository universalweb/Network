import app from '../app';
import asyncComponent from './asyncComponent';
import buildComponent from './buildComponent';
const {
  utility: {
    isString
  }
} = app;
const components = {};
const generateComponent = (ComponentView, config) => {
  return new ComponentView(config);
};
const getComponent = (componentName, config) => {
  const componentObject = components[componentName];
  return config ? generateComponent(componentObject, config) : componentObject;
};
const component = (componentName, componentConfigOption) => {
  let method;
  const componentConfig = (componentConfigOption) ? componentConfigOption : componentName;
  if (isString(componentName)) {
    componentConfig.name = componentName;
  }
  if (componentConfig.asset) {
    method = asyncComponent;
  } else {
    method = buildComponent;
  }
  return method(componentConfig);
};
app.component = component;
app.getComponent = getComponent;
