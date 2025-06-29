# How are URL parameters handled compared to HTTP? EXPERIMENTAL NOT FINAL

Instead of URL parameters being part of the Request-line they are turned into an structured object with binary support.
This enables: the ability for complex URL parameter requests, request are safer, no need to sanative, doesn't require URL encoding went sent, doesn't require URL decoding, less client side code, less server side code, less code complexity, easier to type, can support binary parameters, and are easier to understand.

The Universal Web has a unique URL & URL parameter structure for the UW which enables more complex written URLs using a sort of JSON or structured object syntax which if done through a script could include binary data as well.

##### Take this URL `example.com/profile?id=1&user=<[universal web^]>`

If we wanted to use this URL with HTTP we would need to encode it to this absolute chaos that is encodeURI
`example.com/profile?id=1&user=%3C%5Buniversal%20web%5E%5D%3E`

##### The Universal Web evolves this decades old syntax with modern solutions

The average person can more easily understand & type JSON/Object/Array syntax than a huge mess of % signs with numbers.
`example.com/profile/{'id':1,'user':'<[universal web^]>'}`
There is another format which is used to support binary or complex parameter names but it could be used instead of the object syntax
`example.com/api/[['id',1],['user','<[universal web^]>']]`

Using the array syntax if it was only one parameter
`example.com/api/['user','<[universal web^]>']`

#### Modernize URLs with fully structured binary supported URL parameters

The Universal Web is designed to be an evolution of the World Wide Web in a myriad ways & complex fully structured URLs is one of them.
