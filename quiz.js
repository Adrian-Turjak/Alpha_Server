var db = require('./models');
var auth = require('./auth');


function build_quiz(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    var quiz = {
      "questions": [
        {
          'question_id': 1,
          'question': "What are one of the main weapons the people of Vanuatu traditionally hunt with?",
          'choices':['gun', 'bow and arrow', 'knives', 'sword'],
          'answer': 'bow and arrow',
        }
      ]
    }
    return res.send(quiz);
  });
};


function answer_question(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    
  });
};


function add_question(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    
  });
};


var quiz = {
    build_quiz: build_quiz,
    add_question: add_question,
    answer_question: answer_question

};

global.quiz = quiz

module.exports = global.quiz