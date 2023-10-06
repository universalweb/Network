const raw = require('raw-socket');
const socket = raw.createSocket({
	protocol: raw.Protocol.UDP,
	addressFamily: raw.AddressFamily.IPv6,
});
socket.setOption(raw.SocketLevel.IPPROTO_IP, raw.SocketOption.IP_HDRINCL, Buffer.from([1]));
socket.send(udpPacket, 0, udpPacket.length, destinationPort, destinationIp, (err) => {
	if (err) {
		console.error(`Error sending packet: ${err}`);
	} else {
		console.log('Packet sent successfully');
	}
	socket.close();
});
