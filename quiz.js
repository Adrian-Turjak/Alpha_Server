var db = require('./models');
var auth = require('./auth');


function build_quiz(req, res, user) {
  return auth.check_token(req, res, function(req, res, user){
    user.getTrophies().then(function(trophies){
      var quiz = {
        "questions": []
      }
      if(trophies){
        t = []
        for (i = 0; i < trophies.length; i++) { 
          t.push(trophies[i].name);
        }
        user.getQuestions().then(function(answered_questions){
          // ids start at 1 so 0 is a safe empty value to avoid a null array
          var user_questions = [0,]
          for (i = 0; i < answered_questions.length; i++) { 
            user_questions.push(answered_questions[i].id);
          }
          db.Question.findAll({
            where: {
              trophy: {$in: t},
              id: {$not: user_questions}
            }
          }).then(function (questions) {
            if(questions){
              for (i = 0; i < questions.length; i++) { 
                quiz.questions.push({
                  "id": questions[i].id,
                  "question": questions[i].question,
                  "choices": [
                    questions[i].choice1,
                    questions[i].choice2,
                    questions[i].choice3,
                    questions[i].choice4
                  ],
                  "answer": questions[i].answer
                });
              }
            }
            return res.send(quiz);
          });
        });
      } else {
        return res.send(quiz);
      }
    });
  });
};


function answer_question(req, res, user) {
  return auth.check_token(req, res, function(req, res, user){
    db.Question.findById(req.body.id).then(function (question) {
      var score = question.value - (req.body.tries * question.deduct);
      user.score = user.score + score;
      user.save();
      user.addQuestions(question);
    })
  });
};


function add_question(req, res, user) {
  return auth.check_token(req, res, function(req, res, user){
    if(user.admin){
      var question = {
       "question" : req.body.question,
       "trophy" : req.body.trophy,
       "choice1" : req.body.choice1,
       "choice2" : req.body.choice2,
       "choice3" : req.body.choice3,
       "choice4" : req.body.choice4,
       "answer" : req.body.answer,
      }
      db.Question.create(question).then(function (question) {
        res.statusCode = 201;
        return res.send('Question created');
      });
    } else {
      res.statusCode = 403;
      return res.send("Your user isn't allowed to add questions.");
    }
  });
};


var quiz = {
    build_quiz: build_quiz,
    add_question: add_question,
    answer_question: answer_question

};

global.quiz = quiz

module.exports = global.quiz