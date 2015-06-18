module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Quote", {
    question: DataTypes.STRING,
    trophy: DataTypes.STRING,
    choice1: DataTypes.STRING,
    choice2: DataTypes.STRING,
    choice3: DataTypes.STRING,
    choice4: DataTypes.STRING,
    answer: DataTypes.STRING
  })
}