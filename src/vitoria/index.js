'use strict';

const {
  Linha,
  Horario,
  Itinerario
} = require('../models');
const ProgressBar = require('progress');
const {
  sequentialPromise,
  chunk,
  customRequest
} = require('../functions');
const parser = require('./parser');

const getItinerarios = async (empresaId) => {
  const linhas = await Linha.findAll({
    where: {
      empresaId: empresaId
    }
  });

  console.log(`Preparando para inserir itinerários de ${linhas.length} linha(s)`);
  const bar = new ProgressBar('Inserindo :bar :percent', { total: linhas.length });

  return sequentialPromise(linhas, (linha) => {
    return insertItinerarios(linha).then(bar.tick.bind(bar));
  });
};

const insertItinerarios = async (linha) => {
  const body = await customRequest('get', {
    encoding: 'utf-8',
    url: 'http://sistemas.vitoria.es.gov.br/redeiti/listarItinerario.cfm',
    qs: {
      cdLinha: linha.linha
    }
  });

  const itinerarios = parser.parseItinerarios(linha.id, body);
  return Itinerario.bulkCreate(itinerarios.ida.concat(itinerarios.volta));
};

const getLinhas = async (empresaId) => {
  const url = 'http://sistemas.vitoria.es.gov.br/redeiti/';
  const body = await customRequest('post', {
    url: url,
    encoding: 'utf-8'
  });

  const linhas = parser.parseLinhas(empresaId, body);
  await Linha.bulkCreate(linhas);
  console.log(`Inseridas ${linhas.length} linha(s)`);
};

const insertHorarios = async (linha) => {
  const body = await customRequest('get', {
    encoding: 'utf-8',
    url: 'http://sistemas.vitoria.es.gov.br/redeiti/listarHorario.cfm',
    qs: {
      cdLinha: linha.linha
    }
  });

  const parsed = parser.parseHorarios(linha.id, body);
  const horarios = parsed.diasUteis.concat(parsed.sabado).concat(parsed.domingo);

  return sequentialPromise(chunk(horarios, 100), (horariosChunk) => {
    return Horario.bulkCreate(horariosChunk);
  });
};

const getHorarios = async (empresaId) => {
  const linhas = await Linha.findAll({
    where: {
      empresaId: empresaId
    }
  });

  console.log(`Preparando para inserir horários de ${linhas.length} linha(s)`);
  const bar = new ProgressBar('Inserindo :bar :percent', { total: linhas.length });

  return sequentialPromise(linhas, (linha) => {
    return insertHorarios(linha).then(bar.tick.bind(bar));
  });
};

exports = module.exports = {
  getLinhas: (empresaId) => getLinhas(empresaId),
  getHorarios: (empresaId) => getHorarios(empresaId),
  getItinerarios: (empresaId) => getItinerarios(empresaId)
};
