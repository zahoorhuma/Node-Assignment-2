const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const app = express();

const mongoose = require("mongoose");
const port = 3000;

app.use(bodyParser.json());
// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/myDatabase")
  .then((result) => {
    console.log("App running");
    app.post("/login", async (req, res) => {
      const { username, password } = req.body;

      try {
        // Find the user in the database
        const user = await User.findOne({ username });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        // Validate the password
        const validPassword = bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: "Invalid password" });
        }
        // Create a JWT token
        const token = jwt.sign({ userId: user._id }, "your_secret_key", {
          expiresIn: "1h",
        });
        res.json({ token });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.use((req, res, next) => {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      jwt.verify(token, "your_secret_key", (err, user) => {
        if (err) {
          return res.status(403).json({ error: "Forbidden" });
        }
        // req.user = user;
        next();
      });
    });

    app.post("/add-user", (req, res) => {
      const newUser = new User(req.body);
      newUser
        .save()
        .then((result) => {
          res.json(result);
          console.log("user created");
        })
        .catch((error) => {
          res.status(500).json({ error: "Internal server error" });
        });
    });

    app.post("/delete-user", (req, res) => {
      const userId = req.body.userId;
      User.findByIdAndRemove(userId)
        .then((result) => {
          console.log("User removed");
          res.json(result);
        })
        .catch((error) => {
          res.status(500).json({ error: "Internal server error" });
        });
    });

    app.post("/edit-user", (req, res) => {
      User.findById(req.body.id)
        .then((user) => {
          user.username = req.body.username;
          user.password = req.body.password;
          user.email = req.body.email;
          return user.save();
        })
        .then((result) => {
          console.log("user Updated");
          res.json(result);
        })
        .catch((error) => {
          res.status(500).json({ error: "Internal server error" });
        });
    });

    app.listen(3000);
  })
  .catch((err) => console.log("Error is : ", err));
