// Various optimization strategies could be used but for now will be kept this way to get a full feel of each event
const sol = 'SOL';
const amount = 60000;
const c = console.log;
// console.log = () => {};
function logit(times) {
	c(sol, amount, Date.now() - times);
}
export async function loop(func) {
	// let count = 0;
	const tim = Date.now();
	for (let i = 0; i < amount; i++) {
		await func();
		// console.clear();
		if (i === amount - 1) {
			logit(tim);
			break;
		}
	}
}
