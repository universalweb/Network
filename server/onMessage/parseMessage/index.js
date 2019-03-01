module.exports = async (state) => {
  await require('./validateJSONScheme')(state);
  const {
    error,
    logImprt,
    success,
    validateJSONScheme,
    utility: {
      jsonParse
    }
  } = state;
  const isJSON = require('is-json');
  logImprt('PARSE MESSAGE MODULE', __dirname);
  function parseMessage(jsonString) {
    if (isJSON(jsonString)) {
      success('JSON IS VALID');
      const json = jsonParse(jsonString);
      const validation = validateJSONScheme(json);
      if (validation) {
        success('JSON SCHEME IS VALID');
        return json;
      } else {
        error('JSON SCHEME IS INVALID', validation, jsonString);
      }
    } else {
      error('JSON IS INVALID', jsonString);
    }
  }
  state.parseMessage = parseMessage;
};
