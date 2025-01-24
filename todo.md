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

Auto/manual update client and or server's IP & Port
timeout for extended header
Set state when session is completed fully so that those steps cant be re-done
Update all crypto middleware double check all files
Change update states to use predefined variables instead of numbers

Add security checks for crypto middleware and try/catch to deny and or gracefully close
Consider pre-compiling keys if it saves space removing older or unused data

COMPACT MODE (CONDENSE REQUESTS/RESPONCE MAXIMIZE MTU SIZE BY INCLUDING MULTIPLE FRAMES IN A SINGULAR PACKET)
Multi FRAME REQUEST Packet condense requests to singular packet instead of sizes array of the frame used (SPEED UP REQUESTS) AUTO CALC sizes
Multi FRAME RESPONSE Packet condense response to singular packet instead of sizes response AUTO CALC sizes

JUMBO MODE
A future feature which can take advantage of JUMBO Frames for intranet situations.

Add universal request type that can handle all data sections params data could be no reason to have method types or are they usefull to help determine what basic server operations

Advertise UW devices on a local network (Announcement UPnP)

Disover Local Network UW devices

Ping packet - encrypted using domain certificates handshake/key exchange public key (mimic ICMP) (net-ping raw-socket)

Wallet Address Changes alias

Domain Certificate Apps stored inside the domain certificate static assets would still need to be stored on server and has a dependency tree which could be pre-loaded Cache JS and CSS common libraries so that it could be easily and quickly utilized create a package.json section inside a domain certificate to create offline sort of apps. Consider and install script inside it to install app locally then be able to use it as if it were a snap app ete but has security to limit low level access as usual

Streamline var names to generic ones for crypto middleware

Expand Kyber shared secret into 512bit 64byte hash then split this hash as the session keys. MANDATORY

Make crypto operations async

scoring number system for security hash plus key exchange + aead + sig IMPORTANT WRITE FUNCTION TO AUTO GRADE CIPHER SUITES

Add viat address checksum error reporting to avoid bad or incorrect addresses

re-add encryption overhead

change generateConnectionId to hex binary mode (auto generate as buffer then use random bytes or counter)

Remove unused Keypairs & CipherText/CipherData zero out old data then see if can use existing buffers IMPORTANT

Update UW Profile & VIAT Wallet to new CIPHER SUITE

Address ShortHeader Mode and avoid redundant encoding of header and or mesage

Make all crypto operations async by default to future proof

Make sure a connection cant skip steps - handshake must be enforced
