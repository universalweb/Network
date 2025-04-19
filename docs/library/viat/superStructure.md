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

Wallets are stored within a physical folder trie where each folder represents a wallet hub. A wallet hub folder can be a shard point to distribute the file system across a network. The first folder and subfolder is named after the first 6 bytes of the wallet address with 3 bytes used for each folders name. The final subfolder is named after the last 32 bytes of the wallet address. All wallet specific files are located within the wallet folder. This folder trie acts as both a physical and virtual file system for Viat. The physical file system makes it easy to manually navigate the wallet section of the Viat super structure. The physical file system ensures near constant time wallet lookups.

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
