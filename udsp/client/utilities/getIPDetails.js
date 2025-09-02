import { getWANIPAddress } from '../../../utilities/network/getWANIPAddress.js';
import { isArray } from '@universalweb/utilitylib';
let ipInfo;
let globalIpVersion;
try {
	ipInfo = await getWANIPAddress();
	if (ipInfo?.ip) {
		globalIpVersion = ipInfo?.ip.includes(':') ? 'udp6' : 'udp4';
	} else {
		globalIpVersion = 'udp4';
	}
} catch (error) {
	console.log('NO GLOBAL IP');
}
// console.log('IP Version', globalIpVersion);
export { globalIpVersion };
// Consider moving this to ip.js as a utility
export async function getIPDetails() {
	const destinationIp = this.destination.ip;
	if (destinationIp) {
		this.ipVersion = this.destination.ip.includes(':') ? 'udp6' : 'udp4';
	}
}
