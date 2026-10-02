/* Learning content part 2: mindset, body, relationships, environment, recovery, motivation + paths and daily boosts */
(function () {
  const L = (id, cat, min, t, body, take, act, quiz) => ({ id, cat, min, t, body, take, act, quiz });
  const Q = (q, a, c, why) => ({ q, a, c, why });

  const lessons = [
    /* ======================= MINDSET ======================= */
    L("l7", "Mindset", 3, "Een terugval is geen mislukking",
      `<p>Na één misstap denken 'het is toch al verpest' en dan helemaal loslaten: psychologen noemen dit het <b>abstinence violation effect</b>. Dit is de échte valkuil, niet de misstap zelf.</p>
<p>Je hersenen verliezen hun vooruitgang <b>niet</b> door één terugval. De verbindingen die je hebt opgebouwd blijven grotendeels bestaan.</p>
<h4>Na een terugval</h4>
<ul><li>Wees mild. Schaamte voedt de cyclus.</li><li>Log wat er gebeurde: tijd, trigger, gevoel.</li><li>Leer één ding en pas je plan aan.</li><li>Begin direct opnieuw, niet 'maandag'.</li></ul>`,
      "Eén misstap wist je vooruitgang niet uit. 'Het is toch al verpest' is de echte valkuil.",
      "Schrijf in je dagboek: wat leerde ik van mijn laatste terugval? Wat doe ik de volgende keer anders?",
      Q("Wat is de grootste valkuil na een misstap?", ["De misstap zelf", "Denken 'het is toch al verpest' en loslaten", "Te snel weer beginnen"], 1, "Direct opnieuw beginnen voorkomt dat één misstap een reeks wordt.")),

    L("l9", "Mindset", 2, "Identiteit boven doelen",
      `<p>"Ik probeer te stoppen" houdt je in de oude identiteit. "Ik ben iemand die dit niet doet" verandert hoe je beslissingen neemt.</p>
<p>Elke dag clean is een <b>stem</b> voor de persoon die je wilt worden. Je hoeft niet in één keer te veranderen, je moet alleen vandaag weer stemmen.</p>
<p>Probeer het verschil te voelen: iemand die stopt met roken en een sigaret krijgt aangeboden zegt "nee, ik probeer te stoppen" of "nee, ik rook niet". De tweede zin is een identiteit, en die is veel sterker.</p>`,
      "Niet 'ik probeer', maar 'ik ben iemand die…'. Elke dag is een stem voor wie je wordt.",
      "Maak je eigen identiteitszin af: 'Ik ben iemand die …' en zet hem in je belofte (Profiel).",
      Q("Welke zin is het sterkst?", ["Ik probeer te stoppen", "Ik ben iemand die dit niet doet", "Ik stop maandag"], 1, "Een identiteit stuurt je keuzes automatisch.")),

    L("min-compassion", "Mindset", 3, "Zelfcompassie werkt beter dan zelfkritiek",
      `<p>Veel mensen denken dat ze streng voor zichzelf moeten zijn om te veranderen. Onderzoek laat het tegendeel zien.</p>
<p>In een reeks experimenten (Breines & Chen, 2012) waren mensen die na een fout <b>vriendelijk voor zichzelf</b> waren juist <b>gemotiveerder om te verbeteren</b> dan mensen die zichzelf afkraakten.</p>
<h4>Waarom?</h4>
<p>Schaamte zegt "ik ben slecht" en zoekt ontsnapping, vaak precies in het gedrag waar je vanaf wilt. Zelfcompassie zegt "ik deed iets wat ik niet wilde, en ik kan het beter doen" en zoekt groei.</p>
<h4>Probeer dit</h4>
<p>Praat tegen jezelf zoals je tegen een goede vriend zou praten die hetzelfde meemaakt.</p>`,
      "Schaamte zoekt ontsnapping, zelfcompassie zoekt groei. Wees je eigen goede vriend.",
      "Schrijf één alinea aan jezelf zoals een goede vriend het zou schrijven.",
      Q("Wat bleek uit het onderzoek naar zelfcompassie na een fout?", ["Zelfkritiek motiveert het meest", "Zelfcompassie motiveert meer om te verbeteren", "Het maakt geen verschil"], 1, "Vriendelijkheid maakt het veilig om naar je fouten te kijken en ervan te leren.")),

    L("min-motivation", "Mindset", 3, "Waarom motivatie niet genoeg is",
      `<p>Motivatie is een gevoel, en gevoelens komen en gaan. Op dag 1 ben je vol vuur. Op dag 12, moe na een lange werkdag, is dat vuur weg.</p>
<p>Wat je dan draagt, is geen motivatie maar <b>systeem</b>:</p>
<ul><li>Een omgeving die het makkelijk maakt (filters, telefoon uit de slaapkamer)</li><li>Routines die automatisch lopen (gewoontes, reset)</li><li>Plannen die je vooraf maakte (als-dan)</li><li>Mensen die meekijken</li></ul>
<p>Motivatie start je op. Systemen houden je gaande.</p>`,
      "Motivatie komt en gaat. Bouw systemen die ook werken als je geen zin hebt.",
      "Kies één systeem dat je vandaag inricht: contentfilter, telefoonlader in de keuken of een als-dan-plan.",
      Q("Wat houdt je gaande als motivatie wegvalt?", ["Meer wilskracht", "Systemen: omgeving, routines en plannen", "Hopen op een goede dag"], 1, "Systemen werken ook op dagen dat je geen zin hebt.")),

    L("min-values", "Mindset", 3, "Ken je waarden",
      `<p>'Stoppen met iets' is een zwakke drijfveer. <b>Leven naar wat je belangrijk vindt</b> is een sterke.</p>
<p>Waarden zijn richtingen, geen doelen: eerlijkheid, gezondheid, verbinding, vakmanschap, avontuur, zorg voor anderen. Je bereikt ze nooit, maar je kunt er elke dag naartoe bewegen.</p>
<h4>Oefening</h4>
<ul><li>Kies je 3 belangrijkste waarden.</li><li>Vraag bij een drang: brengt dit me dichter bij of verder van mijn waarden?</li><li>Kies één kleine actie per dag die bij een waarde past.</li></ul>`,
      "Werk niet alleen weg van iets, maar naar iets toe: je waarden.",
      "Schrijf je 3 belangrijkste waarden op en voeg ze toe aan je redenen (Profiel → Waarom ik dit doe).",
      Q("Wat is het verschil tussen een waarde en een doel?", ["Er is geen verschil", "Een waarde is een richting, een doel een eindpunt", "Een doel is belangrijker"], 1, "Een richting kun je elke dag volgen, ook als het een keer misgaat.")),

    L("min-stoic", "Mindset", 3, "Lessen van de stoïcijnen",
      `<p>Tweeduizend jaar geleden schreven stoïcijnse filosofen als Seneca, Epictetus en Marcus Aurelius al over zelfbeheersing.</p>
<ul><li><b>Wat heb je in de hand?</b> Epictetus: maak onderscheid tussen wat je kunt beïnvloeden (je keuzes) en wat niet (je gedachten die opkomen). Richt je energie op het eerste.</li><li><b>Ongemak oefenen:</b> Seneca raadde aan om af en toe vrijwillig ongemak te kiezen, zodat het minder macht over je krijgt. Denk aan koude douches.</li><li><b>Vandaag telt:</b> Marcus Aurelius: doe wat je nu moet doen, alsof het je laatste taak is.</li></ul>
<p>"We lijden vaker in onze verbeelding dan in de werkelijkheid." (Seneca)</p>`,
      "Een gedachte komt vanzelf, een keuze niet. Richt je op wat je in de hand hebt.",
      "Kies vandaag één vrijwillig ongemak: koude douche, telefoonvrije ochtend of een wandeling in de regen.",
      Q("Waar moet je volgens Epictetus je energie op richten?", ["Op wat je niet kunt veranderen", "Op wat je wel in de hand hebt: je keuzes", "Op andermans mening"], 1, "Een drang die opkomt heb je niet in de hand. Wat je ermee doet wel.")),

    L("min-notyet", "Mindset", 2, "'Vandaag niet' in plaats van 'nooit meer'",
      `<p>"Nooit meer" is een enorme, onoverzienbare belofte. Je brein schrikt ervan en gaat onderhandelen.</p>
<p>"Vandaag niet" is klein en haalbaar. En morgen zeg je het gewoon weer.</p>
<p>Anonieme Alcoholisten gebruiken al decennialang het principe <b>'one day at a time'</b>. Niet omdat de lange termijn niet belangrijk is, maar omdat je de lange termijn alleen kunt winnen door de korte termijn te winnen.</p>`,
      "Win vandaag. Morgen win je morgen.",
      "Zeg bij de volgende drang hardop: 'Vandaag niet.'",
      Q("Waarom werkt 'vandaag niet' beter dan 'nooit meer'?", ["Het is strenger", "Het is klein en haalbaar", "Het klinkt beter"], 1, "Een haalbare belofte houd je makkelijker vol.")),

    L("min-growth", "Mindset", 3, "Groeimindset: je kunt het leren",
      `<p>Psycholoog Carol Dweck onderscheidt twee houdingen: een <b>vaste mindset</b> ("zo ben ik nou eenmaal") en een <b>groeimindset</b> ("dit kan ik leren").</p>
<p>Zelfbeheersing is geen karaktertrek die je wel of niet hebt, maar een <b>vaardigheid</b> die je oefent. Elke drang is een trainingsmoment. Elke terugval is data.</p>
<p>Let op je taal: vervang "ik kan dit niet" door "ik kan dit <b>nog</b> niet".</p>`,
      "Zelfbeheersing is een vaardigheid, geen talent. 'Nog niet' is geen 'nooit'.",
      "Betrap jezelf vandaag op één 'ik kan het niet' en maak er 'ik kan het nog niet' van.",
      Q("Hoe kijkt iemand met een groeimindset naar zelfbeheersing?", ["Als aangeboren talent", "Als een vaardigheid die je oefent", "Als geluk"], 1, "Oefenen maakt het sterker, net als een spier.")),

    /* ======================= LICHAAM ======================= */
    L("bod-move", "Lichaam", 3, "Beweging als medicijn",
      `<p>Beweging is een van de krachtigste middelen tegen drang. In onderzoek naar onder andere stoppen met roken verminderde al een korte sessie matige inspanning de drang en ontwenningsklachten.</p>
<h4>Waarom het werkt</h4>
<ul><li>Het verbruikt stresshormonen</li><li>Het geeft gezonde dopamine en endorfine</li><li>Het maakt je moe op een goede manier, zodat je beter slaapt</li><li>Het geeft een gevoel van controle en trots</li></ul>
<p>Het hoeft geen marathon te zijn. 10 minuten stevig wandelen of 3 sets push-ups werkt al.</p>`,
      "Een korte beweging is een van de snelste manieren om drang te laten zakken.",
      "Plan vandaag 20 minuten beweging en zet de gewoonte 'Sporten' of 'Stappen' aan.",
      Q("Hoeveel beweging is al nuttig tegen drang?", ["Alleen een uur of meer", "Al een korte sessie, zoals 10 minuten", "Beweging helpt niet"], 1, "Kort en direct werkt al.")),

    L("bod-light", "Lichaam", 2, "Ochtendlicht en je ritme",
      `<p>Licht in je ogen in het eerste uur na het opstaan helpt je biologische klok. Je wordt overdag alerter en 's avonds eerder moe, zodat je beter slaapt.</p>
<ul><li>5–10 minuten buiten op een heldere dag</li><li>15–30 minuten bij bewolking</li><li>Geen zonnebril, niet in de zon staren</li></ul>
<p>Combineer het met bewegen of je ochtendkoffie: twee gewoontes in één.</p>`,
      "Ochtendlicht zet je klok gelijk: alerter overdag, beter slapen 's nachts.",
      "Ga morgen binnen een uur na het opstaan 10 minuten naar buiten.",
      Q("Wanneer is licht het nuttigst voor je ritme?", ["Laat op de avond", "In het eerste uur na het opstaan", "Maakt niet uit"], 1, "Ochtendlicht zet je interne klok gelijk.")),

    L("bod-food", "Lichaam", 3, "Voeding, bloedsuiker en drang",
      `<p>Een bloedsuikerdip voelt als onrust, prikkelbaarheid en zin in 'iets'. Je brein weet niet altijd precies wát het wil, alleen dat het nú iets wil.</p>
<ul><li>Eet regelmatig, sla ontbijt of lunch niet over (de H van HALT)</li><li>Combineer koolhydraten met eiwit en vezels</li><li>Beperk snelle suikers en energiedrankjes</li><li>Drink genoeg water: dorst voelt soms als onrust</li></ul>
<p>Het is geen dieet, maar een basis waarop je beter beslissingen neemt.</p>`,
      "Honger en bloedsuikerdips voelen als onrust. Een stabiele basis maakt nee zeggen makkelijker.",
      "Zet de gewoonte 'Water drinken' aan en eet vandaag een ontbijt met eiwit.",
      Q("Waar staat de H in HALT voor?", ["Hopeloos", "Honger", "Haast"], 1, "Honger maakt je prikkelbaar en kwetsbaar.")),

    L("bod-alcohol", "Lichaam", 2, "Alcohol en je remmen",
      `<p>Alcohol dempt als eerste je <b>prefrontale cortex</b>: het deel dat plant en 'nee' zegt. Daarom gebeuren veel terugvallen na een avond drinken.</p>
<ul><li>Beslis vooraf hoeveel je drinkt, en houd je eraan</li><li>Wissel elk drankje af met water</li><li>Maak een als-dan-plan voor thuiskomst: "Als ik thuiskom na het stappen, dan leg ik mijn telefoon direct aan de lader in de keuken."</li><li>Overweeg een alcohol-limiet als gewoonte</li></ul>`,
      "Alcohol zet je rem als eerste uit. Plan de thuiskomst vooraf.",
      "Maak een als-dan-plan voor de volgende keer dat je drinkt.",
      Q("Welk deel van je brein dempt alcohol als eerste?", ["Je geheugen", "Je prefrontale cortex (de rem)", "Je zicht"], 1, "Daarom zijn late avonden na drinken extra riskant.")),

    L("bod-sleepplan", "Lichaam", 3, "Een avondroutine die werkt",
      `<p>De laatste 60 minuten van je dag bepalen voor een groot deel hoe je slaapt, en hoe kwetsbaar je bent.</p>
<h4>Een voorbeeld-routine</h4>
<ul><li><b>-60 min:</b> schermen dimmen, lichten laag</li><li><b>-45 min:</b> telefoon aan de lader buiten de slaapkamer</li><li><b>-30 min:</b> douchen, tanden poetsen, check-in in de app</li><li><b>-15 min:</b> lezen op papier of 5 minuten meditatie</li><li><b>0:</b> licht uit</li></ul>
<p>Houd het simpel en herhaal het elke avond. Na een paar weken voelt je lichaam de routine als signaal: tijd om te slapen.</p>`,
      "Een vaste avondroutine beschermt je slaap én je slechtste moment van de dag.",
      "Schrijf je eigen avondroutine van 4 stappen en probeer hem vanavond.",
      Q("Wat is de belangrijkste stap tegen late-avond-risico?", ["Nog even scrollen om te ontspannen", "Telefoon buiten de slaapkamer", "Later naar bed"], 1, "Geen telefoon in bed = geen verleiding in bed.")),

    /* ======================= RELATIES ======================= */
    L("rel-connect", "Relaties", 3, "Verbinding is het tegengif",
      `<p>Journalist Johann Hari vatte onderzoek naar verslaving samen in één zin: <b>"Het tegenovergestelde van verslaving is niet nuchterheid, maar verbinding."</b></p>
<p>Isolatie en eenzaamheid zijn sterke triggers. Schermen beloven verbinding, maar geven vaak het tegenovergestelde.</p>
<ul><li>Spreek deze week met één vriend af, in het echt</li><li>Stuur iemand een bericht die je lang niet sprak</li><li>Sluit je aan bij een sportclub, team of groep</li><li>Zoek lotgenoten: je bent niet de enige</li></ul>`,
      "Verbinding met echte mensen maakt je minder kwetsbaar.",
      "Stuur vandaag één persoon een bericht om af te spreken.",
      Q("Wat is volgens Hari het tegenovergestelde van verslaving?", ["Wilskracht", "Verbinding", "Straf"], 1, "Echte relaties vullen de leegte die schermen beloven te vullen.")),

    L("rel-partner", "Relaties", 3, "Praten met je partner",
      `<p>Als je een relatie hebt, kan dit onderwerp beladen voelen. Openheid kan veel opluchten, maar het vraagt voorbereiding.</p>
<ul><li>Kies een rustig moment, niet midden in ruzie of vlak na een terugval</li><li>Vertel wat je doet en waarom, niet alleen wat er misging</li><li>Vraag wat de ander nodig heeft om zich veilig te voelen</li><li>Maak afspraken over hoe jullie het bespreekbaar houden</li><li>Overweeg samen hulp (relatietherapeut of seksuoloog)</li></ul>
<p>Het doel is niet biechten, maar samen bouwen aan vertrouwen.</p>`,
      "Openheid bouwt vertrouwen als je het rustig en voorbereid doet.",
      "Schrijf op wat je zou willen zeggen, ook als je het nog niet uitspreekt.",
      Q("Wanneer kun je zo'n gesprek het beste voeren?", ["Midden in een ruzie", "Op een rustig, voorbereid moment", "Vlak na een terugval"], 1, "Rust geeft ruimte voor begrip.")),

    L("rel-accountability", "Relaties", 2, "Accountability: samen sterker",
      `<p>Iemand die weet waar je mee bezig bent, maakt het makkelijker om vol te houden. Niet omdat hij je controleert, maar omdat je het niet meer alleen draagt.</p>
<ul><li>Kies iemand die je vertrouwt en die niet oordeelt</li><li>Spreek af wat je deelt: bijvoorbeeld je streak elke zondag</li><li>Laat die persoon je Schermtijd-code instellen</li><li>Deel mijlpalen (Voortgang → Delen)</li></ul>`,
      "Wat je deelt, draag je niet alleen.",
      "Deel je huidige streak vandaag met één persoon die je vertrouwt.",
      Q("Wat is de belangrijkste eigenschap van een accountability-partner?", ["Streng zijn", "Te vertrouwen zijn en niet oordelen", "Altijd online zijn"], 1, "Veiligheid maakt eerlijkheid mogelijk.")),

    L("rel-real", "Relaties", 3, "Echte intimiteit versus het scherm",
      `<p>Content op een scherm kan verwachtingen scheppen die weinig met echte intimiteit te maken hebben: altijd nieuw, altijd beschikbaar, zonder emotie of kwetsbaarheid.</p>
<p>Echte intimiteit is anders: <b>langzamer, persoonlijker, met aandacht voor de ander</b>. Veel mensen merken dat ze na een periode zonder overprikkeling weer meer genieten van echte nabijheid.</p>
<p>Geef jezelf en je (toekomstige) partner die ruimte. Ervaar je blijvende klachten? Een seksuoloog of je huisarts kan helpen, en daar is niets gêneds aan.</p>`,
      "Echte intimiteit draait om verbinding, niet om prikkels. Je gevoeligheid daarvoor kan terugkomen.",
      "Schrijf op wat verbinding voor jou betekent, los van het scherm.",
      Q("Wat merken veel mensen na een periode zonder overprikkeling?", ["Minder interesse in echte nabijheid", "Meer genieten van echte nabijheid", "Geen verschil"], 1, "Je gevoeligheid voor het echte herstelt zich.")),

    /* ======================= OMGEVING ======================= */
    L("l6", "Omgeving", 3, "Ontwerp je omgeving",
      `<p>Wilskracht is beperkt. Een goede omgeving is dat niet. Maak het moeilijk om terug te vallen en makkelijk om het goede te doen.</p>
<ul><li>Telefoon 's nachts <b>buiten de slaapkamer</b> opladen</li><li>Contentfilter aan via Schermtijd (zie Tools → Blocker)</li><li>Social media-apps die triggeren verwijderen of verbergen</li><li>Laptop alleen in gedeelde ruimtes gebruiken</li><li>Een vaste 'uit'-tijd voor schermen</li></ul>
<p>Elke drempel die je toevoegt geeft je prefrontale cortex tijd om in te grijpen.</p>`,
      "Win de strijd vóórdat hij begint: ontwerp je omgeving.",
      "Zet vandaag de contentfilter aan via Tools → Blocker.",
      Q("Waarom werkt omgeving beter dan wilskracht?", ["Omgeving is duurder", "Wilskracht raakt op, een goede omgeving niet", "Het werkt niet beter"], 1, "Een omgeving werkt ook op je zwakste momenten.")),

    L("env-phone", "Omgeving", 3, "Maak je telefoon saai",
      `<p>Je telefoon is ontworpen om je aandacht vast te houden. Een paar instellingen maken hem een stuk minder verslavend:</p>
<ul><li><b>Grijstinten</b> (Instellingen → Toegankelijkheid → Weergave → Kleurfilters): kleurloze apps zijn minder aantrekkelijk</li><li><b>Meldingen uit</b> voor alles behalve mensen</li><li><b>Beginscherm leeg:</b> alleen tools (kaart, agenda, Routini), social media in een map op de laatste pagina</li><li><b>Focus-modus</b> 's avonds en tijdens werk</li><li><b>Uitloggen</b> na elk gebruik van social media</li></ul>`,
      "Een saaie telefoon trekt minder. Kleur, meldingen en gemak zijn haakjes.",
      "Zet vandaag grijstinten aan en verplaats social media naar de laatste pagina.",
      Q("Welke instelling maakt apps direct minder aantrekkelijk?", ["Helderheid omhoog", "Grijstinten", "Geluid aan"], 1, "Kleur is een belangrijk haakje in app-ontwerp.")),

    L("env-digital", "Omgeving", 3, "Digitaal minimalisme",
      `<p>Cal Newport stelt in <i>Digital Minimalism</i> voor om technologie niet te gebruiken omdat het kan, maar alleen als het iets toevoegt aan wat je belangrijk vindt.</p>
<h4>De 30-dagen-reset</h4>
<ul><li>Stop 30 dagen met alle optionele technologie (social media, games, streaming)</li><li>Vul die tijd met echte activiteiten: sport, vrienden, maken, leren</li><li>Voeg daarna alleen terug wat echt waarde heeft, met duidelijke regels</li></ul>
<p>Ook een kleinere versie werkt: één weekend per maand offline.</p>`,
      "Gebruik technologie bewust, alleen als het bijdraagt aan wat je belangrijk vindt.",
      "Plan een offline dagdeel dit weekend.",
      Q("Wat is de kern van digitaal minimalisme?", ["Nooit meer technologie", "Alleen technologie gebruiken die echt waarde toevoegt", "Zo veel mogelijk apps"], 1, "Het gaat om bewust kiezen, niet om alles schrappen.")),

    L("env-social", "Omgeving", 2, "Schoon je feeds op",
      `<p>Je feed is je digitale omgeving. Wat erin staat, bepaalt je stemming en je triggers.</p>
<ul><li>Ontvolg of dempt accounts die je triggeren, ook als ze 'onschuldig' lijken</li><li>Gebruik 'niet geïnteresseerd' bij verkeerde suggesties</li><li>Volg accounts die je inspireren: sport, leren, hobby's</li><li>Vermijd de oneindige feeds (Reels, Shorts, TikTok): daar heb je de minste controle</li></ul>`,
      "Wat je ziet, voedt je. Cureer je feed zoals je je koelkast zou vullen.",
      "Ontvolg vandaag 10 accounts die je niets opleveren.",
      Q("Waar heb je de minste controle over wat je ziet?", ["Berichten van vrienden", "Oneindige feeds zoals Reels en TikTok", "Je e-mail"], 1, "Algoritmes kiezen daar voor jou.")),

    /* ======================= HERSTEL ======================= */
    L("rec-first7", "Herstel", 3, "De eerste 7 dagen",
      `<p>De eerste week is vaak de zwaarste. Je brein is gewend aan een snelle knop en die is nu weg.</p>
<ul><li><b>Verwacht drang:</b> het is normaal en het zakt</li><li><b>Plan je avonden:</b> daar zit het grootste risico</li><li><b>Beweeg elke dag:</b> het neemt spanning weg</li><li><b>Gebruik de noodknop zonder schaamte:</b> daar is hij voor</li><li><b>Doe elke avond je check-in:</b> dan zie je jezelf groeien</li></ul>
<p>Na dag 3 en dag 7 vier je je eerste mijlpalen. Elke mijlpaal is het bewijs dat je het kunt.</p>`,
      "De eerste week is het zwaarst. Plan je avonden en verwacht de drang.",
      "Plan voor de komende 3 avonden wat je gaat doen tussen 21:00 en 23:00.",
      Q("Waar zit in de eerste week meestal het grootste risico?", ["'s Ochtends", "'s Avonds", "Tijdens het werk"], 1, "Moe, alleen en met een scherm: de gevaarlijkste combinatie.")),

    L("rec-24h", "Herstel", 3, "Na een terugval: het 24-uursplan",
      `<p>Wat je in de 24 uur na een terugval doet, bepaalt of het één misstap blijft of een reeks wordt.</p>
<ul><li><b>Uur 1:</b> stop de spiraal. Geen tweede keer "omdat het toch al verpest is". Telefoon weg, ga naar buiten of onder de douche.</li><li><b>Dezelfde avond:</b> schrijf kort op wat er gebeurde (tijd, trigger, gevoel). Zonder oordeel.</li><li><b>De volgende dag:</b> je hersteldag. Reset, beweging, meditatie en een check-in. De app helpt je erdoorheen.</li><li><b>Pas één ding aan:</b> welke drempel of welk als-dan-plan had dit voorkomen?</li></ul>`,
      "Een terugval blijft één misstap als je binnen 24 uur je herstel start.",
      "Controleer of je risicomoment-melding op het goede tijdstip staat (Profiel → Meldingen).",
      Q("Wat is het belangrijkst in het eerste uur na een terugval?", ["Jezelf straffen", "De spiraal stoppen: geen tweede keer", "Alles wissen"], 1, "Eén misstap mag niet uitgroeien tot een reeks.")),

    L("rec-triggers", "Herstel", 3, "Triggers versus oorzaken",
      `<p>Een <b>trigger</b> is het moment dat de drang aanzet: alleen in bed, een bepaalde app. Een <b>oorzaak</b> ligt dieper: stress op werk, eenzaamheid, verdriet, onzekerheid.</p>
<p>Triggers vermijden helpt op korte termijn. Oorzaken aanpakken helpt op lange termijn.</p>
<h4>Vraag jezelf af</h4>
<ul><li>Wat voelde ik de uren vóór de drang?</li><li>Wat probeer ik eigenlijk te ontlopen of te voelen?</li><li>Wat zou me echt helpen met dat gevoel?</li></ul>`,
      "Triggers starten de drang, oorzaken voeden hem. Pak beide aan.",
      "Schrijf in je dagboek welk gevoel het vaakst onder je drang ligt.",
      Q("Wat helpt op de lange termijn het meest?", ["Alleen triggers vermijden", "De onderliggende oorzaken aanpakken", "Niets doen"], 1, "Als de oorzaak minder wordt, worden de triggers ook zwakker.")),

    L("rec-pain", "Herstel", 3, "Voelen in plaats van vluchten",
      `<p>Veel dwangmatig gedrag is een manier om pijnlijke gevoelens even niet te voelen: verveling, eenzaamheid, afwijzing, stress.</p>
<p>Dat werkt kort, maar het gevoel blijft liggen en komt terug, vaak met schaamte erbovenop.</p>
<h4>Een andere route</h4>
<ul><li><b>Benoem het:</b> "Ik voel me eenzaam." Benoemen alleen maakt het al minder heftig.</li><li><b>Laat het er zijn:</b> een gevoel is een golf, net als een drang.</li><li><b>Zorg voor jezelf:</b> wat zou je nu echt helpen? Iemand bellen, een wandeling, slapen?</li></ul>`,
      "Een gevoel benoemen maakt het kleiner. Vluchten maakt het groter.",
      "Benoem vandaag drie keer hoe je je voelt, in één woord.",
      Q("Wat gebeurt er als je een gevoel benoemt?", ["Het wordt heftiger", "Het wordt vaak minder heftig", "Er gebeurt niets"], 1, "Woorden geven je brein grip op emoties.")),

    L("rec-help", "Herstel", 3, "Wanneer professionele hulp zoeken?",
      `<p>Deze app is een hulpmiddel, geen behandeling. Zoek hulp als:</p>
<ul><li>je het gedrag niet onder controle krijgt ondanks serieuze pogingen</li><li>het je werk, studie of relaties ernstig schaadt</li><li>je je langdurig somber, angstig of hopeloos voelt</li><li>je gedachten hebt over jezelf iets aandoen</li></ul>
<h4>Waar kun je terecht?</h4>
<ul><li><b>Je huisarts:</b> de eerste stap, en kan doorverwijzen naar een psycholoog of seksuoloog</li><li><b>Lotgenotengroepen:</b> anoniem, vaak gratis</li><li><b>113 Zelfmoordpreventie:</b> bel 113 of 0800-0113 (gratis, 24/7) als je aan zelfdoding denkt</li></ul>
<p>Hulp vragen is geen zwakte. Het is een van de sterkste stappen die je kunt zetten.</p>`,
      "Hulp vragen is kracht. Je huisarts is een goede eerste stap.",
      "Zet het nummer 113 of 0800-0113 in je contacten, voor jezelf of voor een ander.",
      Q("Wat is meestal de eerste stap naar professionele hulp in Nederland?", ["Direct naar een ziekenhuis", "Je huisarts", "Afwachten"], 1, "De huisarts kan je doorverwijzen naar passende hulp.")),

    /* ======================= MOTIVATIE ======================= */
    L("mot-future", "Motivatie", 2, "Ontmoet jezelf over een jaar",
      `<p>Sluit even je ogen. Stel je voor: het is precies een jaar later. Je hebt het volgehouden, met hier en daar een misstap, maar steeds weer opgestaan.</p>
<ul><li>Hoe ziet je ochtend eruit?</li><li>Hoe voel je je in je lichaam?</li><li>Hoe kijk je anderen in de ogen?</li><li>Wat heb je gedaan met alle tijd en energie die vrijkwam?</li></ul>
<p>Die persoon bestaat al in potentie. Elke dag dat je volhoudt, kom je een stap dichterbij. Wat zou hij of zij tegen je zeggen, vandaag?</p>`,
      "Je toekomstige zelf wordt gebouwd door wat je vandaag doet.",
      "Schrijf een korte brief van je toekomstige zelf aan jou van vandaag.",
      Q("Wat bouwt je toekomstige zelf?", ["Eén groot moment", "Wat je elke dag doet", "Geluk"], 1, "Kleine dagelijkse keuzes stapelen zich op.")),

    L("mot-small", "Motivatie", 2, "Kleine winsten stapelen",
      `<p>1% beter per dag lijkt niets. Maar na een jaar is het een compleet ander leven. Het omgekeerde geldt ook: kleine toegevingen stapelen zich stilletjes op.</p>
<p>Je hoeft vandaag niet je hele leven om te gooien. Je hoeft alleen vandaag te winnen: één koude douche, één weerstane drang, één vroege avond.</p>
<p>Vier kleine winsten. Een vinkje in de app is niet kinderachtig: het is je brein dat leert dat goed gedrag beloond wordt.</p>`,
      "1% beter per dag. Vier elk vinkje, het traint je brein.",
      "Kijk vanavond terug op je dag en noem 3 kleine winsten.",
      Q("Wat bereik je met 1% per dag beter?", ["Niets merkbaars", "Een groot verschil na een jaar", "Alleen vermoeidheid"], 1, "Kleine stappen stapelen zich op tot grote veranderingen.")),

    L("mot-proud", "Motivatie", 2, "Trots is sterker dan schaamte",
      `<p>Schaamte zegt: "Ik ben slecht." Trots zegt: "Ik heb iets goeds gedaan." Schaamte laat je wegkruipen, trots laat je opstaan.</p>
<p>Zoek bewust naar momenten om trots op te zijn. Elke weerstane drang, elke check-in, elke dag clean is iets om trots op te zijn.</p>
<p>Wie trots is op zichzelf, wil dat gevoel beschermen. Dat is een van de sterkste motivaties die er is.</p>`,
      "Trots bescherm je, schaamte ontvlucht je. Kies bewust voor trots.",
      "Vertel vandaag iemand over iets waar je trots op bent, hoe klein ook.",
      Q("Waarom werkt trots beter dan schaamte?", ["Trots is makkelijker", "Wie trots is, wil dat gevoel beschermen", "Het werkt niet beter"], 1, "Trots geeft je iets om voor te vechten.")),

    L("mot-why", "Motivatie", 2, "Terug naar je waarom",
      `<p>Op zware momenten vergeet je waarom je begon. Daarom staat je waarom in de app: in je profiel en in de noodmodus.</p>
<p>Maak je waarom zo concreet mogelijk. Niet "een beter leven", maar: "Ik wil 's ochtends wakker worden zonder schaamte." "Ik wil echt aanwezig zijn bij mijn partner." "Ik wil mijn studie afmaken."</p>
<p>Hoe concreter en persoonlijker, hoe meer kracht het heeft op het moment dat het erop aankomt.</p>`,
      "Een concreet, persoonlijk waarom is je sterkste anker.",
      "Maak één van je redenen (Profiel → Waarom ik dit doe) concreter en persoonlijker.",
      Q("Welk waarom werkt het best op een zwak moment?", ["Een vaag 'beter leven'", "Een concreet en persoonlijk waarom", "Geen waarom"], 1, "Concreet raakt je echt.")),
  ];

  const boosts = [
    "Je hoeft niet perfect te zijn. Je moet alleen vandaag winnen.",
    "De drang is een golf. Jij bent de surfer.",
    "Elke keer dat je nee zegt, wordt het pad makkelijker.",
    "Discipline is kiezen voor wat je het meest wilt boven wat je nu wilt.",
    "Je streak is geen getal. Het is bewijs.",
    "Wat je vandaag doet, is een stem voor wie je morgen bent.",
    "Voelen is oké. Vluchten hoeft niet.",
    "Tien minuten wachten kun je altijd. Begin daar.",
    "Je brein verandert elke dag een beetje. Ook vandaag.",
    "De moeilijkste stap is de telefoon wegleggen. Daarna wordt het lichter.",
    "Rust komt niet door toe te geven, maar door de drang voorbij te laten gaan.",
    "Kleine winsten zijn nog steeds winsten.",
    "Je bent niet je gedachten. Je bent degene die ze opmerkt.",
    "Een misstap is een datapunt, geen oordeel.",
    "Word elke dag 1% beter. Meer hoeft niet.",
    "Je toekomstige zelf kijkt mee. Maak hem trots.",
    "Echte verbinding verslaat elke feed.",
    "Moe? Dan is slapen de sterkste keuze.",
    "Je hebt al moeilijkere dingen overleefd dan deze drang.",
    "Vandaag niet. Dat is genoeg.",
    "Energie die je niet weggeeft aan een scherm, kun je ergens anders in steken.",
    "Het ongemak van nu is de kracht van later.",
    "Wie zichzelf overwint, is sterker dan wie anderen overwint.",
    "Je omgeving is je beste bondgenoot. Richt hem in.",
    "Trots voelen is toegestaan. Doe het vaker.",
    "Val zeven keer, sta acht keer op.",
    "Je hoeft het niet alleen te doen. Bel iemand.",
    "Een koude douche is een kleine overwinning voor je ontbijt.",
    "Consistentie wint van motivatie.",
    "Beslis vooraf, dan hoeft je moeie brein niets meer te beslissen.",
    "De film eindigt niet bij de opluchting. Kijk verder.",
    "Je grootste overwinningen zie niemand, behalve jij. Dat telt.",
    "Honger, boos, eenzaam of moe? Zorg eerst daarvoor.",
    "Zelfcompassie is geen zwakte. Het is je motor om te groeien.",
    "Je hoeft niet te wachten op maandag. Begin nu.",
    "Iedere dag clean is een dag die van jou is.",
    "Ademen kun je altijd. Lang uit, rustig in.",
    "Nieuwe gewoontes voelen eerst onwennig. Dat betekent dat je groeit.",
    "Je doet dit niet omdat het makkelijk is, maar omdat het het waard is.",
    "Vandaag is een goede dag om iemand te zijn op wie je trots bent."
  ];

  const paths = [
    { id: "start", e: "🚀", t: "Start hier", s: "De basis in 7 lessen", ids: ["l1", "l2", "l3", "l4", "l6", "l7", "l9"] },
    { id: "urges", e: "🌊", t: "Urges de baas", s: "Technieken voor het moment zelf", ids: ["l3", "l5", "tec-ifthen", "tec-tape", "tec-breath", "tec-ground", "tec-sixty"] },
    { id: "brain", e: "🧠", t: "Brein & dopamine", s: "Begrijp wat er in je hoofd gebeurt", ids: ["l1", "sci-super", "sci-want", "sci-pfc", "sci-stress", "sci-loop", "sci-tol", "l2"] },
    { id: "habits", e: "✅", t: "Sterke gewoontes", s: "Bouw een leven dat je beschermt", ids: ["sci-loop", "tec-stack", "tec-friction", "tec-bundle", "l10", "min-motivation", "l9"] },
    { id: "relapse", e: "🩹", t: "Na een terugval", s: "Opstaan en sterker verder", ids: ["l7", "rec-24h", "rec-triggers", "min-compassion", "rec-pain", "rec-help"] },
    { id: "body", e: "💪", t: "Lichaam in balans", s: "Slaap, beweging, voeding", ids: ["sci-sleep", "bod-move", "bod-light", "bod-food", "bod-alcohol", "bod-sleepplan", "l8"] },
    { id: "life", e: "🌱", t: "Een rijker leven", s: "Relaties, waarden en omgeving", ids: ["rel-connect", "min-values", "rel-accountability", "rel-real", "env-phone", "env-digital", "mot-future"] }
  ];

  window.LESSONS_B = lessons;
  window.LEARN_BOOSTS = boosts;
  window.LEARN_PATHS = paths;
})();
