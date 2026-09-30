const validScenes = ["Laboratorios N2"];
if (!canvas.scene || !validScenes.includes(canvas.scene.name)) return ui.notifications.warn("Maquinaria de testeo no disponible");

const dummyActor = game.actors.getName("dummy");
if (!dummyActor) return ui.notifications.error("Requiere un actor nombrado dummy");

const wrlMachines = [
    {id: "plank", col: 2, name: "ESPECTRÓMETRO ERP-7", inputs: [
        {prop: "q_flux", label: "FLUJO Q", type: "range", min: 0, max: 100, val: 50},
        {prop: "harmonics", label: "ARMÓNICOS", type: "select", opts: ["ALFA", "BETA", "GAMMA", "DELTA", "EPSILON"]},
        {prop: "phase_lock", label: "PHASE LOCK", type: "toggle", val: false},
        {prop: "prism_align", label: "PRISMA (nm)", type: "number", val: 450},
        {prop: "lens_focus", label: "FOCO LENTE", type: "range", min: 1, max: 10, val: 5}
    ]},
    {id: "termica", col: 1, name: "CÁMARA INERCIA TÉRMICA", inputs: [
        {prop: "temp_k", label: "GRADIENTE (K)", type: "range", min: 0, max: 1500, val: 273},
        {prop: "vent_purge", label: "PURGA ACTIVA", type: "toggle", val: false},
        {prop: "iso_lvl", label: "NIVEL ISO", type: "range", min: 1, max: 5, val: 3},
        {prop: "cryo_pump", label: "BOMBA CRIO", type: "toggle", val: false}
    ]},
    {id: "antimasa", col: 2, name: "ESPECTRÓMETRO ANTIMASA", inputs: [
        {prop: "mag_field", label: "CAMPO MAG (T)", type: "range", min: 0, max: 200, val: 100},
        {prop: "vac_pump", label: "BOMBA VACÍO", type: "toggle", val: true},
        {prop: "tensor_align", label: "TENSOR-X", type: "range", min: -50, max: 50, val: 0},
        {prop: "tensor_y", label: "TENSOR-Y", type: "range", min: -50, max: 50, val: 0},
        {prop: "inverter", label: "INV. MASA", type: "toggle", val: false},
        {prop: "calib", label: "CALIBRACIÓN", type: "number", val: 1}
    ]},
    {id: "laser", col: 1, name: "INTERFERÓMETRO LÁSER", inputs: [
        {prop: "sweep_hz", label: "BARRIDO (Hz)", type: "range", min: 10, max: 120, val: 60},
        {prop: "beam_focus", label: "MODO FOCO", type: "select", opts: ["ANCHO", "PUNTO", "MALLA"]},
        {prop: "euclid_chk", label: "VERIF. EUCLID", type: "toggle", val: true}
    ]},
    {id: "em", col: 1, name: "CÁMARA RESONANCIA EM", inputs: [
        {prop: "band", label: "BANDA FREC.", type: "select", opts: ["RF", "MIC", "OPT", "X-RAY", "GAMMA"]},
        {prop: "gain", label: "GANANCIA (dB)", type: "range", min: 0, max: 100, val: 75},
        {prop: "pulse", label: "PULSO EM", type: "toggle", val: false},
        {prop: "modulator", label: "MODULADOR", type: "range", min: 0, max: 10, val: 0}
    ]},
    {id: "taquion", col: 2, name: "CRONÓMETRO TAQUIÓNICO", inputs: [
        {prop: "t_offset", label: "T-OFFSET (ms)", type: "range", min: -100, max: 100, val: 0},
        {prop: "causal_sync", label: "SYNC CAUSAL", type: "toggle", val: true},
        {prop: "aperture", label: "APERTURA", type: "range", min: 1, max: 10, val: 5},
        {prop: "loop_buffer", label: "BUFFER BUCLE", type: "select", opts: ["8B", "16B", "64B", "256B"]},
        {prop: "flux_gate", label: "COMPUERTA", type: "toggle", val: true}
    ]},
    {id: "entropia", col: 1, name: "SENSOR ENTRÓPICO", inputs: [
        {prop: "sys_iso", label: "AISLAMIENTO", type: "range", min: 0, max: 100, val: 100},
        {prop: "thermo_cap", label: "CAPACIDAD", type: "select", opts: ["BAJA", "MEDIA", "ALTA"]},
        {prop: "inv_chk", label: "ALERTA INV.", type: "toggle", val: false}
    ]},
    {id: "sombra", col: 1, name: "PROYECTOR INTERCEPCIÓN", inputs: [
        {prop: "lux_lvl", label: "LÚMENES", type: "range", min: 0, max: 1000, val: 500},
        {prop: "angle", label: "ÁNGULO INCID.", type: "number", val: 45},
        {prop: "uv_filt", label: "FILTRO UV", type: "toggle", val: true},
        {prop: "ir_filt", label: "FILTRO IR", type: "toggle", val: false}
    ]},
    {id: "conductividad", col: 2, name: "ANALIZADOR MULTICAPA", inputs: [
        {prop: "voltage", label: "VOLTAJE (V)", type: "range", min: 0, max: 220, val: 12},
        {prop: "ac_dc", label: "MODO CORR.", type: "select", opts: ["AC", "DC", "PULSE"]},
        {prop: "res_inf", label: "TEST INF.", type: "toggle", val: false},
        {prop: "freq", label: "FREC (Hz)", type: "range", min: 50, max: 500, val: 60},
        {prop: "gate", label: "COMPUERTA L", type: "toggle", val: true}
    ]},
    {id: "quimica", col: 1, name: "CÁMARA REACCIÓN", inputs: [
        {prop: "ph_lvl", label: "REACTIVO pH", type: "range", min: 0, max: 14, val: 7},
        {prop: "solv_inj", label: "INYECTAR SOLV.", type: "toggle", val: false},
        {prop: "catalyst", label: "CATALIZADOR", type: "select", opts: ["N/A", "PLATINO", "ENZIM."]},
        {prop: "mix_rpm", label: "MEZCLA RPM", type: "range", min: 0, max: 1000, val: 0}
    ]},
    {id: "estructural", col: 1, name: "PRENSA ESTRUCTURAL", inputs: [
        {prop: "pressure", label: "PRESIÓN (MPa)", type: "range", min: 0, max: 500, val: 0},
        {prop: "ultra_vib", label: "VIB. ULTRA.", type: "toggle", val: false},
        {prop: "shear", label: "CIZALLAMIENTO", type: "range", min: 0, max: 100, val: 0}
    ]}
];

