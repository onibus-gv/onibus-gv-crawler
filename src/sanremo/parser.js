const cheerio = require('cheerio');

/**
 * Given this layout:
 * <div class="feature">
 *   <h5>001 - Araças - Praia da Costa</h5>
 *   <p>Via Ibes, Gloria, Vila Velha e Rodoviaria de Itaparica</p>
 *   <a href="assets/horarios/001.pdf">Visualizar</a>
 * </div>
 *
 * Should return:
 *
 * {
 *   [
 *     {
 *       rua: [Array of addresses splitted by ',' or ' e '],
 *       sentido: 1,
 *       linhaId: '001',
 *     },
 *     ....
 *     {
 *       rua: [Reverse array of addresses splitted by ',' or ' e '],
 *       sentido: 2,
 *       linhaId: '001',
 *     }
 *     ....
 *   ]
 * }
 *
 */
const parseItinerarios = (body) => {
  const $ = cheerio.load(body);

  return $('.feature').map((i, el) => {
    const [linha] = $(el).find('h5').text().split(' - ');
    const itinerarios = $(el).find('p').text().replace('Via ', '').trim().split(/,| e /);

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
 * <div class="feature">
 *   <h5>001 - Araças - Praia da Costa</h5>
 *   <p>Via Ibes, Gloria, Vila Velha e Rodoviaria de Itaparica</p>
 *   <a href="assets/horarios/001.pdf">Visualizar</a>
 * </div>
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

  return $('.feature').map((i, el) => {
    const [linha, saida, destino] = $(el).find('h5').text().split(' - ');

    return {
      linha,
      nome: `${saida} x ${destino}`,
      saida,
      destino,
      empresaId
    };
  }).get();
};

const parseHorarios = (linhaId, evtData) => {
  const halfPage = evtData.formImage.Width / 2;
  const firstDayHeight = 26;
  const secondDayHeight = 36;
  const lastDayHeight = 46;

  const horarios = evtData.formImage.Pages.map((pdf) => {
    return pdf.Texts
      .filter((obj) => {
        const txt = decodeURIComponent(obj.R[0].T).trim().split(/:|;/);
        return txt.length == 2 && !isNaN(parseInt(txt[0], 10)) && obj.y < lastDayHeight;
      })
      .map((obj) => {
        const txt = decodeURIComponent(obj.R[0].T).trim().split(/:|;/);
        const hora = parseInt(txt[0], 10);
        const minuto = parseInt(txt[1], 10);
        const x = obj.x;
        const y = obj.y;
        const sentido = x < halfPage ? 1 : 2;
        const dia = y < firstDayHeight ? 1 : (y < secondDayHeight ? 2 : 3);

        return {
          hora,
          minuto,
          sentido,
          dia,
          siglaObs: null,
          linhaId,
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
