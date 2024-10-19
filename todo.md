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
