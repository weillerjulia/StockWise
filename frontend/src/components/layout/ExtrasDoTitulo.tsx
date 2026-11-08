import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type DefinirExtras = (extras: ReactNode) => void;

/**
 * Permite que uma página coloque elementos (ex.: selos) ao lado do título da Topbar,
 * que é renderizada pelo layout, fora da página.
 */
export const DefinirExtrasDoTituloContext = createContext<DefinirExtras>(() => {});

export function useDefinirExtrasDoTitulo(): DefinirExtras {
  return useContext(DefinirExtrasDoTituloContext);
}
