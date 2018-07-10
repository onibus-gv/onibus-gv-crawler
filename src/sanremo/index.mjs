"use strict";

import { Linha, Horario, Itinerario } from "../models/index.mjs";
import ProgressBar from "progress";
import http from "http";
import fs from "fs";
import PDFParser from "pdf2json/pdfparser";
import { parseItinerarios, parseLinhas, parseHorarios } from "./parser.mjs";
import phantom from "phantom";

const getHorarios = async empresaId => {
  const linhas = await Linha.findAll({
    where: {
      empresaId: empresaId
    }
  });

  console.log(`Preparando para inserir horários de ${linhas.length} linha(s)`);

  const bar = new ProgressBar("Inserindo :bar :percent", {
    total: linhas.length,
    width: 40
  });

  for (const linha of linhas) {
    await insertHorarios(linha);
    bar.tick();
  }
};

const download = (url, dest, cb) => {
  const file = fs.createWriteStream(dest);
  http.get(url, response => {
    response.pipe(file);
    file.on("finish", () => {
      file.close(cb);
    });
  });
};

const insertHorarios = async linha => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    const url = `http://www.viacaosanremo.com.br/assets/horarios/${
      linha.linha
    }.pdf`;

    download(url, "./temppdf/" + linha.id + ".pdf", () => {
      pdfParser.loadPDF("./temppdf/" + linha.id + ".pdf");
    });

    pdfParser.on("pdfParser_dataError", () => {
      reject("Erro ao ler pdf: " + pdfParser.pdfFilePath);
    });

    pdfParser.on("pdfParser_dataReady", evtData => {
      if (!!evtData && !!evtData.formImage) {
        const linhaId = parseInt(
          pdfParser.pdfFilePath.replace(".pdf", "").replace("./temppdf/", ""),
          10
        );
        const horarios = parseHorarios(linhaId, evtData);

        Horario.bulkCreate(horarios)
          .then(pdfParser.destroy.bind(pdfParser))
          .then(resolve)
          .catch(reject);
      } else {
        reject("Erro ao ler pdf");
      }
    });
  });
};

const getLinhaId = (linhas, linhaId) => {
  const rtn = linhas.filter(linha => {
    return linha.linha == linhaId;
  });

  if (rtn.length) {
    return rtn[0].id;
  } else {
    return null;
  }
};

const getLinhas = async empresaId => {
  const instance = await phantom.create();
  const page = await instance.createPage();

  await page.open("http://viacaosanremo.com.br/horarios");
  const body = await page.property("content");

  const linhas = parseLinhas(empresaId, body);
  const itinerarios = parseItinerarios(body);

  await Linha.bulkCreate(linhas);
  console.log(`Inseridas ${linhas.length} linha(s)`);
  const dbLinhas = await Linha.findAll();

  const dbItinerarios = itinerarios.map(itinerario => {
    itinerario.linhaId = getLinhaId(dbLinhas, itinerario.linhaId);
    return itinerario;
  });

  const rows = await Itinerario.bulkCreate(dbItinerarios);
  console.log(`Inseridos ${rows.length} itinerário(s)`);
};

const getItinerarios = () => {};

export { getLinhas, getHorarios, getItinerarios };
