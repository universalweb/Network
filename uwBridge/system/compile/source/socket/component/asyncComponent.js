import app from '../app';
import buildComponent from './buildComponent.js';
const {
  demand,
  demandCss,
  demandHtml,
  utility: {
    assign,
    each,
    ensureArray,
    isString,
  }
} = app;
const asyncComponent = async function(componentConfig) {
  const componentModel = componentConfig.model;
  let asset = componentConfig.asset || {};
  if (isString(asset)) {
    asset = {
      css: [`${asset}style`],
      template: `${asset}template`,
    };
  }
  componentConfig.asset = asset;
  componentConfig.css = componentConfig.css || {};
  componentConfig.partials = componentConfig.partials || {};
  if (asset) {
    if (asset.template) {
      componentConfig.template = await demandHtml(asset.template);
    }
    if (asset.demand) {
      componentConfig.demand = await demand(asset.demand);
    }
    if (asset.partials) {
      assign(componentConfig.partials, await demandHtml(asset.partials));
    }
    if (asset.css) {
      const assetCss = asset.css;
      const loadCss = await demandCss(assetCss);
      each(ensureArray(loadCss), (item, index) => {
        let keyName = assetCss[index];
        if (!keyName.includes('.css')) {
          keyName = `${keyName}.css`;
        }
        componentConfig.css[keyName] = item;
      });
    }
  }
  const componentPromise = buildComponent(componentConfig);
  if (componentModel) {
    componentModel.component = componentPromise;
  }
  return componentPromise;
};
export default asyncComponent;
