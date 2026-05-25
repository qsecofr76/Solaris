/**
 * Solaris - Logica Applicativa, Traduzioni ed Eventi UI
 */

// 1. Dizionario di Traduzione (Italiano / Inglese)
const SolarisTranslations = {
    it: {
        "tagline": "Calcolatore e Progettista di Meridiane",
        "parameters": "Parametri di Progetto",
        "mode-wall": "Parete (Verticale)",
        "mode-floor": "Pavimento (Umano)",
        "section-geography": "1. Posizione Geografica",
        "use-gps": "Usa la mia posizione",
        "latitude": "Latitudine",
        "longitude": "Longitudine",
        "timezone": "Fuso Orario (UTC)",
        "dst-label": "Ora Legale (+1h) attiva",
        "section-dimensions": "2. Geometria Meridiana",
        "wall-declination": "Declinazione Muro",
        "wall-south": "Puro Sud (0°)",
        "wall-east": "Declina a Est (Ombra pomeriggio)",
        "wall-west": "Declina a Ovest (Ombra mattina)",
        "wall-inclination": "Inclinazione Parete",
        "wall-vert": "Perfettamente Verticale (0°)",
        "gnomon-length": "Lunghezza Stilo Fisico",
        "ellipse-width": "Semiasse Maggiore (a)",
        "ellipse-help": "Larghezza totale ellisse = 2 × a",
        "wall-zoom": "Zoom Meridiana",
        "floor-zoom": "Zoom Meridiana",
        "floor-slope": "Pendenza Piazza",
        "slope-direction": "Direzione Pendenza",
        "floor-flat": "Pavimento Orizzontale (Piatto)",
        "section-simulation": "3. Data & Ora Simulazione",
        "date": "Data",
        "solstice-s": "Solst. Est.",
        "equinox-a": "Equinozio",
        "solstice-w": "Solst. Inv.",
        "clock-time": "Ora di Orologio",
        "live": "LIVE",
        "title-wall": "Meridiana Verticale Declinante",
        "title-floor": "Orologio a Pavimento (Meridiana Umana)",
        "export-svg": "Esporta SVG",
        "export-pdf": "Esporta PDF",
        "export-csv": "Esporta CSV",
        "print": "Stampa",
        "solar-data-title": "Dati Solari Istantanei",
        "solar-time": "Tempo Solare Vero:",
        "eot-label": "Equazione del Tempo (EoT):",
        "sun-altitude": "Altezza Sole:",
        "sun-azimuth": "Azimut Sole:",
        "solar-dec": "Declinazione Solare:",
        "gnomon-specs-title": "Scheda Tecnica dello Gnomone",
        "gnomon-style-height": "Altezza Stilo (Ortostilo) (a):",
        "gnomon-style-inclin": "Inclinazione Stilo dal Muro (stilo):",
        "substyle-angle": "Angolo del Substilo (SD):",
        "long-diff-substyle": "Differenza Long. Substilo (H0):",
        "gnomon-length-hyp": "Lunghezza Stilo Polare (ipotenusa):",
        "ellipse-b": "Semiasse Minore (b):",
        "eccentricity": "Eccentricità dell'Ellisse (e):",
        "position-today": "Posizione Gnomone Oggi (Z):",
        "gnomon-range": "Escursione Totale Gnomone:",
        "gnomon-height-suggest": "Altezza Gnomone (Persona):",
        "person-height": "Altezza Persona (Gnomone):",
        "eot-graph-title": "Equazione del Tempo (Variazione Annuale)",
        "eot-slow": "Sole lento (Orologio avanti)",
        "eot-fast": "Sole veloce (Orologio indietro)",
        "tracing-title": "Tabella di Tracciamento Cantiere (Orologio a Pavimento)",
        "tracing-instructions": "Per tracciare l'ellisse sulla piazza, fissa il centro (0,0). Traccia l'asse X (Est-Ovest) e l'asse Y (Nord-Sud). Posiziona i tasselli delle ore alle coordinate (X, Y) sotto indicate. Traccia la scala del calendario sull'asse Y (Nord-Sud) alle distanze (Z) indicate per i primi giorni del mese.",
        "tab-hours": "Punti Orari (Ellisse)",
        "tab-calendar": "Scala del Calendario (Gnomone)",
        "th-hour": "Ora Solare",
        "th-hour-angle": "Angolo (H)",
        "th-distance": "Distanza dal Centro",
        "th-date": "Data / Primo del Mese",
        "th-declination": "Declinazione (δ)",
        "th-position-z": "Posizione Z (Nord/Sud)",
        "th-direction": "Direzione dal Centro",
        "north": "Nord",
        "south": "Sud",
        "east": "Est",
        "west": "Ovest",
        "shadow-angle": "Angolo dell'Ombra:",
        "export-html": "Esporta HTML",
        "export-dxf": "Esporta DXF",
        "enable-special": "Abilita Data Speciale",
        "special-date": "Data dell'Evento",
        "special-time": "Ora dell'Evento",
        "special-label": "Descrizione Evento"
    },
    en: {
        "tagline": "Sundial Calculator and Designer",
        "parameters": "Project Parameters",
        "mode-wall": "Wall (Vertical)",
        "mode-floor": "Floor (Human)",
        "section-geography": "1. Geographic Position",
        "use-gps": "Use My Location",
        "latitude": "Latitude",
        "longitude": "Longitude",
        "timezone": "Timezone (UTC)",
        "dst-label": "Daylight Saving (+1h) active",
        "section-dimensions": "2. Sundial Geometry",
        "wall-declination": "Wall Declination",
        "wall-south": "Pure South (0°)",
        "wall-east": "Declines East (Afternoon shadow)",
        "wall-west": "Declines West (Morning shadow)",
        "wall-inclination": "Wall Inclination",
        "wall-vert": "Perfecty Vertical (0°)",
        "gnomon-length": "Physical Style Length",
        "ellipse-width": "Semi-Major Axis (a)",
        "ellipse-help": "Total ellipse width = 2 × a",
        "wall-zoom": "Sundial Zoom",
        "floor-zoom": "Sundial Zoom",
        "floor-slope": "Plaza Slope",
        "slope-direction": "Slope Direction",
        "floor-flat": "Horizontal Floor (Flat)",
        "section-simulation": "3. Simulation Date & Time",
        "date": "Date",
        "solstice-s": "Summer Solst.",
        "equinox-a": "Equinox",
        "solstice-w": "Winter Solst.",
        "clock-time": "Clock Time",
        "live": "LIVE",
        "title-wall": "Declining Vertical Sundial",
        "title-floor": "Floor Sundial (Human Analemmatic)",
        "export-svg": "Export SVG",
        "export-pdf": "Export PDF",
        "export-csv": "Export CSV",
        "print": "Print",
        "solar-data-title": "Instantaneous Solar Data",
        "solar-time": "Apparent Solar Time:",
        "eot-label": "Equation of Time (EoT):",
        "sun-altitude": "Sun Altitude:",
        "sun-azimuth": "Sun Azimuth:",
        "solar-dec": "Solar Declination:",
        "gnomon-specs-title": "Gnomon Technical Sheet",
        "gnomon-style-height": "Gnomon Height (Orthostyle) (a):",
        "gnomon-style-inclin": "Style Inclination from Wall (style):",
        "substyle-angle": "Substyle Angle (SD):",
        "long-diff-substyle": "Substyle Long. Difference (H0):",
        "gnomon-length-hyp": "Polar Style Length (hypotenuse):",
        "ellipse-b": "Semi-Minor Axis (b):",
        "eccentricity": "Ellipse Eccentricity (e):",
        "position-today": "Gnomon Position Today (Z):",
        "gnomon-range": "Gnomon Total Range:",
        "gnomon-height-suggest": "Gnomon Height (Person):",
        "person-height": "Person Height (Gnomon):",
        "eot-graph-title": "Equation of Time (Annual Variation)",
        "eot-slow": "Sun slow (Clock ahead)",
        "eot-fast": "Sun fast (Clock behind)",
        "tracing-title": "Construction Tracing Table (Floor Sundial)",
        "tracing-instructions": "To layout the ellipse on the square, fix the center (0,0). Trace the X-axis (East-West) and Y-axis (North-South). Position hour markers at the exact (X, Y) coordinates below. Trace the calendar scale on the Y-axis (North-South) at the (Z) distances indicated for the 1st day of each month.",
        "tab-hours": "Hour Points (Ellipse)",
        "tab-calendar": "Calendar Scale (Gnomon)",
        "th-hour": "Solar Time",
        "th-hour-angle": "Angle (H)",
        "th-distance": "Distance from Center",
        "th-date": "Date / First of Month",
        "th-declination": "Declination (δ)",
        "th-position-z": "Position Z (North/Sud)",
        "th-direction": "Direction from Center",
        "north": "North",
        "south": "South",
        "east": "East",
        "west": "West",
        "shadow-angle": "Shadow Angle:",
        "export-html": "Export HTML",
        "export-dxf": "Export DXF",
        "enable-special": "Enable Special Anniversary",
        "special-date": "Event Date",
        "special-time": "Event Time",
        "special-label": "Event Description"
    }
};

