import { useEffect, useState } from "react";

import { getResultadosImportacao } from "../api/client";
import { obterUltimaImportacaoId } from "../api/storage";
import type { ResultadoImportacaoLinha } from "../api/types";

export type EstadoResultados =
  | { status: "carregando" }
  | { status: "vazio" }
  | { status: "erro"; mensagem: string }
  | { status: "sucesso"; dados: ResultadoImportacaoLinha[] };

export function useResultadosUltimaImportacao(): EstadoResultados {
  const [estado, setEstado] = useState<EstadoResultados>({ status: "carregando" });

  useEffect(() => {
    const importacaoId = obterUltimaImportacaoId();
    if (!importacaoId) {
      setEstado({ status: "vazio" });
      return;
    }

    getResultadosImportacao(importacaoId)
      .then((dados) => setEstado({ status: "sucesso", dados }))
      .catch((erro: Error) => setEstado({ status: "erro", mensagem: erro.message }));
  }, []);

  return estado;
}
