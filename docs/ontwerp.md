# Ontwerp: waarom Routini werkt zoals het werkt

Routini (Routine + Houdini: ontsnappen aan oude patronen) helpt om een compulsief patroon af te bouwen en nieuwe gewoontes op te bouwen. Dit document legt vast
welke gedragswetenschap achter de functies zit, zodat nieuwe functies dezelfde lijn volgen.

## Uitgangspunten

1. **Gewoontes ontstaan door herhaling in een vaste context**, niet door motivatie. De app helpt dus vooral om
   gedrag te koppelen aan een moment en een plek, en om het klein genoeg te maken voor slechte dagen.
2. **Eén misser maakt niets kapot.** Onderzoek naar gewoontevorming (Lally e.a., 2010) laat zien dat een enkele
   gemiste dag het automatisme nauwelijks schaadt. Twee keer op rij missen is het echte risico.
3. **Zelfkennis voor beloning.** Inzicht in je eigen patronen (wanneer, waar, welk gevoel) werkt beter dan punten.
4. **Zuinig met beloningen.** Verwachte, tastbare beloningen voor gedrag dat je al uit jezelf wilt, kunnen de
   intrinsieke motivatie verdringen (overjustification-effect). Feedback is daarom informatief, niet een prijs.
5. **Mild en neutraal.** Een terugval is data, geen mislukking. Schaamte voedt de cyclus.
6. **Privacy eerst.** Alles staat op de telefoon; sync is end-to-end versleuteld; geen trackers.

## Functies en hun onderbouwing

| Functie | Waar in de code | Principe |
| --- | --- | --- |
| **Als-dan-plan** per gewoonte: moment, "na …" (anker), plek, minimale versie | `js/habits.js` (`plan`, editor) | Implementatie-intenties (Gollwitzer): "als X, dan Y" verdubbelt ongeveer de kans dat je het doet. Habit stacking: koppel aan iets wat je al doet. |
| **Minimale versie / overslaan met reden** | `habitStatus[dag][id]` | Tiny habits (Fogg): op een slechte dag telt de kleine versie. De reden van overslaan maakt patronen zichtbaar. |
| **Weekdoel + nooit twee keer missen** | `weekly`, `streak()`, `atRisk()` | Flexibele doelen houden langer vol dan alles-of-niets-streaks. De "lijn" breekt pas na twee missers op rij. |
| **Vandaag per moment** (ochtend, middag, na werk, avond, hele dag) | `listHtml()` | Context is de trigger: je ziet wat er nú aan de beurt is. |
| **Automatisme-check (SRBAI)** elke 14 dagen, afstuderen bij ≥ 5,5 | `autoSheet()`, `srbai[]`, `graduated` | Self-Report Behavioural Automaticity Index (Gardner e.a., 2012): 4 stellingen, schaal 1–7. Automatisch = de gewoonte heeft geen ondersteuning meer nodig. |
| **Herinneringen die afbouwen** | `reminderLevel()`, `nudges()`, push-ids `n0..n3` | Herinneringen helpen in het begin maar kunnen een kruk worden die het automatisme blokkeert. Elke dag → om de dag (score ≥ 3,5) → alleen na een misser (≥ 5,5) → uit (afgestudeerd). |
| **Maximaal 3 actieve gewoontes** (waarschuwing) | `tooManyHtml()` | Beperkte zelfregulatiecapaciteit: 1–3 nieuwe gewoontes tegelijk lukt beter. Afgestudeerde gewoontes tellen niet mee. |
| **Drang-log met plek en gevoel; top-3 risicomomenten** | `js/risk.js` | Functionele analyse: na 10 logs zijn tijd, plek en emotie samen voorspellend. Just-in-time: 15 min vooraf een melding en een kaart op Home met een tip die past bij het gevoel of de plek. |
| **Weekreflectie** op zondag | `js/reflect.js` | Zelfmonitoring + reflectie + bijsturen. Het voornemen van vorige week komt terug, zo sluit de cirkel. |
| **Ochtend-recap** | `js/recap.js` | Dagelijkse feedback met één concrete focus. Minimale versie telt als goed, een geplande rustdag als neutraal. |
| **Terugval → hersteldag** | `js/rewards.js` | Lapse ≠ relapse (Marlatt): direct een concreet herstelplan in plaats van "opnieuw beginnen". |

## Taal en feedback

- Toon: vriendelijk, concreet, zonder oordeel. Liever "Gisteren gemist · minimaal 5 push-ups" dan "Je hebt gefaald".
- Gewoontes afronden geeft een geluid, haptiek en een informatieve melding ("Push-ups: 50 reps · gedaan"), **geen confetti**.
  Ook check-ins, drang loggen en lessen geven geen confetti.
- Confetti en vieringen blijven voor echte mijlpalen: streak-mijlpalen, de onboarding en een volledige Dopamine Reset.
- De "lijn" (🔗) vervangt de 🔥-streak bij gewoontes, omdat hij één misser vergeeft.
- Beloningen (`js/rewards.js`) kiest de gebruiker zelf en zijn bedoeld als iets waar je naartoe leeft, niet als betaling
  per handeling. Nieuwe puntensystemen, badges of ranglijsten voegen we niet toe zonder goede reden.

## Drempels en getallen

| Waarde | Getal | Waarom |
| --- | --- | --- |
| Automatisme-check | elke 14 dagen, eerste na 14 dagen | genoeg herhalingen om verschil te merken |
| Afstuderen | gemiddelde ≥ 5,5 / 7 | bovenste kwart van de schaal |
| Herinneringen om de dag | score ≥ 3,5 | midden van de schaal |
| Risicomomenten | na 10 logs, vensters van 2 uur, minstens 2 logs per venster, laatste 60 dagen | minder is ruis |
| Melding vooraf | 15 minuten | tijd om iets anders te plannen |
| Actieve gewoontes | waarschuwing vanaf 3 | literatuur adviseert 1–3 tegelijk |

## Bronnen

- Lally, van Jaarsveld, Potts & Wardle (2010). How are habits formed: Modelling habit formation in the real world.
- Gardner, Abraham, Lally & de Bruijn (2012). Towards parsimony in habit measurement: the SRBAI.
- Gollwitzer & Sheeran (2006). Implementation intentions and goal achievement: a meta-analysis.
- Fogg (2019). Tiny Habits.
- Deci, Koestner & Ryan (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation.
- Marlatt & Gordon (1985). Relapse prevention.
- Nahum-Shani e.a. (2018). Just-in-time adaptive interventions (JITAIs) in mobile health.
