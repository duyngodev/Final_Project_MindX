const Joi = require("joi");
const schemaSignUp = (admin = null) => {
  const usernamePattern = admin
    ? new RegExp(`^admin[a-zA-Z0-9!@#$%^&*()_+$]+`)
    : new RegExp(`^(?!admin)[a-zA-Z0-9!@#$%^&*()_+$]+`);

  return Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "edu", "org"] } })
      .required(),
    username: Joi.string()
      .min(5)
      .pattern(usernamePattern) // Không bắt đầu với "admin"
      .required(),
    password: Joi.string()
      .pattern(
        new RegExp(
          "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+])[a-zA-Z0-9!@#$%^&*()_+]{8,}$"
        )
      )
      .required(), //positive lookahead
    role: Joi.string().valid("admin", "teacher", "student").required(),
  });
};
module.exports = schemaSignUp;
