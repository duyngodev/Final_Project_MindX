const express = require("express");
const routers = express.Router();

const User = require("../model/user.model.js");
const Admin = require("../model/admin.model.js");
const Teacher = require("../model/teacher.model.js");
const Student = require("../model/student.model.js");

const schemaSignUp = require("../share/schemaCreateAccount..share.js");
const hashPassword = require("../share/hashPass.share.js");
const findOneAccountAndUpdate = require("../share/findOneAccountAndUpdate.share.js");
const deleteFields = require("../share/deleteFiels.share.js");

/**PAGINATION GET ALL USERS
 * totalUsers
 * limit
 * totalPages
 * currentPage
 * data: [ users ]
 */
routers.get("/", async (req, res) => {
  //paginations
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;
  const totalUsers = await User.countDocuments();
  // fetching
  User.find()
    .skip(skip)
    .limit(limit)
    .select("-admin -teacher -student")
    .then((users) => {
      if (!users) return res.status(404).send({ message: "No users found" });
      return res.status(200).send({
        totalUsers,
        limit: parseInt(limit),
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: parseInt(page),
        data: users,
      });
    })
    .catch((err) => res.status(500).send({ message: "Error", err }));
});

/** GET ACCOUNT + DETAILS BY ID
 * id from params
 * find account
 * find details   -password
 * send account, acound details
 */
routers.get("/:id", async (req, res) => {
  const _id = req.params.id;
  const account = await User.findOne({ _id }).populate("admin").populate("teacher").populate("student").lean();
  if (!account) res.status(404).send({ message: "account not found" });
  const accountDetails = account.admin || account.student || account.teacher || null;
  if (!accountDetails) res.status(404).send({ message:"account detail not found" });
  const accountDeleteFields = deleteFields(account);
  delete accountDetails.password;
  delete accountDetails._id;
  // const accountDetails = admin
  //   ? await Admin.findOne({ _id: admin._id }).select("-password")
  //   : teacher
  //   ? await Teacher.findOne({ _id: teacher._id }).select("-password")
  //   : student
  //   ? await Student.findOne({ _id: student._id }).select("-password")
  //   : null;
  // if (!accountDetails) return res.status(404).send("Details acount not found");

   // delete the admin, student, teacher : _id

  return res.status(200).send({
    message: "get account by ID successfully",
    account: accountDeleteFields,
    accountDetails,
  });
});

/**ADMIN CREATE NEW ACCOUNT
 * create schema
 * validate input { email, username, password }
 * check existing account {username, email}
 * hashed password
 * add data to Collection [ADMIN] + hass-pass ===> [USER] + username + email
 */
routers.post("/admincreate", async (req, res) => {
  const schema = schemaSignUp("admin");
  const { username, email, password } = req.body;
  const role = "admin";
  //   Validate input
  const { error } = schema.validate({ username, email, password, role });
  if (error)
    return res
      .status(400)
      .send({ message: "Invalid username or password", error });
  // Check Account Exists
  const accountUsername = await User.findOne({ username });
  if (accountUsername) return res.status(400).send("Username already in use");
  const accountEmail = await User.findOne({ email });
  if (accountEmail) return res.status(400).send("Email already in use");
  // Add to User Collection + Admin Collection
  const newAdmin = new Admin({
    password: await hashPassword(password),
  });
  await newAdmin.save();
  const nerUser = new User({
    email,
    username,
    role: [role],
    admin: newAdmin._id,
  });
  await nerUser.save();
  return res.send("New Admin created successfully");
});

/** ADMIN ADDS ADMINROLE TO ANY USER - BY ID
 * Find by id
 * addToSet - include unique role only
 * delete fileds admin teacehr student in res
 */
routers.put("/addadminrole/:id", async (req, res) => {
  const _id = req.params.id;
  User.findOneAndUpdate(
    { _id },
    { $addToSet: { role: "admin" } },
    { new: true }
  )
    .then((account) => {
      if (!account) res.status(404).send({ message: "account not found" });
      const accountDeleteFields = deleteFields(account.toObject());
      return res.status(200).send({
        message: "Admin role added successfully",
        account: accountDeleteFields,
      });
    })
    .catch((err) =>
      res.status(500).send({ message: "Server error 500", error: err })
    ); // only availeble for user is not Admin

  /**
   * Add more role only
   */
});

/** ADMIN UPDATE USERS BY ID
 * find Account
 * determine Model - _id
 * share function - findOneAccountAndUpdate   -- not include password
 */
/**
 * TODO: IMAGE upload
 */
routers.put("/:id", async (req, res) => {
  const _id = req.params.id;

  const { name, imageUrl, age, sex, department } = req.body;
  const account = await User.findOne({ _id }).lean();
  if (!account) res.status(404).send({ message: "account not found" });
  const { student, admin, teacher } = account;

  const Model = admin ? Admin : teacher ? Teacher : student ? Student : null;
  const id = admin
    ? admin._id
    : teacher
    ? teacher._id
    : student
    ? student._id
    : null;
  if (!Model || !id) {
    return res.status(404).send("Invalid account details");
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
});

/** ADMIN DELETE ANY USER - BY ID
 * TODO: actully remove the users and its details
 */
routers.delete("/:id", async (req, res) => {
  const _id = req.params.id;
  const account = await User.findOne({ _id }); // findOne and Delete
  if (!account) res.status(404).send({ message: "account not found" });
  const { admin, student, teacher } = account;
  const accountDetail = admin
    ? await Admin.findOne({ _id: admin._id })
    : student
    ? Student.findOne({ _id: student._id })
    : teacher
    ? Teacher.findOne({ _id: teacher._id })
    : null;
  if (!accountDetail) {
    // await User.deleteOne({ _id });      //Delete account
    return res.status(404).send({ message: "Account Details not found" });
  } else if (accountDetail) {
    // Delete the account details
    /**if (admin) {
    await Admin.deleteOne({ _id: admin._id });
  } else if (student) {
    await Student.deleteOne({ _id: student._id });
  } else if (teacher) {
    await Teacher.deleteOne({ _id: teacher._id });
  }

  // Delete the main user account
  await User.deleteOne({ _id });
  */
    return res.status(200).send({ message: "Deleted okay" });
  }
});
module.exports = { userCrudAdminRoute: routers };
