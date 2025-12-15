export function mem(label = '') {
	const m = process.memoryUsage();
	const toMB = (n) => {
		return (n / 1024 / 1024).toFixed(2);
	};
	console.log(`\n=== Memory Snapshot: ${label} ===`);
	console.log(`rss:        ${toMB(m.rss)} MB`);
	console.log(`heapTotal:  ${toMB(m.heapTotal)} MB`);
	console.log(`heapUsed:   ${toMB(m.heapUsed)} MB`);
	console.log(`external:   ${toMB(m.external)} MB`);
	console.log(`arrayBuffers: ${toMB(m.arrayBuffers)} MB`);
}
