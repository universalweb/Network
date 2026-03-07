# Hierarchical Deterministic Seed Derivation Trie

Post-Quantum Universal Identity System

- Post-Quantum Ready
- Supports Hierarchical Deterministic Key pairs
- Supports Hierarchical Deterministic Wallets
- Supports Hierarchical Deterministic Keys
- 3 Sources of Entropy 256 Bytes each
- 1 Master Seed
- 1 Master Key
- 1 Master Nonce
- Supports Seed Isolation
- Supports Seed Grouping
- Support Seed Checkpoints
- Supports Relational Proofs


The foundation of Viat's Identity System

## Overview
Viat uses seed-based hierarchical deterministic (HD) seed generation with checkpoint compatibility. Checkpoints let users carry a scoped set of child keys while keeping the master seed offline. If a checkpoint seed is exposed, only its descendant keys are affected — the master seed and unrelated checkpoints remain secure.

HD keypairs are a core component of the VIAT identity system, which provides a universal identity layer for the broader VIAT network.

User Creates Root Identity
User Requests Identity Schema/Spec from service
User generates deterministic key pair using meta details and their own master seed and master key


## Design Principles
- Deterministic: All seeds and keys are derived deterministically to enable reproducible checkpoint generation and recovery.
- Least privilege: Authority seeds (checkpoints) are purpose-scoped and limit the scope of exposure when carried.
- Revocability: Authority seeds can be revoked or rotated according to policy.
- Compartmentalization: Daily/operational keys are isolated from authorities and the master seed.
- Forward compatibility: Design anticipates post‑quantum resilience where applicable.

## Seed Hierarchy
### Master Seed
- High-value root seed — keep in cold storage.
- Used to derive authority seeds and other high-level authorities.
- Never used for day-to-day signing or routine operations.

### Authority Seeds (Checkpoints)
- Deterministically derived from the master seed.
- Purpose-scoped and limited in derivation depth.
- Transportable and exchangeable for operational use.
- Can be revoked or rotated without exposing the master seed.

### Operational Keys
- Derived only from an authority seed (checkpoint).
- Used for daily operations and signing.
- Compromise of an operational key is contained to that key and its limited descendants.

## Checkpoint Workflow
- Generate master seed and store offline (cold storage).
- Derive authority seeds for specific purposes (wallets, devices, services).
- Export or carry a checkpoint when operational access is needed.
- Derive operational keys from the checkpoint for routine use.
- Revoke or rotate authority seeds as policy or threat model dictates.

## Compromise & Recovery
- If an authority seed is compromised: revoke/rotate that checkpoint and re-derive new authority seeds from the master seed. Only keys derived from the compromised checkpoint are affected.
- If an operational key is compromised: revoke the key and replace it from the parent checkpoint; no need to expose the master seed.
- If the master seed is compromised: full recovery requires regenerating the identity from a secure root and re-provisioning authority seeds and operational keys.

## Best Practices
- Store the master seed offline in secure cold storage.
- Limit derivation depth and scope for authority seeds.
- Implement rotation and revocation procedures for authority seeds.
- Use distinct authority seeds for different purposes (devices, services, geographic regions).
- Audit key usage and maintain a recovery plan for stolen or lost checkpoints.

## Notes
- This document describes the HD keypair architecture and operational model. Implementation details (algorithms, serialization formats, and API usage) belong in the implementation reference and specification documents.


Root = certificate authority / sovereign seed space
Branch = delegated intermediate authority
Leaf = service credential / account / concrete keypair

branches can derive downward within their own subtree
root is required to create peer/top-level branches
optionally let some branches be marked as autonomous subtree masters for portable use

DelegatedProfile (or AutonomousProfile)
AnchoredProfile (or TetheredProfile)  - REQUIRES MASTER ENTROPY POOLS
ServiceCredential or ProfileKey -> FINAL
HardenedProfile (and HardenedCredential) -> FINAL WITH MASTER ENTROPY POOL REQUIRED
