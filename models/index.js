if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize')
    , sequelize = null

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect:  'postgres',
    protocol: 'postgres',
    port:     5432
  })
  

  global.db = {
    Sequelize: Sequelize,
    sequelize: sequelize,
    User:      sequelize.import(__dirname + '/user'),
    Token:      sequelize.import(__dirname + '/token'),
    Trophy:      sequelize.import(__dirname + '/trophy'),
    Question:      sequelize.import(__dirname + '/question'),
    SecurityQuestions: sequelize.import(__dirname + '/securityQuestions')
  }


  global.db.User.belongsToMany(global.db.User, {as: "Followers", through: 'followers'});

  global.db.Trophy.belongsToMany(global.db.User, {as: "Users", through: 'UserTrophies'});
  global.db.User.belongsToMany(global.db.Trophy, {as: "Trophies", through: 'UserTrophies'});

  global.db.Question.belongsToMany(global.db.User, {as: "Users", through: 'UserQuestions'});
  global.db.User.belongsToMany(global.db.Question, {as: "Questions", through: 'UserQuestions'});
  
  global.db.Token.belongsTo(global.db.User);
  global.db.User.hasMany(global.db.Token);
  
  global.db.SecurityQuestions.belongsTo(global.db.User);
  global.db.User.hasOne(global.db.SecurityQuestions);

}

module.exports = global.db