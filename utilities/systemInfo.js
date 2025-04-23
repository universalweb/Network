// GATHER SYSTEM INFORMATION
import { infoLog, verboseLog } from './logs/logs.js';
import os from 'os';
import osUtils from 'os-utils';
import { promise } from '@universalweb/acid';
// Function to convert bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) {
		return '0 Bytes';
	}
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = [
		'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'
	];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
async function cpuUsageInfo() {
	return promise((accept) => {
		osUtils.cpuUsage((cpuUsage) => {
			infoLog(`CPU Usage: ${(cpuUsage * 100).toFixed(2)}%`);
			accept();
		});
	});
}
async function cpuFreeInfo() {
	return promise((accept) => {
		osUtils.cpuFree((cpuFree) => {
			infoLog(`Free CPU: ${(cpuFree * 100).toFixed(2)}%`);
			accept();
		});
	});
}
async function memInfo() {
	return promise((accept) => {
		osUtils.cpuFree((cpuFree) => {
			infoLog(`Total Memory Usage: ${(os.totalmem() - os.freemem()) / os.totalmem() * 100}%`);
			infoLog(`Free Memory: ${(os.freemem() / os.totalmem()) * 100}%`);
			accept();
		});
	});
}
export function logSystemInfo() {
	infoLog(`-------SYSTEM INFORMATION START-------`);
	infoLog(`Platform: ${os.platform()}`);
	infoLog(`Type: ${os.type()}`);
	infoLog(`Release: ${os.release()}`);
	infoLog(`Architecture: ${os.arch()}`);
	// Log CPU information
	infoLog(`\nCPU Information:`);
	infoLog(`Model: ${os.cpus()[0].model}`);
	infoLog(`Speed: ${os.cpus()[0].speed} MHz`);
	infoLog(`Cores: ${os.cpus().length}`);
	infoLog(`Hostname: ${os.hostname()}`);
	infoLog(`Total Memory: ${formatBytes(os.totalmem())}`);
	infoLog(`Free Memory: ${formatBytes(os.freemem())}`);
	// Log network interfaces
	// infoLog(`\nNetwork Interfaces:`);
	// const networkInterfaces = os.networkInterfaces();
	// Object.keys(networkInterfaces).forEach((interfaceName) => {
	// 	infoLog(`- ${interfaceName}:`);
	// 	networkInterfaces[interfaceName].forEach((address) => {
	// 		infoLog(`${address.family} ${address.address}`);
	// 	});
	// });
	// 	infoLog(`\nDisk Space Information:`);
	// 	await cpuUsageInfo();
	// 	await cpuFreeInfo();
	// 	await memInfo();
	verboseLog(`-------SYSTEM INFORMATION END-------`);
}
// logSystemInfo();
