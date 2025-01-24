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
 * query as an array - filter by valid.includes(role) - validRoles = ['teacher','student','admin']
 * limit
 * totalPages
 * totalUsers
 * currentPage
 * data: [ users ]
 */
routers.get("/", async (req, res) => {
  try {
    // Make Array of query Roles
    const validRoles = ["teacher", "student", "admin"];
    const queryRole = Array.isArray(req.query.role) // Neu role inpur la array
      ? req.query.role
          .map((character) => character.toLowerCase())
          .filter((role) => validRoles.includes(role))
      : req.query.role //neu role input la 1 variant
      ? [req.query.role.toLowerCase()].filter((role) =>
          validRoles.includes(role)
        )
      : null;
    let query = {}; // default parame for find()
    if (queryRole) {
      query.role = { $in: queryRole };
    }
    //paginations
    const totalUsers = await User.countDocuments(query);
    const limit = req.query.limit || 10;
    const totalPages = Math.ceil(totalUsers / limit);
    const page = req.query.page || 1;
    if (page > totalPages) {
      return res.status(400).send({
        message: "Page value is out of range",
        totalPages,
        currentPage: parseInt(page),
      });
    }
    const skip = (page - 1) * limit;
    // fetching
    User.find(query)
      .skip(skip)
      .limit(limit)
      .select("-admin -teacher -student")
      .then((users) => {
        if (!users) return res.status(404).send({ message: "No users found" });
        return res.status(200).send({
          totalUsers,
          limit: parseInt(limit),
          totalPages,
          currentPage: parseInt(page),
          data: users,
        });
      });
  } catch (err) {
    return res.status(500).send({ message: "Server error" });
  }
});

/** GET ACCOUNT + DETAILS BY ID
 * id from params
 * find account
 * find details   -password
 * send account, acound details
 */
routers.get("/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const account = await User.findOne({ _id })
      .populate("admin")
      .populate("teacher")
      .populate("student")
      .lean();
    if (!account) res.status(404).send({ message: "account not found" });
    const accountDetails =
      account.admin || account.student || account.teacher || null;
    if (!accountDetails)
      res.status(404).send({ message: "account detail not found" });
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

/**ADMIN CREATE NEW ACCOUNT
 * create schema
 * validate input { email, username, password }
 * check existing account {username, email}
 * hashed password
 * add data to Collection [ADMIN] + hass-pass ===> [USER] + username + email
 */
routers.post("/admincreate", async (req, res) => {
  try {
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
  } catch (err) {
    return res.status(500).send({ message: "Server error" });
  }
});

/** ADMIN ADDS ADMINROLE TO ANY USER - BY ID
 * Find by id
 * addToSet - include unique role only
 * delete fileds admin teacehr student in res
 */
routers.put("/addadminrole/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    User.findOneAndUpdate({ _id }, { $addToSet: { role: "admin" } }).then(
      (account) => {
        if (!account) res.status(404).send({ message: "account not found" });
        const accountDeleteFields = deleteFields(account.toObject());
        return res.status(200).send({
          message: "Admin role added successfully",
          account: accountDeleteFields,
        });
      }
    );
  } catch (err) {
    return res.status(500).send({ message: "Server error" });
  }
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
  try {
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
    return res.status(500).send({ message: "Server error" });
  }
});

/** ADMIN DELETE ANY USER - BY ID
 * TODO: actully remove the users and its details
 */
routers.delete("/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const account = await User.findOne({ _id }); // findOne and Delete
    if (!account) res.status(404).send({ message: "account not found" });
    const { admin, student, teacher } = account;
    const accountDetail = admin
      ? await Admin.findOne({ _id: admin._id }) // find one and delete
      : student
      ? await Student.findOne({ _id: student._id }) // find one and delete
      : teacher
      ? await Teacher.findOne({ _id: teacher._id }) // find one and delete
      : null;
    if (!accountDetail)
      return res.status(404).send({ message: "Account Details not found" });
    /**
    // Delete the main user account
    await User.deleteOne({ _id });
    */
    return res.status(200).send({ message: "Deleted okay" });
  } catch (err) {
    return res.status(500).send({ message: "Server error" });
  }
});

module.exports = { userCrudAdminRoute: routers };
