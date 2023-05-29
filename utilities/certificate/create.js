import { logCert, imported } from '#logs';
import { read, write } from '#file';
import { signKeypair, signDetached } from '#crypto';
import { saveCertificate } from './save.js';
import { assign, merge, clone } from 'Acid';
import { encode } from 'msgpackr';
imported('Certificate Creation');
function certificateFactory(config, options = {}) {
	const currentDate = new Date();
	const certificate = {
		start: currentDate.toUTCString(),
	};
	if (config) {
		assign(certificate, config);
	}
	if (!certificate.end) {
		const endDate = currentDate.setUTCMonth(currentDate.getUTCMonth() + 3);
		certificate.end = currentDate.toUTCString();
	}
	const certificateWrapper = {
		certificate,
	};
	if (!certificate.publicKey) {
		const {
			publicKey,
			privateKey
		} = signKeypair();
		certificate.publicKey = publicKey;
		certificateWrapper.privateKey = privateKey;
	}
	if (options.master) {
		certificate.masterSignature = signDetached(certificate.publicKey, options.master.privateKey);
		certificate.masterPublicKey = options.master.certificate.publicKey;
	}
	certificateWrapper.certificate = encode(certificateWrapper.certificate);
	if (options.master) {
		certificateWrapper.masterSignature = signDetached(certificateWrapper.certificate, options.master.privateKey);
		console.log(`masterSignature: ${certificateWrapper.masterSignature.length}bytes`);
	}
	return certificateWrapper;
}
export async function createProfile(config) {
	const {
		template: {
			ephemeral: ephemeralTemplate,
			master: masterTemplate
		}
	} = config;
	const master = certificateFactory(masterTemplate);
	const ephemeral = certificateFactory(ephemeralTemplate, {
		master
	});
	const profile = {
		ephemeral,
		master,
	};
	console.log(`ephemeral: ${ephemeral.certificate.length}bytes`);
	console.log(`master: ${master.certificate.length}bytes`);
	if (config.savePath) {
		await saveCertificate(profile, config.savePath, config.certificateName);
	}
	console.log('CERTIFICATE BUILT');
	return profile;
}
export async function createCertificate(config, options) {
	const certificate = certificateFactory(config.template, options);
	if (config.savePath) {
		await saveCertificate(certificate, config.savePath, config.certificateName);
	}
	return certificate;
}
