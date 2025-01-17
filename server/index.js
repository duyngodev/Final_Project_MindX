require("dotenv").config();
const express = require("express");
const app = express();

const Joi = require("joi");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

app.use(express.json());
const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 3000;

/** hash function */
async function hashPassword(pass) {
  const salt = await bcrypt.genSalt(parseInt(process.env.SALT));
  const hash = await bcrypt.hash(pass, salt);
  return hash;
}
/**Fake data */
const students = [
  {
    id: 1,
    email: "foo@example.com",
    password: "password",
    role: ["student"],
  },
  {
    id: 2,
    email: "foo2@example.com",
    password: "password2",
    role: ["student"],
  },
];

app.get("/", (req, res) => {
  return res.send("Welcome");
});

app.post("/api/login", async (req, res) => {
  /**Tạo Schema */
  const schema = Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org"] } })
      .required(),
    password: Joi.string().required(),
  });
  /**Validate input */
  const result = schema.validate(req.body);
  if (result.error) return res.status(400).send("Invalid email and password");
  /**Kiểm tra email / pasưord */
  const student = students.find((s) => s.email === req.body.email);
  if (!student) return res.status(404).send("No student found");

  const matchPass = await bcrypt.compare(req.body.password, student.password);
  if (!matchPass) return res.status(400).send("Wrong password");
  /**Success */
  return res.status(200).send("Login successful");
});

app.post("/api/signup", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net", "org"] },
      })
      .required(),
    password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,}$")).required(),
  }).with("email", "password");

  const { error } = schema.validate(req.body);
  if (error)
    return res
      .status(400)
      .send(
        "Please enter a valid email address \nand password >= 8 characters without special characters"
      );

  const student = students.find((s) => s.email === req.body.email);
  if (student) return res.status(400).send("Email already in use");
  const result = {
    email: req.body.email,
    password: await hashPassword(req.body.password),
  };
  students.push(result);
  return res.status(200).send("Sign up successfully");
});

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => console.log("listening on ", port));
  })
  .catch(() => console.log("error connecting to MongoDB"));
