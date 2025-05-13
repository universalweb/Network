// Wallet Intro Block Store Public Key and initial data
// Wallet Block (Required, stored as wallet.bin in wallets/<folder1>/<folder2>/<wallet>/)
const walletBlock = {
	data: {
		meta: {
			timestamp: 1697051230,
			nonce: Buffer.from('wallet1234'),
			domain: 'example.com'
		},
		core: {
			publicKey: Buffer.from('dilithium_public_key...', 'base64url'),
			walletAddress: Buffer.from('a4ayc_8...', 'base64url')
		}
	},
	id: Buffer.from('ucDR4i...', 'base64url'),
	signature: Buffer.from('dilithium_signature...', 'base64url')
};
