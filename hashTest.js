module.exports = (async () => {
  const crypto = await require('./crypto')();
  const hashed = crypto.hash(Buffer.from('TESTING !@##$#JHFKJHFKHKJEHLFHLKWEHJEWHKRHWLKRJHWLRJHWKJHRKWJHFKJHFKHK'));
  const hashedOther = crypto.hash(Buffer.from('TESTING !@##$#'));
  console.log(hashed.toString('base64'), hashedOther.toString('base64'));
})();
