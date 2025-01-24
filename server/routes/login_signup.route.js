const express = require("express");
const routers = express.Router();

const Joi = require("joi");
const bcrypt = require("bcrypt");

const Teacher = require("../model/teacher.model.js");
const Student = require("../model/student.model.js");
const User = require("../model/user.model.js");

const schemaSignUp = require("../share/schemaCreateAccount..share.js");
const hashPassword = require("../share/hashPass.share.js");
const deleteFields = require("../share/deleteFiels.share.js");

/**LOGIN ROUTE
 * TODO: authen, author middleware
 */
routers.post("/login", async (req, res) => {
  const schema = Joi.object({
    username: Joi.string().min(5).required(),
    password: Joi.string()
      .pattern(
        new RegExp(
          "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+])[a-zA-Z0-9!@#$%^&*()_+]{8,}$"
        )
      )
      .required(), //positive lookahead
  });
  const { username, password } = req.body;
  /**Validate input */
  const { error } = schema.validate({ username, password });
  if (error) return res.status(400).send(error);
  // Get account
  try {
    const account = await User.findOne({ username })
      .populate("student")
      .populate("teacher")
      .populate("admin")
      .lean(); // to enable delete Fields
    if (!account) return res.status(404).send("No account found");
    // Check Password
    const accountDetails =
      account.admin || account.student || account.teacher || null;
    if (!accountDetails)
      res.status(404).send({ message: "account detail not found" });
    const matchPass = await bcrypt.compare(password, accountDetails.password);
    if (!matchPass) return res.status(400).send("Wrong password");
    const accountDeleteFields = deleteFields(account);
    delete accountDetails.password;
    delete accountDetails._id;
    /**Success */
    return res.status(200).send({
      message: "Login successful",
      account: accountDeleteFields,
      accountDetails,
    });
  } catch (err) {
    return res.status(500).send({ message: "Server error" });
  }
});

/** SIGNUP ROUTE
 * create schema
 * validate input { email, username, password, role }
 * check existing account {username, email}
 * add data to Collection [ROLE] + hass-pass ===> [USER] + username + email
 */
routers.post("/signup", async (req, res) => {
  const schema = schemaSignUp();
  // Validate input
  const { email, username, password, role } = req.body;
  const { error } = schema.validate({ email, username, password, role });
  if (error)
    return res.status(400).send({
      message:
        "Please enter a valid email address \nand password must include uppercase, lowercase, number and special characters ! @ # $ % ^ & * ( ) _ +",
      error: error,
    });
  if (role.includes("student") && role.includes("teacher")) {
    return res
      .status(400)
      .send({ message: "Invalid role, Teacher or Student only" });
  }
  try {
    // Check existed account
    const accountUsername = await User.findOne({ username });
    if (accountUsername) return res.status(400).send("Username already in use");
    const accountEmail = await User.findOne({ email });
    if (accountEmail) return res.status(400).send("Email already in use");
    // Create Account Details  - hashed Password
    let newStudent = null,
      newTeacher = null;
    switch (role) {
      case "student":
        newStudent = new Student({
          password: await hashPassword(password),
        });
        await newStudent.save();
        break;
      case "teacher":
        newTeacher = new Teacher({
          password: await hashPassword(password),
        });
        await newTeacher.save();
        break;
      default:
        console.log("No role specified");
    }
    const newUser = new User({
      username,
      email,
      role: [role],
      student: newStudent ? newStudent._id : null,
      teacher: newTeacher ? newTeacher._id : null,
    });
    await newUser.save();
    // users.push(result);
    return res.status(200).send("Sign up successfully");
  } catch (err) {
    return res.status(500).send({ message: "Server error" });
  }
});

module.exports = { loginRoute: routers, schemaSignUp, hashPassword };
