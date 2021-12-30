module.exports = (app) => {
	const {
		client,
		utility: {
			each,
			isFunction
		},
	} = app;
	app.api = {
		extend(methods, options) {
			const {
				suffix, prefix
			} = options;
			const safePrefix = prefix ? `${prefix}.` : '';
			const safeSuffix = suffix ? `.${suffix}` : '';
			if (isFunction(methods)) {
				client[prefix] = methods;
			}
			each(methods, (value, key) => {
				let propertyKey;
				if (key === 'security') {
					propertyKey = safePrefix;
				} else {
					propertyKey = `${safePrefix}${key}${safeSuffix}`;
				}
				client[propertyKey] = value;
			});
		},
	};
};
