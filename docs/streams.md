# Universal Web Socket - STREAMS

###STREAM
A STREAM allows for a client and server to communicate. A UDSP Connection can consist of several types of STREAMs.
STREAMs have two stream primary types PUSH or REQUEST.

##CHANNEL
A CHANNEL is a unique ID that points to an active STREAM. CHANNEL's are typically automatically assigned to new STREAMs by default but in some specific edge cases may be assigned manually or not at all.
A STREAM which requires any sort of response or reliability must contain a CHANNEL. A STREAM's CHANNEL can be located in a packet by its lowercase abbreviation "sid" or "s".

##PUSH
A PUSH doesn't expect any data back. However, a PUSH could trigger an API method server side which sends back a push payload or even a server-side REQUEST.
A server REQUEST is akin to a client REQUEST. A server REQUEST is initiated by the server and awaits for an answer from the client.

##REQUEST
A REQUEST is a type of STREAM that expects & waits for an answer from the endpoint. A REQUEST STREAM is akin to a typical HTTPS request.

which can have a request ID assigned to
