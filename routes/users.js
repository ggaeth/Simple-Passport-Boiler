var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');

// register - get 
router.get("/register",(req,res)=>{
  res.render('register');
});

// login - get user data
router.get("/login",(req,res)=>{
  res.render('login');
});

// registration - post data to DB
router.post("/register",(req,res)=>{
  var name=req.body.name;
  var email=req.body.email;
  var username=req.body.username;
  var password=req.body.password;
  var password2=req.body.password2;

req.checkBody('name','name is required').notEmpty();
req.checkBody('email','email is required').notEmpty();
req.checkBody('email','email is not valid').isEmail();
req.checkBody('username','username is required').notEmpty();
req.checkBody('password','password is required').notEmpty();
req.checkBody('password2','passwords donot match').equals(req.body.password);

var errors=req.validationErrors();
if(errors){
  res.render('register',{
    errors:errors
  });
}else{
  var newUser=new User({
    name:name,
    email:email,
    username:username,
    password:password
  });
  User.createUser(newUser,function(err,user){
    if(err) throw err;
    console.log(user);
  });
  req.flash("success_msg","You are registered and can now login");
  res.redirect('/users/login');
}
});


// passport LocalStrategy authentication based on username password
passport.use(new LocalStrategy(
  function(username, password, done) {
   User.getUserByUsername(username, function(err, user){
   	if(err) throw err;
   	if(!user){
   		return done(null, false, {message: 'Unknown User'});
   	}

   	User.comparePassword(password, user.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, user);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
  }));



// determines which data of the user object should be stored in the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

// that key is matched with the in memory array / database
// in this case the key is user.id - defined in passport.serializeUser
  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
  });


// login route , will redirect based on authentication success or failure
router.post('/login',
  passport.authenticate('local',{successRedirect:"/",failureRedirect:'/users/login',failureFlash:true}),
  function(req, res) {
      res.redirect('/');
  });

// logout, takes user out of session & redirects 
  router.get('/logout', function(req, res){
  	req.logout();

  	req.flash('success_msg', 'You are logged out');

  	res.redirect('/users/login');
  });

module.exports=router;
