var crypto = require('crypto');
var bcrypt = require('bcrypt');

var db = require('./models');



function hashPassword (password) {
  //default 10, higher value = longer to gen hash
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(password, salt);
  return hash;
};

//make it so that each user can have at most one token. Cannot login to multiple devices. 
//stops database from filling with tokens.
//code left for sending tokens still here. 
function login(req, res) {
  if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }
  db.User.findOne({where: {username: req.body.username}}).then(function(user) {
    if(!user) {
      res.statusCode = 404;
      return res.send('Error 404: User does not exist.');
    }

    //compare plaintext password to the hashed password in db
    if(bcrypt.compareSync(req.body.password, user.password)){
      db.Token.create({
        token: crypto.randomBytes(32).toString('hex'),
        expires: new Date(Date.now() + 10*60000),
        UserId: user.id
      }).then(function(token) {
        var t = {'token': token.token, 'message': "Logged in."};
        //note: cookies do not work with local webpages
        res.cookie('token', token.token, {maxAge: 10*60000});

        return res.send(t);
      });      
    } else {
      res.statusCode = 403;
      return res.send('Error 403: incorrect password.');
    }
  });
};

/* logs the user out by clearing cookie on client and removing from db */
function logout(req, res){
  if(!req.cookies.token){
    console.log('No token');
    res.statusCode = 404;
    return res.send('Error 404: Token not found');
    }
  //delete token from db
  db.Token.destroy({
    where: {
      token: req.cookies.token
    }
  }).then(function(){
    res.clearCookie('token');
    res.statusCode = 200; //OK
    return res.send('Logout Success');
    //cookie has been cleared and user should be required to login
  });
  
};


/* Registers a user with username, password and security questions/answers */
function register(req, res) {
  // username, password, security questions
  //do 2 security questions
  //currently only implement for 2 security questions
  if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  db.User.findOne({where: {username: req.body.username}}).then(function(user) {
    if(!user) {
      //make sure that user doesn't exist, so we can create another user
      db.User.create({
        username: req.body.username,
        password: hashPassword(req.body.password)
      }).then(function(){
        //now we want to create questions
        db.SecurityQuestions.create({
          username: req.body.username,
          questionOne: "What's my middle name?",
          questionTwo: "What's my last name?",
          answerOne: hashPassword("james"),
          answerTwo: hashPassword("cole")
        }).then(function(){
          return res.send('registration success');
        })

      });
    }
    else {
      res.statusCode = 422;
      return res.send("Username already exists");
    }
  });
   
};


/* Takes a username and returns the security questions associated with it */

function securityQuestions(req, res){
  //security questions to be displayed when username is entered
  if(!req.body.hasOwnProperty('username')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  db.SecurityQuestions.findOne({where: {username: req.body.username}}).then(function(questions) {
    if (!user) {
      res.statusCode = 404;
      return res.send('Error 404: User does not exist.');
    }
    var response = {"question_one":questions.questionOne, "question_two":questions.questionTwo}
    return res.send(response);
  });
}



function resetPassword(req, res){
  //once the user has successfully answered security questions, 
  //they will then be able to reset their password with a token
  return res.send('resetPassword');
};




function check_token(req, res, callback){
  if(!req.cookies.token) {
    res.statusCode = 403;
    return res.send('Error 403: Not logged in.');
  }

  db.Token.findOne({where: {token: req.cookies.token}}).then(function(token) {
    var now = new Date(Date.now());
    if(token && token.expires > now){
      db.User.findOne({where: {id: token.UserId}}).then(function(user){
        return callback(req, res, user);
      });
    } else {
      res.statusCode = 403;
      return res.send('Error 403: Token has expired.');
    }
  }); 
};


var auth = {
    login: login,
    logout: logout,
    hashPassword: hashPassword,
    check_token: check_token,
    register: register,
    securityQuestions: securityQuestions,
    resetPassword: resetPassword
};

global.auth = auth

module.exports = global.auth