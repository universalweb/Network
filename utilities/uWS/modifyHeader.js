function modifyHeader(res, key, value, end) {
	res.writeHeader(key, value).end(end);
}

module.exports = modifyHeader;
