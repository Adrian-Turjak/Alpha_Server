module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Trophy", {
    country: DataTypes.STRING,
    name: DataTypes.STRING
  })
}