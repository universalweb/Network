# VIAT STRATEGY

Viat's strategy is based on a principle called the "Separation of Concerns". By separating unique aspects of the network Viat can target vital attributes such as high throughput (Transactions per second), concurrency, parallelism, and granular scalability. Viat's super structure is the foundation that makes this strategy possible.
Viat's design tries to create a linear relation between throughput (TPS) and total network resources. Simply put the more compute you have the more transactions can be processed. Network resources can then dynamically scale specific attributes such as transaction verification therefore directly increasing transactions per second.

Scalability potential stems from the modularity of the Viat super structure. The super structure itself is modular but is still cryptographically linked. This design means different parts of the network can have their own attributes and throughput without compromising other components. Different parts of the network operate in parallel and do not block other operations. Components internally to a degree can operate in parallel but specific wallets actions such as sending Viat out of the same address must still have a linear order but the operations themselves can be concurrent.

## RISC LIKE THINKING

Viat favors small consistent predictable contained operations over larger dynamic stacked operations. Instead of multiple transactions/operations forced into blocks Viat is in direct position of that perspective opting to instead keep it one transaction per-block. Simple concise consistent instructions are faster, easier, more efficient and more optimizable than something that is less predictable and has to be broken down first to be processed.
