const express = require("express");
const routers = express.Router();

routers.get("/", (req, res) => {
  res.status(200).send({ message: "okela" });
});

module.exports = { userCrudRoute: routers };
