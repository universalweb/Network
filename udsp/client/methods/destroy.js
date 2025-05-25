import { clientStates } from '../defaults.js';
const {
	destroyedState,
	destroyingState
} = clientStates;
export async function destroy(errorCode = 0) {
	if (this.state !== destroyedState) {
		this.logInfo(`destroy Client - reason ${errorCode}`);
		await this.close();
		await this.setState(destroyingState);
		// FLUSH DATA TEARDOWN NEEDED
		await this.setState(destroyedState);
		this.fire(this.events, 'destroyed', this);
	}
}
