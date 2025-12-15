# TX FEE & AWARDS

Total amount awarded to arbiters take % of the total mined
Give out total based on the total number of arbiter blocks submitted to unique transactions
Distribute the total reward based on decreasing amounts from most verifications to least
___
All auditors sign off on a block hash BFT agrees on a block hash
All auditors are forced to confirm work because if they sign off on a hash without knowing it then they risk their stake
This forces all auditors to be in sync with the network and confirm the work they are signing off on and not try and game the system
Auditors are then rewarded based on the hash order based on the total TX hash tries they have signed off on
___
Awards are distributed in the next block based on the contents of the previous audit block submitted.
In the next block the awards are finalized by creating transactions from the system wallet which can be one TX block with many recipients.
___
TX Fee must be more than minimum of Viat Reserve Fee + Minimum Auditor Fee + Recycle Fee + Minimum Arbiter Fee set by network
___
Take total amount of TX fee for Arbiters
	An amount of the TX fee can be set aside for auditors as well which is added to the auditor reward split.
Take out Viat Reserve % or flat amount (1% or minimum fee amount)
Take out Viat Recycle % to be recycled back into network
GET arbiter block hashes closest to the TX hash that are more than TX hash in sorted order
IF Not enough Arbiter blocks enough to qualify the TX then TX is marked invalid
IF Current qualified arbiter list < Total qualified arbiters
	PREPEND arbiter block hashes that take place before the TX hash in sorted order up to the qualified limit
Distribute the total reward based on decreasing amounts to each arbiter block hash in sorted order
___
Any remaining amount that could not be distributed due to rounding errors is added to the recycle amount
