module.exports = async (state) => {
	const {
		logImprt,
		attention,
		certificate: {
			get: getCertificate
		},
		crypto: {
			createSessionKey,
			clientSession,
		},
		certificates: {
			active: activeCertificate
		},
		utility: {
			omit
		},
		certLog,
		alert
	} = state;
	const stringify = require('json-stable-stringify');
	const dirname = __dirname;
	logImprt('Profiles', dirname);
	const profiles = {};
	const transmitKey = createSessionKey();
	const receiveKey = createSessionKey();
	const sessionKeys = {
		transmitKey,
		receiveKey
	};
	state.profiles = profiles;
	state.sessionKeys = sessionKeys;
	async function get(profileName) {
		attention(`Loading Profile ${profileName}`);
		const directoryPath = `${dirname}/${profileName}/`;
		const ephemeralString = stringify(omit(await getCertificate(`${directoryPath}ephemeral.cert`), 'private'));
		const ephemeral = await getCertificate(`${directoryPath}ephemeral.cert`, true);
		const master = await getCertificate(`${directoryPath}master.cert`, true);
		const masterString = stringify(omit(await getCertificate(`${directoryPath}master.cert`), 'private'));
		profiles[profileName] = {
			ephemeralString,
			ephemeral,
			master,
			masterString,
		};
		attention(`Loaded Profile ${profileName}`);
		certLog(ephemeralString);
	}
	const sodium = require('sodium-native');
	async function activate(profileName) {
		alert(`Activating Profile ${profileName}`);
		if (!state.profiles[profileName]) {
			await get(profileName);
		}
		state.profiles.active = state.profiles[profileName];
		const {
			ephemeral: {
				key: publicKey,
				private: privateKey
			}
		} = profiles.active;
		const {
			ephemeral: {
				key: serverPublicKey
			}
		} = activeCertificate;
		sodium.sodium_munlock(receiveKey);
		sodium.sodium_munlock(transmitKey);
		clientSession(receiveKey, transmitKey, publicKey, privateKey, serverPublicKey);
		sodium.sodium_mlock(receiveKey);
		sodium.sodium_mlock(transmitKey);
		alert(`Profile activated ${profileName}`);
	}
	state.profile = {
		get,
		activate
	};
};
