// Identity Manifest for HD Keypair generation example
const identity = {
	name: 'RootIdentity',
	masterSeed: 0,
	seedSize: 256,
	masterKey: 0,
	keySize: 256,
	timestamp: Date.now(),
};
// Provided by the app for app specific HD key pair generation
const appIdentityManifest = {
	name: 'AppIdentity',
	category: 'Website',
	domain: 'example.com',
	algo: 'ML_DSA_65',
	key_purpose: 'login',
	timestamp: Date.now(),
};
/*
	Identity
	Purpose
	Class
	Service
	Account namespace
*/
