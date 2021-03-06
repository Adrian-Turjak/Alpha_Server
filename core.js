var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var cookieParser = require('cookie-parser');


// Our Modules:
var db = require('./models');
var auth = require('./auth');
var quiz = require('./quiz');
var user = require('./user');


var app = express();
app.use(cookieParser());


// make sure we can parse JSON passed in the body or encoded into url
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// serve up files from this directory 
app.use(express.static(__dirname + "/static/"));
// make sure we use CORS to avoid cross domain problems
app.use(cors());


// Auth Endpoins
app.post('/auth/login', auth.login);
app.post('/auth/register', auth.register);
app.post('/auth/logout', auth.logout);
app.post('/auth/reset', auth.resetPassword);
app.post('/auth/securityQuestions', auth.securityQuestions);
app.post('/auth/securityQuestionAnswer', auth.securityQuestionAnswer);

// quiz endpoints
app.get('/quiz/questions', quiz.build_quiz);
app.post('/quiz/answer', quiz.answer_question);
app.post('/quiz/questions', quiz.add_question);
app.get('/quiz/questions/all', quiz.get_all_questions);

// user endpoints
app.get('/user/trophies', user.get_trophies);
app.post('/user/trophies', user.add_trophy);
app.get('/user/score', user.get_score);
app.post('/user/follow', user.follow_user);
app.post('/user/unfollow', user.unfollow_user);


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
    password: auth.hashPassword("password"),
    icon: "nz.png",
    admin: true
  }).then(function (user){
    db.User.create({
      username: 'demo',
      password: auth.hashPassword("123456"),
      icon: "nz.png"
    }).then(function (user2) {
      user.addFollowers(user2);
      var question = {
       "question" : "What is one of the main weapons the people of Vanuatu hunt with?",
       "trophy" : "bow",
       "choice1" : "Gun",
       "choice2" : "Bow and Arrow",
       "choice3" : "Knives",
       "choice4" : "Sword",
       "answer" : "Bow and Arrow",
      }
      db.Question.create(question);
      question = {
       "question" : "The red-bellied fruit dove was named because of the red patch that sits on its belly and the top of its head, what colour is the rest of the red-bellied fruit dove?",
       "trophy" : "red-bellied-fruit",
       "choice1" : "Green",
       "choice2" : "Blue",
       "choice3" : "Orange",
       "choice4" : "Purple",
       "answer" : "Green",
      }
      db.Question.create(question);
    });
  });
});


