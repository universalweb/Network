(async () => {
	const {
		compress
	} = require('iltorb');
	const input = Buffer.from(`{"end":1649229779549,"ip":"192.168.1.1","key":"jf/Xn9sgjSVbbiyNXkmTc0TAttGFwdh/HfjQCZhOt2Q=","pad":900,"port":80,"signature":"uNH55oX7Ue027rsYSIpC12CBrutVguBj14MOWldnLx6bc0KSJ5R6VIRAXsgBkcSDWS5ZbO0pdTQ1cp/1S7dSAo2suBWSpp2LlTGW4cEyWoxEWtZW2q4uGXlm5wxsn3bC","start":1549229779549,"version":1}`);
	console.log('lzutf8', input.length, (await compress(input)).length);
})();
