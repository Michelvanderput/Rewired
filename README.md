# Routini

**Routine + Houdini:** ontsnap aan oude patronen en bouw routines die blijven. Een iPhone-webapp (PWA) om compulsief
gedrag te doorbreken, oorspronkelijk geïnspireerd door de app
[Rewired: Defeat Lust Now](https://apps.apple.com/nl/app/rewired-defeat-lust-now/id6753029718) en uitgebreid met
gedragswetenschap voor gewoontevorming (zie [`docs/ontwerp.md`](docs/ontwerp.md)). Gebouwd met vanilla JS en
[GSAP](https://gsap.com), zonder build-stap. Alles staat op je iPhone; een account met end-to-end versleutelde sync is optioneel.

## Features

| Origineel (App Store) | In deze app |
| --- | --- |
| Streak Tracker | Live teller (dagen + uu:mm:ss), voortgangsring naar de volgende mijlpaal, **brein herbedraad %** (90 dagen) |
| Habit Tracker | 5 soorten: **tellen** (water in ml, push-ups…), **timer** (mediteren, lezen, met stopwatch), **limiet** (schermtijd, koffie), **tijdstip** (opstaan/naar bed) en **afvinken**. 30 kant-en-klare gewoontes, snelknoppen, 7-dagen-grafiek, reeksen en koppeling met de Dopamine Reset |
| Light Therapy (NeuroPulse) | 5 modi: Pattern Interrupt, Rood licht, Focus blauw, Bilateraal (EMDR-stijl), Aurora. Optionele binaurale toon, scherm blijft aan |
| Meditative Practices | Urge surfing, Body scan, Rust in je hoofd, Stille timer, met gegenereerd oceaangeluid en geanimeerde orb |
| Daily Dopamine Reset | 8 dagelijkse taken (koude douche, ochtendlicht, beweging, ...) met voortgangsbalk en confetti |
| Emergency Tools | Paniekknop (altijd zichtbaar): STOP → begeleide ademhaling → je redenen & belofte → fysieke acties → "Ik heb het overleefd" |
| Analytics | Kalender-heatmap, drang-grafiek (14 dagen), trigger-analyse, risicomomenten per dagdeel, terugvalgeschiedenis |
| Ademhaling | Box breathing, 4-7-8, fysiologische zucht, coherent ademen, met toon en haptiek |
| Discipline score | Score 0–100 op basis van streak, dagelijkse acties en weerstane drang |
| Leren | **54 lessen** in 8 categorieën (wetenschap, technieken, mindset, lichaam, relaties, omgeving, herstel, motivatie), elk met kernpunt, 'probeer vandaag'-opdracht en quiz. 7 leerpaden, les van de dag, 40 dagelijkse boosts, zoeken, filters en bewaren |
| Beloningen & hersteldag | Beloningen die vrijkomen na X clean dagen (gaan op slot bij terugval) en een hersteldag met 6 stappen na een terugval |
| App-gebruik (iOS Opdrachten) | Automatisering telt hoe vaak je apps opent, geeft direct een melding met je telling en limiet, met realisatie-overzicht en weekgrafiek |
| Internet Blocker | Stapsgewijze handleiding voor de iOS Schermtijd-contentfilter |
| Onboarding | Vragenlijst, triggers, redenen, startmoment, getekende belofte (handtekening) en persoonlijk 90-dagenplan |
| Overig | Dagelijkse check-in (stemming/energie), dagboek met prompts, mijlpaal-vieringen, back-up export/import, voortgang delen |
| Account & cloud-opslag | Gebruikersnaam + wachtwoord, alles **end-to-end versleuteld** (AES-GCM) vóór het de telefoon verlaat, sync tussen apparaten met samenvoegen, herstellen op een nieuwe telefoon |
| Ochtend-recap | Elke ochtend (vanaf 04:00, eerste keer openen) een overzicht van gisteren: score, wat ging goed, wat kan beter, gerichte tips en een focus voor vandaag |
| Als-dan-plan | Per gewoonte: moment van de dag, "na …"-anker, plek en minimale versie. Vandaag-scherm gegroepeerd per moment |
| Minimaal / overslaan | Minimale versie telt als komen opdagen, overslaan met reden; weekdoel (2–7×) en "nooit twee keer missen" |
| Automatisme | Elke 14 dagen 4 vragen (SRBAI); bij ≥ 5,5 studeert een gewoonte af naar "Automatisch". Herinneringen bouwen af: elke dag → om de dag → alleen na een misser → uit |
| Risicomomenten | Drang-log met plek en gevoel; na 10 logs je top-3 tijdvensters, een waarschuwing op Home en een melding 15 min vooraf |
| Ochtend- & avondroutine | Begeleide routine stap voor stap (timer, plan voor morgen, check-in), volledig of kort, aan te passen en uit te breiden. Telt mee voor gewoontes en Dopamine Reset; het avondplan komt 's ochtends terug; herinnering alleen als de routine nog niet gedaan is |
| Porno, gokken, ADHD | Kies waar je aan werkt: eigen triggers, leerpaden (12 lessen), startplan (o.a. gokstop via Cruks, Blocker, dopamine-menu), geldteller bij gokken, hulp & contact per onderwerp. Alleen zichtbaar voor wat je kiest |
| Weekreflectie | Elke zondag 3 vragen, met de feiten van je week en je voornemen van vorige week |
| Pushmeldingen | Ochtend-recap (score + samenvatting), middag (quote), avond check-in en risicomoment, met instelbare tijden en een testknop |

Niet overgenomen, omdat daar een server met accounts voor nodig is: community-forum en AI-coach.

## Op je iPhone zetten

De app moet via **https** bereikbaar zijn. De makkelijkste manier is GitHub Pages:

1. GitHub → repo **Settings → Pages** → Source: *Deploy from a branch* → kies de branch en `/ (root)`.
2. Open de URL (bijv. `https://<gebruiker>.github.io/rewired/`) in **Safari** op je iPhone.
3. Tik op **Deel** (vierkant met pijl) → **Zet op beginscherm**.
4. Open Routini vanaf je beginscherm: fullscreen, zonder adresbalk en offline beschikbaar.

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
Op de server staan alleen: je push-abonnement, tijdzone, tijden, naam, startdatum van je streak (voor "Dag 12 🔥") en een
samenvatting van één regel voor de ochtendmelding (score + één gewoontenaam; geen dagboek, triggers of notities).
Gewoontes, Dopamine Reset en check-in beginnen elke dag om 00:00 opnieuw; een lopende timer wordt om middernacht gesplitst.

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
js/habits.js          Gewoontes: soorten, templates, timers, detail- en beheerschermen
js/recap.js           Ochtend-recap: score, goed/kan beter, tips en focus voor vandaag
js/rewards.js         Beloningen vrijspelen + hersteldag na een terugval
js/apptrack.js        App-gebruik via iOS Opdrachten: tellingen, limieten, realisatie
js/lessons*.js        Lesinhoud (54 lessen), leerpaden en boosts
js/learn.js           Leren-tab: les van de dag, paden, zoeken, lezer met quiz
js/tools.js           Lichttherapie, ademhaling, meditatie, noodmodus
js/app.js             Onboarding, views, sheets, events
sw.js                 Service worker: offline gebruik + pushmeldingen ontvangen
js/push.js            Meldingen aan/uit, tijden, synchroniseren met de server
js/sync.js            Account, end-to-end versleuteling, cloud-sync en samenvoegen
api/                  Vercel Functions: auth, data, track, vapid, subscribe, test, cron (+ _lib.js)
vercel.json           Dagelijkse cron + headers
```

## Opmerkingen

- **Haptiek:** Safari op iOS ondersteunt `navigator.vibrate` niet. De app gebruikt de iOS 18-switch als workaround voor een lichte tik.
- **Geluid:** iOS start audio pas na een tik. Zet je telefoon niet op stil als je de tonen wilt horen. Gebruik een koptelefoon voor binaurale tonen.
- **Lichttherapie:** de kleuren wisselen langzaam (geen stroboscoop), maar bij fotogevoelige epilepsie kun je beter alleen Rood, Blauw of Aurora gebruiken.
- Routini is een zelfhulp-tool en vervangt geen professionele hulp. Bij een crisis: 113 Zelfmoordpreventie (0800-0113).
