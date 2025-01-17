const express = require("express");
const app = express();

const Joi = require("joi");

app.use(express.json());

const students = [
  {
    id: 1,
    email: "foo@example.com",
    password: "password",
  },
  {
    id: 2,
    email: "foo2@example.com",
    password: "password2",
  },
];

app.get("/", (req, res) => {
  return res.send("Welcome");
});

app.post("/api/login", (req, res) => {
  /**Tạo Schema */
    const schema = Joi.object({
    email: Joi.string().email({minDomainSegments:2, tld:{allow:['com','net','org']}}).required(),
    password: Joi.string().required(),
  });
  /**Validate input */
  const result = schema.validate(req.body);
  if (result.error) return res.status(400).send("Invalid email and password");
  /**Kiểm tra email / pasưord */
  const student = students.find((s) => s.email === req.body.email);
  if (!student) return res.status(404).send("No student found");
  if (student.password !== req.body.password)
    return res.status(400).send("Wrong password");
  /**Success */
  return res.status(200).send("Login successful");
});

console.log("port is", process.env.PORT);
const port = process.env.PORT || 3000;
app.listen(port, console.log("listening on ", port));
