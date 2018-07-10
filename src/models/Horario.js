module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Horarios",
    {
      hora: DataTypes.INTEGER,
      minuto: DataTypes.INTEGER,
      sentido: DataTypes.INTEGER,
      siglaObs: DataTypes.STRING,
      dia: DataTypes.INTEGER
    },
    {
      timestamps: false
    }
  );
};
