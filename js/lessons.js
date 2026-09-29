/* Learning content: lessons (with takeaway, assignment and quiz), learning paths and daily boosts.
   Old lesson ids l1–l10 are kept so earlier progress stays valid. */
(function () {
  const L = (id, cat, min, t, body, take, act, quiz) => ({ id, cat, min, t, body, take, act, quiz });
  const Q = (q, a, c, why) => ({ q, a, c, why });

  const lessons = [
    /* ======================= WETENSCHAP ======================= */
    L("l1", "Wetenschap", 3, "Wat dopamine écht doet",
      `<p>Dopamine is geen 'geluksstofje'. Het is het molecuul van <b>verlangen en verwachting</b>. Het zegt tegen je brein: <i>dit is belangrijk, doe het nog een keer</i>.</p>
<p>Supernormale prikkels (eindeloos nieuwe, intense beelden met één swipe) geven pieken die in de natuur nooit voorkomen. Je brein past zich aan door minder gevoelig te worden voor dopamine.</p>
<h4>Het gevolg</h4>
<ul><li>Normale dingen voelen saai: sport, werk, gesprekken</li><li>Je hebt steeds meer of extremere prikkels nodig</li><li>Je motivatie en focus dalen</li></ul>
<p>Het goede nieuws: dit proces is <b>omkeerbaar</b>. Je gevoeligheid herstelt zich wanneer de overprikkeling stopt. Daarom is consistentie belangrijker dan perfectie.</p>`,
      "Dopamine gaat over willen, niet over genieten. Minder overprikkeling = normale dingen worden weer leuk.",
      "Doe vandaag één 'saaie' activiteit (wandelen, lezen) zonder telefoon en merk op hoe het na 10 minuten voelt.",
      Q("Waar gaat dopamine vooral over?", ["Genot en geluk", "Verlangen en verwachting", "Slaap en rust"], 1, "Dopamine drijft het willen, de jacht. Het genieten zelf loopt via andere systemen.")),

    L("l2", "Wetenschap", 4, "Neuroplasticiteit: waarom 90 dagen?",
      `<p>Je brein is plastisch: verbindingen die je vaak gebruikt worden sterker, verbindingen die je niet gebruikt verzwakken ("use it or lose it").</p>
<p>Elke keer dat je een drang voelt en <b>niet</b> toegeeft, verzwak je het oude pad een beetje en versterk je het pad van zelfbeheersing.</p>
<h4>Hoe lang duurt het?</h4>
<p>Onderzoek naar gewoontevorming (Lally e.a., 2010) vond dat een nieuwe gewoonte gemiddeld <b>66 dagen</b> nodig had om automatisch te worden, met een spreiding van 18 tot 254 dagen. 90 dagen is geen magisch getal, maar een realistisch venster waarin de meeste mensen duidelijke verandering merken.</p>
<ul><li><b>Week 1–2:</b> ontwenning. Drang, onrust, slechter slapen. Normaal.</li><li><b>Week 3–6:</b> vaak een dal met weinig energie of zin. Dit hoort bij herstel.</li><li><b>Week 7–13:</b> meer helderheid, energie en een stabielere stemming.</li></ul>`,
      "Elke weerstane drang is een herhaling voor je brein. Verandering kost weken, niet dagen.",
      "Kijk op je Voortgang-tab hoeveel drang je al weerstond. Elke keer telde.",
      Q("Hoeveel dagen duurde het gemiddeld voordat een nieuwe gewoonte automatisch werd?", ["21 dagen", "66 dagen", "365 dagen"], 1, "De bekende '21 dagen' is een mythe. Gemiddeld 66, maar dat verschilt sterk per persoon.")),

    L("sci-super", "Wetenschap", 3, "Supernormale prikkels",
      `<p>In de jaren 50 ontdekte bioloog Niko Tinbergen iets vreemds: vogels broedden liever op <b>nep-eieren die groter en feller gekleurd waren</b> dan hun eigen eieren. Een overdreven versie van iets natuurlijks kaapte hun instinct.</p>
<p>Mensen zijn niet anders. Junkfood (meer suiker en vet dan ooit in de natuur), eindeloze feeds en expliciete content zijn <b>supernormale prikkels</b>: ze zijn ontworpen om harder te triggeren dan de echte wereld ooit kan.</p>
<h4>Waarom dit belangrijk is</h4>
<p>Het probleem is niet dat jij zwak bent. Het probleem is dat je brein, gebouwd voor een wereld van schaarste, het opneemt tegen producten die geoptimaliseerd zijn door duizenden ingenieurs.</p>
<p>Dat verklaart ook waarom <b>omgeving</b> belangrijker is dan wilskracht: je wint niet door harder te vechten, maar door minder vaak de strijd aan te gaan.</p>`,
      "Je vecht niet tegen jezelf, maar tegen iets dat ontworpen is om je te kapen. Verklein het slagveld.",
      "Noem 3 supernormale prikkels in je eigen leven en haal er vandaag één uit je directe omgeving.",
      Q("Wat liet het onderzoek met vogels en nep-eieren zien?", ["Vogels herkennen hun eigen eieren altijd", "Een overdreven prikkel kan een natuurlijk instinct kapen", "Vogels broeden liever niet"], 1, "Groter en feller won het van echt. Precies zoals feeds en junkfood het van het gewone leven winnen.")),

    L("sci-want", "Wetenschap", 3, "Willen is niet hetzelfde als leuk vinden",
      `<p>Neurowetenschappers Kent Berridge en Terry Robinson ontdekten dat het brein twee aparte systemen heeft: <b>willen</b> (wanting) en <b>leuk vinden</b> (liking).</p>
<p>Bij verslavend gedrag gebeurt iets vreemds: het <b>willen</b> wordt steeds sterker, terwijl het <b>leuk vinden</b> gelijk blijft of zelfs afneemt. Je verlangt er heftig naar, maar achteraf voelt het leeg.</p>
<h4>Herken je dit?</h4>
<ul><li>Een enorme drang vooraf</li><li>Een korte piek tijdens</li><li>Leegte, spijt of vermoeidheid erna</li></ul>
<p>Dit inzicht is bevrijdend: <b>de drang liegt</b>. Hij belooft veel meer dan hij levert. Als je dat doorhebt, wordt het makkelijker om hem te laten passeren.</p>`,
      "De drang belooft meer dan hij levert. Willen groeit, genieten niet.",
      "Schrijf na de volgende drang in je dagboek op hoe je je voelde vóór en hoe je je voelde toen hij voorbij was.",
      Q("Wat gebeurt er bij verslavend gedrag met 'willen' en 'leuk vinden'?", ["Beide worden sterker", "Willen wordt sterker, leuk vinden niet", "Leuk vinden wordt sterker, willen niet"], 1, "Daarom voelt het achteraf zo leeg: het verlangen groeit, het plezier niet.")),

    L("sci-pfc", "Wetenschap", 3, "Je prefrontale cortex: de rem",
      `<p>Achter je voorhoofd zit de <b>prefrontale cortex</b>: het deel van je brein dat plant, afweegt en 'nee' zegt. Het is je rem.</p>
<p>Het probleem: deze rem werkt slechter als je <b>moe, gestrest, hongerig of eenzaam</b> bent. Dan neemt het oudere, snellere deel van je brein het over, het deel dat alleen 'nu' kent.</p>
<h4>Zo versterk je de rem</h4>
<ul><li><b>Slaap:</b> na een slechte nacht reageert je emotionele brein veel sterker en is de rem zwakker</li><li><b>Beweging:</b> verbetert de doorbloeding en de werking van dit gebied</li><li><b>Meditatie:</b> traint letterlijk het 'opmerken zonder reageren'</li><li><b>Pauze inbouwen:</b> elke seconde tussen drang en actie geeft de rem tijd om in te grijpen</li></ul>`,
      "Je rem is een spier die moe kan worden. Zorg voor slaap, beweging en pauzes.",
      "Ga vanavond 30 minuten eerder slapen dan normaal. Telefoon buiten de slaapkamer.",
      Q("Wanneer werkt je prefrontale cortex (de rem) het slechtst?", ["Na een goede nacht slaap", "Als je moe, gestrest of eenzaam bent", "Na het sporten"], 1, "Daarom zijn late avonden alleen met je telefoon het grootste risico.")),

    L("sci-stress", "Wetenschap", 3, "Stress, cortisol en drang",
      `<p>Veel drang heeft niets met seks of verlangen te maken, maar met <b>spanning</b>. Stress verhoogt cortisol, en je brein zoekt de snelste weg naar opluchting.</p>
<p>Wat je dan eigenlijk zoekt is geen prikkel, maar <b>ontspanning</b>. De oude gewoonte was simpelweg je snelste knop.</p>
<h4>Snellere, betere knoppen</h4>
<ul><li><b>Fysiologische zucht:</b> twee keer inademen door je neus, lang uit door je mond. Binnen een minuut rustiger.</li><li><b>Beweging:</b> 20 push-ups of een wandeling verbruikt de stresshormonen.</li><li><b>Koud water:</b> in je gezicht of onder de douche zet je zenuwstelsel om.</li><li><b>Praten:</b> iemand bellen verlaagt stress sneller dan je denkt.</li></ul>`,
      "Veel drang is eigenlijk stress die opluchting zoekt. Geef je lichaam een betere uitweg.",
      "Doe vandaag bij de eerste spanning 3× de fysiologische zucht (Tools → Ademhaling).",
      Q("Wat zoekt je brein vaak eigenlijk als je drang voelt tijdens stress?", ["Nieuwe prikkels", "Opluchting van spanning", "Slaap"], 1, "Als je dat herkent, kun je bewust een gezondere uitweg kiezen.")),

    L("sci-loop", "Wetenschap", 4, "De gewoontelus: prikkel, routine, beloning",
      `<p>Elke gewoonte volgt dezelfde lus (beschreven door onder anderen Charles Duhigg en James Clear):</p>
<ul><li><b>Prikkel (cue):</b> een moment, plek, gevoel of persoon</li><li><b>Routine:</b> het gedrag zelf</li><li><b>Beloning:</b> wat je er eigenlijk uit haalt (ontspanning, afleiding, troost)</li></ul>
<p>Je kunt een gewoonte niet wissen, maar wel <b>ombouwen</b>: houd de prikkel en de beloning, vervang de routine.</p>
<h4>Voorbeeld</h4>
<p><i>Prikkel:</i> alleen op bed, 23:00, verveeld. <i>Oude routine:</i> telefoon. <i>Beloning:</i> afleiding en ontspanning.<br><i>Nieuwe routine:</i> telefoon aan de lader in de keuken, boek op je kussen. Zelfde prikkel, zelfde behoefte aan ontspanning, andere route.</p>`,
      "Wis de gewoonte niet: bouw hem om. Zelfde prikkel, andere routine, zelfde beloning.",
      "Schrijf je grootste risicomoment op als: prikkel → oude routine → beloning. Bedenk één nieuwe routine.",
      Q("Wat verander je als je een gewoonte 'ombouwt'?", ["De prikkel", "De routine", "De beloning"], 1, "Prikkels kun je niet altijd vermijden. Door de routine te vervangen, krijg je dezelfde beloning op een gezonde manier.")),

    L("sci-sleep", "Wetenschap", 3, "Slaap: je geheime wapen",
      `<p>Na een nacht slecht slapen reageert je emotionele brein (de amygdala) in onderzoek tot wel <b>60% sterker</b> op negatieve prikkels, terwijl de verbinding met je rem zwakker wordt.</p>
<p>Vertaald: moe zijn maakt je prikkelbaarder, impulsiever en gevoeliger voor drang. Veel terugvallen gebeuren niet voor niets laat op de avond.</p>
<h4>Slaap-basics die het verschil maken</h4>
<ul><li>Vaste bedtijd, ook in het weekend</li><li>Telefoon buiten de slaapkamer (koop een simpele wekker)</li><li>Geen schermen in het laatste halfuur</li><li>Koele, donkere kamer</li><li>Geen cafeïne na 14:00</li></ul>`,
      "Slaap is geen luxe maar zelfbeheersing. Moe = kwetsbaar.",
      "Zet de gewoonte 'Op tijd naar bed' aan en kies een haalbare bedtijd.",
      Q("Wat doet slaaptekort met je brein?", ["Je wordt rustiger", "Je emotionele reacties worden sterker en je rem zwakker", "Niets meetbaars"], 1, "Daarom is slaap een van de sterkste beschermers tegen terugval.")),

    L("sci-tol", "Wetenschap", 3, "Gewenning: waarom het steeds 'meer' moet",
      `<p>Je brein went aan alles wat vaak en intens gebeurt. Dat heet <b>tolerantie</b>. Wat eerst spannend was, wordt normaal, en dan is er iets nieuws of heftigers nodig voor hetzelfde effect.</p>
<p>Veel mensen merken dat hun smaak in de loop van de tijd verschuift naar content waar ze vroeger niet naar zochten. Dat zegt weinig over wie je bent, en veel over hoe gewenning werkt.</p>
<h4>De andere kant op</h4>
<p>Gewenning werkt ook omgekeerd. Na een periode zonder overprikkeling worden gewone dingen weer intenser: muziek, eten, een gesprek, aanraking. Veel mensen omschrijven het als 'de kleuren komen terug'.</p>`,
      "Tolerantie verklaart het 'steeds meer'. Een pauze zet de thermostaat terug.",
      "Merk vandaag bewust één klein genot op: eten, muziek of een zonnestraal. Proef het echt.",
      Q("Wat gebeurt er na een periode zonder overprikkeling?", ["Alles voelt saaier", "Gewone dingen worden weer intenser", "Er verandert niets"], 1, "Je gevoeligheid herstelt, waardoor kleine dingen weer genoeg zijn.")),

    L("l8", "Wetenschap", 3, "Waarom koude douches werken",
      `<p>In een Tsjechisch onderzoek (Šrámek e.a., 2000) stegen de dopamineniveaus van deelnemers in koud water tot zo'n <b>250%</b> van hun basisniveau, en dat effect hield lang aan zonder de crash die supernormale prikkels geven.</p>
<p>Daarnaast train je iets belangrijks: <b>vrijwillig ongemak verdragen</b>. Dat is precies de vaardigheid die je nodig hebt als een drang opkomt.</p>
<p>Begin met 30 seconden koud aan het einde van je douche en bouw op naar 2 minuten. Adem rustig en lang uit: je leert je lichaam kalm te blijven onder druk.</p>`,
      "Koud water geeft een gezonde dopamineboost en traint ongemak verdragen.",
      "Eindig je douche vandaag met 30 seconden koud. Adem lang uit.",
      Q("Welke vaardigheid train je vooral met een koude douche?", ["Snelheid", "Vrijwillig ongemak verdragen", "Kracht"], 1, "Hetzelfde spiertje dat je gebruikt om een drang te laten passeren.")),

    L("sci-withdraw", "Wetenschap", 3, "Ontwenning: wat is normaal?",
      `<p>Stoppen met een diepgewortelde gewoonte kan zich lichamelijk en mentaal laten voelen. Veel gerapporteerde ervaringen in de eerste weken:</p>
<ul><li>Onrust, prikkelbaarheid of somberheid</li><li>Slechter of juist meer slapen</li><li>Sterke drang op vaste momenten</li><li>Heftige dromen</li><li>Periodes met weinig energie of zin</li></ul>
<p>Dit is <b>geen teken dat het niet werkt</b>, maar juist dat je brein zich aan het aanpassen is. Het gaat in golven en wordt minder.</p>
<p>Houd het wel in de gaten: als somberheid lang aanhoudt of zwaar wordt, praat erover met je huisarts. Hulp zoeken is sterk, niet zwak.</p>`,
      "Ongemak in de eerste weken is een teken van aanpassing, niet van falen.",
      "Log vandaag je stemming in de check-in, zodat je ziet dat het in golven gaat.",
      Q("Wat betekent onrust in de eerste weken meestal?", ["Dat stoppen niet werkt", "Dat je brein zich aanpast", "Dat je het verkeerd doet"], 1, "Het is een overgangsfase die bij de meeste mensen afneemt.")),

    /* ======================= TECHNIEKEN ======================= */
    L("l3", "Technieken", 3, "Urge surfing",
      `<p>Een drang voelt alsof hij eeuwig duurt, maar in de praktijk <b>piekt en zakt hij</b> meestal binnen een half uur. Psycholoog Alan Marlatt maakte er een techniek van: urge surfing.</p>
<h4>Zo doe je het</h4>
<ul><li><b>Merk op:</b> "Ik voel een drang."</li><li><b>Lokaliseer:</b> waar voel je het in je lichaam?</li><li><b>Adem:</b> adem rustig in de sensatie.</li><li><b>Observeer:</b> zie hoe het verandert, sterker en weer zwakker.</li></ul>
<p>Je vecht niet tegen de golf en je volgt hem niet. Je surft erop tot hij breekt. Oefen met de Urge surfing-meditatie in Tools.</p>`,
      "Een drang is een golf: hij piekt en zakt. Je hoeft hem alleen uit te zitten.",
      "Doe vandaag de Urge surfing-meditatie (5 min), ook zonder drang. Oefenen als het rustig is werkt het best.",
      Q("Wat doe je bij urge surfing met de drang?", ["Er hard tegen vechten", "Hem observeren tot hij zakt", "Er meteen aan toegeven"], 1, "Niet vechten, niet volgen: observeren en ademen.")),

    L("l4", "Technieken", 3, "Ken je triggers: HALT",
      `<p>De meeste terugvallen gebeuren niet willekeurig. Ze volgen een patroon. Gebruik <b>HALT</b> om te checken hoe je ervoor staat:</p>
<ul><li><b>H</b>ungry: honger</li><li><b>A</b>ngry: boos of gefrustreerd</li><li><b>L</b>onely: eenzaam</li><li><b>T</b>ired: moe</li></ul>
<p>Voeg daar verveling en late avonden alleen met je telefoon aan toe en je hebt de grootste risicomomenten.</p>
<h4>Actie</h4>
<p>Log elke drang in de app. Na een paar weken zie je in Voortgang precies wanneer en waarom je kwetsbaar bent. Dan kun je die momenten vooraf plannen.</p>`,
      "Honger, boos, eenzaam of moe? Los dat eerst op, dan zakt de drang vaak vanzelf.",
      "Stel jezelf vandaag 3× de HALT-vraag. Zet er een reminder voor als dat helpt.",
      Q("Waar staat de L in HALT voor?", ["Lazy (lui)", "Lonely (eenzaam)", "Late (laat)"], 1, "Eenzaamheid is een van de sterkste triggers.")),

    L("l5", "Technieken", 2, "De 10-minutenregel",
      `<p>Als een drang opkomt, beloof jezelf niet 'nooit meer'. Zeg alleen: <b>"Ik wacht 10 minuten."</b></p>
<p>In die 10 minuten doe je iets fysieks: koud water in je gezicht, 20 push-ups, naar buiten lopen of de noodknop gebruiken.</p>
<p>Na 10 minuten is de drang bijna altijd zwakker. En als dat nog niet zo is: nog 10 minuten. Kleine overwinningen stapelen zich op.</p>`,
      "Niet 'nooit meer', maar 'nu even niet'. Tien minuten is altijd haalbaar.",
      "Gebruik bij de volgende drang de noodknop en tel 10 minuten af.",
      Q("Wat beloof je jezelf bij de 10-minutenregel?", ["Nooit meer", "Nu 10 minuten wachten", "Morgen stoppen"], 1, "Een kleine, haalbare belofte werkt beter dan een grote.")),

    L("tec-ifthen", "Technieken", 3, "Als-dan-plannen",
      `<p>Een van de best onderzochte technieken in de psychologie is het <b>als-dan-plan</b> (implementatie-intentie, Peter Gollwitzer). Tientallen studies laten zien dat het de kans dat je iets echt doet flink vergroot.</p>
<p>In plaats van "ik ga minder op mijn telefoon" zeg je: <b>"Als ik om 23:00 in bed lig, dan leg ik mijn telefoon in de keuken."</b></p>
<h4>Waarom het werkt</h4>
<p>Je beslist vooraf, als je nog helder bent. Op het moment zelf hoeft je moeie brein niet meer na te denken: het plan rolt automatisch af.</p>
<h4>Voorbeelden</h4>
<ul><li>Als ik een drang voel, dan doe ik direct 20 push-ups.</li><li>Als ik me verveel, dan bel ik iemand of ga ik naar buiten.</li><li>Als ik alleen thuis ben, dan werk ik met mijn laptop in de woonkamer.</li></ul>`,
      "Beslis vooraf: 'Als X gebeurt, dan doe ik Y.' Je moeie brein volgt gewoon het plan.",
      "Schrijf 3 als-dan-plannen op voor jouw grootste risicomomenten (in je dagboek).",
      Q("Wanneer maak je een als-dan-plan het best?", ["Op het moment van de drang", "Vooraf, als je helder bent", "Na een terugval"], 1, "Dan hoeft je moeie brein op het moment zelf niets meer te beslissen.")),

    L("tec-tape", "Technieken", 2, "Speel de film door",
      `<p>Een drang laat je alleen het begin van de film zien: de spanning, de opluchting. <b>Speel de film door tot het einde.</b></p>
<p>Stel jezelf voor: het is een uur later. Hoe voel je je? Waarschijnlijk leeg, moe, teleurgesteld, je streak weg, de avond verspild.</p>
<p>Speel daarna de andere film: je liet de drang passeren. Het is een uur later. Je bent trots, je slaapt goed en morgen word je wakker met een streak die nog loopt.</p>
<p>Welke film kies je?</p>`,
      "Kijk verder dan de eerste minuut: hoe voel je je over een uur?",
      "Schrijf beide 'films' één keer uit in je dagboek, dan kun je ze bij een drang oproepen.",
      Q("Wat laat een drang je meestal zien?", ["Alleen het begin van de film", "Het hele verhaal", "De gevolgen"], 0, "Het einde (leegte en spijt) laat hij bewust weg.")),

    L("tec-breath", "Technieken", 3, "Adem je zenuwstelsel om",
      `<p>Je ademhaling is de enige knop van je zenuwstelsel die je direct kunt bedienen. Een lange uitademing activeert je 'rust'-stand.</p>
<h4>De fysiologische zucht</h4>
<p>Adem twee keer in door je neus (een volle teug en er dan nog een klein beetje bovenop) en adem lang en langzaam uit door je mond. In een Stanford-studie (Balban e.a., 2023) verbeterde 5 minuten per dag van deze 'cyclische zucht' de stemming meer dan mindfulness-meditatie.</p>
<h4>Box breathing</h4>
<p>4 tellen in, 4 vast, 4 uit, 4 vast. Gebruikt door onder anderen militairen om kalm te blijven onder druk.</p>
<p>Beide vind je onder Tools → Ademhaling.</p>`,
      "Lang uitademen = rem op je zenuwstelsel. Twee keer in, lang uit.",
      "Doe vandaag 5 minuten fysiologische zucht (Tools → Ademhaling).",
      Q("Wat activeert vooral de 'rust'-stand van je lichaam?", ["Snel inademen", "Een lange uitademing", "Adem inhouden"], 1, "Een lange uitademing remt je hartslag en zenuwstelsel af.")),

    L("tec-ground", "Technieken", 2, "5-4-3-2-1: terug naar het nu",
      `<p>Een drang trekt je in je hoofd, in fantasie. Grounding haalt je terug naar de werkelijkheid. Noem hardop of in gedachten:</p>
<ul><li><b>5</b> dingen die je ziet</li><li><b>4</b> dingen die je voelt (je voeten op de grond, je kleren)</li><li><b>3</b> dingen die je hoort</li><li><b>2</b> dingen die je ruikt</li><li><b>1</b> ding dat je proeft</li></ul>
<p>Het duurt een minuut en het breekt de automatische piloot. Combineer het met opstaan en van ruimte wisselen voor extra effect.</p>`,
      "Zintuigen in het nu = minder ruimte voor fantasie in je hoofd.",
      "Oefen 5-4-3-2-1 nu meteen, terwijl je dit leest.",
      Q("Wat is het doel van 5-4-3-2-1?", ["Tellen oefenen", "Je aandacht terugbrengen naar het nu", "In slaap vallen"], 1, "Het haalt je uit je hoofd en terug in je omgeving.")),

    L("l10", "Technieken", 3, "Vervang, onderdruk niet",
      `<p>Een gewoonte laat een gat achter. Als je dat gat niet vult, trekt het oude gedrag je terug.</p>
<h4>Vul het met</h4>
<ul><li><b>Beweging:</b> sport verbrandt spanning en geeft gezonde dopamine</li><li><b>Verbinding:</b> bel een vriend, spreek af</li><li><b>Creatie:</b> muziek, tekenen, bouwen, schrijven</li><li><b>Leren:</b> een vaardigheid waar je trots op kunt zijn</li></ul>
<p>Gebruik de Gewoontetracker om 2–3 vervangende gewoontes dagelijks te doen.</p>`,
      "Een leeg gat trekt je terug. Vul je tijd met iets dat je echt iets oplevert.",
      "Voeg één vervangende gewoonte toe (bijv. Lezen of Sporten) via Gewoontes → ＋ Nieuw.",
      Q("Waarom werkt alleen 'stoppen' vaak niet?", ["Omdat het te makkelijk is", "Omdat er een leeg gat achterblijft", "Omdat het te snel gaat"], 1, "Vul het gat met iets beters, anders vult de oude gewoonte het weer.")),

    L("tec-stack", "Technieken", 3, "Gewoontes stapelen",
      `<p>Nieuwe gewoontes blijven beter hangen als je ze vastmaakt aan iets wat je al elke dag doet. James Clear noemt dit <b>habit stacking</b>:</p>
<p><b>"Na [huidige gewoonte] doe ik [nieuwe gewoonte]."</b></p>
<ul><li>Na het tandenpoetsen mediteer ik 5 minuten.</li><li>Na mijn eerste kop koffie drink ik een groot glas water.</li><li>Na het uitkleden 's avonds leg ik mijn telefoon in de keuken.</li><li>Na het douchen doe ik 20 push-ups.</li></ul>
<p>Je bestaande gewoonte wordt de prikkel. Je hoeft er niet meer aan te denken.</p>`,
      "Na [wat je al doet] doe ik [nieuwe gewoonte]. De oude gewoonte wordt de trigger.",
      "Koppel vandaag één gewoonte uit je lijst aan iets wat je al elke dag doet.",
      Q("Wat is de formule van habit stacking?", ["Als ik zin heb, doe ik het", "Na [huidige gewoonte] doe ik [nieuwe gewoonte]", "Elke dag om 12:00"], 1, "Je bestaande routine is een betrouwbare trigger.")),

    L("tec-friction", "Technieken", 3, "De 20-secondenregel",
      `<p>Psycholoog Shawn Achor merkte dat hij veel vaker gitaar speelde toen de gitaar <b>midden in de kamer</b> stond in plaats van in de kast. Twintig seconden verschil in moeite veranderde zijn gedrag.</p>
<p>Gebruik dit in twee richtingen:</p>
<ul><li><b>Slechte gewoontes 20 seconden moeilijker:</b> apps uitloggen, naar de laatste pagina verplaatsen, telefoon in een andere kamer, contentfilter aan</li><li><b>Goede gewoontes 20 seconden makkelijker:</b> sportkleren klaarleggen, boek op je kussen, waterfles op je bureau</li></ul>
<p>Je gedrag volgt de weg van de minste weerstand. Ontwerp die weg.</p>`,
      "Maak het slechte 20 seconden moeilijker en het goede 20 seconden makkelijker.",
      "Voeg vandaag 2 drempels toe aan je grootste valkuil (uitloggen, app verplaatsen, filter aan).",
      Q("Wat liet het gitaar-voorbeeld zien?", ["Talent is alles", "Een klein beetje extra moeite verandert gedrag", "Muziek helpt tegen stress"], 1, "Twintig seconden verschil was genoeg om het gedrag te veranderen.")),

    L("tec-bundle", "Technieken", 2, "Temptation bundling",
      `<p>Econoom Katy Milkman liet mensen hun favoriete luisterboeken <b>alleen in de sportschool</b> luisteren. Ze gingen vaker sporten, omdat ze nieuwsgierig waren hoe het verhaal verderging.</p>
<p>Koppel iets wat je graag wilt aan iets wat je zou moeten doen:</p>
<ul><li>Je favoriete podcast alleen tijdens het wandelen</li><li>Die ene serie alleen op de hometrainer</li><li>Lekkere koffie alleen na je ochtendroutine</li></ul>`,
      "Koppel een verleiding aan een goede gewoonte, dan wordt het goede ook aantrekkelijk.",
      "Kies één podcast of playlist die je voortaan alleen tijdens bewegen gebruikt.",
      Q("Wat deed de groep die luisterboeken alleen in de sportschool mocht luisteren?", ["Ze stopten met sporten", "Ze gingen vaker sporten", "Ze luisterden minder"], 1, "Nieuwsgierigheid naar het verhaal trok ze naar de sportschool.")),

    L("tec-log", "Technieken", 3, "Word detective van je eigen patronen",
      `<p>Wat je meet, begrijp je. Elke keer dat je een drang logt, voeg je een stukje toe aan de puzzel.</p>
<h4>Waar let je op?</h4>
<ul><li><b>Tijd:</b> welk moment van de dag?</li><li><b>Plek:</b> waar was je?</li><li><b>Gevoel:</b> wat voelde je vlak ervoor?</li><li><b>Wat ging eraan vooraf:</b> welke app, welk gesprek, welke gedachte?</li></ul>
<p>Na twee weken loggen zie je in Voortgang je risicomomenten en top-triggers. Dan kun je gericht plannen maken in plaats van telkens verrast te worden.</p>`,
      "Loggen maakt het onzichtbare zichtbaar. Patronen kun je plannen.",
      "Log vandaag elke drang, ook kleine, met trigger en een korte notitie.",
      Q("Wat is het doel van elke drang loggen?", ["Jezelf straffen", "Patronen ontdekken zodat je vooruit kunt plannen", "Een hoge score halen"], 1, "Met patronen kun je het risico vóór zijn.")),

    L("tec-sixty", "Technieken", 2, "Verander je staat in 60 seconden",
      `<p>Een drang zit ook in je lichaam. Door je lichaam te veranderen, verander je vaak ook de drang.</p>
<ul><li>Sta op en loop naar een andere ruimte</li><li>Koud water in je gezicht of over je polsen</li><li>20 push-ups of 30 squats</li><li>Ga naar buiten, zonder telefoon</li><li>Zet een harde, energieke playlist aan</li></ul>
<p>Het doel is niet om de drang weg te duwen, maar om je systeem even een andere richting op te sturen. Daarna is de drang vaak een stuk kleiner.</p>`,
      "Beweeg je lichaam, dan beweegt je hoofd mee.",
      "Kies nu je 'noodbeweging' en zet hem in je als-dan-plan.",
      Q("Wat is het doel van je staat veranderen?", ["De drang wegduwen", "Je systeem een andere richting op sturen", "Moe worden"], 1, "Vaak is de drang daarna een stuk kleiner.")),
  ];

  window.LESSONS_A = lessons;
})();
