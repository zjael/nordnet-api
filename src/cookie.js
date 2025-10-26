function parse(raw) {
  const parsed = {};
  for(const cookie of raw) {
    const [ pair, ...opts ] = cookie.split(';');
    const [ name, value ] = pair.split('=');
    parsed[name.trim()] = value ? value.trim() : '';
  }
  return parsed;
}

function join(object) {
  const result = [];
  for(const name in object) {
    result.push(`${name}=${object[name]}`);
  }
  return result.join("; ");
}

module.exports = {
  parse,
  join
}