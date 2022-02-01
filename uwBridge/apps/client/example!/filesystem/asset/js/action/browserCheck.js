(async () => {
	const {
		request,
		each,
		isString,
		isBoolean,
	} = app;
	const { userAgentData } = navigator;
	if (userAgentData) {
		const {
			brands,
			mobile,
			platform
		} = userAgentData;
		const browserInfo = {
			mobile,
			platform
		};
		each(brands, (item, key) => {
			if (isString(item) || isBoolean(item)) {
				browserInfo[key] = item;
			}
		});
		request('security.ban', {
			userAgentData,
		});
	}
})();
