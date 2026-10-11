// French: home
export const fr_home: Record<string, string> = {
  // Header and hero
  'Sign in': 'Se connecter',
  'Create account': 'Créer un compte',
  'See what the public internet already knows.': 'Voyez ce qu’Internet sait déjà.',
  'OSIG checks an email, username, domain or phone number against dozens of public sources at once, then lays out every finding with the place it came from.':
    'OSIG confronte une adresse e-mail, un nom d’utilisateur, un domaine ou un numéro de téléphone à des dizaines de sources publiques à la fois, puis présente chaque résultat avec sa provenance.',
  'Start a free scan': 'Lancer une analyse gratuite',
  'Five scans a day on the free plan. Public sources only, nothing behind a login.':
    'Cinq analyses par jour avec l’offre gratuite. Sources publiques uniquement, rien derrière une connexion.',

  // Coverage
  'What a scan checks': 'Ce que vérifie une analyse',
  'Each target type runs its own set of sources. These are the ones running today.':
    'Chaque type de cible interroge ses propres sources. Voici celles actives aujourd’hui.',
  'Email address': 'Adresse e-mail',
  'Which services the address is registered on, known breach exposure, reputation, and whether the domain is set up to send mail.':
    'Les services où l’adresse est inscrite, son exposition à des fuites de données connues, sa réputation et la configuration d’envoi de mail du domaine.',
  Username: 'Nom d’utilisateur',
  'Verified accounts on developer and social platforms, with the name, location, website and linked accounts each profile shows.':
    'Les comptes vérifiés sur les plateformes de développement et les réseaux sociaux, avec le nom, la localisation, le site web et les comptes liés de chaque profil.',
  Domain: 'Domaine',
  'Ownership, DNS, subdomains, exposed services and CVEs, lookalike phishing domains, mail security and the tech stack.':
    'Propriétaire, DNS, sous-domaines, services exposés et CVE, domaines d’hameçonnage ressemblants, sécurité du mail et pile technique.',
  'IP address': 'Adresse IP',
  'Who runs it, where it is, which ports and software it exposes, known CVEs, and whether it is scanning the internet.':
    'Qui l’exploite, où elle se trouve, quels ports et logiciels elle expose, les CVE connues, et si elle scanne Internet.',
  Organization: 'Organisation',
  'Official website and accounts, headquarters, parent and subsidiaries, executives, and registered legal entities.':
    'Site et comptes officiels, siège, société mère et filiales, dirigeants et entités juridiques enregistrées.',
  'Phone number': 'Numéro de téléphone',
  'Country, carrier, line type and valid formatting, plus public mentions.':
    'Pays, opérateur, type de ligne et format valide, ainsi que les mentions publiques.',
  'MX / provider': 'MX / fournisseur',
  'GitHub commits': 'Commits GitHub',
  'PGP keyservers': 'Serveurs de clés PGP',
  'WhatsMyName (~650 sites)': 'WhatsMyName (~650 sites)',
  'Lookalike domains': 'Domaines ressemblants',
  'Mail security': 'Sécurité du mail',
  'Tech stack': 'Pile technique',
  'Reverse DNS': 'DNS inverse',
  'Reverse IP': 'IP inverse',
  'Search dorks': 'Requêtes de recherche (dorks)',

  // Steps
  'From target to report': 'De la cible au rapport',
  'Pick a target': 'Choisissez une cible',
  'An email address, username, domain or phone number you have a reason to look into.':
    'Une adresse e-mail, un nom d’utilisateur, un domaine ou un numéro de téléphone que vous avez une raison d’examiner.',
  'Choose the depth': 'Choisissez la profondeur',
  'A quick scan covers the core sources in about two minutes. A deep scan adds slower checks.':
    'Une analyse rapide couvre les sources principales en deux minutes environ. Une analyse approfondie ajoute des vérifications plus lentes.',
  'Follow the trace': 'Suivez la trace',
  'Findings arrive per source as they come in, linked back to where they were found.':
    'Les résultats arrivent source par source, chacun relié à sa provenance.',
  'Export the file': 'Exportez le dossier',
  'Download a PDF report with every finding, or the raw JSON for your own tooling.':
    'Téléchargez un rapport PDF avec tous les résultats, ou le JSON brut pour vos propres outils.',

  // Ground rules
  'Ground rules': 'Règles du jeu',
  'OSIG is for people who have a legitimate reason to look: security teams checking their own exposure, researchers, journalists, and anyone auditing their own footprint.':
    'OSIG s’adresse à ceux qui ont une raison légitime de chercher : équipes de sécurité vérifiant leur propre exposition, chercheurs, journalistes, et toute personne qui audite sa propre empreinte.',
  'Public sources only': 'Sources publiques uniquement',
  'Every check reads data anyone could find. Nothing behind a login, no private content.':
    'Chaque vérification lit des données accessibles à tous. Rien derrière une connexion, aucun contenu privé.',
  'Exposure, not intrusion': 'Exposition, pas intrusion',
  'Breach checks show where an address has turned up in known incidents, so you can act on it.':
    'Les vérifications de fuites de données montrent où une adresse est apparue dans des incidents connus, pour que vous puissiez agir.',
  'You confirm your purpose': 'Vous confirmez votre objectif',
  'Each scan asks you to confirm a legitimate reason before it runs.':
    'Chaque analyse vous demande de confirmer un motif légitime avant de démarrer.',

  // Closing and footer
  'Run your first trace': 'Lancez votre première trace',
  'Start with your own email. Most people are surprised.': 'Commencez par votre propre e-mail. La plupart des gens sont surpris.',
  'Create a free account': 'Créer un compte gratuit',
  'OSIG — open source intelligence gathering': 'OSIG — renseignement en sources ouvertes',
  'Public data only': 'Données publiques uniquement',

  // Trace hero
  'Sample target type': 'Type de cible d’exemple',
  Email: 'E-mail',
  Phone: 'Téléphone',
  'Sample trace: {target} checked against {count} public sources': 'Trace d’exemple : {target} confronté à {count} sources publiques',
  'DMARC record': 'Enregistrement DMARC',
  'Disposable check': 'Adresse jetable',
  'DNS records': 'Enregistrements DNS',
  'Carrier lookup': 'Opérateur',
  'Line type': 'Type de ligne',
  'Highlighted sources returned something in this sample. Dashed ones came back empty.':
    'Les sources surlignées ont renvoyé un résultat dans cet exemple. Celles en pointillés sont revenues vides.',
};
