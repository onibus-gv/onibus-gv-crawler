'use strict';

const models = require('../models');
const Linha = models.Linha;
const Horario = models.Horario;
const Itinerario = models.Itinerario;

const ProgressBar = require('progress');
const http = require('http');
const fs = require('fs');
const PDFParser = require('pdf2json/pdfparser');

const functions = require('../functions');
const sequentialPromise = functions.sequentialPromise;
const customRequest = functions.customRequest;

const parser = require('./parser');

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
      if ((!!evtData) && (!!evtData.formImage)) {
        const linhaId = parseInt(pdfParser.pdfFilePath.replace('.pdf', '').replace('./temppdf/', ''), 10);
        const horarios = parser.parseHorarios(linhaId, evtData);

        Horario
          .bulkCreate(horarios)
          .then(pdfParser.destroy.bind(pdfParser))
          .then(resolve)
          .catch(reject);
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

    const linhas = parser.parseLinhas(empresaId, body);
    let itinerarios = parser.parseItinerarios(body);

    return Linha.bulkCreate(linhas)
      .then(() => {
        log(`Inseridas ${linhas.length} linha(s)`);
        return Linha.findAll();
      })
      .then((_linhas) => {
        return itinerarios.map((itinerario) => {
          itinerario.linhaId = getLinhaId(_linhas, itinerario.linhaId);
          return itinerario;
        });
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
