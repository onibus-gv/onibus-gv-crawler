const common = require("./common");

const tipoLinha = "S";

exports = module.exports = {
  getLinhas: empresaId => common.getLinhas(empresaId, tipoLinha),
  getHorarios: empresaId => {
    return common.getHorarios(empresaId);
  },
  getItinerarios: empresaId => {
    return common.getItinerarios(empresaId);
  },
  getObservacoes: empresaId => {
    return common.getObservacoes(empresaId);
  }
};
