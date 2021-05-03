//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')
//const md5 = require("md5"); md5(req.body.password)
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

//important to put the session right here after the other uses and before the db connect
app.use(session({
  secret: 'A random secret!',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(process.env.MONGOOSE_LOGIN, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//deprecation warning fix
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//code until here needs to be in this order
//////////////////////////////////////////////////////////////////////////////////////
//needs to be underneath the session Google Oauth
// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({
//       googleId: profile.id
//     }, function(err, user) {
//       return cb(err, user);
//     });
//   }
// ));

///////////////////////////////////////////////////////////////////////////////////

app.get("/", function(req, res) {
  res.render("home");
});
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/secrets", function(req, res) {
  res.set(
    'Cache-Control',
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
  );
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(passport.authenticate("local", {
    failureRedirect: '/login'
  }), function(req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/secrets");
      }
    });
  });

app.route("/register")
  .get(function(req, res) {
    res.render("register");
  })
  .post(function(req, res) {
    User.register({
      username: req.body.username
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    });

  });

// User.findOne({
//   email: req.body.username
// }, function(err, foundUser) {
//   if (err)
//     console.log(err);
//   else if (foundUser === null) {
//     console.log("no user found!");
//     res.render("home");
//   } else {
//     bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
//       if (result === true)
//         res.render("secrets");
//     });
//   }
// });


// bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//   const newUser = new User({
//     email: req.body.username,
//     password: hash
//   });
//   newUser.save(function(err) {
//     if (err)
//       console.log(err);
//     else
//       res.render("secrets");
//   });
// });




app.listen(3000, function() {
  console.log("Server started at port 3000");
});
