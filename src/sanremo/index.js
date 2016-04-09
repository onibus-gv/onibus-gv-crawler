'use strict';

const models = require('../models');
const Linha = models.Linha;
const Horario = models.Horario;
const Itinerario = models.Itinerario;

const ProgressBar = require('progress');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const http = require('http');
const fs = require('fs');
const PDFParser = require('pdf2json/pdfparser');

const functions = require('../functions');
const sequentialPromise = functions.sequentialPromise;
const customRequest = functions.customRequest;

iconv.skipDecodeWarning = true;

const log = (txt) => {
  console.log(txt);
};

const getHorarios = (empresaId) => {
  return Linha.findAll({
    where: {
      empresaId: empresaId
    }
  })
  .then((linhas) => {

    log(`Preparando para inserir horários de ${linhas.length} linha(s)`);

    const bar = new ProgressBar('Inserindo [:bar] :percent', {
      total: linhas.length,
      width: 40
    });

    return sequentialPromise(linhas, (linha) => {
      return insertHorarios(linha).then(bar.tick.bind(bar));
    });
  });
};

const download = (url, dest, cb) => {
  const file = fs.createWriteStream(dest);
  http.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close(cb);
    });
  });
};

const insertHorarios = (linha) => {

  return new Promise((resolve, reject) => {

    const pdfParser = new PDFParser();
    const url = `http:\/\/www.viacaosanremo.com.br/horarios/${linha.linha}.pdf`;

    download(url, './temppdf/' + linha.id + '.pdf', () => {
      pdfParser.loadPDF('./temppdf/' + linha.id + '.pdf');
    });

    pdfParser.on('pdfParser_dataReady', (evtData) => {

      if ((!!evtData) && (!!evtData.data)) {

        const linhaId = parseInt(evtData.pdfFilePath.replace('.pdf', '').replace('./temppdf/', ''), 10);

        evtData.data.Pages.forEach((a) => {

          const horarios = a.Texts
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
                siglaObs: '',
                linhaId
              };
            });

          Horario
            .bulkCreate(horarios)
            .then(pdfParser.destroy.bind(pdfParser))
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject('Erro ao ler pdf');
      }
    });
  });
};

const getLinhaId = (linhas, linhaId) => {
  const rtn = linhas.filter((linha) => {
    return linha.linha == linhaId;
  });

  if (rtn.length) {
    return rtn[0].id;
  } else {
    return null;
  }
};

const getLinhas = (empresaId) => {
  return customRequest('get', {
    url: 'http://www.viacaosanremo.com.br/horarios.html'
  })
  .then(function(body) {
    const $ = cheerio.load(body);

    let linhas = [];
    let itinerarios = [];

    $('#conteudo').children('a').each((i, el) => {

      const split = $(el).text().split('Via');
      const split3 = split[0].split(' - ');
      const linhaId = split3.shift().trim();
      const linha = split3.join('-').trim();

      const split2 = linha.split(/ X | x /);
      const saida = split2[0];
      const destino = typeof split2[1] !== 'undefined' ? split2[1] : '';
      const itinerario = typeof split[1] !== 'undefined' ? split[1].trim().split(/,| e /) : [];

      linhas.push({
        'linha': linhaId,
        'nome': linha,
        'saida': saida,
        'destino': destino,
        'empresaId': empresaId
      });

      itinerarios.push(
        itinerario.map((it) => {
          return {
            'sentido': 1,
            'rua': it.trim(),
            'linhaId': linhaId
          };
        })
      );

      itinerarios.push(
        itinerario.reverse().map((it) => {
          return {
            'sentido': 2,
            'rua': it.trim(),
            'linhaId': linhaId
          };
        })
      );
    });

    return Linha.bulkCreate(linhas)
      .then(() => {
        log(`Inseridas ${linhas.length} linha(s)`);
        return Linha.findAll();
      })
      .then((_linhas) => {
        return itinerarios.map((it) => {
          return it.map((itinerario) => {
            itinerario.linhaId = getLinhaId(_linhas, itinerario.linhaId);
            return itinerario;
          });
        })
        .reduce((memo, arr) => {
          return memo.concat(arr);
        }, []);
      })
      .then(Itinerario.bulkCreate.bind(Itinerario))
      .then((rows) => {
        log(`Inseridos ${rows.length} itinerário(s)`);
      });
  });
};

const getItinerarios = () => {};

exports = module.exports = {
  getLinhas: (empresaId) => getLinhas(empresaId),
  getHorarios: (empresaId) => getHorarios(empresaId),
  getItinerarios
};
