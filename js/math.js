/**
 * Solaris - Matematica Astronomica e Calcoli Gnomonici
 */

const SolarisMath = {
    // Conversioni angoli
    degToRad: (deg) => (deg * Math.PI) / 180,
    radToDeg: (rad) => (rad * 180) / Math.PI,

    /**
     * Calcola il giorno dell'anno (1-365) a partire da un oggetto Date
     */
    getDayOfYear: (date) => {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    },

    /**
     * Calcola la declinazione solare (delta) in gradi per il giorno dell'anno N
     */
    getSolarDeclination: (dayOfYear) => {
        // Formula di Cooper (1969) - molto accurata ed elegante
        const angle = (360 / 365) * (284 + dayOfYear);
        return 23.45 * Math.sin(SolarisMath.degToRad(angle));
    },

    /**
     * Calcola l'Equazione del Tempo (EoT) in minuti per il giorno dell'anno N
     */
    getEquationOfTime: (dayOfYear) => {
        const B = (360 / 365) * (dayOfYear - 81);
        const B_rad = SolarisMath.degToRad(B);
        // Formula classica a tre termini (accuratezza ~30 secondi)
        return 9.87 * Math.sin(2 * B_rad) - 7.53 * Math.cos(B_rad) - 1.5 * Math.sin(B_rad);
    },

    /**
     * Calcola il mezzogiorno standard (ora civile) per una data longitudine e fuso orario
     */
    getStandardNoon: (longitude, timezone, eot, isDst) => {
        const longCorr = 4 * (longitude - 15 * timezone); // correzione longitudine in minuti
        const dstCorr = isDst ? 60 : 0;
        // Mezzogiorno solare vero = 12:00 in tempo solare.
        // Tempo Civile = 12:00 - EoT(min) - longCorr(min) + DST(min)
        const decimalHours = 12 - (eot + longCorr) / 60 + dstCorr / 60;
        return decimalHours;
    },

    /**
     * Converte l'ora civile decimale in ora solare decimale
     */
    civilToSolarTime: (civilHours, longitude, timezone, eot, isDst) => {
        const longCorr = 4 * (longitude - 15 * timezone); // minuti
        const dstCorr = isDst ? 1 : 0;
        // Tempo solare = Tempo Civile + EoT + longCorr - DST
        return civilHours + eot / 60 + longCorr / 60 - dstCorr;
    },

    /**
     * Converte l'ora solare decimale in ora civile decimale
     */
    solarToCivilTime: (solarHours, longitude, timezone, eot, isDst) => {
        const longCorr = 4 * (longitude - 15 * timezone); // minuti
        const dstCorr = isDst ? 1 : 0;
        return solarHours - eot / 60 - longCorr / 60 + dstCorr;
    },

    /**
     * Calcola le coordinate solari 3D (Altitudine e Azimut)
     * latitude, longitude, solarDeclination, hourAngle in gradi
     */
    getSunPosition: (latitude, solarDeclination, hourAngle) => {
        const lat = SolarisMath.degToRad(latitude);
        const dec = SolarisMath.degToRad(solarDeclination);
        const H = SolarisMath.degToRad(hourAngle);

        // Altezza solare (h): sin(h) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(H)
        const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
        const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
        const altDeg = SolarisMath.radToDeg(altRad);

        // Azimut solare (Az): calcolato usando atan2 per la corretta gestione dei quadranti
        // Azimut misurato da Nord (0°) verso Est (90°)
        const y = -Math.sin(H) * Math.cos(dec);
        const x = Math.cos(lat) * Math.sin(dec) - Math.sin(lat) * Math.cos(dec) * Math.cos(H);
        
        let azRad = Math.atan2(y, x);
        let azDeg = SolarisMath.radToDeg(azRad);
        
        // Normalizza a [0, 360)
        if (azDeg < 0) azDeg += 360;

        return { altitude: altDeg, azimuth: azDeg };
    },

    /**
     * Calcola i parametri geometrici di una meridiana verticale declinante
     * latitude: latitudine locale (°N)
     * declination: declinazione del muro (0° = Sud, -90° = Est, +90° = Ovest)
     * gnomonLength: lunghezza dello stilo polare in mm
     */
    calcWallGnomonParameters: (latitude, declination, gnomonLength, inclination = 0) => {
        const phi = SolarisMath.degToRad(latitude);
        const d = SolarisMath.degToRad(declination);
        const i = SolarisMath.degToRad(inclination);

        // 1. Vettori unitari nel sistema globale (Est, Nord, Alto)
        const g_polar = [0, Math.cos(phi), Math.sin(phi)];

        const n_wall = [
            -Math.sin(d) * Math.cos(i),
            -Math.cos(d) * Math.cos(i),
            Math.sin(i)
        ];

        const u_wall = [
            Math.cos(d),
            -Math.sin(d),
            0
        ];

        const v_wall = [
            -Math.sin(d) * Math.sin(i),
            -Math.cos(d) * Math.sin(i),
            -Math.cos(i)
        ];

        // 2. Altezza dello stilo a (styleAngle)
        const dot_g_n = g_polar[0]*n_wall[0] + g_polar[1]*n_wall[1] + g_polar[2]*n_wall[2];
        const sin_a = Math.abs(dot_g_n);
        const a_rad = Math.asin(Math.max(-1, Math.min(1, sin_a)));
        const styleAngleDeg = SolarisMath.radToDeg(a_rad);

        // 3. Angolo del substilo SD (substyleAngle) rispetto alla verticale v_wall
        // Definiamo il vettore dello stilo fisico g_style in modo che sporga sempre dalla parete (prodotto scalare positivo o nullo)
        const g_style = dot_g_n >= 0 ? g_polar : [-g_polar[0], -g_polar[1], -g_polar[2]];
        
        const u_proj = g_style[0]*u_wall[0] + g_style[1]*u_wall[1] + g_style[2]*u_wall[2];
        const v_proj = g_style[0]*v_wall[0] + g_style[1]*v_wall[1] + g_style[2]*v_wall[2];
        
        let substyleAngleDeg = 0;
        if (Math.abs(u_proj) > 0.0001 || Math.abs(v_proj) > 0.0001) {
            substyleAngleDeg = SolarisMath.radToDeg(Math.atan2(u_proj, v_proj));
        }

        // 4. Differenza di longitudine solare del substilo H0
        const n_eq_1 = n_wall[0];
        const n_eq_2 = -n_wall[1] * Math.sin(phi) + n_wall[2] * Math.cos(phi);
        
        let h0Deg = 0;
        if (Math.abs(n_eq_1) > 0.0001 || Math.abs(n_eq_2) > 0.0001) {
            h0Deg = SolarisMath.radToDeg(Math.atan2(n_eq_1, n_eq_2));
        }

        // Dimensioni fisiche dello gnomone
        const orthoLength = gnomonLength * Math.sin(a_rad);
        const substyleLength = gnomonLength * Math.cos(a_rad);

        return {
            styleAngle: styleAngleDeg,
            substyleAngle: substyleAngleDeg,
            h0: h0Deg,
            orthoLength: orthoLength,
            substyleLength: substyleLength,
            polarLength: gnomonLength
        };
    },

    /**
     * Calcola gli angoli delle linee orarie per una meridiana verticale declinante ed inclinante
     * styleAngle: altezza dello stilo (gradi)
     * h0: differenza longitudine substilo (gradi)
     * substyleAngle: angolo substilo (gradi)
     * hourAngles: array di angoli orari solari (gradi, 15° per ora, 12:00 = 0)
     */
    calcWallHourLines: (styleAngle, h0, substyleAngle, hourAngles) => {
        const a = SolarisMath.degToRad(styleAngle);
        const h0_rad = SolarisMath.degToRad(h0);
        const SD = SolarisMath.degToRad(substyleAngle);

        return hourAngles.map(H_deg => {
            const H = SolarisMath.degToRad(H_deg);
            
            // Formula dell'angolo rispetto alla linea del substilo (h_D)
            const h_D_rad = Math.atan(Math.sin(a) * Math.tan(H - h0_rad));
            const h_D = SolarisMath.radToDeg(h_D_rad);

            // L'angolo assoluto rispetto alla verticale è theta = h_D + SD
            let theta = h_D + SolarisMath.radToDeg(SD);

            return {
                hourAngle: H_deg,
                angleFromSubstyle: h_D,
                angleFromVertical: theta
            };
        });
    },

    /**
     * Proietta l'ombra del nodulo dello stilo sulla parete declinante ed inclinante
     * sunAltitude, sunAzimuth: coordinate solari in gradi
     * latitude: latitudine (°N)
     * declination: declinazione parete (gradi, 0 = Sud, -90=Est, +90=Ovest)
     * gparams: parametri gnomonici calcolati da calcWallGnomonParameters
     * inclination: inclinazione della parete rispetto alla verticale (gradi)
     */
    projectNodusShadowOnWall: (sunAltitude, sunAzimuth, latitude, declination, gparams, inclination = 0) => {
        if (sunAltitude <= 0) return null; // Sole sotto l'orizzonte

        const el = SolarisMath.degToRad(sunAltitude);
        const az = SolarisMath.degToRad(sunAzimuth);

        // Vettore unitario del sole in coordinate orizzontali (Est, Nord, Alto)
        const sE = Math.cos(el) * Math.sin(az);
        const sN = Math.cos(el) * Math.cos(az);
        const sUp = Math.sin(el);

        const d = SolarisMath.degToRad(declination);
        const i = SolarisMath.degToRad(inclination);

        // Vettori unitari del muro (Est, Nord, Alto)
        const n_wall = [
            -Math.sin(d) * Math.cos(i),
            -Math.cos(d) * Math.cos(i),
            Math.sin(i)
        ];

        const u_wall = [
            Math.cos(d),
            -Math.sin(d),
            0
        ];

        const v_wall = [
            -Math.sin(d) * Math.sin(i),
            -Math.cos(d) * Math.sin(i),
            -Math.cos(i)
        ];

        // Proiezione del sole sulla normale del muro
        const s_z = sE * n_wall[0] + sN * n_wall[1] + sUp * n_wall[2];
        if (s_z <= 0.001) return null; // Sole dietro la parete (parete in ombra)

        // Componenti del sole negli assi del muro (U e V)
        const s_x = sE * u_wall[0] + sN * u_wall[1] + sUp * u_wall[2];
        const s_y = sE * v_wall[0] + sN * v_wall[1] + sUp * v_wall[2];

        // Coordinate 3D del nodulo negli assi del muro
        const SD = SolarisMath.degToRad(gparams.substyleAngle);
        
        const x_N = gparams.substyleLength * Math.sin(SD);
        const y_N = gparams.substyleLength * Math.cos(SD);
        const z_N = gparams.orthoLength;

        // Proiezione sul piano z = 0 (parete)
        const shadowX = x_N - z_N * (s_x / s_z);
        const shadowY = y_N - z_N * (s_y / s_z);

        return { x: shadowX, y: shadowY };
    },

    /**
     * Calcola le coordinate dell'orologio analemmatico a pavimento su una piazza in pendenza
     * latitude: latitudine (°N)
     * semiMajorAxis: semiasse maggiore 'a' dell'ellisse in metri
     * slope: pendenza in gradi
     * slopeDir: direzione della pendenza in gradi (0 = Nord, 90 = Est, 180 = Sud, 270 = Ovest)
     */
    calcFloorSundialGeometry: (latitude, semiMajorAxis, slope = 0, slopeDir = 180) => {
        const phi = SolarisMath.degToRad(latitude);
        const a = semiMajorAxis;
        const s = SolarisMath.degToRad(slope);
        const d_slope = SolarisMath.degToRad(slopeDir);

        const g_polar = [0, Math.cos(phi), Math.sin(phi)];

        const n_floor = [
            -Math.sin(d_slope) * Math.sin(s),
            -Math.cos(d_slope) * Math.sin(s),
            Math.cos(s)
        ];

        const sin_phi_virt = g_polar[0]*n_floor[0] + g_polar[1]*n_floor[1] + g_polar[2]*n_floor[2];
        const phi_virt_rad = Math.asin(Math.max(-1, Math.min(1, sin_phi_virt)));
        const phi_virt = SolarisMath.radToDeg(phi_virt_rad);

        const b_virt = a * Math.sin(Math.abs(phi_virt_rad));
        const eccentricity = Math.cos(phi_virt_rad);

        // Proiezione del Nord globale sul pavimento
        const N_glob = [0, 1, 0];
        const dot_N_n = N_glob[0]*n_floor[0] + N_glob[1]*n_floor[1] + N_glob[2]*n_floor[2];
        const p_N = [
            N_glob[0] - dot_N_n * n_floor[0],
            N_glob[1] - dot_N_n * n_floor[1],
            N_glob[2] - dot_N_n * n_floor[2]
        ];
        const len_pN = Math.sqrt(p_N[0]*p_N[0] + p_N[1]*p_N[1] + p_N[2]*p_N[2]);
        const u_Y = [p_N[0]/len_pN, p_N[1]/len_pN, p_N[2]/len_pN];

        // Asse X della piazza (Est proiettato)
        const u_X = [
            u_Y[1]*n_floor[2] - u_Y[2]*n_floor[1],
            u_Y[2]*n_floor[0] - u_Y[0]*n_floor[2],
            u_Y[0]*n_floor[1] - u_Y[1]*n_floor[0]
        ];

        // Proiezione dell'asse polare sul pavimento
        const dot_g_n = g_polar[0]*n_floor[0] + g_polar[1]*n_floor[1] + g_polar[2]*n_floor[2];
        const p_g = [
            g_polar[0] - dot_g_n * n_floor[0],
            g_polar[1] - dot_g_n * n_floor[1],
            g_polar[2] - dot_g_n * n_floor[2]
        ];
        const len_pg = Math.sqrt(p_g[0]*p_g[0] + p_g[1]*p_g[1] + p_g[2]*p_g[2]);
        const u_g = [p_g[0]/len_pg, p_g[1]/len_pg, p_g[2]/len_pg];

        const g_rot_X = u_g[0]*u_X[0] + u_g[1]*u_X[1] + u_g[2]*u_X[2];
        const g_rot_Y = u_g[0]*u_Y[0] + u_g[1]*u_Y[1] + u_g[2]*u_Y[2];

        const gamma = Math.atan2(g_rot_X, g_rot_Y);

        return {
            a: a,
            b: b_virt,
            eccentricity: eccentricity,
            phiVirt: phi_virt,
            rotationAngle: gamma
        };
    },

    /**
     * Calcola i punti orari dell'ellisse analemmatica ruotata
     * a: semiasse maggiore
     * b: semiasse minore
     * hourAngles: array di angoli orari solari (gradi, 12:00 = 0)
     * rotationAngle: angolo di rotazione in radianti
     */
    calcFloorHourPoints: (a, b, hourAngles, rotationAngle = 0) => {
        return hourAngles.map(H_deg => {
            const H = SolarisMath.degToRad(H_deg);
            
            const x_v = a * Math.sin(H);
            const y_v = b * Math.cos(H);

            const x = x_v * Math.cos(rotationAngle) - y_v * Math.sin(rotationAngle);
            const y = x_v * Math.sin(rotationAngle) + y_v * Math.cos(rotationAngle);

            const dist = Math.sqrt(x*x + y*y);

            return {
                hourAngle: H_deg,
                x: x,
                y: y,
                distance: dist
            };
        });
    },

    /**
     * Calcola la posizione dello gnomone mobile (Z) sulla scala centrale
     * a: semiasse maggiore dell'ellisse
     * phiVirt: latitudine virtuale
     * solarDeclination: declinazione solare per quel giorno (gradi)
     * rotationAngle: angolo di rotazione in radianti
     */
    calcFloorGnomonOffset: (a, phiVirt, solarDeclination, rotationAngle = 0) => {
        const phi_v = SolarisMath.degToRad(phiVirt);
        const delta = SolarisMath.degToRad(solarDeclination);

        const z_v = a * Math.cos(phi_v) * Math.tan(delta);

        const x = -z_v * Math.sin(rotationAngle);
        const y = z_v * Math.cos(rotationAngle);

        return { x: x, y: y, z_virt: z_v };
    },

    /**
     * Proietta l'ombra di un elemento verticale (gnomone o persona) su un pavimento inclinato
     */
    projectVerticalShadowOnSlope: (x_feet, y_feet, height, sunAltitude, sunAzimuth, lat, slope, slopeDir) => {
        if (sunAltitude <= 0) return null;

        const el = SolarisMath.degToRad(sunAltitude);
        const az = SolarisMath.degToRad(sunAzimuth);

        const sE = Math.cos(el) * Math.sin(az);
        const sN = Math.cos(el) * Math.cos(az);
        const sUp = Math.sin(el);
        const S = [sE, sN, sUp];

        const s = SolarisMath.degToRad(slope);
        const d_slope = SolarisMath.degToRad(slopeDir);

        const n_floor = [
            -Math.sin(d_slope) * Math.sin(s),
            -Math.cos(d_slope) * Math.sin(s),
            Math.cos(s)
        ];

        const N_glob = [0, 1, 0];
        const dot_N_n = N_glob[0]*n_floor[0] + N_glob[1]*n_floor[1] + N_glob[2]*n_floor[2];
        const p_N = [
            N_glob[0] - dot_N_n * n_floor[0],
            N_glob[1] - dot_N_n * n_floor[1],
            N_glob[2] - dot_N_n * n_floor[2]
        ];
        const len_pN = Math.sqrt(p_N[0]*p_N[0] + p_N[1]*p_N[1] + p_N[2]*p_N[2]);
        const u_Y = [p_N[0]/len_pN, p_N[1]/len_pN, p_N[2]/len_pN];

        const u_X = [
            u_Y[1]*n_floor[2] - u_Y[2]*n_floor[1],
            u_Y[2]*n_floor[0] - u_Y[0]*n_floor[2],
            u_Y[0]*n_floor[1] - u_Y[1]*n_floor[0]
        ];

        const s_dot_n = S[0]*n_floor[0] + S[1]*n_floor[1] + S[2]*n_floor[2];
        if (s_dot_n <= 0.001) return null; // sole sotto il piano del pavimento

        const t = (height * Math.cos(s)) / s_dot_n;

        const P_feet = [
            x_feet * u_X[0] + y_feet * u_Y[0],
            x_feet * u_X[1] + y_feet * u_Y[1],
            x_feet * u_X[2] + y_feet * u_Y[2]
        ];

        const P_head = [
            P_feet[0],
            P_feet[1],
            P_feet[2] + height
        ];

        const P_shadow = [
            P_head[0] - t * S[0],
            P_head[1] - t * S[1],
            P_head[2] - t * S[2]
        ];

        const shadowX = P_shadow[0]*u_X[0] + P_shadow[1]*u_X[1] + P_shadow[2]*u_X[2];
        const shadowY = P_shadow[0]*u_Y[0] + P_shadow[1]*u_Y[1] + P_shadow[2]*u_Y[2];

        return { x: shadowX, y: shadowY };
    },

    /**
     * Mesi e date per la scala calendariale dell'orologio a pavimento
     */
    getCalendarScalePoints: (a, latitude, slope = 0, slopeDir = 180) => {
        const months = [
            { nameIt: "Gen", nameEn: "Jan", day: 1, monthIdx: 0 },
            { nameIt: "Feb", nameEn: "Feb", day: 1, monthIdx: 1 },
            { nameIt: "Mar", nameEn: "Mar", day: 1, monthIdx: 2 },
            { nameIt: "Apr", nameEn: "Apr", day: 1, monthIdx: 3 },
            { nameIt: "Mag", nameEn: "May", day: 1, monthIdx: 4 },
            { nameIt: "Giu", nameEn: "Jun", day: 1, monthIdx: 5 },
            { nameIt: "Lug", nameEn: "Jul", day: 1, monthIdx: 6 },
            { nameIt: "Ago", nameEn: "Aug", day: 1, monthIdx: 7 },
            { nameIt: "Set", nameEn: "Sep", day: 1, monthIdx: 8 },
            { nameIt: "Ott", nameEn: "Oct", day: 1, monthIdx: 9 },
            { nameIt: "Nov", nameEn: "Nov", day: 1, monthIdx: 10 },
            { nameIt: "Dic", nameEn: "Dec", day: 1, monthIdx: 11 }
        ];

        const currentYear = new Date().getFullYear();
        const geom = SolarisMath.calcFloorSundialGeometry(latitude, a, slope, slopeDir);

        return months.map(m => {
            const date = new Date(currentYear, m.monthIdx, 1);
            const dayOfYear = SolarisMath.getDayOfYear(date);
            const dec = SolarisMath.getSolarDeclination(dayOfYear);
            const offset = SolarisMath.calcFloorGnomonOffset(a, geom.phiVirt, dec, geom.rotationAngle);

            return {
                nameIt: m.nameIt,
                nameEn: m.nameEn,
                dayOfYear: dayOfYear,
                declination: dec,
                x: offset.x,
                y: offset.y,
                z: offset.z_virt
            };
        });
    }
};

// Esporta l'oggetto per l'uso globale nel browser
window.SolarisMath = SolarisMath;
