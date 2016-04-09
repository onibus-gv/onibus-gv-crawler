module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Horarios', {
    hora: DataTypes.INTEGER,
    minuto: DataTypes.INTEGER,
    sentido: DataTypes.BOOLEAN,
    siglaObs: DataTypes.STRING,
    dia: DataTypes.INTEGER
  }, {
    timestamps: false
  });
};
