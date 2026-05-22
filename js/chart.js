/**
 * Solaris - Disegno Grafici (Equazione del Tempo)
 */

const SolarisChart = {
    /**
     * Inizializza e disegna il grafico dell'Equazione del Tempo
     * canvasId: ID del canvas HTML
     * currentDay: giorno dell'anno corrente (1-365)
     * lang: lingua corrente ("it" o "en")
     */
    drawEoT: (canvasId, currentDay, lang = "it") => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Gestione DPI per nitidezza
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // Punti per i mesi (approssimativi per posizionamento asse X)
        const monthNames = {
            it: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
            en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        };
        const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

        // Margini del grafico
        const padding = { top: 15, right: 15, bottom: 25, left: 30 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;

        // Pulisci
        ctx.clearRect(0, 0, width, height);

        // Disegna sfondo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);

        // Mappatura coordinate
        const getX = (day) => padding.left + ((day - 1) / 364) * graphWidth;
        // EoT varia da circa -15 a +17. Usiamo range [-20, 20] per sicurezza
        const getY = (eotVal) => padding.top + graphHeight / 2 - (eotVal / 20) * (graphHeight / 2);

        // 1. Disegna le linee di griglia Y (-15, -10, -5, 0, 5, 10, 15)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = '10px "Space Grotesk", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';

        const yTicks = [-15, -10, -5, 0, 5, 10, 15];
        yTicks.forEach(tick => {
            const y = getY(tick);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Scritta a lato
            if (tick !== 0) {
                ctx.fillText(`${tick > 0 ? '+' : ''}${tick}`, padding.left - 6, y);
            }
        });

        // 2. Disegna l'asse zero centrale (più marcato)
        const yZero = getY(0);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padding.left, yZero);
        ctx.lineTo(width - padding.right, yZero);
        ctx.stroke();
        ctx.fillText('0', padding.left - 6, yZero);

        // 3. Disegna le griglie verticali (Mesi)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

        monthDays.forEach((day, index) => {
            const x = getX(day + 1);
            
            // Griglia mensile
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, height - padding.bottom);
            ctx.stroke();

            // Etichetta del mese posizionata a metà del mese
            const nextDay = index < 11 ? monthDays[index + 1] : 365;
            const midX = getX((day + nextDay) / 2 + 1);
            ctx.fillText(monthNames[lang][index], midX, height - padding.bottom + 6);
        });

        // 4. Calcola e disegna la curva EoT
        ctx.beginPath();
        for (let day = 1; day <= 365; day++) {
            const eot = SolarisMath.getEquationOfTime(day);
            const x = getX(day);
            const y = getY(eot);

            if (day === 1) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        // Stile della curva
        const goldGradient = ctx.createLinearGradient(padding.left, 0, width - padding.right, 0);
        goldGradient.addColorStop(0, '#f59e0b');
        goldGradient.addColorStop(0.5, '#ca8a04');
        goldGradient.addColorStop(1, '#f59e0b');

        ctx.strokeStyle = goldGradient;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.3)';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // 5. Disegna il marker del giorno selezionato
        const currentEoT = SolarisMath.getEquationOfTime(currentDay);
        const markerX = getX(currentDay);
        const markerY = getY(currentEoT);

        // Linea verticale tratteggiata
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(markerX, padding.top);
        ctx.lineTo(markerX, height - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]); // reset tratteggio

        // Punto di highlight
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
    }
};

window.SolarisChart = SolarisChart;
