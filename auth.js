var crypto = require('crypto');
var bcrypt = require('bcrypt');

var db = require('./models');



function hashPassword (password) {
  //default 10, higher value = longer to gen hash
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(password, salt);
  return hash;
};

function tokenExpiration(minutes){
  return minutes*60000;
}

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
    var tokenExpiry = tokenExpiration(60);
    //compare plaintext password to the hashed password in db
    if(bcrypt.compareSync(req.body.password, user.password)){
      db.Token.create({
        token: crypto.randomBytes(32).toString('hex'),
        expires: new Date(Date.now() + tokenExpiry),
        UserId: user.id
      }).then(function(token) {
        var t = {'token': token.token, 'message': "Logged in.", 'icon': user.icon};
        //note: cookies do not work with local webpages
        res.cookie('token', token.token, {maxAge: tokenExpiry});
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
  if(!req.cookies.token && !req.headers.token){
    res.statusCode = 404;
    var response = {"result": "error 404: token not found"};
    return res.send(response);
    }
    var token = req.cookies.token || req.headers.token;
  //delete token from db
  db.Token.destroy({
    where: {
      token: token
    }
  }).then(function(){
    res.clearCookie('token');
    res.statusCode = 200; //OK
    var response = {"result":"logout success"};
    return res.send(response);
    //cookie has been cleared and user should be required to login
  });
};


/* Registers a user with username, password and security questions/answers */
function register(req, res) {
  // username, password, security questions
  //do 2 security questions
  //currently only implement for 2 security questions

  if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')
    || !req.body.hasOwnProperty('questionOne') || !req.body.hasOwnProperty('questionTwo')
    || !req.body.hasOwnProperty('answerOne') || !req.body.hasOwnProperty('answerTwo')
    || !req.body.hasOwnProperty('icon')) {
    res.statusCode = 400;
    var response = {"result":"error 400: Post syntax incorrect"};
    return res.send(response);
  }

  var username = req.body.username;
  var password = req.body.password;
  var questionOne = req.body.questionOne;
  var questionTwo = req.body.questionTwo;
  var answerOne = req.body.answerOne;
  var answerTwo = req.body.answerTwo;
  var userIcon = req.body.icon;

  if(username.length < 2){
    res.statusCode == 400;
    var response = {"result":"username too short: minimum of 2 characters"};
    return res.send(response);
  }

  if(password.length < 4){
    res.statusCode == 400;
    var response = {"result":"password too short: minimum of 4 characters"};
    return res.send(response);
  }

  if(answerOne.length < 4){
    res.statusCode == 400;
    var response = {"result":"answer one too short: minimum of 4 characters"};
    return res.send(response);
  }



  db.User.findOne({where: {username: req.body.username}}).then(function(user) {
    if(!user) {
      //make sure that user doesn't exist, so we can create another user
      db.User.create({
        username: username,
        password: hashPassword(password),
        icon: userIcon
      }).then(function(user){
        //now we want to create questions
        db.SecurityQuestions.create({
          username: username,
          questionOne: questionOne,
          questionTwo: questionTwo,
          answerOne: hashPassword(answerOne),
          answerTwo: hashPassword(answerTwo),
          UserId: user.id
        }).then(function(){
          res.statusCode = 201; //Created
          var response = {"result": "registration success"};
          return res.send(response);
        })
      });
    }
    else {
      res.statusCode = 422;
      var response = {"result":"registration failed"};
      return res.send(response);
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
    if (!questions) {
      res.statusCode = 404;
      return res.send('Error 404: User does not exist.');
    }
    var response = {"question_one":questions.questionOne, "question_two":questions.questionTwo};
    return res.send(response);
  });
}

function securityQuestionAnswer(req, res){
  //need username again to check answers
  if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('answer_one') || !req.body.hasOwnProperty('answer_two')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  db.SecurityQuestions.findOne({where: {username: req.body.username}}).then(function(questions) {
    if (!questions) {
      res.statusCode = 404;
      return res.send('Error 404: User does not exist.');
    }
    var answerOne = questions.answerOne;
    var answerTwo = questions.answerTwo;
    if(bcrypt.compareSync(req.body.answer_one, answerOne) && bcrypt.compareSync(req.body.answer_two, answerTwo)){
      //correct security answers, so let's give the user a token to change their password
      db.User.findOne({where: {username: req.body.username}}).then(function(user) {
          db.Token.create({
            token: crypto.randomBytes(32).toString('hex'),
            expires: new Date(Date.now() + 10*60000),
            UserId: user.id
          }).then(function(token) {

            var response = {'token': token.token, 'message': "Logged in."};
            //note: cookies do not work with local webpages
            res.cookie('token', token.token, {maxAge: 10*60000});
            return res.send(response);
          });
      });
    }
    else {
      res.statusCode = 400; 
      var response = {"error": "incorrect answers"};
      return res.send(response);
    }
  });

}



function resetPassword(req, res){
  if(!req.body.hasOwnProperty('password')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  if(password.length < 4){
    res.statusCode == 400;
    var response = {"result":"password too short: minimum of 4 characters"};
    return res.send(response);
  }
  //they need a token to change password...
  return auth.check_token(req, res, function(req, res, user){
    //need to make sure user is authenticated
    user.password = hashPassword(req.body.password);
    user.save();
    res.statusCode = 201; //CREATED
    var response = {"result":"successfully password changed"};
    res.send(response);
  });
};


function check_token(req, res, callback){
  if(!req.cookies.token && !req.headers.token) {
    res.statusCode = 403;
    return res.send('Error 403: Not logged in.');
  }
  var token = req.cookies.token || req.headers.token;
  db.Token.findOne({where: {token: token}}).then(function(token) {
    var now = new Date(Date.now());
    if(token && token.expires > now){
      db.User.findOne({where: {id: token.UserId}}).then(function(user){
        token.expires = new Date(Date.now() + tokenExpiration(60));
        token.save();
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
    securityQuestionAnswer: securityQuestionAnswer,
    resetPassword: resetPassword
};

global.auth = auth

module.exports = global.auth