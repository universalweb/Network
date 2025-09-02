// GATHER SYSTEM INFORMATION
import { bannerLog, infoLog, verboseLog } from './logs/logs.js';
import os from 'os';
import osUtils from 'os-utils';
import { promise } from '@universalweb/utilitylib';
// Function to convert bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) {
		return '0 Bytes';
	}
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = [
		'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB',
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
	bannerLog(`SYSTEM REPORT`, 'SYSTEM INFORMATION');
	// Log CPU information
	infoLog('Model', `${os.cpus()[0].model}`);
	infoLog('Cores', `${os.cpus().length}`);
	infoLog('Speed', `${os.cpus()[0].speed} MHz`);
	infoLog('Total Memory', `${formatBytes(os.totalmem())}`);
	infoLog('Free Memory', `${formatBytes(os.freemem())}`);
	// SOFTWARE information
	infoLog('Platform', `${os.platform()}`);
	infoLog('Type', `${os.type()}`);
	infoLog('Release', `${os.release()}`);
	infoLog('Architecture', `${os.arch()}`);
	// NETWORK information
	infoLog('Hostname', `${os.hostname()}`);
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
	bannerLog(`SYSTEM INFORMATION END`);
}
// logSystemInfo();
