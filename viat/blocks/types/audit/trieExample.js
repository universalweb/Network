const exampleTrie = {
	// Returns the total trie hash
	totalHash: 'HASH - ROOT',
	0: {
		// Returns the total hash(0.0, 0.1)
		totalHash: 'HASH0 0',
		0: {
			// Returns the total hash(All Buckets)
			totalHash: 'HASH - 0.0',
			0: ['...Buckets-HASHES'],
			1: ['...Buckets-HASHES'],
			2: ['...Buckets-HASHES'],
		},
		1: {
			// Returns the total hash(All Buckets)
			totalHash: 'HASH - 0.1',
			0: ['...Buckets-HASHES'],
			1: ['...Buckets-HASHES'],
			2: ['...Buckets-HASHES'],
		},
		2: {
			// Returns the hash from 0.2.0 no hashing needed
			totalHash: 'HASH - 0.2.0',
			0: {
				// Returns the hash from 0.2.0.0 no hashing needed
				totalHash: 'HASH - 0.2.0.0',
				0: ['ONLY 1 HASH - Bubbles Up to Avoid Rehashing'],
			},
		},
	},
};
console.log(exampleTrie);
