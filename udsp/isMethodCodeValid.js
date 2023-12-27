import { isNotNumber, isNumber, isUndefined } from '@universalweb/acid';
export function isMethodCodeValid(rpc) {
	if (isUndefined(rpc)) {
		console.log('RPC is undefined');
		return false;
	}
	if (isNotNumber(rpc)) {
		console.log('Invalid RPC Not a Number');
		return false;
	}
	if (rpc < 0 || rpc > 11) {
		console.log('Invalid RPC Not a valid RPC Number');
		return false;
	}
	return true;
}
