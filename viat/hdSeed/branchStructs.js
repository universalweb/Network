import {
	NETWORK_NAMES, SCHEME_TYPES, SERVICE_TYPES, TRAPDOOR_SCHEME_TYPES,
} from './defaults/index.js';
export const defaultViatWalletStruct = {
	NETWORK_NAME: NETWORK_NAMES.VIAT,
	SERVICE_TYPE: SERVICE_TYPES.WALLET,
	SCHEME_TYPE: SCHEME_TYPES.ED25519,
	TRAPDOOR: TRAPDOOR_SCHEME_TYPES.ML_DSA_44,
};
// This fetches the properties on an struct that generates the path structure
/*
	The trapdoor must be generated with a different struct when creating the final wallet.
	The branch is then used to generate the leaves which are the IDs and other meta details for key pair seeds.
	This means the trapdoor can be generated and matched to a specific seed key pair and thus wallet without having to derive the trapdoor seed from the primary key pair seed. They must be generated separately and then matched by the struct properties. This allows for more flexible wallet generation and management.
 */
// VIAT/WALLET/ED25519/ <- BRANCH
const defaultViatWalletBranchPath = '/NETWORK_NAME/SERVICE_TYPE/SCHEME_TYPE/';
// VIAT/WALLET/ED25519/ML_DSA_44 <- TRAPDOOR BRANCH
const defaultViatWalletTrapdoorBranchPath = '/NETWORK_NAME/SERVICE_TYPE/SCHEME_TYPE/TRAPDOOR_SCHEME_TYPE/';
