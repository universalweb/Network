module.exports = async (state) => {
	const {
		crypto: {
			keypair,
			signKeypair,
		},
		utility: {
			assign,
			assignDeep,
		},
		certificate: {
			sign
		},
		logImprt,
		alert
	} = state;
	logImprt('Certificate Creation', __dirname);
	const api = {
		async createProfile(profileTemplate, certificateName, directory) {
			const {
				ephemeral: ephemeralTemplate,
				master: masterTemplate
			} = profileTemplate;
			const {
				publicKey: masterKey,
				secretKey: secretKeyMaster
			} = signKeypair();
			const {
				publicKey: ephemeralKey,
				secretKey: secretKeyEphemeral
			} = keypair();
			const ephemeral = assignDeep({
				start: Date.now(),
				key: ephemeralKey
			}, ephemeralTemplate);
			const master = assignDeep({
				start: Date.now(),
				key: masterKey,
				private: secretKeyMaster
			}, masterTemplate);
			const profile = {
				ephemeral,
				master,
			};
			alert('Certificates Built');
			ephemeral.signature = sign(ephemeral, master);
			alert('Ephemeral Certificate Signed');
			ephemeral.private = secretKeyEphemeral;
			if (directory) {
				await api.save(profile, directory, certificateName);
				alert(`Certificates Saved to ${directory}`, certificateName);
			}
			console.log('CERTIFICATE BUILT');
			return profile;
		},
		async createEphemeral(ephemeralTemplate, master, certificateName, directory) {
			const {
				publicKey,
				secretKey
			} = keypair();
			const ephemeral = assignDeep({
				start: Date.now(),
				key: publicKey
			}, ephemeralTemplate);
			alert('Ephemeral Certificate Built');
			ephemeral.signature = sign(ephemeral, master);
			alert('Ephemeral Certificate Signed');
			ephemeral.private = secretKey;
			if (directory) {
				await api.save(ephemeral, directory, certificateName);
				alert(`Certificate Saved to ${directory}`, certificateName);
			}
			return ephemeral;
		},
		async createMaster(masterTemplate, certificateName, directory) {
			const {
				publicKey,
				secretKey
			} = signKeypair();
			const master = assignDeep({
				start: Date.now(),
				key: publicKey,
				private: secretKey
			}, masterTemplate);
			alert('Master Certificate Built');
			if (directory) {
				await api.save(master, directory, certificateName);
				alert(`Certificate Saved to ${directory}`, certificateName);
			}
			return master;
		},
	};
	assign(state.certificate, api);
};
