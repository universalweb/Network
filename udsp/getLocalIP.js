import os from 'os';
const networkInterfaces = os.networkInterfaces();
const localNetworkInterface = networkInterfaces['Wi-Fi'] || networkInterfaces.eth0 || networkInterfaces.en0;
export function getLocalIpVersion() {
	let results = 'udp4';
	const localIpv4Address = localNetworkInterface.find((interfaceInfo) => {
		const isIpv6 = interfaceInfo.family === 'IPv6';
		if (isIpv6) {
			results = 'udp6';
		}
		return isIpv6;
	}).address;
}
