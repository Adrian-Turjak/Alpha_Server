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
    Quote:      sequelize.import(__dirname + '/quote'),
    User:      sequelize.import(__dirname + '/user'),
    Token:      sequelize.import(__dirname + '/token')
  }


  global.db.Quote.belongsTo(global.db.User);
  global.db.User.hasMany(global.db.Quote);
  
  global.db.Token.belongsTo(global.db.User);
  global.db.User.hasMany(global.db.Token);
  
}

module.exports = global.db