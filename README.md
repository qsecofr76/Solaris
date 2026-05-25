# Solaris ☀️

**Solaris** è un'applicazione web interattiva, moderna e ad alte prestazioni progettata per il calcolo astronomico, la progettazione e il tracciamento di meridiane solari professionali. 

Il software funziona interamente **lato client (client-side)** all'interno del browser, senza alcuna dipendenza esterna o necessità di server, offrendo un'interfaccia utente premium ad alto impatto visivo con stile *glassmorphic*, supporto bilingue (Italiano/Inglese) e aggiornamenti grafici istantanei in tempo reale.

---

## 🚀 Caratteristiche Principali

Solaris supporta la progettazione di due grandi tipologie di orologi solari:

### 1. Meridiana Verticale Declinante ed Inclinata (A Parete)
* **Geometria Avanzata**: Calcolo accurato di stilo polare (ipotenusa), altezza dell'ortostilo ($h$, stilo fisico perpendicolare), distanza del substilo e angolo del substilo ($SD$).
* **Orientamento arbitrario**: Gestione della declinazione del muro (orientamento rispetto al Sud) e dell'inclinazione fisica della parete rispetto alla verticale.
* **Linee del Tempo e del Calendario**: Tracciamento delle linee orarie solari e delle iperboli diurne del calendario (Solstizio d'Estate, Solstizio d'Inverno ed Equinozi).
* **Lemniscata dell'Orario XII**: Tracciamento della curva a forma di otto (analemma) sull'orario di mezzogiorno per correggere visivamente la differenza tra il Tempo Solare Vero e il Tempo Medio (meccanico), basata sull'Equazione del Tempo (EoT).
* **Data Speciale (Anniversario)**: Funzione unica che consente all'utente di inserire una data e un'ora speciale (es. compleanno, matrimonio). Il sistema calcola l'ombra esatta in quel momento e disegna sul quadrante un punto verde smeraldo con etichetta personalizzata (es. `💚 Matrimonio`).

### 2. Orologio a Pavimento (Meridiana Umana Analemmatica)
* **Gnomone Umano**: Progettazione di meridiane analemmatiche ellittiche in cui è la persona stessa a fungere da gnomone posizionandosi sulla scala centrale dei mesi.
* **Correzione di Pendenza**: Algoritmi astronomici proprietari per calcolare e deformare l'ellisse e le coordinate dei punti orari in base alla pendenza della piazza e alla sua direzione azimutale rispetto agli assi cardinali.
* **Scala del Calendario Interattiva**: Posizionamento esatto dei giorni dell'anno sull'asse Nord-Sud in base alla declinazione solare giornaliera.
* **Tabella di Tracciamento Cantiere**: Generazione di una tabella di coordinate cartesiane $(X, Y)$ in metri per il tracciamento dei punti orari e della scala del calendario direttamente sul terreno.

---

## 💾 Esportazioni Professionali ed Output

Solaris è progettato per agevolare la realizzazione fisica delle meridiane fornendo diversi strumenti di esportazione:

* **📐 CAD DXF (Scala Reale 1:1 in mm)**: Esportazione in formato DXF standard (compatibile con AutoCAD, Rhino, QCad, macchine CNC o taglio laser). Il disegno viene generato a scala reale in millimetri, organizzato su layer strutturati e codificati per colore ACI:
  * `ASSI_CARDINALI` (Colore 1 - Rosso)
  * `LINEE_ORARIE` (Colore 4 - Cyan)
  * `CURVE_DECLINAZIONE` (Colore 6 - Magenta)
  * `LEMNISCATA` (Colore 2 - Giallo)
  * `ANNIVERSARIO` (Colore 3 - Verde)
  * `GNOMONE_DIMA` (Colore 2 - Giallo) per la sagoma dello gnomone a parete.
* **🎨 SVG Vettoriale**: Grafica scalabile ad alta risoluzione ideale per stampe o modifiche in programmi di grafica vettoriale (Illustrator, Inkscape).
* **📄 Report Tecnico PDF**: Generazione di un documento di stampa professionale che include tutti i parametri gnomonici di progetto, le tabelle di coordinate e il disegno grafico vettoriale della meridiana.
* **🌐 Standalone HTML**: Esportazione dell'intero report tecnico in un singolo file HTML autocontenuto e scaricabile.

