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

Niet overgenomen, omdat daar een server voor nodig is: community-forum, AI-coach en pushmeldingen.

## Op je iPhone zetten

De app moet via **https** bereikbaar zijn. De makkelijkste manier is GitHub Pages:

1. GitHub → repo **Settings → Pages** → Source: *Deploy from a branch* → kies de branch en `/ (root)`.
2. Open de URL (bijv. `https://<gebruiker>.github.io/rewired/`) in **Safari** op je iPhone.
3. Tik op **Deel** (vierkant met pijl) → **Zet op beginscherm**.
4. Open Rewired vanaf je beginscherm: fullscreen, zonder adresbalk en offline beschikbaar.

Lokaal testen: `python3 -m http.server 8080` en open `http://localhost:8080`.

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
sw.js                 Service worker voor offline gebruik
```

## Opmerkingen

- **Haptiek:** Safari op iOS ondersteunt `navigator.vibrate` niet. De app gebruikt de iOS 18-switch als workaround voor een lichte tik.
- **Geluid:** iOS start audio pas na een tik. Zet je telefoon niet op stil als je de tonen wilt horen. Gebruik een koptelefoon voor binaurale tonen.
- **Lichttherapie:** de kleuren wisselen langzaam (geen stroboscoop), maar bij fotogevoelige epilepsie kun je beter alleen Rood, Blauw of Aurora gebruiken.
- Rewired is een zelfhulp-tool en vervangt geen professionele hulp. Bij een crisis: 113 Zelfmoordpreventie (0800-0113).
