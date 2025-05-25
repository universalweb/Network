# Cryptographic Profile

A Cryptographic Profile functions as an encrypted self-contained enclave that can store preferences, encrypted wallets, & encrypted cryptoIDs.
A profile can be exported and imported to easily transition to different personal devices. The design of crypto profiles is ideal for storing profiles in the cloud to securely synchronize activity between devices. Crypto profiles are encrypted & individual items such as wallest are self-encrypted then if the cloud is compromised the important details are still safe. Profiles protect their contents by having multiple layers of encryption. Once the profile is decrypted the individual wallets and cryptoIDs are still encrypted with their own key. However, encryption of contents is still up to the user to choose and set. Keeping encryption of different things optional ensures users have the flexibility to choose their own balance of usability and security.

A Cryptographic Profile has its own unique key pair consisting of a Signature Key Pair and a Key Exchange Key Pair.
A profile is an encrypted enclave which can hold any amount of cryptographic IDs and or VIAT wallets.
This ensures there is the option to have separate login credentials for sites, services, & wallets.
Unique key pairs could be generated for different services yet can be managed under a singular profile for easy import & export.
Different wallets could also be used for different services or actions which helps limit security breaches.
Each cryptoID & wallet could also be encrypted and contained when stored within a profile.
This ensures if the profile is copied the individual wallets and cryptoIDs are still self-contained and encrypted further limiting harm.

