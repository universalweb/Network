export const defaultClientConnectionIdSize = 4;
export const clientStates = {
	inactiveState: 0,
	discoveringState: 1,
	discoveredState: 2,
	connectingState: 3,
	connectedState: 4,
	closingState: 5,
	closedState: 6,
	destroyingState: 7,
	destroyedState: 8
};
const clientDefaults = {
	defaultClientConnectionIdSize,
	clientStates
};
export default clientDefaults;
