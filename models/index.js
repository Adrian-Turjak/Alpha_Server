if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize')
    , sequelize = null
    , database_url = process.env.DATABASE_URL || "postgres://pyblqjjvqlrzvc:MvyQSuj04MN6a5wuysnInoPy08@ec2-54-83-17-8.compute-1.amazonaws.com:5432/d9khtmbs5dcl24";

  sequelize = new Sequelize(database_url, {
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
    Question:      sequelize.import(__dirname + '/question')
  }


  global.db.User.hasMany(global.db.User, {foreignKey: 'following'});
  
  global.db.Token.belongsTo(global.db.User);
  global.db.User.hasMany(global.db.Token);
  
}

module.exports = global.db