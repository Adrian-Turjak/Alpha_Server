var db = require('./models');
var auth = require('./auth');

function all_quotes(req, res) {
  return auth.check_token(req, res, function(req, res){
    db.Quote.findAll().then(function(quotes){
      return res.send(quotes);  
    });
  });
};

function random_quote(req, res) {
  auth.check_token(req, res, function(req, res){
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
  });   
};

function quote_by_id(req, res) {
  return auth.check_token(req, res, function(req, res){
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
  });      
};

function create_quote(req, res) {
  return auth.check_token(req, res, function(req, res){
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
  });  
};

function delete_quote(req, res) {
  return auth.check_token(req, res, function(req, res){
    db.Quote.findById(req.params.id).then(function(quote){
      if(!quote) {
        res.statusCode = 404;
        return res.send('Error 404: No quote found');
      }
      quote.destroy().then(function(){
        return res.send('Quote deleted');
      });
    });   
  });      
}

var quotes = {
    all_quotes: all_quotes,
    random_quote: random_quote,
    quote_by_id: quote_by_id,
    create_quote: create_quote,
    delete_quote: delete_quote
};

global.quotes = quotes

module.exports = global.quotes