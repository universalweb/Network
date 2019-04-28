const schema = require('./scheme');
const AJV = require('ajv');
const ajv = new AJV();
module.exports = async (state) => {
	state.logImprt('Validate JSON Scheme Module', __dirname);
	state.validateJSONScheme = ajv.compile(schema);
};
