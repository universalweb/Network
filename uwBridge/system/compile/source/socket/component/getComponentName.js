import app from '../app';
const getComponentName = (componentModel, componentName) => {
  return (componentModel === app.router.currentStateObject) ? 'navState' : componentName;
};
export default getComponentName;
