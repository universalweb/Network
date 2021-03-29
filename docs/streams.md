# Universal Web Socket - STREAMS

###STREAM
A STREAM is a unique CHANNEL which allows for the client and the server to communicate. A UDSP Connection can consist of several types of STREAMs.
STREAMs have two stream primary types PUSH or REQUEST.

##CHANNEL
A CHANNEL is a unique ID that points to an active STREAM. CHANNEL's are typically automatically assigned to new STREAMs by default but in some specific contexts may be assigned manually or not at all.
Streams without a CHANNEL ID are used to send data to a server without reliability or a response.

##STREAM ID (SID)
A STREAM is identified by its channel which can be located in a packet by its lowercase abbreviation "sid" or "s".
All data sent to another endpoint must contain a channel. A SID is used to keep track of requests, ensure that it was reliably delivered, and so that the endpoint knows what channel to respond to.

##PUSH
A PUSH doesn't expect any data back. However, a PUSH could trigger an API method server side which sends back a push payload or even a server-side REQUEST.
A server REQUEST is akin to a client REQUEST. A server REQUEST is initiated by the server and awaits for an answer from the client.

##REQUEST
A REQUEST is a type of STREAM that expects & waits for an answer from the endpoint. A REQUEST STREAM is akin to a typical HTTPS request.

which can have a request ID assigned to
