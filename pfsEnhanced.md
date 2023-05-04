# Perfect Forward Secrecy Enhanced

### For enhanced privacy measures against possible future, present, and past attacks using as little packets as possible

All keypairs are used for a keyexchange algorithm but do not do any encrypting. All connections are 0RTT by default and use as little packets as possible but put the burden on clients so servers and the protocol cant be used in amplification attacks. Client must always be forced to send more than what can be produced by the servers initial responses. The idea is to have clients always have to do more work and use more data than their attack can produce. All help to reduce amplification attacks.

Tactic 1)
Server responds with another ephemeral keypair during initial handsake and within the first packet it sends to the client.

Tactic 2)
Proxy Server stands between other servers which uses its own keypair then provides a keypair for the origin server which the client will then be proxied to.

Tactic 3)
Combine both tactic 2 and 1 which protects proxies and local Name Servers (which are used for virtual servers to connect clients to a specific virtual host).

Client Connects
 DIS (returns proxy server or Name Server's certificate)
  Proxy or Name Server returns certificate for origin server
   Client sends one packet with ephemeral certificate & auto-login is enabled by default which sends identity certificate in the packets encrypted body
    Origin server sets up client state
     Origin server responds in the first packet with new ephemeral keypair for further communication
