module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Question", {
    question: {type: DataTypes.STRING, unique: true},
    trophy: DataTypes.STRING,
    choice1: DataTypes.STRING,
    choice2: DataTypes.STRING,
    choice3: DataTypes.STRING,
    choice4: DataTypes.STRING,
    answer: DataTypes.STRING,
    value: {type: DataTypes.INTEGER, defaultValue: 4},
    deduct: {type: DataTypes.INTEGER, defaultValue: 1 }
  })
}