import { eachArray } from '@universalweb/utilitylib';
import os from 'node:os';
export function getCoreCount() {
	const cpuList = os.cpus();
	return cpuList.length;
}
