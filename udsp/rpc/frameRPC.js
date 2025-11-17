export const introRPC = 0;
export function isIntro(id) {
	return id === introRPC;
}
export const extendedSynchronizationRPC = 1;
export function isExtendedSynchronization(id) {
	return id === extendedSynchronizationRPC;
}
export const discoveryRPC = 2;
export function isDiscovery(id) {
	return id === discoveryRPC;
}
export const endRPC = 3;
export function isEnd(id) {
	return id === endRPC;
}
export const finalizeExtendedSynchronizationRPC = 4;
export function isFinalizeExtendedSynchronization(id) {
	return id === finalizeExtendedSynchronizationRPC;
}
export function frameRPC(id, source = []) {
	source[1] = id;
	return source;
}
export function frameExtendedSynchronizationRPC(source = []) {
	frameRPC(extendedSynchronizationRPC, source);
	return source;
}
export function frameFinalizeExtendedSynchronizationRPC(source = []) {
	frameRPC(finalizeExtendedSynchronizationRPC, source);
	return source;
}
export function frameIntroRPC(source = []) {
	frameRPC(introRPC, source);
	return source;
}
export function frameEndRPC(source = []) {
	frameRPC(endRPC, source);
	return source;
}
export const extendedAuthRPC = 5;
