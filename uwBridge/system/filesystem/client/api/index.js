module.exports = (app) => {
	const {
		client,
		utility: {
			each
		},
	} = app;
	app.api = {
		extend(methods, options) {
			const {
				suffix, prefix
			} = options;
			const safePrefix = prefix ? `${prefix}.` : '';
			const safeSuffix = suffix ? `.${suffix}` : '';
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
