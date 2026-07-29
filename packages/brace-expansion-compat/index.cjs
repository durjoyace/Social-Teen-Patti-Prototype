const modern = require('brace-expansion-modern');

function braceExpansion(pattern) {
  return modern.expand(pattern);
}

module.exports = braceExpansion;
module.exports.expand = modern.expand;
module.exports.EXPANSION_MAX = modern.EXPANSION_MAX;
module.exports.EXPANSION_MAX_LENGTH = modern.EXPANSION_MAX_LENGTH;
