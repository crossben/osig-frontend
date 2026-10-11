// Facts about the operator that only the owner knows. Fill every value marked
// with `placeholder: true`, then set it to false (or remove the flag). While a
// value is still a placeholder it is rendered highlighted in development builds.

export interface LegalValue {
  value: string;
  placeholder?: boolean;
}

export const LEGAL_INFO = {
  /** Registered company name, e.g. "OSIG SARL". */
  companyName: { value: '[RAISON SOCIALE]', placeholder: true },
  /** Legal form and share capital, e.g. "SARL au capital de 1 000 000 FCFA". */
  legalForm: { value: '[FORME JURIDIQUE ET CAPITAL]', placeholder: true },
  /** Registre du Commerce et du Crédit Mobilier number. */
  rccm: { value: '[N° RCCM]', placeholder: true },
  /** Numéro d'Identification National des Entreprises et Associations. */
  ninea: { value: '[N° NINEA]', placeholder: true },
  /** Registered office address (Dakar, Senegal). */
  address: { value: '[ADRESSE DU SIÈGE], Dakar, Sénégal', placeholder: true },
  /** Publication director / legal representative. */
  representative: { value: '[REPRÉSENTANT LÉGAL]', placeholder: true },
  /** General contact email. */
  contactEmail: { value: '[contact@exemple.sn]', placeholder: true },
  /** Data protection contact (DPO or privacy officer) email. */
  dpoEmail: { value: '[dpo@exemple.sn]', placeholder: true },
  /** Abuse / removal requests email (can equal dpoEmail). */
  abuseEmail: { value: '[abuse@exemple.sn]', placeholder: true },
  /** CDP declaration / receipt (récépissé) number and date. */
  cdpDeclaration: { value: '[N° DE RÉCÉPISSÉ CDP]', placeholder: true },
  /** EU representative (GDPR art. 27), if required. */
  euRepresentative: { value: '[REPRÉSENTANT UE (art. 27 RGPD) — le cas échéant]', placeholder: true },
  /** Hosting provider name, address and server location. */
  hostingProvider: { value: '[HÉBERGEUR — nom, adresse, pays des serveurs]', placeholder: true },
  /** Transactional email (SMTP) provider. */
  emailProvider: { value: '[PRESTATAIRE D’E-MAIL (SMTP)]', placeholder: true },
  /** Effective date / last update, ISO format. */
  effectiveDate: { value: '2026-10-11', placeholder: true },
} satisfies Record<string, LegalValue>;

export type LegalKey = keyof typeof LEGAL_INFO;
