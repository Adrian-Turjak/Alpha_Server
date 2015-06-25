module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Token", {
    token: {type: DataTypes.STRING, unique: true},
    expires: DataTypes.DATE,
    reset_token: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
  })
}