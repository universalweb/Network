<h1 align="center">
    <a href="uw://universalweb.io">UNIVERSAL WEB</a>
</h1>
<p align="center">
| <a href="https://github.com/universalweb/Whitepaper">WHITEPAPER (OUTDATED - OLD DESIGN)</a> |
</p>
<hr />
<h1 align="center">UW://</h1>
<p align="center">
    META-LAYER SOLUTION
</p>
<p align="center">
    LAYER SUBZERO | LAYER -1 | SUB-LAYER 0
</p>
<p align="center">
    <b>UW/VIAT is a Meta-Layer Solution designed as a Sub-Layer 0 network. It serves as the foundation for both a next-generation Web and a natively supported cryptocurrency. Unlike traditional Layer 0 solutions, which focus solely on blockchain interoperability and scalability, UW/VIAT is a hybrid system that embraces both centralized and decentralized approaches. The Universal Web is centrally structured to ensure efficiency, security, and seamless integration, while the cryptocurrency (VIAT) is decentralized, enabling trustless transactions and complete transparency. This unified framework enables the development of hybrid applications, where centralized Web services and decentralized cryptocurrency natively work together, creating a seamless infrastructure for secure communications, digital ownership, transactions, and beyond.</b>
</p>

<h5 align="center">| <a href="https://x.com/tommarchi">LEAD DEV X(Twitter)</a> |</h5>
<hr />

<h3 align="center">ATTENTION</h3>
<h4 align="center">Want to contribute? Don't like ICANN, IETF, TCP, HTTP, bureaucratic committees and or the WWW? Then join the Imperium today!</h4>

<p align="center">
    <small>To help just submit code or star this repo! All are welcome to the New Web Order.</small>
</p>

<h3>Perspective</h3>
<p>The World Wide Web has evolved for decades but its general design, limitations, & components have largely remained the same. Our needs & desires have rapidly outgrown the initial design & purpose of the Web. What if the Web was built today with modern tech and a modern view?</p>

<h4>Goals</h4>
<p>The objective of the Universal Web is to create a viable modern replacement for the Web today.</p>

<h4>Is it Web3?</h4>
<p>Depends on your definition. If the definition of Web3 is a fully decentralized Web then The Universal Web is not Web3 it's far more robust. If Web3 is the World Wide Web plus some decentralized apps then the UW is not Web3. If we had to use WEB3 then our definition of Web3 is a hybrid Web built from scratch with its own form of DNS & its own data transport protocol paired with a natively intigrated decentralized focused cryptocurrency.</p>

<h4>Where's the name from?</h4>
<p>The Universal Web's name was chosen because of its natural evolution of the name The World Wide Web.</p>

<h4>Internet vs Web</h4>
<p>The Web is all the software bits that sits on-top of the Internet. The Universal Web at least for now is only concerned with software no special hardware is required. Users just need software to access the Universal Web and Servers just need software to setup a Universal Web server.</p>

<h4>SUMMARY</h4>
<ul>
    <li><a href="https://github.com/universalweb/Network/tree/master/udsp/server">UDSP MODULE (CONTAINS SERVER & CLIENT MODULE)</a></li>
    <li><a href="https://github.com/universalweb/Network/tree/master/udsp/server">SERVER MODULE (CHECK THE UDSP FOLDER & IMPORTS FOR FULL CODE)</a></li>
    <li><a href="https://github.com/universalweb/Network/tree/master/udsp/client">CLIENT MODULE (CHECK THE UDSP FOLDER & IMPORTS FOR FULL CODE)</a></li>
    <li><a href="https://github.com/universalweb/Network/tree/master/browser">BROWSER (outdated)</a></li>
    <li><a href="https://github.com/universalweb/Network/tree/master/serverApp">EXAMPLE APP (npm run server)</a></li>
    <li><a href="https://github.com/universalweb/Network/tree/master/scripts/certificates.js">BUILD DOMAIN & IDENTITY CERTIFICATES THAT ARE ALSO VIAT WALLETS (npm run certificates)</a></li>
    <li><a href="https://github.com/universalweb/Network/tree/master/scripts/simulateClient.js">SIMULATE CLIENT REQUEST (npm run simc) (ONLY RUN WHEN DEMO IN A STABLE COMMIT NOT LATEST UNLESS SPECIFIED)</a></li>
    <li><a href="https://github.com/universalweb/Network/tree/master/scripts">VARIOUS HELPER SCRIPTS</a></li>
