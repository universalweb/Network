import { transactionFilePathToURL, transactionURLToFilePath } from '#viat/blocks/transaction/uri';
import { walletFilePathToURL, walletURLToFilePath } from '#viat/blocks/wallet/uri';
import { has } from '@universalweb/acid';
import txAPI from '../blocks/transaction/defaults.js';
import walletAPI from '../blocks/wallet/defaults.js';
export function urlToFilePath(url) {
	let target = url;
	if (txAPI.urlPathnameRegex.test(url)) {
		target = transactionURLToFilePath(url);
	}
	if (walletAPI.urlPathnameRegex.test(target)) {
		target = walletURLToFilePath(target);
	}
	return target;
}
export function filePathToURL(url) {
	let target = url;
	if (txAPI.pathnameRegex.test(url)) {
		target = transactionFilePathToURL(url);
	}
	if (walletAPI.pathnameRegex.test(target)) {
		target = walletFilePathToURL(target);
	}
	return target;
}
// console.log(filePathToURL('/wallets/8tfj/oxkM/pI4igsFndJXMIpdXiUqE19KsaC6Eo21d2DNvjGL2_kY/transactions/iQ/jw/Uxk-i_Yh9BKXQGWMKoPUTqSPHI5c6rjLjoZKeDrr'));
