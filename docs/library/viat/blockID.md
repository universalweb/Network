# Block ID Format

Locate a specific block in constant time.

[Version, type, wallet address or wallet minimum hash, transaction ID/transaction hash]

## FAST LOOKUP INDEX
FLID: A Fast Lookup ID is a dynamically generated semi-consistent ID for fast and efficient lookups of particular blocks for example a transaction block. This is designed to match the ultra scalability of VIAT with the lookup speed that may come from multiple transaction per block designs. A lookup benefit from using multiple transactions per block means you only have to search a specific amount of blocks instead of each block if a block represented one transaction. This is usually done via a merkle tree or the like to confirm if a transaction is in a particular block or not. Other designs use filters like a bloom filter but they also come with their own downsides. Viat uses a self organizing layered multidimensional super structure or what we call a Meta Structure.
