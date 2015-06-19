module.exports = function(sequelize, DataTypes) {
    return sequelize.define("SecurityQuestions", {
        username: DataTypes.STRING,
        questionOne: DataTypes.STRING,
        questionTwo: DataTypes.STRING,
        answerOne: DataTypes.STRING,
        answerTwo: DataTypes.STRING
    })
}
