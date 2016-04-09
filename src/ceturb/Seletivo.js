const common = require('./common');

const pagHorarios = 'adm510_1.asp';
const pagItinerarios = 'adm500_1.asp';
const linhasDropdown = '#select1 option';

exports = module.exports = {
  getLinhas: (empresaId) => common.getLinhas(empresaId, linhasDropdown),
  getHorarios: (empresaId) => {
    return common.getHorarios(empresaId, pagHorarios);
  },
  getItinerarios: (empresaId) => {
    return common.getItinerarios(empresaId, pagItinerarios);
  }
};
