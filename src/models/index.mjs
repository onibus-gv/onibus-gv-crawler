import Sequelize from "sequelize";

const sequelize = new Sequelize("sqlite:onibus.db", {
  logging: false,
  operatorsAliases: false,
  define: {
    timestamps: false
  }
});

const Empresa = sequelize.define("Empresas", {
  nome: Sequelize.STRING
});

const Linha = sequelize.define("Linhas", {
  linha: Sequelize.STRING,
  nome: Sequelize.STRING,
  saida: Sequelize.STRING,
  destino: Sequelize.STRING
});

const Horario = sequelize.define("Horarios", {
  hora: Sequelize.INTEGER,
  minuto: Sequelize.INTEGER,
  sentido: Sequelize.INTEGER,
  siglaObs: Sequelize.STRING,
  dia: Sequelize.INTEGER
});

const Itinerario = sequelize.define("Itinerarios", {
  sentido: Sequelize.INTEGER,
  rua: Sequelize.STRING
});

const Observacao = sequelize.define("Observacao", {
  obs: Sequelize.STRING,
  sigla: Sequelize.STRING
});

Observacao.belongsTo(Linha, { foreignKey: "linhaId" });
Horario.belongsTo(Linha, { foreignKey: "linhaId" });
Itinerario.belongsTo(Linha, { foreignKey: "linhaId" });
Linha.belongsTo(Empresa, { foreignKey: "empresaId" });

export { sequelize, Empresa, Linha, Horario, Itinerario, Observacao };
