import { forEachAsync } from '@universalweb/acid';
import axios from 'axios';
const ipv6Servers = ['https://api64.ipify.org?format=json'];
const ipv4Servers = ['https://api.ipify.org?format=json'];
async function fetchFromAPI(url) {
	try {
		const response = await axios.get(url);
		if (response.data && response.data.ip) {
			return response.data.ip;
		} else {
			// console.error('Failed to retrieve WAN IP address.');
		}
	} catch (error) {
		// console.error('Error fetching WAN IP address:', error.message);
	}
}
export async function getWANIPAddress(getBoth) {
	const ip6length = ipv6Servers.length;
	const ip4length = ipv4Servers.length;
	let globalIP;
	const results = {};
	for (let i = 0; i < ip6length; i++) {
		const result = await fetchFromAPI(ipv6Servers[i]);
		if (result) {
			results.ip = result;
			if (result.includes(':')) {
				results.ipv6 = result;
			}	else {
				results.ipv4 = result;
			}
			break;
		}
	}
	if (getBoth && results.ipv6) {
		for (let i = 0; i < ip4length; i++) {
			const result = await fetchFromAPI(ipv4Servers[i]);
			if (result) {
				results.ipv4 = result;
				break;
			}
		}
	}
	return results;
}
