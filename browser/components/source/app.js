const utility = globalThis.$;
utility.cnsl = function(...args) {
	console.log(...args);
};
const app = {
	componentMethods: {},
	config: {},
	events: {},
	utility,
};
globalThis.app = app;
export default app;
