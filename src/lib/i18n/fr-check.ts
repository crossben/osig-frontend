// "Is this a scam?" checker (features/check) and its home entry point
export const fr_check: Record<string, string> = {
  // Home entry point
  'Check a suspicious link or message': 'Vérifier un lien ou un message suspect',
  'Paste a link, number, email or message': 'Collez un lien, un numéro, un e-mail ou un message',
  'Check it': 'Vérifier',

  // Form
  'Is this a scam?': 'Est-ce une arnaque ?',
  'Got a strange SMS, WhatsApp message, link, call or email? Paste it here and we’ll tell you what looks wrong.':
    'Vous avez reçu un SMS, un message WhatsApp, un lien, un appel ou un e-mail bizarre ? Collez-le ici et nous vous dirons ce qui cloche.',
  'Paste the link, number, email or the whole message you received': 'Collez le lien, le numéro, l’e-mail ou tout le message reçu',
  'For example: Your Wave account is blocked, send the code you received to…': 'Par exemple : Votre compte Wave est bloqué, envoyez le code reçu au…',
  'Try an example': 'Essayer un exemple',
  'Try an example:': 'Essayer un exemple :',
  'A Wave SMS': 'Un SMS « Wave »',
  'A lookalike link': 'Un lien imité',
  'A “support” Gmail': 'Un Gmail « support »',
  'A premium number': 'Un numéro surtaxé',
  'Your country': 'Votre pays',
  'Checking…': 'Vérification…',
  'We don’t keep what you paste. Only a short, hidden summary is saved so you can share the answer.':
    'Nous ne gardons pas ce que vous collez. Seul un court résumé masqué est enregistré pour que vous puissiez partager la réponse.',

  // Loading steps
  'Reading what you pasted': 'Lecture de ce que vous avez collé',
  'Looking for fake company names': 'Recherche de faux noms d’entreprises',
  'Checking how old the website is': 'Vérification de l’âge du site',
  'Asking security databases': 'Consultation des bases de sécurité',
  'Checking the phone number and email': 'Vérification du numéro et de l’e-mail',
  'Putting the answer together': 'Préparation de la réponse',

  // Verdicts
  'This looks like a scam': 'Ça ressemble à une arnaque',
  'We found strong warning signs. Do not reply, click or pay.': 'Nous avons trouvé des signes d’alerte forts. Ne répondez pas, ne cliquez pas, ne payez pas.',
  'Be careful': 'Soyez prudent',
  'Some things here are often seen in scams. Check with the company through its official app or number before doing anything.':
    'Certains éléments se retrouvent souvent dans les arnaques. Vérifiez auprès de l’entreprise via son application ou son numéro officiel avant de faire quoi que ce soit.',
  'No warning signs found': 'Aucun signe d’alerte trouvé',
  'This doesn’t prove it’s safe. New scams appear every day, so stay careful.':
    'Cela ne prouve pas que c’est sûr. De nouvelles arnaques apparaissent chaque jour, restez prudent.',
  'We couldn’t check this': 'Nous n’avons pas pu vérifier ceci',
  'We couldn’t recognise a link, number, email or message we know how to check. Treat it with care.':
    'Nous n’avons pas reconnu de lien, numéro, e-mail ou message que nous savons vérifier. Restez prudent.',
  'Risk level': 'Niveau de risque',
  '{n} out of 100': '{n} sur 100',
  'Low': 'Faible',
  'High': 'Élevé',
  'Checked': 'Vérifié le',
  'Link': 'Lien',
  'Website': 'Site web',
  'Message': 'Message',
  'What we noticed': 'Ce que nous avons remarqué',
  'Very serious': 'Très grave',
  'Serious': 'Grave',
  'Worth noting': 'À noter',
  'Minor': 'Mineur',
  'For information': 'Pour information',

  // Advice
  'What to do now': 'Que faire maintenant',
  'Don’t click the link and don’t reply.': 'Ne cliquez pas sur le lien et ne répondez pas.',
  'Never give your Wave or Orange Money PIN, or a code you received by SMS (OTP). No real agent will ask for it.':
    'Ne donnez jamais votre code secret Wave ou Orange Money, ni un code reçu par SMS (OTP). Aucun vrai agent ne vous le demandera.',
  'Don’t send money or pay any “fee” to unlock a prize, a loan or your account.':
    'N’envoyez pas d’argent et ne payez aucun « frais » pour débloquer un gain, un prêt ou votre compte.',
  'If you’re worried about your account, call the official number shown in the app, not the one in the message.':
    'Si vous êtes inquiet pour votre compte, appelez le numéro officiel affiché dans l’application, pas celui du message.',
  'Block the sender and report the message to your operator.': 'Bloquez l’expéditeur et signalez le message à votre opérateur.',
  'Don’t click and don’t pay until you’ve checked.': 'Ne cliquez pas et ne payez pas avant d’avoir vérifié.',
  'Never share a PIN or a code you received by SMS (OTP), even with someone who says they work for Wave or Orange Money.':
    'Ne partagez jamais un code secret ou un code reçu par SMS (OTP), même avec quelqu’un qui dit travailler pour Wave ou Orange Money.',
  'Contact the company yourself through its official app, website or number.':
    'Contactez vous-même l’entreprise via son application, son site ou son numéro officiel.',
  'If it turns out to be fake, block the sender and report it.': 'Si c’est faux, bloquez l’expéditeur et signalez-le.',
  'Still never share your PIN or a code you received by SMS (OTP), whoever asks.':
    'Ne partagez jamais votre code secret ou un code reçu par SMS (OTP), quelle que soit la personne qui le demande.',
  'If someone pressures you to act fast, stop and check with the company directly.':
    'Si quelqu’un vous presse d’agir vite, arrêtez-vous et vérifiez directement auprès de l’entreprise.',
  'Don’t click links or call numbers you weren’t expecting.': 'Ne cliquez pas sur des liens et n’appelez pas des numéros inattendus.',
  'Never share your PIN or a code you received by SMS (OTP).': 'Ne partagez jamais votre code secret ou un code reçu par SMS (OTP).',
  'Try pasting just the link, the phone number or the email address.': 'Essayez de coller seulement le lien, le numéro ou l’adresse e-mail.',

  // Share
  'Share the answer, not the message': 'Partagez la réponse, pas le message',
  'Warn others on WhatsApp': 'Prévenir sur WhatsApp',
  'I checked a message on OSIG: “{v}”. See why:': 'J’ai vérifié un message sur OSIG : « {v} ». Voir pourquoi :',

  // Errors, nudges, history
  'You’ve reached the limit of checks for now': 'Vous avez atteint la limite de vérifications pour le moment',
  'Please wait a little and try again.': 'Patientez un peu et réessayez.',
  'Signed-out visitors can do 10 checks an hour. Sign in or create a free account to do more.':
    'Sans compte, vous pouvez faire 10 vérifications par heure. Connectez-vous ou créez un compte gratuit pour en faire plus.',
  'The check didn’t go through': 'La vérification n’a pas abouti',
  'Check your connection and try again.': 'Vérifiez votre connexion et réessayez.',
  'Keep an eye on your own number and email': 'Surveillez votre propre numéro et votre e-mail',
  'Create a free account to see where your email and phone number appear online, and get more checks per hour.':
    'Créez un compte gratuit pour voir où votre e-mail et votre numéro apparaissent en ligne, et faire plus de vérifications par heure.',
  'Create a free account': 'Créer un compte gratuit',
  'Your recent checks': 'Vos dernières vérifications',
  'Back to OSIG': 'Retour à OSIG',

  // Share page
  'Someone checked this with OSIG and shared the answer.': 'Quelqu’un a vérifié ceci avec OSIG et a partagé la réponse.',
  'This check can’t be found': 'Cette vérification est introuvable',
  'The link may be wrong or the check may have expired.': 'Le lien est peut-être erroné ou la vérification a expiré.',
  'Got a strange message too?': 'Vous aussi, vous avez reçu un message bizarre ?',
  'Paste it in and get an answer in a few seconds. It’s free.': 'Collez-le et obtenez une réponse en quelques secondes. C’est gratuit.',
  'Check something yourself': 'Vérifier vous-même',

  // Reasons
  'The address {e} puts a well-known name at the start but belongs to someone else: a classic trick to impersonate a company.':
    'L’adresse {e} commence par un nom connu mais appartient à quelqu’un d’autre : une ruse classique pour se faire passer pour une entreprise.',
  'The address {e} uses a company’s name but is not its official site.': 'L’adresse {e} utilise le nom d’une entreprise mais n’est pas son site officiel.',
  'The address {e} is a misspelling of a real company’s address.': 'L’adresse {e} est une faute de frappe volontaire de l’adresse d’une vraie entreprise.',
  'The address {e} swaps look-alike characters to imitate a real company.': 'L’adresse {e} remplace des lettres par des caractères ressemblants pour imiter une vraie entreprise.',
  'The address {e} claims to be a company but is a free mailbox. Real companies use their own domain.':
    'L’adresse {e} se fait passer pour une entreprise mais c’est une boîte mail gratuite. Les vraies entreprises utilisent leur propre domaine.',
  'The message presents itself as coming from {e}.': 'Le message se présente comme venant de {e}.',
  'It claims to be {e} and asks for a code or money. {e} never asks for that by message.':
    'Il prétend venir de {e} et demande un code ou de l’argent. {e} ne demande jamais cela par message.',
  'The link actually leads to {e}.': 'Le lien mène en réalité à {e}.',
  'The address puts a well-known name at the start but belongs to someone else: a classic trick to impersonate a company.':
    'L’adresse commence par un nom connu mais appartient à quelqu’un d’autre : une ruse classique pour se faire passer pour une entreprise.',
  'The address uses a company’s name but is not its official site.': 'L’adresse utilise le nom d’une entreprise mais n’est pas son site officiel.',
  'The address is a misspelling of a real company’s address.': 'L’adresse est une faute de frappe volontaire de l’adresse d’une vraie entreprise.',
  'The address swaps look-alike characters to imitate a real company.': 'L’adresse remplace des lettres par des caractères ressemblants pour imiter une vraie entreprise.',
  'The address uses international characters that can imitate other letters.': 'L’adresse utilise des caractères internationaux qui peuvent imiter d’autres lettres.',
  'The address ends in a cheap extension often used for scam sites.': 'L’adresse se termine par une extension bon marché souvent utilisée par les sites d’arnaque.',
  'The address is unusually long or has many hyphens.': 'L’adresse est anormalement longue ou contient beaucoup de tirets.',
  'The link does not use a secure (https) connection.': 'Le lien n’utilise pas de connexion sécurisée (https).',
  'The link is shortened, which hides where it really goes.': 'Le lien est raccourci, ce qui cache sa vraie destination.',
  'The link hides its real destination after an @ sign.': 'Le lien cache sa vraie destination après un signe @.',
  'The link points to a bare number (IP address) instead of a named website.': 'Le lien pointe vers un simple numéro (adresse IP) au lieu d’un site avec un nom.',
  'This website does not exist: it was taken down or never existed.': 'Ce site n’existe pas : il a été supprimé ou n’a jamais existé.',
  'The link points to a private network address, so we did not open it.': 'Le lien pointe vers une adresse de réseau privé, nous ne l’avons donc pas ouvert.',
  'Security companies flag this site as dangerous.': 'Des entreprises de sécurité signalent ce site comme dangereux.',
  'Security companies flag this site as suspicious.': 'Des entreprises de sécurité signalent ce site comme suspect.',
  'This site has been seen serving dangerous pages.': 'Ce site a déjà été vu en train de diffuser des pages dangereuses.',
  'The link sends you on to another website.': 'Le lien vous envoie vers un autre site.',
  'The address claims to be a company but is a free mailbox. Real companies use their own domain.':
    'L’adresse se fait passer pour une entreprise mais c’est une boîte mail gratuite. Les vraies entreprises utilisent leur propre domaine.',
  'The address uses a throwaway email service.': 'L’adresse utilise un service d’e-mail jetable.',
  'This address cannot receive email.': 'Cette adresse ne peut pas recevoir d’e-mails.',
  'Anyone could send email pretending to be this domain (no anti-spoofing records).':
    'N’importe qui pourrait envoyer des e-mails en se faisant passer pour ce domaine (pas de protection anti-usurpation).',
  'This phone number cannot exist.': 'Ce numéro de téléphone ne peut pas exister.',
  'Calling this number costs a lot of money (premium rate).': 'Appeler ce numéro coûte très cher (numéro surtaxé).',
  'This is an internet number, easy to get without giving your identity.': 'C’est un numéro internet, facile à obtenir sans donner son identité.',
  'This is a special-rate or forwarding number.': 'C’est un numéro à tarif spécial ou de renvoi.',
  'The message asks you for a code, PIN or password.': 'Le message vous demande un code, un code secret ou un mot de passe.',
  'The message asks you to pay a fee or send money first.': 'Le message vous demande de payer des frais ou d’envoyer de l’argent d’abord.',
  'The message says you won a prize or a gift.': 'Le message dit que vous avez gagné un prix ou un cadeau.',
  'The message pushes you to act fast or threatens you.': 'Le message vous presse d’agir vite ou vous menace.',
  'The offer sounds too good to be true.': 'L’offre est trop belle pour être vraie.',
  'The message asks you to click a link.': 'Le message vous demande de cliquer sur un lien.',
  'The message asks you to call or write to a number.': 'Le message vous demande d’appeler ou d’écrire à un numéro.',
  'The message presents itself as coming from a known company.': 'Le message se présente comme venant d’une entreprise connue.',
  'It claims to be a known company and asks for a code or money. Real companies never ask for that by message.':
    'Il prétend venir d’une entreprise connue et demande un code ou de l’argent. Les vraies entreprises ne demandent jamais cela par message.',
  'The website was created only {n} days ago.': 'Le site a été créé il y a seulement {n} jours.',
  'The website was created very recently.': 'Le site a été créé très récemment.',
  'The website is less than 6 months old ({n} days).': 'Le site a moins de 6 mois ({n} jours).',
  'The website is less than 6 months old.': 'Le site a moins de 6 mois.',
  'The site’s security certificate is only {n} days old.': 'Le certificat de sécurité du site n’a que {n} jours.',
  'The site’s security certificate is very new.': 'Le certificat de sécurité du site est très récent.',
  'This number is registered in another country ({c}).': 'Ce numéro est enregistré dans un autre pays ({c}).',
  'This number is registered in another country.': 'Ce numéro est enregistré dans un autre pays.',
  'The message mentions a local company but the number is from abroad ({c}).': 'Le message cite une entreprise locale mais le numéro vient de l’étranger ({c}).',
  'The message mentions a local company but the number is from abroad.': 'Le message cite une entreprise locale mais le numéro vient de l’étranger.',
};
