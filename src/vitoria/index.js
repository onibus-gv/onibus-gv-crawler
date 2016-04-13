'use strict';

const models = require('../models');
const Linha = models.Linha;
const Horario = models.Horario;
const Itinerario = models.Itinerario;

const ProgressBar = require('progress');
const iconv = require('iconv-lite');
const functions = require('../functions');
const sequentialPromise = functions.sequentialPromise;
const chunk = functions.chunk;
const customRequest = functions.customRequest;

const parser = require('./parser');

iconv.skipDecodeWarning = true;

const log = (txt) => {
  console.log(txt);
};

const getItinerarios = (empresaId) => {
  return Linha.findAll({
    where: {
      empresaId: empresaId
    }
  })
  .then((linhas) => {
    log(`Preparando para inserir itinerários de ${linhas.length} linha(s)`);
    const bar = new ProgressBar('Inserindo [:bar] :percent', { total: linhas.length });
    return sequentialPromise(linhas, (linha) => {
      return insertItinerarios(linha).then(bar.tick.bind(bar));
    });
  });
};

const insertItinerarios = (linha) => {
  return customRequest('get', {
    encoding: 'utf-8',
    url: 'http://sistemas.vitoria.es.gov.br/redeiti/listarItinerario.cfm',
    qs: {
      cdLinha: linha.linha
    }
  })
  .then((body) => {
    const itinerarios = parser.parseItinerarios(linha.id, body);
    return Itinerario.bulkCreate(itinerarios.ida.concat(itinerarios.volta));
  });
};

const getLinhas = (empresaId) => {
  const url = 'http://sistemas.vitoria.es.gov.br/redeiti/';
  return customRequest('post', {
    url: url,
    encoding: 'utf-8'
  })
  .then((body) => {
    const linhas = parser.parseLinhas(empresaId, body);
    return Linha.bulkCreate(linhas)
    .then(() => {
      log(`Inseridas ${linhas.length} linha(s)`);
    });
  });
};

const insertHorarios = (linha) => {
  return customRequest('get', {
    encoding: 'utf-8',
    url: 'http://sistemas.vitoria.es.gov.br/redeiti/listarHorario.cfm',
    qs: {
      cdLinha: linha.linha
    }
  })
  .then((body) => {
    const parsed = parser.parseHorarios(linha.id, body);
    const horarios = parsed.diasUteis.concat(parsed.sabado).concat(parsed.domingo);

    return sequentialPromise(chunk(horarios, 100), (horariosChunk) => {
      return Horario.bulkCreate(horariosChunk);
    });
  });
};

const getHorarios = (empresaId) => {
  return Linha.findAll({
    where: {
      empresaId: empresaId
    }
  })
  .then((linhas) => {
    log(`Preparando para inserir horários de ${linhas.length} linha(s)`);
    const bar = new ProgressBar('Inserindo [:bar] :percent', { total: linhas.length });

    return sequentialPromise(linhas, (linha) => {
      return insertHorarios(linha).then(bar.tick.bind(bar));
    });
  });
};

exports = module.exports = {
  getLinhas: (empresaId) => getLinhas(empresaId),
  getHorarios: (empresaId) => getHorarios(empresaId),
  getItinerarios: (empresaId) => getItinerarios(empresaId)
};
