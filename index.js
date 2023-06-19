const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const mongoose = require("mongoose");

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/myDatabase")
  .then((result) => {
    console.log("App running");
    // create a login route and validate a user and send JWT token
    app.post("/login", async (req, res) => {
      const { username, password } = req.body;
      try {
        const user = await User.findOne({ username });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        const validPassword = bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: "Invalid password" });
        }
        const token = jwt.sign({ userId: user._id }, "your_secret_key", {
          expiresIn: "1h",
        });
        res.json({ token });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // create a middleware function
    app.use((req, res, next) => {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      jwt.verify(token, "your_secret_key", (err, user) => {
        if (err) {
          return res.status(403).json({ error: "Forbidden" });
        }
        next();
      });
    });

    // create a routes to add, edit or delete the user
    app.post("/add-user", (req, res) => {
      const newUser = new User(req.body);
      newUser
        .save()
        .then((result) => {
          res.json(result);
          console.log("User has been created");
        })
        .catch((error) => {
          res.status(500).json({ error: "Internal server error" });
        });
    });

    app.post("/delete-user", (req, res) => {
      const userId = req.body.userId;
      User.findByIdAndRemove(userId)
        .then((result) => {
          console.log("User has been removed");
          res.json(result);
        })
        .catch((error) => {
          res.status(500).json({ error: "Internal server error" });
        });
    });

    app.post("/edit-user", (req, res) => {
      const userId = req.body.id;
      const newUsername = req.body.username;
      const newPassword = req.body.password;
      const newEmail = req.body.email;
      User.findById(userId)
        .then((user) => {
          user.username = newUsername;
          user.password = newPassword;
          user.email = newEmail;
          return user.save();
        })
        .then((result) => {
          console.log("User has been Updated");
          res.json(result);
        })
        .catch((error) => {
          res.status(500).json({ error: "Internal server error" });
        });
    });

    app.listen(port);
  })
  .catch((err) => console.log("Some error occured : ", err));
