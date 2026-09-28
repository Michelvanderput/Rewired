# Rewired

Een iPhone-webapp (PWA) om compulsief gedrag te doorbreken en je brein te herprogrammeren. Geïnspireerd door de app
[Rewired: Defeat Lust Now](https://apps.apple.com/nl/app/rewired-defeat-lust-now/id6753029718), gebouwd met vanilla JS en
[GSAP](https://gsap.com) voor de animaties. Geen build-stap, geen account, geen server: al je gegevens blijven in de browser op je iPhone.

## Features

| Origineel (App Store) | In deze app |
| --- | --- |
| Streak Tracker | Live teller (dagen + uu:mm:ss), voortgangsring naar de volgende mijlpaal, **brein herbedraad %** (90 dagen) |
| Habit Tracker | Eigen gewoontes met emoji, dagelijkse check-off, weekgrid en reeksen |
| Light Therapy (NeuroPulse) | 5 modi: Pattern Interrupt, Rood licht, Focus blauw, Bilateraal (EMDR-stijl), Aurora. Optionele binaurale toon, scherm blijft aan |
| Meditative Practices | Urge surfing, Body scan, Rust in je hoofd, Stille timer, met gegenereerd oceaangeluid en geanimeerde orb |
| Daily Dopamine Reset | 8 dagelijkse taken (koude douche, ochtendlicht, beweging, ...) met voortgangsbalk en confetti |
| Emergency Tools | Paniekknop (altijd zichtbaar): STOP → begeleide ademhaling → je redenen & belofte → fysieke acties → "Ik heb het overleefd" |
| Analytics | Kalender-heatmap, drang-grafiek (14 dagen), trigger-analyse, risicomomenten per dagdeel, terugvalgeschiedenis |
| Ademhaling | Box breathing, 4-7-8, fysiologische zucht, coherent ademen, met toon en haptiek |
| Discipline score | Score 0–100 op basis van streak, dagelijkse acties en weerstane drang |
| Lessen | 10 korte lessen over dopamine, neuroplasticiteit, HALT, urge surfing, omgeving, terugval |
| Internet Blocker | Stapsgewijze handleiding voor de iOS Schermtijd-contentfilter |
| Onboarding | Vragenlijst, triggers, redenen, startmoment, getekende belofte (handtekening) en persoonlijk 90-dagenplan |
| Overig | Dagelijkse check-in (stemming/energie), dagboek met prompts, mijlpaal-vieringen, back-up export/import, voortgang delen |
| Account & cloud-opslag | Gebruikersnaam + wachtwoord, alles **end-to-end versleuteld** (AES-GCM) vóór het de telefoon verlaat, sync tussen apparaten met samenvoegen, herstellen op een nieuwe telefoon |
| Pushmeldingen | Ochtend (streak + mijlpalen), middag (quote), avond check-in en risicomoment, met instelbare tijden en een testknop |

Niet overgenomen, omdat daar een server met accounts voor nodig is: community-forum en AI-coach.

## Op je iPhone zetten

De app moet via **https** bereikbaar zijn. De makkelijkste manier is GitHub Pages:

1. GitHub → repo **Settings → Pages** → Source: *Deploy from a branch* → kies de branch en `/ (root)`.
2. Open de URL (bijv. `https://<gebruiker>.github.io/rewired/`) in **Safari** op je iPhone.
3. Tik op **Deel** (vierkant met pijl) → **Zet op beginscherm**.
4. Open Rewired vanaf je beginscherm: fullscreen, zonder adresbalk en offline beschikbaar.

Lokaal testen: `python3 -m http.server 8080` en open `http://localhost:8080`.

## Pushmeldingen instellen (eenmalig)

Meldingen werken op iPhone met **iOS 16.4+**, en alleen als de app op je beginscherm staat.
De server bestaat uit Vercel Functions in `api/` en gebruikt gratis Upstash Redis om je abonnement te bewaren.

1. **Opslag:** maak een gratis database op [console.upstash.com](https://console.upstash.com) (Redis, plan *Free*).
   Via de Vercel Marketplace worden alleen betaalde plannen getoond, dus maak hem direct bij Upstash aan.
2. **Sleutels:** Vercel → **Settings → Environment Variables**, voeg toe:
   - `UPSTASH_REDIS_REST_URL` en `UPSTASH_REDIS_REST_TOKEN`: uit Upstash → je database → REST API
   - `VAPID_PUBLIC_KEY` en `VAPID_PRIVATE_KEY`: maak ze met `npx web-push generate-vapid-keys`
   - `VAPID_SUBJECT`: `mailto:jouw@email.nl`
   - `CRON_SECRET`: een lange willekeurige tekst
3. **Redeploy** (Deployments → ⋯ → Redeploy), zodat de variabelen actief worden.
4. **Klok:** het gratis Vercel-plan draait de ingebouwde cron maar 1× per dag (09:00 zomer / 08:00 winter).
   Voor meldingen op jouw eigen tijden: maak een gratis job op [cron-job.org](https://cron-job.org) die elke 5 minuten
   `https://<jouw-app>.vercel.app/api/cron?key=<CRON_SECRET>` aanroept.
5. Open de app vanaf je beginscherm → **Profiel → Meldingen** → zet aan → **Stuur testmelding**.

Een melding wordt tot 90 minuten na het ingestelde tijdstip nog verstuurd en nooit twee keer per dag.
Op de server staan alleen: je push-abonnement, tijdzone, tijden, naam en startdatum van je streak (voor "Dag 12 🔥").

## Account & versleuteling

- Je wachtwoord verlaat de telefoon nooit. De app leidt er met PBKDF2 (600.000 rondes) twee sleutels van af:
  een **inlogsleutel** (gaat naar de server en wordt daar nog eens met scrypt gehasht) en een **versleutelsleutel**
  (blijft op de telefoon).
- Alle gegevens worden met AES-256-GCM versleuteld voordat ze worden geüpload. Upstash en Vercel zien alleen onleesbare data.
- Wachtwoord vergeten = de cloud-kopie is niet te herstellen. De gegevens op je telefoon blijven wel.
- Wijzigingen op twee apparaten worden samengevoegd (dagboek, drang-logs, terugvallen, check-ins).
- Maximaal 25 accounts (in te stellen met `MAX_USERS`), rate limiting op inloggen en registreren.

## Structuur

```
index.html            App shell, tabbar, paniekknop
css/style.css         Dark glassmorphism design, safe-area insets voor de iPhone-notch
js/data.js            Content: mijlpalen, lessen, quotes, lichtmodi, ademhalingspatronen
js/store.js           State in localStorage + berekeningen (streak, discipline score)
js/audio.js           WebAudio-synth: UI-geluiden, oceaangeluid, binaurale tonen (geen audiobestanden)
js/fx.js              GSAP-helpers: sheets, fullscreen, confetti, count-up, toast, haptiek
js/tools.js           Lichttherapie, ademhaling, meditatie, noodmodus
js/app.js             Onboarding, views, sheets, events
sw.js                 Service worker: offline gebruik + pushmeldingen ontvangen
js/push.js            Meldingen aan/uit, tijden, synchroniseren met de server
js/sync.js            Account, end-to-end versleuteling, cloud-sync en samenvoegen
api/                  Vercel Functions: auth, data, vapid, subscribe, test, cron (+ _lib.js)
vercel.json           Dagelijkse cron + headers
```

## Opmerkingen

- **Haptiek:** Safari op iOS ondersteunt `navigator.vibrate` niet. De app gebruikt de iOS 18-switch als workaround voor een lichte tik.
- **Geluid:** iOS start audio pas na een tik. Zet je telefoon niet op stil als je de tonen wilt horen. Gebruik een koptelefoon voor binaurale tonen.
- **Lichttherapie:** de kleuren wisselen langzaam (geen stroboscoop), maar bij fotogevoelige epilepsie kun je beter alleen Rood, Blauw of Aurora gebruiken.
- Rewired is een zelfhulp-tool en vervangt geen professionele hulp. Bij een crisis: 113 Zelfmoordpreventie (0800-0113).
