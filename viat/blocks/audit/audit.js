// Auditor Block (hash of each individual wallet state)
// Allows for confirmation of the state by confirming wallets first
// Individual wallet states can then be hashed and used as a state summary
// Hash all them together to get the final state
// Allow progressive hashing to check for wallet state differences to narrow down the search to identify wallets that might not be fully synced