// 2. Stato dell'Applicazione
const SolarisApp = {
    state: {
        lang: "it",
        mode: "wall", // 'wall' o 'floor'
        latitude: 45.0,
        longitude: 12.0,
        timezone: 1,
        isDst: true,
        declination: 0.0,
        inclination: 0.0,
        gnomonLength: 200, // mm
        ellipseWidth: 3.0, // metri
        floorSlope: 0.0,
        floorSlopeDir: 180.0,
        date: "2026-06-21",
        timeMinutes: 720, // 12:00 in minuti
        isLive: false,
        wallZoom: 100,
        floorZoom: 80,
        personHeight: 1.70,
        specialDateEnabled: false,
        specialDateStr: "2026-06-21",
        specialTimeStr: "12:00",
        specialLabel: "Anniversario"
    },

    liveInterval: null,

    /**
     * Inizializzazione dell'applicazione
     */
    init: () => {
        SolarisApp.bindEvents();
        SolarisApp.syncInputElements();
        
        // Imposta la data odierna come default
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        SolarisApp.state.date = `${year}-${month}-${day}`;
        document.getElementById('input-date').value = SolarisApp.state.date;

        // Imposta ora odierna
        const currentMin = today.getHours() * 60 + today.getMinutes();
        SolarisApp.state.timeMinutes = currentMin;
        document.getElementById('input-time').value = currentMin;

        SolarisApp.updateLanguage();
        SolarisApp.calculateAndRedraw();
        
        // Gestisci resize finestra
        window.addEventListener('resize', () => {
            SolarisApp.calculateAndRedraw();
        });
    },

    /**
     * Collega gli eventi della UI agli handler
     */
    bindEvents: () => {
        // Toggle Lingua
        document.getElementById('lang-btn').addEventListener('click', () => {
            SolarisApp.state.lang = SolarisApp.state.lang === "it" ? "en" : "it";
            SolarisApp.updateLanguage();
            SolarisApp.calculateAndRedraw();
        });

        // Cambio Tipologia Meridiana (Parete / Pavimento)
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                const newMode = e.target.getAttribute('data-mode');
                SolarisApp.state.mode = newMode;

                // Gestione visibilità pannelli specifici
                if (newMode === 'wall') {
                    document.getElementById('controls-wall-only').classList.remove('hidden');
                    document.getElementById('controls-floor-only').classList.add('hidden');
                    document.getElementById('specs-wall-only').classList.remove('hidden');
                    document.getElementById('specs-floor-only').classList.add('hidden');
                    document.getElementById('floor-tracing-panel').classList.add('hidden');
                    document.getElementById('view-title').setAttribute('data-i18n', 'title-wall');
                } else {
                    document.getElementById('controls-wall-only').classList.add('hidden');
                    document.getElementById('controls-floor-only').classList.remove('hidden');
                    document.getElementById('specs-wall-only').classList.add('hidden');
                    document.getElementById('specs-floor-only').classList.remove('hidden');
                    document.getElementById('floor-tracing-panel').classList.remove('hidden');
                    document.getElementById('view-title').setAttribute('data-i18n', 'title-floor');
                }

                SolarisApp.updateLanguage();
                SolarisApp.calculateAndRedraw();
            });
        });

        // Associazione input bidirezionali (Range + Numero)
        SolarisApp.setupSyncedInput('latitude', 'num-latitude', 'input-latitude', val => parseFloat(val));
        SolarisApp.setupSyncedInput('longitude', 'num-longitude', 'input-longitude', val => parseFloat(val));
        SolarisApp.setupSyncedInput('declination', 'num-declination', 'input-declination', val => parseFloat(val));
        SolarisApp.setupSyncedInput('inclination', 'num-inclination', 'input-inclination', val => parseFloat(val));
        SolarisApp.setupSyncedInput('floorSlope', 'num-floor-slope', 'input-floor-slope', val => parseFloat(val));
        SolarisApp.setupSyncedInput('floorSlopeDir', 'num-floor-slope-dir', 'input-floor-slope-dir', val => parseFloat(val));
        
        // Altri controlli
        document.getElementById('input-gnomon-len').addEventListener('input', (e) => {
            SolarisApp.state.gnomonLength = parseFloat(e.target.value);
            document.getElementById('gnomon-len-val').innerText = `${e.target.value} mm`;
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('input-ellipse-width').addEventListener('input', (e) => {
            SolarisApp.state.ellipseWidth = parseFloat(e.target.value);
            document.getElementById('ellipse-w-val').innerText = `${parseFloat(e.target.value).toFixed(1)} m`;
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('input-wall-zoom').addEventListener('input', (e) => {
            SolarisApp.state.wallZoom = parseFloat(e.target.value);
            document.getElementById('wall-zoom-val').innerText = `${e.target.value}%`;
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('input-floor-zoom').addEventListener('input', (e) => {
            SolarisApp.state.floorZoom = parseFloat(e.target.value);
            document.getElementById('floor-zoom-val').innerText = `${e.target.value}%`;
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('input-person-height').addEventListener('input', (e) => {
            SolarisApp.state.personHeight = parseFloat(e.target.value);
            document.getElementById('person-height-val').innerText = `${parseFloat(e.target.value).toFixed(2)} m`;
            SolarisApp.calculateAndRedraw();
        });

        // Controlli per la Data Speciale (Anniversario)
        document.getElementById('checkbox-special-event').addEventListener('change', (e) => {
            SolarisApp.state.specialDateEnabled = e.target.checked;
            const inputsDiv = document.getElementById('special-event-inputs');
            if (e.target.checked) {
                inputsDiv.classList.remove('hidden');
            } else {
                inputsDiv.classList.add('hidden');
            }
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('input-special-date').addEventListener('change', (e) => {
            SolarisApp.state.specialDateStr = e.target.value;
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('input-special-time').addEventListener('change', (e) => {
            SolarisApp.state.specialTimeStr = e.target.value;
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('input-special-label').addEventListener('input', (e) => {
            SolarisApp.state.specialLabel = e.target.value;
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('select-timezone').addEventListener('change', (e) => {
            SolarisApp.state.timezone = parseInt(e.target.value);
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('check-dst').addEventListener('change', (e) => {
            SolarisApp.state.isDst = e.target.checked;
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('input-date').addEventListener('change', (e) => {
            SolarisApp.state.date = e.target.value;
            SolarisApp.calculateAndRedraw();
        });

        document.getElementById('input-time').addEventListener('input', (e) => {
            SolarisApp.state.timeMinutes = parseInt(e.target.value);
            SolarisApp.updateTimeDisplay();
            SolarisApp.calculateAndRedraw();
        });

        // Pulsanti date veloci
        document.querySelectorAll('.quick-dates button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dateType = e.target.getAttribute('data-date');
                const year = new Date(SolarisApp.state.date).getFullYear();
                
                if (dateType === 'summer-solstice') {
                    SolarisApp.state.date = `${year}-06-21`;
                } else if (dateType === 'equinox') {
                    SolarisApp.state.date = `${year}-09-22`;
                } else if (dateType === 'winter-solstice') {
                    SolarisApp.state.date = `${year}-12-21`;
                }
                
                document.getElementById('input-date').value = SolarisApp.state.date;
                SolarisApp.calculateAndRedraw();
            });
        });

        // Geolocalizzazione GPS
        document.getElementById('btn-geolocation').addEventListener('click', () => {
            if (navigator.geolocation) {
                const btn = document.getElementById('btn-geolocation');
                btn.disabled = true;
                const prevHtml = btn.innerHTML;
                btn.innerHTML = `<span>⏳</span> <span>Locating...</span>`;

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        SolarisApp.state.latitude = position.coords.latitude;
                        SolarisApp.state.longitude = position.coords.longitude;
                        
                        // Sync inputs
                        document.getElementById('input-latitude').value = SolarisApp.state.latitude.toFixed(3);
                        document.getElementById('num-latitude').value = SolarisApp.state.latitude.toFixed(5);
                        document.getElementById('input-longitude').value = SolarisApp.state.longitude.toFixed(3);
                        document.getElementById('num-longitude').value = SolarisApp.state.longitude.toFixed(5);
                        
                        // Stima automatica del fuso orario basata sulla longitudine (15 gradi per ora)
                        const estimatedTz = Math.round(position.coords.longitude / 15);
                        SolarisApp.state.timezone = Math.max(-12, Math.min(12, estimatedTz));
                        document.getElementById('select-timezone').value = SolarisApp.state.timezone;

                        btn.disabled = false;
                        btn.innerHTML = prevHtml;

                        SolarisApp.syncInputElements();
                        SolarisApp.calculateAndRedraw();
                    },
                    (error) => {
                        alert(SolarisApp.state.lang === 'it' ? "Impossibile ottenere la posizione." : "Unable to retrieve location.");
                        btn.disabled = false;
                        btn.innerHTML = prevHtml;
                    }
                );
            } else {
                alert("Geolocation not supported.");
            }
        });

        // Pulsante Live Time
        document.getElementById('btn-live').addEventListener('click', (e) => {
            SolarisApp.state.isLive = !SolarisApp.state.isLive;
            const liveBtn = document.getElementById('btn-live');

            if (SolarisApp.state.isLive) {
                liveBtn.classList.add('active');
                document.getElementById('input-time').disabled = true;
                
                SolarisApp.liveInterval = setInterval(() => {
                    const now = new Date();
                    
                    // Imposta data odierna
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    SolarisApp.state.date = `${year}-${month}-${day}`;
                    document.getElementById('input-date').value = SolarisApp.state.date;

                    // Imposta ora odierna
                    SolarisApp.state.timeMinutes = now.getHours() * 60 + now.getMinutes();
                    document.getElementById('input-time').value = SolarisApp.state.timeMinutes;
                    
                    SolarisApp.updateTimeDisplay(now.getSeconds());
                    SolarisApp.calculateAndRedraw();
                }, 1000);
            } else {
                liveBtn.classList.remove('active');
                document.getElementById('input-time').disabled = false;
                clearInterval(SolarisApp.liveInterval);
            }
        });

        // Switch schede tabelle (Punti Orari / Scala Calendario)
        document.querySelectorAll('.table-switch button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.table-switch button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const tableType = e.target.getAttribute('data-table');
                if (tableType === 'hours') {
                    document.getElementById('table-hours').classList.remove('hidden');
                    document.getElementById('table-dates').classList.add('hidden');
                } else {
                    document.getElementById('table-hours').classList.add('hidden');
                    document.getElementById('table-dates').classList.remove('hidden');
                }
            });
        });

        // Esportazione SVG
        document.getElementById('btn-export-svg').addEventListener('click', () => {
            const svgStr = SolarisRenderer.generateSVG(SolarisApp.state.mode, SolarisApp.state, new Date(SolarisApp.state.date), SolarisApp.state.lang);
            const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `Solaris_${SolarisApp.state.mode}_sundial.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        // Esportazione PDF
        document.getElementById('btn-export-pdf').addEventListener('click', () => {
            SolarisRenderer.exportToPDF(SolarisApp.state.mode, SolarisApp.state, SolarisApp.state.lang);
        });

        // Esportazione HTML Standalone
        document.getElementById('btn-export-html').addEventListener('click', () => {
            SolarisRenderer.exportToHTML(SolarisApp.state.mode, SolarisApp.state, SolarisApp.state.lang);
        });

        // Esportazione DXF
        document.getElementById('btn-export-dxf').addEventListener('click', () => {
            SolarisRenderer.exportToDXF(SolarisApp.state.mode, SolarisApp.state, SolarisApp.state.lang);
        });

        // Esportazione CSV
        document.getElementById('btn-export-csv').addEventListener('click', () => {
            const csvStr = SolarisRenderer.exportToCSV(SolarisApp.state.mode, SolarisApp.state, SolarisApp.state.lang);
            const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `Solaris_${SolarisApp.state.mode}_tracing.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        // Pulsante di stampa tabella
        document.getElementById('btn-print-table').addEventListener('click', () => {
            window.print();
        });
    },

    /**
     * Associa input a scorrimento (range) e numerico
     */
    setupSyncedInput: (stateKey, numId, rangeId, parser) => {
        const numElem = document.getElementById(numId);
        const rangeElem = document.getElementById(rangeId);

        numElem.addEventListener('input', (e) => {
            let val = parser(e.target.value);
            if (isNaN(val)) return;
            SolarisApp.state[stateKey] = val;
            rangeElem.value = val;
            SolarisApp.syncInputLabels();
            SolarisApp.calculateAndRedraw();
        });

        rangeElem.addEventListener('input', (e) => {
            let val = parser(e.target.value);
            SolarisApp.state[stateKey] = val;
            numElem.value = val;
            SolarisApp.syncInputLabels();
            SolarisApp.calculateAndRedraw();
        });
    },

    /**
     * Sincronizza i valori mostrati a schermo
     */
    syncInputElements: () => {
        document.getElementById('input-latitude').value = SolarisApp.state.latitude;
        document.getElementById('num-latitude').value = SolarisApp.state.latitude;

        document.getElementById('input-longitude').value = SolarisApp.state.longitude;
        document.getElementById('num-longitude').value = SolarisApp.state.longitude;

        document.getElementById('input-declination').value = SolarisApp.state.declination;
        document.getElementById('num-declination').value = SolarisApp.state.declination;

        document.getElementById('input-inclination').value = SolarisApp.state.inclination;
        document.getElementById('num-inclination').value = SolarisApp.state.inclination;

        document.getElementById('input-floor-slope').value = SolarisApp.state.floorSlope;
        document.getElementById('num-floor-slope').value = SolarisApp.state.floorSlope;

        document.getElementById('input-floor-slope-dir').value = SolarisApp.state.floorSlopeDir;
        document.getElementById('num-floor-slope-dir').value = SolarisApp.state.floorSlopeDir;

        document.getElementById('input-gnomon-len').value = SolarisApp.state.gnomonLength;
        document.getElementById('input-ellipse-width').value = SolarisApp.state.ellipseWidth;
        document.getElementById('input-wall-zoom').value = SolarisApp.state.wallZoom;
        document.getElementById('input-floor-zoom').value = SolarisApp.state.floorZoom;
        document.getElementById('input-person-height').value = SolarisApp.state.personHeight;
        document.getElementById('select-timezone').value = SolarisApp.state.timezone;
        document.getElementById('check-dst').checked = SolarisApp.state.isDst;
        document.getElementById('input-date').value = SolarisApp.state.date;
        document.getElementById('input-time').value = SolarisApp.state.timeMinutes;

        // Inizializza i valori per la Data Speciale
        document.getElementById('checkbox-special-event').checked = SolarisApp.state.specialDateEnabled;
        document.getElementById('input-special-date').value = SolarisApp.state.specialDateStr;
        document.getElementById('input-special-time').value = SolarisApp.state.specialTimeStr;
        document.getElementById('input-special-label').value = SolarisApp.state.specialLabel;
        const inputsDiv = document.getElementById('special-event-inputs');
        if (SolarisApp.state.specialDateEnabled) {
            inputsDiv.classList.remove('hidden');
        } else {
            inputsDiv.classList.add('hidden');
        }

        SolarisApp.syncInputLabels();
        SolarisApp.updateTimeDisplay();
    },

    /**
     * Aggiorna le etichette testuali dei valori
     */
    syncInputLabels: () => {
        document.getElementById('lat-val').innerHTML = `${SolarisApp.state.latitude.toFixed(2)}&deg;`;
        document.getElementById('lng-val').innerHTML = `${SolarisApp.state.longitude.toFixed(2)}&deg;`;
        document.getElementById('dec-val').innerHTML = `${SolarisApp.state.declination.toFixed(1)}&deg;`;
        document.getElementById('inc-val').innerHTML = `${SolarisApp.state.inclination.toFixed(1)}&deg;`;
        document.getElementById('slope-val').innerHTML = `${SolarisApp.state.floorSlope.toFixed(1)}&deg;`;
        document.getElementById('slope-dir-val').innerHTML = `${SolarisApp.state.floorSlopeDir.toFixed(0)}&deg;`;
        
        document.getElementById('gnomon-len-val').innerText = `${SolarisApp.state.gnomonLength} mm`;
        document.getElementById('ellipse-w-val').innerText = `${SolarisApp.state.ellipseWidth.toFixed(1)} m`;
        document.getElementById('wall-zoom-val').innerText = `${SolarisApp.state.wallZoom}%`;
        document.getElementById('floor-zoom-val').innerText = `${SolarisApp.state.floorZoom}%`;
        document.getElementById('person-height-val').innerText = `${SolarisApp.state.personHeight.toFixed(2)} m`;

        const lang = SolarisApp.state.lang;

        // Descrizione direzione declinazione muro
        const dec = SolarisApp.state.declination;
        const decLabel = document.getElementById('wall-dir-text');

        if (Math.abs(dec) < 0.1) {
            decLabel.setAttribute('data-i18n', 'wall-south');
            decLabel.innerText = SolarisTranslations[lang]['wall-south'];
        } else if (dec < 0) {
            decLabel.setAttribute('data-i18n', 'wall-east');
            decLabel.innerText = SolarisTranslations[lang]['wall-east'] + ` (${Math.abs(dec).toFixed(1)}°)`;
        } else {
            decLabel.setAttribute('data-i18n', 'wall-west');
            decLabel.innerText = SolarisTranslations[lang]['wall-west'] + ` (${Math.abs(dec).toFixed(1)}°)`;
        }

        // Descrizione inclinazione muro (proclinata/reclinata)
        const inc = SolarisApp.state.inclination;
        const incLabel = document.getElementById('wall-inc-text');

        if (Math.abs(inc) < 0.1) {
            incLabel.setAttribute('data-i18n', 'wall-vert');
            incLabel.innerText = SolarisTranslations[lang]['wall-vert'];
        } else if (inc > 0) {
            incLabel.innerText = (lang === 'it' ? 'Parete Reclinata' : 'Reclined Wall') + ` (+${inc.toFixed(1)}°)`;
        } else {
            incLabel.innerText = (lang === 'it' ? 'Parete Proclinata' : 'Proclined Wall') + ` (${inc.toFixed(1)}°)`;
        }

        // Descrizione pendenza piazza (direzione compasso)
        const slope = SolarisApp.state.floorSlope;
        const slopeLabel = document.getElementById('floor-slope-text');

        const getCompassDirection = (deg, l) => {
            const dirsIt = ["Nord", "Nord-Est", "Est", "Sud-Est", "Sud", "Sud-Ovest", "Ovest", "Nord-Ovest"];
            const dirsEn = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
            const idx = Math.round((deg % 360) / 45) % 8;
            return l === 'it' ? dirsIt[idx] : dirsEn[idx];
        };

        if (slope < 0.1) {
            slopeLabel.setAttribute('data-i18n', 'floor-flat');
            slopeLabel.innerText = SolarisTranslations[lang]['floor-flat'];
        } else {
            const compDir = getCompassDirection(SolarisApp.state.floorSlopeDir, lang);
            slopeLabel.innerText = lang === 'it'
                ? `Piazza in discesa (${slope.toFixed(1)}°) verso ${compDir}`
                : `Plaza sloping down (${slope.toFixed(1)}°) towards ${compDir}`;
        }
    },

    /**
     * Aggiorna visualizzazione dell'orologio
     */
    updateTimeDisplay: (seconds = 0) => {
        const totalMinutes = SolarisApp.state.timeMinutes;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        
        const hStr = String(h).padStart(2, '0');
        const mStr = String(m).padStart(2, '0');
        const sStr = String(seconds).padStart(2, '0');

        document.getElementById('time-val').innerText = `${hStr}:${mStr}`;
        document.getElementById('time-clock-display').innerText = `${hStr}:${mStr}:${sStr}`;
    },

    /**
     * Esegue i calcoli e ridisegna tutto
     */
    calculateAndRedraw: () => {
        const dateObj = new Date(SolarisApp.state.date);
        const dayOfYear = SolarisMath.getDayOfYear(dateObj);
        const solarDec = SolarisMath.getSolarDeclination(dayOfYear);
        const eot = SolarisMath.getEquationOfTime(dayOfYear);

        // Ora civile decimale
        const civilHours = SolarisApp.state.timeMinutes / 60;
        
        // Calcola ora solare vera
        const solarHours = SolarisMath.civilToSolarTime(civilHours, SolarisApp.state.longitude, SolarisApp.state.timezone, eot, SolarisApp.state.isDst);
        
        // Posizione Sole
        const hourAngle = (solarHours - 12) * 15;
        const sunPos = SolarisMath.getSunPosition(SolarisApp.state.latitude, solarDec, hourAngle);

        // 1. POPOLA I DATI SOLARI NELLA CARD
        SolarisApp.updateSolarDataUI(solarHours, eot, sunPos, solarDec);

        // 2. POPOLA LE SPECIFICHE COSTRUTTIVE GNOMONE
        SolarisApp.updateGnomonDataUI(solarDec);

        // 3. DISEGNA CURVA EQUAZIONE DEL TEMPO
        SolarisChart.drawEoT('eot-canvas', dayOfYear, SolarisApp.state.lang);

        // 4. DISEGNA MERIDIANA PRINCIPALE SUL CANVAS
        const timeStr = `${String(Math.floor(civilHours)).padStart(2, '0')}:${String(Math.round((civilHours%1)*60)).padStart(2, '0')}`;
        
        if (SolarisApp.state.mode === 'wall') {
            SolarisRenderer.drawWallSundial('sundial-canvas', SolarisApp.state, dateObj, timeStr, SolarisApp.state.lang);
        } else {
            SolarisRenderer.drawFloorSundial('sundial-canvas', SolarisApp.state, dateObj, timeStr, SolarisApp.state.lang);
            // Popola anche la tabella di tracciamento
            SolarisApp.populateFloorTracingTables();
        }
    },

    /**
     * Aggiorna le scritte astronomiche
     */
    updateSolarDataUI: (solarHours, eot, sunPos, solarDec) => {
        // Ora solare HH:MM
        const sh = Math.floor(solarHours);
        const sm = Math.round((solarHours - sh) * 60);
        // Gestione ore negative o > 24 per posizioni geografiche estreme
        let shNormal = sh;
        if (shNormal < 0) shNormal += 24;
        if (shNormal >= 24) shNormal -= 24;
        const solarTimeStr = `${String(shNormal).padStart(2, '0')}:${String(Math.abs(sm)).padStart(2, '0')}`;

        document.getElementById('metric-solar-time').innerText = solarTimeStr;
        document.getElementById('metric-eot').innerText = `${eot > 0 ? '+' : ''}${eot.toFixed(2)} min`;
        
        // Se il sole è sotto l'orizzonte, mostriamo 0 gradi o negativo
        document.getElementById('metric-sun-alt').innerHTML = `${sunPos.altitude.toFixed(1)}&deg;`;
        document.getElementById('metric-sun-az').innerHTML = `${sunPos.azimuth.toFixed(1)}&deg;`;
        document.getElementById('metric-solar-dec').innerHTML = `${solarDec > 0 ? '+' : ''}${solarDec.toFixed(2)}&deg;`;

        // Calcolo dell'angolo dell'ombra in tempo reale
        const mode = SolarisApp.state.mode;
        const lat = SolarisApp.state.latitude;
        const lang = SolarisApp.state.lang;
        let shadowAngleText = "—";

        if (mode === 'wall') {
            const dec = SolarisApp.state.declination;
            const inc = SolarisApp.state.inclination || 0;
            const gLen = SolarisApp.state.gnomonLength;
            const gparams = SolarisMath.calcWallGnomonParameters(lat, dec, gLen, inc);
            const currentShadow = SolarisMath.projectNodusShadowOnWall(sunPos.altitude, sunPos.azimuth, lat, dec, gparams, inc);

            if (currentShadow) {
                // Angolo rispetto alla verticale dell'Apex (Y positivo in basso)
                // theta = Math.atan2(X, Y) * 180 / Math.PI
                const theta = Math.atan2(currentShadow.x, currentShadow.y) * 180 / Math.PI;
                const absTheta = Math.abs(theta);
                if (Math.abs(currentShadow.x) < 0.01) {
                    shadowAngleText = `0.0° (${lang === 'it' ? 'Sud' : 'South'})`;
                } else if (currentShadow.x > 0) {
                    shadowAngleText = `${absTheta.toFixed(1)}° ${lang === 'it' ? 'Ovest (da Sud)' : 'West (from South)'}`;
                } else {
                    shadowAngleText = `${absTheta.toFixed(1)}° ${lang === 'it' ? 'Est (da Sud)' : 'East (from South)'}`;
                }
            } else {
                shadowAngleText = lang === 'it' ? "Muro in ombra" : "Wall in shadow";
            }
        } else {
            // Pavimento
            const aVal = SolarisApp.state.ellipseWidth;
            const slope = SolarisApp.state.floorSlope || 0;
            const slopeDir = SolarisApp.state.floorSlopeDir || 180;
            const geom = SolarisMath.calcFloorSundialGeometry(lat, aVal, slope, slopeDir);
            const zOffset = SolarisMath.calcFloorGnomonOffset(aVal, geom.phiVirt, solarDec, geom.rotationAngle);
            const hPerson = SolarisApp.state.personHeight !== undefined ? SolarisApp.state.personHeight : 1.70;

            if (sunPos.altitude > 0) {
                const shadowTip = SolarisMath.projectVerticalShadowOnSlope(
                    zOffset.x, zOffset.y, hPerson,
                    sunPos.altitude, sunPos.azimuth,
                    lat, slope, slopeDir
                );

                if (shadowTip) {
                    // Direzione ombra dal piede (zOffset) alla punta (shadowTip)
                    const dx = shadowTip.x - zOffset.x;
                    const dy = shadowTip.y - zOffset.y;
                    
                    const angleRad = Math.atan2(dx, dy); // Angolo da Nord (+Y) verso Est (+X)
                    let angleDeg = angleRad * 180 / Math.PI;
                    if (angleDeg < -180) angleDeg += 360;
                    if (angleDeg > 180) angleDeg -= 360;

                    let northSouth = "N";
                    let eastWest = "E";
                    let val = 0;

                    if (dy >= 0) {
                        northSouth = "N";
                        if (dx >= 0) {
                            eastWest = "E";
                            val = angleDeg;
                        } else {
                            eastWest = lang === 'it' ? "O" : "W";
                            val = -angleDeg;
                        }
                    } else {
                        northSouth = "S";
                        if (dx >= 0) {
                            eastWest = "E";
                            val = 180 - angleDeg;
                        } else {
                            eastWest = lang === 'it' ? "O" : "W";
                            val = 180 + angleDeg;
                        }
                    }
                    shadowAngleText = `${northSouth} ${val.toFixed(1)}° ${eastWest}`;
                } else {
                    shadowAngleText = lang === 'it' ? "Nessuna ombra" : "No shadow";
                }
            } else {
                shadowAngleText = lang === 'it' ? "Sole sotto l'orizzonte" : "Sun below horizon";
            }
        }

        document.getElementById('metric-shadow-angle').innerText = shadowAngleText;
    },

    /**
     * Aggiorna la scheda tecnica dello gnomone
     */
    updateGnomonDataUI: (solarDec) => {
        const lat = SolarisApp.state.latitude;
        const gLen = SolarisApp.state.gnomonLength;
        const aVal = SolarisApp.state.ellipseWidth;
        const lang = SolarisApp.state.lang;

        if (SolarisApp.state.mode === 'wall') {
            const dec = SolarisApp.state.declination;
            const inc = SolarisApp.state.inclination || 0;
            const gparams = SolarisMath.calcWallGnomonParameters(lat, dec, gLen, inc);

            document.getElementById('spec-orthostyle-len').innerText = `${gparams.orthoLength.toFixed(1)} mm`;
            document.getElementById('spec-style-angle').innerHTML = `${gparams.styleAngle.toFixed(2)}&deg;`;
            document.getElementById('spec-substyle-angle').innerHTML = `${gparams.substyleAngle.toFixed(2)}&deg;`;
            document.getElementById('spec-h0-angle').innerHTML = `${gparams.h0.toFixed(2)}&deg;`;
            document.getElementById('spec-polar-len').innerText = `${gparams.polarLength.toFixed(1)} mm`;
        } else {
            // Pavimento
            const slope = SolarisApp.state.floorSlope || 0;
            const slopeDir = SolarisApp.state.floorSlopeDir || 180;
            
            const geom = SolarisMath.calcFloorSundialGeometry(lat, aVal, slope, slopeDir);
            const zToday = SolarisMath.calcFloorGnomonOffset(aVal, geom.phiVirt, solarDec, geom.rotationAngle);
            const zMax = SolarisMath.calcFloorGnomonOffset(aVal, geom.phiVirt, 23.44, geom.rotationAngle); // Solstizio est

            document.getElementById('spec-semi-minor-b').innerText = `${geom.b.toFixed(2)} m`;
            document.getElementById('spec-eccentricity').innerText = geom.eccentricity.toFixed(3);
            
            document.getElementById('spec-gnomon-pos').innerText = `X: ${zToday.x.toFixed(3)} m, Y: ${zToday.y.toFixed(3)} m`;
            document.getElementById('spec-gnomon-range').innerHTML = `X: &plusmn; ${Math.abs(zMax.x).toFixed(2)} m, Y: &plusmn; ${Math.abs(zMax.y).toFixed(2)} m`;
            document.getElementById('spec-gnomon-person').innerText = `${SolarisApp.state.personHeight.toFixed(2)} m`;
        }
    },

    /**
     * Riempie le tabelle di tracciamento cantiere per l'orologio analemmatico su piazza in pendenza
     */
    populateFloorTracingTables: () => {
        const lat = SolarisApp.state.latitude;
        const aVal = SolarisApp.state.ellipseWidth;
        const slope = SolarisApp.state.floorSlope || 0;
        const slopeDir = SolarisApp.state.floorSlopeDir || 180;
        
        const geom = SolarisMath.calcFloorSundialGeometry(lat, aVal, slope, slopeDir);
        const lang = SolarisApp.state.lang;

        // Aggiorna gli header della tabella del calendario in modo dinamico per mostrare X e Y reali
        document.querySelector('#table-dates th:nth-child(3)').innerText = lang === 'it' ? 'Y (Nord-Sud) (m)' : 'Y (North-South) (m)';
        document.querySelector('#table-dates th:nth-child(4)').innerText = lang === 'it' ? 'X (Est-Ovest) (m)' : 'X (East-West) (m)';

        // 1. PUNTI ORARI DELL'ELLISSE
        const hoursList = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        const hourAngles = hoursList.map(h => (h - 12) * 15);
        const hourPoints = SolarisMath.calcFloorHourPoints(aVal, geom.b, hourAngles, geom.rotationAngle);

        const hoursBody = document.getElementById('table-hours-body');
        hoursBody.innerHTML = "";

        hourPoints.forEach((pt, idx) => {
            const hVal = hoursList[idx];
            const isNoon = hVal === 12;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="${isNoon ? 'highlight' : ''}">${hVal}:00 ${isNoon ? (lang === 'it' ? '(Mezzogiorno)' : '(Noon)') : ''}</td>
                <td>${pt.hourAngle}°</td>
                <td class="highlight">${pt.x.toFixed(3)} m</td>
                <td class="highlight">${pt.y.toFixed(3)} m</td>
                <td>${pt.distance.toFixed(3)} m</td>
            `;
            hoursBody.appendChild(tr);
        });

        // 2. SCALA DEL CALENDARIO CENTRALIZZATA RUOTATA
        const calPoints = SolarisMath.getCalendarScalePoints(aVal, lat, slope, slopeDir);
        const datesBody = document.getElementById('table-dates-body');
        datesBody.innerHTML = "";

        calPoints.forEach(pt => {
            const tr = document.createElement('tr');
            const mName = lang === 'it' ? pt.nameIt : pt.nameEn;
            
            tr.innerHTML = `
                <td>1° ${mName}</td>
                <td>${pt.declination.toFixed(2)}°</td>
                <td class="highlight">${pt.y.toFixed(3)} m</td>
                <td class="highlight">${pt.x.toFixed(3)} m</td>
            `;
            datesBody.appendChild(tr);
        });
    },

    /**
     * Cambia tutti i testi dell'applicazione in base alla lingua
     */
    updateLanguage: () => {
        const lang = SolarisApp.state.lang;
        
        // Aggiorna bottone header
        const langBtn = document.getElementById('lang-btn');
        if (lang === "it") {
            langBtn.innerHTML = `<span class="lang-text">ENG</span> <span class="lang-flag">🇬🇧</span>`;
        } else {
            langBtn.innerHTML = `<span class="lang-text">ITA</span> <span class="lang-flag">🇮🇹</span>`;
        }

        // Trova tutti gli elementi con data-i18n e traducili
        document.querySelectorAll('[data-i18n]').forEach(elem => {
            const key = elem.getAttribute('data-i18n');
            if (SolarisTranslations[lang] && SolarisTranslations[lang][key]) {
                elem.innerText = SolarisTranslations[lang][key];
            }
        });

        // Aggiorna le descrizioni e le scritte degli slider
        SolarisApp.syncInputLabels();
    }
};

window.addEventListener('DOMContentLoaded', SolarisApp.init);
