//jshint esversion:6
require("dotenv").config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt=require("bcrypt");
// const saltRounds = 10;

const app=express();
app.set("view engine",'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(session({
  secret: 'My Big secrets down the way',
  resave: false,
  saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://aravindben562:Ivqa1DE2CHiwULqw@secretkeeper.gwn2ln0.mongodb.net/userDB");

const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const userModel = mongoose.model("User",userSchema);

passport.use(userModel.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://anonymous-secrets.onrender.com/auth/google/callback",
    passReqToCallback   : true,
    userProfileUrl :"https://www.googleapis.com//auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    userModel.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile'] }));
//
// app.get('/auth/google/secrets',
//     passport.authenticate('google', { failureRedirect: '/login' }),
//     function(req, res) {
//       // Successful authentication, redirect home.
//       res.redirect('/secrets');
//     });
// app.get('/login/federated/google', passport.authenticate('google'));
//
// app.get('/oauth2/redirect/google', passport.authenticate('google', {
//   successReturnToOrRedirect: '/secrets',
//   failureRedirect: '/l     ogin'
// }));
app.get('/auth/google',
     passport.authenticate('google', {scope: ['profile', 'email']})
 );

 app.get('/auth/google/callback',
   passport.authenticate('google', { failureRedirect: '/login' }),
   function(req, res) {
     // Successful authentication, redirect success.
     res.redirect('/secrets');
   });

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  userModel.find({secret:{$ne:null}},function(err,docs){
    if(err)
    console.log(err);
    else{
      if(docs)
      res.render("secrets",{secretDocs:docs});
    }
  });
})

app.get("/submit",function(req,res){
  if(req.isAuthenticated())
  res.render("submit");
  else
  res.redirect("/login");
});

app.post("/submit",function(req,res){
  const secretMessage = req.body.secret;
  const id = req.user.id;
  userModel.findById(id,function(err,doc){
    if(err)
    console.log(err);
    else{
      doc.secret=secretMessage;
      doc.save();
      res.redirect("/secrets");
    }
  });
});

app.get("/logout",function(req,res,next){
  req.logout(function(err){
    if(err)
    console.log(err);
    else
    res.redirect("/");
  })
});

app.post("/register",function(req,res){
  userModel.register({username:req.body.username, active: true}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
     }
  passport.authenticate("local")(req,res,function(){
    res.redirect("/secrets");
  });

      // Value 'result' is set to false. The user could not be authenticated since the user is not active
    });
  });


app.post("/login",function(req,res){
const user = new userModel({
  username:req.body.username,
  password:req.body.password
});

req.login(user,function(err){
  if(err)
  console.log(err);
  else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    })
  }
})
});

app.listen(process.env.PORT || 3000,function(){
  console.log("App running successfully");
});
