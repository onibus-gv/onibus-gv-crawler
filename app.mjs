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

(async () => {
  try {
    await sequelize.sync();
    await Empresa.destroy(opts);
    await Linha.destroy(opts);
    await Horario.destroy(opts);
    await Itinerario.destroy(opts);
    await Observacao.destroy(opts);

    console.log(`
      -------------------------
      -------- Transcol -------
      -------------------------
    `);

    const empresaTranscol = await Empresa.build({ nome: "Transcol" }).save();
    await ceturb.getLinhas(empresaTranscol.id, "T");
    await ceturb.getHorarios(empresaTranscol.id);
    await ceturb.getItinerarios(empresaTranscol.id);
    await ceturb.getObservacoes(empresaTranscol.id);

    console.log(`
      -------------------------
      --- Seletivo Transcol ---
      -------------------------
    `);
    const empresaSeletivo = await Empresa.build({
      nome: "Seletivo Transcol"
    }).save();
    await ceturb.getLinhas(empresaSeletivo.id, "S");
    await ceturb.getHorarios(empresaSeletivo.id);
    await ceturb.getItinerarios(empresaSeletivo.id);
    await ceturb.getObservacoes(empresaSeletivo.id);

    console.log(`
      -------------------------
      -------- Sanremo --------
      -------------------------
    `);
    const empresaSanremo = await Empresa.build({ nome: "Sanremo" }).save();
    await sanremo.getLinhas(empresaSanremo.id);
    await sanremo.getHorarios(empresaSanremo.id);

    console.log(`
      -------------------------
      --- Seletivo Vitória ----
      -------------------------
    `);
    const empresaVitoria = await Empresa.build({
      nome: "Seletivo Vitória"
    }).save();
    await vitoria.getLinhas(empresaVitoria.id);
    await vitoria.getHorarios(empresaVitoria.id);
    await vitoria.getItinerarios(empresaVitoria.id);

    console.log("ok");
  } catch (e) {
    console.log(e);
  }
})();
