import { introHeaderRPC } from '#udsp/protocolHeaderRPCs';
export function hasStreamID(id) {
	if (id === false || id === undefined || id === null || id?.length) {
		return false;
	}
	return true;
}
export function noStreamID(id) {
	return !hasStreamID(id);
}
