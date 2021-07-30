import app from '../app';
import importPartials from './importPartials';
import importTemplate from './importTemplate';
import onConstruct from './onConstruct';
import { registerCssComponent } from './css';
const {
  utility: {
    cnsl,
    assign,
  }
} = app;
cnsl('viewSetup Module', 'notify');
const tooltip = window.RactiveTooltip;
const initializeComponent = (componentConfig) => {
  componentConfig.decorators = assign(componentConfig.decorators || {}, {
    tooltip,
  });
  const {
    css,
    model: componentModel,
    asset,
    name: componentName,
  } = componentConfig;
  registerCssComponent(css, componentConfig);
  if (asset && (componentName || componentModel)) {
    importTemplate(componentName, componentModel, asset);
    importPartials(componentName, componentModel, asset);
  }
  onConstruct(componentConfig);
};
export default initializeComponent;
