/**
 * Solaris - Rendering Grafico (Canvas 2D) ed Esportazione SVG/CSV
 */

const SolarisRenderer = {
    // Stato di zoom/pan per il trascinamento del Canvas (opzionale, manteniamo semplice e fluido)
    zoom: 1.0,
    panX: 0,
    panY: 0,

    /**
     * Pulisce e prepara il canvas con il corretto DPI
     */
    setupCanvas: (canvas) => {
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        return {
            ctx: ctx,
            width: rect.width,
            height: rect.height,
            cx: rect.width / 2,
            cy: rect.height / 2
        };
    },

    /**
     * DISEGNA LA MERIDIANA A PARETE (VERTICALE DECLINANTE)
     */
    drawWallSundial: (canvasId, params, date, timeStr, lang = "it") => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const { ctx, width, height, cx, cy } = SolarisRenderer.setupCanvas(canvas);

        // Estrazione parametri
        const lat = params.latitude;
        const dec = params.declination;
        const gLen = params.gnomonLength;

        // Calcola parametri geometrici gnomonici
        const gparams = SolarisMath.calcWallGnomonParameters(lat, dec, gLen, params.inclination);

        // Calcola la posizione del sole per il giorno e ora selezionati
        const dayOfYear = SolarisMath.getDayOfYear(date);
        const solarDec = SolarisMath.getSolarDeclination(dayOfYear);
        const eot = SolarisMath.getEquationOfTime(dayOfYear);
        
        // Conversione tempo civile -> tempo solare per il calcolo dell'angolo orario
        // Estrai ore e minuti da timeStr ("HH:MM")
        const [hours, minutes] = timeStr.split(':').map(Number);
        const civilTimeDec = hours + minutes / 60;
        const solarTimeDec = SolarisMath.civilToSolarTime(civilTimeDec, params.longitude, params.timezone, eot, params.isDst);
        
        const hourAngle = (solarTimeDec - 12) * 15; // 15° per ora
        const sunPos = SolarisMath.getSunPosition(lat, solarDec, hourAngle);

        // 1. Sfondo Canvas (Notte Profonda con sfumatura radiale)
        const radGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(cx, cy));
        radGrad.addColorStop(0, '#0c1122');
        radGrad.addColorStop(1, '#05070e');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);

        // Disegna una griglia circolare decorativa molto sottile (stile astrolabio)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.04)';
        ctx.lineWidth = 1;
        for (let r = 50; r <= Math.max(width, height) / 2; r += 50) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.stroke();
        }
        // Centro della meridiana (origine dei calcoli)
        // Posizioniamo l'origine (il punto di attacco dello gnomone) leggermente in alto per lasciare spazio sotto
        const ox = cx;
        const oy = cy - 30;

        const wallZoom = params.wallZoom !== undefined ? params.wallZoom / 100 : 1.0;

        // Scala di disegno: vogliamo far entrare una meridiana di raggio ~180px nel viewport
        // Usiamo un raggio di riferimento per disegnare le linee orarie.
        // Aumentiamo la base da 0.38 a 0.40 e applichiamo lo zoom.
        const R_ref = Math.min(width, height) * 0.40 * wallZoom;

        // Definiamo un fattore di scala per i millimetri reali a pixel sul canvas
        // gparams.polarLength (es. 200mm) viene mappato a circa 0.45 * R_ref pixel
        const mmToPx = (0.45 * R_ref) / gparams.polarLength;

        // 2. Disegna le linee orarie solari (dalle 6:00 alle 18:00)
        const hoursList = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
        const hourAngles = hoursList.map(h => (h - 12) * 15);
        const wallHourLines = SolarisMath.calcWallHourLines(gparams.styleAngle, gparams.h0, gparams.substyleAngle, hourAngles);

        ctx.lineWidth = 1.5;
        ctx.font = '12px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Numeri romani per un tocco classico premium
        const romanNumerals = {
            6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI",
            12: "XII", 13: "I", 14: "II", 15: "III", 16: "IV", 17: "V", 18: "VI"
        };

        wallHourLines.forEach((line, index) => {
            const hVal = hoursList[index];
            const thetaRad = SolarisMath.degToRad(line.angleFromVertical);

            // Verifica se il sole illumina questa specifica linea oraria (geometricamente valida)
            // Una linea oraria è valida se l'angolo orario solare corrispondente dà il sole sopra l'orizzonte e davanti alla parete
            const dummySun = SolarisMath.getSunPosition(lat, solarDec, line.hourAngle);
            const dummyProj = SolarisMath.projectNodusShadowOnWall(dummySun.altitude, dummySun.azimuth, lat, dec, gparams, params.inclination);
            
            const isValidOnWall = (dummyProj !== null);

            // Calcola i punti d'ombra al solstizio d'inverno (-23.44) e d'estate (23.44) per il clipping delle linee
            const sPosWin = SolarisMath.getSunPosition(lat, -23.44, line.hourAngle);
            const shWin = SolarisMath.projectNodusShadowOnWall(sPosWin.altitude, sPosWin.azimuth, lat, dec, gparams, params.inclination);

            const sPosSum = SolarisMath.getSunPosition(lat, 23.44, line.hourAngle);
            const shSum = SolarisMath.projectNodusShadowOnWall(sPosSum.altitude, sPosSum.azimuth, lat, dec, gparams, params.inclination);

            // Se entrambi sono null, significa che il sole non illumina mai la parete a quest'ora durante l'anno
            if (!shWin && !shSum) return;

            // Calcoliamo le distanze dall'Apex in pixel
            const dWin = shWin ? Math.sqrt(shWin.x * shWin.x + shWin.y * shWin.y) * mmToPx : null;
            const dSum = shSum ? Math.sqrt(shSum.x * shSum.x + shSum.y * shSum.y) * mmToPx : null;

            let dStart = R_ref * 0.15;
            let dEnd = R_ref * 1.25;

            if (dWin !== null && dSum !== null) {
                dStart = Math.min(dWin, dSum);
                dEnd = Math.max(dWin, dSum);
            } else if (dSum !== null) {
                dStart = R_ref * 0.15;
                dEnd = dSum;
            } else if (dWin !== null) {
                dStart = R_ref * 0.15;
                dEnd = dWin;
            }

            // Applichiamo i limiti per evitare che vadano fuori dal quadrante
            const dEndClipped = Math.min(dEnd, R_ref * 1.25);
            const dStartClipped = Math.min(dStart, R_ref * 1.2);

            // Se per qualche motivo geometrico anomalo dStart >= dEnd, saltiamo
            if (dStartClipped >= dEndClipped) return;

            // Se la linea non è illuminabile alla data selezionata, la disegniamo molto tenue
            if (!isValidOnWall) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            }

            // Calcola le coordinate reali sul canvas del segmento orario
            const lx1 = ox + dStartClipped * Math.sin(thetaRad);
            const ly1 = oy + dStartClipped * Math.cos(thetaRad);
            const lx2 = ox + dEndClipped * Math.sin(thetaRad);
            const ly2 = oy + dEndClipped * Math.cos(thetaRad);

            // Disegna il segmento orario limitato tra i solstizi
            ctx.beginPath();
            ctx.moveTo(lx1, ly1);
            ctx.lineTo(lx2, ly2);
            ctx.stroke();

            // Scrivi etichetta dell'ora (posizionata appena oltre la fine della linea, seguendo la curva del solstizio)
            const labelDist = dEndClipped + 18;
            const tx = ox + labelDist * Math.sin(thetaRad);
            const ty = oy + labelDist * Math.cos(thetaRad);

            ctx.save();
            ctx.translate(tx, ty);
            let textRotation = thetaRad;
            if (textRotation > Math.PI / 2) textRotation -= Math.PI;
            if (textRotation < -Math.PI / 2) textRotation += Math.PI;
            ctx.rotate(textRotation);
            
            // Metti in risalto il mezzogiorno (XII)
            if (hVal === 12 && isValidOnWall) {
                ctx.fillStyle = varColor('--accent-gold');
                ctx.font = 'bold 13px "Space Grotesk", sans-serif';
            }
            ctx.fillText(romanNumerals[hVal], 0, 0);
            ctx.restore();
        });

        // 3. Disegna lo Gnomone Ribaltato (Dima di costruzione sul piano del muro)
        const sdRad = SolarisMath.degToRad(gparams.substyleAngle);
        const aRad = SolarisMath.degToRad(gparams.styleAngle);
        
        // Punti chiave in pixel
        const footX = ox + (gparams.substyleLength * mmToPx) * Math.sin(sdRad);
        const footY = oy + (gparams.substyleLength * mmToPx) * Math.cos(sdRad);
        const foldedNodusX = footX + (gparams.orthoLength * mmToPx) * Math.cos(sdRad);
        const foldedNodusY = footY - (gparams.orthoLength * mmToPx) * Math.sin(sdRad);

        // Riempimento del triangolo dello gnomone
        ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(footX, footY);
        ctx.lineTo(foldedNodusX, foldedNodusY);
        ctx.closePath();
        ctx.fill();

        // Contorno dello gnomone tratteggiato
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(footX, footY);
        ctx.lineTo(foldedNodusX, foldedNodusY);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Etichette dei lati dello gnomone ribaltato
        ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.font = 'italic 10px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 1. Label Substilo (Base)
        const midBaseX = (ox + footX) / 2;
        const midBaseY = (oy + footY) / 2;
        // Spostamento a sinistra della linea del substilo
        const shiftBaseX = -12 * Math.cos(sdRad);
        const shiftBaseY = 12 * Math.sin(sdRad);
        ctx.save();
        ctx.translate(midBaseX + shiftBaseX, midBaseY + shiftBaseY);
        // Ruota parallelo al substilo
        let rotBase = sdRad;
        if (rotBase > Math.PI/2) rotBase -= Math.PI;
        if (rotBase < -Math.PI/2) rotBase += Math.PI;
        ctx.rotate(rotBase);
        ctx.fillText(lang === "it" ? `Substilo: ${gparams.substyleLength.toFixed(1)} mm` : `Substyle: ${gparams.substyleLength.toFixed(1)} mm`, 0, 0);
        ctx.restore();

        // 2. Label Ortostilo (Altezza)
        const midOrthoX = (footX + foldedNodusX) / 2;
        const midOrthoY = (footY + foldedNodusY) / 2;
        // Spostamento sotto/esterno
        const shiftOrthoX = 12 * Math.sin(sdRad);
        const shiftOrthoY = 12 * Math.cos(sdRad);
        ctx.save();
        ctx.translate(midOrthoX + shiftOrthoX, midOrthoY + shiftOrthoY);
        // Ruota parallelo all'ortostilo
        let rotOrtho = sdRad - Math.PI/2;
        if (rotOrtho > Math.PI/2) rotOrtho -= Math.PI;
        if (rotOrtho < -Math.PI/2) rotOrtho += Math.PI;
        ctx.rotate(rotOrtho);
        ctx.fillText(lang === "it" ? `Ortostilo (h): ${gparams.orthoLength.toFixed(1)} mm` : `Orthostyle (h): ${gparams.orthoLength.toFixed(1)} mm`, 0, 0);
        ctx.restore();

        // 3. Label Stilo Polare (Ipotenusa)
        const midHypX = (ox + foldedNodusX) / 2;
        const midHypY = (oy + foldedNodusY) / 2;
        // Spostamento a destra/esterno dell'ipotenusa
        const hypAngle = sdRad + aRad;
        const shiftHypX = 12 * Math.cos(hypAngle);
        const shiftHypY = -12 * Math.sin(hypAngle);
        ctx.save();
        ctx.translate(midHypX + shiftHypX, midHypY + shiftHypY);
        // Ruota parallelo all'ipotenusa
        let rotHyp = hypAngle;
        if (rotHyp > Math.PI/2) rotHyp -= Math.PI;
        if (rotHyp < -Math.PI/2) rotHyp += Math.PI;
        ctx.rotate(rotHyp);
        ctx.fillStyle = 'var(--accent-gold)';
        ctx.font = 'bold italic 10px "Space Grotesk", sans-serif';
        ctx.fillText(lang === "it" ? `Stilo Polare: ${gparams.polarLength.toFixed(1)} mm` : `Polar Style: ${gparams.polarLength.toFixed(1)} mm`, 0, 0);
        ctx.restore();

        // Indicazione dell'angolo dello stilo
        ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.font = '9px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`a = ${gparams.styleAngle.toFixed(1)}°`, ox + 15 * Math.sin(sdRad + aRad/2), oy + 15 * Math.cos(sdRad + aRad/2) + 5);

        // 4. Disegna l'Apex (Punto di fissaggio dello gnomone a muro)
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = 'var(--accent-gold)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'var(--accent-gold)';
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'var(--accent-gold)';
        ctx.font = 'bold 10px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lang === "it" ? "FISSAGGIO STILO (APEX)" : "STYLE ATTACHMENT (APEX)", ox, oy - 15);

        // 4. Disegna le curve di declinazione (Solstizi ed Equinozi)
        // Disegniamo 3 curve calcolando l'ombra del nodulo per ogni ora utile della giornata
        const declinationValues = [
            { decVal: 23.44, color: '#f59e0b', label: lang === "it" ? "Solstizio d'Estate" : "Summer Solstice" },  // Estate
            { decVal: 0, color: '#10b981', label: lang === "it" ? "Equinozi" : "Equinoxes" },                       // Equinozi
            { decVal: -23.44, color: '#3b82f6', label: lang === "it" ? "Solstizio d'Inverno" : "Winter Solstice" } // Inverno
        ];

        declinationValues.forEach(dVal => {
            ctx.strokeStyle = dVal.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.55;

            ctx.beginPath();
            let firstPoint = true;
            const validPoints = [];

            // Disegniamo la curva calcolando la posizione dell'ombra ogni 15 minuti (3.75 gradi)
            for (let hDeg = -120; hDeg <= 120; hDeg += 2.5) {
                const sPos = SolarisMath.getSunPosition(lat, dVal.decVal, hDeg);
                const shadow = SolarisMath.projectNodusShadowOnWall(sPos.altitude, sPos.azimuth, lat, dec, gparams, params.inclination);

                if (shadow) {
                    // Scala le coordinate mm in pixel
                    const sx = ox + shadow.x * mmToPx;
                    const sy = oy + shadow.y * mmToPx;

                    // Limita il disegno entro un'area sensata per evitare linee infinite all'alba/tramonto
                    const dist = Math.sqrt((sx-ox)*(sx-ox) + (sy-oy)*(sy-oy));
                    if (dist < R_ref * 1.3) {
                        validPoints.push({ x: sx, y: sy });
                        if (firstPoint) {
                            ctx.moveTo(sx, sy);
                            firstPoint = false;
                        } else {
                            ctx.lineTo(sx, sy);
                        }
                    }
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            // Disegna i simboli zodiacali agli estremi della curva per un aspetto classico premium
            if (validPoints.length >= 2) {
                const startPt = validPoints[0];
                const endPt = validPoints[validPoints.length - 1];

                ctx.fillStyle = dVal.color;
                ctx.font = '13px "Space Grotesk", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                let startSymbol = "";
                let endSymbol = "";
                if (dVal.decVal === 23.44) {
                    startSymbol = "♋";
                    endSymbol = "♋";
                } else if (dVal.decVal === 0) {
                    startSymbol = "♈";
                    endSymbol = "♎";
                } else if (dVal.decVal === -23.44) {
                    startSymbol = "♑";
                    endSymbol = "♑";
                }

                if (startSymbol) {
                    const dxStart = startPt.x - ox;
                    const dyStart = startPt.y - oy;
                    const lenStart = Math.sqrt(dxStart*dxStart + dyStart*dyStart);
                    if (lenStart > 0.001) {
                        const sxText = startPt.x + (dxStart / lenStart) * 12;
                        const syText = startPt.y + (dyStart / lenStart) * 12;
                        ctx.fillText(startSymbol, sxText, syText);
                    }
                }

                if (endSymbol) {
                    const dxEnd = endPt.x - ox;
                    const dyEnd = endPt.y - oy;
                    const lenEnd = Math.sqrt(dxEnd*dxEnd + dyEnd*dyEnd);
                    if (lenEnd > 0.001) {
                        const exText = endPt.x + (dxEnd / lenEnd) * 12;
                        const eyText = endPt.y + (dyEnd / lenEnd) * 12;
                        ctx.fillText(endSymbol, exText, eyText);
                    }
                }
            }
        });

        // 5. Disegna la proiezione dell'ombra dello stilo in TEMPO REALE
        const currentShadow = SolarisMath.projectNodusShadowOnWall(sunPos.altitude, sunPos.azimuth, lat, dec, gparams, params.inclination);

        if (currentShadow) {
            const shx = ox + currentShadow.x * mmToPx;
            const shy = oy + currentShadow.y * mmToPx;

            // Disegna l'ombra dello stilo (una linea scura sfocata dal piede dello stilo sul substilo al punto dell'ombra)
            // Il piede dello stilo (ortostilo) sul muro si trova sul substilo a distanza substyleLength dall'origine
            const footX = ox + (gparams.substyleLength * mmToPx) * Math.sin(sdRad);
            const footY = oy + (gparams.substyleLength * mmToPx) * Math.cos(sdRad);

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            
            // Disegna l'ombra dello stilo polare (dall'origine al punto dell'ombra)
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(shx, shy);
            ctx.stroke();

            // Disegna l'ombra dell'ortostilo (dal piede al punto dell'ombra)
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(footX, footY);
            ctx.lineTo(shx, shy);
            ctx.stroke();

            // Ripristina ombreggiature
            ctx.shadowBlur = 0;

            // Disegna il nodulo (punto luminoso dorato dove cade l'ombra della punta)
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = varColor('--accent-gold');
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(shx, shy, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Seleziona ora solare corrente stampata sul quadrante
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '11px "Space Grotesk", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`☀️ ${lang === "it" ? "Ombra reale" : "Real Shadow"}`, shx + 10, shy - 5);
        } else {
            // Muro in ombra o sole tramontato
            ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.font = 'bold 12px "Space Grotesk", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(lang === "it" ? "PARETE IN OMBRA O SOLE SOTTO L'ORIZZONTE" : "WALL IN SHADOW OR SUN BELOW HORIZON", cx, height - 30);
        }

        // 6. Cornice estetica e diciture
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        // Scala metrica indicativa
        const scaleLenPx = 50; // 50px
        const scaleLenMm = scaleLenPx / mmToPx;
        const legendText = `100 px = ${(100 / mmToPx).toFixed(0)} mm`;
        document.getElementById('legend-scale-text').innerText = legendText;
    },

    /**
     * DISEGNA L'OROLOGIO A PAVIMENTO (SUNDIAL UMANO ANALEMMATICO SU PIAZZA IN PENDENZA)
     */
    drawFloorSundial: (canvasId, params, date, timeStr, lang = "it") => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const { ctx, width, height, cx, cy } = SolarisRenderer.setupCanvas(canvas);

        const lat = params.latitude;
        const a = params.ellipseWidth; // Semiasse maggiore in metri (es. 3m)
        const slope = params.floorSlope || 0;
        const slopeDir = params.floorSlopeDir || 180;

        // Geometria ellisse con supporto pendenza piazza
        const geom = SolarisMath.calcFloorSundialGeometry(lat, a, slope, slopeDir);

        // Calcoli solari per ombra proiettata
        const dayOfYear = SolarisMath.getDayOfYear(date);
        const solarDec = SolarisMath.getSolarDeclination(dayOfYear);
        const eot = SolarisMath.getEquationOfTime(dayOfYear);
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const civilTimeDec = hours + minutes / 60;
        const solarTimeDec = SolarisMath.civilToSolarTime(civilTimeDec, params.longitude, params.timezone, eot, params.isDst);
        
        const hourAngle = (solarTimeDec - 12) * 15;
        const sunPos = SolarisMath.getSunPosition(lat, solarDec, hourAngle);

        // Posizione dello gnomone (persona) oggi - Fully Rotated
        const zOffset = SolarisMath.calcFloorGnomonOffset(a, geom.phiVirt, solarDec, geom.rotationAngle);

        // 1. Sfondo Canvas (Pietra scura spazzolata)
        const radGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(cx, cy));
        radGrad.addColorStop(0, '#0e1327');
        radGrad.addColorStop(1, '#05070e');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);

        // Griglia di piastrellato decorativo per evocare la piazza
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        const gridSpacing = 40;
        for (let x = 0; x < width; x += gridSpacing) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSpacing) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        const floorZoom = params.floorZoom !== undefined ? params.floorZoom / 100 : 0.8;
        // Scala di disegno: semiasse maggiore 'a' basato sul lato minore del canvas per evitare traboccamenti
        const scalePxPerM = (Math.min(width, height) * 0.40 * floorZoom) / a;

        // Disegna assi cartesiani principali (N-S ed E-W) della piazza
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        // Asse E-W
        ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(width - 20, cy); ctx.stroke();
        // Asse N-S
        ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, height - 20); ctx.stroke();

        // Indicatori dei punti cardinali
        ctx.font = 'bold 11px "Space Grotesk", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("N (Nord)", cx, 15);
        ctx.fillText("S (Sud)", cx, height - 15);
        ctx.fillText("W (Ovest)", 35, cy);
        ctx.fillText("E (Est)", width - 35, cy);

        // 2. Disegna l'ellisse teorica delle ore (ruotata per pendenza piazza)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Disegna ellisse ruotata rispetto all'asse Y della piazza
        ctx.ellipse(cx, cy, a * scalePxPerM, geom.b * scalePxPerM, -geom.rotationAngle, 0, 2 * Math.PI);
        ctx.stroke();

        // 3. Disegna le ore sull'ellisse (dalle 4:00 alle 20:00 per includere le ore estive)
        const hoursList = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        const hourAngles = hoursList.map(h => (h - 12) * 15);
        const hourPoints = SolarisMath.calcFloorHourPoints(a, geom.b, hourAngles, geom.rotationAngle);

        ctx.font = 'bold 11px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        hourPoints.forEach((pt, index) => {
            const hVal = hoursList[index];
            
            // Mappatura coordinate sul canvas:
            // X_canvas = cx + X_real * scale
            // Y_canvas = cy - Y_real * scale (perché Nord reale è +Y, Nord canvas è -Y)
            const px = cx + pt.x * scalePxPerM;
            const py = cy - pt.y * scalePxPerM;

            // Disegna il marcatore dell'ora (una borchia dorata/piastrella rotonda)
            const isNoon = hVal === 12;
            ctx.fillStyle = isNoon ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(px, py, isNoon ? 4.5 : 3, 0, 2 * Math.PI);
            ctx.fill();

            // Scrivi il numero dell'ora
            const labelRadius = 15;
            // Spingi l'etichetta leggermente all'esterno dell'ellisse
            const angle = Math.atan2(-pt.y * scalePxPerM, pt.x * scalePxPerM);
            const tx = px + labelRadius * Math.cos(angle);
            const ty = py + labelRadius * Math.sin(angle);

            ctx.fillStyle = isNoon ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(hVal.toString(), tx, ty);
        });

        // 4. Disegna la scala del calendario centrale (ruotata sull'asse della piazza in pendenza)
        const calPoints = SolarisMath.getCalendarScalePoints(a, lat, slope, slopeDir);
        
        ctx.lineWidth = 1;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '9px "Space Grotesk", sans-serif';

        const cosRot = Math.cos(geom.rotationAngle);
        const sinRot = Math.sin(geom.rotationAngle);

        calPoints.forEach(pt => {
            // Coordinate 2D ruotate
            const px = cx + pt.x * scalePxPerM;
            const py = cy - pt.y * scalePxPerM; // Nord reale è +Y, canvas è -Y

            // Tacchetta perpendicolare alla scala calendariale ruotata
            const tickDx = 5 * cosRot;
            const tickDy = 5 * sinRot;

            ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
            ctx.beginPath();
            ctx.moveTo(px - tickDx, py + tickDy); // +tickDy perché Y è invertita sul canvas
            ctx.lineTo(px + tickDx, py - tickDy);
            ctx.stroke();

            // Nome del mese (leggermente spostato lungo la direzione della tacchetta)
            const textOffset = 8;
            const tx = px + textOffset * cosRot;
            const ty = py - textOffset * sinRot;

            ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
            ctx.fillText(lang === "it" ? pt.nameIt : pt.nameEn, tx, ty);
        });

        // 5. Disegna la PERSONA (lo gnomone umano) posizionata oggi - Real Coordinates
        const personX = cx + zOffset.x * scalePxPerM;
        const personY = cy - zOffset.y * scalePxPerM;

        if (sunPos.altitude > 0) {
            // Calcola la proiezione dell'ombra 3D reale sulla piazza in pendenza
            const hPerson = 1.75; // altezza media persona standard
            const shadowTip = SolarisMath.projectVerticalShadowOnSlope(
                zOffset.x, zOffset.y, hPerson, 
                sunPos.altitude, sunPos.azimuth, 
                lat, slope, slopeDir
            );

            if (shadowTip) {
                const shTipX = cx + shadowTip.x * scalePxPerM;
                const shTipY = cy - shadowTip.y * scalePxPerM;

                // Disegna l'area d'ombra (lungo gradiente scuro trasparente)
                const shadowGrad = ctx.createLinearGradient(personX, personY, shTipX, shTipY);
                shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
                shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
                shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

                ctx.strokeStyle = shadowGrad;
                ctx.lineWidth = 12; // ombra larga e realistica per una persona
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(personX, personY);
                ctx.lineTo(shTipX, shTipY);
                ctx.stroke();

                // Disegna una linea sottile indicativa dell'asse dell'ombra che si estende all'infinito
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 4]);
                ctx.beginPath();
                ctx.moveTo(personX, personY);
                
                // Direzione dell'ombra proiettata
                const dx = shadowTip.x - zOffset.x;
                const dy = shadowTip.y - zOffset.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                if (len > 0.001) {
                    const extX = personX + (dx / len) * 1000;
                    const extY = personY - (dy / len) * 1000;
                    ctx.lineTo(extX, extY);
                }
                ctx.stroke();
                ctx.setLineDash([]); // reset
            }

            // Disegna il marcatore della persona (sagoma in stile impronta o cerchietto tecnologico dorato)
            ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = 'var(--accent-gold)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(personX, personY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0; // reset

            // Simbolo omina
            ctx.fillStyle = '#000';
            ctx.font = 'bold 9px "Space Grotesk", sans-serif';
            ctx.fillText("👤", personX, personY);

            // Etichetta "Ti trovi qui"
            ctx.fillStyle = 'var(--accent-gold)';
            ctx.font = 'bold 10px "Space Grotesk", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(lang === "it" ? "Posizione persona (Ti trovi qui) " : "Person standing here ", personX - 10, personY);
        } else {
            // Sole sotto l'orizzonte
            ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.font = 'bold 12px "Space Grotesk", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(lang === "it" ? "SOLE SOTTO L'ORIZZONTE (NOTTE)" : "SUN BELOW HORIZON (NIGHT)", cx, height - 30);
            
            // Disegna comunque la persona
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(personX, personY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }

        // Cornice estetica
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        // Scala indicativa sul grafico
        const legendText = `100 px = ${(100 / scalePxPerM).toFixed(2)} m`;
        document.getElementById('legend-scale-text').innerText = legendText;
    },

    /**
     * GENERATORE DI FILE SVG VETTORIALE PER L'ESPORTAZIONE
     */
    generateSVG: (mode, params, date, lang = "it") => {
        const lat = params.latitude;
        const lon = params.longitude;
        const tz = params.timezone;
        const isDst = params.isDst;
        const dayOfYear = SolarisMath.getDayOfYear(date);
        const solarDec = SolarisMath.getSolarDeclination(dayOfYear);
        const eot = SolarisMath.getEquationOfTime(dayOfYear);

        let svgContent = '';

        if (mode === 'wall') {
            const dec = params.declination;
            const gLen = params.gnomonLength;
            const gparams = SolarisMath.calcWallGnomonParameters(lat, dec, gLen, params.inclination);

            const wallZoom = params.wallZoom !== undefined ? params.wallZoom / 100 : 1.0;
            const R_ref = 230 * wallZoom;
            const mmToPx = (0.45 * R_ref) / gparams.polarLength;

            const hoursList = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            const hourAngles = hoursList.map(h => (h - 12) * 15);
            const wallHourLines = SolarisMath.calcWallHourLines(gparams.styleAngle, gparams.h0, gparams.substyleAngle, hourAngles);

            const romanNumerals = {
                6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI",
                12: "XII", 13: "I", 14: "II", 15: "III", 16: "IV", 17: "V", 18: "VI"
            };

            // SVG per Meridiana a Parete
            svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Sfondo elegante -->
  <rect width="800" height="800" fill="#090d16" />
  <circle cx="400" cy="350" r="300" stroke="#f59e0b" stroke-width="0.5" fill="none" opacity="0.1" />
  
  <!-- Titoli e info -->
  <text x="40" y="50" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="bold" fill="#f59e0b">SOLARIS</text>
  <text x="40" y="80" font-family="'Outfit', sans-serif" font-size="14" fill="#9ca3af">${lang === 'it' ? 'Meridiana Verticale Declinante' : 'Declining Vertical Sundial'}</text>
  
  <!-- Box Parametri -->
  <g transform="translate(40, 675)" font-family="'Outfit', sans-serif" font-size="11" fill="#9ca3af">
    <text x="0" y="0"><tspan fill="#f59e0b" font-weight="bold">PARAMETRI / PARAMETERS:</tspan></text>
    <text x="0" y="18">Latitudine / Latitude: ${lat.toFixed(3)}°N | Longitudine / Longitude: ${lon.toFixed(3)}°E</text>
    <text x="0" y="34">Declinazione Muro / Wall Declination: ${dec.toFixed(1)}°</text>
    <text x="0" y="50">Inclinazione Muro / Wall Inclination: ${(params.inclination || 0).toFixed(1)}°</text>
    
    <text x="280" y="0"><tspan fill="#f59e0b" font-weight="bold">SCHEDA TECNICA STILO / GNOMON SPECS:</tspan></text>
    <text x="280" y="18">Lungh. Stilo Polare / Polar Length: ${gparams.polarLength.toFixed(1)} mm</text>
    <text x="280" y="34">Alt. Stilo Gnomonico / Orthostyle Height: ${gparams.orthoLength.toFixed(1)} mm</text>
    <text x="280" y="50">Substilo Fisico / Substyle Length: ${gparams.substyleLength.toFixed(1)} mm</text>
    <text x="560" y="0"><tspan fill="#f59e0b" font-weight="bold">ANGOLI / ANGLES:</tspan></text>
    <text x="560" y="18">Inclinaz. Stilo / Style Angle (a): ${gparams.styleAngle.toFixed(2)}°</text>
    <text x="560" y="34">Angolo Substilo / Substyle (SD): ${gparams.substyleAngle.toFixed(2)}°</text>
    <text x="560" y="50">Diff. Longitudine / H0 Angle: ${gparams.h0.toFixed(2)}°</text>
  </g>

  <!-- Disegno Quadrante (Centro origin 400, 350) -->
  <g transform="translate(0, 0)">
    <!-- Origine (0,0) reale a (400, 350) -->
    <!-- Raggio di scala = 250px -->
    <!-- Linea verticale di riferimento -->
    <line x1="400" y1="350" x2="400" y2="600" stroke="#ffffff" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.3" />
    
    <!-- Linee orarie -->
    ${(() => {
        const ox = 400;
        const oy = 350;

        return wallHourLines.map((line, idx) => {
            const hVal = hoursList[idx];
            const thetaRad = SolarisMath.degToRad(line.angleFromVertical);

            const dummySun = SolarisMath.getSunPosition(lat, solarDec, line.hourAngle);
            const dummyProj = SolarisMath.projectNodusShadowOnWall(dummySun.altitude, dummySun.azimuth, lat, dec, gparams, params.inclination);
            const opacity = dummyProj ? "1.0" : "0.15";
            const strokeColor = dummyProj ? "#ffffff" : "#4b5563";

            // Calcola i punti d'ombra al solstizio d'inverno (-23.44) e d'estate (23.44) per il clipping delle linee
            const sPosWin = SolarisMath.getSunPosition(lat, -23.44, line.hourAngle);
            const shWin = SolarisMath.projectNodusShadowOnWall(sPosWin.altitude, sPosWin.azimuth, lat, dec, gparams, params.inclination);

            const sPosSum = SolarisMath.getSunPosition(lat, 23.44, line.hourAngle);
            const shSum = SolarisMath.projectNodusShadowOnWall(sPosSum.altitude, sPosSum.azimuth, lat, dec, gparams, params.inclination);

            if (!shWin && !shSum) return '';

            const dWin = shWin ? Math.sqrt(shWin.x * shWin.x + shWin.y * shWin.y) * mmToPx : null;
            const dSum = shSum ? Math.sqrt(shSum.x * shSum.x + shSum.y * shSum.y) * mmToPx : null;

            let dStart = R_ref * 0.15;
            let dEnd = R_ref * 1.25;

            if (dWin !== null && dSum !== null) {
                dStart = Math.min(dWin, dSum);
                dEnd = Math.max(dWin, dSum);
            } else if (dSum !== null) {
                dStart = R_ref * 0.15;
                dEnd = dSum;
            } else if (dWin !== null) {
                dStart = R_ref * 0.15;
                dEnd = dWin;
            }

            const dEndClipped = Math.min(dEnd, R_ref * 1.25);
            const dStartClipped = Math.min(dStart, R_ref * 1.2);

            if (dStartClipped >= dEndClipped) return '';

            const lx1 = ox + dStartClipped * Math.sin(thetaRad);
            const ly1 = oy + dStartClipped * Math.cos(thetaRad);
            const lx2 = ox + dEndClipped * Math.sin(thetaRad);
            const ly2 = oy + dEndClipped * Math.cos(thetaRad);

            const labelDist = dEndClipped + 18;
            const tx = ox + labelDist * Math.sin(thetaRad);
            const ty = oy + labelDist * Math.cos(thetaRad);

            let rotDeg = line.angleFromVertical;
            if (rotDeg > 90) rotDeg -= 180;
            if (rotDeg < -90) rotDeg += 180;

            return `
    <!-- Ora ${hVal} -->
    <line x1="${lx1.toFixed(1)}" y1="${ly1.toFixed(1)}" x2="${lx2.toFixed(1)}" y2="${ly2.toFixed(1)}" stroke="${strokeColor}" stroke-width="${hVal === 12 ? '2' : '1'}" opacity="${opacity}" />
    <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="12" font-weight="${hVal === 12 ? 'bold' : 'normal'}" fill="${hVal === 12 ? '#f59e0b' : '#ffffff'}" text-anchor="middle" dominant-baseline="middle" opacity="${opacity}" transform="rotate(${rotDeg.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${romanNumerals[hVal]}</text>`;
        }).join('');
    })()}

    <!-- Gnomone Ribaltato (Dima di costruzione sul piano del muro) -->
    ${(() => {
        const sdRad = SolarisMath.degToRad(gparams.substyleAngle);
        const aRad = SolarisMath.degToRad(gparams.styleAngle);

        const footX = 400 + (gparams.substyleLength * mmToPx) * Math.sin(sdRad);
        const footY = 350 + (gparams.substyleLength * mmToPx) * Math.cos(sdRad);
        const foldedNodusX = footX + (gparams.orthoLength * mmToPx) * Math.cos(sdRad);
        const foldedNodusY = footY - (gparams.orthoLength * mmToPx) * Math.sin(sdRad);

        const midBaseX = (400 + footX) / 2;
        const midBaseY = (350 + footY) / 2;
        const shiftBaseX = -12 * Math.cos(sdRad);
        const shiftBaseY = 12 * Math.sin(sdRad);
        let rotBase = gparams.substyleAngle;
        if (rotBase > 90) rotBase -= 180;
        if (rotBase < -90) rotBase += 180;

        const midOrthoX = (footX + foldedNodusX) / 2;
        const midOrthoY = (footY + foldedNodusY) / 2;
        const shiftOrthoX = 12 * Math.sin(sdRad);
        const shiftOrthoY = 12 * Math.cos(sdRad);
        let rotOrtho = gparams.substyleAngle - 90;
        if (rotOrtho > 90) rotOrtho -= 180;
        if (rotOrtho < -90) rotOrtho += 180;

        const midHypX = (400 + foldedNodusX) / 2;
        const midHypY = (350 + foldedNodusY) / 2;
        const hypAngle = sdRad + aRad;
        const shiftHypX = 12 * Math.cos(hypAngle);
        const shiftHypY = -12 * Math.sin(hypAngle);
        let rotHyp = gparams.substyleAngle + gparams.styleAngle;
        if (rotHyp > 90) rotHyp -= 180;
        if (rotHyp < -90) rotHyp += 180;

        const angleTextX = 400 + 18 * Math.sin(sdRad + aRad/2);
        const angleTextY = 350 + 18 * Math.cos(sdRad + aRad/2);

        return `
    <!-- Triangolo dello gnomone ribaltato -->
    <polygon points="400,350 ${footX.toFixed(1)},${footY.toFixed(1)} ${foldedNodusX.toFixed(1)},${foldedNodusY.toFixed(1)}" fill="#f59e0b" fill-opacity="0.06" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,4" />
    
    <!-- Testi e misure dei lati -->
    <text x="${(midBaseX + shiftBaseX).toFixed(1)}" y="${(midBaseY + shiftBaseY).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" font-style="italic" fill="#f59e0b" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotBase.toFixed(1)} ${(midBaseX + shiftBaseX).toFixed(1)} ${(midBaseY + shiftBaseY).toFixed(1)})">${lang === 'it' ? `Substilo: ${gparams.substyleLength.toFixed(1)} mm` : `Substyle: ${gparams.substyleLength.toFixed(1)} mm`}</text>
    
    <text x="${(midOrthoX + shiftOrthoX).toFixed(1)}" y="${(midOrthoY + shiftOrthoY).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" font-style="italic" fill="#f59e0b" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotOrtho.toFixed(1)} ${(midOrthoX + shiftOrthoX).toFixed(1)} ${(midOrthoY + shiftOrthoY).toFixed(1)})">${lang === 'it' ? `Ortostilo (h): ${gparams.orthoLength.toFixed(1)} mm` : `Orthostyle (h): ${gparams.orthoLength.toFixed(1)} mm`}</text>
    
    <text x="${(midHypX + shiftHypX).toFixed(1)}" y="${(midHypY + shiftHypY).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" font-weight="bold" font-style="italic" fill="#f59e0b" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotHyp.toFixed(1)} ${(midHypX + shiftHypX).toFixed(1)} ${(midHypY + shiftHypY).toFixed(1)})">${lang === 'it' ? `Stilo Polare: ${gparams.polarLength.toFixed(1)} mm` : `Polar Style: ${gparams.polarLength.toFixed(1)} mm`}</text>
    
    <!-- Indicazione angolo stilo -->
    <text x="${angleTextX.toFixed(1)}" y="${(angleTextY + 3).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="8" fill="#f59e0b" fill-opacity="0.7" text-anchor="start">a = ${gparams.styleAngle.toFixed(1)}°</text>
    
    <!-- Apex marker di fissaggio -->
    <circle cx="400" cy="350" r="6" fill="#ffffff" stroke="#f59e0b" stroke-width="2.5" />
    <circle cx="400" cy="350" r="2.5" fill="#f59e0b" />
    <text x="400" y="335" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="bold" fill="#f59e0b" text-anchor="middle">${lang === 'it' ? 'FISSAGGIO STILO (APEX)' : 'STYLE ATTACHMENT (APEX)'}</text>
        `;
    })()}

    <!-- Curve di declinazione (Solstizi ed Equinozi) -->
    ${(() => {
        const dVals = [
            { v: 23.44, col: "#f59e0b", name: "SOLSTIZIO ESTATE / SUMMER SOLSTICE" },
            { v: 0, col: "#10b981", name: "EQUINOZI / EQUINOXES" },
            { v: -23.44, col: "#3b82f6", name: "SOLSTIZIO INVERNO / WINTER SOLSTICE" }
        ];
        const ox = 400;
        const oy = 350;

        return dVals.map(dVal => {
            let pathPoints = [];
            for (let hDeg = -120; hDeg <= 120; hDeg += 2.5) {
                const sPos = SolarisMath.getSunPosition(lat, dVal.v, hDeg);
                const shadow = SolarisMath.projectNodusShadowOnWall(sPos.altitude, sPos.azimuth, lat, dec, gparams, params.inclination);
                if (shadow) {
                    const sx = ox + shadow.x * mmToPx;
                    const sy = oy + shadow.y * mmToPx;
                    const d = Math.sqrt((sx-ox)*(sx-ox) + (sy-oy)*(sy-oy));
                    if (d < R_ref * 1.3) {
                        pathPoints.push({ x: sx, y: sy });
                    }
                }
            }
            if (pathPoints.length === 0) return '';
            
            const startPt = pathPoints[0];
            const endPt = pathPoints[pathPoints.length - 1];
            
            let startSymbol = "";
            let endSymbol = "";
            if (dVal.v === 23.44) {
                startSymbol = "♋";
                endSymbol = "♋";
            } else if (dVal.v === 0) {
                startSymbol = "♈";
                endSymbol = "♎";
            } else if (dVal.v === -23.44) {
                startSymbol = "♑";
                endSymbol = "♑";
            }

            let textTags = "";
            if (pathPoints.length >= 2) {
                const dxStart = startPt.x - ox;
                const dyStart = startPt.y - oy;
                const lenStart = Math.sqrt(dxStart*dxStart + dyStart*dyStart);
                if (lenStart > 0.001) {
                    const sxText = startPt.x + (dxStart / lenStart) * 12;
                    const syText = startPt.y + (dyStart / lenStart) * 12;
                    textTags += `<text x="${sxText.toFixed(1)}" y="${syText.toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="12" fill="${dVal.col}" text-anchor="middle" dominant-baseline="middle">${startSymbol}</text>\n`;
                }

                const dxEnd = endPt.x - ox;
                const dyEnd = endPt.y - oy;
                const lenEnd = Math.sqrt(dxEnd*dxEnd + dyEnd*dyEnd);
                if (lenEnd > 0.001) {
                    const exText = endPt.x + (dxEnd / lenEnd) * 12;
                    const eyText = endPt.y + (dyEnd / lenEnd) * 12;
                    textTags += `<text x="${exText.toFixed(1)}" y="${eyText.toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="12" fill="${dVal.col}" text-anchor="middle" dominant-baseline="middle">${endSymbol}</text>\n`;
                }
            }

            const pathString = pathPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');

            return `
    <!-- Curva Declinazione ${dVal.v} -->
    <path d="M ${pathString}" fill="none" stroke="${dVal.col}" stroke-width="1.5" opacity="0.6" />
    ${textTags}`;
        }).join('');
    })()}

  </g>
</svg>`;
        } else {
            // SVG per Orologio a Pavimento in pendenza
            const aVal = params.ellipseWidth;
            const slope = params.floorSlope || 0;
            const slopeDir = params.floorSlopeDir || 180;
            const geom = SolarisMath.calcFloorSundialGeometry(lat, aVal, slope, slopeDir);
            
            const hoursList = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
            const hourAngles = hoursList.map(h => (h - 12) * 15);
            const hourPoints = SolarisMath.calcFloorHourPoints(aVal, geom.b, hourAngles, geom.rotationAngle);
            
            const calPoints = SolarisMath.getCalendarScalePoints(aVal, lat, slope, slopeDir);

            const floorZoom = params.floorZoom !== undefined ? params.floorZoom / 100 : 0.8;
            const scalePxPerM = (300 * floorZoom) / aVal; // Semiasse maggiore mappato a 300px con zoom

            svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="800" fill="#090d16" />
  
  <text x="40" y="50" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="bold" fill="#f59e0b">SOLARIS</text>
  <text x="40" y="80" font-family="'Outfit', sans-serif" font-size="14" fill="#9ca3af">${lang === 'it' ? 'Orologio Solare a Pavimento (Umano)' : 'Floor/Analemmatic Human Sundial'}</text>
  
  <!-- Info Box -->
  <g transform="translate(40, 670)" font-family="'Outfit', sans-serif" font-size="11" fill="#9ca3af">
    <text x="0" y="0"><tspan fill="#f59e0b" font-weight="bold">PARAMETRI DELLA PIAZZA / PLAZA PARAMETERS:</tspan></text>
    <text x="0" y="18">Latitudine / Latitude: ${lat.toFixed(3)}°N | Longitudine / Longitude: ${params.longitude.toFixed(3)}°E</text>
    <text x="0" y="34">Semiasse Maggiore / Semi-Major (a): ${aVal.toFixed(2)} m | Semiasse Minore / Semi-Minor (b): ${geom.b.toFixed(2)} m</text>
    <text x="0" y="50">Pendenza Piazza / Plaza Slope: ${slope.toFixed(1)}° verso ${slopeDir.toFixed(0)}°</text>
    <text x="0" y="66">Latitudine Virtuale / Virtual Lat: ${geom.phiVirt.toFixed(2)}° | Rotazione Ellisse / Rotation: ${(geom.rotationAngle * 180 / Math.PI).toFixed(1)}°</text>
    
    <text x="420" y="0"><tspan fill="#f59e0b" font-weight="bold">GUIDA DI TRACCIAMENTO / LAYOUT GUIDE:</tspan></text>
    <text x="420" y="18">1. Fissa il centro (0,0). Traccia gli assi X (Est-Ovest) e Y (Nord-Sud) della piazza.</text>
    <text x="420" y="34">2. Posiziona le piastrelle delle ore alle coordinate (X, Y) esatte indicate in tabella.</text>
    <text x="420" y="50">3. La scala del calendario è ruotata di ${(geom.rotationAngle * 180 / Math.PI).toFixed(1)}° rispetto all'asse Y (Nord-Sud).</text>
    <text x="420" y="66">4. Traccia le tacche del calendario alle coordinate (X, Y) indicate.</text>
  </g>

  <!-- Grafica Orologio (Centro 400, 350) -->
  <g transform="translate(0, 0)">
    <!-- Assi Cartesiani -->
    <line x1="50" y1="350" x2="750" y2="350" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
    <line x1="400" y1="50" x2="400" y2="650" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
    
    <text x="400" y="30" font-family="'Space Grotesk', sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle">N (Nord / North)</text>
    <text x="400" y="670" font-family="'Space Grotesk', sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle">S (Sud / South)</text>
    <text x="25" y="354" font-family="'Space Grotesk', sans-serif" font-size="10" fill="#9ca3af">W (Ovest / West)</text>
    <text x="755" y="354" font-family="'Space Grotesk', sans-serif" font-size="10" fill="#9ca3af">E (Est / East)</text>

    <!-- Ellisse Oraria Ruotata -->
    <ellipse cx="400" cy="350" rx="${aVal * scalePxPerM}" ry="${geom.b * scalePxPerM}" transform="rotate(${(-geom.rotationAngle * 180 / Math.PI).toFixed(2)} 400 350)" stroke="#f59e0b" stroke-width="1.5" fill="none" opacity="0.3" />

    <!-- Marcatori e scritte delle ore -->
    ${hourPoints.map((pt, idx) => {
        const hVal = hoursList[idx];
        const px = 400 + pt.x * scalePxPerM;
        const py = 350 - pt.y * scalePxPerM; // Nord reale è +Y, in SVG Nord è in alto (-Y)
        
        const angle = Math.atan2(-pt.y, pt.x);
        const tx = px + 16 * Math.cos(angle);
        const ty = py + 16 * Math.sin(angle);

        return `
    <!-- Ora ${hVal}: X=${pt.x.toFixed(3)}m, Y=${pt.y.toFixed(3)}m -->
    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${hVal === 12 ? '5' : '3.5'}" fill="${hVal === 12 ? '#f59e0b' : '#ffffff'}" />
    <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="11" font-weight="${hVal === 12 ? 'bold' : 'normal'}" fill="${hVal === 12 ? '#f59e0b' : '#ffffff'}" text-anchor="middle" dominant-baseline="middle">${hVal}</text>`;
    }).join('')}

    <!-- Scala calendariale centrale ruotata -->
    ${(() => {
        const cosRot = Math.cos(geom.rotationAngle);
        const sinRot = Math.sin(geom.rotationAngle);
        return calPoints.map(pt => {
            const px = 400 + pt.x * scalePxPerM;
            const py = 350 - pt.y * scalePxPerM; // Nord è -Y
            
            const tickDx = 5 * cosRot;
            const tickDy = 5 * sinRot;
            const tx = px + 8 * cosRot;
            const ty = py - 8 * sinRot;

            return `
    <line x1="${(px - tickDx).toFixed(1)}" y1="${(py + tickDy).toFixed(1)}" x2="${(px + tickDx).toFixed(1)}" y2="${(py - tickDy).toFixed(1)}" stroke="#f59e0b" stroke-width="1" />
    <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="'Outfit', sans-serif" font-size="9" fill="#f59e0b" dominant-baseline="middle">${lang === 'it' ? pt.nameIt : pt.nameEn} (X=${pt.x.toFixed(3)}m, Y=${pt.y.toFixed(3)}m)</text>`;
        }).join('');
    })()}

    <!-- Scala Metrica di Riferimento -->
    <g transform="translate(680, 50)" font-family="'Outfit', sans-serif" font-size="9" fill="#9ca3af">
      <line x1="0" y1="10" x2="50" y2="10" stroke="#9ca3af" stroke-width="1.5" />
      <line x1="0" y1="5" x2="0" y2="15" stroke="#9ca3af" stroke-width="1" />
      <line x1="50" y1="5" x2="50" y2="15" stroke="#9ca3af" stroke-width="1" />
      <text x="25" y="0" text-anchor="middle">1.0 m</text>
    </g>
  </g>
</svg>`;
        }

        return svgContent;
    },

    /**
     * ESPORTA I DATI DI TRACCIAMENTO IN FORMATO CSV
     */
    exportToCSV: (mode, params, lang = "it") => {
        const lat = params.latitude;
        const aVal = params.ellipseWidth;
        const slope = params.floorSlope || 0;
        const slopeDir = params.floorSlopeDir || 180;
        const geom = SolarisMath.calcFloorSundialGeometry(lat, aVal, slope, slopeDir);
        
        let csvContent = "";

        if (mode === 'floor') {
            const hoursList = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
            const hourAngles = hoursList.map(h => (h - 12) * 15);
            const hourPoints = SolarisMath.calcFloorHourPoints(aVal, geom.b, hourAngles, geom.rotationAngle);
            
            const calPoints = SolarisMath.getCalendarScalePoints(aVal, lat, slope, slopeDir);

            // 1. Intestazione metadati
            csvContent += `Solaris Sundial Tracing Data - Floor Mode\n`;
            csvContent += `Latitude,${lat.toFixed(6)}\n`;
            csvContent += `Longitude,${params.longitude.toFixed(6)}\n`;
            csvContent += `Semi-Major Axis a (m),${aVal.toFixed(3)}\n`;
            csvContent += `Semi-Minor Axis b (m),${geom.b.toFixed(3)}\n`;
            csvContent += `Floor Slope (deg),${slope.toFixed(2)}\n`;
            csvContent += `Floor Slope Direction (deg),${slopeDir.toFixed(1)}\n`;
            csvContent += `Virtual Latitude (deg),${geom.phiVirt.toFixed(4)}\n`;
            csvContent += `Ellipse Rotation Angle (deg),${(geom.rotationAngle * 180 / Math.PI).toFixed(2)}\n\n`;

            // 2. Tabella Ore
            csvContent += `--- HOUR POINTS LAYOUT (ELLIPSE) ---\n`;
            csvContent += `Hour (Solar),Hour Angle (deg),X Coordinate (m),Y Coordinate (m),Distance from Center (m)\n`;
            
            hourPoints.forEach((pt, idx) => {
                const hVal = hoursList[idx];
                csvContent += `${hVal},${pt.hourAngle},${pt.x.toFixed(4)},${pt.y.toFixed(4)},${pt.distance.toFixed(4)}\n`;
            });

            csvContent += `\n`;

            // 3. Tabella Calendario
            csvContent += `--- CALENDAR SCALE (GNOMON FOOTPRINT) ---\n`;
            csvContent += `Month (1st Day),Declination (deg),X Coordinate (m),Y Coordinate (m),Z Virtual Offset (m)\n`;

            calPoints.forEach(pt => {
                const monthName = lang === 'it' ? pt.nameIt : pt.nameEn;
                csvContent += `${monthName},${pt.declination.toFixed(2)},${pt.x.toFixed(4)},${pt.y.toFixed(4)},${pt.z.toFixed(4)}\n`;
            });
        } else {
            // Parete declinante ed inclinante
            const dec = params.declination;
            const wallInc = params.inclination || 0;
            const gLen = params.gnomonLength;
            const gparams = SolarisMath.calcWallGnomonParameters(lat, dec, gLen, wallInc);

            const hoursList = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            const hourAngles = hoursList.map(h => (h - 12) * 15);
            const wallHourLines = SolarisMath.calcWallHourLines(gparams.styleAngle, gparams.h0, gparams.substyleAngle, hourAngles);

            csvContent += `Solaris Sundial Tracing Data - Wall Mode\n`;
            csvContent += `Latitude,${lat.toFixed(6)}\n`;
            csvContent += `Wall Declination (deg),${dec.toFixed(2)}\n`;
            csvContent += `Wall Inclination (deg),${wallInc.toFixed(2)}\n`;
            csvContent += `Gnomon Polar Length (mm),${gparams.polarLength.toFixed(1)}\n`;
            csvContent += `Style Angle (deg),${gparams.styleAngle.toFixed(3)}\n`;
            csvContent += `Substyle Angle SD (deg),${gparams.substyleAngle.toFixed(3)}\n`;
            csvContent += `H0 Longitude Diff (deg),${gparams.h0.toFixed(3)}\n`;
            csvContent += `Orthostyle Height (mm),${gparams.orthoLength.toFixed(1)}\n`;
            csvContent += `Substyle length (mm),${gparams.substyleLength.toFixed(1)}\n\n`;

            csvContent += `--- HOUR LINES LAYOUT ---\n`;
            csvContent += `Hour (Solar),Hour Angle (deg),Angle from Substyle (deg),Angle from Downward Vertical (deg)\n`;

            wallHourLines.forEach((line, idx) => {
                const hVal = hoursList[idx];
                csvContent += `${hVal},${line.hourAngle},${line.angleFromSubstyle.toFixed(3)},${line.angleFromVertical.toFixed(3)}\n`;
            });
        }

        return csvContent;
    }
};

// Funzione helper per estrarre stili CSS per coerenza cromatica
function varColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

window.SolarisRenderer = SolarisRenderer;