class WRLControlInterface extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "wrl-control-interface",
            title: "WRL - CONSOLA CENTRAL",
            width: 1400,
            height: 850,
            resizable: true,
            classes: ["wrl-window"]
        });
    }

    async _renderInner(data) {
        let cardsHtml = wrlMachines.map(m => {
            const gmControls = game.user.isGM ? 
                `<div class="gm-panel"><label><input type="checkbox" class="wrl-input" data-id="${m.id}" data-prop="anomalo"> OVR: RS.ANÓMALOS</label></div>` : "";
            
            let inputsHtml = m.inputs.map(inp => {
                let control = "";
                if (inp.type === "range") control = `<input type="range" class="wrl-input" data-id="${m.id}" data-prop="${inp.prop}" min="${inp.min}" max="${inp.max}" value="${inp.val}">`;
                if (inp.type === "number") control = `<input type="number" class="wrl-input" data-id="${m.id}" data-prop="${inp.prop}" value="${inp.val}">`;
                if (inp.type === "toggle") control = `<input type="checkbox" class="wrl-input" data-id="${m.id}" data-prop="${inp.prop}" ${inp.val ? "checked" : ""}>`;
                if (inp.type === "select") {
                    let opts = inp.opts.map(o => `<option value="${o}">${o}</option>`).join("");
                    control = `<select class="wrl-input" data-id="${m.id}" data-prop="${inp.prop}">${opts}</select>`;
                }
                return `
                <div class="control-row">
                    <div class="param-led" data-id="${m.id}" data-prop="${inp.prop}"></div>
                    <span>${inp.label}</span>
                    <div class="input-wrap">${control}</div>
                </div>`;
            }).join("");

            return `
            <div class="machine-card" data-id="${m.id}" style="--col: ${m.col}">
                <div class="machine-header">
                    <div class="led-array">
                        <input type="checkbox" class="wrl-input power-btn" data-id="${m.id}" data-prop="power" title="POWER">
                        <div class="led tx"></div>
                        <div class="led rx"></div>
                    </div>
                    <h3>${m.name}</h3>
                    <span class="hex-id">[0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase()}]</span>
                </div>
                <div class="canvas-wrapper">
                    <canvas id="cvs-${m.id}"></canvas>
                    <div class="overlay-grid"></div>
                </div>
                <div class="controls-grid">
                    ${inputsHtml}
                </div>
                ${gmControls}
            </div>`;
        }).join("");

        const style = `
        <style>
            .wrl-window .window-content { background: #050505; color: #0f0; font-family: monospace; padding: 10px; }
            .wrl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; overflow-y: auto; height: 100%; padding-right: 5px; grid-auto-flow: dense; }
            .machine-card { grid-column: span var(--col); background: #0a0a0a; border: 1px solid #333; border-radius: 2px; padding: 8px; box-shadow: inset 0 0 20px #000; display: flex; flex-direction: column; }
            .machine-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1f1f1f; padding-bottom: 4px; margin-bottom: 6px; }
            .machine-header h3 { margin: 0; font-size: 13px; font-weight: bold; color: #9f9; text-shadow: 0 0 5px #0f0; border: none; flex-grow: 1; padding-left: 10px; }
            .hex-id { font-size: 10px; color: #555; }
            .led-array { display: flex; gap: 4px; align-items: center; }
            .power-btn { appearance: none; width: 12px; height: 12px; border-radius: 2px; border: 1px solid #444; background: #222; cursor: pointer; outline: none; }
            .power-btn:checked { background: #0f0; box-shadow: 0 0 8px #0f0; border-color: #0f0; }
            .led { width: 6px; height: 6px; border-radius: 50%; background: #111; }
            .led.tx.active { background: #f90; box-shadow: 0 0 5px #f90; }
            .led.rx.active { background: #09f; box-shadow: 0 0 5px #09f; }
            .machine-card.anomalo-active .machine-header h3 { color: #f33; text-shadow: 0 0 5px #f00; }
            .machine-card.anomalo-active .power-btn:checked { background: #f00; box-shadow: 0 0 10px #f00; border-color: #f00; }
            .canvas-wrapper { width: 100%; height: 120px; background: #000; border: 1px solid #222; position: relative; margin-bottom: 8px; flex-shrink: 0; }
            .canvas-wrapper canvas { width: 100%; height: 100%; display: block; }
            .overlay-grid { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(0deg, transparent 24%, rgba(0, 255, 0, .05) 25%, rgba(0, 255, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .05) 75%, rgba(0, 255, 0, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 0, .05) 25%, rgba(0, 255, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .05) 75%, rgba(0, 255, 0, .05) 76%, transparent 77%, transparent); background-size: 20px 20px; pointer-events: none; }
            .controls-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 6px; }
            .control-row { display: flex; justify-content: flex-start; align-items: center; font-size: 10px; background: #111; padding: 3px; border-left: 1px solid #333; height: 20px; }
            .param-led { width: 4px; height: 12px; background: #222; margin-right: 5px; flex-shrink: 0; }
            .param-led.on { background: #0f0; box-shadow: 0 0 4px #0f0; }
            .machine-card.anomalo-active .param-led.on { background: #f00; box-shadow: 0 0 4px #f00; }
            .control-row span { flex-grow: 1; color: #888; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
            .input-wrap { width: 50%; display: flex; justify-content: flex-end; }
            .wrl-input { width: 100%; background: #000; color: #0f0; border: 1px solid #333; font-family: monospace; font-size: 10px; margin: 0; }
            input[type="range"] { accent-color: #0f0; height: 10px; }
            input[type="checkbox"]:not(.power-btn) { accent-color: #0f0; width: 12px; height: 12px; }
            .machine-card.anomalo-active input[type="range"], .machine-card.anomalo-active input[type="checkbox"]:not(.power-btn) { accent-color: #f00; }
            .gm-panel { margin-top: auto; padding: 4px; background: #200; border: 1px solid #500; color: #f55; font-size: 10px; font-weight: bold; text-align: right; }
        </style>`;

        return $(`${style}<div class="wrl-grid">${cardsHtml}</div>`);
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.wrl-input').on('change', async (e) => {
            const el = e.currentTarget;
            let val;
            if (el.type === "checkbox") val = el.checked;
            else if (el.type === "number" || el.type === "range") val = Number(el.value);
            else val = el.value;
            const key = `flags.wrl.${el.dataset.id}.${el.dataset.prop}`;
            await dummyActor.update({ [key]: val });
        });

        this.pollInterval = setInterval(() => {
            wrlMachines.forEach(m => {
                const card = html.find(`.machine-card[data-id="${m.id}"]`);
                const anom = getProperty(dummyActor, `flags.wrl.${m.id}.anomalo`) || false;
                const pwr = getProperty(dummyActor, `flags.wrl.${m.id}.power`) ?? true;
                
                if (anom) card.addClass("anomalo-active");
                else card.removeClass("anomalo-active");

                const pwrBtn = card.find('.power-btn');
                if (!pwrBtn.is(':focus')) pwrBtn.prop('checked', pwr);

                if (pwr && Math.random() > 0.5) card.find('.tx').toggleClass('active');
                if (pwr && Math.random() > 0.7) card.find('.rx').toggleClass('active');
                if (!pwr) {
                    card.find('.tx, .rx').removeClass('active');
                }

                m.inputs.forEach(inp => {
                    const el = card.find(`.wrl-input[data-prop="${inp.prop}"]`);
                    let val = getProperty(dummyActor, `flags.wrl.${m.id}.${inp.prop}`);
                    if (val === undefined || val === null) val = inp.val;
                    
                    if (!el.is(':focus')) {
                        if (el.attr('type') === 'checkbox') el.prop('checked', val);
                        else el.val(val);
                    }

                    const led = card.find(`.param-led[data-prop="${inp.prop}"]`);
                    let isOn = false;
                    if (pwr) {
                        if (inp.type === "toggle" && val) isOn = true;
                        else if (inp.type === "range" && val > inp.min) isOn = true;
                        else if (inp.type === "number" && val > 0) isOn = true;
                        else if (inp.type === "select" && val !== "N/A") isOn = true;
                    }
                    if (isOn) led.addClass("on");
                    else led.removeClass("on");
                });
                
                const gmToggle = card.find(`[data-prop="anomalo"]`);
                if (gmToggle.length && !gmToggle.is(':focus')) gmToggle.prop('checked', anom);
            });
        }, 500);

        this.renderLoop = () => {
            if (!this.rendered) return;
            const time = Date.now() / 1000;
            
            html.find('canvas').each(function() {
                if (this.width !== this.clientWidth) this.width = this.clientWidth;
                if (this.height !== this.clientHeight) this.height = this.clientHeight;
                
                const ctx = this.getContext('2d');
                const w = this.width;
                const h = this.height;
                const card = $(this).closest('.machine-card');
                const mId = card.data('id');
                const anom = card.hasClass("anomalo-active");
                const pwr = getProperty(dummyActor, `flags.wrl.${mId}.power`) ?? true;

                ctx.clearRect(0, 0, w, h);
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                ctx.fillRect(0, 0, w, h);

                if (!pwr) {
                    ctx.fillStyle = "#0f0";
                    ctx.font = "14px monospace";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("SYSTEM OFFLINE", w/2, h/2);
                    return;
                }

                ctx.strokeStyle = anom ? '#f33' : '#3f3';
                ctx.fillStyle = anom ? '#f33' : '#3f3';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.textAlign = "left";
                ctx.textBaseline = "alphabetic";

                const aMult = anom ? 2.5 : 1;

                switch (mId) {
                    case "plank": {
                        const q = getProperty(dummyActor, 'flags.wrl.plank.q_flux') ?? 50;
                        const hrm = getProperty(dummyActor, 'flags.wrl.plank.harmonics') ?? "ALFA";
                        const pl = getProperty(dummyActor, 'flags.wrl.plank.phase_lock') ?? false;
                        const lens = getProperty(dummyActor, 'flags.wrl.plank.lens_focus') ?? 5;
                        const prism = getProperty(dummyActor, 'flags.wrl.plank.prism_align') ?? 450;
                        
                        const grad = ctx.createLinearGradient(0, 0, w, 0);
                        grad.addColorStop(0, anom ? "black" : "red");
                        grad.addColorStop(0.15, "orange");
                        grad.addColorStop(0.3, "yellow");
                        grad.addColorStop(0.5, "green");
                        grad.addColorStop(0.65, "cyan");
                        grad.addColorStop(0.8, "blue");
                        grad.addColorStop(1, anom ? "white" : "violet");
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, h/2, w, h/2);

                        const hCount = hrm === "ALFA" ? 2 : (hrm === "BETA" ? 4 : (hrm === "GAMMA" ? 6 : 8));
                        const drift = pl ? 0 : time * 2;
                        
                        ctx.strokeStyle = "#fff";
                        ctx.moveTo(0, h/2);
                        for (let x = 0; x < w; x++) {
                            let y = h/2;
                            for (let i = 1; i <= hCount; i++) {
                                const peakX = (w / (hCount + 1)) * i + Math.sin(drift + i) * (prism/50);
                                const dist = Math.abs(x - peakX);
                                if (dist < lens * 5) y -= (lens * 5 - dist) * (q / 50) * aMult * (anom ? Math.random()+0.5 : 1);
                            }
                            ctx.lineTo(x, Math.max(0, y));
                        }
                        ctx.stroke();
                        break;
                    }
                    case "termica": {
                        const temp = getProperty(dummyActor, 'flags.wrl.termica.temp_k') ?? 273;
                        const p = getProperty(dummyActor, 'flags.wrl.termica.vent_purge') ?? false;
                        const iso = getProperty(dummyActor, 'flags.wrl.termica.iso_lvl') ?? 3;
                        const cryo = getProperty(dummyActor, 'flags.wrl.termica.cryo_pump') ?? false;

                        const baseT = cryo ? temp * 0.1 : temp;
                        const tGrad = ctx.createLinearGradient(0, h, 0, 0);
                        tGrad.addColorStop(0, "black");
                        tGrad.addColorStop(0.3, "red");
                        tGrad.addColorStop(0.6, "orange");
                        tGrad.addColorStop(0.8, "yellow");
                        tGrad.addColorStop(1, "white");

                        const barCount = 24;
                        const bw = w / barCount;
                        for (let i = 0; i < barCount; i++) {
                            let val = p ? 10 : (baseT / 1500) * h;
                            val += Math.sin(i + time * (6 - iso)) * 10 * aMult;
                            if (anom && Math.random() > 0.9) val = h * Math.random();
                            ctx.fillStyle = tGrad;
                            ctx.fillRect(i * bw + 1, h - val, bw - 2, val);
                        }
                        break;
                    }
                    case "antimasa": {
                        const mag = getProperty(dummyActor, 'flags.wrl.antimasa.mag_field') ?? 100;
                        const tx = getProperty(dummyActor, 'flags.wrl.antimasa.tensor_align') ?? 0;
                        const ty = getProperty(dummyActor, 'flags.wrl.antimasa.tensor_y') ?? 0;
                        const inv = getProperty(dummyActor, 'flags.wrl.antimasa.inverter') ?? false;
                        const cal = getProperty(dummyActor, 'flags.wrl.antimasa.calib') ?? 1;
                        
                        ctx.moveTo(0, h/2);
                        for (let x = 0; x < w; x++) {
                            let y = h / 2;
                            const tX_adj = x + tx * 2;
                            const peak = Math.exp(-Math.pow(tX_adj - w/3, 2) / (mag+1)) * 60 * cal;
                            const antiPeak = Math.exp(-Math.pow(tX_adj - w*0.66, 2) / (mag+1)) * 60 * cal;
                            
                            if (inv) { y += peak; y -= antiPeak; }
                            else { y -= peak; y += antiPeak; }
                            
                            y += ty;
                            y += (Math.random() - 0.5) * (inv ? 5 : 2) * aMult;
                            if (anom && x % 15 === 0) y += Math.sin(x)*h/2;
                            ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                        break;
                    }
                    case "laser": {
                        const sHz = getProperty(dummyActor, 'flags.wrl.laser.sweep_hz') ?? 60;
                        const foc = getProperty(dummyActor, 'flags.wrl.laser.beam_focus') ?? "ANCHO";
                        const euc = getProperty(dummyActor, 'flags.wrl.laser.euclid_chk') ?? true;
                        
                        const lines = foc === "MALLA" ? 20 : (foc === "PUNTO" ? 2 : 8);
                        const offset = (time * sHz / 5) % (h/lines);
                        for(let i = 0; i < lines; i++) {
                            ctx.beginPath();
                            let startY = i * (h/lines) + offset;
                            ctx.moveTo(0, startY);
                            for(let x = 0; x < w; x+=15) {
                                let cy = startY;
                                if(x > w/3 && x < w*0.66) cy -= Math.sin((x-w/3)*Math.PI/(w/3)) * 25 * aMult;
                                if(!euc || anom) cy += Math.tan(x * time * 0.1) * 10 * aMult;
                                ctx.lineTo(x, cy);
                            }
                            ctx.stroke();
                        }
                        break;
                    }
                    case "em": {
                        const band = getProperty(dummyActor, 'flags.wrl.em.band') ?? "RF";
                        const gain = getProperty(dummyActor, 'flags.wrl.em.gain') ?? 75;
                        const pls = getProperty(dummyActor, 'flags.wrl.em.pulse') ?? false;
                        const mod = getProperty(dummyActor, 'flags.wrl.em.modulator') ?? 0;
                        
                        let bM = band === "GAMMA" ? 0.3 : (band === "X-RAY" ? 0.2 : (band === "OPT" ? 0.1 : (band === "MIC" ? 0.05 : 0.02)));
                        let amp = (gain / 100) * (h/2);
                        if (pls && Math.floor(time * 5) % 2 === 0) amp *= 0.1;
                        
                        ctx.moveTo(0, h/2);
                        for(let x = 0; x < w; x++) {
                            let y = h/2 + Math.sin(x * bM + time * 15) * amp;
                            y += Math.cos(x * mod * 0.1) * (mod * 2);
                            if (anom) y += Math.sin(x * bM * 4) * amp * 0.8;
                            ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                        break;
                    }
                    case "taquion": {
                        const tOff = getProperty(dummyActor, 'flags.wrl.taquion.t_offset') ?? 0;
                        const cSync = getProperty(dummyActor, 'flags.wrl.taquion.causal_sync') ?? true;
                        const ap = getProperty(dummyActor, 'flags.wrl.taquion.aperture') ?? 5;
                        const gate = getProperty(dummyActor, 'flags.wrl.taquion.flux_gate') ?? true;
                        
                        if (!gate) { ctx.fillText("GATE CLOSED", 10, h/2); break; }
                        for (let i = 0; i < 40; i++) {
                            let px = (time * (tOff < 0 ? -100 : 100) + i * 15) % w;
                            if (px < 0) px += w;
                            let py = h/2 + Math.sin(i + time) * ap * 4;
                            if (!cSync) py += Math.cos(px) * 20;
                            if (anom) py = Math.random() * h;
                            
                            ctx.fillStyle = anom ? "#f33" : "#3f3";
                            ctx.fillRect(px, py, 4, 4);
                            ctx.fillStyle = ctx.strokeStyle;
                            ctx.globalAlpha = 0.4;
                            ctx.fillRect(px + (tOff < 0 ? 4 : -4), py, Math.abs(tOff)/2 + 5, 2);
                            ctx.globalAlpha = 1.0;
                        }
                        break;
                    }
                    case "entropia": {
                        const iso = getProperty(dummyActor, 'flags.wrl.entropia.sys_iso') ?? 100;
                        const cap = getProperty(dummyActor, 'flags.wrl.entropia.thermo_cap') ?? "BAJA";
                        const inv = getProperty(dummyActor, 'flags.wrl.entropia.inv_chk') ?? false;
                        
                        const pCount = cap === "ALTA" ? 150 : (cap === "MEDIA" ? 80 : 30);
                        const radius = (100 - iso) / 100 * (w/2) * aMult;
                        
                        for (let i = 0; i < pCount; i++) {
                            let r = inv ? (w/2) - (time*20 + i)%radius : (time*20 + i)%radius;
                            if (anom) r += Math.random() * 20;
                            const th = (i * Math.PI * 2) / pCount + (inv ? -time : time);
                            ctx.fillRect(w/2 + Math.cos(th)*r, h/2 + Math.sin(th)*r, 2, 2);
                        }
                        break;
                    }
                    case "sombra": {
                        const lux = getProperty(dummyActor, 'flags.wrl.sombra.lux_lvl') ?? 500;
                        const ang = getProperty(dummyActor, 'flags.wrl.sombra.angle') ?? 45;
                        const uv = getProperty(dummyActor, 'flags.wrl.sombra.uv_filt') ?? true;
                        const ir = getProperty(dummyActor, 'flags.wrl.sombra.ir_filt') ?? false;
                        
                        let bgR = anom ? 80 : 0; let bgG = uv ? 80 : 0; let bgB = ir ? 80 : 0;
                        ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
                        ctx.fillRect(0, 0, w, h);
                        
                        ctx.fillStyle = '#000';
                        const aRad = ang * Math.PI / 180;
                        const shX = Math.cos(aRad) * (lux/5) * aMult;
                        const shY = Math.sin(aRad) * (lux/5) * aMult;
                        
                        ctx.beginPath();
                        ctx.moveTo(w/2 - 15, h/2);
                        ctx.lineTo(w/2 + 15, h/2);
                        ctx.lineTo(w/2 + 15 - shX, h/2 + shY);
                        ctx.lineTo(w/2 - 15 - shX, h/2 + shY);
                        ctx.fill();
                        
                        ctx.fillStyle = anom ? '#f33' : '#3f3';
                        ctx.fillRect(w/2 - 15, h/2 - 30, 30, 30);
                        break;
                    }
                    case "conductividad": {
                        const volt = getProperty(dummyActor, 'flags.wrl.conductividad.voltage') ?? 12;
                        const ad = getProperty(dummyActor, 'flags.wrl.conductividad.ac_dc') ?? "AC";
                        const rInf = getProperty(dummyActor, 'flags.wrl.conductividad.res_inf') ?? false;
                        const frq = getProperty(dummyActor, 'flags.wrl.conductividad.freq') ?? 60;
                        const gate = getProperty(dummyActor, 'flags.wrl.conductividad.gate') ?? true;
                        
                        if (rInf) {
                            ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
                        } else {
                            ctx.beginPath();
                            for (let t = 0; t < Math.PI * 2; t += 0.05) {
                                let x = w/2 + Math.sin(t * (ad === "AC" ? frq/10 : 1) + time) * (volt/220) * (w/2);
                                let y = h/2 + Math.cos(t * (ad === "PULSE" ? frq/5 : 2) - time) * (volt/220) * (h/2);
                                if (!gate) y = h/2;
                                if (anom) { x += Math.random()*20*aMult; y += Math.random()*20*aMult; }
                                if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                            }
                            ctx.stroke();
                        }
                        break;
                    }
                    case "quimica": {
                        const ph = getProperty(dummyActor, 'flags.wrl.quimica.ph_lvl') ?? 7;
                        const inj = getProperty(dummyActor, 'flags.wrl.quimica.solv_inj') ?? false;
                        const cat = getProperty(dummyActor, 'flags.wrl.quimica.catalyst') ?? "N/A";
                        const rpm = getProperty(dummyActor, 'flags.wrl.quimica.mix_rpm') ?? 0;
                        
                        const spd = (cat === "ENZIM." ? 5 : (cat === "PLATINO" ? 2 : 0.5)) + (rpm/100);
                        const lvlY = Math.max(10, Math.min(h-10, h - (ph/14)*h));
                        
                        ctx.fillStyle = `hsla(${ph * 25}, 100%, 50%, 0.5)`;
                        ctx.fillRect(0, lvlY, w, h);
                        
                        ctx.moveTo(0, lvlY);
                        for(let x = 0; x < w; x++) {
                            let y = lvlY;
                            if (rpm > 0) y += Math.sin(x*0.05 + time*spd) * (rpm/50) * aMult;
                            if (anom && x%20===0) y -= Math.random()*30;
                            ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                        
                        if (inj) {
                            for(let i=0; i<15; i++) {
                                ctx.beginPath();
                                ctx.arc(Math.random()*w, lvlY + Math.random()*(h-lvlY), Math.random()*6, 0, Math.PI*2);
                                ctx.stroke();
                            }
                        }
                        break;
                    }
                    case "estructural": {
                        const prs = getProperty(dummyActor, 'flags.wrl.estructural.pressure') ?? 0;
                        const vib = getProperty(dummyActor, 'flags.wrl.estructural.ultra_vib') ?? false;
                        const shr = getProperty(dummyActor, 'flags.wrl.estructural.shear') ?? 0;
                        
                        const curX = (prs / 500) * w;
                        ctx.moveTo(0, h);
                        for(let x = 0; x <= curX; x++) {
                            let y = h - (Math.pow(x/w, 2) * h);
                            if (vib) y += Math.sin(x * 2 + time * 20) * 5 * aMult;
                            if (x > w/2) y += (shr/100) * (x-w/2) * aMult;
                            if (anom && x > w*0.7) y += Math.random() * 40 - 20;
                            ctx.lineTo(x, Math.max(0, y));
                        }
                        ctx.stroke();
                        ctx.fillStyle = ctx.strokeStyle;
                        ctx.beginPath(); 
                        ctx.arc(curX, Math.max(0, h - (Math.pow(curX/w, 2) * h)), 4, 0, Math.PI*2); 
                        ctx.fill();
                        break;
                    }
                }

                ctx.fillStyle = anom ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.05)';
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = ctx.strokeStyle;
                ctx.fillText(`SEQ: ${Math.floor(time * 100 % 99999)}`, 4, 12);
                if (anom) ctx.fillText("WARN: LIMIT OVR", 4, h - 6);
            });
            this.animFrame = requestAnimationFrame(this.renderLoop);
        };
        
        setTimeout(() => this.renderLoop(), 100);
    }

    close(options) {
        clearInterval(this.pollInterval);
        cancelAnimationFrame(this.animFrame);
        super.close(options);
    }
}

new WRLControlInterface().render(true);