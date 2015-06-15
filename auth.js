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

var auth = {
    login: login,
    hashPassword: hashPassword
};

global.auth = auth

module.exports = global.auth