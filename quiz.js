var db = require('./models');
var auth = require('./auth');


// Returns a quiz of availible questions based on
// which trophies the user has, and what questions
// they have already answered
// returns a json in the format:
// {"questions": [
//     {"id": n, "question": <some question>,
//      "choices": [<some choice>,], "answer": <correct choice>},
// ]}
function build_quiz(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    // get the trophies the user already has.
    user.getTrophies().then(function(trophies){
      var quiz = {
        "questions": []
      }

      // only get questions if the user even has trophies
      if(trophies){
        t = []
        for (i = 0; i < trophies.length; i++) { 
          t.push(trophies[i].name);
        }

        // Get the list of answered questions
        user.getQuestions().then(function(answered_questions){
          // ids start at 1 so 0 is a safe empty value to avoid a null array
          // otherwise the "not in" database query would need to be changed.
          var user_questions = [0,]
          for (i = 0; i < answered_questions.length; i++) { 
            user_questions.push(answered_questions[i].id);
          }

          // find the questions given the trophy and answered question
          // lists.
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

// Updates the score for the user based on the number of tries and the point
// value for the given question.
// requires:
// {"id": <question id>, "tries": <number of failed answered>}
function answer_question(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    errors = utils.check_body(req, ["id", "tries"]);
    if(errors.length > 0){
      res.statusCode = 400;
      var response = {"errors": errors};
      return res.send(response);
    }
    db.Question.findById(req.body.id).then(function (question) {
      var score = question.value - (req.body.tries * question.deduct);
      user.score = user.score + score;
      user.save();
      user.addQuestions(question);
    })
  });
};

// if the user is admin, add a new question to the database.
// requires:
// {"question": <question>, "trophy": <related trophy>,
//  "choice1": <choice>, "choice2": <choice>,
//  "choice3": <choice>, "choice4": <choice>,
//  "answer": <correct choice>,}
function add_question(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    if(user.admin){
      errors = utils.check_body(req, [
        "question", "trophy", "choice1", "choice2",
        "choice3", "choice4", "answer"
      ]);
      if(errors.length > 0){
        res.statusCode = 400;
        var response = {"errors": errors};
        return res.send(response);
      }
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