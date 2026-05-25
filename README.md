# Solaris ☀️

[Italiano](#italiano) | [English](#english)

---

## Italiano

**Solaris** è un'applicazione web per il calcolo astronomico, la progettazione e il tracciamento di meridiane solari. Il software funziona interamente lato client (client-side) all'interno del browser, senza necessità di server, offrendo supporto bilingue (Italiano/Inglese) e aggiornamenti grafici in tempo reale durante la modifica dei parametri.

### 🚀 Caratteristiche Tecniche

Il software supporta la progettazione di due tipologie di orologi solari:

#### 1. Meridiana Verticale Declinante ed Inclinata (A Parete)
* **Parametri Gnomonici**: Calcolo dello stilo polare (ipotenusa), altezza dell'ortostilo ($h$, stilo fisico perpendicolare), distanza del substilo e angolo del substilo ($SD$).
* **Orientamento Parete**: Gestione della declinazione del muro (orientamento rispetto al Sud) e dell'inclinazione della parete rispetto alla verticale.
* **Linee del Tempo e del Calendario**: Tracciamento delle linee orarie solari e delle iperboli diurne del calendario (Solstizio d'Estate, Solstizio d'Inverno ed Equinozi).
* **Lemniscata dell'Orario XII**: Tracciamento della curva dell'analemma sull'orario di mezzogiorno solare basata sull'Equazione del Tempo (EoT) per la visualizzazione grafica del tempo medio.
* **Data Speciale (Anniversario)**: Possibilità di inserire una data e un'ora speciale. Il sistema calcola l'ombra in quel momento e disegna sul quadrante un punto verde smeraldo con etichetta descrittiva personalizzata.

#### 2. Orologio a Pavimento (Meridiana Umana Analemmatica)
* **Gnomone Umano**: Progettazione di meridiane analemmatiche ellittiche in cui la persona si posiziona sulla scala centrale dei mesi per proiettare l'ombra.
* **Correzione di Pendenza**: Algoritmi per calcolare e deformare l'ellisse e le coordinate dei punti orari in base alla pendenza del pavimento e alla sua direzione azimutale.
* **Scala del Calendario**: Posizionamento dei giorni dell'anno sull'asse Nord-Sud in base alla declinazione solare giornaliera.
* **Tabella di Tracciamento**: Generazione di una tabella di coordinate cartesiane $(X, Y)$ in metri per il tracciamento dei punti orari e della scala del calendario sul terreno.

### 💾 Esportazioni ed Output

* **📐 CAD DXF (Scala Reale 1:1 in mm)**: Esportazione in formato DXF compatibile con AutoCAD, Rhino, QCad o macchine a controllo numerico (CNC). Generata a scala reale in millimetri, organizzata su layer strutturati e codificati per colore ACI:
  * `ASSI_CARDINALI` (Colore 1 - Rosso)
  * `LINEE_ORARIE` (Colore 4 - Cyan)
  * `CURVE_DECLINAZIONE` (Colore 6 - Magenta)
  * `LEMNISCATA` (Colore 2 - Giallo)
  * `ANNIVERSARIO` (Colore 3 - Verde)
  * `GNOMONE_DIMA` (Colore 2 - Giallo) per la sagoma dello gnomone a parete.
* **🎨 SVG Vettoriale**: Grafica scalabile ad alta risoluzione ideale per stampe o modifiche in programmi di disegno vettoriale.
* **📄 Report Tecnico PDF**: Generazione di un documento di stampa che include i parametri gnomonici di progetto, le tabelle di coordinate e il disegno vettoriale della meridiana.
* **🌐 Standalone HTML**: Esportazione del report tecnico in un singolo file HTML indipendente scaricabile.

### 🛠️ Struttura dei File

```text
Solaris/
│
├── index.html          # Interfaccia grafica (HTML5) con dizionari i18n
├── css/
│   └── styles.css      # Stili di layout, variabili e foglio di stile
│
└── js/
    ├── math.js         # Calcoli matematico-astronomici (Equazione del tempo, coordinate solari)
    ├── chart.js        # Grafico dell'Equazione del Tempo (EoT) su canvas
    ├── renderer.js     # Rendering grafico (Canvas, SVG, PDF e DXF CAD)
    └── app.js          # Gestione eventi dell'interfaccia e stato dell'applicazione
```

---

## English

**Solaris** is a web application for the astronomical calculation, design, and tracing of solar sundials. The software runs entirely client-side inside the browser without requiring a backend server, offering bilingual support (Italian/English) and real-time visual updates when modifying parameters.

### 🚀 Technical Features

The software supports the design of two main types of solar clocks:

#### 1. Declining and Inclined Vertical Sundial (Wall-mounted)
* **Gnomonic Parameters**: Computation of the polar style (hypotenuse), orthostyle height ($h$, perpendicular physical style), substyle distance, and substyle angle ($SD$).
* **Wall Orientation**: Management of wall declination (bearing relative to South) and wall inclination relative to the vertical plane.
* **Time and Calendar Lines**: Tracing of solar hour lines and diurnal hyperbolas for the calendar (Summer Solstice, Winter Solstice, and Equinoxes).
* **Hour XII Lemniscate**: Tracing of the analemma curve on the noon hour line based on the Equation of Time (EoT) to graphically represent mean time.
* **Special Date (Anniversary)**: Option to enter a specific date and time. The system calculates the shadow position at that moment and draws an emerald green dot with a custom label on the face.

#### 2. Floor Sundial (Human Analemmatic)
* **Human Gnomon**: Design of elliptical analemmatic sundials where a person stands on the central monthly scale to cast the shadow.
* **Slope Correction**: Algorithms to calculate and deform the ellipse and hour coordinates according to the ground slope angle and its azimuth direction.
* **Calendar Scale**: Positioning of the days of the year along the North-South axis based on daily solar declination.
* **Tracing Table**: Generation of a Cartesian coordinate table $(X, Y)$ in meters for physical layout tracing on the ground.

### 💾 Exporters and Output

* **📐 CAD DXF (Real Scale 1:1 in mm)**: Export in DXF format compatible with AutoCAD, Rhino, QCad, or CNC machines. Generated at a 1:1 scale in millimeters, organized on structured ACI color-coded layers:
  * `ASSI_CARDINALI` (Color 1 - Red)
  * `LINEE_ORARIE` (Color 4 - Cyan)
  * `CURVE_DECLINAZIONE` (Color 6 - Magenta)
  * `LEMNISCATA` (Color 2 - Yellow)
  * `ANNIVERSARIO` (Color 3 - Green)
  * `GNOMONE_DIMA` (Color 2 - Yellow) for the physical wall-mounted gnomon template.
* **🎨 Vector SVG**: Scalable vector graphic suitable for print or modifications in vector design software.
* **📄 Technical PDF Report**: Generation of a printable report containing the gnomonic design parameters, coordinate tables, and vector drawing.
* **🌐 Standalone HTML**: Export of the technical report into a single independent downloadable HTML file.

---

### ✍️ Signature / Firma

Realizzato da **Roby DM con Antigravity** - per **Astrofili Ponte di Piave** - TV - Italy
*Created by **Roby DM with Antigravity** - for **Astrofili Ponte di Piave** - TV - Italy*
