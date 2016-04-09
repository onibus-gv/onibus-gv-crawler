var cheerio = require('cheerio');

/**
 * Given the option layout as follow:
 *
 * <option value="1603">1603 - ITAPARICA  / RODOVIÁRIA - VIA  P.ITAPOÃ/B. MAR</option>
 *
 * Should return:
 *
 * {
 *   linha: 1603,
 *   nome: 'ITAPARICA  / RODOVIÁRIA - VIA  P.ITAPOÃ/B. MAR'
 * }
 *
 */
const parseLinhas = (empresaId, linhasDropdown, body) => {
  const $ = cheerio.load(body);
  return $(linhasDropdown).map((i, el) => {
    return {
      linha: $(el).val(),
      nome: $(el).text().split(' - ').slice(1).join(' - '),
      empresaId: empresaId
    };
  })
  .get();
};

/**
 * Given the layout shown in data/transcol/itinerarios.html
 * should parse the html and return the street name
 */
const parseItinerarios = (linhaId, body) => {
  const $ = cheerio.load(body);

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
        linhaId: linhaId,
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
        linhaId: linhaId,
        rua: $(el)[0].next.data.trim()
      };
    })
    .get();

  return {
    ida: arrIda,
    volta: arrVolta
  };
};

const parseHorarios = (linhaId, body) => {
  const $ = cheerio.load(body);
  return $('td')
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
        linhaId: linhaId
      };
    })
    .get();
};

const parseObservacoes = (linhaId, body) => {
  const $ = cheerio.load(body);
  return $('table')
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
        linhaId: linhaId
      };
    })
    .get();
};

const parseSaidaDestino = (body) => {
  const $ = cheerio.load(body);
  const $table = $('td[colspan=3]').find('table').find('tr').eq(1).children('td');
  const saida = $table.find('span').eq(1).text().replace('Saída: ', '');
  const destino = $table.find('hr')
                        .eq(2)
                        .next('span')
                        .text()
                        .replace('Destino: ', '')
                        .replace('Saída: ', '')
                        .trim();

  return {
    saida,
    destino
  };
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

exports = module.exports = {
  parseLinhas,
  parseItinerarios,
  parseHorarios,
  parseObservacoes,
  parseSaidaDestino
};
