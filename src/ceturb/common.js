'use strict';

const {
  Linha,
  Horario,
  Observacao,
  Itinerario
} = require('../models');
const ProgressBar = require('progress');
const {
  sequentialPromise,
  chunk,
  customRequest
} = require('../functions');

const linhasWs = 'https://sistemas.es.gov.br/webservices/ceturb/onibus/api/ConsultaLinha/';
const horariosWs = 'https://sistemas.es.gov.br/webservices/ceturb/onibus/api/BuscaHorarios/';
const itinerariosWs = 'https://sistemas.es.gov.br/webservices/ceturb/onibus/api/BuscaItinerarios/';
const observacoesWs = 'https://sistemas.es.gov.br/webservices/ceturb/onibus/api/BuscaHorarioObse/';

const getDiaDaSemana = (descricaoHora) => {
  switch(descricaoHora) {
  case 'DIAS ÚTEIS':
    return 1;
  case 'SÁBADO':
    return 2;
  case 'DOMINGOS E FERIADOS':
    return 3;
  case 'ATÍPICOS ENTRE FERIADOS':
    return 4;
  default:
    return 1;
  }
};

const getItinerarios = async (empresaId) => {
  const linhas = await Linha.findAll({
    where: {
      empresaId: empresaId
    }
  });

  console.log(`Preparando para inserir itinerários de ${linhas.length} linha(s)`);

  const bar = new ProgressBar('Inserindo :bar :percent', {
    total: linhas.length,
    width: 40
  });

  return sequentialPromise(linhas, (linha) => {
    return insertItinerarios(linha).then(bar.tick.bind(bar));
  });
};

const insertItinerarios = async (linha) => {
  const response = await customRequest('get', {
    encoding: 'utf-8',
    url: itinerariosWs + linha.linha,
    json: true
  });

  const itinerarios = response.map((itinerario) => {
    return {
      sentido: itinerario.Sentido === 'I' ? 1 : 2,
      rua: itinerario.Desc_Via,
      linhaId: linha.id
    };
  });

  return Itinerario.bulkCreate(itinerarios);
};

const getLinhas = async (empresaId, tipoLinha) => {
  const response = await customRequest('get', {
    encoding: 'utf-8',
    url: linhasWs,
    qs: {
      'Tipo_Linha': tipoLinha
    },
    json: true
  });

  const linhas = response.map((linha) => {
    return {
      'nome': linha.Descricao,
      'linha': linha.Linha,
      empresaId
    };
  });

  await Linha.bulkCreate(linhas);

  console.log(`Inseridas ${linhas.length} linha(s)`);
};

const insertHorarios = async (linha) => {
  const response = await customRequest('get', {
    encoding: 'utf-8',
    url: horariosWs + linha.linha,
    json: true
  });

  let saida = null;
  let destino = null;

  const horarios = response.map((horario) => {
    const [hora, minuto] = horario.Hora_Saida.split(':');

    if (saida === null && horario.Terminal_Seq === 1) {
      saida = horario.Desc_Terminal;
    }

    if (destino === null && horario.Terminal_Seq === 2) {
      destino = horario.Desc_Terminal;
    }

    return {
      hora: parseInt(hora, 10),
      minuto: parseInt(minuto, 10),
      sentido: horario.Terminal_Seq,
      dia: getDiaDaSemana(horario.Descricao_Hora),
      linhaId: linha.id,
      siglaObs: horario.Tipo_Orientacao
    };
  });

  linha.saida = saida;
  linha.destino = destino;
  linha.save();

  return sequentialPromise(chunk(horarios, 100), (horariosChunk) => {
    return Horario.bulkCreate(horariosChunk);
  });
};

const getHorarios = async (empresaId) => {
  const linhas = await Linha.findAll({
    where: {
      empresaId: empresaId
    }
  });

  console.log(`Preparando para inserir horários de ${linhas.length} linha(s)`);

  const bar = new ProgressBar('Inserindo :bar :percent :etas', {
    total: linhas.length,
    width: 40
  });

  return sequentialPromise(linhas, (linha) => {
    return insertHorarios(linha).then(bar.tick.bind(bar));
  });
};

const insertObservacoes = async (linha) => {
  const response = await customRequest('get', {
    encoding: 'utf-8',
    url: observacoesWs + linha.linha,
    json: true
  });

  const observacoes = response.map((observacao) => {
    return {
      obs: observacao.Descricao_Orientacao,
      sigla: observacao.Tipo_Orientacao,
      linhaId: linha.id,
    };
  });

  await Observacao.bulkCreate(observacoes);
};

const getObservacoes = async (empresaId) => {
  const linhas = await Linha.findAll({
    where: {
      empresaId: empresaId
    }
  });

  console.log(`Preparando para inserir observações de ${linhas.length} linha(s)`);

  const bar = new ProgressBar('Inserindo :bar :percent :etas', {
    total: linhas.length,
    width: 40
  });

  return sequentialPromise(linhas, (linha) => {
    return insertObservacoes(linha).then(bar.tick.bind(bar));
  });
};

exports = module.exports = {
  getLinhas,
  getHorarios,
  getItinerarios,
  getObservacoes,
};
