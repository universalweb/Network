import { eachArray } from '@universalweb/acid';
import os from 'node:os';
export function getCoreCount() {
	const cpuList = os.cpus();
	return cpuList.length;
}
