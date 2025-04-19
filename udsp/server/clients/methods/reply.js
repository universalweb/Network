import { Reply } from '#udsp/request/reply';
import { isFalse } from '@universalweb/acid';
import { onFrame } from '#udsp/processFrame';
export async function reply(frame, header, rinfo) {
	// TODO: Consider removing this and having it processed once to avoid re-checks
	// NOTE: It could be better to have a check for a closed state?
	if (this.state === 1) {
		await this.updateState(2);
	}
	await this.updateLastActive();
	const processingFrame = await onFrame(frame, header, this, this.requestQueue);
	if (processingFrame === false) {
		const replyObject = new Reply(frame, header, this);
		this.logInfo('New reply object created', replyObject);
		if (isFalse(replyObject)) {
			this.errorLog('Reply creation failed');
			return;
		}
		replyObject.onFrame(frame, header, rinfo);
	}
}
