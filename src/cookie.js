function parse(raw) {
  const parsed = {};
  for(const cookie of raw) {
    const [ pair, ...opts ] = cookie.split(';');
    const [ name, value ] = pair.split('=');
    parsed[name] = cookie;
  }
  return parsed;
}

function join(object) {
  const result = [];
  for(const cookie in object) {
    result.push(object[cookie])
  }
  return result.join("; ");
}

module.exports = {
  parse,
  join
}