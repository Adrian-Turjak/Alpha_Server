var db = require('./models');
var auth = require('./auth');


function get_trophies(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    
  });
};


function add_trophy(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    
  });
};


function get_score(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    
  });
};


function follow_user(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    
  });
};


function unfollow_user(req, res) {
  return auth.check_token(req, res, function(req, res, user){
    
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