export const introHeaderRPC = 0;
export function isIntroHeader(id) {
	return id === introHeaderRPC;
}
export const extendedSynchronizationHeaderRPC = 1;
export function isExtendedSynchronizationHeader(id) {
	return id === extendedSynchronizationHeaderRPC;
}
export const discoveryHeaderRPC = 2;
export function isDiscoveryHeader(id) {
	return id === discoveryHeaderRPC;
}
export const endHeaderRPC = 3;
export function isEndHeader(id) {
	return id === endHeaderRPC;
}
export const finalizeExtendedSynchronizationHeaderRPC = 4;
export function isFinalizeExtendedSynchronizationHeader(id) {
	return id === finalizeExtendedSynchronizationHeaderRPC;
}
export function headerRPC(id, source = []) {
	source[1] = id;
	return source;
}
export function headerExtendedSynchronizationRPC(source = []) {
	headerRPC(extendedSynchronizationHeaderRPC, source);
	return source;
}
export function headerFinalizeExtendedSynchronizationRPC(source = []) {
	headerRPC(finalizeExtendedSynchronizationHeaderRPC, source);
	return source;
}
export function headerIntroRPC(source = []) {
	headerRPC(introHeaderRPC, source);
	return source;
}
export function headerEndRPC(source = []) {
	headerRPC(endHeaderRPC, source);
	return source;
}
export default headerRPC;
