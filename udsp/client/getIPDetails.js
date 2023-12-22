import { getWANIPAddress } from '../../utilities/network/getWANIPAddress.js';
import { isArray } from '@universalweb/acid';
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
console.log('IP Version', globalIpVersion);
export async function getIPDetails() {
	const destinationIp = this.destination.ip;
	if (destinationIp) {
		if (isArray(destinationIp)) {
			if (globalIpVersion === 'udp4') {
				const ipv4ip = this.destination.ip.find((item) => {
					return item.includes(':') ? false : item;
				});
				if (ipv4ip) {
					this.destination.ip = ipv4ip;
					this.ipVersion = 'udp4';
				}
			} else {
				const ipv6ip = this.destination.ip.find((item) => {
					return item.includes(':') ? item : false;
				});
				if (ipv6ip) {
					this.destination.ip = ipv6ip;
					this.ipVersion = 'udp6';
				} else {
					this.destination.ip = [0];
					this.ipVersion = 'udp4';
				}
			}
		} else {
			this.ipVersion = this.destination.ip.includes(':') ? 'udp6' : 'udp4';
		}
	}
}
