import {
	certificateTypes,
	certificateVersion as currentCertificateVersion,
} from './defaults.js';
import Certificate from './certificate.js';
import { encodeStrict } from '#utilities/serialize';
import { hasValue } from '@universalweb/utilitylib';
const certificateType = certificateTypes.get('signature');
// This is a signature certificate part of the dual certificate system.
export class SignatureCertificate extends Certificate {
	constructor(options = {}) {
		super(options);
	}
	certificateType = certificateType;
}