</ul>
<b>ONLY RUN NPM COMMANDS WHEN COMMIT DESCRIPTION SAYS DEMO STABLE OR DEMO ENABLED</b>
<br />

<h4><a href="https://github.com/universalweb/Network/blob/master/package.json">NPM SCRIPTS</a></h4>

<ul>
    <li>NPM start script builds/starts the Universal Web Browser</li>
    <li>Components must also be compiled for the front-end library</li>
    <li>Root is used to generate root certificates only</li>
    <li>Includes Identity Certificate generation examples</li>
    <li>EXAMPLE APPS</li>
    <li>UDSP</li>
    <li>UW URI (HIGHER ABSTRACTION PROTOCOL OVER UDSP)</li>
    <li>VARIOUS HELPER SCRIPTS</li>
</ul>

<br />

<h5>FULL LIST OF COMMANDS CAN BE FOUND IN THE project.json</h5>

<hr />

<h2>DEV REQUIREMENTS</h2>

<p>
    <i>Development is primarily done on <b>Mac</b> & <b>Linux (ARCH)</b>.</i>
</p>

<ul>
    <li><a href="https://nodejs.org/en/">NODEJS</a></li>
    <li><a href="https://code.visualstudio.com/">VSCODE</a></li>
</ul>

<h5>BROAD CODE OBJECTIVES</h5>
<ul>
    <li>UW UDP Based Protocol</li>
    <li>UW Server</li>
    <li>UW Client</li>
    <li>UW DIS (Alternative to DNS)</li>
    <li>UW Web Apps</li>
    <li>Multi-OS Support</li>
    <li>Multi-Device Support</li>
    <li>UW Browser/Wallet</li>
    <li>Viat</li>
</ul>

<h2>Questions</h2>

<h4>Is the UW's DIS and the WWW's DNS the same?</h4>
<p>The World Wide Web has the Domain Name System, Web3 has Decentralized DNS, & the Universal Web has a similar component called the DIS(Domain Information System). Here's the critical difference DNS takes a hostname and spits out a DNS record (has things like an IP address) the DIS returns a cryptographic signed certificate. The returned certificate can have records akin to DNS records in it but is part of a cryptographically protected and verifiable certificate. The DIS plays a similar role to DNS but the DIS has greater functionality, has similar syntax, distributes only cryptographic certificates, and was designed with all other components in mind. Because the DIS provides a certificate instead of just a basic DNS record it makes connection establishment faster and more secure, specifically speeding up the handshake process. When browsing the UW all domain lookups would go to the remote and or local DIS (cached). The entire DIS is a publicly verifiable blockchain but old certificates can be replaced which means Domain record changes are quick and easy with a 0TTL. The DIS doesn't share any domains or rules with the Web's Domain system meaning domain names don't carry over. The UW also permits emoji domains as well as single name domains. Reserved named domains are domains consisting of just a name to quickly access the site for example you just type "x" to go to "x.com".</p>

<h4>It's crazy to rebuild the Web why not improve it?</h4>
<p>The idea of rebuilding the Web from scratch may seem radical initially, but when we acknowledge the state of the Web and its challenges, it becomes clear that incremental improvements will not be enough to address fundamental issues. It would be cheaper and quicker to take what we have learned from the last 30 years and build a streamlined yet flexible replacement.</p>

<p>The Web as we know it today has evolved organically over decades, resulting in a patchwork of technologies, standards, and protocols. This haphazard evolution has led to compatibility issues, security vulnerabilities, limitations, and performance bottlenecks. We can surpass what we have today but the only viable way to do that is by starting from a new foundation.</p>

<small>COPYRIGHT © 2024 <a href="https://universalweb.io">UNIVERSAL WEB</a></small>
