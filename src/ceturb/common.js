'use strict';

const models = require('../models');
const Linha = models.Linha;
const Horario = models.Horario;
const Observacao = models.Observacao;
const Itinerario = models.Itinerario;

const ProgressBar = require('progress');
const cheerio = require('cheerio');
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
    const $ = cheerio.load(iconv.decode(body, 'binary'));

    if ($('p').length > 0) {
      return Promise.resolve();
    }

    const $table = $('table.roteiro').first();
    const $ida = $table.find('td').eq(0).children('span');
    const $volta = $table.find('td').eq(1).children('span');

    const arrIda = $ida.nextAll()
      .filter((i, el) => {
        const txt = $(el)[0].next.data;
        return typeof txt !== 'undefined' && txt.trim() != 'IDA' && txt.trim() != '';
      })
      .map((i, el) => {
        return {
          sentido: 1,
          linhaId: linha.id,
          rua: $(el)[0].next.data.trim()
        };
      })
      .get();

    const arrVolta = $volta.nextAll()
      .filter((i, el) => {
        const txt = $(el)[0].next.data;
        return typeof txt !== 'undefined' && txt.trim() != 'VOLTA' && txt.trim() != '';
      })
      .map((i, el) => {
        return {
          sentido: 2,
          linhaId: linha.id,
          rua: $(el)[0].next.data.trim()
        };
      })
      .get();

    return Itinerario.bulkCreate(arrIda.concat(arrVolta));
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
    const $ = cheerio.load(iconv.decode(body, 'binary'));
    const linhas = $(linhasDropdown).map((i, el) => {
      return {
        linha: $(el).val(),
        nome: $(el).text().split(' - ').slice(1).join(' - '),
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

const getDiaDaSemana = (txt) => {
  switch(txt.trim()) {
  case 'DIAS ÚTEIS':
  case 'DIAS &#xFFFD;TEIS':
  case 'DIAS &#xDA;TEIS':
    return 1;
  case 'SÁBADO':
  case 'S&#xC1;BADO':
  case 'S&#xFFFD;BADO':
    return 2;
  case 'DOMINGOS E FERIADOS':
    return 3;
  case 'AT&#xFFFD;PICOS ENTRE FERIADOS':
  case 'AT&#xCD;PICOS ENTRE FERIADOS':
  case 'ATÍPICOS ENTRE FERIADOS':
    return 4;
  default:
    return 1;
  }
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
    const $ = cheerio.load(iconv.decode(body, 'binary'));

    // Nenhum Horário
    if ($('p').length > 0) {
      return Promise.resolve();
    }

    const $table = $('td[colspan=3]').find('table').find('tr').eq(1).children('td');
    const saida = $table.find('span').eq(1).text().replace('Saída: ', '');
    const destino = $table.find('hr')
                          .eq(2)
                          .next('span')
                          .text()
                          .replace('Destino: ', '')
                          .replace('Saída: ', '')
                          .trim();

    linha.saida = saida;
    linha.destino = destino;
    linha.save();

    const obs = $('table')
      .last()
      .nextAll()
      .filter((i, el) => {
        const txt = $(el)[0].next.data;
        return typeof txt != 'undefined' ? (txt.trim() != 'OBS:' && txt.trim() != '') : null;
      })
      .map((i, el) => {
        const observacao = $(el)[0].next.data.trim().split(' - ');
        const sigla = observacao.shift();
        const obs = observacao.join(' - ');
        return {
          obs,
          sigla,
          linhaId: linha.id
        };
      })
      .get();

    const horarios = $('td')
      .slice(2)
      .filter((i, el) => {
        return $(el).text().trim() !== '' && $(el).text().split(':').length === 2;
      })
      .map((i, el) => {
        const tempo = $(el).text().split(':');
        const hasSigla = tempo[1].trim().length === 3;
        return {
          hora: parseInt(tempo[0].trim(), 10),
          minuto: parseInt(tempo[1].trim(), 10),
          sentido: $(el).closest('table').prevAll('hr').length / 2,
          dia: getDiaDaSemana($(el).closest('table').prevAll('span').first().html()),
          siglaObs: hasSigla ? tempo[1].trim().slice(-1) : null,
          linhaId: linha.id
        };
      })
      .get();

    return Observacao.bulkCreate(obs)
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
