import { DocLink, Mail, V, type LegalSection } from './legal-parts';

export const TERMS_FR: LegalSection[] = [
  {
    id: 'editeur',
    title: 'Éditeur du service',
    body: (
      <>
        <p>
          OSIG (le « Service ») est édité par <V k="companyName" />, <V k="legalForm" />, immatriculée au RCCM
          sous le n° <V k="rccm" />, NINEA <V k="ninea" />, dont le siège est situé <V k="address" />,
          représentée par <V k="representative" /> (« OSIG », « nous »).
        </p>
        <p>Contact : <Mail k="contactEmail" />. Hébergement : <V k="hostingProvider" />.</p>
      </>
    ),
  },
  {
    id: 'acceptation',
    title: 'Acceptation des conditions',
    body: (
      <>
        <p>
          Les présentes conditions d’utilisation (les « Conditions ») régissent l’accès et l’utilisation du site,
          de l’application, de l’API et de l’outil en ligne de commande OSIG. En créant un compte, en cochant la
          case prévue à cet effet ou en utilisant le Service, vous acceptez les Conditions et
          la <DocLink to="privacy">Politique de confidentialité</DocLink>. Si vous ne les acceptez pas, n’utilisez
          pas le Service.
        </p>
        <p>
          Si vous utilisez le Service pour le compte d’une organisation, vous déclarez être habilité à l’engager ;
          « vous » désigne alors aussi cette organisation.
        </p>
        <p>
          Les Conditions sont rédigées en français et en anglais. <strong>En cas de divergence, la version
          française prévaut.</strong>
        </p>
      </>
    ),
  },
  {
    id: 'service',
    title: 'Description du Service',
    body: (
      <p>
        OSIG est un outil de renseignement en sources ouvertes (OSINT). À partir d’une cible que vous saisissez
        (adresse e-mail, nom d’utilisateur, nom de domaine, numéro de téléphone, adresse IP publique ou
        organisation), il interroge des sources publiquement accessibles et des services tiers, puis présente les
        résultats, un graphe d’entités, des indicateurs de risque et des rapports. Il propose aussi la
        surveillance périodique (« veilles »), le suivi de votre propre empreinte numérique (« Mon empreinte »),
        la vérification de messages ou liens suspects et le travail collaboratif sur des enquêtes.
      </p>
    ),
  },
  {
    id: 'eligibilite',
    title: 'Conditions d’accès',
    body: (
      <p>
        Le Service est réservé aux personnes âgées d’au moins 18 ans et disposant de la pleine capacité
        juridique, ainsi qu’aux personnes morales agissant par un représentant habilité. Vous devez fournir des
        informations exactes et une adresse e-mail valide, que vous devez vérifier pour lancer des analyses,
        des pivots, des analyses groupées ou partager une enquête.
      </p>
    ),
  },
  {
    id: 'compte',
    title: 'Sécurité du compte',
    body: (
      <>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants, de vos clés d’API et de toute
          activité réalisée depuis votre compte. Nous vous recommandons d’activer la double authentification
          (TOTP) et de conserver vos codes de récupération en lieu sûr.
        </p>
        <p>
          Signalez-nous sans délai tout usage non autorisé à <Mail k="contactEmail" />. Vous pouvez à tout moment
          vous déconnecter de toutes vos sessions depuis votre compte.
        </p>
      </>
    ),
  },
  {
    id: 'usage',
    title: 'Usage acceptable',
    body: (
      <>
        <p>
          Vous vous engagez à n’utiliser OSIG qu’à des fins licites et légitimes (par exemple : sécurité
          informatique, vérification préalable, lutte contre la fraude, journalisme, recherche, protection de
          votre propre identité), dans le respect des lois applicables, notamment en matière de protection des
          données personnelles. Avant chaque analyse visant une personne, vous devez disposer d’un intérêt
          légitime et réel à l’effectuer.
        </p>
        <p>Il est notamment interdit :</p>
        <ul>
          <li>de traquer, harceler, intimider, menacer ou surveiller illégalement une personne ;</li>
          <li>de divulguer les informations personnelles d’autrui pour lui nuire (« doxxing ») ;</li>
          <li>de prendre des décisions discriminatoires, notamment en matière d’emploi, de logement, de crédit
            ou d’assurance, sur la base des résultats ;</li>
          <li>d’analyser une cible sans raison légitime, par simple curiosité ou pour le compte d’un tiers mal
            intentionné ;</li>
          <li>d’attaquer, sonder ou perturber des systèmes informatiques, y compris ceux d’OSIG ;</li>
          <li>de revendre, publier en masse ou constituer des bases de données à partir des résultats ;</li>
          <li>de contourner les quotas, limites de débit, mesures de sécurité ou restrictions d’offre, ou de
            partager un compte pour y parvenir ;</li>
          <li>de déposer des contenus illicites ou d’utiliser le Service pour commettre une fraude.</li>
        </ul>
        <p>
          OSIG peut enquêter sur tout usage suspect, limiter, suspendre ou résilier un compte, et coopérer avec
          les autorités compétentes lorsque la loi l’exige.
        </p>
      </>
    ),
  },
  {
    id: 'resultats',
    title: 'Nature des résultats',
    body: (
      <>
        <p>
          Les résultats proviennent de sources publiques et de services tiers que nous ne contrôlons pas. Ils
          peuvent être incomplets, inexacts, obsolètes ou concerner une autre personne portant le même nom ou
          identifiant. Les correspondances signalées comme « possibles » (par exemple un contrôle de listes de
          sanctions ou de personnes politiquement exposées) ne sont <strong>pas</strong> des constats : elles
          doivent être vérifiées par vos soins avant toute décision.
        </p>
        <p>
          Les scores de risque et indicateurs sont des aides à l’analyse, non des conseils juridiques,
          financiers ou de conformité. Le Service est fourni « en l’état », sans garantie d’exactitude,
          d’exhaustivité ou d’adéquation à un usage particulier.
        </p>
      </>
    ),
  },
  {
    id: 'offres',
    title: 'Offres, prix et paiement',
    body: (
      <>
        <p>
          OSIG propose une offre gratuite et des offres payantes (Pro, Enterprise) dont les prix, durées et
          limites sont affichés sur la page de facturation, en francs CFA (XOF) ou en dollars américains (USD)
          selon votre pays. Les prix peuvent évoluer ; le prix applicable est celui affiché au moment du paiement.
        </p>
        <ul>
          <li><strong>Prépaiement, sans prélèvement automatique.</strong> Chaque période (mensuelle ou annuelle)
            est payée d’avance. Aucun prélèvement n’est effectué sans action de votre part : le renouvellement
            se fait en réglant la facture de la période suivante.</li>
          <li><strong>Moyens de paiement.</strong> Les paiements sont traités par Yoon, passerelle de paiement
            exploitée par OSIG, et ses prestataires (Wave, Orange Money, Free Money, carte bancaire via Stripe).
            Nous ne recevons ni ne conservons vos numéros de carte ou codes de mobile money.</li>
          <li><strong>Activation.</strong> Une offre n’est activée qu’après confirmation du paiement par le
            prestataire.</li>
          <li><strong>Délai de grâce.</strong> À l’échéance non renouvelée, l’offre reste active pendant un court
            délai de grâce (actuellement 2 jours), puis le compte repasse à l’offre gratuite. Vos données sont
            conservées, mais les limites de l’offre gratuite s’appliquent.</li>
          <li><strong>Changement d’offre.</strong> Un renouvellement anticipé s’ajoute à la période en cours ; une
            montée en gamme prend effet immédiatement ; une descente prend effet à la fin de la période
            en cours.</li>
          <li><strong>Résiliation.</strong> Vous résiliez en cessant de renouveler. La période en cours, déjà
            payée, reste active jusqu’à son terme et <strong>n’est pas remboursée</strong>, sauf disposition
            légale impérative contraire ou erreur de facturation de notre part.</li>
          <li><strong>Reçus.</strong> Le reçu émis par Yoon atteste le paiement mais ne constitue pas une facture
            fiscale. Sur demande à <Mail k="contactEmail" />, nous vous adresserons une facture conforme.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'api',
    title: 'Clés d’API et outil en ligne de commande',
    body: (
      <p>
        Les clés d’API personnelles agissent en votre nom et sont soumises aux présentes Conditions et aux
        limites de votre offre. Elles ne sont affichées qu’une fois ; gardez-les secrètes et révoquez
        immédiatement toute clé compromise. Vous êtes responsable de tout usage fait avec vos clés, y compris
        dans vos chaînes d’intégration continue.
      </p>
    ),
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    body: (
      <p>
        Le Service, son code, sa marque, son logo et ses contenus éditoriaux restent la propriété d’OSIG ou de
        ses concédants. Nous vous accordons un droit personnel, non exclusif et non cessible d’utiliser le
        Service pendant la durée de votre compte. Les données issues des sources tierces restent soumises aux
        droits et conditions de ces sources. Vous restez propriétaire des notes et contenus que vous saisissez
        et nous accordez le droit de les traiter pour fournir le Service.
      </p>
    ),
  },
  {
    id: 'tiers',
    title: 'Services tiers',
    body: (
      <p>
        Le Service s’appuie sur des services tiers (sources de données, Google pour la connexion et la
        vérification de liens, prestataires de paiement, d’e-mail et d’hébergement). Leur disponibilité et
        leurs conditions ne dépendent pas de nous, et certaines sources peuvent être indisponibles ou retirées
        à tout moment. Les liens vers des sites tiers sont fournis à titre informatif.
      </p>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Limitation de responsabilité',
    body: (
      <>
        <p>
          Dans les limites permises par la loi, OSIG n’est tenue qu’à une obligation de moyens et ne saurait être
          responsable des dommages indirects (perte de chance, de chiffre d’affaires, de données ou atteinte à
          l’image), ni des décisions que vous prenez sur la base des résultats, ni de l’usage que vous en faites.
          Notre responsabilité totale au titre d’une période est limitée aux sommes que vous nous avez versées au
          cours des douze mois précédant le fait générateur.
        </p>
        <p>
          Ces limites ne s’appliquent pas en cas de faute lourde ou intentionnelle, ni aux droits que la loi
          impérative reconnaît aux consommateurs.
        </p>
        <p>
          Vous garantissez OSIG contre toute réclamation de tiers résultant d’un usage du Service contraire aux
          présentes Conditions ou à la loi.
        </p>
      </>
    ),
  },
  {
    id: 'suspension',
    title: 'Suspension et résiliation',
    body: (
      <p>
        Nous pouvons suspendre ou résilier votre accès, avec effet immédiat en cas de manquement grave
        (notamment aux règles d’usage acceptable), de risque pour la sécurité ou d’obligation légale ; dans les
        autres cas, après vous en avoir informé. Une résiliation pour manquement n’ouvre droit à aucun
        remboursement. Vous pouvez supprimer votre compte à tout moment depuis les paramètres du compte.
      </p>
    ),
  },
  {
    id: 'donnees',
    title: 'Suppression des données',
    body: (
      <p>
        Depuis votre compte, vous pouvez supprimer vos données (analyses, enquêtes, veilles…) tout en conservant
        le compte, ou supprimer définitivement le compte et ses données. Les analyses anciennes sont aussi
        supprimées automatiquement selon la durée de conservation applicable. Le détail figure dans
        la <DocLink to="privacy">Politique de confidentialité</DocLink>.
      </p>
    ),
  },
  {
    id: 'modifications',
    title: 'Modification des Conditions',
    body: (
      <p>
        Nous pouvons modifier les Conditions, notamment pour suivre l’évolution du Service ou de la loi. En cas
        de modification substantielle, nous vous en informerons par e-mail ou dans le Service au moins 30 jours
        avant son entrée en vigueur, sauf urgence légale ou de sécurité. Si vous refusez les nouvelles
        Conditions, vous pouvez supprimer votre compte avant cette date ; à défaut, la poursuite de l’utilisation
        vaut acceptation.
      </p>
    ),
  },
  {
    id: 'droit',
    title: 'Droit applicable et juridiction',
    body: (
      <p>
        Les Conditions sont régies par le droit sénégalais. À défaut de règlement amiable dans un délai de 30
        jours suivant une réclamation écrite à <Mail k="contactEmail" />, tout litige sera soumis aux tribunaux
        compétents de Dakar, sous réserve des règles impératives protégeant les consommateurs dans leur pays de
        résidence.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        <V k="companyName" />, <V k="address" /> — <Mail k="contactEmail" />. Pour les données
        personnelles : <Mail k="dpoEmail" />. Pour signaler un abus : <Mail k="abuseEmail" />.
      </p>
    ),
  },
];

export const TERMS_EN: LegalSection[] = [
  {
    id: 'editeur',
    title: 'Who we are',
    body: (
      <>
        <p>
          OSIG (the “Service”) is operated by <V k="companyName" />, <V k="legalForm" />, registered with the
          RCCM under no. <V k="rccm" />, NINEA <V k="ninea" />, with its registered office at <V k="address" />,
          represented by <V k="representative" /> (“OSIG”, “we”).
        </p>
        <p>Contact: <Mail k="contactEmail" />. Hosting: <V k="hostingProvider" />.</p>
      </>
    ),
  },
  {
    id: 'acceptation',
    title: 'Acceptance',
    body: (
      <>
        <p>
          These terms of use (the “Terms”) govern access to and use of the OSIG website, application, API and
          command-line tool. By creating an account, ticking the corresponding box or using the Service, you
          accept the Terms and the <DocLink to="privacy">Privacy Policy</DocLink>. If you do not accept them, do
          not use the Service.
        </p>
        <p>
          If you use the Service on behalf of an organisation, you confirm you are authorised to bind it; “you”
          then also means that organisation.
        </p>
        <p>
          The Terms are written in French and English. <strong>If the versions differ, the French version
          prevails.</strong>
        </p>
      </>
    ),
  },
  {
    id: 'service',
    title: 'The Service',
    body: (
      <p>
        OSIG is an open source intelligence (OSINT) tool. From a target you enter (email address, username,
        domain name, phone number, public IP address or organisation), it queries publicly available sources
        and third-party services, then presents results, an entity graph, risk indicators and reports. It also
        offers recurring monitoring (“watches”), tracking of your own digital footprint (“My footprint”),
        checking of suspicious messages or links, and collaboration on investigations.
      </p>
    ),
  },
  {
    id: 'eligibilite',
    title: 'Eligibility',
    body: (
      <p>
        The Service is for people aged 18 or over with full legal capacity, and for legal entities acting
        through an authorised representative. You must provide accurate information and a valid email address,
        which you must verify before running scans, pivots or bulk scans, or sharing an investigation.
      </p>
    ),
  },
  {
    id: 'compte',
    title: 'Account security',
    body: (
      <>
        <p>
          You are responsible for keeping your credentials and API keys confidential and for all activity under
          your account. We recommend turning on two-factor authentication (TOTP) and storing your recovery codes
          safely.
        </p>
        <p>
          Tell us promptly about any unauthorised use at <Mail k="contactEmail" />. You can sign out of every
          session at any time from your account.
        </p>
      </>
    ),
  },
  {
    id: 'usage',
    title: 'Acceptable use',
    body: (
      <>
        <p>
          You agree to use OSIG only for lawful and legitimate purposes (for example security, due diligence,
          fraud prevention, journalism, research, or protecting your own identity), in compliance with applicable
          law, including data protection law. Before any scan about a person, you must have a genuine,
          legitimate interest in running it.
        </p>
        <p>In particular, you must not:</p>
        <ul>
          <li>stalk, harass, intimidate, threaten or unlawfully monitor anyone;</li>
          <li>publish someone’s personal information to harm them (“doxxing”);</li>
          <li>make discriminatory decisions, including on employment, housing, credit or insurance, based on
            results;</li>
          <li>scan a target without a legitimate reason, out of mere curiosity, or on behalf of someone with
            harmful intent;</li>
          <li>attack, probe or disrupt computer systems, including OSIG’s;</li>
          <li>resell, bulk-publish or build databases from results;</li>
          <li>circumvent quotas, rate limits, security measures or plan restrictions, or share an account to do
            so;</li>
          <li>submit unlawful content or use the Service to commit fraud.</li>
        </ul>
        <p>
          OSIG may investigate suspected misuse, restrict, suspend or terminate an account, and cooperate with
          the competent authorities where the law requires.
        </p>
      </>
    ),
  },
  {
    id: 'resultats',
    title: 'Nature of results',
    body: (
      <>
        <p>
          Results come from public sources and third-party services we do not control. They may be incomplete,
          inaccurate, out of date, or about another person with the same name or handle. Matches flagged as
          “possible” (for example sanctions or politically exposed person screening) are{' '}
          <strong>not</strong> determinations: you must verify them before making any decision.
        </p>
        <p>
          Risk scores and flags are analytical aids, not legal, financial or compliance advice. The Service is
          provided “as is”, without warranty of accuracy, completeness or fitness for a particular purpose.
        </p>
      </>
    ),
  },
  {
    id: 'offres',
    title: 'Plans, prices and payment',
    body: (
      <>
        <p>
          OSIG offers a free plan and paid plans (Pro, Enterprise). Prices, periods and limits are shown on the
          billing page, in CFA francs (XOF) or US dollars (USD) depending on your country. Prices may change; the
          price that applies is the one shown when you pay.
        </p>
        <ul>
          <li><strong>Prepaid, no automatic debit.</strong> Each period (monthly or yearly) is paid in advance.
            Nothing is charged without your action: you renew by paying the next period’s invoice.</li>
          <li><strong>Payment methods.</strong> Payments are processed by Yoon, a payment gateway operated by
            OSIG, and its providers (Wave, Orange Money, Free Money, card via Stripe). We never receive or store
            your card numbers or mobile money PINs.</li>
          <li><strong>Activation.</strong> A plan is activated only once the provider confirms payment.</li>
          <li><strong>Grace period.</strong> If a period ends without renewal, the plan stays active for a short
            grace period (currently 2 days), then the account returns to the free plan. Your data is kept, but
            free-plan limits apply.</li>
          <li><strong>Changing plans.</strong> Renewing early adds to the current period; upgrades take effect
            immediately; downgrades take effect at the end of the current period.</li>
          <li><strong>Cancellation.</strong> You cancel by not renewing. The current, already paid period stays
            active until it ends and <strong>is not refunded</strong>, unless mandatory law provides otherwise or
            we made a billing error.</li>
          <li><strong>Receipts.</strong> The receipt issued by Yoon proves payment but is not a tax invoice. On
            request to <Mail k="contactEmail" />, we will send a compliant invoice.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'api',
    title: 'API keys and command-line tool',
    body: (
      <p>
        Personal API keys act on your behalf and are subject to these Terms and your plan’s limits. They are
        shown only once; keep them secret and revoke any compromised key immediately. You are responsible for
        all use of your keys, including in your CI pipelines.
      </p>
    ),
  },
  {
    id: 'propriete',
    title: 'Intellectual property',
    body: (
      <p>
        The Service, its code, brand, logo and editorial content remain the property of OSIG or its licensors.
        We grant you a personal, non-exclusive, non-transferable right to use the Service while you have an
        account. Data from third-party sources remains subject to those sources’ rights and terms. You keep
        ownership of the notes and content you enter and grant us the right to process them to provide the
        Service.
      </p>
    ),
  },
  {
    id: 'tiers',
    title: 'Third-party services',
    body: (
      <p>
        The Service relies on third parties (data sources, Google for sign-in and link checking, payment, email
        and hosting providers). Their availability and terms are outside our control, and some sources may
        become unavailable or be removed at any time. Links to third-party sites are provided for information.
      </p>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Limitation of liability',
    body: (
      <>
        <p>
          To the extent permitted by law, OSIG undertakes a best-efforts obligation only and is not liable for
          indirect damage (loss of opportunity, revenue, data or reputation), for decisions you make based on
          results, or for how you use them. Our total liability is limited to the amounts you paid us in the
          twelve months before the event giving rise to the claim.
        </p>
        <p>
          These limits do not apply to gross negligence or wilful misconduct, nor to rights mandatory law grants
          to consumers.
        </p>
        <p>
          You will indemnify OSIG against third-party claims arising from your use of the Service in breach of
          these Terms or the law.
        </p>
      </>
    ),
  },
  {
    id: 'suspension',
    title: 'Suspension and termination',
    body: (
      <p>
        We may suspend or terminate your access immediately for a serious breach (in particular of the
        acceptable use rules), a security risk or a legal obligation, and otherwise after notifying you.
        Termination for breach gives no right to a refund. You can delete your account at any time from your
        account settings.
      </p>
    ),
  },
  {
    id: 'donnees',
    title: 'Deleting your data',
    body: (
      <p>
        From your account you can delete your data (scans, investigations, watches…) while keeping the account,
        or permanently delete the account and its data. Old scans are also deleted automatically according to the
        applicable retention period. Details are in the <DocLink to="privacy">Privacy Policy</DocLink>.
      </p>
    ),
  },
  {
    id: 'modifications',
    title: 'Changes to the Terms',
    body: (
      <p>
        We may change the Terms, in particular to reflect changes to the Service or the law. For material
        changes we will notify you by email or in the Service at least 30 days before they take effect, except
        for urgent legal or security reasons. If you do not accept the new Terms, you may delete your account
        before that date; otherwise, continued use means acceptance.
      </p>
    ),
  },
  {
    id: 'droit',
    title: 'Governing law and courts',
    body: (
      <p>
        The Terms are governed by the law of Senegal. If a dispute is not settled amicably within 30 days of a
        written complaint to <Mail k="contactEmail" />, it will be brought before the competent courts of Dakar,
        subject to mandatory rules protecting consumers in their country of residence.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        <V k="companyName" />, <V k="address" /> — <Mail k="contactEmail" />. Personal data:{' '}
        <Mail k="dpoEmail" />. Report abuse: <Mail k="abuseEmail" />.
      </p>
    ),
  },
];
