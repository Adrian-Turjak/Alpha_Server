var crypto = require('crypto');

var db = require('./models');


function hashPassword (password) {
  var hash = crypto.createHash('md5').update(password).digest('hex');
  return hash;
}


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
    var hash = hashPassword(req.body.password);

    if(hash===user.password){
      db.Token.create({
        token: crypto.randomBytes(32).toString('hex'),
        expires: new Date(Date.now() + 10*60000),
        UserId: user.id
      }).then(function(token) {
        var t = {'token': token.token, 'message': "Logged in."};
        return res.send(t);
      });      
    } else {
      res.statusCode = 403;
      return res.send('Error 403: incorrect password.');
    }
  });
};


function register(req, res) {
  // stuff
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
}


var auth = {
    login: login,
    hashPassword: hashPassword,
    check_token: check_token
};

global.auth = auth

module.exports = global.auth