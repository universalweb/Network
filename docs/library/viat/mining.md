# VIAT MINING

There are two types of Viat miners - Validator Nodes and Verifier Nodes.

1) Transaction Verification which is done by validators similar to a miner but is specific to validating transactions only. The reward is only from the TX fees. This allows far better scaling by allowing compute to flow to a specific part of the network. The compute won’t be split into otherwise less important areas say Smart Contracts. Validators can dynamically target and scale tx validation ensuring a constant high TPS and all compute available for tx validation goes to it. This is only for TX verification for targeted compute toward TPS.

2) The second is more like a traditional miner that actually takes Viat into circulation and isn’t paid for by a transaction fee so no one initiates this process it’s merely done as part of the network wide consensus, verification,  and validation process. Although verification is less of a concern here because it’s expected to be correct at that point due to the first type of miner doing verifications.

This design is reflective of the individual specific blocks for specific actions to strive for as high as possible linear TPS and extreme scalability built into the file system itself. Keep in mind one block equals one transaction. I’m still considering allowing multiple transactions in one block but would be send transactions from the same wallet.
