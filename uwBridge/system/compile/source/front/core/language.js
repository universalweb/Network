import app from './app.js';
const {
  last,
  first
} = app.utility;
const isLang = new RegExp(/^language\//);
const languagePath = (filePath) => {
  let filePathCompiled = filePath;
  if (!isLang.test(filePathCompiled)) {
    if (first(filePathCompiled) !== '/') {
      filePathCompiled = `/${filePathCompiled}`;
    }
    filePathCompiled = `language${filePathCompiled}`;
  }
  if (last(filePathCompiled) !== '/') {
    filePathCompiled = `${filePathCompiled}/`;
  }
  return `${filePathCompiled}${app.systemLanguage}.json`;
};
app.languagePath = languagePath;
export default languagePath;
