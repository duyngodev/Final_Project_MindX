const bcrypt = require("bcrypt");
async function hashPassword(pass) {
  const salt = await bcrypt.genSalt(parseInt(process.env.SALT));
  const hash = await bcrypt.hash(pass, salt);
  return hash;
}

module.exports = hashPassword;
