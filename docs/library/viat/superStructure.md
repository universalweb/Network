# VIAT LIVING SUPER STRUCTURE

Viat has a Neuromorphic self-organizing layered multidimensional DAG-like super structure.
Wallets are stored in a folder trie with folder names based on wallet addresses.
Wallets have their own chains akin to DAGs and or linear chains that are specific to particular actions such as a transaction chain and receipt chain.

Viat's state is stored in a physical file system consisting of both individual binary files and organized via folders.
Viat's physical cryptographically linked file system is a DAG-like super structure with efficient separation of concerns.
Viat's separation of concerns is essential to its scalability and high TPS potential.
A wallet's physical location on disk and virtual location within the wallet trie is based on the wallet's address.
The Wallet's address is used to determine the file path for all chains connected to the wallet's root block.
The Wallet's are part of a cryptographically linked DAG.
All wallets link back to a core root wallet block then the genesis block.

# VIAT META STRUCTURE

genesisBlock = Second layer of DAG Super Structure {
	smartContractsRootBlock: smartContractsChain,
	walletRootBlock: {
		walletA: {
			transactionRootBlock: TransactionChain,
			receiptRootBlock: receiptDAG,
			accountStateBlock: accountStateChain,
			pendingTransactionsRootBlock: pendingTransactionsDAG,
			transactionVerificationRootBlock: transactionVerification,
		}
	}
}
