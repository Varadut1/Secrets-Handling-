//jshint esversion:6
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const { use } = require('passport');

// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
const saltRounds = 10;
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(session({
    secret: "This is my little secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize())
app.use(passport.session());


mongoose.connect(process.env.DB, {useNewUrlParser: true});
const userSchema=new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// console.log(md5("hello"), md5("hello"));
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});
const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
})

app.get('/auth/google', passport.authenticate('google', {scope: ["profile"]})
);


app.get("/register", function(req, res){
    res.render("register");
})

app.get("/login", function(req, res){
    res.render("login");
})

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    
    res.redirect('/secrets');

  })

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){

        User.find({"secret": {$ne: null}}, function(err, results){
            res.render("secrets", {thesecrets: results});
        })
        
    }
    else{
        res.redirect("/login");
    }
    
})
app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        res.redirect("/");
    });
})
app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    })
    // var mail=req.body.username
    // var password=req.body.password
    // bcrypt.hash(password, saltRounds, function(err, hash){
    //     const User1 = new User({
    //         email: mail,
    //         password: hash
    //     })
    //     User1.save();
    //     res.render("secrets")
    // });
});

app.post("/login", function(req, res){
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
    // var mail=req.body.username
    // var password=req.body.password
    //     User.findOne({email: mail}, function(err, result){
    //         bcrypt.compare(password, result.password, function(err, result){
    //             if(result===null){
    //                 res.render("register");
    //             }
    //             else if(result===true){
    //                 res.render("secrets");
    //             }
    //             else{
    //                 res.redirect("/login");
    //             }
    //         })
    //     })
    })
    app.get("/submit", function(req, res){
        res.render("submit");
    })
    app.post("/submit", function(req, res){
        User.findById(req.user.id, function(err, result){
            if(err){
                console.log(err);
            }
            else{
                if (result){
                result.secret=req.body.secret;
                result.save(function(){
                    res.redirect("/secrets");
                })
            }}
        })

    })

app.listen(3000, function(){
console.log('App started on port 3000');
})
