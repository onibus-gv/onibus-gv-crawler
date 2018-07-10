module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Empresas",
    {
      nome: DataTypes.STRING
    },
    {
      timestamps: false
    }
  );
};
