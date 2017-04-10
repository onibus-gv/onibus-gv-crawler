var cheerio = require('cheerio');

const parseItinerarios = (linhaId, body) => {
  const $ = cheerio.load(body);

  const $ida = $('.data').eq(0);
  const $volta = $('.data').eq(1);

  const arrIda = $ida.find('td[class!=txtR]')
    .map((i, el) => {
      return {
        sentido: 1,
        linhaId: linhaId,
        rua: $(el).text().trim()
      };
    })
    .get();

  const arrVolta = $volta.find('td[class!=txtR]')
    .map((i, el) => {
      return {
        sentido: 2,
        linhaId: linhaId,
        rua: $(el).text().trim()
      };
    })
    .get();

  return {
    ida: arrIda,
    volta: arrVolta
  };
};

const parseLinhas = (empresaId, body) => {
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

  return linhas;
};

const parseHorarios = (linhaId, body) => {
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
        linhaId: linhaId
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
        linhaId: linhaId
      };
    })
    .get();

  const domingo = $('.data')
    .eq(2)
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
        linhaId: linhaId
      };
    })
    .get();

  return {
    diasUteis,
    sabado,
    domingo
  };
};

exports = module.exports = {
  parseItinerarios,
  parseLinhas,
  parseHorarios
};
