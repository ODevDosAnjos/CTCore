import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./pt-BR.json";

// Fora de produção, chave ausente é erro (CA9); em produção mostra a própria chave.
const strict = !import.meta.env.PROD;

void i18n.use(initReactI18next).init({
  lng: "pt-BR",
  fallbackLng: false,
  resources: { "pt-BR": { translation: ptBR } },
  interpolation: { escapeValue: false },
  returnNull: false,
  parseMissingKeyHandler: (key: string) => {
    if (strict) throw new Error(`Chave de tradução ausente: ${key}`);
    return key;
  },
});

// Nome de unidade que já começa por "Unidade" não repete a palavra nos textos que a escrevem (#733, D3).
i18n.services.formatter?.add("unit", (value) => String(value).replace(/^unidade\s+/i, ""));

export default i18n;
