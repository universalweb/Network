export function setComponentTimeout(callback, delayMs) {
	const timeoutId = setTimeout(() => {
		this.timeouts.delete(timeoutId);
		callback();
	}, delayMs);
	this.timeouts.add(timeoutId);
	return timeoutId;
}
export function removeComponentTimeout(timeoutId) {
	clearTimeout(timeoutId);
	this.timeouts.delete(timeoutId);
}
export function clearTimeouts() {
	this.timeouts.forEach(clearTimeout);
	this.timeouts.clear();
}
export function addInterval(callback, delayMs) {
	const intervalId = setInterval(callback, delayMs);
	this.intervals.add(intervalId);
	return intervalId;
}
export function stopInterval(intervalId) {
	clearInterval(intervalId);
	this.intervals.delete(intervalId);
}
export function clearIntervals() {
	this.intervals.forEach(clearInterval);
	this.intervals.clear();
}
