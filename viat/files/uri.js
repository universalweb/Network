import { transactionPathToURL, transactionURLToPath } from '#viat/blocks/transaction/uri';
import { walletPathToURL, walletURLToPath } from '#viat/blocks/wallet/uri';
import { has } from '@universalweb/acid';
import txAPI from '../blocks/transaction/defaults.js';
import walletAPI from '../blocks/wallet/defaults.js';
export function urlToPath(url) {
	let target = url;
	if (txAPI.urlPathnameRegex.test(url)) {
		target = transactionURLToPath(url);
	}
	if (walletAPI.urlPathnameRegex.test(target)) {
		target = walletURLToPath(target);
	}
	return target;
}
export function pathToURL(url) {
	let target = url;
	if (txAPI.pathnameRegex.test(url)) {
		target = transactionPathToURL(url);
	}
	if (walletAPI.pathnameRegex.test(target)) {
		target = walletPathToURL(target);
	}
	return target;
}
// console.log(filePathToURL('/wallets/8tfj/oxkM/pI4igsFndJXMIpdXiUqE19KsaC6Eo21d2DNvjGL2_kY/transactions/iQ/jw/Uxk-i_Yh9BKXQGWMKoPUTqSPHI5c6rjLjoZKeDrr'));
