import app from '../app';
const {
  utility: {
    each,
    assign,
    querySelector,
  }
} = app;
const headNode = querySelector('head');
export const importedCssCount = {};
export const importedCss = {};
export const render = (code, filePath) => {
  if (importedCss[filePath]) {
    importedCssCount[filePath]++;
  } else {
    importedCssCount[filePath] = 0;
    const node = document.createElement('style');
    node.innerHTML = code;
    node.setAttribute('data-src', filePath);
    headNode.appendChild(node);
    importedCss[filePath] = node;
  }
};
export const unrender = (code, filePath) => {
  if (importedCss[filePath]) {
    importedCssCount[filePath]--;
    if (importedCssCount[filePath] < 0) {
      importedCss[filePath].remove();
      importedCss[filePath] = null;
      importedCssCount[filePath] = null;
    }
  }
};
export const cssRender = (css) => {
  if (css) {
    each(css, render);
  }
};
export const cssUnrender = (css) => {
  if (css) {
    each(css, unrender);
  }
};
export const componentsWithCss = {};
export const registerCssComponent = (css, componentConfig) => {
  if (!css) {
    return;
  }
  each(css, (item, key) => {
    if (!componentsWithCss[key]) {
      componentsWithCss[key] = [];
    }
    componentsWithCss[key].push(componentConfig);
  });
};
assign(app, {
  componentsWithCss,
  importedCss,
  importedCssCount
});
