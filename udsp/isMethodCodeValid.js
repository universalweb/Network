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
/**
 * Add checks to ensure setup is called first and others.
 * Make sure to make sure the RPC is a valid request method. GET POST PUT DELETE DOWNLOAD UPLOAD.
 */
export function isRequestMethodCodeValid(rpc) {
	if (isUndefined(rpc)) {
		console.log('RPC is undefined');
		return false;
	}
	if (isNotNumber(rpc)) {
		console.log('Invalid RPC Not a Number');
		return false;
	}
	if (rpc < 0 || rpc > 4) {
		console.log('Invalid RPC Not a valid RPC Number');
		return false;
	}
	return true;
}
