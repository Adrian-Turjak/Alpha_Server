var db = require('./models');
var auth = require('./auth');
var utils = require('./utils');


/*
  Returns the list of trophies that the user has 
  in the following json:
  {"trophies": [
      {"name": <trophy name>, "country": <country name>}, ...
  ]}
*/
function get_trophies(req, res) {
  return auth.check_token(req, res, function (req, res, user){
    user.getTrophies().then(function(trophies){
      t = {
        "trophies": []
      }
      if(trophies){
        for (i = 0; i < trophies.length; i++) { 
          t.trophies.push(
            {"name": trophies[i].name, "country": trophies[i].country})
        }
      }
      return res.send(t);
    });
  });
};


/*
  Add a trophy to the logged in user.
  requires:
  {"name": <trophy name>, "country": <country name>}
*/
function add_trophy(req, res) {
  return auth.check_token(req, res, function (req, res, user){
    errors = utils.check_body(req, ["name", "country"]);
    if(errors.length > 0){
      res.statusCode = 400;
      var response = {"errors": errors};
      return res.send(response);
    }
    db.Trophy.find({
      where: {name: req.body.name, country: req.body.country}
    }).then(function (trophy){
      if(!trophy){
        db.Trophy.create({
            name : req.body.name,
            country : req.body.country,
        }).then(function (trophy) {
          user.addTrophies(trophy);
          res.statusCode = 201;
          return res.send('New Trophy created.');
        });
      } else {
        user.addTrophies(trophy);
        res.statusCode = 202;
        return res.send('New Trophy added.');
      }
    });
  });
};


/*
  Get the score for the user, and a list of scores for everyone they are following.
  returns"
*/
function get_score(req, res) {
  return auth.check_token(req, res, function (req, res, user){
    score = {
      "myscore": user.score,
      "scores": [
        {"username": user.username, "icon": user.icon, "score": user.score}
      ]
    }
    user.getFollowers().then(function (followers) {
      for (i = 0; i < followers.length; i++) { 
        score.scores.push(
          {"username": followers[i].username, "icon": followers[i].icon, "score": followers[i].score})
      }
      return res.send(score);
    });
    
  });
};


/*
  Addes the given user (if they exist) to your following list
  so you can compare their score to yours.
*/
function follow_user(req, res) {
  return auth.check_token(req, res, function (req, res, user){
    errors = utils.check_body(req, ["username",]);
    if(errors.length > 0){
      res.statusCode = 400;
      var response = {"errors": errors};
      return res.send(response);
    }
    db.User.findOne({
      where: {username: req.body.username}
    }).then(function(user2){
      if(user.equals(user2)){
        res.statusCode = 400;
        return res.send("Can't follow yourself.");
      }
      if(user){
        user.addFollowers(user2);
        res.statusCode = 202;
        return res.send('User followed');
      } else {
        res.statusCode = 404;
        return res.send('User not found.');
      }
    });
  });
};


/*
  removes the given user from your following list.
*/
function unfollow_user(req, res) {
  return auth.check_token(req, res, function (req, res, user){
    errors = utils.check_body(req, ["username",]);
    if(errors.length > 0){
      res.statusCode = 400;
      var response = {"errors": errors};
      return res.send(response);
    }
    db.User.findOne({
      where: {username: req.body.username}
    }).then(function(user2){
      if(user.equals(user2)){
        res.statusCode = 400;
        return res.send("Can't unfollow yourself.");
      }
      if(user){
        user.removeFollowers(user2);
        res.statusCode = 202;
        return res.send('User removed');
      } else {
        res.statusCode = 404;
        return res.send('User not found.');
      }
    });
  });
};


var user_functions = {
    get_trophies: get_trophies,
    add_trophy: add_trophy,
    get_score: get_score,
    follow_user: follow_user,
    unfollow_user: unfollow_user
};

global.user_functions = user_functions

module.exports = global.user_functions