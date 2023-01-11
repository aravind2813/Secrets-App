//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ["password"]});

const userModel = mongoose.model("User",userSchema);

const app=express();
app.set("view engine",'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  const newUser = new userModel({
    email:req.body.username,
    password:req.body.password
  });
  newUser.save(function(err){
    if(!err)
    res.render("secrets");
    else
    console.log(err);
  });
});

app.post("/login",function(req,res){
  const email=req.body.username;
  const password = req.body.password;
  userModel.findOne(
    {email:email},
    function(err,docs){
      if(!docs)
      res.send("No Matching Email Found!")
      else{
        if(docs.password===password)
        res.render("secrets");
        else
        res.send("Incorrect Password");
      }
    }
  );
});

app.listen(3000,function(){
  console.log("App running successfully");
});
