# VIAT SUPERSTRUCTURE

NOTES:
Viat has a Neuromorphic self-organizing layered multidimensional DAG-like super structure.
Wallets are stored in a folder trie with folder names based on wallet addresses.
Wallets have their own chains akin to DAGs and or linear chains that are specific to particular actions such as a transaction chain and receipt chain.

Viat's state is stored in a physical filesystem consisting of both individual binary files and organized via folders.
Viat's physical cryptographically linked filesystem is a DAG-like super structure with efficient separation of concerns.
Viat's separation of concerns is essential to its scalability and high TPS potential.
A wallet's physical location on disk and virtual location within the wallet trie is based on the wallet's address.
The Wallet's address is used to determine the file path for all chains connected to the wallet's root block.
The Wallet's are part of a cryptographically linked DAG.
All wallets link back to a core root wallet block then the genesis block.

Wallets are stored within a physical folder trie where each folder represents a wallet hub. A wallet hub folder can be a shard point to distribute the filesystem across a network. The first folder and subfolder is named after the first 6 bytes of the wallet address with 3 bytes used for each folders name. The final subfolder is named after the last 24 bytes of the wallet address. All wallet specific files are located within the wallet folder. This folder trie acts as both a physical and virtual filesystem for Viat. The physical filesystem makes it easy to manually navigate the wallet section of the Viat super structure. The physical filesystem ensures near constant time wallet lookups.

## VIAT GRAPH SUPERSTRUCTURE

The root layer is the genesis block and all things can directly trace back to it. The second layer contains restricted root genesis blocks such as: Wallet Genesis Block, Meta Genesis Block, Swap Genesis Block, Exchange Genesis Block, App Genesis Block, Domain Genesis Block, Identity Genesis Block, and the Smart Contract Genesis Block. The second layer can only be extended by a code update meaning no block on the network or smart contract can extend the second layer it must be added via a code update. Each 2nd layer genesis block contains its own structured graph which can then incorporate linear blockchains and or DAG based blockchains.

The Wallet Genesis Block (Genesis Block -> [2nd Layer] - Wallet Genesis Block) then connects to individual wallet blocks. A wallet block (Genesis Block -> [2nd Layer] - Wallet Genesis Block -> (3rd Layer) - Wallet Address) contains a wallet address, public keys, and related details. Attached to the Wallet Address Block is a linear blockchain for transactions, a DAG based blockchain for receipts (received funds), and others chains attached to a wallet are primarily mission specific DAGs. The graph route to a transaction block would look like this (Genesis Block -> [2nd Layer] - Wallet Genesis Block -> (3rd Layer) - Wallet Address -> Transaction Block). All DAGs attached to the wallet first reference an initial block.

## Viat Physical Filesystem
Blocks are cryptographically linked allowing Viat to be displayed as a graph but the superstructure itself consists of physical files and folders on disk.
The VIAT superstructure is a physical filesystem meaning it can be manually traversed on disk by anyone. The Viat filesystem (VFS) effectively represents the current state of a state machine (VIAT). Files are physically stored as tries ensuring efficient constant time lookups and a way to shard the Viat State for extreme scalability. 

To navigate to a transaction on file you would use the transaction ID which consists of a wallet address and a transaction hash. The first 6 bytes of the wallet address are used to navigate to the first and second subfolder inside the wallet directory (Viat/wallets/3bytes/3bytes/last32_bytes_of_wallet_address). Then navigate to the specific transaction hash by using the first 2 bytes for the initial subfolders and the last 30 for the specific transaction folder containing the transaction block.

