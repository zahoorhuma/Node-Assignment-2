const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const mongoose = require("mongoose");

const verifyToken = require("./middleware");

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
    // create a routes to add, edit or delete the user
    app.post("/add-user", verifyToken, async (req, res) => {
      try {
        const { email, password, username } = req.body;
        if (!(email && password && username)) {
          res.status(400).send("All input are required");
        }
        const user = await User.findOne({ email });
        console.log("user", user);
        if (user) {
          return res.status(409).json({ error: "User Already Registered" });
        } else {
          console.log("here");
          var encryptedPassword = await bcrypt.hash(password, 10);
          console.log("----->", encryptedPassword);
          // const user = await User.create({
          //   username,
          //   email: email.toLowerCase(), // sanitize: convert email to lowercase
          //   password: encryptedPassword,
          // });
          // console.log(user);
          const newUser = new User({
            username,
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            password: encryptedPassword,
          });
          newUser
            .save()
            .then((result) => {
              res.json(result);
              console.log("User has been created");
            })
            .catch((error) => {
              res.status(500).json({ error: "Internal server error" });
            });
        }
        res.status(201).json({ message: "User created Successfully " });
      } catch (error) {
        res.send("something went wrong");
      }
    });
    app.delete("/delete/:userId", verifyToken, async (req, res) => {
      const userId = req.params.userId;
      try {
        const deletedUser = await User.findByIdAndRemove(userId);
        if (!deletedUser) {
          return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app.put("/edit/:userId", verifyToken, async (req, res) => {
      const userId = req.params.userId;
      const { username, email, password } = req.body;
      try {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        user.username = username || user.username;
        user.email = email || user.email;
        user.password = password || user.password;
        // Save the updated user
        await user.save();
        res.status(200).json({ message: "User updated successfully" });
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app.listen(port);
  })
  .catch((err) => console.log("Some error occurred : ", err));
