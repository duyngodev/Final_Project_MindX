require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const mongoose = require("mongoose");

const { loginRoute } = require("./routes/login_signup.route.js");
const { userCrudAdminRoute } = require("./routes/user.crud.admin.route.js");
const { userCrudRoute } = require("./routes/user.crud.route.js");

const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res.send("Welcome");
});

//login routes
app.use("/api", loginRoute);
app.use("/api/admin/users", userCrudAdminRoute); // middleware required (authen authorization)
app.use("/api/users", userCrudRoute);

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => console.log("listening on ", port));
  })
  .catch(() => console.log("error connecting to MongoDB"));
