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
     * Calcola la direzione della pendenza espressa in notazione quadrante (es. N 45° E)
     */
    getSlopeQuadrantBearing: (slopeDir, lang = "it") => {
        let angleDeg = slopeDir;
        angleDeg = ((angleDeg % 360) + 360) % 360;
        
        let northSouth = "N";
        let eastWest = "E";
        let val = 0;

        if (angleDeg <= 90) {
            northSouth = "N";
            eastWest = "E";
            val = angleDeg;
        } else if (angleDeg <= 180) {
            northSouth = "S";
            eastWest = "E";
            val = 180 - angleDeg;
        } else if (angleDeg <= 270) {
            northSouth = "S";
            eastWest = lang === 'it' ? "O" : "W";
            val = angleDeg - 180;
        } else {
            northSouth = "N";
            eastWest = lang === 'it' ? "O" : "W";
            val = 360 - angleDeg;
        }
        return `${northSouth} ${val.toFixed(0)}° ${eastWest}`;
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

        // 4.5. Disegna la Lemniscata del Tempo Medio (Analemma dell'orario XII)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        
        let firstLemPt = true;
        const monthMarkers = {};

        const monthInitials = lang === 'it' ? 
            ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"] : 
            ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

        for (let d = 1; d <= 365; d++) {
            const decVal = SolarisMath.getSolarDeclination(d);
            const eotVal = SolarisMath.getEquationOfTime(d);
            const hAngleDeg = eotVal / 4;
            const sPos = SolarisMath.getSunPosition(lat, decVal, hAngleDeg);
            
            if (sPos.altitude > 0) {
                const shadow = SolarisMath.projectNodusShadowOnWall(sPos.altitude, sPos.azimuth, lat, dec, gparams, params.inclination);
                if (shadow) {
                    const sx = ox + shadow.x * mmToPx;
                    const sy = oy + shadow.y * mmToPx;
                    
                    const dist = Math.sqrt((sx-ox)*(sx-ox) + (sy-oy)*(sy-oy));
                    if (dist < R_ref * 1.3) {
                        if (firstLemPt) {
                            ctx.moveTo(sx, sy);
                            firstLemPt = false;
                        } else {
                            ctx.lineTo(sx, sy);
                        }
                        
                        const monthStarts = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
                        const mIndex = monthStarts.indexOf(d);
                        if (mIndex !== -1) {
                            monthMarkers[mIndex] = { x: sx, y: sy };
                        }
                    }
                }
            }
        }
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Disegna i marcatori dei mesi (un cerchietto e la lettera del mese)
        ctx.font = 'bold 9px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let mIdx in monthMarkers) {
            const pt = monthMarkers[mIdx];
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = 'var(--accent-gold)';
            ctx.fillText(monthInitials[mIdx], pt.x, pt.y);
        }

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

        // 1.5. Disegna la direzione della pendenza (se slope > 0)
        if (slope > 0) {
            const slopeDirRad = slopeDir * Math.PI / 180;
            const L = a * scalePxPerM * 0.75;
            const endX = cx + L * Math.sin(slopeDirRad);
            const endY = cy - L * Math.cos(slopeDirRad);

            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]); // reset

            // Freccia direzionale
            const arrowSize = 8;
            const angle = Math.atan2(endY - cy, endX - cx);
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();

            // Etichetta testo
            ctx.font = 'bold 9px "Space Grotesk", sans-serif';
            ctx.fillStyle = '#06b6d4';
            
            const bearing = SolarisRenderer.getSlopeQuadrantBearing(slopeDir, lang);
            const labelText = lang === 'it' ? `Direzione Pendenza: ${slope.toFixed(1)}° (${bearing})` : `Slope Direction: ${slope.toFixed(1)}° (${bearing})`;
            
            const tx = endX + 10 * Math.cos(angle);
            const ty = endY + 10 * Math.sin(angle);

            if (Math.cos(angle) < -0.1) {
                ctx.textAlign = 'right';
            } else if (Math.cos(angle) > 0.1) {
                ctx.textAlign = 'left';
            } else {
                ctx.textAlign = 'center';
            }
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, tx, ty);
        }

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
            const hPerson = params.personHeight !== undefined ? params.personHeight : 1.70; // altezza media persona configurabile
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
  <rect width="800" height="800" fill="#ffffff" />
  <circle cx="400" cy="350" r="300" stroke="#b45309" stroke-width="0.5" fill="none" opacity="0.15" />
  
  <!-- Titoli e info -->
  <text x="40" y="50" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="bold" fill="#b45309">SOLARIS</text>
  <text x="40" y="80" font-family="'Outfit', sans-serif" font-size="14" fill="#333333">${lang === 'it' ? 'Meridiana Verticale Declinante' : 'Declining Vertical Sundial'}</text>
  
  <!-- Box Parametri -->
  <g transform="translate(40, 675)" font-family="'Outfit', sans-serif" font-size="11" fill="#4b5563">
    <text x="0" y="0"><tspan fill="#b45309" font-weight="bold">PARAMETRI / PARAMETERS:</tspan></text>
    <text x="0" y="18">Latitudine / Latitude: ${lat.toFixed(3)}°N | Longitudine / Longitude: ${lon.toFixed(3)}°E</text>
    <text x="0" y="34">Declinazione Muro / Wall Declination: ${dec.toFixed(1)}°</text>
    <text x="0" y="50">Inclinazione Muro / Wall Inclination: ${(params.inclination || 0).toFixed(1)}°</text>
    
    <text x="280" y="0"><tspan fill="#b45309" font-weight="bold">SCHEDA TECNICA STILO / GNOMON SPECS:</tspan></text>
    <text x="280" y="18">Lungh. Stilo Polare / Polar Length: ${gparams.polarLength.toFixed(1)} mm</text>
    <text x="280" y="34">Alt. Stilo Gnomonico / Orthostyle Height: ${gparams.orthoLength.toFixed(1)} mm</text>
    <text x="280" y="50">Substilo Fisico / Substyle Length: ${gparams.substyleLength.toFixed(1)} mm</text>
    <text x="560" y="0"><tspan fill="#b45309" font-weight="bold">ANGOLI / ANGLES:</tspan></text>
    <text x="560" y="18">Inclinaz. Stilo / Style Angle (a): ${gparams.styleAngle.toFixed(2)}°</text>
    <text x="560" y="34">Angolo Substilo / Substyle (SD): ${gparams.substyleAngle.toFixed(2)}°</text>
    <text x="560" y="50">Diff. Longitudine / H0 Angle: ${gparams.h0.toFixed(2)}°</text>
  </g>

  <!-- Disegno Quadrante (Centro origin 400, 350) -->
  <g transform="translate(0, 0)">
    <!-- Origine (0,0) reale a (400, 350) -->
    <!-- Raggio di scala = 250px -->
    <!-- Linea verticale di riferimento -->
    <line x1="400" y1="350" x2="400" y2="600" stroke="#000000" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.3" />
    
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
            const strokeColor = dummyProj ? "#000000" : "#cccccc";

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
    <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="12" font-weight="${hVal === 12 ? 'bold' : 'normal'}" fill="${hVal === 12 ? '#b45309' : '#000000'}" text-anchor="middle" dominant-baseline="middle" opacity="${opacity}" transform="rotate(${rotDeg.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${romanNumerals[hVal]}</text>`;
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
    <!-- Triangolo dello gnomone ribaltato -->
    <polygon points="400,350 ${footX.toFixed(1)},${footY.toFixed(1)} ${foldedNodusX.toFixed(1)},${foldedNodusY.toFixed(1)}" fill="#b45309" fill-opacity="0.06" stroke="#b45309" stroke-width="1.5" stroke-dasharray="4,4" />
    
    <!-- Testi e misure dei lati -->
    <text x="${(midBaseX + shiftBaseX).toFixed(1)}" y="${(midBaseY + shiftBaseY).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" font-style="italic" fill="#b45309" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotBase.toFixed(1)} ${(midBaseX + shiftBaseX).toFixed(1)} ${(midBaseY + shiftBaseY).toFixed(1)})">${lang === 'it' ? `Substilo: ${gparams.substyleLength.toFixed(1)} mm` : `Substyle: ${gparams.substyleLength.toFixed(1)} mm`}</text>
    
    <text x="${(midOrthoX + shiftOrthoX).toFixed(1)}" y="${(midOrthoY + shiftOrthoY).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" font-style="italic" fill="#b45309" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotOrtho.toFixed(1)} ${(midOrthoX + shiftOrthoX).toFixed(1)} ${(midOrthoY + shiftOrthoY).toFixed(1)})">${lang === 'it' ? `Ortostilo (h): ${gparams.orthoLength.toFixed(1)} mm` : `Orthostyle (h): ${gparams.orthoLength.toFixed(1)} mm`}</text>
    
    <text x="${(midHypX + shiftHypX).toFixed(1)}" y="${(midHypY + shiftHypY).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" font-weight="bold" font-style="italic" fill="#b45309" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotHyp.toFixed(1)} ${(midHypX + shiftHypX).toFixed(1)} ${(midHypY + shiftHypY).toFixed(1)})">${lang === 'it' ? `Stilo Polare: ${gparams.polarLength.toFixed(1)} mm` : `Polar Style: ${gparams.polarLength.toFixed(1)} mm`}</text>
    
    <!-- Indicazione angolo stilo -->
    <text x="${angleTextX.toFixed(1)}" y="${(angleTextY + 3).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="8" fill="#b45309" fill-opacity="0.7" text-anchor="start">a = ${gparams.styleAngle.toFixed(1)}°</text>
    
    <!-- Apex marker di fissaggio -->
    <circle cx="400" cy="350" r="6" fill="#ffffff" stroke="#b45309" stroke-width="2.5" />
    <circle cx="400" cy="350" r="2.5" fill="#b45309" />
    <text x="400" y="335" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">${lang === 'it' ? 'FISSAGGIO STILO (APEX)' : 'STYLE ATTACHMENT (APEX)'}</text>
        `;
    })()}

    <!-- Curve di declinazione (Solstizi ed Equinozi) -->
    ${(() => {
        const dVals = [
            { v: 23.44, col: "#b45309", name: "SOLSTIZIO ESTATE / SUMMER SOLSTICE" },
            { v: 0, col: "#047857", name: "EQUINOZI / EQUINOXES" },
            { v: -23.44, col: "#1d4ed8", name: "SOLSTIZIO INVERNO / WINTER SOLSTICE" }
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

    <!-- Lemniscata del Tempo Medio (Analemma dell'orario XII) -->
    ${(() => {
        const ox = 400;
        const oy = 350;
        let lemPoints = [];
        const monthMarkers = {};

        const monthInitials = lang === 'it' ? 
            ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"] : 
            ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

        for (let d = 1; d <= 365; d++) {
            const decVal = SolarisMath.getSolarDeclination(d);
            const eotVal = SolarisMath.getEquationOfTime(d);
            const hAngleDeg = eotVal / 4;
            const sPos = SolarisMath.getSunPosition(lat, decVal, hAngleDeg);
            
            if (sPos.altitude > 0) {
                const shadow = SolarisMath.projectNodusShadowOnWall(sPos.altitude, sPos.azimuth, lat, dec, gparams, params.inclination);
                if (shadow) {
                    const sx = ox + shadow.x * mmToPx;
                    const sy = oy + shadow.y * mmToPx;
                    
                    const dist = Math.sqrt((sx-ox)*(sx-ox) + (sy-oy)*(sy-oy));
                    if (dist < R_ref * 1.3) {
                        lemPoints.push({ x: sx, y: sy });
                        
                        const monthStarts = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
                        const mIndex = monthStarts.indexOf(d);
                        if (mIndex !== -1) {
                            monthMarkers[mIndex] = { x: sx, y: sy };
                        }
                    }
                }
            }
        }
        if (lemPoints.length === 0) return '';
        
        const pathString = lemPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
        
        let markerTags = "";
        for (let mIdx in monthMarkers) {
            const pt = monthMarkers[mIdx];
            markerTags += `
    <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="4.5" fill="#ffffff" stroke="#b45309" stroke-width="1" />
    <text x="${pt.x.toFixed(1)}" y="${pt.y.toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="7" font-weight="bold" fill="#b45309" text-anchor="middle" dominant-baseline="middle">${monthInitials[mIdx]}</text>`;
        }

        return `
    <!-- Lemniscata del Tempo Medio -->
    <path d="M ${pathString}" fill="none" stroke="#b45309" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.8" />
    ${markerTags}`;
    })()}

    ${(() => {
        const ox = 400;
        const oy = 350;
        const civilHours = params.timeMinutes !== undefined ? params.timeMinutes / 60 : (date.getHours() + date.getMinutes() / 60);
        const solarHours = SolarisMath.civilToSolarTime(civilHours, lon, tz, eot, isDst);
        const hourAngle = (solarHours - 12) * 15;
        const sunPos = SolarisMath.getSunPosition(lat, solarDec, hourAngle);
        
        const hoursCivil = Math.floor(civilHours);
        const minsCivil = Math.round((civilHours % 1) * 60);
        const timeStr = `${String(hoursCivil).padStart(2, '0')}:${String(minsCivil).padStart(2, '0')}`;

        const currentShadow = SolarisMath.projectNodusShadowOnWall(sunPos.altitude, sunPos.azimuth, lat, dec, gparams, params.inclination || 0);

        if (currentShadow) {
            const shx = ox + currentShadow.x * mmToPx;
            const shy = oy + currentShadow.y * mmToPx;
            const sdRad = SolarisMath.degToRad(gparams.substyleAngle);
            const footX = ox + (gparams.substyleLength * mmToPx) * Math.sin(sdRad);
            const footY = oy + (gparams.substyleLength * mmToPx) * Math.cos(sdRad);

            const theta = Math.atan2(currentShadow.x, currentShadow.y) * 180 / Math.PI;
            const absTheta = Math.abs(theta);
            let angleLabel = "";
            if (Math.abs(currentShadow.x) < 0.01) {
                angleLabel = `0.0° (${lang === 'it' ? 'Sud' : 'South'})`;
            } else if (currentShadow.x > 0) {
                angleLabel = `${absTheta.toFixed(1)}° ${lang === 'it' ? 'Ovest' : 'West'}`;
            } else {
                angleLabel = `${absTheta.toFixed(1)}° ${lang === 'it' ? 'Est' : 'East'}`;
            }

            return `
    <!-- Ombra attiva simulata (Orario: ${timeStr}) -->
    <g id="simulated-active-shadow">
      <line x1="${ox}" y1="${oy}" x2="${shx.toFixed(1)}" y2="${shy.toFixed(1)}" stroke="#4b5563" stroke-width="4" stroke-linecap="round" opacity="0.65" />
      <line x1="${footX.toFixed(1)}" y1="${footY.toFixed(1)}" x2="${shx.toFixed(1)}" y2="${shy.toFixed(1)}" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" opacity="0.65" />
      <circle cx="${shx.toFixed(1)}" cy="${shy.toFixed(1)}" r="4.5" fill="#ffffff" stroke="#b45309" stroke-width="1.5" />
      <rect x="${(shx + 10).toFixed(1)}" y="${(shy - 16).toFixed(1)}" width="145" height="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5" rx="3" opacity="0.9" />
      <text x="${(shx + 15).toFixed(1)}" y="${(shy - 3).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" font-weight="bold" fill="#b45309">☀️ ${timeStr} (${angleLabel})</text>
    </g>`;
        } else {
            return `
    <!-- Muro in ombra o sole sotto l'orizzonte -->
    <text x="400" y="630" font-family="'Space Grotesk', sans-serif" font-size="11" fill="#ef4444" font-weight="bold" text-anchor="middle">${lang === 'it' ? 'PARETE IN OMBRA O SOLE SOTTO L\'ORIZZONTE' : 'WALL IN SHADOW OR SUN BELOW HORIZON'}</text>`;
        }
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
  <rect width="800" height="800" fill="#ffffff" />
  
  <text x="40" y="50" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="bold" fill="#b45309">SOLARIS</text>
  <text x="40" y="80" font-family="'Outfit', sans-serif" font-size="14" fill="#333333">${lang === 'it' ? 'Orologio Solare a Pavimento (Umano)' : 'Floor/Analemmatic Human Sundial'}</text>
  
  <!-- Info Box -->
  <g transform="translate(40, 670)" font-family="'Outfit', sans-serif" font-size="11" fill="#4b5563">
    <text x="0" y="0"><tspan fill="#b45309" font-weight="bold">PARAMETRI DELLA PIAZZA / PLAZA PARAMETERS:</tspan></text>
    <text x="0" y="18">Latitudine / Latitude: ${lat.toFixed(3)}°N | Longitudine / Longitude: ${params.longitude.toFixed(3)}°E</text>
    <text x="0" y="34">Semiasse Maggiore / Semi-Major (a): ${aVal.toFixed(2)} m | Semiasse Minore / Semi-Minor (b): ${geom.b.toFixed(2)} m</text>
    <text x="0" y="50">Pendenza Piazza / Plaza Slope: ${slope.toFixed(1)}° verso ${slopeDir.toFixed(0)}°</text>
    <text x="0" y="66">Latitudine Virtuale / Virtual Lat: ${geom.phiVirt.toFixed(2)}° | Rotazione Ellisse / Rotation: ${(geom.rotationAngle * 180 / Math.PI).toFixed(1)}°</text>
    
    <text x="420" y="0"><tspan fill="#b45309" font-weight="bold">GUIDA DI TRACCIAMENTO / LAYOUT GUIDE:</tspan></text>
    <text x="420" y="18">1. Fissa il centro (0,0). Traccia gli assi X (Est-Ovest) e Y (Nord-Sud) della piazza.</text>
    <text x="420" y="34">2. Posiziona le piastrelle delle ore alle coordinate (X, Y) esatte indicate in tabella.</text>
    <text x="420" y="50">3. La scala del calendario è ruotata di ${(geom.rotationAngle * 180 / Math.PI).toFixed(1)}° rispetto all'asse Y (Nord-Sud).</text>
    <text x="420" y="66">4. Traccia le tacche del calendario alle coordinate (X, Y) indicate.</text>
  </g>

  <!-- Grafica Orologio (Centro 400, 350) -->
  <g transform="translate(0, 0)">
    <!-- Assi Cartesiani -->
    <line x1="50" y1="350" x2="750" y2="350" stroke="#000000" stroke-width="0.5" opacity="0.3" />
    <line x1="400" y1="50" x2="400" y2="650" stroke="#000000" stroke-width="0.5" opacity="0.3" />
    
    <text x="400" y="30" font-family="'Space Grotesk', sans-serif" font-size="10" fill="#000000" text-anchor="middle">N (Nord / North)</text>
    <text x="400" y="670" font-family="'Space Grotesk', sans-serif" font-size="10" fill="#000000" text-anchor="middle">S (Sud / South)</text>
    <text x="25" y="354" font-family="'Space Grotesk', sans-serif" font-size="10" fill="#000000">W (Ovest / West)</text>
    <text x="755" y="354" font-family="'Space Grotesk', sans-serif" font-size="10" fill="#000000">E (Est / East)</text>

    <!-- Direzione della Pendenza -->
    ${(() => {
        if (slope > 0) {
            const slopeDirRad = slopeDir * Math.PI / 180;
            const L = aVal * scalePxPerM * 0.75;
            const endX = 400 + L * Math.sin(slopeDirRad);
            const endY = 350 - L * Math.cos(slopeDirRad);
            const angle = Math.atan2(endY - 350, endX - 400);
            const arrowSize = 8;
            
            const bearing = SolarisRenderer.getSlopeQuadrantBearing(slopeDir, lang);
            const labelText = lang === 'it' ? `Direzione Pendenza: ${slope.toFixed(1)}° (${bearing})` : `Slope Direction: ${slope.toFixed(1)}° (${bearing})`;
            
            const tx = endX + 10 * Math.cos(angle);
            const ty = endY + 10 * Math.sin(angle);
            
            let textAnchor = "middle";
            if (Math.cos(angle) < -0.1) {
                textAnchor = "end";
            } else if (Math.cos(angle) > 0.1) {
                textAnchor = "start";
            }

            const ax1 = endX - arrowSize * Math.cos(angle - Math.PI / 6);
            const ay1 = endY - arrowSize * Math.sin(angle - Math.PI / 6);
            const ax2 = endX - arrowSize * Math.cos(angle + Math.PI / 6);
            const ay2 = endY - arrowSize * Math.sin(angle + Math.PI / 6);

            return `
    <g id="slope-direction-line">
      <!-- Linea pendenza tratteggiata -->
      <line x1="400" y1="350" x2="${endX.toFixed(1)}" y2="${endY.toFixed(1)}" stroke="#0891b2" stroke-width="1.5" stroke-dasharray="4,3" />
      <!-- Punta freccia -->
      <polygon points="${endX.toFixed(1)},${endY.toFixed(1)} ${ax1.toFixed(1)},${ay1.toFixed(1)} ${ax2.toFixed(1)},${ay2.toFixed(1)}" fill="#0891b2" />
      <!-- Testo etichetta -->
      <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" font-weight="bold" fill="#0891b2" text-anchor="${textAnchor}" dominant-baseline="middle">${labelText}</text>
    </g>`;
        }
        return '';
    })()}

    <!-- Ellisse Oraria Ruotata -->
    <ellipse cx="400" cy="350" rx="${aVal * scalePxPerM}" ry="${geom.b * scalePxPerM}" transform="rotate(${(-geom.rotationAngle * 180 / Math.PI).toFixed(2)} 400 350)" stroke="#b45309" stroke-width="1.5" fill="none" opacity="0.5" />

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
    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${hVal === 12 ? '5' : '3.5'}" fill="${hVal === 12 ? '#b45309' : '#000000'}" />
    <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="11" font-weight="${hVal === 12 ? 'bold' : 'normal'}" fill="${hVal === 12 ? '#b45309' : '#000000'}" text-anchor="middle" dominant-baseline="middle">${hVal}</text>`;
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
    <line x1="${(px - tickDx).toFixed(1)}" y1="${(py + tickDy).toFixed(1)}" x2="${(px + tickDx).toFixed(1)}" y2="${(py - tickDy).toFixed(1)}" stroke="#b45309" stroke-width="1" />
    <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="'Outfit', sans-serif" font-size="9" fill="#000000" dominant-baseline="middle">${lang === 'it' ? pt.nameIt : pt.nameEn} (X=${pt.x.toFixed(3)}m, Y=${pt.y.toFixed(3)}m)</text>`;
        }).join('');
    })()}

    <!-- Scala Metrica di Riferimento -->
    <g transform="translate(680, 50)" font-family="'Outfit', sans-serif" font-size="9" fill="#333333">
      <line x1="0" y1="10" x2="50" y2="10" stroke="#333333" stroke-width="1.5" />
      <line x1="0" y1="5" x2="0" y2="15" stroke="#333333" stroke-width="1" />
      <line x1="50" y1="5" x2="50" y2="15" stroke="#333333" stroke-width="1" />
      <text x="25" y="0" text-anchor="middle">1.0 m</text>
    </g>

    ${(() => {
        const civilHours = params.timeMinutes !== undefined ? params.timeMinutes / 60 : (date.getHours() + date.getMinutes() / 60);
        const solarHours = SolarisMath.civilToSolarTime(civilHours, lon, tz, eot, isDst);
        const hourAngle = (solarHours - 12) * 15;
        const sunPos = SolarisMath.getSunPosition(lat, solarDec, hourAngle);
        
        const hoursCivil = Math.floor(civilHours);
        const minsCivil = Math.round((civilHours % 1) * 60);
        const timeStr = `${String(hoursCivil).padStart(2, '0')}:${String(minsCivil).padStart(2, '0')}`;

        const zOffset = SolarisMath.calcFloorGnomonOffset(aVal, geom.phiVirt, solarDec, geom.rotationAngle);
        const personX = 400 + zOffset.x * scalePxPerM;
        const personY = 350 - zOffset.y * scalePxPerM;

        if (sunPos.altitude > 0) {
            const hPerson = params.personHeight !== undefined ? params.personHeight : 1.70;
            const shadowTip = SolarisMath.projectVerticalShadowOnSlope(
                zOffset.x, zOffset.y, hPerson,
                sunPos.altitude, sunPos.azimuth,
                lat, slope, slopeDir
            );

            if (shadowTip) {
                const shTipX = 400 + shadowTip.x * scalePxPerM;
                const shTipY = 350 - shadowTip.y * scalePxPerM;

                const dx = shadowTip.x - zOffset.x;
                const dy = shadowTip.y - zOffset.y;
                const angleRad = Math.atan2(dx, dy);
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
                const bearingText = `${northSouth} ${val.toFixed(1)}° ${eastWest}`;

                const len = Math.sqrt(dx*dx + dy*dy);
                let extLine = '';
                if (len > 0.001) {
                    const extX = personX + (dx / len) * 800;
                    const extY = personY - (dy / len) * 800;
                    extLine = `<line x1="${personX.toFixed(1)}" y1="${personY.toFixed(1)}" x2="${extX.toFixed(1)}" y2="${extY.toFixed(1)}" stroke="#000000" stroke-width="0.75" stroke-dasharray="2,4" opacity="0.3" />`;
                }

                return `
    <!-- Ombra attiva simulata (Persona) -->
    <g id="simulated-active-shadow">
      ${extLine}
      <line x1="${personX.toFixed(1)}" y1="${personY.toFixed(1)}" x2="${shTipX.toFixed(1)}" y2="${shTipY.toFixed(1)}" stroke="#4b5563" stroke-width="8" stroke-linecap="round" opacity="0.5" />
      <circle cx="${personX.toFixed(1)}" cy="${personY.toFixed(1)}" r="6" fill="#ffffff" stroke="#b45309" stroke-width="2" />
      <text x="${personX.toFixed(1)}" y="${personY.toFixed(1)}" font-family="'Outfit', sans-serif" font-size="8" font-weight="bold" fill="#000000" text-anchor="middle" dominant-baseline="middle">👤</text>
      <text x="${(personX - 10).toFixed(1)}" y="${personY.toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" font-weight="bold" fill="#b45309" text-anchor="end" dominant-baseline="middle">${lang === 'it' ? 'Tu ti trovi qui (Gnomone Umano)' : 'You stand here (Human Gnomon)'}</text>
      <rect x="${(shTipX + 8).toFixed(1)}" y="${(shTipY - 14).toFixed(1)}" width="130" height="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5" rx="3" opacity="0.9" />
      <text x="${(shTipX + 13).toFixed(1)}" y="${(shTipY - 2).toFixed(1)}" font-family="'Space Grotesk', sans-serif" font-size="9" fill="#000000" font-weight="bold">☀️ ${timeStr} (${bearingText})</text>
    </g>`;
            }
        } else {
            return `
    <!-- Sole sotto l'orizzonte -->
    <text x="400" y="630" font-family="'Space Grotesk', sans-serif" font-size="11" fill="#ef4444" font-weight="bold" text-anchor="middle">${lang === 'it' ? 'SOLE SOTTO L\'ORIZZONTE' : 'SUN BELOW HORIZON'}</text>`;
        }
        return '';
    })()}
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
    },

    /**
     * GENERATORE DI REPORT TECNICO IN FORMATO PDF
     */
    /**
     * COSTRUISCE IL CONTENUTO HTML E CSS DEL REPORT TECNICO (CONDIVISO)
     */
    buildReportHTML: (mode, params, lang = "it") => {
        const lat = params.latitude;
        const lon = params.longitude;
        const dateStr = params.date || new Date().toISOString().split('T')[0];
        
        const t = {
            it: {
                title: "REPORT TECNICO DI COSTRUZIONE",
                wallTitle: "Meridiana Verticale Declinante",
                floorTitle: "Orologio a Pavimento (Meridiana Umana)",
                paramsTitle: "PARAMETRI DI PROGETTAZIONE",
                gnomonTitle: "SCHEDA TECNICA DELLO STILO / GNOMONE",
                tableHoursTitle: "TABELLA DEI PUNTI ORARI",
                tableGnomonTitle: "PUNTI CHIAVE DELLO STILO (GNOMONE / CALENDARIO)",
                latitude: "Latitudine",
                longitude: "Longitudine",
                timezone: "Fuso Orario",
                declination: "Declinazione Muro",
                inclination: "Inclinazione Muro",
                semiMajor: "Semiasse Maggiore (a)",
                semiMinor: "Semiasse Minore (b)",
                slope: "Pendenza Piazza",
                slopeDir: "Direzione Pendenza",
                polarLength: "Lunghezza Stilo Polare",
                orthoLength: "Altezza Ortostilo (h)",
                substyleLength: "Lunghezza Substilo",
                styleAngle: "Inclinazione Stilo (a)",
                substyleAngle: "Angolo Substilo (SD)",
                h0: "Angolo H0 (Diff. Longitudine)",
                hourCol: "Ora Solare",
                angleCol: "Angolo",
                angleFromVertCol: "Angolo da Verticale",
                angleFromSubstyleCol: "Angolo da Substilo",
                distCol: "Distanza (d)",
                coordOrigin: "Origine delle Coordinate (0,0)",
                coordOriginFloor: "Centro geometrico dell'ellisse / Punto di Equinozio sulla scala centrale",
                coordOriginWall: "Punto di fissaggio dello stilo (Apex)",
                footerMsg: "Generato da Solaris — Software di Progettazione Gnomonica",
                summerSolstice: "Solstizio d'Estate (21 Giugno, δ = +23.44°)",
                winterSolstice: "Solstizio d'Inverno (21 Dicembre, δ = -23.44°)",
                equinox: "Equinozio (21 Marzo / 23 Settembre, δ = 0°)",
                gnomonPointCol: "Punto Gnomonico",
                coordinatesCol: "Coordinate X; Y (mm)",
                declinationCol: "Declinazione (δ)",
                shadowPointsTitle: "PUNTI D'OMBRA DEL NODULO A MEZZOGIORNO SOLARE",
                sumShadow: "Ombra Solstizio Estate (12:00)",
                winShadow: "Ombra Solstizio Inverno (12:00)",
                eqShadow: "Ombra Equinozio (12:00)",
                apexPoint: "Punto di Fissaggio Stilo (Apex)",
                footPoint: "Piede dell'Ortostilo sul muro",
                nodusPoint: "Posizione fisica del Nodulo",
                heightAboveWall: "Altezza perpendicolare dal muro (mm)"
            },
            en: {
                title: "TECHNICAL CONSTRUCTION REPORT",
                wallTitle: "Declining Vertical Sundial",
                floorTitle: "Floor Sundial (Human Analemmatic)",
                paramsTitle: "DESIGN PARAMETERS",
                gnomonTitle: "STYLE / GNOMON TECHNICAL SHEET",
                tableHoursTitle: "HOUR POINTS TABLE",
                tableGnomonTitle: "KEY POINTS OF THE STYLE (GNOMON / CALENDAR)",
                latitude: "Latitude",
                longitude: "Longitude",
                timezone: "Timezone",
                declination: "Wall Declination",
                inclination: "Wall Inclination",
                semiMajor: "Semi-Major Axis (a)",
                semiMinor: "Semi-Minor Axis (b)",
                slope: "Plaza Slope",
                slopeDir: "Slope Direction",
                polarLength: "Polar Style Length",
                orthoLength: "Orthostyle Height (h)",
                substyleLength: "Substyle Length",
                styleAngle: "Style Angle (a)",
                substyleAngle: "Substyle Angle (SD)",
                h0: "H0 Angle (Longitude Diff)",
                hourCol: "Solar Hour",
                angleCol: "Angle",
                angleFromVertCol: "Angle from Vertical",
                angleFromSubstyleCol: "Angle from Substyle",
                distCol: "Distance (d)",
                coordOrigin: "Coordinate Origin (0,0)",
                coordOriginFloor: "Geometric center of the ellipse / Equinox point on the central scale",
                coordOriginWall: "Style attachment point (Apex)",
                footerMsg: "Generated by Solaris — Gnomonic Design Software",
                summerSolstice: "Summer Solstice (June 21, δ = +23.44°)",
                winterSolstice: "Winter Solstice (December 21, δ = -23.44°)",
                equinox: "Equinox (March 21 / Sept 23, δ = 0°)",
                gnomonPointCol: "Gnomon Point",
                coordinatesCol: "X; Y Coordinates (mm)",
                declinationCol: "Declination (δ)",
                shadowPointsTitle: "NODUS SHADOW POINTS AT SOLAR NOON",
                sumShadow: "Summer Solstice Shadow (12:00)",
                winShadow: "Winter Solstice Shadow (12:00)",
                eqShadow: "Equinox Shadow (12:00)",
                apexPoint: "Style Attachment Point (Apex)",
                footPoint: "Foot of Orthostyle on wall",
                nodusPoint: "Physical Nodus Position",
                heightAboveWall: "Perpendicular height from wall (mm)"
            }
        };

        const currentT = t[lang] || t['it'];
        const titleText = mode === 'wall' ? currentT.wallTitle : currentT.floorTitle;

        let paramsHTML = '';
        let tableHoursHTML = '';
        let gnomonHTML = '';

        if (mode === 'wall') {
            const dec = params.declination;
            const gLen = params.gnomonLength;
            const wallInc = params.inclination || 0;
            const gparams = SolarisMath.calcWallGnomonParameters(lat, dec, gLen, wallInc);

            paramsHTML = `
            <div class="grid-2">
                <div class="card">
                    <h3>${currentT.paramsTitle}</h3>
                    <div class="metric-row"><span class="metric-label">${currentT.latitude}:</span><span class="metric-value">${lat.toFixed(4)}°N</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.longitude}:</span><span class="metric-value">${lon.toFixed(4)}°E</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.timezone}:</span><span class="metric-value">UTC${params.timezone >= 0 ? '+' + params.timezone : params.timezone} (DST: ${params.isDst ? 'Sì/Yes' : 'No'})</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.declination}:</span><span class="metric-value">${dec.toFixed(1)}°</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.inclination}:</span><span class="metric-value">${wallInc.toFixed(1)}°</span></div>
                </div>
                <div class="card">
                    <h3>${currentT.gnomonTitle}</h3>
                    <div class="metric-row"><span class="metric-label">${currentT.polarLength}:</span><span class="metric-value">${gparams.polarLength.toFixed(1)} mm</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.orthoLength}:</span><span class="metric-value">${gparams.orthoLength.toFixed(1)} mm</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.substyleLength}:</span><span class="metric-value">${gparams.substyleLength.toFixed(1)} mm</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.styleAngle}:</span><span class="metric-value">${gparams.styleAngle.toFixed(2)}°</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.substyleAngle}:</span><span class="metric-value">${gparams.substyleAngle.toFixed(2)}°</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.h0}:</span><span class="metric-value">${gparams.h0.toFixed(2)}°</span></div>
                </div>
            </div>`;

            const hoursList = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            const hourAngles = hoursList.map(h => (h - 12) * 15);
            const wallHourLines = SolarisMath.calcWallHourLines(gparams.styleAngle, gparams.h0, gparams.substyleAngle, hourAngles);

            let hourRows = '';
            wallHourLines.forEach((line, idx) => {
                const hVal = hoursList[idx];
                const hourAngle = line.hourAngle;
                
                // Summer Solstice Shadow Point
                const sPosSum = SolarisMath.getSunPosition(lat, 23.44, hourAngle);
                const shSum = SolarisMath.projectNodusShadowOnWall(sPosSum.altitude, sPosSum.azimuth, lat, dec, gparams, wallInc);
                
                // Equinox Shadow Point
                const sPosEq = SolarisMath.getSunPosition(lat, 0.0, hourAngle);
                const shEq = SolarisMath.projectNodusShadowOnWall(sPosEq.altitude, sPosEq.azimuth, lat, dec, gparams, wallInc);
                
                // Winter Solstice Shadow Point
                const sPosWin = SolarisMath.getSunPosition(lat, -23.44, hourAngle);
                const shWin = SolarisMath.projectNodusShadowOnWall(sPosWin.altitude, sPosWin.azimuth, lat, dec, gparams, wallInc);

                const formatPt = (pt) => {
                    if (!pt) return '—';
                    return `X: ${pt.x.toFixed(1)}, Y: ${pt.y.toFixed(1)}`;
                };

                hourRows += `
                <tr>
                    <td><strong>${hVal}:00</strong></td>
                    <td>${line.angleFromVertical.toFixed(1)}°</td>
                    <td>${line.angleFromSubstyle.toFixed(1)}°</td>
                    <td>${formatPt(shSum)}</td>
                    <td>${formatPt(shEq)}</td>
                    <td>${formatPt(shWin)}</td>
                </tr>`;
            });

            tableHoursHTML = `
            <div class="section-title">${currentT.tableHoursTitle}</div>
            <p style="font-size: 11px; color: #475569; margin-top: -5px; margin-bottom: 8px;">
                * ${currentT.coordOrigin}: <strong>${currentT.coordOriginWall}</strong>. X positivo a destra, Y positivo in basso. Valori in millimetri (mm).
            </p>
            <table>
                <thead>
                    <tr>
                        <th>${currentT.hourCol}</th>
                        <th>${currentT.angleFromVertCol}</th>
                        <th>${currentT.angleFromSubstyleCol}</th>
                        <th>Solstizio Estate (mm)</th>
                        <th>Equinozio (mm)</th>
                        <th>Solstizio Inverno (mm)</th>
                    </tr>
                </thead>
                <tbody>
                    ${hourRows}
                </tbody>
            </table>`;

            const sdRad = SolarisMath.degToRad(gparams.substyleAngle);
            const footX = gparams.substyleLength * Math.sin(sdRad);
            const footY = gparams.substyleLength * Math.cos(sdRad);

            // Noon Shadows
            const noonSum = SolarisMath.getSunPosition(lat, 23.44, 0);
            const shNoonSum = SolarisMath.projectNodusShadowOnWall(noonSum.altitude, noonSum.azimuth, lat, dec, gparams, wallInc);

            const noonEq = SolarisMath.getSunPosition(lat, 0, 0);
            const shNoonEq = SolarisMath.projectNodusShadowOnWall(noonEq.altitude, noonEq.azimuth, lat, dec, gparams, wallInc);

            const noonWin = SolarisMath.getSunPosition(lat, -23.44, 0);
            const shNoonWin = SolarisMath.projectNodusShadowOnWall(noonWin.altitude, noonWin.azimuth, lat, dec, gparams, wallInc);

            const formatPt = (pt) => {
                if (!pt) return '—';
                return `X: ${pt.x.toFixed(1)}, Y: ${pt.y.toFixed(1)}`;
            };

            gnomonHTML = `
            <div class="section-title">${currentT.tableGnomonTitle}</div>
            <div class="grid-2" style="margin-bottom: 15px;">
                <div class="card">
                    <h3>Gnomone Fisico (Coordinate mm)</h3>
                    <div class="metric-row">
                        <span class="metric-label">${currentT.apexPoint}:</span>
                        <span class="metric-value">X: 0.0, Y: 0.0</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">${currentT.footPoint}:</span>
                        <span class="metric-value">X: ${footX.toFixed(1)}, Y: ${footY.toFixed(1)}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">${currentT.nodusPoint}:</span>
                        <span class="metric-value">X: ${footX.toFixed(1)}, Y: ${footY.toFixed(1)}, Z: ${gparams.orthoLength.toFixed(1)}</span>
                    </div>
                    <p style="font-size: 9px; color: #64748b; margin: 5px 0 0 0;">
                        * Z rappresenta l'altezza perpendicolare del nodulo stilo rispetto al piano della parete.
                    </p>
                </div>
                <div class="card">
                    <h3>${currentT.shadowPointsTitle}</h3>
                    <div class="metric-row">
                        <span class="metric-label">${currentT.sumShadow}:</span>
                        <span class="metric-value">${formatPt(shNoonSum)}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">${currentT.eqShadow}:</span>
                        <span class="metric-value">${formatPt(shNoonEq)}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">${currentT.winShadow}:</span>
                        <span class="metric-value">${formatPt(shNoonWin)}</span>
                    </div>
                </div>
            </div>`;
        } else {
            // Floor mode
            const aVal = params.ellipseWidth;
            const slope = params.floorSlope || 0;
            const slopeDir = params.floorSlopeDir || 180;
            const geom = SolarisMath.calcFloorSundialGeometry(lat, aVal, slope, slopeDir);

            paramsHTML = `
            <div class="grid-2">
                <div class="card">
                    <h3>${currentT.paramsTitle}</h3>
                    <div class="metric-row"><span class="metric-label">${currentT.latitude}:</span><span class="metric-value">${lat.toFixed(4)}°N</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.longitude}:</span><span class="metric-value">${lon.toFixed(4)}°E</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.timezone}:</span><span class="metric-value">UTC${params.timezone >= 0 ? '+' + params.timezone : params.timezone} (DST: ${params.isDst ? 'Sì/Yes' : 'No'})</span></div>
                </div>
                <div class="card">
                    <h3>Parametri Ellisse & Pendenza</h3>
                    <div class="metric-row"><span class="metric-label">${currentT.semiMajor}:</span><span class="metric-value">${aVal.toFixed(2)} m (${(aVal*1000).toFixed(0)} mm)</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.semiMinor}:</span><span class="metric-value">${geom.b.toFixed(2)} m (${(geom.b*1000).toFixed(0)} mm)</span></div>
                    <div class="metric-row"><span class="metric-label">${currentT.slope}:</span><span class="metric-value">${slope.toFixed(1)}° vers. ${slopeDir.toFixed(0)}°</span></div>
                    <div class="metric-row"><span class="metric-label">Inclinazione Ellisse / Rotation:</span><span class="metric-value">${(geom.rotationAngle * 180 / Math.PI).toFixed(2)}°</span></div>
                </div>
            </div>`;

            const hoursList = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
            const hourAngles = hoursList.map(h => (h - 12) * 15);
            const hourPoints = SolarisMath.calcFloorHourPoints(aVal, geom.b, hourAngles, geom.rotationAngle);

            let hourRows = '';
            hourPoints.forEach((pt, idx) => {
                const hVal = hoursList[idx];
                const xMm = pt.x * 1000;
                const yMm = pt.y * 1000;
                const dMm = pt.distance * 1000;
                const angleRad = Math.atan2(pt.y, pt.x);
                let angleDeg = angleRad * 180 / Math.PI;
                if (angleDeg < 0) angleDeg += 360;

                hourRows += `
                <tr>
                    <td><strong>${hVal}:00</strong></td>
                    <td>${angleDeg.toFixed(1)}°</td>
                    <td>${xMm.toFixed(1)}</td>
                    <td>${yMm.toFixed(1)}</td>
                    <td>${dMm.toFixed(1)}</td>
                </tr>`;
            });

            tableHoursHTML = `
            <div class="section-title">${currentT.tableHoursTitle}</div>
            <p style="font-size: 11px; color: #475569; margin-top: -5px; margin-bottom: 8px;">
                * ${currentT.coordOrigin}: <strong>${currentT.coordOriginFloor}</strong>. Coordinate X (Est-Ovest) e Y (Nord-Sud) espresse in millimetri (mm) dal centro.
            </p>
            <table>
                <thead>
                    <tr>
                        <th>${currentT.hourCol}</th>
                        <th>${currentT.angleCol} (Est-0°)</th>
                        <th>X (mm)</th>
                        <th>Y (mm)</th>
                        <th>${currentT.distCol} (mm)</th>
                    </tr>
                </thead>
                <tbody>
                    ${hourRows}
                </tbody>
            </table>`;

            const dVals = [
                { name: currentT.summerSolstice, v: 23.44 },
                { name: currentT.equinox, v: 0.0 },
                { name: currentT.winterSolstice, v: -23.44 }
            ];

            let gnomonRows = '';
            dVals.forEach(d => {
                const offset = SolarisMath.calcFloorGnomonOffset(aVal, geom.phiVirt, d.v, geom.rotationAngle);
                const xMm = offset.x * 1000;
                const yMm = offset.y * 1000;
                const zMm = offset.z_virt * 1000;
                const angleRad = Math.atan2(offset.y, offset.x);
                let angleDeg = angleRad * 180 / Math.PI;
                if (angleDeg < 0) angleDeg += 360;
                if (Math.abs(xMm) < 0.01 && Math.abs(yMm) < 0.01) angleDeg = 0;

                gnomonRows += `
                <tr>
                    <td><strong>${d.name}</strong></td>
                    <td>${d.v.toFixed(2)}°</td>
                    <td>${angleDeg.toFixed(1)}°</td>
                    <td>${xMm.toFixed(1)}</td>
                    <td>${yMm.toFixed(1)}</td>
                    <td>${zMm.toFixed(1)}</td>
                </tr>`;
            });

            gnomonHTML = `
            <div class="section-title">${currentT.tableGnomonTitle}</div>
            <p style="font-size: 11px; color: #475569; margin-top: -5px; margin-bottom: 8px;">
                * Posizione della persona (gnomone) lungo la scala calendariale a seconda del periodo dell'anno. Coordinate in millimetri (mm) dal centro.
            </p>
            <table>
                <thead>
                    <tr>
                        <th>${currentT.gnomonPointCol}</th>
                        <th>${currentT.declinationCol}</th>
                        <th>${currentT.angleCol}</th>
                        <th>X (mm)</th>
                        <th>Y (mm)</th>
                        <th>Offset Z virtuale (mm)</th>
                    </tr>
                </thead>
                <tbody>
                    ${gnomonRows}
                </tbody>
            </table>`;
        }

        const svgStr = SolarisRenderer.generateSVG(mode, params, new Date(dateStr), lang).replace(/<\?xml[^>]*\?>/, '');

        const styleBlock = `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap');
            
            @page {
                size: A4;
                margin: 15mm 15mm 15mm 15mm;
            }
            body {
                font-family: 'Outfit', sans-serif;
                color: #1e293b;
                background-color: #ffffff;
                line-height: 1.4;
                margin: 0;
                padding: 0;
            }
            .header {
                border-bottom: 2px solid #b45309;
                padding-bottom: 8px;
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            .logo {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 26px;
                font-weight: 700;
                color: #b45309;
                letter-spacing: 1px;
            }
            .doc-title {
                font-size: 14px;
                color: #475569;
                font-weight: 500;
                text-align: right;
            }
            .section-title {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 16px;
                font-weight: 700;
                color: #1e293b;
                margin-top: 20px;
                margin-bottom: 8px;
                border-left: 4px solid #b45309;
                padding-left: 8px;
                page-break-after: avoid;
            }
            .grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            .card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px;
                font-size: 11px;
            }
            .card h3 {
                margin-top: 0;
                margin-bottom: 8px;
                color: #b45309;
                font-size: 13px;
                border-bottom: 1px solid #cbd5e1;
                padding-bottom: 4px;
            }
            .metric-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }
            .metric-label {
                color: #64748b;
                font-weight: 500;
            }
            .metric-value {
                font-weight: 700;
                color: #0f172a;
            }
            .drawing-container {
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 15px 0;
                border: 1px dashed #cbd5e1;
                border-radius: 8px;
                padding: 10px;
                background: #ffffff;
                page-break-inside: avoid;
            }
            .drawing-container svg {
                width: 100%;
                max-width: 480px;
                height: auto;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
                margin-top: 8px;
                page-break-inside: avoid;
            }
            th {
                background-color: #f1f5f9;
                color: #475569;
                font-weight: 600;
                text-align: left;
                border-bottom: 2px solid #cbd5e1;
                padding: 5px 6px;
            }
            td {
                padding: 5px 6px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
            }
            tr:nth-child(even) td {
                background-color: #f8fafc;
            }
            .footer {
                margin-top: 25px;
                font-size: 9px;
                color: #94a3b8;
                text-align: center;
                border-top: 1px solid #e2e8f0;
                padding-top: 8px;
                page-break-before: avoid;
            }
            .page-break {
                page-break-before: always;
            }
            
            @media print {
                body {
                    background: white;
                    color: black;
                }
                .no-print {
                    display: none;
                }
            }
        `;

        const bodyHTML = `
            <div class="header">
                <div class="logo">SOLARIS</div>
                <div class="doc-title">${currentT.title}<br><span style="font-weight: normal; font-size: 11px;">${titleText}</span></div>
            </div>

            ${paramsHTML}

            <div class="drawing-container">
                ${svgStr}
            </div>

            <div class="page-break"></div>

            <div class="header">
                <div class="logo">SOLARIS</div>
                <div class="doc-title">${currentT.title}<br><span style="font-weight: normal; font-size: 11px;">${titleText}</span></div>
            </div>

            ${gnomonHTML}

            ${tableHoursHTML}

            <div class="footer">
                ${currentT.footerMsg} — ${new Date().toLocaleDateString(lang)}
            </div>
        `;

        return {
            titleText: titleText,
            styleBlock: styleBlock,
            bodyHTML: bodyHTML
        };
    },

    /**
     * GENERATORE DI REPORT TECNICO IN FORMATO PDF (STAMPA IN-PAGE DIRETTA)
     */
    exportToPDF: (mode, params, lang = "it") => {
        const report = SolarisRenderer.buildReportHTML(mode, params, lang);
        
        const html = `
            <style>${report.styleBlock}</style>
            ${report.bodyHTML}
        `;

        const printDiv = document.getElementById('print-report');
        if (printDiv) {
            printDiv.innerHTML = html;
            
            // Ripristina l'interfaccia originale dopo la stampa
            const cleanUp = () => {
                printDiv.innerHTML = '';
            };
            
            window.addEventListener('afterprint', cleanUp, { once: true });
            
            // Lancia la stampa del browser in-page bypassando popup blocker
            window.print();
        } else {
            console.error('print-report container not found in DOM');
        }
    },

    /**
     * ESPORTATORE DEL REPORT IN FORMATO HTML STANDALONE SCARICABILE
     */
    exportToHTML: (mode, params, lang = "it") => {
        const report = SolarisRenderer.buildReportHTML(mode, params, lang);
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Solaris Technical Report - ${report.titleText}</title>
    <style>${report.styleBlock}</style>
</head>
<body>
    ${report.bodyHTML}
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `Solaris_${mode}_report.html`;
        document.body.appendChild(link);
        link.click();
        
        // Pulizia ritardata per garantire l'avvio del download
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    },

    /**
     * ESPORTATORE DEL DISEGNO IN FORMATO DXF VETTORIALE (A SCALA REALE 1:1 IN MM)
     */
    exportToDXF: (mode, params, lang = "it") => {
        const lat = params.latitude;
        const lon = params.longitude;
        const tz = params.timezone;
        const isDst = params.isDst;
        
        const date = params.dateStr ? new Date(params.dateStr) : new Date();
        const dayOfYear = SolarisMath.getDayOfYear(date);
        const solarDec = SolarisMath.getSolarDeclination(dayOfYear);
        const eot = SolarisMath.getEquationOfTime(dayOfYear);

        let dxfContent = "";
        
        // DXF Header
        dxfContent += "  0\nSECTION\n  2\nHEADER\n  9\n$ACADVER\n  1\nAC1009\n  0\nENDSEC\n";
        
        // DXF Entities Section
        dxfContent += "  0\nSECTION\n  2\nENTITIES\n";

        // Helpers
        const writeLine = (x1, y1, x2, y2, layer, color = 7) => {
            let s = "  0\nLINE\n";
            s += "  8\n" + layer + "\n";
            s += " 62\n" + color + "\n";
            s += " 10\n" + x1.toFixed(3) + "\n";
            s += " 20\n" + y1.toFixed(3) + "\n";
            s += " 30\n0.0\n";
            s += " 11\n" + x2.toFixed(3) + "\n";
            s += " 21\n" + y2.toFixed(3) + "\n";
            s += " 31\n0.0\n";
            return s;
        };

        const writeCircle = (cx, cy, radius, layer, color = 7) => {
            let s = "  0\nCIRCLE\n";
            s += "  8\n" + layer + "\n";
            s += " 62\n" + color + "\n";
            s += " 10\n" + cx.toFixed(3) + "\n";
            s += " 20\n" + cy.toFixed(3) + "\n";
            s += " 30\n0.0\n";
            s += " 40\n" + radius.toFixed(3) + "\n";
            return s;
        };

        const writeText = (x, y, text, height, layer, color = 7, angle = 0, alignment = 0) => {
            let s = "  0\nTEXT\n";
            s += "  8\n" + layer + "\n";
            s += " 62\n" + color + "\n";
            s += " 10\n" + x.toFixed(3) + "\n";
            s += " 20\n" + y.toFixed(3) + "\n";
            s += " 30\n0.0\n";
            s += " 40\n" + height.toFixed(3) + "\n";
            s += "  1\n" + text + "\n";
            if (angle !== 0) {
                s += " 50\n" + angle.toFixed(3) + "\n";
            }
            if (alignment === 1) {
                s += " 72\n1\n";
                s += " 11\n" + x.toFixed(3) + "\n";
                s += " 21\n" + y.toFixed(3) + "\n";
                s += " 31\n0.0\n";
            } else if (alignment === 2) {
                s += " 72\n2\n";
                s += " 11\n" + x.toFixed(3) + "\n";
                s += " 21\n" + y.toFixed(3) + "\n";
                s += " 31\n0.0\n";
            }
            return s;
        };

        if (mode === 'wall') {
            const dec = params.declination;
            const gLen = params.gnomonLength;
            const gparams = SolarisMath.calcWallGnomonParameters(lat, dec, gLen, params.inclination);
            const wallZoom = params.wallZoom !== undefined ? params.wallZoom / 100 : 1.0;
            const R_ref = 230 * wallZoom;
            const mmToPx = (0.45 * R_ref) / gparams.polarLength;
            const ox = 400, oy = 350;

            const toDxfCoords = (px, py) => {
                return {
                    x: (px - ox) / mmToPx,
                    y: -(py - oy) / mmToPx
                };
            };

            // 1. Assi Cartesiani (Layer: ASSI - color 9)
            const xLeft = toDxfCoords(ox - R_ref * 1.3, oy);
            const xRight = toDxfCoords(ox + R_ref * 1.3, oy);
            dxfContent += writeLine(xLeft.x, xLeft.y, xRight.x, xRight.y, "ASSI", 9);

            const yBottom = toDxfCoords(ox, oy + R_ref * 1.3);
            const yTop = toDxfCoords(ox, oy - R_ref * 0.2);
            dxfContent += writeLine(yBottom.x, yBottom.y, yTop.x, yTop.y, "ASSI", 9);

            // Scritte punti cardinali
            const tOvest = toDxfCoords(ox - R_ref * 1.25, oy - 15);
            dxfContent += writeText(tOvest.x, tOvest.y, lang === 'it' ? "OVEST" : "WEST", 12, "ASSI", 7);
            const tEst = toDxfCoords(ox + R_ref * 1.15, oy - 15);
            dxfContent += writeText(tEst.x, tEst.y, lang === 'it' ? "EST" : "EAST", 12, "ASSI", 7);

            // 2. Linee Orarie (Layer: ORE_LINEE) e Scritte Ore (Layer: ORE_TESTI)
            const hoursList = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            const hourAngles = hoursList.map(h => (h - 12) * 15);
            const wallHourLines = SolarisMath.calcWallHourLines(gparams.styleAngle, gparams.h0, gparams.substyleAngle, hourAngles);

            const romanNumerals = {
                6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI",
                12: "XII", 13: "I", 14: "II", 15: "III", 16: "IV", 17: "V", 18: "VI"
            };

            wallHourLines.forEach((line, index) => {
                const hVal = hoursList[index];
                const thetaRad = SolarisMath.degToRad(line.angleFromVertical);

                const dummySun = SolarisMath.getSunPosition(lat, solarDec, line.hourAngle);
                const dummyProj = SolarisMath.projectNodusShadowOnWall(dummySun.altitude, dummySun.azimuth, lat, dec, gparams, params.inclination);
                const isValidOnWall = (dummyProj !== null);

                const sPosWin = SolarisMath.getSunPosition(lat, -23.44, line.hourAngle);
                const shWin = SolarisMath.projectNodusShadowOnWall(sPosWin.altitude, sPosWin.azimuth, lat, dec, gparams, params.inclination);

                const sPosSum = SolarisMath.getSunPosition(lat, 23.44, line.hourAngle);
                const shSum = SolarisMath.projectNodusShadowOnWall(sPosSum.altitude, sPosSum.azimuth, lat, dec, gparams, params.inclination);

                if (!shWin && !shSum) return;

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

                if (dStartClipped >= dEndClipped) return;

                const lx1 = ox + dStartClipped * Math.sin(thetaRad);
                const ly1 = oy + dStartClipped * Math.cos(thetaRad);
                const lx2 = ox + dEndClipped * Math.sin(thetaRad);
                const ly2 = oy + dEndClipped * Math.cos(thetaRad);

                const p1 = toDxfCoords(lx1, ly1);
                const p2 = toDxfCoords(lx2, ly2);

                const color = isValidOnWall ? 2 : 9; // giallo se illuminato, grigio altrimenti
                dxfContent += writeLine(p1.x, p1.y, p2.x, p2.y, "ORE_LINEE", color);

                // Scritta dell'ora in numeri romani
                const tx = ox + (dEndClipped + 18) * Math.sin(thetaRad);
                const ty = oy + (dEndClipped + 18) * Math.cos(thetaRad);
                const ptText = toDxfCoords(tx, ty);

                let textAngleDeg = line.angleFromVertical;
                if (textAngleDeg > 90) textAngleDeg -= 180;
                if (textAngleDeg < -90) textAngleDeg += 180;
                
                dxfContent += writeText(ptText.x, ptText.y, romanNumerals[hVal], 10, "ORE_TESTI", isValidOnWall ? 7 : 9, -textAngleDeg, 1);
            });

            // 3. Curve di Declinazione (Layer: CURVE_DECLINAZIONE)
            const declinationValues = [
                { decVal: 23.44, color: 5, label: lang === "it" ? "SOLSTIZIO ESTATE" : "SUMMER SOLSTICE" },  // Estate (Blu)
                { decVal: 0, color: 3, label: lang === "it" ? "EQUINOZIO" : "EQUINOX" },                   // Equinozi (Verde)
                { decVal: -23.44, color: 1, label: lang === "it" ? "SOLSTIZIO INVERNO" : "WINTER SOLSTICE" } // Inverno (Rosso)
            ];

            declinationValues.forEach(dVal => {
                let lastPt = null;
                const validPts = [];
                for (let hDeg = -120; hDeg <= 120; hDeg += 2.0) {
                    const sPos = SolarisMath.getSunPosition(lat, dVal.decVal, hDeg);
                    const shadow = SolarisMath.projectNodusShadowOnWall(sPos.altitude, sPos.azimuth, lat, dec, gparams, params.inclination);

                    if (shadow) {
                        const sx = ox + shadow.x * mmToPx;
                        const sy = oy + shadow.y * mmToPx;
                        const dist = Math.sqrt((sx-ox)*(sx-ox) + (sy-oy)*(sy-oy));
                        
                        if (dist < R_ref * 1.3) {
                            const curPt = toDxfCoords(sx, sy);
                            validPts.push(curPt);
                            if (lastPt !== null) {
                                dxfContent += writeLine(lastPt.x, lastPt.y, curPt.x, curPt.y, "CURVE_DECLINAZIONE", dVal.color);
                            }
                            lastPt = curPt;
                        }
                    }
                }

                // Aggiungi un'etichetta testo all'inizio/fine della curva
                if (validPts.length >= 2) {
                    const startPt = validPts[0];
                    const endPt = validPts[validPts.length - 1];
                    dxfContent += writeText(startPt.x, startPt.y + 10, dVal.label, 8, "CURVE_DECLINAZIONE", dVal.color);
                    dxfContent += writeText(endPt.x, endPt.y + 10, dVal.label, 8, "CURVE_DECLINAZIONE", dVal.color, 0, 2);
                }
            });

            // 3.5. Lemniscata del Tempo Medio (Layer: LEMNISCATA - color 2/Giallo)
            let lastLemPt = null;
            const dxfMonthMarkers = {};
            const dxfMonthInitials = lang === 'it' ? 
                ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"] : 
                ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

            for (let d = 1; d <= 365; d++) {
                const decVal = SolarisMath.getSolarDeclination(d);
                const eotVal = SolarisMath.getEquationOfTime(d);
                const hAngleDeg = eotVal / 4;
                const sPos = SolarisMath.getSunPosition(lat, decVal, hAngleDeg);
                
                if (sPos.altitude > 0) {
                    const shadow = SolarisMath.projectNodusShadowOnWall(sPos.altitude, sPos.azimuth, lat, dec, gparams, params.inclination);
                    if (shadow) {
                        const sx = ox + shadow.x * mmToPx;
                        const sy = oy + shadow.y * mmToPx;
                        const dist = Math.sqrt((sx-ox)*(sx-ox) + (sy-oy)*(sy-oy));
                        
                        if (dist < R_ref * 1.3) {
                            const curPt = toDxfCoords(sx, sy);
                            if (lastLemPt !== null) {
                                dxfContent += writeLine(lastLemPt.x, lastLemPt.y, curPt.x, curPt.y, "LEMNISCATA", 2);
                            }
                            lastLemPt = curPt;
                            
                            const monthStarts = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
                            const mIndex = monthStarts.indexOf(d);
                            if (mIndex !== -1) {
                                dxfMonthMarkers[mIndex] = curPt;
                            }
                        }
                    }
                }
            }

            // Aggiungi cerchietti e scritte dei mesi nel DXF
            for (let mIdx in dxfMonthMarkers) {
                const pt = dxfMonthMarkers[mIdx];
                dxfContent += writeCircle(pt.x, pt.y, 4.0, "LEMNISCATA", 7);
                dxfContent += writeText(pt.x, pt.y, dxfMonthInitials[mIdx], 6.0, "LEMNISCATA", 2, 0, 1);
            }

            // 4. Gnomone Ribaltato / Dima (Layer: GNOMONE_DIMA - color 2/Giallo)
            const sdRad = SolarisMath.degToRad(gparams.substyleAngle);
            const aRad = SolarisMath.degToRad(gparams.styleAngle);
            
            const footX = ox + (gparams.substyleLength * mmToPx) * Math.sin(sdRad);
            const footY = oy + (gparams.substyleLength * mmToPx) * Math.cos(sdRad);
            const foldedNodusX = footX + (gparams.orthoLength * mmToPx) * Math.cos(sdRad);
            const foldedNodusY = footY - (gparams.orthoLength * mmToPx) * Math.sin(sdRad);

            const pApex = toDxfCoords(ox, oy);
            const pFoot = toDxfCoords(footX, footY);
            const pFoldedNodus = toDxfCoords(foldedNodusX, foldedNodusY);

            dxfContent += writeLine(pApex.x, pApex.y, pFoot.x, pFoot.y, "GNOMONE_DIMA", 2);
            dxfContent += writeLine(pFoot.x, pFoot.y, pFoldedNodus.x, pFoldedNodus.y, "GNOMONE_DIMA", 2);
            dxfContent += writeLine(pFoldedNodus.x, pFoldedNodus.y, pApex.x, pApex.y, "GNOMONE_DIMA", 2);

            // Apex Circle
            dxfContent += writeCircle(pApex.x, pApex.y, 5.0, "GNOMONE_DIMA", 7);
            dxfContent += writeText(pApex.x + 10, pApex.y + 10, lang === 'it' ? "FISSAGGIO STILO (APEX)" : "STYLE ATTACHMENT (APEX)", 8, "GNOMONE_DIMA", 7);

            // Testi del triangolo dello gnomone
            const midBaseX = (ox + footX) / 2;
            const midBaseY = (oy + footY) / 2;
            const shiftBaseX = -12 * Math.cos(sdRad);
            const shiftBaseY = 12 * Math.sin(sdRad);
            const pMidBase = toDxfCoords(midBaseX + shiftBaseX, midBaseY + shiftBaseY);
            
            let rotBaseDeg = gparams.substyleAngle;
            if (rotBaseDeg > 90) rotBaseDeg -= 180;
            if (rotBaseDeg < -90) rotBaseDeg += 180;
            dxfContent += writeText(pMidBase.x, pMidBase.y, lang === "it" ? `Substilo: ${gparams.substyleLength.toFixed(1)} mm` : `Substyle: ${gparams.substyleLength.toFixed(1)} mm`, 8, "GNOMONE_DIMA", 2, -rotBaseDeg, 1);

            const midOrthoX = (footX + foldedNodusX) / 2;
            const midOrthoY = (footY + foldedNodusY) / 2;
            const shiftOrthoX = 12 * Math.sin(sdRad);
            const shiftOrthoY = 12 * Math.cos(sdRad);
            const pMidOrtho = toDxfCoords(midOrthoX + shiftOrthoX, midOrthoY + shiftOrthoY);
            let rotOrthoDeg = gparams.substyleAngle - 90;
            if (rotOrthoDeg > 90) rotOrthoDeg -= 180;
            if (rotOrthoDeg < -90) rotOrthoDeg += 180;
            dxfContent += writeText(pMidOrtho.x, pMidOrtho.y, lang === "it" ? `Ortostilo (h): ${gparams.orthoLength.toFixed(1)} mm` : `Orthostyle (h): ${gparams.orthoLength.toFixed(1)} mm`, 8, "GNOMONE_DIMA", 2, -rotOrthoDeg, 1);

            const midHypX = (ox + foldedNodusX) / 2;
            const midHypY = (oy + foldedNodusY) / 2;
            const hypAngle = sdRad + aRad;
            const shiftHypX = 12 * Math.cos(hypAngle);
            const shiftHypY = -12 * Math.sin(hypAngle);
            const pMidHyp = toDxfCoords(midHypX + shiftHypX, midHypY + shiftHypY);
            let rotHypDeg = (gparams.substyleAngle + gparams.styleAngle);
            if (rotHypDeg > 90) rotHypDeg -= 180;
            if (rotHypDeg < -90) rotHypDeg += 180;
            dxfContent += writeText(pMidHyp.x, pMidHyp.y, lang === "it" ? `Stilo Polare: ${gparams.polarLength.toFixed(1)} mm` : `Polar Style: ${gparams.polarLength.toFixed(1)} mm`, 8, "GNOMONE_DIMA", 2, -rotHypDeg, 1);

            // Indicazione dell'angolo dello stilo
            const pAngleText = toDxfCoords(ox + 22 * Math.sin(sdRad + aRad/2), oy + 22 * Math.cos(sdRad + aRad/2));
            dxfContent += writeText(pAngleText.x, pAngleText.y, `a = ${gparams.styleAngle.toFixed(1)}°`, 8, "GNOMONE_DIMA", 2);

            // 5. Ombra Attiva (Layer: OMBRA_ATTIVA - color 4/Ciano)
            const civilHours = params.timeMinutes !== undefined ? params.timeMinutes / 60 : (date.getHours() + date.getMinutes() / 60);
            const solarHours = SolarisMath.civilToSolarTime(civilHours, lon, tz, eot, isDst);
            const hourAngleSim = (solarHours - 12) * 15;
            const sunPosSim = SolarisMath.getSunPosition(lat, solarDec, hourAngleSim);

            const currentShadow = SolarisMath.projectNodusShadowOnWall(sunPosSim.altitude, sunPosSim.azimuth, lat, dec, gparams, params.inclination || 0);

            if (currentShadow) {
                const shx = ox + currentShadow.x * mmToPx;
                const shy = oy + currentShadow.y * mmToPx;
                const pShadow = toDxfCoords(shx, shy);

                // Linee d'ombra
                dxfContent += writeLine(pApex.x, pApex.y, pShadow.x, pShadow.y, "OMBRA_ATTIVA", 4);
                dxfContent += writeLine(pFoot.x, pFoot.y, pShadow.x, pShadow.y, "OMBRA_ATTIVA", 4);

                // Nodus shadow circle
                dxfContent += writeCircle(pShadow.x, pShadow.y, 4.0, "OMBRA_ATTIVA", 4);

                const hoursCivil = Math.floor(civilHours);
                const minsCivil = Math.round((civilHours % 1) * 60);
                const timeStr = `${String(hoursCivil).padStart(2, '0')}:${String(minsCivil).padStart(2, '0')}`;
                
                const theta = Math.atan2(currentShadow.x, currentShadow.y) * 180 / Math.PI;
                const absTheta = Math.abs(theta);
                let angleLabel = "";
                if (Math.abs(currentShadow.x) < 0.01) {
                    angleLabel = `0.0° (${lang === 'it' ? 'Sud' : 'South'})`;
                } else if (currentShadow.x > 0) {
                    angleLabel = `${absTheta.toFixed(1)}° ${lang === 'it' ? 'Ovest' : 'West'}`;
                } else {
                    angleLabel = `${absTheta.toFixed(1)}° ${lang === 'it' ? 'Est' : 'East'}`;
                }
                
                dxfContent += writeText(pShadow.x + 10, pShadow.y + 10, `* ${timeStr} (${angleLabel})`, 8, "OMBRA_ATTIVA", 4);
            }

        } else {
            // OROLOGIO A PAVIMENTO (FLOOR)
            const aVal = params.ellipseWidth;
            const slope = params.floorSlope || 0;
            const slopeDir = params.floorSlopeDir || 180;
            const geom = SolarisMath.calcFloorSundialGeometry(lat, aVal, slope, slopeDir);

            const hoursList = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
            const hourAngles = hoursList.map(h => (h - 12) * 15);
            const hourPoints = SolarisMath.calcFloorHourPoints(aVal, geom.b, hourAngles, geom.rotationAngle);
            const calPoints = SolarisMath.getCalendarScalePoints(aVal, lat, slope, slopeDir);
            
            const floorZoom = params.floorZoom !== undefined ? params.floorZoom / 100 : 0.8;
            const cx = 400, cy = 350;
            const scalePxPerM = (300 * floorZoom) / aVal;

            const toDxfCoords = (px, py) => {
                return {
                    x: ((px - cx) / scalePxPerM) * 1000,
                    y: -((py - cy) / scalePxPerM) * 1000
                };
            };

            // 1. Assi Cartesiani (Layer: ASSI - color 9/Grigio)
            const xLeft = toDxfCoords(50, cy);
            const xRight = toDxfCoords(750, cy);
            dxfContent += writeLine(xLeft.x, xLeft.y, xRight.x, xRight.y, "ASSI", 9);

            const yBottom = toDxfCoords(cx, 650);
            const yTop = toDxfCoords(cx, 50);
            dxfContent += writeLine(yBottom.x, yBottom.y, yTop.x, yTop.y, "ASSI", 9);

            // Scritte punti cardinali
            const tNord = toDxfCoords(cx, 30);
            dxfContent += writeText(tNord.x, tNord.y + 10, lang === 'it' ? "N (NORD)" : "N (NORTH)", 12, "ASSI", 7, 0, 1);
            const tSud = toDxfCoords(cx, 670);
            dxfContent += writeText(tSud.x, tSud.y - 15, lang === 'it' ? "S (SUD)" : "S (SOUTH)", 12, "ASSI", 7, 0, 1);
            const tWest = toDxfCoords(25, cy);
            dxfContent += writeText(tWest.x - 10, tWest.y, lang === 'it' ? "W (OVEST)" : "W (WEST)", 12, "ASSI", 7, 0, 2);
            const tEast = toDxfCoords(755, cy);
            dxfContent += writeText(tEast.x + 10, tEast.y, lang === 'it' ? "E (EST)" : "E (EAST)", 12, "ASSI", 7, 0, 0);

            // 2. Ellisse Oraria (Layer: CURVE_DECLINAZIONE - color 5/Blu)
            // Esportata come spline discreta (72 segmenti)
            const ellipsePts = [];
            for (let deg = 0; deg <= 360; deg += 5) {
                const rad = deg * Math.PI / 180;
                const ex = aVal * scalePxPerM * Math.cos(rad);
                const ey = geom.b * scalePxPerM * Math.sin(rad);
                const rx = ex * Math.cos(-geom.rotationAngle) - ey * Math.sin(-geom.rotationAngle);
                const ry = ex * Math.sin(-geom.rotationAngle) + ey * Math.cos(-geom.rotationAngle);
                ellipsePts.push(toDxfCoords(cx + rx, cy + ry));
            }
            for (let i = 0; i < ellipsePts.length - 1; i++) {
                dxfContent += writeLine(ellipsePts[i].x, ellipsePts[i].y, ellipsePts[i+1].x, ellipsePts[i+1].y, "CURVE_DECLINAZIONE", 5);
            }

            // 3. Marcatori Ore (Layer: ORE_LINEE - color 2) e Scritte Ore (Layer: ORE_TESTI - color 7)
            hourPoints.forEach((pt, idx) => {
                const hVal = hoursList[idx];
                const px = cx + pt.x * scalePxPerM;
                const py = cy - pt.y * scalePxPerM;
                const pPt = toDxfCoords(px, py);

                // Circle marker (5mm normal, 8mm noon)
                dxfContent += writeCircle(pPt.x, pPt.y, hVal === 12 ? 8.0 : 5.0, "ORE_LINEE", hVal === 12 ? 1 : 2);

                const angle = Math.atan2(-pt.y, pt.x);
                const tx = px + 16 * Math.cos(angle);
                const ty = py + 16 * Math.sin(angle);
                const pText = toDxfCoords(tx, ty);

                dxfContent += writeText(pText.x, pText.y, hVal.toString(), 10, "ORE_TESTI", hVal === 12 ? 1 : 7, 0, 1);
            });

            // 4. Scala Calendariale (Layer: CALENDARIO - color 30/Arancio)
            const cosRot = Math.cos(geom.rotationAngle);
            const sinRot = Math.sin(geom.rotationAngle);
            
            // Central Spine
            if (calPoints.length >= 2) {
                const spineStart = toDxfCoords(cx + calPoints[0].x * scalePxPerM, cy - calPoints[0].y * scalePxPerM);
                const spineEnd = toDxfCoords(cx + calPoints[calPoints.length - 1].x * scalePxPerM, cy - calPoints[calPoints.length - 1].y * scalePxPerM);
                dxfContent += writeLine(spineStart.x, spineStart.y, spineEnd.x, spineEnd.y, "CALENDARIO", 30);
            }

            calPoints.forEach(pt => {
                const px = cx + pt.x * scalePxPerM;
                const py = cy - pt.y * scalePxPerM;
                
                const tickDx = 5 * cosRot;
                const tickDy = 5 * sinRot;

                const pTick1 = toDxfCoords(px - tickDx, py + tickDy);
                const pTick2 = toDxfCoords(px + tickDx, py - tickDy);

                dxfContent += writeLine(pTick1.x, pTick1.y, pTick2.x, pTick2.y, "CALENDARIO", 30);

                const tx = px + 8 * cosRot;
                const ty = py - 8 * sinRot;
                const pText = toDxfCoords(tx, ty);

                const monthName = lang === 'it' ? pt.nameIt : pt.nameEn;
                dxfContent += writeText(pText.x, pText.y, monthName, 7, "CALENDARIO", 30, -geom.rotationAngle * 180 / Math.PI);
            });

            // 5. Ombra Attiva (Layer: OMBRA_ATTIVA - color 1/Rosso)
            const civilHours = params.timeMinutes !== undefined ? params.timeMinutes / 60 : (date.getHours() + date.getMinutes() / 60);
            const solarHours = SolarisMath.civilToSolarTime(civilHours, lon, tz, eot, isDst);
            const hourAngleSim = (solarHours - 12) * 15;
            const sunPosSim = SolarisMath.getSunPosition(lat, solarDec, hourAngleSim);

            const zOffset = SolarisMath.calcFloorGnomonOffset(aVal, geom.phiVirt, solarDec, geom.rotationAngle);
            const personX = cx + zOffset.x * scalePxPerM;
            const personY = cy - zOffset.y * scalePxPerM;
            const pPerson = toDxfCoords(personX, personY);

            if (sunPosSim.altitude > 0) {
                const hPerson = params.personHeight !== undefined ? params.personHeight : 1.70;
                const shadowTip = SolarisMath.projectVerticalShadowOnSlope(
                    zOffset.x, zOffset.y, hPerson,
                    sunPosSim.altitude, sunPosSim.azimuth,
                    lat, slope, slopeDir
                );

                if (shadowTip) {
                    const shTipX = cx + shadowTip.x * scalePxPerM;
                    const shTipY = cy - shadowTip.y * scalePxPerM;
                    const pShadowTip = toDxfCoords(shTipX, shTipY);

                    // Linea d'ombra
                    dxfContent += writeLine(pPerson.x, pPerson.y, pShadowTip.x, pShadowTip.y, "OMBRA_ATTIVA", 1);
                    dxfContent += writeCircle(pShadowTip.x, pShadowTip.y, 4.0, "OMBRA_ATTIVA", 1);

                    const dx = shadowTip.x - zOffset.x;
                    const dy = shadowTip.y - zOffset.y;
                    const angleRad = Math.atan2(dx, dy);
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
                    const bearingText = `${northSouth} ${val.toFixed(1)}° ${eastWest}`;
                    const hoursCivil = Math.floor(civilHours);
                    const minsCivil = Math.round((civilHours % 1) * 60);
                    const timeStr = `${String(hoursCivil).padStart(2, '0')}:${String(minsCivil).padStart(2, '0')}`;

                    dxfContent += writeText(pShadowTip.x + 10, pShadowTip.y + 10, `* ${timeStr} (${bearingText})`, 8, "OMBRA_ATTIVA", 7);
                }
            }

            // Person foot circle
            dxfContent += writeCircle(pPerson.x, pPerson.y, 5.0, "OMBRA_ATTIVA", 2);
            dxfContent += writeText(pPerson.x - 10, pPerson.y, lang === 'it' ? "TU TI TROVI QUI" : "YOU STAND HERE", 7, "OMBRA_ATTIVA", 2, 0, 2);

            // 6. Direzione Pendenza (Layer: PENDENZA_VETTORE - color 4/Ciano)
            if (slope > 0) {
                const slopeDirRad = slopeDir * Math.PI / 180;
                const L = aVal * scalePxPerM * 0.75;
                const endX = cx + L * Math.sin(slopeDirRad);
                const endY = cy - L * Math.cos(slopeDirRad);
                const pEnd = toDxfCoords(endX, endY);
                const pCenter = toDxfCoords(cx, cy);

                // Linea pendenza
                dxfContent += writeLine(pCenter.x, pCenter.y, pEnd.x, pEnd.y, "PENDENZA_VETTORE", 4);

                // Punta della freccia
                const angle = Math.atan2(endY - cy, endX - cx);
                const arrowSize = 8;
                
                const ax1 = endX - arrowSize * Math.cos(angle - Math.PI / 6);
                const ay1 = endY - arrowSize * Math.sin(angle - Math.PI / 6);
                const ax2 = endX - arrowSize * Math.cos(angle + Math.PI / 6);
                const ay2 = endY - arrowSize * Math.sin(angle + Math.PI / 6);

                const pArrow1 = toDxfCoords(ax1, ay1);
                const pArrow2 = toDxfCoords(ax2, ay2);

                dxfContent += writeLine(pEnd.x, pEnd.y, pArrow1.x, pArrow1.y, "PENDENZA_VETTORE", 4);
                dxfContent += writeLine(pEnd.x, pEnd.y, pArrow2.x, pArrow2.y, "PENDENZA_VETTORE", 4);
                dxfContent += writeLine(pArrow1.x, pArrow1.y, pArrow2.x, pArrow2.y, "PENDENZA_VETTORE", 4);

                const bearing = SolarisRenderer.getSlopeQuadrantBearing(slopeDir, lang);
                const labelText = lang === 'it' ? `Pendenza: ${slope.toFixed(1)}° (${bearing})` : `Slope: ${slope.toFixed(1)}° (${bearing})`;
                
                const tx = endX + 12 * Math.cos(angle);
                const ty = endY + 12 * Math.sin(angle);
                const pLabel = toDxfCoords(tx, ty);

                let align = 0;
                if (Math.cos(angle) < -0.1) align = 2;
                else if (Math.cos(angle) > 0.1) align = 0;
                else align = 1;

                dxfContent += writeText(pLabel.x, pLabel.y, labelText, 8, "PENDENZA_VETTORE", 4, 0, align);
            }
        }

        // DXF Footer
        dxfContent += "  0\nENDSEC\n  0\nEOF\n";

        // Download
        const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `Solaris_${mode}_clock.dxf`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
};


// Funzione helper per estrarre stili CSS per coerenza cromatica
function varColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

window.SolarisRenderer = SolarisRenderer;
