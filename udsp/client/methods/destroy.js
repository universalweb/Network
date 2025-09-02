import { clientStates } from '../defaults.js';
const {
	destroyedState,
	destroyingState,
} = clientStates;
export async function destroy(errorCode = 0) {
	if (this.state !== destroyedState) {
		this.logInfo(`DESTROY - reason ${errorCode}`);
		await this.close();
		await this.setState(destroyingState);
		// TODO: FLUSH DATA TEARDOWN NEEDED?
		await this.setState(destroyedState);
		this.emitEvent('DESTROYED =>', errorCode);
	}
}
