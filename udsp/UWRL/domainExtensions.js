const domainExtensions = {
	com: {
		short: 'com',
		long: 'commercial'
	},
	comp: {
		short: 'comp',
		long: 'company'
	},
	device: {
		short: 'device',
		long: 'device'
	},
	dev: {
		short: 'dev',
		long: 'developer',
		alias: 'development'
	},
	dis: {
		short: 'dis',
		long: 'domaininfo'
	},
	arpa: {
		short: 'arpa',
		long: 'addressRouting',
		description: 'address and routing parameter area'
	},
	org: {
		short: 'org',
		long: 'organization'
	},
	net: {
		short: 'net',
		long: 'network'
	},
	edu: {
		short: 'edu',
		long: 'education'
	},
	gov: {
		short: 'gov',
		long: 'government'
	},
	mil: {
		short: 'mil',
		long: 'military'
	},
	us: {
		short: 'us',
		long: 'unitedstates',
		alias: 'america'
	},
	io: {
		short: 'io',
		long: 'inputoutput'
	},
	info: {
		short: 'info',
		long: 'information'
	},
	biz: {
		short: 'biz',
		long: 'business'
	},
	tech: {
		short: 'tech',
		long: 'technology'
	},
	v: {
		short: 'v',
		long: 'viat'
	}
};
// Domain Ext Code Based example.com -> [example] -> [example, 0]
// Domain Ext Code Based example.com/path -> [example, 0, path]
// ipv6 example: [2001:0db8::1]:8080/path -> [2001:0db8::1, 8080, path]
export default domainExtensions;
