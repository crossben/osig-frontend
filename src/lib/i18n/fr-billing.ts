// French: billing (plans, checkout, payments) and its admin screens
export const fr_billing: Record<string, string> = {
  // Navigation and page
  Billing: 'Abonnement',
  'Your plan, what it allows, and your payments.': 'Votre formule, ce qu’elle permet, et vos paiements.',
  'Billing couldn’t be loaded. Reload the page to try again.': 'L’abonnement n’a pas pu être chargé. Rechargez la page pour réessayer.',

  // Return from checkout
  'Waiting for the payment to be confirmed…': 'En attente de la confirmation du paiement…',
  'This usually takes a few seconds. You can leave this page; the plan starts as soon as the payment is confirmed.':
    'Cela prend en général quelques secondes. Vous pouvez quitter cette page : la formule démarre dès que le paiement est confirmé.',
  'We couldn’t find this payment': 'Ce paiement est introuvable',
  'Check your payment history below. If you were charged and nothing shows up, contact us with reference {ref}.':
    'Vérifiez l’historique des paiements ci-dessous. Si vous avez été débité et que rien n’apparaît, contactez-nous avec la référence {ref}.',
  Dismiss: 'Fermer',
  'Payment received. {plan} is active.': 'Paiement reçu. {plan} est active.',
  'Your plan and limits below are up to date.': 'Votre formule et vos limites ci-dessous sont à jour.',
  'The payment didn’t go through': 'Le paiement n’a pas abouti',
  'The payment page expired': 'La page de paiement a expiré',
  'Nothing was charged. Try again, or pick another payment method on the payment page.':
    'Rien n’a été débité. Réessayez, ou choisissez un autre moyen de paiement sur la page de paiement.',
  'Nothing was charged. Start a new payment to try again.': 'Rien n’a été débité. Lancez un nouveau paiement pour réessayer.',
  'Try again': 'Réessayer',
  'This is taking longer than usual. Reload the page in a minute; if the payment went through, your plan will show it.':
    'C’est plus long que d’habitude. Rechargez la page dans une minute : si le paiement est passé, votre formule l’indiquera.',
  Reload: 'Recharger',

  // Current plan
  '{used} of unlimited': '{used} sur illimité',
  'Not included': 'Non inclus',
  '{used} of {limit}': '{used} sur {limit}',
  'Free plan, no end date.': 'Formule gratuite, sans date de fin.',
  'No end date.': 'Sans date de fin.',
  'Ended on {date}.': 'Terminée le {date}.',
  'Ends on {date}.': 'Se termine le {date}.',
  'Current plan': 'Formule actuelle',
  'Granted by an administrator.': 'Accordée par un administrateur.',
  'Your limits stay in place until {date}. Renew before then to keep them.':
    'Vos limites restent en place jusqu’au {date}. Renouvelez avant pour les garder.',
  '{plan} ({days} days) starts when your current plan ends.': '{plan} ({days} jours) démarre à la fin de votre formule actuelle.',
  '{plan} starts when your current plan ends.': '{plan} démarre à la fin de votre formule actuelle.',
  'Scans today': 'Analyses aujourd’hui',
  'The daily scan count resets at midnight UTC.': 'Le compteur quotidien repart à zéro à minuit UTC.',

  // Plans and checkout
  'The payment couldn’t start': 'Le paiement n’a pas pu démarrer',
  'Contact us to set it up': 'Contactez-nous pour la mettre en place',
  'Renew {plan}': 'Renouveler {plan}',
  'Choose {plan}': 'Choisir {plan}',
  Plans: 'Formules',
  'Prices shown for {country}.': 'Prix affichés pour : {country}.',
  'payment by card': 'paiement par carte',
  'Buy {plan}': 'Acheter {plan}',
  'Online payment isn’t available yet. To upgrade now, write to {email}.':
    'Le paiement en ligne n’est pas encore disponible. Pour changer de formule maintenant, écrivez à {email}.',
  'How long': 'Durée',
  '3 months': '3 mois',
  '6 months': '6 mois',
  Yearly: 'Annuel',
  '2 months free': '2 mois offerts',
  '{n} days': '{n} jours',
  'Where you pay from': 'Pays de paiement',
  '{country} (mobile money, FCFA)': '{country} (mobile money, FCFA)',
  'Elsewhere (card, USD)': 'Ailleurs (carte, USD)',
  'Paying again before your plan ends adds the new time to what you have left.':
    'Payer à nouveau avant la fin de votre formule ajoute la nouvelle durée au temps restant.',
  'Paying for a lower plan while a higher one runs queues it to start when the higher one ends.':
    'Payer une formule inférieure pendant qu’une formule supérieure est en cours la met en attente jusqu’à la fin de celle-ci.',
  '{plan} will start when your current plan ends.': '{plan} démarrera à la fin de votre formule actuelle.',
  'Opening the payment page…': 'Ouverture de la page de paiement…',
  'Pay {amount}': 'Payer {amount}',
  'You’ll finish on our payment partner’s page, then come back here.':
    'Vous finaliserez sur la page de notre partenaire de paiement, puis reviendrez ici.',
  'Confirm your email first: open the link we sent you, then come back to pay.':
    'Confirmez d’abord votre e-mail : ouvrez le lien que nous vous avons envoyé, puis revenez payer.',

  // Payment history
  Payments: 'Paiements',
  'No payments yet.': 'Aucun paiement pour l’instant.',
  Paid: 'Payé',
  Waiting: 'En attente',
  Expired: 'Expiré',
  Date: 'Date',
  Period: 'Durée',
  Amount: 'Montant',
  Method: 'Moyen',
  Country: 'Pays',
  Reference: 'Référence',

  // Comparison table
  Unlimited: 'Illimité',
  'Every {n} h': 'Toutes les {n} h',
  'Up to {n} targets': 'Jusqu’à {n} cibles',
  'Until you delete it': 'Jusqu’à suppression',
  'Contact us': 'Nous contacter',
  '{price} a month': '{price} par mois',
  Limit: 'Limite',
  Recommended: 'Recommandée',
  'Your plan': 'Votre formule',
  'Choose a plan': 'Choisir une formule',
  'Scans per day': 'Analyses par jour',
  'Deep scans': 'Analyses approfondies',
  'Watch checks as often as': 'Surveillance au plus souvent',
  'Bulk scans': 'Analyses groupées',
  'PDF and JSON exports': 'Exports PDF et JSON',
  'Share links': 'Liens de partage',
  'History kept': 'Historique conservé',
  Pro: 'Pro',
  Enterprise: 'Entreprise',

  // Landing
  'Start free. Move to Pro when you need deep scans, exports and more watches. Pay by mobile money in FCFA across UEMOA, or by card in dollars.':
    'Commencez gratuitement. Passez à Pro quand il vous faut des analyses approfondies, des exports et plus de surveillances. Payez par mobile money en FCFA dans l’UEMOA, ou par carte en dollars.',
  'See plans': 'Voir les formules',
  'For a team or custom limits, write to': 'Pour une équipe ou des limites sur mesure, écrivez à',

  // New scan
  'Included with Pro.': 'Inclus avec Pro.',

  // Admin
  'Plan granted': 'Formule accordée',
  'Plan not granted': 'Formule non accordée',
  'Grant plan': 'Accorder une formule',
  'Grant a plan to {email}': 'Accorder une formule à {email}',
  Days: 'Jours',
  'Blank for no end date': 'Vide pour aucune date de fin',
  'Enter a whole number of days, or leave it blank.': 'Saisissez un nombre entier de jours, ou laissez vide.',
  'Granting…': 'Attribution…',
  Grant: 'Accorder',
  'Plans couldn’t be loaded. Reload the page to try again.': 'Les formules n’ont pas pu être chargées. Rechargez la page pour réessayer.',
  'Prices are in minor units: FCFA has no decimals (5000 = 5 000 FCFA), dollars are in cents (900 = $9.00).':
    'Les prix sont en unités mineures : le FCFA n’a pas de décimales (5000 = 5 000 FCFA), les dollars sont en cents (900 = 9,00 $).',
  'Plan saved': 'Formule enregistrée',
  'Plan not saved': 'Formule non enregistrée',
  Name: 'Nom',
  'Sold online': 'Vendue en ligne',
  Prices: 'Prix',
  'Fill all four periods of a currency with whole numbers, or leave all four blank.':
    'Remplissez les quatre durées d’une devise avec des nombres entiers, ou laissez-les toutes vides.',
  Limits: 'Limites',
  'Limits must be whole numbers.': 'Les limites doivent être des nombres entiers.',
  'Save {plan}': 'Enregistrer {plan}',
  'Shortest watch interval (hours)': 'Intervalle de surveillance minimal (heures)',
  'Bulk scan targets': 'Cibles par analyse groupée',
  'History kept (days, blank = forever)': 'Historique conservé (jours, vide = toujours)',
  Exports: 'Exports',
  Sharing: 'Partage',
  'You’ll finish on the Yoon payment page, then come back here.': 'Vous terminerez sur la page de paiement Yoon, puis reviendrez ici.',
  'Payments run through': 'Les paiements passent par',
  'an open-source payment gateway for Wave, Orange Money, Free Money and cards. OSIG never sees your card or wallet details.': 'une passerelle de paiement open source pour Wave, Orange Money, Free Money et les cartes. OSIG ne voit jamais vos données de carte ou de portefeuille.',
  // Subscriptions (Yoon 0.3.0)
  '1 month': '1 mois',
  '1 year': '1 an',
  'Change scheduled': 'Changement programmé',
  'Your new plan starts when the current period ends. Nothing to pay now.': 'Votre nouveau forfait commence à la fin de la période en cours. Rien à payer maintenant.',
  '{plan} starts when your current period ends.': '{plan} commence à la fin de votre période en cours.',
  'Your payment is still being confirmed': 'Votre paiement est encore en cours de confirmation',
  'The plan updates by itself as soon as the payment is confirmed. If you didn’t finish paying, choose a plan below to try again.': 'Le forfait se met à jour tout seul dès que le paiement est confirmé. Si vous n’avez pas terminé le paiement, choisissez un forfait ci-dessous pour réessayer.',
  'Renew by {date} to keep it.': 'Renouvelez avant le {date} pour le garder.',
  'Renewal stopped': 'Renouvellement arrêté',
  'Renewal restarted': 'Renouvellement réactivé',
  'That didn’t work': 'Ça n’a pas marché',
  'Renewal is off: your plan ends on {date} and you won’t get a renewal invoice.': 'Renouvellement désactivé : votre forfait se termine le {date} et vous ne recevrez pas de facture de renouvellement.',
  'Keep renewing': 'Continuer à renouveler',
  'Stop renewing? Your plan keeps running until {date}, then you move to Free. Payments aren’t refunded.': 'Arrêter le renouvellement ? Votre forfait continue jusqu’au {date}, puis vous passez au forfait Free. Les paiements ne sont pas remboursés.',
  'Stop renewing': 'Arrêter le renouvellement',
};
