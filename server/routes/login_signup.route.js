const express = require("express");
const routers = express.Router();

const Joi = require("joi");
const bcrypt = require("bcrypt");

const Teacher = require("../model/teacher.model.js");
const Student = require("../model/student.model.js");
const User = require("../model/user.model.js");

/** hash function */
async function hashPassword(pass) {
  const salt = await bcrypt.genSalt(parseInt(process.env.SALT));
  const hash = await bcrypt.hash(pass, salt);
  return hash;
}
/**Fake data */
// const users = [
//   {
//     id: 1,
//     username: "user1",
//     email: "foo@example.com",
//     password: "password",
//     role: ["student"],
//   },
//   {
//     id: 2,
//     username: "user2",
//     email: "foo2@example.com",
//     password: "password2",
//     role: ["student"],
//   },
// ];

routers.post("/login", async (req, res) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string()
      .pattern(
        new RegExp(
          "^(?=.*[A-Z])(?=.*[!@#$%^&*()_+])[a-zA-Z0-9!@#$%^&*()_+]{8,}$"
        )
      )
      .required(), //positive lookahead
    role: Joi.string().valid("admin", "teacher", "student").required(),
  });
  const { username, password, role } = req.body;
  /**Validate input */
  const { error } = schema.validate({ username, password, role });
  if (error) return res.status(400).send(error);
  /**
   *TDO: change users to model
   */
  const student = users.find((s) => s.username === username);
  if (!student) return res.status(404).send("No student found");
  /**
   * TODO: get Password in role model [Teacher, Student, Admin]
   */
  const matchPass = await bcrypt.compare(password, student.password);
  if (!matchPass) return res.status(400).send("Wrong password");
  /**Success */
  return res.status(200).send("Login successful");
});

routers.post("/signup", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "edu", "org"] },
      })
      .required(),
    username: Joi.string().required(),
    password: Joi.string()
      .pattern(
        /**
         * at least 1 Uppercase (?=.*[A-Z])
         * at least 1 special character (?=.*[!@#$%^&*()_+])
         * at least 8 characters
         */
        new RegExp(
          "^(?=.*[A-Z])(?=.*[!@#$%^&*()_+])[a-zA-Z0-9!@#$%^&*()_+]{8,}$"
        )
      )
      .required(), //positive lookahead
    role: Joi.string().valid("admin", "teacher", "student").required(),
  });
  const { email, username, password, role } = req.body;
  // Validate input
  const { error } = schema.validate(req.body);
  if (error)
    return res
      .status(400)
      .send(
        "Please enter a valid email address \nand password >= 8 characters without special characters"
      );
  // Check existed account
  const accountUsername = await User.findOne({ username });
  if (accountUsername) return res.status(400).send("Username already in use");
  const accountEmail = await User.findOne({ email });
  if (accountEmail) return res.status(400).send("Email already in use");
  /**
   * Create a new account wwith Model Student/Teacher and Model User
   */
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
  /**
   *  TODO: push password, email vào role mdoel [student, teacher]
   * TODO: changge users to model
   */
  await newUser.save();
  // users.push(result);
  return res.status(200).send("Sign up successfully");
});

module.exports = routers;
