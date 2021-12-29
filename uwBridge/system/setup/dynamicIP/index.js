const cloudflareDDNS = require('cloudflare-dynamic-dns2');
const cloudflareConfigure = async (app, cloudflare) => {
	const {
		utility: {
			eachAsync,
			interval,
		}
	} = app;
	const config = cloudflare.config;
	const onUpdate = cloudflare.onUpdate;
	const setIP = async () => {
		try {
			const subdomains = cloudflare.subDomain;
			await eachAsync(subdomains, async (item) => {
				config.subdomain = item;
				try {
					const ip = await cloudflareDDNS(config);
					await onUpdate(config.subdomain, ip);
				} catch (error) {
					console.log('CFDNS ERROR');
				}
			});
		} catch (error) {
			console.log(error);
		}
	};
	interval(setIP, 90000000);
	return setIP();
};
module.exports = async (app) => {
	const config = app.config.dynamicIP;
	if (config) {
		await cloudflareConfigure(app, config.cloudflare);
	}
};
