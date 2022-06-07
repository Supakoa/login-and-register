const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const dbConnection = require("./database");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: false }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(
  cookieSession({
    name: "sessoin",
    keys: ["key1", "key2"],
    maxAge: 3600 * 1000, // 1hr
  })
);

// Declaring Custome Middleware
const ifNotLoggedIn = (req, resp, next) => {
  if (!req.session.isLoggedIn) {
    return resp.render("login-register");
  }
  next();
};

const ifLoggedIn = (req, resp, next) => {
  if (req.session.isLoggedIn) {
    return resp.redirect("/home");
  }
  next();
};

// root page
app.get("/", ifNotLoggedIn, (req, resp, next) => {
  dbConnection
    .execute("SELECT name FROM `users` WHERE id = ? ", [req.session.userID])
    .then(([rows]) => {
      resp.render("home", {
        name: rows[0]?.name,
      });
    })
    .catch((err) => console.log("select name is ERROR: ", err));
});

app.get("/register", (req, resp) => {
  resp.redirect("/");
});

app.post(
  "/register",
  ifLoggedIn,
  [
    body("user_email", "Invalid Email Address!.")
      .isEmail()
      .custom(async (val) => {
        const [rows] = await dbConnection.execute(
          "SELECT email FROM users WHERE email = ? ",
          [val]
        );
        if (rows.length > 0) {
          return Promise.reject("This Email already in use!.");
        }
        return true;
      }),
    body("user_name", "Username is Empty!.").trim().not().isEmpty(),
    body("user_pass", "The password must be of minimun length 6 characters")
      .trim()
      .isLength({ min: 6 }),
  ], // end of post data validate
  (req, resp, next) => {
    const validation_result = validationResult(req);
    const { user_email, user_name, user_pass } = req.body;

    if (validation_result.isEmpty()) {
      bcrypt
        .hash(user_pass, 12)
        .then((hash_pass) => {
          dbConnection
            .execute(
              "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
              [user_name, user_email, hash_pass]
            )
            .then((rs) => {
              resp.send(
                `Your account has benn created successfully, Now you can <a href="/">Login<a/>`
              );
            })
            .catch((err) => {
              if (err) throw err;
            });
        })
        .catch((err) => {
          if (err) throw err;
        });
    } else {
      let allErr = validation_result.errors.map((error) => error.msg);

      resp.render("login-register", {
        register_err: allErr,
        old_data: req.body,
      });
    }
  }
);

app.post(
  "/",
  ifLoggedIn,
  [
    body("user_email", "Email is Invalid.")
      .isEmpty()
      .isEmail()
      .custom(async (email) => {
        const [rows] = await dbConnection.execute(
          "SELECT email FROM users WHERE email = ?",
          [email]
        );
        if (rows.length == 0) {
          return Promise.reject("Your email is not Exist.");
        }
        return true;
      }),
    body("user_pass", "Your password is empty.").trim().not().isEmpty(),
  ],
  (req, resp) => {
    const validation_result = validationResult(req);
    const { user_email, user_pass } = req.body;
    if (validation_result.isEmpty()) {
      dbConnection
        .execute("SELECT email, password FROM users WHERE email = ? ", [
          user_email,
        ])
        .then(([rows]) => {
          bcrypt
            .compare(user_pass, rows[0].password)
            .then((compare_rs) => {
              if (compare_rs) {
                req.session.isLoggedIn = true;
                req.session.userID = rows[0].id;
                resp.redirect("/");
              } else {
                resp.render("login-register", {
                  login_errors: ["Invalid Password"],
                });
              }
            })
            .catch((err) => {
              throw err;
            });
        })
        .catch((err) => {
          throw err;
        });
    } else {
      let allErr = validation_result.errors.map((err) => err.msg);

      resp.render("login-register", {
        login_errors: allErr,
      });
    }
  }
);

app.listen(process.env.SERVICE_PORT ?? 3000, () =>
  console.log("Server is runing...")
);
