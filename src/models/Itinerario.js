module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Itinerarios",
    {
      sentido: DataTypes.INTEGER,
      rua: DataTypes.STRING
    },
    {
      timestamps: false
    }
  );
};
