// use the express middleware
var express = require('express');

// make express handle JSON and other requests
var bodyParser = require('body-parser');

// use cross origin resource sharing
var cors = require('cors');

// instantiate app
var app = express();


// setup database
var db = require('./models');

var crypto = require('crypto');

var auth = require('./auth');


// make sure we can parse JSON passed in the body or encoded into url
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// serve up files from this directory 
app.use(express.static(__dirname));
// make sure we use CORS to avoid cross domain problems
app.use(cors());

app.post('/auth/login', auth.login);

app.get('/quote/all', function(req,res) {
  if(!req.headers.hasOwnProperty('token')) {
    res.statusCode = 403;
    return res.send('Error 403: Not logged in.');
  }

  db.Token.findOne({where: {token: req.headers.token}}).then(function(token) {

    var now = new Date(Date.now());

    if(token && token.expires > now){
      db.Quote.findAll().then(function(quotes){
        return res.send(quotes);  
      });
    } else {
      res.statusCode = 403;
      return res.send('Error 403: Token has expired.');
    }
    
  }); 
});

app.get('/quote/random', function(req, res) {
  if(!req.headers.hasOwnProperty('token')) {
    res.statusCode = 403;
    return res.send('Error 403: Not logged in.');
  }

  db.Token.findOne({where: {token: req.headers.token}}).then(function(token) {

    var now = new Date(Date.now());

    if(token && token.expires > now){
      db.Quote.findAll().then(function(quotes){
        var id = Math.floor(Math.random() * quotes.length);
        db.User.findById(quotes[id].UserId).then(function(user){
          var q = {
            "id": quotes[id].id,
            "author": quotes[id].author,
            "text": quotes[id].text,
            "submitted_by": user.username
          };
          res.send(q);
        });   
      });
    } else {
      res.statusCode = 403;
      return res.send('Error 403: Token has expired.');
    }
    
  });   
});

app.get('/quote/:id', function(req, res) {
  if(!req.headers.hasOwnProperty('token')) {
    res.statusCode = 403;
    return res.send('Error 403: Not logged in.');
  }

  db.Token.findOne({where: {token: req.headers.token}}).then(function(token) {

    var now = new Date(Date.now());

    if(token && token.expires > now){
      db.Quote.findById(req.params.id).then(function(quote){
        if(!quote) {
          res.statusCode = 404;
          return res.send('Error 404: No quote found');
        }

        db.User.findById(quote.UserId).then(function(user){
          var q = {
            "id": quote.id,
            "author": quote.author,
            "text": quote.text,
            "submitted_by": user.username
          };
          return res.send(q);
        });
      });
    } else {
      res.statusCode = 403;
      return res.send('Error 403: Token has expired.');
    }
    
  });      
});

app.post('/quote', function(req, res) {
  if(!req.headers.hasOwnProperty('token')) {
    res.statusCode = 403;
    return res.send('Error 403: Not logged in.');
  }

  if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  db.Token.findOne({where: {token: req.headers.token}}).then(function(token) {

    var now = new Date(Date.now());

    if(token && token.expires > now){
      db.User.findById(token.UserId).then(function(user){
        db.Quote.create({
          author : req.body.author,
          text : req.body.text,
          UserId: user.id
        }).then(function(quote){
          console.log("Added!");

          var q = {
            "id": quote.id,
            "author": quote.author,
            "text": quote.text,
            "submitted_by": user.username
          };
          res.send(q);
        });
      });
    } else {
      res.statusCode = 403;
      return res.send('Error 403: Token has expired.');
    }

    
  });  
});

app.delete('/quote/:id', function(req, res) {
  if(!req.headers.hasOwnProperty('token')) {
    res.statusCode = 403;
    return res.send('Error 403: Not logged in.');
  }

  db.Token.findOne({where: {token: req.headers.token}}).then(function(token) {

    var now = new Date(Date.now());

    if(token && token.expires > now){
      db.Quote.findById(req.params.id).then(function(quote){
        if(!quote) {
          res.statusCode = 404;
          return res.send('Error 404: No quote found');
        }
        quote.destroy().then(function(){
          return res.send('Quote deleted');
        });
      });
    } else {
      res.statusCode = 403;
      return res.send('Error 403: Token has expired.');
    }    
  });      
});

// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});


// Setup the Database and load default quotes and user.
// This drop all the tables, and create new ones.
// Useful for development, but needs to be changed for production environments.
db.sequelize.sync({ force: true }).then(function(){
  db.User.create({
    username: 'admin',
    password: auth.hashPassword("password")
  }).then(function(user){
    var quotes = [
      { author : 'Audrey Hepburn', text : "Nothing is impossible, the word itself says 'I'm possible'!"},
      { author : 'Walt Disney', text : "You may not realize it when it happens, but a kick in the teeth may be the best thing in the world for you"},
      { author : 'Unknown', text : "Even the greatest was once a beginner. Don’t be afraid to take that first step."},
      { author : 'Neale Donald Walsch', text : "You are afraid to die, and you’re afraid to live. What a way to exist."}
    ];

    for (var i = quotes.length - 1; i >= 0; i--) {
      db.Quote.create({
        text: quotes[i].text,
        author: quotes[i].author,
        UserId: user.id
      });
    };
    db.User.create({
      username: 'demo',
      password: auth.hashPassword("123456")
    });
  });
  

});


