var crypto = require('crypto');

var db = require('./models');



function hashPassword (password) {
  var hash = crypto.createHash('md5').update(password).digest('hex');
  return hash;
};


function login(req, res) {
  console.log("logging in");
  console.log(req.body.username);
  console.log(req.body.password);
  if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }
  console.log("Attempting to find username");
  db.User.findOne({where: {username: req.body.username}}).then(function(user) {
    console.log("attempting in function");
    if(!user) {
      res.statusCode = 404;
      console.log("username does not exist");
      return res.send('Error 404: User does not exist.');
    }
    console.log("found username");
    var hash = hashPassword(req.body.password);
    console.log("Checking password");
    if(hash===user.password){
      console.log("password correct");
      db.Token.create({
        token: crypto.randomBytes(32).toString('hex'),
        expires: new Date(Date.now() + 10*60000),
        UserId: user.id
      }).then(function(token) {
        var t = {'token': token.token, 'message': "Logged in."};
        //put cookie here
        console.log('token sent');
        console.log('cookie set');
        res.cookie('token', token.token, {maxAge: 900000});

        return res.send(t);
      });      
    } else {
      console.log('error1');
      res.statusCode = 403;
      return res.send('Error 403: incorrect password.');
    }
  });
};

function logout(req, res){
  if(!req.cookies.token){
    console.log('No token');
    res.statusCode = 404;
    return res.send('Error 404: Token not found');
    }
  console.log(req.cookies.token);
  
  //delete token from db
  db.Token.destroy({
    where: {
      token: req.cookies.token
    }
  }).success(function(){
    res.clearCookie('token');
    res.statusCode = 200; //OK
    return res.send('Logout Success');
  })
  .error(function(err){
    res.statusCode = 500; //SERVER ERROR
    return res.send('Something broke at the server');
  });
  
};



function register(req, res) {
  // stuff
  return res.send('register');
};

function securityQuestions(req, res){
  return res.send('securityQuestions');
};

function resetPassword(req, res){
  return res.send('resetPassword');
};




function check_token(req, res, callback){
  if(!req.headers.hasOwnProperty('token')) {
    res.statusCode = 403;
    return res.send('Error 403: Not logged in.');
  }

  db.Token.findOne({where: {token: req.headers.token}}).then(function(token) {

    var now = new Date(Date.now());

    if(token && token.expires > now){
      return callback(req, res);
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