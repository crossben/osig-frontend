// French translations, keyed by the English text used in t('...').
// Missing keys fall back to English.

import { fr_home } from './fr-home';
import { fr_auth } from './fr-auth';
import { fr_account } from './fr-account';
import { fr_scans } from './fr-scans';
import { fr_scandetails } from './fr-scandetails';
import { fr_graph } from './fr-graph';
import { fr_analysis } from './fr-analysis';
import { fr_investigations } from './fr-investigations';
import { fr_watches } from './fr-watches';
import { fr_reports } from './fr-reports';
import { fr_admin } from './fr-admin';
import { fr_common } from './fr-common';
import { fr_billing } from './fr-billing';
import { fr_footprint } from './fr-footprint';
import { fr_check } from './fr-check';

export const fr: Record<string, string> = {
  ...fr_home,
  ...fr_auth,
  ...fr_account,
  ...fr_scans,
  ...fr_scandetails,
  ...fr_graph,
  ...fr_analysis,
  ...fr_investigations,
  ...fr_watches,
  ...fr_reports,
  ...fr_admin,
  ...fr_common,
  ...fr_billing,
  ...fr_footprint,
  ...fr_check,

  // Navigation and chrome
  'New scan': 'Nouvelle analyse',
  'My footprint': 'Mon empreinte',
  'Check a link': 'Vérifier un lien',
  'Scan history': 'Historique',
  Investigations: 'Enquêtes',
  Watches: 'Surveillances',
  Reports: 'Rapports',
  Account: 'Compte',
  Admin: 'Administration',
  'Sign out': 'Se déconnecter',
  'Log out': 'Se déconnecter',
  'Scans left today': 'Analyses restantes aujourd’hui',
  '{remaining} of {limit}': '{remaining} sur {limit}',
  'Toggle theme': 'Changer de thème',
  Language: 'Langue',
};
