import { construct, promise } from '@universalweb/acid';
import os from 'os';
import osUtils from 'os-utils';
// Function to convert bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) {
		return '0 Bytes';
	}
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
function cpuUsageInfo() {
	return promise((accept) => {
		osUtils.cpuUsage((cpuUsage) => {
			console.log(`CPU Usage: ${(cpuUsage * 100).toFixed(2)}%`);
			accept();
		});
	});
}
function cpuFreeInfo() {
	return promise((accept) => {
		osUtils.cpuFree((cpuFree) => {
			console.log(`Free CPU: ${(cpuFree * 100).toFixed(2)}%`);
			accept();
		});
	});
}
function memInfo() {
	return promise((accept) => {
		osUtils.cpuFree((cpuFree) => {
			console.log(`Total Memory Usage: ${(os.totalmem() - os.freemem()) / os.totalmem() * 100}%`);
			console.log(`Free Memory: ${(os.freemem() / os.totalmem()) * 100}%`);
			accept();
		});
	});
}
export function logSystemInfo() {
	console.log(`-------SYSTEM INFORMATION START-------`);
	console.log(`Platform: ${os.platform()}`);
	console.log(`Type: ${os.type()}`);
	console.log(`Release: ${os.release()}`);
	console.log(`Architecture: ${os.arch()}`);
	// Log CPU information
	console.log(`\nCPU Information:`);
	console.log(`Model: ${os.cpus()[0].model}`);
	console.log(`Speed: ${os.cpus()[0].speed} MHz`);
	console.log(`Cores: ${os.cpus().length}`);
	console.log(`Hostname: ${os.hostname()}`);
	console.log(`Total Memory: ${formatBytes(os.totalmem())}`);
	console.log(`Free Memory: ${formatBytes(os.freemem())}`);
	// Log network interfaces
	// console.log(`\nNetwork Interfaces:`);
	// const networkInterfaces = os.networkInterfaces();
	// Object.keys(networkInterfaces).forEach((interfaceName) => {
	// 	console.log(`- ${interfaceName}:`);
	// 	networkInterfaces[interfaceName].forEach((address) => {
	// 		console.log(`${address.family} ${address.address}`);
	// 	});
	// });
	// 	console.log(`\nDisk Space Information:`);
	// 	await cpuUsageInfo();
	// 	await cpuFreeInfo();
	// 	await memInfo();
	console.log(`-------SYSTEM INFORMATION END-------`);
}
