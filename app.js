'use strict';

const models = require('./src/models');
const sequelize = models.sequelize;

const Linha = models.Linha;
const Horario = models.Horario;
const Observacao = models.Observacao;
const Itinerario = models.Itinerario;
const Empresa = models.Empresa;

const transcol = require('./src/ceturb/Transcol');
const seletivo = require('./src/ceturb/Seletivo');
const sanremo = require('./src/sanremo');
const vitoria = require('./src/vitoria');
const opts = { truncate: true };

const log = (args) => console.log(args);

sequelize.sync()
  .then(() => Empresa.destroy(opts))
  .then(() => Linha.destroy(opts))
  .then(() => Horario.destroy(opts))
  .then(() => Itinerario.destroy(opts))
  .then(() => Observacao.destroy(opts))

  .then(() => {
    log('');
    log('-------------------------');
    log('-------- Transcol -------');
    log('-------------------------');
    log('');
  })
  .then(() => Empresa.build({ nome: 'Transcol' }).save())
  .then((empresa) => {
    return transcol.getLinhas(empresa.id)
      .then(() => transcol.getHorarios(empresa.id))
      .then(() => transcol.getItinerarios(empresa.id))
      .then(() => transcol.getObservacoes(empresa.id));
  })

  .then(() => {
    log('');
    log('-------------------------');
    log('--- Seletivo Transcol ---');
    log('-------------------------');
    log('');
  })
  .then(() => Empresa.build({ nome: 'Seletivo Transcol' }).save())
  .then((empresa) => {
    return seletivo.getLinhas(empresa.id)
      .then(() => seletivo.getHorarios(empresa.id))
      .then(() => seletivo.getItinerarios(empresa.id))
      .then(() => seletivo.getObservacoes(empresa.id));
  })

  .then(() => {
    log('');
    log('-------------------------');
    log('-------- Sanremo --------');
    log('-------------------------');
    log('');
  })
  .then(() => Empresa.build({ nome: 'Sanremo' }).save())
  .then((empresa) => {
    return sanremo.getLinhas(empresa.id)
      .then(() => sanremo.getHorarios(empresa.id))
  })

  .then(() => {
    log('');
    log('-------------------------');
    log('--- Seletivo Vitória ----');
    log('-------------------------');
    log('');
  })
  .then(() => Empresa.build({ nome: 'Seletivo Vitória' }).save())
  .then((empresa) => {
    return vitoria.getLinhas(empresa.id)
      .then(() => vitoria.getHorarios(empresa.id))
      .then(() => vitoria.getItinerarios(empresa.id));
  })

  .then(() => log('ok'))
  .catch((err) => log(err));
