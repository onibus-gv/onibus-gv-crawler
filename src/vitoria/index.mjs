"use strict";

import { Linha, Horario, Itinerario } from "../models/index.mjs";
import ProgressBar from "progress";
import { chunk, customRequest } from "../functions.mjs";
import { parseLinhas, parseHorarios, parseItinerarios } from "./parser.mjs";

const getItinerarios = async empresaId => {
  const linhas = await Linha.findAll({
    where: {
      empresaId: empresaId
    }
  });

  console.log(
    `Preparando para inserir itinerários de ${linhas.length} linha(s)`
  );

  const bar = new ProgressBar("Inserindo :bar :percent", {
    total: linhas.length
  });

  for (const linha of linhas) {
    await insertItinerarios(linha);
    bar.tick();
  }
};

const insertItinerarios = async linha => {
  const body = await customRequest("get", {
    encoding: "utf-8",
    url: "http://sistemas.vitoria.es.gov.br/redeiti/listarItinerario.cfm",
    qs: {
      cdLinha: linha.linha
    }
  });

  const itinerarios = parseItinerarios(linha.id, body);
  return Itinerario.bulkCreate(itinerarios.ida.concat(itinerarios.volta));
};

const getLinhas = async empresaId => {
  const url = "http://sistemas.vitoria.es.gov.br/redeiti/";
  const body = await customRequest("post", {
    url: url,
    encoding: "utf-8"
  });

  const linhas = parseLinhas(empresaId, body);
  await Linha.bulkCreate(linhas);
  console.log(`Inseridas ${linhas.length} linha(s)`);
};

const insertHorarios = async linha => {
  const body = await customRequest("get", {
    encoding: "utf-8",
    url: "http://sistemas.vitoria.es.gov.br/redeiti/listarHorario.cfm",
    qs: {
      cdLinha: linha.linha
    }
  });

  const parsed = parseHorarios(linha.id, body);
  const horarios = parsed.diasUteis
    .concat(parsed.sabado)
    .concat(parsed.domingo);

  const horariosChunk = chunk(horarios, 100);

  for (const horarioChunk of horariosChunk) {
    await Horario.bulkCreate(horarioChunk);
  }
};

const getHorarios = async empresaId => {
  const linhas = await Linha.findAll({
    where: {
      empresaId: empresaId
    }
  });

  console.log(`Preparando para inserir horários de ${linhas.length} linha(s)`);

  const bar = new ProgressBar("Inserindo :bar :percent", {
    total: linhas.length
  });

  for (const linha of linhas) {
    await insertHorarios(linha);
    bar.tick();
  }
};

export { getLinhas, getHorarios, getItinerarios };
