import { DocLink, Mail, V, type LegalSection } from './legal-parts';

export const PRIVACY_FR: LegalSection[] = [
  {
    id: 'responsable',
    title: 'Responsable du traitement',
    body: (
      <>
        <p>
          Le responsable du traitement est <V k="companyName" />, <V k="address" /> (RCCM <V k="rccm" />,
          NINEA <V k="ninea" />). Contact données personnelles : <Mail k="dpoEmail" />.
        </p>
        <p>
          Les traitements mis en œuvre par OSIG ont été déclarés à la Commission de Protection des Données
          Personnelles du Sénégal (CDP) conformément à la loi n° 2008-12 du 25 janvier 2008 sur la protection
          des données à caractère personnel — récépissé n° <V k="cdpDeclaration" />.
        </p>
        <p>
          Pour les personnes situées dans l’Union européenne, le Règlement (UE) 2016/679 (RGPD) s’applique
          également. Représentant dans l’UE : <V k="euRepresentative" />.
        </p>
        <p>
          La présente politique existe en français et en anglais ; <strong>la version française prévaut</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'utilisateurs',
    title: 'Données de nos utilisateurs',
    body: (
      <>
        <p>Lorsque vous utilisez OSIG, nous traitons :</p>
        <ul>
          <li><strong>Compte</strong> : adresse e-mail, nom, langue, mot de passe (stocké uniquement sous forme
            de hachage), identifiant Google si vous utilisez « Se connecter avec Google », état de vérification
            de l’e-mail, offre et durée de conservation choisie.</li>
          <li><strong>Sécurité</strong> : secret de double authentification (chiffré), codes de récupération
            (hachés), clés d’API (hachées — nous ne pouvons pas les relire), journaux d’audit des actions
            sensibles (connexions, analyses, partages…) avec adresse IP et navigateur (user agent).</li>
          <li><strong>Contenu de votre usage</strong> : cibles saisies, résultats d’analyses, enquêtes, notes,
            membres avec qui vous partagez, veilles et leurs adresses de webhook, identités suivies dans « Mon
            empreinte », actions recommandées, membres de votre foyer, rapports générés.</li>
          <li><strong>Vérification de messages ou liens</strong> : le texte collé <strong>n’est pas
            conservé</strong> ; nous gardons une empreinte (hachage), un sujet expurgé, le verdict et les
            indicateurs extraits. Cette vérification est aussi accessible sans compte ; l’adresse IP sert alors
            uniquement à limiter le débit.</li>
          <li><strong>Vérification de photos</strong> : les images envoyées sont traitées en mémoire pour lire
            leurs métadonnées (lieu, date, appareil) ou les supprimer, puis effacées ; ni l’image ni ses
            métadonnées ne sont conservées, seule une ligne de journal sans contenu est gardée. OSIG ne pratique
            pas de reconnaissance faciale et n’envoie pas vos photos à des tiers.</li>
          <li><strong>Notifications</strong> : abonnements aux notifications push de votre navigateur
            (point de terminaison, clés, navigateur), e-mails envoyés (résumé hebdomadaire, alertes de veille,
            vérification, réinitialisation, reçus), conservés dans une file d’envoi.</li>
          <li><strong>Paiement</strong> : offre, montants, devise, statut, pays et identifiants de client,
            d’abonnement et de paiement chez Yoon. Les numéros de carte et codes mobile money sont traités par
            les prestataires de paiement, jamais par nous.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'finalites',
    title: 'Finalités et bases légales',
    body: (
      <ul>
        <li><strong>Fournir le Service</strong> (compte, analyses, enquêtes, veilles, facturation) : exécution
          du contrat.</li>
        <li><strong>Sécurité, prévention des abus et de la fraude</strong> (journaux d’audit, limites de débit,
          double authentification) : intérêt légitime et obligations légales.</li>
        <li><strong>Notifications push</strong> : votre consentement, donné dans votre navigateur et retirable à
          tout moment.</li>
        <li><strong>Résumé hebdomadaire par e-mail</strong> : notre intérêt légitime à vous informer de l’état de
          la protection que vous avez demandée ; il est activé par défaut et vous pouvez le désactiver à tout
          moment depuis votre compte (Préférences) ou via le lien en bas de chaque e-mail.</li>
        <li><strong>Comptabilité et obligations fiscales</strong> : obligation légale.</li>
        <li><strong>Collecte de données publiques sur des tiers</strong> lors des analyses : voir la section
          suivante.</li>
      </ul>
    ),
  },
  {
    id: 'tiers-concernes',
    title: 'Personnes concernées par les analyses (OSINT)',
    body: (
      <>
        <p>
          Les analyses lancées par nos utilisateurs peuvent porter sur des personnes qui ne sont pas utilisatrices
          d’OSIG. Nous traitons alors des données publiquement accessibles les concernant (comptes publics,
          enregistrements de domaine, certificats, mentions dans des fuites de données connues, registres
          d’entreprises, listes de sanctions…), sur le fondement de l’intérêt légitime de l’utilisateur et
          d’OSIG à des fins de sécurité, de vérification et de lutte contre la fraude.
        </p>
        <p>Nous encadrons ce traitement :</p>
        <ul>
          <li>uniquement des sources publiques ou des services tiers accessibles légalement ;</li>
          <li>aucun mot de passe ni fragment d’identifiant issu de fuites n’est conservé ;</li>
          <li>pas de reconnaissance faciale ;</li>
          <li>les sites de rencontre et pour adultes sont volontairement exclus des recherches de noms
            d’utilisateur, afin d’éviter de révéler des données sensibles ;</li>
          <li>vérification de l’e-mail obligatoire, quotas et limites de débit, journalisation, règles d’usage
            acceptable et suspension des comptes abusifs ;</li>
          <li>les résultats ne sont visibles que par l’utilisateur et les personnes avec qui il partage
            l’enquête, et sont supprimés selon les durées ci-dessous.</li>
        </ul>
        <p>
          <strong>Vous pensez que des résultats vous concernent ?</strong> Vous pouvez vous opposer à ce
          traitement, demander l’accès ou la suppression en écrivant à <Mail k="dpoEmail" /> (ou
          à <Mail k="abuseEmail" /> en cas d’usage abusif), en précisant l’identifiant concerné (e-mail, nom
          d’utilisateur, domaine…). Nous pourrons vous demander de prouver que cet identifiant vous appartient.
          L’utilisateur qui lance une analyse est lui-même responsable de son usage des résultats
          (voir les <DocLink to="terms">Conditions d’utilisation</DocLink>).
        </p>
      </>
    ),
  },
  {
    id: 'destinataires',
    title: 'Destinataires et sous-traitants',
    body: (
      <>
        <p>Vos données ne sont ni vendues ni louées. Elles sont accessibles :</p>
        <ul>
          <li>à notre personnel habilité, dans la limite de ses besoins ;</li>
          <li>à notre hébergeur : <V k="hostingProvider" /> ;</li>
          <li>à notre prestataire d’e-mail : <V k="emailProvider" /> ;</li>
          <li>à Google (connexion avec Google ; vérification de liens via Google Web Risk : seule l’URL est
            transmise) ;</li>
          <li>à Yoon et aux prestataires de paiement (Wave, Orange Money, Free Money, Stripe pour les cartes) ;</li>
          <li>aux services de notification push de votre navigateur ;</li>
          <li>aux adresses de webhook que vous configurez vous-même (Slack, Discord ou autre) ;</li>
          <li>aux autorités, lorsque la loi l’exige.</li>
        </ul>
        <p>
          Pendant une analyse, la cible saisie (et seulement elle ou ses dérivés) est transmise aux sources
          interrogées : bases de fuites de données, services de réputation d’IP, d’URL et de domaines
          (par ex. VirusTotal, URLScan, Shodan InternetDB), journaux de certificats, géolocalisation d’IP,
          registres d’entreprises et de sanctions (par ex. Wikidata, GLEIF, OpenCorporates), moteurs de
          recherche, plateformes publiques et sites de profils. Ces sources agissent en tant que responsables
          de traitement indépendants selon leurs propres politiques.
        </p>
      </>
    ),
  },
  {
    id: 'transferts',
    title: 'Transferts hors du Sénégal et de l’UE',
    body: (
      <p>
        Certains prestataires et sources sont situés hors du Sénégal et hors de l’Union européenne (notamment aux
        États-Unis). Conformément à la loi n° 2008-12, ces transferts n’ont lieu que vers des pays assurant un
        niveau de protection suffisant ou moyennant les garanties requises et, le cas échéant, l’autorisation de
        la CDP. Pour les utilisateurs de l’UE, ils reposent sur une décision d’adéquation ou sur les clauses
        contractuelles types de la Commission européenne. Vous pouvez obtenir une copie des garanties
        à <Mail k="dpoEmail" />.
      </p>
    ),
  },
  {
    id: 'conservation',
    title: 'Durées de conservation',
    body: (
      <ul>
        <li>Analyses et résultats : selon la durée de conservation choisie dans votre compte, dans la limite
          fixée par OSIG ; une tâche automatique supprime les analyses expirées plusieurs fois par jour.</li>
        <li>E-mails de la file d’envoi : 30 jours.</li>
        <li>Compte et contenus : jusqu’à la suppression du compte.</li>
        <li>Journaux d’audit : durée limitée nécessaire à la sécurité ; après suppression du compte, ils sont
          dissociés de celui-ci.</li>
        <li>Données de paiement : durée imposée par les obligations comptables et fiscales.</li>
      </ul>
    ),
  },
  {
    id: 'droits',
    title: 'Vos droits',
    body: (
      <>
        <p>
          Vous disposez des droits d’information, d’accès, de rectification, d’opposition (pour motif légitime)
          et de suppression prévus par la loi n° 2008-12 et, pour les personnes de l’UE, des droits à
          l’effacement, à la limitation, à la portabilité, à l’opposition et au retrait du consentement prévus
          par le RGPD.
        </p>
        <p>
          Depuis votre compte, vous pouvez corriger vos informations, supprimer vos données en gardant le
          compte, ou supprimer définitivement le compte. Pour toute autre demande (copie de vos données,
          portabilité…), écrivez à <Mail k="dpoEmail" /> ; nous répondons dans un délai d’un mois.
        </p>
        <p>
          Vous pouvez saisir la CDP (Commission de Protection des Données Personnelles, Dakar — cdp.sn) ou,
          dans l’UE, l’autorité de contrôle de votre pays de résidence.
        </p>
      </>
    ),
  },
  {
    id: 'securite',
    title: 'Sécurité',
    body: (
      <p>
        Nous mettons en œuvre des mesures adaptées : chiffrement des connexions, hachage des mots de passe,
        clés d’API et codes de récupération, chiffrement des secrets de double authentification, sessions
        révocables, contrôle des accès partagés, protection contre les requêtes vers des réseaux internes,
        journalisation. Aucun système n’étant infaillible, nous vous informerons, ainsi que la CDP, de toute
        violation de données vous exposant à un risque, dans les conditions prévues par la loi.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies et stockage local',
    body: (
      <p>
        OSIG n’utilise ni publicité, ni outil d’analyse d’audience, ni traceur tiers. Nous utilisons uniquement
        le stockage local de votre navigateur et des cookies strictement nécessaires : jetons de session, langue
        et thème choisis, et un cookie temporaire signé lors de la connexion avec Google. Ils ne nécessitent pas
        de consentement. Vous pouvez les effacer depuis votre navigateur, ce qui vous déconnectera.
      </p>
    ),
  },
  {
    id: 'mineurs',
    title: 'Mineurs',
    body: <p>Le Service n’est pas destiné aux personnes de moins de 18 ans.</p>,
  },
  {
    id: 'modifications',
    title: 'Modifications',
    body: (
      <p>
        Nous pouvons mettre à jour cette politique ; la date de mise à jour figure en haut de page. En cas de
        changement important, nous vous en informerons par e-mail ou dans le Service.
      </p>
    ),
  },
];

export const PRIVACY_EN: LegalSection[] = [
  {
    id: 'responsable',
    title: 'Data controller',
    body: (
      <>
        <p>
          The controller is <V k="companyName" />, <V k="address" /> (RCCM <V k="rccm" />,
          NINEA <V k="ninea" />). Privacy contact: <Mail k="dpoEmail" />.
        </p>
        <p>
          OSIG’s processing has been declared to Senegal’s Personal Data Protection Commission (CDP) under Law
          no. 2008-12 of 25 January 2008 on the protection of personal data — receipt
          no. <V k="cdpDeclaration" />.
        </p>
        <p>
          For people in the European Union, Regulation (EU) 2016/679 (GDPR) also applies. EU
          representative: <V k="euRepresentative" />.
        </p>
        <p>
          This policy exists in French and English; <strong>the French version prevails</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'utilisateurs',
    title: 'Data about our users',
    body: (
      <>
        <p>When you use OSIG, we process:</p>
        <ul>
          <li><strong>Account</strong>: email address, name, language, password (stored only as a hash), Google
            account identifier if you use “Sign in with Google”, email verification status, plan and chosen
            retention period.</li>
          <li><strong>Security</strong>: two-factor secret (encrypted), recovery codes (hashed), API keys (hashed
            — we cannot read them back), audit logs of sensitive actions (sign-ins, scans, sharing…) with IP
            address and browser user agent.</li>
          <li><strong>Your content</strong>: targets you enter, scan results, investigations, notes, people you
            share with, watches and their webhook URLs, identities tracked in “My footprint”, action items,
            household members, generated reports.</li>
          <li><strong>Message and link checks</strong>: the pasted text <strong>is not stored</strong>; we keep
            a fingerprint (hash), a redacted subject, the verdict and the extracted indicators. Checks also work
            without an account; the IP address is then used only for rate limiting.</li>
          <li><strong>Photo checks</strong>: uploaded images are processed in memory to read their metadata
            (location, date, device) or remove it, then discarded; neither the image nor its metadata is kept,
            only a log line without content. OSIG does not perform facial recognition and does not send your
            photos to third parties.</li>
          <li><strong>Notifications</strong>: browser push subscriptions (endpoint, keys, user agent), emails we
            send (weekly digest, watch alerts, verification, password reset, receipts), kept in a send queue.</li>
          <li><strong>Payments</strong>: plan, amounts, currency, status, country and customer, subscription and
            payment identifiers at Yoon. Card numbers and mobile money PINs are handled by the payment providers,
            never by us.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'finalites',
    title: 'Purposes and legal bases',
    body: (
      <ul>
        <li><strong>Providing the Service</strong> (account, scans, investigations, watches, billing): performance
          of the contract.</li>
        <li><strong>Security, abuse and fraud prevention</strong> (audit logs, rate limits, two-factor
          authentication): legitimate interest and legal obligations.</li>
        <li><strong>Push notifications</strong>: your consent, given in your browser and withdrawable at any
          time.</li>
        <li><strong>Weekly email digest</strong>: our legitimate interest in keeping you informed about the
          protection you asked for; it is on by default and you can turn it off at any time in your account
          (Preferences) or through the link at the bottom of every email.</li>
        <li><strong>Accounting and tax</strong>: legal obligation.</li>
        <li><strong>Collecting public data about third parties</strong> during scans: see the next section.</li>
      </ul>
    ),
  },
  {
    id: 'tiers-concernes',
    title: 'People who are the subject of scans (OSINT)',
    body: (
      <>
        <p>
          Scans run by our users may concern people who do not use OSIG. We then process publicly available data
          about them (public accounts, domain records, certificates, mentions in known data breaches, company
          registers, sanctions lists…), on the basis of the legitimate interest of the user and of OSIG in
          security, verification and fraud prevention.
        </p>
        <p>We limit this processing:</p>
        <ul>
          <li>public sources and lawfully accessible third-party services only;</li>
          <li>no passwords or credential fragments from breaches are stored;</li>
          <li>no facial recognition;</li>
          <li>dating and adult sites are deliberately excluded from username searches, to avoid revealing
            sensitive data;</li>
          <li>mandatory email verification, quotas and rate limits, audit logging, acceptable use rules and
            suspension of abusive accounts;</li>
          <li>results are visible only to the user and the people they share the investigation with, and are
            deleted according to the periods below.</li>
        </ul>
        <p>
          <strong>Think some results are about you?</strong> You can object to this processing, or request access
          or deletion, by writing to <Mail k="dpoEmail" /> (or <Mail k="abuseEmail" /> to report misuse), stating
          the identifier concerned (email, username, domain…). We may ask you to prove it belongs to you. The user
          who runs a scan is responsible for how they use the results (see
          the <DocLink to="terms">Terms of Use</DocLink>).
        </p>
      </>
    ),
  },
  {
    id: 'destinataires',
    title: 'Recipients and processors',
    body: (
      <>
        <p>We never sell or rent your data. It is accessible to:</p>
        <ul>
          <li>our authorised staff, on a need-to-know basis;</li>
          <li>our hosting provider: <V k="hostingProvider" />;</li>
          <li>our email provider: <V k="emailProvider" />;</li>
          <li>Google (Sign in with Google; link checking via Google Web Risk: only the URL is sent);</li>
          <li>Yoon and the payment providers (Wave, Orange Money, Free Money, Stripe for cards);</li>
          <li>your browser’s push notification service;</li>
          <li>webhook URLs you configure yourself (Slack, Discord or other);</li>
          <li>authorities, where the law requires.</li>
        </ul>
        <p>
          During a scan, the target you enter (and only it or values derived from it) is sent to the sources
          queried: data breach databases, IP, URL and domain reputation services (e.g. VirusTotal, URLScan,
          Shodan InternetDB), certificate logs, IP geolocation, company and sanctions registers (e.g. Wikidata,
          GLEIF, OpenCorporates), search engines, public platforms and profile sites. These sources act as
          independent controllers under their own policies.
        </p>
      </>
    ),
  },
  {
    id: 'transferts',
    title: 'Transfers outside Senegal and the EU',
    body: (
      <p>
        Some providers and sources are located outside Senegal and the European Union (notably in the United
        States). In line with Law no. 2008-12, such transfers only take place to countries offering adequate
        protection or with the required safeguards and, where applicable, CDP authorisation. For EU users they
        rely on an adequacy decision or the European Commission’s standard contractual clauses. You can obtain a
        copy of the safeguards at <Mail k="dpoEmail" />.
      </p>
    ),
  },
  {
    id: 'conservation',
    title: 'Retention',
    body: (
      <ul>
        <li>Scans and results: according to the retention period chosen in your account, within the limit set by
          OSIG; an automatic job deletes expired scans several times a day.</li>
        <li>Emails in the send queue: 30 days.</li>
        <li>Account and content: until the account is deleted.</li>
        <li>Audit logs: a limited period needed for security; after account deletion they are detached from
          the account.</li>
        <li>Payment records: as long as accounting and tax law requires.</li>
      </ul>
    ),
  },
  {
    id: 'droits',
    title: 'Your rights',
    body: (
      <>
        <p>
          You have the rights to information, access, rectification, objection (on legitimate grounds) and
          deletion under Law no. 2008-12 and, for people in the EU, the rights to erasure, restriction,
          portability, objection and withdrawal of consent under the GDPR.
        </p>
        <p>
          From your account you can correct your details, delete your data while keeping the account, or delete
          the account permanently. For any other request (a copy of your data, portability…), write
          to <Mail k="dpoEmail" />; we reply within one month.
        </p>
        <p>
          You can complain to the CDP (Commission de Protection des Données Personnelles, Dakar — cdp.sn) or, in
          the EU, to the supervisory authority of your country of residence.
        </p>
      </>
    ),
  },
  {
    id: 'securite',
    title: 'Security',
    body: (
      <p>
        We use appropriate measures: encrypted connections, hashed passwords, API keys and recovery codes,
        encrypted two-factor secrets, revocable sessions, access control on sharing, protection against requests
        to internal networks, and audit logging. No system is infallible; we will notify you and the CDP of any
        breach that puts you at risk, as the law requires.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and local storage',
    body: (
      <p>
        OSIG uses no advertising, no audience analytics and no third-party trackers. We only use your browser’s
        local storage and strictly necessary cookies: session tokens, your chosen language and theme, and a
        temporary signed cookie during Google sign-in. These do not require consent. You can clear them from
        your browser, which signs you out.
      </p>
    ),
  },
  {
    id: 'mineurs',
    title: 'Minors',
    body: <p>The Service is not intended for anyone under 18.</p>,
  },
  {
    id: 'modifications',
    title: 'Changes',
    body: (
      <p>
        We may update this policy; the date of the last update is shown at the top of the page. For significant
        changes we will notify you by email or in the Service.
      </p>
    ),
  },
];
