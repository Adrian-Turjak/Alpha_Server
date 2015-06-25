var crypto = require('crypto');
var bcrypt = require('bcrypt');

var db = require('./models');


/* uses bcrypt to hash a specified password */
function hashPassword (password) {
  //default 10, higher value = longer to gen hash
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(password, salt);
  return hash;
};


/* helper function for setting a token expiration time, returns in minutes specified */
function tokenExpiration(minutes){
  return minutes*60000;
}


/* if successful logs the user in and creates a new token for authentication */
function login(req, res) {
  errors = utils.check_body(req, ["username", "password"]);
  if(errors.length > 0){
    res.statusCode = 400;
    var response = {"errors": errors};
    return res.send(response);
  }
  db.User.findOne({where: {username: req.body.username}}).then(function(user) {
    if(!user) {
      res.statusCode = 404;
      var response = {"result":"error 404: user does not exist"};
      return res.send(response);
    }
    var tokenExpiry = tokenExpiration(60);
    //compare plaintext password to the hashed password in db
    if(bcrypt.compareSync(req.body.password, user.password)){
      db.Token.create({
        token: crypto.randomBytes(32).toString('hex'),
        expires: new Date(Date.now() + tokenExpiry),
        UserId: user.id
      }).then(function(token) {
        var response = {'token': token.token, 'result': 'logged in.', 'icon': user.icon};
        //note: cookies do not work with local webpages
        res.cookie('token', token.token, {maxAge: tokenExpiry});
        return res.send(response);
      });      
    } else {
      res.statusCode = 403;
      var response = {"result":"error 403: incorrect password"};
      return res.send(response);
    }
  });
};


/* logout clears the token stored in the database and clears the cookie */
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


/* registers the user. must specify: 
username, pass, 2 securityquestions & answers & icon*/
function register(req, res) {
  errors = utils.check_body(req, [
    "username", "password", "questionOne", "questionTwo",
    "answerOne", "answerTwo", "icon"
  ]);
  if(errors.length > 0){
    res.statusCode = 400;
    var response = {"errors": errors};
    return res.send(response);
  }

  var username = req.body.username;
  var password = req.body.password;
  var questionOne = req.body.questionOne;
  var questionTwo = req.body.questionTwo;
  var answerOne = req.body.answerOne;
  var answerTwo = req.body.answerTwo;
  var userIcon = req.body.icon;

//check if all user specified values are valid
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

  //everything is OK, so lets try and create new user
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
  errors = utils.check_body(req, ["username",]);
  if(errors.length > 0){
    res.statusCode = 400;
    var response = {"errors": errors};
    return res.send(response);
  }

  db.SecurityQuestions.findOne({where: {username: req.body.username}}).then(function(questions) {
    if (!questions) {
      res.statusCode = 404;
      var response = {"result": "error 404: user does not exist"};
      return res.send(response);
    }
    var response = {"question_one":questions.questionOne, "question_two":questions.questionTwo};
    return res.send(response);
  });
}


/* given a username & 2 answers to check if they are correct for the specified user */
function securityQuestionAnswer(req, res){
  //need username again to check answers
  errors = utils.check_body(req, [
    "username", "answer_one", "answer_two"
  ]);
  if(errors.length > 0){
    res.statusCode = 400;
    var response = {"errors": errors};
    return res.send(response);
  }

  db.SecurityQuestions.findOne({where: {username: req.body.username}}).then(function(questions) {
    if (!questions) {
      res.statusCode = 404;
      return res.send('Error 404: User does not exist.');
    }
    var answerOne = questions.answerOne;
    var answerTwo = questions.answerTwo;

    var tokenExpiry = tokenExpiration(60);
    if(bcrypt.compareSync(req.body.answer_one, answerOne) && bcrypt.compareSync(req.body.answer_two, answerTwo)){
      //correct security answers, so let's give the user a token to change their password
      db.User.findOne({where: {username: req.body.username}}).then(function(user) {
          db.Token.create({
            token: crypto.randomBytes(32).toString('hex'),
            expires: new Date(Date.now() + tokenExpiry),
            UserId: user.id
          }).then(function(token) {
            var response = {'token': token.token, 'result': "logged in."};
            //note: cookies do not work with local webpages
            res.cookie('token', token.token, {maxAge: tokenExpiry});
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


/* if a user is currently authenticated, this will change the users password to the specified password */
function resetPassword(req, res){
  if(!req.body.hasOwnProperty('password')) {
    res.statusCode = 400;
    var response = {"result": "error 400: post syntax incorrect"};
    return res.send(response);
  }

  var password = req.body.password;

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


/* checks the token to make sure the user is still authenticated
checks by either the cookie in the request or with a header provided */
function check_token(req, res, callback){
  if(!req.cookies.token && !req.headers.token) {
    res.statusCode = 403;
    var response = {"result":"error 403: not logged in"};
    return res.send(response);
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
      var response = {"result":"error 403: token expired"};
      return res.send(response);
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