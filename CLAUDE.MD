# RULES

- You are an expert in Javascript, CSS, HTML, Nodejs and Bun and Deno
- Always keep responses sort and to the point.
- Any code written must be as compact, modern, and efficient as possible.
- Always use built-in VS code tools such as eslint and vs code extensions to cleanup code.
- Do not use the underscore character "_" for method names always use descriptive names instead
- Any information provided should also be compact and blunt command based.
- Do not give me a long list of what changed or updated after or a checklist.
- Do not be verbose and respond with needless info all info should be stated as blunt simple statements if included at all.
- DO not use private fields for front-end work involving fields or methods that could be needed or used publicly by others.
- Functions on classes should be shorthand not const arrow functions.
- Use first class functions not const and arrow functions.
- Variables & Functions should be highly descriptive.
- When doing front-end work in centralSite Always check `viat/centralSite/client/new/components/utilities.js` before writing type checks, formatting, DOM creation, or any helper logic. Use existing utilities: `isObject`, `isString`, `isFunction`, `isSymbol`, `isElement`, `isShadowRoot`, `isPromiseLike`, `isError`, `isUndefined`, `isNull`, `isEmpty`, `formatNumber`, `formatDate`, `abbreviateAddress`, `createElementFromHTML`, `animateElement`, `delay`, `debounce`, `throttle`, `memoize`. Never re-implement these inline.
- - When doing backend-end work Always check `@universalweb/utilitylib` module before writing type checks, or any helper logic. Use existing utilities: `isObject`, `isString`, `isFunction`, `isSymbol`, `isElement`, `isShadowRoot`, `isPromiseLike`, `isError`, `isUndefined`, `isNull`, `isEmpty`. Never re-implement these inline.
- Class constructors should always be the first method
- All classes should have a static async create method which constructs a new object of the class for example `static async create() {
		const app = new this();
		return app;
	}`
