const common = require('./common');

const pagHorarios = 'adm510_2.asp';
const pagItinerarios = 'adm500_2.asp';
const linhasDropdown = '#select2 option';

exports = module.exports = {
  getLinhas: (empresaId) => common.getLinhas(empresaId, linhasDropdown),
  getHorarios: (empresaId) => {
    return common.getHorarios(empresaId, pagHorarios);
  },
  getItinerarios: (empresaId) => {
    return common.getItinerarios(empresaId, pagItinerarios);
  }
};
