/* Static content: milestones, lessons, quotes, routines */
window.DATA = {
  REWIRE_DAYS: 90,

  milestones: [
    { d: 1, t: "Dag 1", s: "De eerste stap", e: "🌱" },
    { d: 3, t: "3 dagen", s: "Piek voorbij", e: "🔥" },
    { d: 7, t: "1 week", s: "Momentum", e: "⚡" },
    { d: 14, t: "2 weken", s: "Nieuwe routine", e: "🧠" },
    { d: 30, t: "30 dagen", s: "Een maand vrij", e: "🛡️" },
    { d: 60, t: "60 dagen", s: "Diepe verandering", e: "💎" },
    { d: 90, t: "90 dagen", s: "Rewired", e: "👑" },
    { d: 180, t: "180 dagen", s: "Halfjaar", e: "🚀" },
    { d: 365, t: "1 jaar", s: "Legende", e: "🏆" }
  ],

  triggers: ["Verveling", "Stress", "Eenzaamheid", "Social media", "Laat op bed", "Alleen thuis", "Moe", "Verdriet", "Boosheid", "Na alcohol", "Anders"],

  reasons: [
    "Meer energie en focus",
    "Betere relaties",
    "Meer zelfvertrouwen",
    "Controle over mijn leven",
    "Mentale helderheid",
    "Mijn tijd terugwinnen",
    "Mijn doelen halen",
    "Minder schaamte en angst"
  ],

  resetTasks: [
    { id: "cold", e: "🧊", t: "Koude douche", s: "2 minuten koud aan het eind" },
    { id: "sun", e: "☀️", t: "Ochtendlicht", s: "10 min buiten binnen 1 uur na opstaan" },
    { id: "move", e: "🏃", t: "Beweging", s: "20+ minuten sporten of wandelen" },
    { id: "nophone", e: "📵", t: "Telefoonvrije ochtend", s: "Eerste uur geen social media" },
    { id: "meditate", e: "🧘", t: "Meditatie", s: "Minimaal 5 minuten" },
    { id: "read", e: "📖", t: "Lezen of leren", s: "15 minuten iets opbouwends" },
    { id: "journal", e: "✍️", t: "Reflecteren", s: "Schrijf kort over je dag" },
    { id: "sleep", e: "🌙", t: "Op tijd slapen", s: "Telefoon uit de slaapkamer" }
  ],

  defaultHabits: [
    { id: "h1", e: "💪", t: "Push-ups" },
    { id: "h2", e: "💧", t: "2L water" },
    { id: "h3", e: "🙏", t: "Dankbaarheid" }
  ],

  quotes: [
    ["Discipline is kiezen tussen wat je nu wilt en wat je het meest wilt.", "Abraham Lincoln (toegeschreven)"],
    ["Wie anderen overwint is sterk. Wie zichzelf overwint is machtig.", "Lao Tzu"],
    ["We lijden vaker in onze verbeelding dan in de werkelijkheid.", "Seneca"],
    ["Een drang is een golf. Je hoeft er niet op te surfen, alleen te wachten tot hij breekt.", "Urge surfing"],
    ["Je hoeft niet perfect te zijn. Je moet alleen vandaag winnen.", "Rewired"],
    ["Het brein verandert door wat je herhaalt.", "Neuroplasticiteit"],
    ["Succes is de som van kleine inspanningen, dag in dag uit herhaald.", "Robert Collier"],
    ["De pijn van discipline weegt minder dan de pijn van spijt.", "Jim Rohn"],
    ["Je bent niet je gedachten. Je bent degene die ze opmerkt.", "Mindfulness"],
    ["Elke keer dat je nee zegt, wordt het pad makkelijker.", "Rewired"],
    ["Beheers jezelf, of iets anders zal jou beheersen.", "Stoïcijnse wijsheid"],
    ["Val zeven keer, sta acht keer op.", "Japans spreekwoord"],
    ["Wat je voedt groeit. Wat je verhongert sterft.", "Onbekend"],
    ["Rust komt niet door de drang te volgen, maar door hem voorbij te laten gaan.", "Rewired"]
  ],

  lightModes: [
    {
      id: "interrupt", name: "Pattern Interrupt", sub: "Doorbreek de drang met wisselende kleuren",
      colors: ["#ff2d55", "#2563eb", "#10b981", "#f59e0b", "#a855f7"], speed: 2.4, type: "cycle",
      swatch: "linear-gradient(135deg,#ff2d55,#2563eb,#10b981)",
      hints: ["Volg de kleuren met je ogen", "Adem rustig in door je neus", "Laat de gedachte los", "Je brein schakelt om", "Blijf kijken, blijf ademen"]
    },
    {
      id: "red", name: "Rood licht", sub: "Kalmeert je zenuwstelsel en verlaagt arousal",
      colors: ["#7f0015", "#ff1e3c"], speed: 5, type: "pulse",
      swatch: "radial-gradient(circle,#ff1e3c,#4a000c)",
      hints: ["Ontspan je schouders", "Adem in… en langzaam uit", "Je lichaam komt tot rust", "Voel je voeten op de grond"]
    },
    {
      id: "blue", name: "Focus blauw", sub: "Activeert je prefrontale cortex en alertheid",
      colors: ["#0b1a6b", "#22d3ee"], speed: 4, type: "pulse",
      swatch: "radial-gradient(circle,#22d3ee,#0b1a6b)",
      hints: ["Scherp je aandacht", "Denk aan je doel", "Jij bent aan het stuur", "Helder en kalm"]
    },
    {
      id: "bilateral", name: "Bilateraal", sub: "Volg het licht van links naar rechts (EMDR-stijl)",
      colors: ["#a78bfa", "#22d3ee"], speed: 1.2, type: "bilateral",
      swatch: "linear-gradient(90deg,#a78bfa,#22d3ee)",
      hints: ["Volg alleen met je ogen", "Houd je hoofd stil", "Laat de spanning wegzakken", "Het beeld verliest kracht"]
    },
    {
      id: "aurora", name: "Aurora", sub: "Langzaam verlopende kleuren voor diepe ontspanning",
      colors: ["#10b981", "#22d3ee", "#7c5cff", "#ec4899"], speed: 6, type: "aurora",
      swatch: "linear-gradient(135deg,#10b981,#7c5cff,#ec4899)",
      hints: ["Laat alles even los", "Er is niets dat je nu moet doen", "Adem mee met het licht", "Rust"]
    }
  ],

  breathPatterns: [
    { id: "box", name: "Box breathing", sub: "4-4-4-4 · Navy SEAL techniek voor kalmte", steps: [["Adem in", 4, "in"], ["Vasthouden", 4, "hold"], ["Adem uit", 4, "out"], ["Vasthouden", 4, "holdOut"]], rounds: 6 },
    { id: "478", name: "4-7-8", sub: "Diepe ontspanning, helpt bij slapen", steps: [["Adem in", 4, "in"], ["Vasthouden", 7, "hold"], ["Adem uit", 8, "out"]], rounds: 4 },
    { id: "sigh", name: "Fysiologische zucht", sub: "Snelste manier om stress te verlagen", steps: [["Adem in", 2, "in"], ["Nog een keer in", 1, "in2"], ["Lang uit", 6, "out"]], rounds: 8 },
    { id: "coherent", name: "Coherent", sub: "5.5 in · 5.5 uit · balans voor je hart", steps: [["Adem in", 5.5, "in"], ["Adem uit", 5.5, "out"]], rounds: 10 }
  ],

  meditations: [
    {
      id: "surf", name: "Urge surfing", sub: "Rijd de golf uit zonder toe te geven", min: 5, e: "🌊",
      prompts: [
        "Ga comfortabel zitten en sluit eventueel je ogen.",
        "Merk de drang op. Je hoeft er niets mee te doen.",
        "Waar voel je hem in je lichaam? Borst, buik, handen?",
        "Beschrijf het gevoel: warm, strak, onrustig?",
        "Stel je voor dat het een golf is die opbouwt.",
        "Adem in de sensatie. Duw niet weg, volg niet.",
        "Golven pieken en zakken altijd weer weg.",
        "Merk op hoe het gevoel verandert terwijl je ademt.",
        "Je bent de surfer, niet de golf.",
        "Kijk hoe de golf kleiner wordt.",
        "Elke keer dat je dit doet, wordt de golf zwakker.",
        "Goed gedaan. Je hebt de golf uitgereden."
      ]
    },
    {
      id: "body", name: "Body scan", sub: "Verplaats je aandacht door je lichaam", min: 10, e: "🫧",
      prompts: [
        "Adem een paar keer diep in en uit.",
        "Breng je aandacht naar je voeten.",
        "Voel je kuiten en knieën. Laat ze zwaar worden.",
        "Je bovenbenen en heupen ontspannen.",
        "Je buik gaat zacht op en neer met je adem.",
        "Voel je borst. Je hart dat rustig klopt.",
        "Laat je schouders zakken, weg van je oren.",
        "Je armen, handen en vingers worden warm en zwaar.",
        "Ontspan je kaak, je tong, je voorhoofd.",
        "Voel je hele lichaam als één geheel.",
        "Blijf hier nog even. Er is niets te doen.",
        "Kom langzaam terug. Beweeg je vingers en tenen."
      ]
    },
    {
      id: "calm", name: "Rust in je hoofd", sub: "Laat gedachten voorbij drijven", min: 5, e: "☁️",
      prompts: [
        "Richt je aandacht op je ademhaling.",
        "Voel de lucht koel binnenkomen en warm naar buiten gaan.",
        "Gedachten komen op. Dat is normaal.",
        "Zie ze als wolken die voorbij drijven.",
        "Benoem ze zacht: 'denken'. En keer terug naar je adem.",
        "Je hoeft niets vast te houden.",
        "Elke terugkeer naar je adem is een herhaling voor je brein.",
        "Rust is er altijd, onder de gedachten.",
        "Blijf ademen. Blijf aanwezig.",
        "Mooi. Neem deze rust mee in je dag."
      ]
    },
    {
      id: "free", name: "Stille timer", sub: "Alleen jij, je adem en ambient geluid", min: 10, e: "⏳",
      prompts: []
    }
  ],

  lessons: [
    {
      id: "l1", cat: "Wetenschap", min: 3, t: "Wat dopamine écht doet",
      body: `<p>Dopamine is geen 'geluksstofje'. Het is het molecuul van <b>verlangen en verwachting</b>. Het zegt tegen je brein: <i>dit is belangrijk, doe het nog een keer</i>.</p>
<p>Supernormale prikkels – eindeloos nieuwe, intense beelden met één swipe – geven pieken die in de natuur nooit voorkomen. Je brein past zich aan door het aantal dopaminereceptoren te verlagen.</p>
<h4>Het gevolg</h4>
<ul><li>Normale dingen voelen saai (sport, werk, gesprekken)</li><li>Je hebt steeds meer of extremere prikkels nodig</li><li>Je motivatie en focus dalen</li></ul>
<p>Het goede nieuws: dit proces is <b>omkeerbaar</b>. Receptoren herstellen zich wanneer de overprikkeling stopt. Daarom is consistentie belangrijker dan perfectie.</p>`
    },
    {
      id: "l2", cat: "Wetenschap", min: 4, t: "Neuroplasticiteit: waarom 90 dagen?",
      body: `<p>Je brein is plastisch: verbindingen die je vaak gebruikt worden sterker, verbindingen die je niet gebruikt verzwakken ("use it or lose it").</p>
<p>Elke keer dat je een drang voelt en <b>niet</b> toegeeft, verzwak je het oude pad een beetje en versterk je het pad van zelfbeheersing.</p>
<h4>De fases</h4>
<ul><li><b>Dag 1–14:</b> ontwenning. Drang, onrust, slechte slaap. Dit is normaal.</li><li><b>Dag 15–45:</b> de 'flatline'. Soms weinig energie of libido. Dit is herstel, geen probleem.</li><li><b>Dag 45–90:</b> helderheid, meer energie, stabielere stemming.</li></ul>
<p>90 dagen is geen magisch getal, maar een realistisch venster waarin de meeste mensen duidelijke verandering merken.</p>`
    },
    {
      id: "l3", cat: "Technieken", min: 3, t: "Urge surfing",
      body: `<p>Een drang voelt alsof hij eeuwig duurt, maar onderzoek laat zien dat de meeste drang binnen <b>15–20 minuten</b> piekt en weer zakt.</p>
<h4>Zo doe je het</h4>
<ul><li><b>Merk op:</b> "Ik voel een drang."</li><li><b>Lokaliseer:</b> waar voel je het in je lichaam?</li><li><b>Adem:</b> adem rustig in de sensatie.</li><li><b>Observeer:</b> zie hoe het verandert, sterker en weer zwakker.</li></ul>
<p>Je vecht niet tegen de golf en je volgt hem niet. Je surft erop tot hij breekt. Gebruik de Urge surfing meditatie in Tools om dit te oefenen.</p>`
    },
    {
      id: "l4", cat: "Technieken", min: 3, t: "Ken je triggers: HALT",
      body: `<p>De meeste terugvallen gebeuren niet willekeurig. Ze volgen een patroon. Gebruik <b>HALT</b> om te checken hoe je ervoor staat:</p>
<ul><li><b>H</b>ungry – Honger</li><li><b>A</b>ngry – Boos of gefrustreerd</li><li><b>L</b>onely – Eenzaam</li><li><b>T</b>ired – Moe</li></ul>
<p>Voeg daar verveling en late avonden alleen met je telefoon aan toe en je hebt de grootste risicomomenten.</p>
<h4>Actie</h4>
<p>Log elke drang in de app. Na een paar weken zie je in Voortgang precies wanneer en waarom je kwetsbaar bent. Dan kun je die momenten vooraf plannen.</p>`
    },
    {
      id: "l5", cat: "Technieken", min: 2, t: "De 10-minutenregel",
      body: `<p>Als een drang opkomt, beloof jezelf niet 'nooit meer'. Zeg alleen: <b>"Ik wacht 10 minuten."</b></p>
<p>In die 10 minuten doe je iets fysieks: koud water in je gezicht, 20 push-ups, naar buiten lopen, de paniekknop gebruiken.</p>
<p>Na 10 minuten is de drang bijna altijd zwakker. En als dat nog niet zo is: nog 10 minuten. Kleine overwinningen stapelen zich op.</p>`
    },
    {
      id: "l6", cat: "Omgeving", min: 3, t: "Ontwerp je omgeving",
      body: `<p>Wilskracht is beperkt. Een goede omgeving is dat niet. Maak het moeilijk om terug te vallen en makkelijk om het goede te doen.</p>
<ul><li>Telefoon 's nachts <b>buiten de slaapkamer</b> opladen</li><li>Contentfilter aan via Schermtijd (zie Tools → Blocker)</li><li>Social media apps die triggeren verwijderen of verbergen</li><li>Laptop alleen in gedeelde ruimtes gebruiken</li><li>Een vaste 'uit'-tijd voor schermen</li></ul>
<p>Elke drempel die je toevoegt geeft je prefrontale cortex tijd om in te grijpen.</p>`
    },
    {
      id: "l7", cat: "Mindset", min: 3, t: "Een terugval is geen mislukking",
      body: `<p>Het 'abstinence violation effect': na één misstap denken 'het is toch al verpest' en helemaal loslaten. Dit is de échte valkuil.</p>
<p>Je hersenen verliezen hun vooruitgang <b>niet</b> door één terugval. De verbindingen die je hebt opgebouwd blijven grotendeels bestaan.</p>
<h4>Na een terugval</h4>
<ul><li>Wees mild. Schaamte voedt de cyclus.</li><li>Log wat er gebeurde: tijd, trigger, gevoel.</li><li>Leer één ding en pas je plan aan.</li><li>Begin direct opnieuw, niet 'maandag'.</li></ul>`
    },
    {
      id: "l8", cat: "Wetenschap", min: 3, t: "Waarom koude douches werken",
      body: `<p>Blootstelling aan kou verhoogt je dopamine tot <b>250%</b> boven je basisniveau, en dat effect houdt uren aan zonder de crash die supernormale prikkels veroorzaken.</p>
<p>Daarnaast train je iets belangrijks: <b>vrijwillig ongemak verdragen</b>. Dat is precies de vaardigheid die je nodig hebt als een drang opkomt.</p>
<p>Begin met 30 seconden koud aan het einde van je douche en bouw op naar 2 minuten.</p>`
    },
    {
      id: "l9", cat: "Mindset", min: 2, t: "Identiteit boven doelen",
      body: `<p>"Ik probeer te stoppen" houdt je in de oude identiteit. "Ik ben iemand die dit niet doet" verandert hoe je beslissingen neemt.</p>
<p>Elke dag clean is een <b>stem</b> voor de persoon die je wilt worden. Je hoeft niet in één keer te veranderen, je moet alleen vandaag weer stemmen.</p>`
    },
    {
      id: "l10", cat: "Technieken", min: 3, t: "Vervang, onderdruk niet",
      body: `<p>Een gewoonte laat een gat achter. Als je dat gat niet vult, trekt het oude gedrag je terug.</p>
<h4>Vul het met</h4>
<ul><li><b>Beweging:</b> sport verbrandt spanning en geeft gezonde dopamine</li><li><b>Verbinding:</b> bel een vriend, spreek af</li><li><b>Creatie:</b> muziek, tekenen, bouwen, schrijven</li><li><b>Leren:</b> een skill waar je trots op kunt zijn</li></ul>
<p>Gebruik de Gewoontetracker om 2–3 vervangende gewoontes dagelijks te doen.</p>`
    }
  ]
};
