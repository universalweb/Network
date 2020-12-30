(async () => {
	const state = await require('../state')('Server');
	await require('../utilities/certificates/')(state);
	const {
		certificates: {
			domain,
			identity,
			root,
			ephemeral,
			master
		},
		certificate: {
			save
		}
	} = state;
	const domainCert = await domain.create({
		template: {
		  ephemeral: {
				version: 1,
				ip: '127.0.0.1',
				port: 443,
				host: 'universal.web',
				locality: {
					state: 'NJ',
					country: 'US'
				},
				start: Date.now(),
				end: 99999999990,
		  },
		  master: {
				version: 1,
				algo: 'default',
				hostname: 'universal.web',
				organization: {
					name: 'Arity',
				},
				locality: {
					state: 'NJ',
					country: 'US'
				},
				start: Date.now(),
				end: 99999999990,
		  }
		}
	});
	console.log('DOMAIN CERTIFICATE', domainCert);
	const disCert = await domain.create({
		template: {
		  ephemeral: {
				version: 1,
				ip: '127.0.0.1',
				port: 443,
				host: 'main.dis',
				locality: {
					state: 'NJ',
					country: 'US'
				},
				start: Date.now(),
				end: 99999999990,
		  },
		  master: {
				version: 1,
				algo: 'default',
				hostname: 'main.dis',
				organization: {
					name: 'Arity',
				},
				locality: {
					state: 'NJ',
					country: 'US'
				},
				start: Date.now(),
				end: 99999999990,
		  }
		}
	});
	console.log('DIS CERTIFICATE', disCert);
	const identityCert = await identity.create({
		template: {
		  ephemeral: {
				version: 1,
				algo: 'default',
				start: Date.now(),
				end: 99999999990,
		  },
		  master: {
				version: 1,
				algo: 'default',
				start: Date.now(),
				end: 99999999990,
		  }
		}
	});
	console.log('IDENTITY CERTIFICATE', identityCert);
	const rootCert = await root.create({
		template: {
			ephemeral: {
				id: '1',
				parent: '0',
				version: 1,
				host: 'us.east.dis',
				ip: '192.168.1.1',
				port: 80,
				pad: 900,
				issuer: 'Sentivate',
				issuerID: '0',
				algo: 'default',
				start: Date.now(),
				end: 99999999990,
				master: '0'
			},
			master: {
				version: 1,
				algo: 'default',
				id: '0',
				type: 'root',
				issuer: 'Sentivate',
				issuerID: '0',
				country: 'US',
				contact: 'issuer',
				start: Date.now(),
				end: 99999999990,
			}
		}
	});
	console.log('ROOT CERTIFICATE', rootCert);
	const masterCert = await master.create({
		template: {
			version: 1,
			algo: 'default',
			start: Date.now(),
			end: 99999999990,
		}
	});
	console.log('MASTER CERTIFICATE', masterCert);
	const ephemeralCert = await ephemeral.create({
		template: {
			version: 1,
			algo: 'default',
			start: Date.now(),
			end: 99999999990,
		},
		master: masterCert
	});
	console.log('EPHEMERAL CERTIFICATE', ephemeralCert);
	save(identityCert, `${__dirname}/../profiles`, 'default');
	save(domainCert, `${__dirname}/../services`, 'universal.web');
	save(disCert, `${__dirname}/../services`, 'main.dis');
})();
