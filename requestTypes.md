# Universal Web Socket - REQUEST TYPES

There are several types of requests that can be preformed over a Universal Web Socket connection.
They each have specific use cases and data structures and all requests types can happen simultaneously over a single Universal Web Socket connection.

 - Request = Standard request response with reliability
 - Emit = This will simply push data to the server/client not expecting a response but has reliability
 - Stream = This is used for video streaming and doesn't require full reliability as some frames can be skipped
    - Reliability can be adjusted for streams
 - Send = A raw send function
