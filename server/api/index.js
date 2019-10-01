module.exports = (state) => {
	const {
		logImprt,
		utility: {
			isPlainObject,
			eachObjectAsync,
			isArray,
			eachAsync,
			assign
		},
		app
	} = state;
	logImprt('SERVER APP API', __dirname);
	async function add(method, methodName) {
		app[methodName] = method;
		console.log('Extended App API', methodName);
	}
	async function addApi(methodName, method) {
		if (isPlainObject(methodName)) {
			return eachObjectAsync(methodName, add);
		}
		return add(methodName, method);
	}
	async function remove(method, methodName) {
		app[methodName] = null;
	}
	async function removeApi(methodName) {
		if (isPlainObject(methodName)) {
			return eachObjectAsync(methodName, remove);
		}
		if (isArray(methodName)) {
			return eachAsync(methodName, remove);
		}
		return remove(methodName);
	}
	assign(state.api, {
		add: addApi,
		remove: removeApi
	});
	require('./onMessage')(state);
};
