'use strict';

const models = require('../models');
const Linha = models.Linha;
const Horario = models.Horario;
const Itinerario = models.Itinerario;

const ProgressBar = require('progress');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const functions = require('../functions');
const sequentialPromise = functions.sequentialPromise;
const chunk = functions.chunk;
const customRequest = functions.customRequest;

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
    const $ = cheerio.load(body);

    const $ida = $('.data').eq(0);
    const $volta = $('.data').eq(1);

    const arrIda = $ida.find('td[class!=txtR]')
      .map((i, el) => {
        return {
          sentido: 1,
          linhaId: linha.id,
          rua: $(el).text().trim()
        };
      })
      .get();

    const arrVolta = $volta.find('td[class!=txtR]')
      .map((i, el) => {
        return {
          sentido: 2,
          linhaId: linha.id,
          rua: $(el).text().trim()
        };
      })
      .get();

    return Itinerario.bulkCreate(arrIda.concat(arrVolta));
  });
};

const getLinhas = (empresaId) => {
  const url = 'http://sistemas.vitoria.es.gov.br/redeiti/';
  return customRequest('post', {
    url: url,
    encoding: 'utf-8'
  })
  .then((body) => {
    const $ = cheerio.load(body);

    const linhas = $('select[name=cdLinha]')
      .eq(0)
      .find('option')
      .not(':first-child')
      .map((i, el) => {

        const nome = $(el).text().split(' - ').slice(1).join(' - ');

        return {
          linha: $(el).val(),
          nome: nome,
          saida: nome.split(/\/| X /).slice(0, 1).join('').trim(),
          empresaId: empresaId
        };
      })
      .get();

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
    const $ = cheerio.load(body);

    const diasUteis = $('.data')
      .eq(0)
      .find('td')
      .filter((i, el) => {
        return $(el).text().trim() !== '' && $(el).text().trim() !== 'Não circula';
      })
      .map((i, el) => {

        const tempo  = $(el).text().split(':');

        return {
          hora: parseInt(tempo[0].trim(), 10),
          minuto : parseInt(tempo[1].trim(), 10),
          sentido: 1,
          dia: 1,
          siglaObs: null,
          linhaId: linha.id
        };
      })
      .get();

    const sabado = $('.data')
      .eq(1)
      .find('td')
      .filter((i, el) => {
        return $(el).text().trim() !== '' && $(el).text().trim() !== 'Não circula';
      })
      .map((i, el) => {

        const tempo = $(el).text().split(':');

        return {
          hora: parseInt(tempo[0].trim(), 10),
          minuto : parseInt(tempo[1].trim(), 10),
          sentido: 1,
          dia: 2,
          siglaObs: null,
          linhaId: linha.id
        };
      })
      .get();

    const domingo = $('.data')
      .eq(0)
      .find('td')
      .filter((i, el) => {
        return $(el).text().trim() !== '' && $(el).text().trim() !== 'Não circula';
      })
      .map((i, el) => {

        const tempo = $(el).text().split(':');

        return {
          hora: parseInt(tempo[0].trim(), 10),
          minuto : parseInt(tempo[1].trim(), 10),
          sentido: 1,
          dia: 3,
          siglaObs: null,
          linhaId: linha.id
        };
      })
      .get();

    const horarios = diasUteis.concat(sabado).concat(domingo);

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
