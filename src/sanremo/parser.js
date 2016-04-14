const cheerio = require('cheerio');

/**
 * Given this layout:
 * <a href="horarios/001.pdf">
 *   001 - Araças x Praia da Costa <BR>
 *   <i>Via Ibes, Gloria, Vila Velha  e Rodoviaria de Itaparica</i>
 * </a>
 *
 * Should return:
 *
 * {
 *   ida: [
 *     {
 *       rua: [Array of <i> elements splitted by ',' or ' e '],
 *       sentido: 1
 *     }
 *   ],
 *   volta: [
 *     {
 *       rua: [Reverse array of <i> elements splitted by ',' or ' e '],
 *       sentido: 2
 *     }
 *   ]
 * }
 *
 */
const parseItinerarios = (body) => {
  const $ = cheerio.load(body);

  return $('#conteudo').children('a').map((i, el) => {
    const split = $(el).text().split('Via');
    const linhaSplit = split[0].split(' - ');
    const linha = linhaSplit.shift().trim();
    const itinerarios = typeof split[1] !== 'undefined' ? split[1].trim().split(/,| e /) : [];

    const ida = itinerarios.map((itinerario) => {
      return {
        sentido: 1,
        linhaId: linha,
        rua: itinerario.trim()
      };
    });

    const volta = itinerarios.reverse().map((itinerario) => {
      return {
        sentido: 2,
        linhaId: linha,
        rua: itinerario.trim()
      };
    });

    return ida.concat(volta);
  }).get();
};

/**
 * Given this layout:
 * <a href="horarios/001.pdf">
 *   001 - Araças x Praia da Costa <BR>
 *   <i>Via Ibes, Gloria, Vila Velha  e Rodoviaria de Itaparica</i>
 * </a>
 *
 * Should return:
 *
 * {
 *   linha: 001,
 *   nome: 'Araças x Praia da Costa',
 *   saida: 'Araças',
 *   destino: 'Praia da Costa'
 * }
 */
const parseLinhas = (empresaId, body) => {
  const $ = cheerio.load(body);

  return $('#conteudo').children('a').map((i, el) => {
    const split = $(el).text().split('Via');
    const linhaSplit = split[0].split(' - ');
    const linha = linhaSplit.shift().trim();
    const nome = linhaSplit.join('-').trim();
    const saidaDestino = nome.split(/ X | x /);
    const saida = saidaDestino[0];
    const destino = typeof saidaDestino[1] !== 'undefined' ? saidaDestino[1] : '';

    return {
      linha,
      nome,
      saida,
      destino,
      empresaId
    };
  }).get();
};

const parseHorarios = (linhaId, evtData) => {
  const horarios = evtData.data.Pages.map((pdf) => {
    return pdf.Texts
      .filter((obj) => {
        const txt = decodeURIComponent(obj.R[0].T).trim().split(/:|;/);
        return txt.length == 2 && !isNaN(parseInt(txt[0], 10)) && obj.y < 35;
      })
      .map((obj) => {
        const txt = decodeURIComponent(obj.R[0].T).trim().split(/:|;/);
        const hora = parseInt(txt[0], 10);
        const minuto = parseInt(txt[1], 10);
        const x = obj.x;
        const y = obj.y;
        const halfPage = 50.50;
        const sentido = x < halfPage ? 1 : 2;
        const dia = y < 17 ? 1 : (y < 27 ? 2 : 3);

        return {
          hora,
          minuto,
          sentido,
          dia,
          siglaObs: null,
          linhaId
        };
      });
  });

  return [].concat.apply([], horarios);
};

exports = module.exports = {
  parseItinerarios,
  parseLinhas,
  parseHorarios
};
