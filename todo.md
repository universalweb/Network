# TODO

If intro time is greater than introGracePeriod or heartbeat then ignore and or close the connection.
Finish latency calculations and security.
Add option to not use smart routing connection ids if using change address no need just bypass loadbalancer instead.
Add metrics to efficiently distribute via loadbalancer to server instances.
Add upgrade to realtime packet for client to server and server to client.
Add auto upgrade to realtime connection FROM server.
Add/enable auto realtime mode for domain certs.
Add way to skip path for requests and auto set filepath to '/'.
Make DIS check for certificate when sending or when created - means move part of initialization to its own method so DIS can be checked then continue with request
Enforce Realtime options for server side
Data Streams and breaking up downloads with write a stream
initialRealtimeGracePeriod
Add ability to either have multiple encryption keypairs or have x25519+Kyber be able to also do either or for a client so client can connect with only kyber, hybrid, or x25519
Might need to add way for them to check which ciphers are compatible with its keys
Means you need to create a hybrid full ciphersuite for that to happen then it can support both
Make sure that client cant choose incompatible cipher based on encryption keypair?
Modify certs so that encryption keypair algorithm is specified so that hybrid options can exist?
this allows clients to auto choose the best ciphersuite according to the encryption algorithm used
Make encryption keypair hybrid of both to support kyber half, x25519, kyber, or x25519kyber(strict)
Auto/manual update client and or server's IP & Port
timeout for extended header
Set state when session is completed fully so that those steps cant be re-done
Update all crypto middleware double check all files
Change update states to use predefined variables instead of numbers
