'use strict';

const models = require('../models');
const Linha = models.Linha;
const Horario = models.Horario;
const Observacao = models.Observacao;
const Itinerario = models.Itinerario;

const ProgressBar = require('progress');

const parsers = require('./parsers');

const iconv = require('iconv-lite');
const functions = require('../functions');
const sequentialPromise = functions.sequentialPromise;
const chunk = functions.chunk;
const customRequest = functions.customRequest;

iconv.skipDecodeWarning = true;

const URL = 'http://www.ceturb.es.gov.br/default.asp';

const log = (txt) => {
  console.log(txt);
};

const getItinerarios = (empresaId, paginaDestino) => {
  return Linha.findAll({
    where: {
      empresaId: empresaId
    }
  })
  .then((linhas) => {
    log(`Preparando para inserir itinerários de ${linhas.length} linha(s)`);
    const bar = new ProgressBar('Inserindo [:bar] :percent', {
      total: linhas.length,
      width: 40
    });
    return sequentialPromise(linhas, (linha) => {
      return insertItinerarios(paginaDestino, linha).then(bar.tick.bind(bar));
    });
  });
};

const insertItinerarios = (paginaDestino, linha) => {
  return customRequest('post', {
    encoding: null,
    url: URL,
    form: {
      ItemMenu: 'adm500.asp',
      PaginaDestino: paginaDestino,
      quallinha: linha.linha
    }
  })
  .then(function(body) {
    const itinerarios = parsers.parseItinerarios(
      linha.id,
      iconv.decode(body, 'binary')
    );

    return Itinerario.bulkCreate(itinerarios.ida.concat(itinerarios.volta));
  });
};

const getLinhas = (empresaId, linhasDropdown) => {
  return customRequest('get', {
    encoding: null,
    url: URL,
    qs: {
      pagina: '15980'
    }
  })
  .then((body) => {
    const linhas = parsers.parseLinhas(empresaId, linhasDropdown, iconv.decode(body, 'binary'));
    return Linha.bulkCreate(linhas)
      .then(() => {
        log(`Inseridas ${linhas.length} linha(s)`);
      });
  });
};

const insertHorarios = (paginaDestino, linha) => {
  return customRequest('post', {
    encoding: null,
    url: URL,
    form: {
      ItemMenu: 'adm510.asp',
      PaginaDestino: paginaDestino,
      quallinha: linha.linha
    }
  })
  .then((body) => {
    const decodedBody = iconv.decode(body, 'binary');

    const parsed = parsers.parseSaidaDestino(decodedBody);

    linha.saida = parsed.saida;
    linha.destino = parsed.destino;
    linha.save();

    const observacoes = parsers.parseObservacoes(linha.id, decodedBody);
    const horarios = parsers.parseHorarios(linha.id, decodedBody);

    return Observacao.bulkCreate(observacoes)
    .then(() => {
      return sequentialPromise(chunk(horarios, 100), (horariosChunk) => {
        return Horario.bulkCreate(horariosChunk);
      });
    });
  });
};

const getHorarios = (empresaId, paginaDestino) => {
  return Linha.findAll({
    where: {
      empresaId: empresaId
    }
  })
  .then((linhas) => {
    log(`Preparando para inserir horários de ${linhas.length} linha(s)`);

    const bar = new ProgressBar('Inserindo [:bar] :percent :etas', {
      total: linhas.length,
      width: 40
    });

    return sequentialPromise(linhas, (linha) => {
      return insertHorarios(paginaDestino, linha).then(bar.tick.bind(bar));
    });
  });
};

exports = module.exports = {
  getLinhas,
  getHorarios,
  getItinerarios
};
