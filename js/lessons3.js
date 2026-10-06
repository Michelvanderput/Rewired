/* Learning content part 3: lessons for a specific focus (porn, gambling, ADHD).
   Each lesson has `focus`; Learn only shows them (and their path) when that focus is chosen in Profiel. */
(function () {
  const L = (focus, id, cat, min, t, body, take, act, quiz) => ({ focus, id, cat, min, t, body, take, act, quiz });
  const Q = (q, a, c, why) => ({ q, a, c, why });

  const lessons = [
    /* ======================= PORNO ======================= */
    L("porn", "porn-brain", "Porno", 4, "Wat porno met je beloningssysteem doet",
      `<p>Porno is een <b>supernormale prikkel</b>: sterker, nieuwer en sneller beschikbaar dan iets wat je brein in de natuur tegenkomt. Elke klik belooft iets nieuws, en juist <b>nieuwheid</b> geeft een extra dopaminepiek.</p>
<p>Daarom voelt één video zelden genoeg. Je zoekt door, langer en vaak naar heftiger materiaal. Dat is geen karakterfout, het is hoe een beloningssysteem reageert op een eindeloze stroom nieuwe prikkels.</p>
<h4>Wat er bij veel mensen verandert</h4>
<ul><li>Gewone dingen voelen vlakker (minder zin, minder focus)</li><li>Gebruik schuift naar momenten van stress, verveling of eenzaamheid: het wordt een manier om je rot gevoel te dempen</li><li>Het patroon begint steeds eerder: telefoon in bed, scrollen, "even kijken"</li></ul>
<h4>Het goede nieuws</h4>
<p>Gevoeligheid voor gewone beloningen herstelt zich als je de supernormale prikkel weghaalt. De eerste weken zijn het lastigst, daarna wordt het merkbaar rustiger.</p>`,
      "Het is niet het verlangen, maar de eindeloze nieuwheid die je brein vastzet. Haal de stroom weg, dan herstelt het.",
      "Schrijf op: op welke 2 momenten van de dag pak je het vaakst je telefoon zonder doel? Daar begint je plan.",
      Q("Waarom voelt één video zelden genoeg?", ["Omdat je zwak bent", "Omdat nieuwheid steeds een nieuwe dopaminepiek geeft", "Omdat je te weinig slaapt"], 1, "Elke nieuwe klik belooft iets nieuws. Dat houdt je zoekend.")),

    L("porn", "porn-chain", "Porno", 3, "De terugval begint eerder dan je denkt",
      `<p>Bijna niemand besluit om porno te kijken. Het gebeurt via een <b>keten van kleine, onschuldige keuzes</b>: telefoon mee naar bed, nog even Instagram, een uitdagende foto, "even zoeken"…</p>
<p>Psychologen noemen dit <b>ogenschijnlijk onbelangrijke beslissingen</b>. Elke stap lijkt klein, maar samen leiden ze precies naar het moment waar je niet meer wilt zijn.</p>
<h4>Breek de keten zo vroeg mogelijk</h4>
<ul><li>De makkelijkste schakel om te breken is de eerste: de telefoon gaat 's avonds niet mee naar je bed</li><li>Bij de tweede schakel (doelloos scrollen) is het al lastiger</li><li>Bij "even zoeken" is de drang op zijn sterkst: daar heb je de noodmodus voor</li></ul>`,
      "Breek de keten bij de eerste schakel, niet bij de laatste. Daar kost het de minste wilskracht.",
      "Log je volgende drang met plek en gevoel. Na 10 logs zie je je eigen keten bij Voortgang.",
      Q("Waar breek je de keten het makkelijkst?", ["Bij de eerste schakel", "Op het moment van de drang zelf", "De dag erna"], 0, "Hoe eerder, hoe minder wilskracht het kost.")),

    L("porn", "porn-shame", "Porno", 3, "Schaamte of verantwoordelijkheid",
      `<p>Na een terugval voelen veel mensen schaamte: "ik ben walgelijk", "ik kan het nooit". Schaamte voelt als een straf die je verdient, maar het werkt averechts: het is een rot gevoel, en porno is juist je oude manier om rot gevoel te dempen.</p>
<p><b>Verantwoordelijkheid</b> is iets anders: "Dit deed ik, dit was de aanleiding, dit doe ik de volgende keer anders." Dat is gericht op wat je kunt doen, niet op wie je bent.</p>
<h4>Praten helpt</h4>
<p>Geheimhouding houdt het patroon in stand. Het vertellen aan één persoon die je vertrouwt, of aan een hulpverlener, haalt veel kracht weg. Jellinek heeft anonieme zelfhulp en online behandeling, ook voor porno.</p>`,
      "Schaamte zegt 'ik ben slecht' en zoekt een uitweg. Verantwoordelijkheid zegt 'ik doe het anders' en zoekt een plan.",
      "Schrijf na je volgende misstap drie zinnen: wat gebeurde er, wat was de aanleiding, wat doe ik de volgende keer anders.",
      Q("Wat helpt je na een terugval het meest verder?", ["Jezelf straffen met schaamte", "Verantwoordelijkheid: aanleiding zien en een plan maken", "Er niet meer aan denken"], 1, "Schaamte voedt de cyclus; een plan doorbreekt hem.")),

    L("porn", "porn-env", "Porno", 3, "Maak je telefoon saai",
      `<p>Wilskracht is beperkt, je omgeving is altijd aanwezig. Hoe moeilijker het is om erbij te komen, hoe vaker de drang voorbij gaat voordat je iets gedaan hebt.</p>
<h4>Drie lagen bescherming</h4>
<ul><li><b>Blokkeren:</b> zet in Schermtijd de inhoudsbeperking voor websites aan (zie de Blocker in Tools) en laat iemand anders de code kiezen</li><li><b>Afstand:</b> telefoon 's avonds aan de lader buiten de slaapkamer, een gewone wekker naast je bed</li><li><b>Vervangen:</b> verwijder apps waar het vaak begint en zet tools op je beginscherm</li></ul>
<p>Het hoeft niet waterdicht te zijn. Elke extra stap geeft de golf tijd om te zakken.</p>`,
      "Maak het moeilijk en saai. Elke extra stap geeft de drang tijd om te zakken.",
      "Doe vandaag de Blocker-stappen in Tools en laat iemand anders de Schermtijd-code instellen.",
      Q("Waarom werkt blokkeren, ook al kun je het omzeilen?", ["Het werkt niet", "Elke extra stap geeft de drang tijd om voorbij te gaan", "Omdat het verboden is"], 1, "Een drang piekt en zakt. Vertraging is genoeg.")),

    /* ======================= GOKKEN ======================= */
    L("gambling", "gam-brain", "Gokken", 4, "Waarom gokken je brein vastgrijpt",
      `<p>Gokken werkt met <b>onvoorspelbare beloningen</b>. Je weet nooit wanneer je wint, en juist dat maakt het zo verslavend: het beloningssysteem reageert het sterkst op onzekerheid, niet op de winst zelf.</p>
<h4>De trucs van het spel</h4>
<ul><li><b>Bijna-winst:</b> net mis voelt in je brein bijna als winnen en zet je aan om door te gaan</li><li><b>Verlies als winst:</b> €1 inzetten en €0,60 'winnen' komt met geluid en lichtjes, terwijl je verloor</li><li><b>Snelheid:</b> online kun je elke paar seconden opnieuw, er is geen natuurlijk stopmoment</li></ul>
<p>Deze trucs zijn ontworpen. Weten hoe ze werken maakt ze minder krachtig.</p>`,
      "Niet de winst maar de onzekerheid houdt je vast. Bijna-winst en 'verlies als winst' zijn trucs.",
      "Schrijf op hoeveel je de afgelopen maand inzette en hoeveel er overbleef. Alleen de echte getallen.",
      Q("Waar reageert je beloningssysteem bij gokken het sterkst op?", ["Op de winst", "Op de onzekerheid of je wint", "Op het geld op je rekening"], 1, "Onvoorspelbare beloning is de krachtigste.")),

    L("gambling", "gam-chase", "Gokken", 3, "Verlies terugwinnen: de grootste val",
      `<p>"Nog één keer, dan heb ik het terug." Dit heet <b>chasing</b>: proberen verlies terug te winnen. Het is de snelste weg van een slechte avond naar echte schulden.</p>
<h4>Twee denkfouten</h4>
<ul><li><b>"Het moet nu toch een keer vallen":</b> elke ronde is los van de vorige. Een reeks verlies maakt winst niet waarschijnlijker</li><li><b>"Ik heb er al zoveel in gestoken":</b> wat weg is, is weg. Doorgaan maakt het verlies alleen groter</li></ul>
<h4>Op het moment zelf</h4>
<p>Stop, leg je telefoon weg, en doe 10 minuten iets anders: de noodmodus, een wandeling, iemand bellen. De drang om terug te winnen zakt, het verlies wordt alleen groter als je doorgaat.</p>`,
      "Verlies terugwinnen vergroot verlies. Elke ronde is los van de vorige.",
      "Zet op een briefje: 'Verlies terugwinnen = meer verlies.' Leg het waar je meestal gokt.",
      Q("Je hebt 5 keer verloren. Wat is de kans dat je de volgende ronde wint?", ["Groter, het moet een keer vallen", "Precies even groot als altijd", "Kleiner"], 1, "Elke ronde staat los van de vorige.")),

    L("gambling", "gam-money", "Gokken", 4, "Zet je geld op slot",
      `<p>Hoe makkelijker je bij geld en spellen kunt, hoe vaker een drang een inzet wordt. Een paar drempels maken een groot verschil.</p>
<h4>Stappen die echt werken</h4>
<ul><li><b>Gokstop via Cruks:</b> op cruksregister.nl ("Gokstop nemen") sluit je jezelf met DigiD uit bij alle legale aanbieders in Nederland, minimaal 6 maanden. Het is binnen een paar minuten actief</li><li><b>Apps en accounts weg:</b> verwijder gok-apps en sluit accounts</li><li><b>Bank:</b> zet een lage daglimiet op je pas en vraag je bank of ze goktransacties kunnen blokkeren</li><li><b>Laat meekijken:</b> iemand die je vertrouwt mag je uitgaven zien</li></ul>
<p>Hulp nodig? OpenOverGokken is gratis en anoniem, 24/7 via 0800-2400022.</p>`,
      "Cruks, apps weg, limiet op je pas en iemand die meekijkt: drempels maken van een drang geen inzet.",
      "Neem vandaag een gokstop op cruksregister.nl, of vraag je bank naar een blokkade voor goktransacties.",
      Q("Wat doet een inschrijving in Cruks?", ["Niets, je kunt gewoon doorspelen", "Je wordt uitgesloten bij alle legale aanbieders in Nederland", "Alleen je bank weet het"], 1, "Legale aanbieders moeten je weigeren zolang je ingeschreven staat.")),

    L("gambling", "gam-triggers", "Gokken", 3, "Salarisdag, sport en reclame",
      `<p>Gokdrang komt vaak op voorspelbare momenten. Als je ze kent, kun je er vooraf iets tegenover zetten.</p>
<ul><li><b>Salaris binnen:</b> zet vaste lasten en sparen automatisch op de dag dat het binnenkomt, voordat je het ziet</li><li><b>Sportwedstrijd:</b> kijk samen met iemand, of zonder telefoon in je hand</li><li><b>Reclame:</b> zet gerichte advertenties uit en ontvolg accounts van aanbieders</li><li><b>Verveling of stress:</b> heb een vervangende activiteit klaar voor dat moment</li></ul>
<p>Log je drang met de trigger erbij. Routini laat je na 10 logs zien wanneer het risico het hoogst is.</p>`,
      "Gokdrang is voorspelbaar. Plan vooraf wat je doet op salarisdag, bij sport en bij verveling.",
      "Zet je spaar- en vaste lasten-opdrachten op de dag van je salaris.",
      Q("Wat helpt het meest op salarisdag?", ["Afwachten", "Geld automatisch wegzetten voordat je het ziet", "Een kleine inzet als beloning"], 1, "Wat je niet ziet, kun je niet inzetten.")),

    /* ======================= ADHD ======================= */
    L("adhd", "adhd-brain", "ADHD", 4, "ADHD, dopamine en drang",
      `<p>Bij ADHD werkt het beloningssysteem anders: saaie taken voelen extra zwaar en snelle, sterke prikkels trekken extra hard. Daardoor is de kans op verslavingsproblemen groter, en impulsief omgaan met geld, gokken of schermen komt vaker voor.</p>
<p>Dat is <b>geen excuus, maar een verklaring</b>. En een verklaring helpt: als je weet dat je brein prikkels zoekt, kun je ervoor zorgen dat er gezonde prikkels klaarliggen.</p>
<h4>Wat dit betekent voor je aanpak</h4>
<ul><li>Vertrouw niet op onthouden: zet het in je omgeving (timers, briefjes, meldingen)</li><li>Maak stappen klein en kort: liever 2 minuten elke dag dan 30 minuten soms</li><li>Zorg voor een dopamine-menu: een lijstje snelle, gezonde prikkels voor als de drang komt</li></ul>`,
      "Een prikkelzoekend brein heeft gezonde prikkels nodig, en structuur buiten je hoofd.",
      "Maak in Tools je dopamine-menu met minstens 3 snelle opties.",
      Q("Wat werkt bij ADHD meestal beter?", ["Lange sessies als je zin hebt", "Korte, kleine stappen elke dag met hulp van timers", "Alles onthouden"], 1, "Structuur van buitenaf en kleine stappen maken het haalbaar.")),

    L("adhd", "adhd-structure", "ADHD", 3, "Structuur van buitenaf",
      `<p>Plannen, onthouden en beginnen kosten bij ADHD extra energie. De oplossing is niet harder je best doen, maar het <b>buiten je hoofd</b> zetten.</p>
<ul><li><b>Vaste momenten:</b> koppel gewoontes aan iets wat je al doet (je als-dan-plan)</li><li><b>Zichtbaar:</b> wat je moet doen ligt klaar waar je het ziet</li><li><b>Timers:</b> een timer maakt een taak eindig, en dus makkelijker om te beginnen</li><li><b>Samen doen:</b> iemand in de buurt (ook via videobellen) maakt beginnen makkelijker</li><li><b>Kort:</b> gebruik de korte versie van je ochtend- en avondroutine</li></ul>`,
      "Niet harder je best doen, maar het buiten je hoofd zetten: vaste momenten, zichtbaar, timers.",
      "Zet je ochtendroutine op de korte versie en leg vanavond klaar wat je morgen als eerste nodig hebt.",
      Q("Waarom helpt een timer bij beginnen?", ["Hij maakt de taak eindig en overzichtelijk", "Hij maakt je sneller", "Hij werkt niet"], 0, "Een eindige taak is makkelijker om aan te beginnen.")),

    L("adhd", "adhd-menu", "ADHD", 3, "Je dopamine-menu",
      `<p>Een dopamine-menu is een lijstje met gezonde dingen die je snel een prikkel geven. Als de drang komt, hoef je niet te bedenken wat je kunt doen: je kiest van het menu.</p>
<h4>Zo stel je het samen</h4>
<ul><li><b>Snel (2–5 min):</b> koud water over je gezicht, 20 squats, één nummer hard meezingen, naar buiten lopen</li><li><b>Hoofdgerecht (20+ min):</b> sporten, wandelen met muziek, gamen met een timer, iets maken</li><li><b>Erbij:</b> muziek of een podcast bij een saaie klus</li><li><b>Toetje, bewust:</b> social media of series, met een timer en niet in bed</li></ul>`,
      "Kies van een lijstje dat klaarligt, in plaats van te bedenken wat je moet doen terwijl de drang trekt.",
      "Vul je dopamine-menu in Tools aan met 2 dingen die bij jou passen.",
      Q("Wanneer gebruik je het dopamine-menu?", ["Als de drang of de verveling opkomt", "Alleen in het weekend", "Als je klaar bent met werken"], 0, "Het menu is voor het moment zelf: kiezen in plaats van bedenken.")),

    L("adhd", "adhd-help", "ADHD", 3, "Diagnose en behandeling",
      `<p>Herken je jezelf in ADHD maar heb je geen diagnose? De <b>huisarts</b> is de eerste stap. Die kan je doorverwijzen naar een psycholoog of psychiater voor onderzoek; bij volwassenen gebeurt dat vaak met een gestructureerd interview (de DIVA-5).</p>
<h4>Waarom het de moeite waard is</h4>
<p>Behandeling van ADHD, met uitleg, coaching en soms medicatie, kan de impulsiviteit en de onrust verminderen. Dat maakt het ook makkelijker om met een verslaving aan de slag te gaan.</p>
<p>Vertel bij een behandelaar ook eerlijk over gokken, porno of ander gebruik. Dan kan je behandeling daar rekening mee houden.</p>`,
      "De huisarts is de eerste stap. Behandeling van ADHD maakt ook het werken aan een verslaving makkelijker.",
      "Schrijf 3 voorbeelden op van waar ADHD je in de weg zit en neem ze mee naar je huisarts.",
      Q("Wie is meestal de eerste stap naar een ADHD-diagnose?", ["Een online test", "Je huisarts", "Een apotheek"], 1, "De huisarts kan doorverwijzen voor onderzoek.")),
  ];

  const paths = [
    { focus: "porn", id: "p-porn", e: "🛡️", t: "Vrij van porno", s: "Je brein en je avonden terug", ids: ["porn-brain", "porn-chain", "porn-env", "porn-shame"] },
    { focus: "gambling", id: "p-gam", e: "💶", t: "Grip op gokken", s: "Spel doorzien, geld op slot", ids: ["gam-brain", "gam-chase", "gam-money", "gam-triggers"] },
    { focus: "adhd", id: "p-adhd", e: "⚡", t: "ADHD & drang", s: "Werken mét je brein", ids: ["adhd-brain", "adhd-structure", "adhd-menu", "adhd-help"] }
  ];

  window.LESSONS_C = lessons;
  window.LEARN_PATHS_FOCUS = paths;
})();
