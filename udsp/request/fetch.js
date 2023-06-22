import { promise } from '@universalweb/acid';
export async function initiate() {
	const thisAsk = this;
	await this.buildRequest();
	const awaitingResult = promise((accept) => {
		thisAsk.accept = accept;
	});
	return awaitingResult;
}
