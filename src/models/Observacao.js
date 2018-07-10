module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Observacao",
    {
      obs: DataTypes.STRING,
      sigla: DataTypes.STRING
    },
    {
      timestamps: false
    }
  );
};
