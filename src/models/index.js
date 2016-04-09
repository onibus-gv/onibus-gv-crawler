var Sequelize = require('sequelize');

var sequelize = new Sequelize(null, null, null, {
  storage: __dirname + '/../../onibus.db',
  dialect: 'sqlite',
  logging: false
});

var models = [
  'Linha',
  'Horario',
  'Itinerario',
  'Observacao',
  'Empresa'
];
models.forEach(function(model) {
  module.exports[model] = sequelize.import(__dirname + '/' + model);
});

(function(m) {
  m.Observacao.belongsTo(m.Linha, {foreignKey: 'linhaId'});
  m.Horario.belongsTo(m.Linha, {foreignKey: 'linhaId'});
  m.Itinerario.belongsTo(m.Linha, {foreignKey: 'linhaId'});
  m.Linha.belongsTo(m.Empresa, {foreignKey: 'empresaId'});
})(module.exports);

module.exports.sequelize = sequelize;
