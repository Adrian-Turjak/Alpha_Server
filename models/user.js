module.exports = function(sequelize, DataTypes) {
  return sequelize.define("User", {
    username: {type: DataTypes.STRING, unique: true},
    password: DataTypes.STRING,
    icon: DataTypes.STRING,
    score: {type: DataTypes.INTEGER, defaultValue: 0},
    admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
  })
}