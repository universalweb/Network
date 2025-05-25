import { isBuffer, noValue } from '@universalweb/acid';
import { getAddressStringFromBuffer } from '#utilities/network/ip';
// TODO: NEEDS SECURITY CHECKS FOR CHANGING DESTINATION
export async function changeAddress(addressBuffer, rinfo) {
	this.logInfo(`Change Server Address ${addressBuffer}`);
	if (noValue(addressBuffer)) {
		this.logInfo(`No Address Buffer`);
		return;
	}
	if (addressBuffer === true) {
		this.destination.ip = rinfo.address;
		this.destination.port = rinfo.port;
	} else if (isBuffer(addressBuffer)) {
		// ipv4BytesChangeAddress
		const addressArray = getAddressStringFromBuffer(addressBuffer);
		if (addressArray) {
			const [
				ipAddress,
				portNumber
			] = addressArray;
			if (ipAddress) {
				this.destination.ip = ipAddress;
			}
			if (portNumber) {
				this.destination.port = portNumber;
			}
		}
	}
	this.logInfo('Destination changed in INTRO');
}
