//jshint esversion:6
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
mongoose.connect(process.env.DB, {useNewUrlParser: true});
const userSchema=new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});
const User = new mongoose.model("User", userSchema)


app.get("/", function(req, res){
    res.render("home");
})
app.get("/register", function(req, res){
    res.render("register");
})
app.get("/login", function(req, res){
    res.render("login");
})
app.post("/register", function(req, res){
    var mail=req.body.username
    var password=req.body.password

    const User1 = new User({
        email: mail,
        password: password
    })
    User1.save();
    res.render("secrets")
})
app.post("/login", function(req, res){
    var mail=req.body.username
    var password=req.body.password
    User.findOne({email: mail}, function(err, result){
        console.log(result);
        if(result==null){
            res.render("register");
        }
        else if(result.password==password){
            res.render("secrets");
        }
        else{
            res.redirect("/login");
        }

    })
})

app.listen(3000, function(){
console.log('App started on port 3000');
})
