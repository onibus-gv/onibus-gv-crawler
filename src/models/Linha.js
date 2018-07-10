module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Linhas",
    {
      linha: DataTypes.STRING,
      nome: DataTypes.STRING,
      saida: DataTypes.STRING,
      destino: DataTypes.STRING
    },
    {
      timestamps: false
    }
  );
};
