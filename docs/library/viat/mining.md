# VIAT MINING

There are two types of Viat miners - Auditors (validate) and Arbiters (verify). Arbiters confirm the legitimacy of individual transactions and earn a portion of the transaction fee. Auditors secure large chains of blocks, ensuring system-wide compliance. Auditors validate entire sections of Viat's super structure, help to optimize the super structure, and improve navigation of the super structure.

1) Transaction Verification which is done by Arbiters similar to a miner but are specific to validating individual transactions. The reward is only from the TX fees. This allows far better scaling by allowing compute to flow to a specific part of the network. The compute won’t be split into otherwise less important areas say Smart Contracts. Arbiters can dynamically target and scale tx validation ensuring a constant high TPS and all compute available for tx validation goes to it. This is only for TX verification for targeted compute toward TPS.

2) The second type is an Auditor which verifies large sections of the Viat super structure. Auditors are similar to a traditional miner and pull Viat into circulation which they are rewarded with.

This design is reflective of the individual specific blocks for specific actions to strive for as high as possible linear TPS and extreme scalability built into the file system itself. Keep in mind one block equals one transaction. I’m still considering allowing multiple transactions in one block but would be send transactions from the same wallet.
