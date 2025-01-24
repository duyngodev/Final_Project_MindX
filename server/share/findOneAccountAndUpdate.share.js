function findOneAccountAndUpdate({
  Model,
  account,
  id,
  name,
  imageUrl,
  age,
  sex,
  department,
  res,
}) {
  Model.findOneAndUpdate(
    {
      _id: id,
    },
    { name, imageUrl, age, sex, department },
    { new: true } // to get new data
  )
    .select("-password -_id")
    .then((updatedAccount) => {
      if (!updatedAccount)
        return res.status(404).send("Account not found, update failed");

      return res.status(200).send({
        message: "updated successfully",
        account: account,
        updatedAccount: updatedAccount,
      });
    })
    .catch((error) => {
      return res.status(400).send({ message: "update error", error: error });
    });
}
module.exports = findOneAccountAndUpdate;
