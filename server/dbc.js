const mong = require('mongoose');
const User = require('./struct/user.js');

const bcrypt = require('bcrypt');
const Game = require('./struct/game.js');
const Question = require('./struct/question.js');
const saltRounds = 10;

mong.set('useFindAndModify', false);

mong.connect(
    "mongodb://localhost:27017/quiz",
    { useNewUrlParser: true, useUnifiedTopology: true }
);
//'mongodb://Admin:123456@localhost:27017/testdb?authSource=admin'

mong.connection.once('open', () => {
    console.log('Connected to mongo-db');
});

mong.connection.on('error', error => {
    console.log(error);
});

module.exports = {

    login: function (name, pwd) {
        return new Promise(resolve => {
            User.findOne({ name: name }).exec((err, data) => {
                if (err) resolve(-2);
                else if (data !== null) {
                    bcrypt.compare(pwd, data.pwd, function (err, result) {
                        if (err) resolve(-2);
                        else if (!result) resolve(-1);
                        else resolve(data);
                    });
                } else {
                    resolve(-1);
                }
            });
        });
    },

    createGame: function (modId) {
        return new Promise(resolve => {
            let game = new Game();
            game.mod = modId;
            game.save((err, data) => {
                if (err) resolve(-1);
                else resolve(data);
            });
        });
    },

    getGame: function (id) {
        return new Promise(resolve => {
            Game.findOne({ _id: id })
                .populate('rounds')
                .populate('rounds.playerpoints')
                .populate('rounds.question')
                .populate('rounds.question.answers')
                .exec((err, data) => {
                    if (err) resolve(-1);
                    else resolve(data);
                });
        });
    },

    openRound: function (gameID, players, question) {
        return new Promise(async resolve => {
            let game = await Game.findOne({ _id: gameID });
            if (game !== null) {
                game.rounds.push({ question: question, playerInRound: players });
                game.state = "question";
                game.save(() => resolve(0));
            } else resolve(-1);

        });
    },

    closeRound: function (gameID) {
        return new Promise(async resolve => {
            let game = await Game.findOne({ _id: gameID });
            if (game !== null) {
                game.state = "lobby";
                game.save(() => resolve(0));
            } else resolve(-1);
        });
    },

    getQuestions: function () {
        return new Promise(resolve => {
            Question.find({}).exec((err, data) => {
                if (err) resolve(-1);
                else resolve(data);
            });
        });
    },

    getQuestion: function (qID) {
        return new Promise(resolve => {
            Question.findOne({ _id: id }).exec((err, data) => {
                if (err) resolve(-1);
                else resolve(data);
            });
        });
    },

    updateRoundSelected: function (gameID, roundID, userID, selectedState) {
        return new Promise(resolve => {
            Game.findOneAndUpdate(
                {
                    "_id": gameID,
                    "rounds._id": roundID,
                    "rounds.playerInRound.player": userID
                }, {
                    "$set": {
                        "rounds.$.playerInRound.selected": selectedState //TODO!!!
                    }
            }).exec((err, data) => {
                if (!err) resolve(0);
                else {
                    console.log(err);
                    resolve(-1);
                }
            });
        });
    },

    // ************DEBUG Functions************

    /**
     * debug only!!!
     */
    addExUser: function () {
        console.log("add");
        return new Promise(resolve => {
            bcrypt.hash('123456', saltRounds, function (err, hash) {
                let u = new User({ name: 'Rikka', pwd: hash });
                u.save((err, data) => {
                    if (err) resolve(-1);
                    else resolve(0);
                });
            });
        });
    },

    addQuestions: function () {
        console.log("add questions");
        const DATA = '"1209 North Orange Street, Wilmington, Delware USA" ist die Adresse von...?;...Aplle, Google, Kentucky Fried Chicken, Daimler AG, Adidas und Volkswagen;...einem Haus mit über 40 Keller-Etagen;...dem Haupt-Rechenzentrum des weltweiten Internets;...der mit einer Fläche von etwa 1.000.000m² größten Fertigungshalle der Welt\n' +
            'Während einer Pause bei den Aufnhamen von Micheal Jacksons "Billie Jean" befand sich Jackson...;...ohne es zu merken in einem brennenden Rolls Ryoce;...für 15 Minuten in Disneyland, da ihm langweilig war;...in einer Badewanne voller Honig, um seine Haut zu straffen;...stets in einem extra für ihn aufgebauten Bällebad\n' +
            'Der französisch-amerikanische Künstler Marcel Duchamp schaffte mit welchem Objekt im Jahre 1917 ein Schlüsselwerk der modernen Kunst?;Ein handelsübliches, weißes Urinal;Ein benutztes Taschentuch;Ein brauner Lederschuh;Ein Fleck Sekundenkleber\n' +
            'Was ist das Besondere an diesem Bild?;Es befindet sich an Bord der Raumsonde "Voyager 1";Alle Menschen auf dem Bild wurden vor der Aufnahme ausgestopft;Es ist das älteste Farbfoto der Welt;Es war Hintergrundbild auf dem sichergestellten Laptop von Osama bin Laden\n' +
            'Wodurch zeichnet sich das "Marie Byrd Land", ein Gebiet etwa vier Mal so groß wie Deutschland, aus?;Es wird von keinem Staat beansprucht und ist somit Niemandland;Es befindet sich auf dem Mond und ist im Besitz von Nordkorea;Es beherbergt die größte Artenvielfahlt weltweit;Es ist im Besitz von Bono, dem Sänger von U2\n' +
            'Der Mill End Park in Portlanl, Oregon, befindet sich...?;...auf einem Sockel auf dem Mittelstreifen einer Straße;..auf einer Insel in einem See auf einer Insel in einem See;...seit 2011 als übergroßes Wandposter auf der ISS;...zwar in Portland, er gehört abeer rechtlich zu Washington, DC\n' +
            'Welche "Instrumente" benötigt man für eines der bekanntesten Stücke des deutschen Komponisten Karlheinz Stockhausen?;Vier Hubschrauber, vier Fernseher, einen Hörsaal und einen Moderator;Ein Kreuzfahrtschiff, eine Fritteuse, drei Steine und Sand;Sechs Whopper von Burger King, zwei Hämmer, eine Geldbörse und Wasser;Die Zugspitzem einen VW Golf, Büroklammern und ein defektes Klavier\n' +
            'Der US-amerikanische Landwirt Davvid Rice Archison wurde im März 1849...;...der "elfeinhalbte" Presidänt der Veireinigten Staaten;...der Besitzer aller Agraflächen der USA;...zum Weltrekordhalter im Schlafen;...tot aufgefunden, lebte aber noch vier Jahre weiter\n' +
            'Welche Besonderheit trifft auf die Flagge des Iran zu?;Sie darf niemals auf Halbmast gehisst werden;Sie ist nur auf der Vorderseitebemalt, auf der Rückseite ist sie weiß;Offizielle Nutzung ist wegen des nicht abgelaufenen Copyrights untersagt;Es existieren zwei verschiedenfarbige Versionen der Flagge\n' +
            'Was geschah Christian Schilling, als er am 15. Mai 1910 ein Fußballspiel der deutschen gegen die belgische Nationalmannschaft als Zuschauer besuchte?;Er wurde kurzfristig von der Tribüne zum deutschen Nationalspieler berufen;Ab der 36. Minute musste er den verletzten Schiedrichter ersetzen;Er war der einzige Besucher im gesamten Stadion;Der belgische Trainer machte ihn kurzerhand zum Co-Trainer\n' +
            'Wofür ist das 1987 veröffentlichte Lied "You Suffer" der englischen Grindcore-Band "Napalm Death" besonders bekannt?;Die Band spielt den Song auf Konzerten bis zu 50 Mal;Jedes Wort der Lyrics musste wegen Obszönitäten zensiert werden;Es ist das meist gecoverte Lied der Welt;Papst Franziskus bezeichnet es als sein Lieblingslied\n' +
            'Das "Long Lines Building" ist ein etwa 170m hoher Wolkenkratzer inmitten von Manhattan, welches...?;...nicht ein einziges Fenster hat;...eigentlichüber 200m hoch sein sollte, seit 1975 aber nicht weitergebaut wird;...ein zweites Oval Office beinhaltet, das auch vom US-Präsidenten genutzt wird;...2005 für 200 US-Dollar auf eBay versteigert wurde\n' +
            'Wodurch wurde das 1952 entstandene Lied"4\'33\'\'" des amerikanischen Komponisten John Cage unter anderem bekannt?;Es wurde im Jahr 2015 fehlerfrei von einer Katze gespielt;Es wurde während Live Aid 1985 auf zwei Kontinenten gleichzeitig live gespielt;Es ist das einzige Lied mit einem Stern auf dem Hollywood Walk of Fame;Es war im August 1995 in zwölf Staaten gleichzeitig auf Platz 1 der Charts\n' +
            'Welcher kuriosen Weltrekord hält der 1960 geborene US-Amerikaner Phillip M. Parker?;Er verfasste bisher über 1.000.000 Bücher;Er kann zwölf Pizzen in 60 Sekunden verzehren;Er besaß in seinem Leben mehr als 12.000 Private-PKW;Er besitzt drei natürlich gewachsene Pullermänner\n' +
            'Da die Kleinstadt Ulysses im US-Bundestaat Kansas im Jahr 1909 hoch verschuldet war, beschlossen die Bewohner...?;...mitsamt ihren Häusern, die sie auf Schlitten stellten, zu fliehen;...fortan alle Hauswände von oben bis unten an Werbepartner zu  verkaufen;...eine eigene Währung zu drucken;...die Fläche der Kleinstadt als eigene Staat auszurufen\n' +
            '"Optographie" ist eine existierende, faszinierende Wissenschaft, deren Stellenwert allerdings wegen des fehlenden Nutzens minimal ist. Welches Ziel verfolgt sie?;Die Fixierung des letzten Bildes, deas ein Lebewesen vor dem Tod sieht,Das Fotografieren von einzelnen Atomen;Das Festhalten der vierten Dimension, also der Zeit, auf Fotos;Das Umwandeln von Bildinformationen in hörbare Inhalte\n' +
            'Der vom Unternehmen Hanson Robotics entwickelter humanoide Roboter "Sophia" ist der weltweit erste Roboter, der...;...eine Staatsbürgerschaft mit mehr Rechten als Menschen besitzt;ein eigenes Gewissen entwickelt hat;...durch eine Schwangerschaft einen Baby Roboter geboren hat;...den Turing-Test bestanden hat\n' +
            'Mit welchem Verfahren wurde in Irland versucht, Kühe zu einer erhöhten Milchproduktion zu bringen?;Kräftiges Einblasen von Luft in die Vagina oder den After;Lebenslanges Halten der Kühe in einem Wasserbecken;Beimischen von Wiskey in das Trinkwasser;Hypnotisieren der Kühe beim Melken\n' +
            'Durch welchen kuriosen Vorfall wurde der Japaner Kanaguri Shisō bei den Olympischen Spielen 1912 in Stockholm bekannt?;Er lief den langsamsten Marathon aller Zeiten in einer Zeit von über 54 Jahren;Er warf seinen Speer so weit, dass er außerhalb des Stadions landete;Er schossim Fußball-Halbfinale gegen Dänemark 24 Tore;Er verfuhr sich beim Segeln-Wettbewerb und landete in Polen\n' +
            'Was kann der/die schnellste TeilnehmerIn einer seit 1969 jährlich stattflindenden Regatta in Lübeck gewinnen?;Rosarote Kunststoff-Abgüsse eines Kinderpopos auf Mahagoniplatte;Ein kleines Stück des Rumpfes der Titanic;Eine goldgelbe, maßstabsgerechte Nachbildung eines Walpenis;Ein Gals mit Meerwasser aus der Karibik+'
        'Um die Einhaltung der Norm DIN EN 997 zu gewährleisten, muss vom Prüfer was erzeugt werden?;Kotwürste, die menschliche Fäkalien nachbilden;Ein Kilogramm verschimmelte Marmelade;Zwanzig gekaute, ausgespuckte Kaugummis;Ein erigiertes, männliches Glied aus Holz\n' +
            'Was heißt kurioserweise "Obama ficki"?;Eine Art der Strudelwürmer;DDer Titel der niederländischern Verion von barack Obamas Biografie;Eine Nachspeise aus Mexiko;Ein Raum innerhalb des Weißen Hauses\n' +
            'Woführ ist "Morbus Kobold" in der medizinischen Fachkreisen bekannt?;Penisverletzungen bei Masturbation mittels Reinigungsgeräten;Ein Penis, der in den Körper hineinwächst,Afterverletzungen durch Einführen von Pummuckel-Figuren;Ein Armbruch mit mehr als einem Knochenbruch\n' +
            'Der Wissenschaftler Michael Norton prägt im Jahr 2009 die Bezeichnung "IKEA-Effekt" für welches Phänomen?;Selbstzusammengebaute Gegenstände erhalten höhere Wertschätzung;Erhötes Hungergefühl beim Shopping;Großer Willen zum Erlernen der schwedischen Sprache nach IKEA-Besuch;Größerer Umsatz durch erhötes Angebot geringpreisiger Produkte';
        return new Promise(resolve => {
            let raw = csvParser(DATA);
            let questions = [];
            raw.forEach(q => {
                questions.push({
                    question: q[0], answers: [
                        { text: q[2], correct: true },
                        { text: q[3], correct: false },
                        { text: q[4], correct: false },
                        { text: q[5], correct: false },
                    ]
                });
            });
            Question.insertMany(questions).then(() => resolve(0)).catch(() => resolve(-1));
        });
    }
}

/**
 * 
 * @param {String} csv 
 */
function csvParser(csv) {
    let ret = [];
    csv.split('\n').forEach(r => {
        ret.push(r.split(';'));
    });
    return ret;
}