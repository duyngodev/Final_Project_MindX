const express = require("express");
const routers = express.Router();

const User = require("../model/user.model.js");
const Student = require("../model/student.model");
const Teacher = require("../model/teacher.model");

const deleteFields = require("../share/deleteFiels.share.js");
const findOneAccountAndUpdate = require("../share/findOneAccountAndUpdate.share.js");

routers.get("/", (req, res) => {
  res.status(200).send({ message: "okela" });
});

/** USER GET ACCOUNT DETAILS BY ID
 * findOneByID
 *
 */
routers.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const account = await User.findOne({ _id: id })
      .populate("student")
      .populate("teacher")
      .lean();
    if (!account) res.status(404).send({ message: "Account not found" });
    const accountDetails = account.student || account.teacher || null;
    if (!accountDetails)
      res.status(404).send({ message: "Account Details not found" });
    const accountDeleteFields = deleteFields(account);
    delete accountDetails.password;
    delete accountDetails._id;
    return res.status(200).send({
      message: "get account by ID successfully",
      account: accountDeleteFields,
      accountDetails,
    });
  } catch (err) {
    return res.status(500).send({ message: "Server error" });
  }
});

routers.put("/:id", async (req, res) => {
  const _id = req.params.id;
  const { name, imageUrl, age, sex, department } = req.body;
  try {
    const account = await User.findOne({ _id }).lean();
    if (!account) res.status(404).send({ message: "account not found" });
    if (account.role.includes("admin"))
      res.status(403).send({ message: "Permission required" });
    const { student, teacher } = account;

    const Model = teacher ? Teacher : student ? Student : null;
    const id = teacher ? teacher._id : student ? student._id : null;
    if (!Model || !id) {
      return res.status(404).send("Account detail not found");
    }

    const accountDeleteFields = deleteFields(account);
    findOneAccountAndUpdate({
      Model,
      account: accountDeleteFields,
      id,
      name,
      imageUrl,
      age,
      sex,
      department,
      res,
    });
  } catch (err) {
    return res.status(500).send({ message: "Server error", error: err });
  }
});

module.exports = { userCrudRoute: routers };
