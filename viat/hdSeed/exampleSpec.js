// Identity Manifest for HD Keypair generation example
const identity = {
	name: 'RootIdentity',
	masterSeed: 0,
	seedSize: 256,
	masterKey: 0,
	keySize: 256,
	timestamp: Date.now(),
	seed: 'private',
	key: 'private',
	social: {
		id: 1,
		twitter: {
			id: 1,
			subAccount: 1,
			subAccount2: 1,
		},
	},
};
// Provided by the app for app specific HD key pair generation
const appIdentityManifest = {
	name: 'AppIdentity',
	category: 'Website',
	domain: 'example.com',
	algo: 'ML_DSA_65',
	key_purpose: 'login',
};
/*
	Identity
	Purpose
	Class
	Service
	Account namespace
*/
// Modular Standardized Input Trie
const trie = {
	size: 256,
	root: true,
	branches: {
		branchName: {
			size: 256,
			isBranch: true,
			branches: {
				branchName: {
					// If require nonce is listed then the pre-seed is not enough to generate the any further seeds it requires the nonce input to coreectly generate the seed
					requireNonce: true,
					size: 256,
					isBranch: true,
					leaves: {
						leaf: {
							isLeaf: true,
							preSeed: 256,
							seed: 32,
						},
					},
				},
			},
			leaves: {
				leaf: {
					isLeaf: true,
					preSeed: 256,
					seed: 32,
				},
				otherLeaf: {
					isLeaf: true,
					preSeed: 256,
					seed: 32,
				},
			},
		},
		otherBranch: {
			isBranch: true,
			size: 256,
		},
	},
};
const trieSeed = {
	// seed_name: 'AppIdentity',
	vertical_id: 0,
	horizontal_id: 0,
	id: 1,
	category: 'website',
	domain: 'example.com',
	algo: 'ML_DSA_65',
	key_purpose: 'login',
};
// master seed -> vertical_seed (checkpoint) -> horizontal seed -> final pre-seed -> final seed
// Get Higher abstraction Object -> Convert to branches -> use HE key pair process
// Higher abstraction Object -> Trie Branches -> HD Seed generation
