

function check_body(req, required) {
  var errors = [];
  for (i = 0; i < required.length; i++) {
    if(!req.body.hasOwnProperty(required[i])){
      errors.push(required[i]+" is a required field.");
    }
  }
  return errors;
};


var utils = {
    check_body: check_body,
};

global.utils = utils

module.exports = global.utils