import app from '../../app';
const {
  watch,
  demand,
  utility: {
    each,
    isFunction,
  }
} = app;
const onHtml = async (matchFilename, componentName, json) => {
  const type = json.type;
  const filePath = json.name;
  if (!type.includes(matchFilename)) {
    return;
  }
  const html = await demand(filePath);
  if (isFunction(componentName)) {
    componentName(html);
  } else {
    each(app.findAllComponents(componentName), (item) => {
      item.resetTemplate(html);
    });
  }
};
const watchHtml = (matchFilename, componentName) => {
  return watch(matchFilename, (json) => {
    onHtml(matchFilename, componentName, json);
  });
};
watch.html = watchHtml;
export default watchHtml;
