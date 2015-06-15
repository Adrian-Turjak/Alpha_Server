module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Quote", {
    author: DataTypes.STRING,
    text: DataTypes.STRING
  })
}