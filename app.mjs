import {
  sequelize,
  Linha,
  Horario,
  Observacao,
  Itinerario,
  Empresa
} from "./src/models/index.mjs";
import * as ceturb from "./src/ceturb/index.mjs";
import * as sanremo from "./src/sanremo/index.mjs";
import * as vitoria from "./src/vitoria/index.mjs";

const opts = { truncate: true };

const log = args => console.log(args);

sequelize
  .sync()
  .then(() => Empresa.destroy(opts))
  .then(() => Linha.destroy(opts))
  .then(() => Horario.destroy(opts))
  .then(() => Itinerario.destroy(opts))
  .then(() => Observacao.destroy(opts))

  .then(() => {
    log("");
    log("-------------------------");
    log("-------- Transcol -------");
    log("-------------------------");
    log("");
  })
  .then(() => Empresa.build({ nome: "Transcol" }).save())
  .then(empresa => {
    return ceturb
      .getLinhas(empresa.id, "T")
      .then(() => ceturb.getHorarios(empresa.id))
      .then(() => ceturb.getItinerarios(empresa.id))
      .then(() => ceturb.getObservacoes(empresa.id));
  })

  .then(() => {
    log("");
    log("-------------------------");
    log("--- Seletivo Transcol ---");
    log("-------------------------");
    log("");
  })
  .then(() => Empresa.build({ nome: "Seletivo Transcol" }).save())
  .then(empresa => {
    return ceturb
      .getLinhas(empresa.id, "S")
      .then(() => ceturb.getHorarios(empresa.id))
      .then(() => ceturb.getItinerarios(empresa.id))
      .then(() => ceturb.getObservacoes(empresa.id));
  })

  .then(() => {
    log("");
    log("-------------------------");
    log("-------- Sanremo --------");
    log("-------------------------");
    log("");
  })
  .then(() => Empresa.build({ nome: "Sanremo" }).save())
  .then(empresa => {
    return sanremo
      .getLinhas(empresa.id)
      .then(() => sanremo.getHorarios(empresa.id));
  })

  .then(() => {
    log("");
    log("-------------------------");
    log("--- Seletivo Vitória ----");
    log("-------------------------");
    log("");
  })
  .then(() => Empresa.build({ nome: "Seletivo Vitória" }).save())
  .then(empresa => {
    return vitoria
      .getLinhas(empresa.id)
      .then(() => vitoria.getHorarios(empresa.id))
      .then(() => vitoria.getItinerarios(empresa.id));
  })

  .then(() => log("ok"))
  .catch(err => log(err));