---

## 🛠️ Architettura del Codice e Struttura File

Il progetto è strutturato in modo modulare con codice JavaScript nativo (ES6) ben organizzato:

```text
Solaris/
│
├── index.html          # Interfaccia grafica (HTML5) con dizionari i18n
├── css/
│   └── styles.css      # Design System, variabili, vetromorfismo e layout responsive
│
└── js/
    ├── math.js         # Core matematico-astronomico (Equazione del tempo, coordinate solari)
    ├── chart.js        # Rendering Canvas del grafico dell'Equazione del Tempo (EoT)
    ├── renderer.js     # Engine di rendering grafico (Canvas a schermo, SVG, PDF e DXF CAD)
    └── app.js          # Coordinatore degli eventi dell'interfaccia e gestione dello stato UI
```

### Dettaglio dei Moduli JS:
1. **[math.js](js/math.js)**: Contiene gli algoritmi astronomici. Calcola la declinazione solare, l'Equazione del Tempo ($EoT$), la conversione tra ora civile e ora solare vera (considerando longitudine, fuso orario ed eventuale ora legale), e le proiezioni geometriche tridimensionali dell'ombra del nodulo su pareti verticali (declinate/inclinate) o pavimenti in pendenza.
2. **[renderer.js](js/renderer.js)**: Si occupa di tradurre i calcoli matematici in elementi visivi. Disegna sul Canvas HTML5 interattivo e gestisce la formattazione testuale dei file SVG e DXF.
3. **[chart.js](js/chart.js)**: Disegna un grafico interattivo annuale dell'Equazione del Tempo che evidenzia visivamente in quale giorno dell'anno si trova la simulazione corrente.
4. **[app.js](js/app.js)**: Collega tutti i controlli (slider, input numerici coordinati, date picker e pulsanti di esportazione), sincronizza lo stato dell'applicazione e applica dinamicamente le traduzioni in tempo reale.

---

## 🌍 Calcolo Astronomico e Formule

Solaris si basa sulle equazioni astronomiche classiche di posizionamento solare:
* **Declinazione Solare ($\delta$)**: Calcolata mediante l'approssimazione di Cooper.
* **Equazione del Tempo ($EoT$)**: Calcolata con lo sviluppo in serie di Taylor a due termini per determinare la discrepanza in minuti tra il sole medio e il sole vero.
* **Proiezione dello Stilo**: Trasformazione di coordinate sferiche locali (Altezza, Azimut del sole) in coordinate cartesiane sul piano della meridiana ruotato (declinazione $D$) ed inclinato ($I$).

---

## 💻 Installazione e Avvio Rapido

Il progetto **non richiede alcuna installazione** o build step (Zero-Config).

1. Clona il repository o scarica i file:
   ```bash
   git clone https://github.com/qsecofr76/Solaris.git
   ```
2. Apri il file `index.html` in qualsiasi browser moderno (Chrome, Firefox, Safari, Edge):
   * È sufficiente fare doppio clic sul file `index.html` o servirlo tramite una semplice estensione di sviluppo locale (es. *Live Server* su VS Code) o con Python:
     ```bash
     python -m http.server 8000
     ```
   * Naviga su `http://localhost:8000`.

---

## 🎨 Design & UX Premium
* **Glassmorphism**: Sfondo scuro dinamico ed elegante con pannelli satinati semitrasparenti e sfocatura dello sfondo (*backdrop-filter*).
* **Responsive Layout**: Adattamento automatico a qualsiasi risoluzione dello schermo (desktop, tablet e dispositivi mobili).
* **Input Sincronizzati**: I parametri possono essere inseriti sia in modo rapido e interattivo tramite comodi *slider*, sia in modo preciso immettendo i valori decimali esatti tramite *input numerici*. I due controlli si mantengono perfettamente sincronizzati in tempo reale.

---

## 📄 Licenza

Questo progetto è distribuito con licenza ad uso esclusivo per la progettazione e il tracciamento di meridiane solari. Tutti i diritti matematici e di rendering sono riservati.

---
*Sviluppato con passione per l'astronomia, la gnomonica e il design moderno.* ☀️
