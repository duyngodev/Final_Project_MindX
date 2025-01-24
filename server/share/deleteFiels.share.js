function deleteFields(account) {
  const acc = account;
  const fields = ["teacher", "student", "admin"];
  fields.forEach((field) => delete acc[field]);
  return account;
}
module.exports = deleteFields;
