const dummyActor = game.actors.getName("dummy");
if (!dummyActor) return ui.notifications.error("Actor 'dummy' no encontrado.");

const fontMain = "Trebuchet";
const fontTitles = "Trebuchet";

const getSeededRandom = (seedStr) => {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
    return function() {
        h = Math.imul(1597334677, h) + 1 | 0;
        return ((h >>> 0) / 4294967296);
    }
};

const getBarcode = (name) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = Math.imul(31, h) + name.charCodeAt(i) | 0;
    const s = Math.abs(h).toString().padStart(10, '0').repeat(3);
    let b = '';
    for (let i = 0; i < 24; i++) {
        const w = (parseInt(s[i]) % 3) + 1;
        const m = (parseInt(s[i+1] || '0') % 2);
        b += `<div style="background:#000;height:100%;width:${w}px;margin-right:${m}px;"></div>`;
    }
    return `<div style="display:flex;height:25px;opacity:0.85;">${b}</div>`;
};

const roleConfig = [
    { color: "#56cdfe", keywords: ["seguridad", "guardia"], level: "4 - Seguridad" },
    { color: "#ff9c9a", keywords: ["medicina", "médico", "medico", "enfermeria", "enfermería"], level: "3 - Científico" },
    { color: "#757575", keywords: ["mantenimiento", "sistemas"], level: "1 - Mantenimiento y sistemas" },
    { color: "#54ad9e", keywords: ["logistica", "logística"], level: "2 - Logística" },
    { color: "#ffffff", keywords: ["administracion", "administración"], level: "5 - Administración" },
    { color: "#45e045", keywords: ["hecu", "h.e.c.u."], level: "5 - H.E.C.U." }
];
const defaultColor = "#f9aa65";

Promise.all([
    fetch('/whiterock/Jugadores/lista.txt').then(r => r.ok ? r.text() : "").catch(() => ""),
    fetch('/whiterock/Jugadores/rasgos.txt').then(r => r.ok ? r.text() : "").catch(() => ""),
    fetch('/whiterock/NPC/lista.txt').then(r => r.ok ? r.text() : "").catch(() => "")
]).then(([pcText, rasgosText, npcText]) => {
    
    const rasgosTextClean = rasgosText ? rasgosText.split(/\r?\n/) : [];
    const roster = [];

    const parseList = (text, isNPC) => {
        const lines = text.split(/\r?\n/).map(l => l.trim());
        let current = null;
        for (const line of lines) {
            if (!line) {
                if (current) roster.push(current);
                current = null;
            } else {
                if (!current) {
                    current = { name: line, role: "Desconocido", traits: [], color: defaultColor, isNPC: isNPC, level: "3 - Científico" };
                } else if (line.startsWith('*')) {
                    current.role = line.substring(1).trim();
                    const roleLow = current.role.toLowerCase();
                    for (const cfg of roleConfig) {
                        if (cfg.keywords.some(kw => roleLow.includes(kw))) {
                            current.color = cfg.color;
                            current.level = cfg.level;
                            break;
                        }
                    }
                } else if (line.startsWith('-')) {
                    current.traits.push(line.substring(1).trim());
                }
            }
        }
        if (current) roster.push(current);
    };

    parseList(pcText, false);
    parseList(npcText, true);

    const userMatch = roster.find(c => c.name === game.user.name || (game.user.character && c.name === game.user.character.name));
    const isGuard = userMatch && (userMatch.role.toLowerCase().includes("guardia") || userMatch.role.toLowerCase().includes("seguridad"));
    if (!game.user.isGM && !isGuard) {
        return ui.notifications.error("Acceso denegado.");
    }

    class TerminalApp extends Application {
        static get defaultOptions() {
            return mergeObject(super.defaultOptions, {
                id: "terminal-wrl",
                title: "Terminal de seguridad",
                width: 1250,
                height: 850,
                resizable: true
            });
        }

        constructor() {
            super();
            this.searchedName = "";
            this.selected = null;
            this.interval = null;
            this.irisState = 0;
            this.anomState = 0;
            this.irisJustFinished = false;
            this.anomJustFinished = false;
        }

        getDataFor(person) {
            const rng = getSeededRandom(person.name);
            const now = new Date();
            const year = now.getFullYear() - 20;
            
            const rDays = Math.floor(rng() * 30) + 1;
            const pDays = Math.floor(rng() * 60) + 1;
            
            const dRadio = new Date(now.getTime());
            dRadio.setFullYear(year);
            dRadio.setDate(dRadio.getDate() - rDays);
            
            const dPsico = new Date(now.getTime());
            dPsico.setFullYear(year);
            dPsico.setDate(dPsico.getDate() - pDays);

            const discPoints = Math.floor(rng() * 20);
            const tfGen = 0;
            const tpGen = 0;
            
            let gridGen = "";
            const roleLow = person.role.toLowerCase();
            const isAdminOrHecu = roleLow.includes("administra") || roleLow.includes("h.e.c.u.");
            const hasPortals = person.traits.some(t => t.toLowerCase().includes("departamento de portales"));
            
            if (isAdminOrHecu || hasPortals) {
                gridGen = "1111111111";
            } else {
                for (let i = 0; i < 10; i++) gridGen += (rng() > 0.5 ? "1" : "0");
            }

            const res = (rng() * 100).toFixed(2);
            const fluc = (rng() * 5).toFixed(2);

            return {
                dRadio: dRadio.toLocaleDateString(),
                dPsico: dPsico.toLocaleDateString(),
                points: discPoints,
                tf: tfGen,
                tp: tpGen,
                grid: gridGen,
                resonancia: res,
                fluctuacion: fluc
            };
        }

        async _renderInner(data) {
            const activeUsers = game.users.filter(u => u.active).map(u => {
                let match = roster.find(r => r.name === u.name || (u.character && r.name === u.character.name));
                return match ? match.name : null;
            }).filter(n => n);
            const uniqueActive = [...new Set(activeUsers)];
            
            const activeUsersHtml = uniqueActive.map(n => 
                `<span class="active-user-badge" data-name="${n}" style="background: #1e1e1e; color: #56cdfe; padding: 4px 8px; border: 1px solid #56cdfe; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold; transition: background 0.2s;">${n}</span>`
            ).join('');

            let leftCol = `
                <div style="margin-bottom: 15px;">
                    <input type="text" id="wr-search" value="${this.searchedName}" placeholder="Buscar nombre exacto..." style="width: 100%; padding: 10px; border: 1px solid #56cdfe; border-bottom: 4px solid #56cdfe; background: transparent; color: white; font-weight: bold; font-size: 1.1em; outline: none;">
                    <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                        ${activeUsersHtml}
                    </div>
                </div>
            `;
            
            let centerCol = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#888;">Esperando datos de sujeto...</div>`;
            
            if (this.selected) {
                const pData = this.getDataFor(this.selected);
                const attrBase = this.selected.name.replace(/\s+/g, '').toLowerCase();

                const tfValue = this.selected.isNPC ? pData.tf : (getProperty(dummyActor, `system.${attrBase}-tf`) || "");
                const tpValue = this.selected.isNPC ? pData.tp : (getProperty(dummyActor, `system.${attrBase}-tp`) || "");
                const pointsValue = this.selected.isNPC ? pData.points : (getProperty(dummyActor, `system.${attrBase}-points`) || 0);
                const gridValue = this.selected.isNPC ? pData.grid : (getProperty(dummyActor, `system.${attrBase}-grid`) || "0000000000");

                const gmOverRadio = getProperty(dummyActor, `system.${attrBase}-ov-radio`) || false;
                const gmOverPsico = getProperty(dummyActor, `system.${attrBase}-ov-psico`) || false;
                const gmOverIris = getProperty(dummyActor, `system.${attrBase}-ov-iris`) || false;
                const gmOverAnom = getProperty(dummyActor, `system.${attrBase}-ov-anom`) || false;

                const finalRadio = !gmOverRadio;
                const finalPsico = !gmOverPsico;
                const finalIris = !gmOverIris;
                const finalAnom = !gmOverAnom;

                let fluctuacion = pData.fluctuacion;
                if (!finalAnom) {
                    fluctuacion = (parseFloat(fluctuacion) + 64.72).toFixed(2);
                }

                const traitsHtml = this.selected.traits.map(t => {
                    const cleanT = t.replace(/\*/g, '').trim().toLowerCase();
                    let desc = "";
                    for (const line of rasgosTextClean) {
                        const cleanOriginal = line.replace(/\*/g, '').trim();
                        if (cleanOriginal.toLowerCase().startsWith(cleanT)) {
                            desc = cleanOriginal.substring(cleanT.length).replace(/^[:\s-]+/, '').trim();
                            break;
                        }
                    }
                    return `<li style="margin-bottom: 2px;" title="${desc.replace(/"/g, '&quot;')}">${t}</li>`;
                }).join("");

                let pointsHtml = '<div style="display: grid; grid-template-columns: repeat(20, 1fr); justify-items: center; align-items: center; margin-top: 2px; width: 100%;">';
                for (let i = 1; i <= 20; i++) {
                    const bg = i <= pointsValue ? '#000' : '#ddd';
                    pointsHtml += `<div data-val="${i}" style="width: 12px; height: 12px; border-radius: 50%; border: 1px solid #333; background: ${bg};"></div>`;
                }
                pointsHtml += '</div>';

                const letters = ['A','B','C','D','E','F','G','H','I','J'];
                let gridHtml = '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-top: 2px; width: 100%;">';
                for (let i = 0; i < 10; i++) {
                    const bg = gridValue[i] === '1' ? '#000' : '#ddd';
                    const col = gridValue[i] === '1' ? '#fff' : '#000';
                    gridHtml += `<div data-idx="${i}" style="display: flex; align-items: center; justify-content: center; height: 24px; border: 1px solid #333; background: ${bg}; color: ${col}; font-weight: bold; font-size: 0.85em;">${letters[i]}</div>`;
                }
                gridHtml += '</div>';

                const primaryImg = this.selected.isNPC ? `/whiterock/NPC/${this.selected.name.toLowerCase().replace(/\s+/g, '_')}.avif` : `/whiterock/Jugadores/img/${this.selected.name.toLowerCase().replace(/\s+/g, '_')}.avif`;
                const secondaryImg = this.selected.isNPC ? `/whiterock/NPC/${this.selected.role.toLowerCase().replace(/\s+/g, '_')}.avif` : `/whiterock/Jugadores/img/${this.selected.role.toLowerCase().replace(/\s+/g, '_')}.avif`;
                const fallbackImg = `/whiterock/NPC/cientifico.avif`;

                leftCol += `
                    <div style="position: relative; background: #f4f4f4; color: #111; border-radius: 16px; overflow: hidden; border: 1px solid #d3d3d3; box-shadow: 0 4px 8px rgba(0,0,0,0.2); font-family: ${fontMain}; pointer-events: none;">
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('/whiterock/Jugadores/img/idoverlay.avif') center/cover; opacity: 0.15; z-index: 1;"></div>
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 75px; background-color: ${this.selected.color}; z-index: 0;"></div>
                        <div style="position: absolute; top: 20px; right: 20px; z-index: 3;">${getBarcode(this.selected.name)}</div>
                        
                        <div style="display: flex; padding: 20px 20px 10px 20px; gap: 15px; position: relative; z-index: 2;">
                            <div style="flex: 0 0 120px; display: flex; flex-direction: column; align-items: center;">
                                <img src="${primaryImg}" onerror="if(!this.dataset.retry){this.dataset.retry=1;this.src='${secondaryImg}';}else{this.onerror=null;this.src='${fallbackImg}';}" style="width: 120px; height: 160px; object-fit: cover; border: 2px solid #333; background: #fff;">
                                <div style="margin-top: 12px; font-weight: 900; font-size: 0.75em; text-align: center; letter-spacing: 1px; color: #000; font-family: ${fontTitles};">
                                    WHITE ROCK<br>LABS
                                </div>
                            </div>
                            <div style="flex: 1;">
                                <h1 style="margin: 0 0 2px 0; border: none; font-size: 1.8em; text-transform: uppercase; color: #000; font-family: ${fontTitles};">${this.selected.name}</h1>
                                <h3 style="margin: 0 0 10px 0; color: #555; font-style: italic; font-size: 1em; border-bottom: 1px solid #ccc; padding-bottom: 5px; font-family: ${fontMain};">${this.selected.role}</h3>
                                
                                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                                    <div style="flex: 1;">
                                        <h4 style="margin: 0 0 2px 0; font-size: 0.9em; text-transform: uppercase; color: #000; font-family: ${fontTitles};">Rasgos Registrados</h4>
                                        <ul style="margin: 0; padding-left: 20px; font-size: 0.85em; min-height: 40px; color: #000;">
                                            ${traitsHtml}
                                        </ul>
                                    </div>
                                    <div style="flex: 0 0 110px; display: flex; flex-direction: column; gap: 8px; border-left: 1px solid #ccc; padding-left: 10px;">
                                        <div>
                                            <label style="font-size: 0.7em; font-weight: bold; text-transform: uppercase; color: #000; display: block; font-family: ${fontTitles};">Trauma Físico</label>
                                            <div style="width: 100%; height: 26px; line-height: 22px; text-align: center; background: #ddd; color: #000; border: 1px solid #999; font-size: 1.1em; font-weight: bold; font-family: ${fontMain};">${tfValue}</div>
                                        </div>
                                        <div>
                                            <label style="font-size: 0.7em; font-weight: bold; text-transform: uppercase; color: #000; display: block; font-family: ${fontTitles};">Trauma Psico.</label>
                                            <div style="width: 100%; height: 26px; line-height: 22px; text-align: center; background: #ddd; color: #000; border: 1px solid #999; font-size: 1.1em; font-weight: bold; font-family: ${fontMain};">${tpValue}</div>
                                        </div>
                                    </div>
                                </div>
                                <div style="width: 100%; margin-bottom: 0;">
                                    <label style="font-size: 0.75em; font-weight: bold; text-transform: uppercase; color: #000; display: block; margin-bottom: 2px; font-family: ${fontTitles};">Permisos</label>
                                    ${gridHtml}
                                </div>
                            </div>
                        </div>
                        <div style="padding: 0 20px 20px 20px; width: 100%; position: relative; z-index: 2; box-sizing: border-box;">
                            <label style="font-size: 0.75em; font-weight: bold; text-transform: uppercase; color: #000; display: block; margin-bottom: 2px; font-family: ${fontTitles};">Puntos</label>
                            ${pointsHtml}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button id="btn-aprobar" class="btn-glass-green" style="flex:1;">APROBAR</button>
                        <button id="btn-rechazar" class="btn-glass-red" style="flex:1;">RECHAZAR</button>
                    </div>
                `;

                const gmCheckboxHTML = (type, state) => game.user.isGM ? `<label style="color: #fff; cursor: pointer; pointer-events: auto; white-space: nowrap;"><input type="checkbox" class="gm-ov" data-type="${type}" ${state ? "checked" : ""}> (Inv)</label>` : "";

                const anomAnim1 = this.anomJustFinished ? "animation: fadeIn 0.5s both;" : "opacity: 1;";
                const anomAnim2 = this.anomJustFinished ? "animation: fadeIn 0.5s 0.5s both;" : "opacity: 1;";
                const anomAnim3 = this.anomJustFinished ? "animation: fadeIn 0.5s 1s both;" : "opacity: 1;";
                const irisAnim = this.irisJustFinished ? "animation: fadeIn 0.5s;" : "opacity: 1;";

                centerCol = `
                    <div style="background: #1e1e1e; color: #56cdfe; padding: 15px; font-family: monospace; border: 1px solid #56cdfe; height: 100%; overflow-y: auto;">
                        <h3 style="color: #56cdfe; border-bottom: 1px solid #56cdfe; padding-bottom: 5px;">DATOS BIOMÉTRICOS Y SEGURIDAD</h3>
                        <p><strong>Nivel de Acceso:</strong> <span style="color:${this.selected.color}">${this.selected.level}</span></p>
                        
                        <p style="display: flex; align-items: center; gap: 10px;"><strong>Rev. Radiotóxica:</strong>&nbsp;${finalRadio ? "HÁBIL" : "<span style='color:red; font-weight:bold;'>NO HÁBIL</span>"} ${gmCheckboxHTML('radio', gmOverRadio)}</p>
                        <p><strong>Fecha Rev. Radiotóxica:</strong> ${pData.dRadio}</p>
                        
                        <p style="display: flex; align-items: center; gap: 10px;"><strong>Rev. Psicológica:</strong>&nbsp;${finalPsico ? "HÁBIL" : "<span style='color:red; font-weight:bold;'>NO HÁBIL</span>"} ${gmCheckboxHTML('psico', gmOverPsico)}</p>
                        <p><strong>Fecha Rev. Psicológica:</strong> ${pData.dPsico}</p>
                        
                        <div style="margin-top: 25px;">
                            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
                                <button id="btn-iris" class="btn-scan" style="flex: 1;">Escaneo de Iris</button>
                                ${gmCheckboxHTML('iris', gmOverIris)}
                            </div>
                            <div id="res-iris" style="display: ${this.irisState > 0 ? 'block' : 'none'}; margin-top: 5px; position: relative;">
                                <div style="position: relative; width: 100%; overflow: hidden; border: 1px solid #56cdfe;">
                                    <img src="/whiterock/NPC/eyes.avif" onerror="this.style.display='none'" style="width: 100%; display: block; filter: ${this.irisState === 1 ? 'sepia(1) hue-rotate(180deg) saturate(3)' : 'none'};">
                                    ${this.irisState === 1 ? '<div class="scan-laser"></div>' : ''}
                                </div>
                                ${this.irisState === 2 ? `<p style="display: flex; align-items: center; margin-top: 5px; ${irisAnim}">Resultado: ${finalIris ? "CORRECTA" : "<span style='color:red; font-weight:bold;'>INCORRECTA</span>"}</p>` : `<p style="color:#56cdfe; animation: pulse 1s infinite;">Analizando córnea y retina...</p>`}
                            </div>
                        </div>

                        <div style="margin-top: 25px;">
                            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
                                <button id="btn-anom" class="btn-scan" style="flex: 1;">Lectura Anomalométrica</button>
                                ${gmCheckboxHTML('anom', gmOverAnom)}
                            </div>
                            <div id="res-anom" style="display: ${this.anomState > 0 ? 'block' : 'none'}; margin-top: 5px;">
                                <div style="width: 100%; height: 30px; background: repeating-linear-gradient(45deg, #000, #000 10px, #56cdfe 10px, #56cdfe 20px); animation: anomMove ${this.anomState === 1 ? '0.2s' : '1s'} linear infinite; border: 1px solid #56cdfe; box-shadow: inset 0 0 10px #000;"></div>
                                ${this.anomState === 2 ? `
                                <table style="width: 100%; border: 1px solid #56cdfe; margin-top: 5px; color: #56cdfe; font-size: 0.9em;">
                                    <tr style="${anomAnim1}"><td>Resonancia</td><td>${pData.resonancia} Hz</td></tr>
                                    <tr style="${anomAnim2}"><td>Fluctuación</td><td style="${!finalAnom ? 'color:red; font-weight:bold;' : ''}">${fluctuacion} %</td></tr>
                                    <tr style="${anomAnim3}"><td style="display: flex; align-items: center;">Resultado</td><td style="display: flex; align-items: center;">${finalAnom ? "CORRECTO" : "<span style='color:red; font-weight:bold;'>INCORRECTO</span>"}</td></tr>
                                </table>
                                ` : `<p style="color:#56cdfe; animation: pulse 1s infinite;">Cuantificando fluctuación dimensional...</p>`}
                            </div>
                        </div>
                    </div>
                `;
            }

            const txtValue = getProperty(dummyActor, `system.wrl-shared-notes`) || "";
            const rightCol = `
                <div style="display: flex; flex-direction: column; height: 100%;">
                    <h3 style="margin-top: 0; color: #56cdfe; border-bottom: 1px solid #56cdfe; padding-bottom: 5px;">Protocolo del día</h3>
                    <textarea id="wr-notes" style="flex: 1; resize: none; background: rgba(0,0,0,0.5); border: 1px solid #56cdfe; padding: 10px; color: white !important; font-family: var(--font-body) !important;" ${game.user.isGM ? "" : "disabled"}>${txtValue}</textarea>
                </div>
            `;

            const html = `
                <style>
                    .active-user-badge:hover { background: #56cdfe !important; color: #000 !important; }
                    .btn-glass-green {
                        position: relative;
                        background: radial-gradient(circle at 50% 20%, #66ff66 0%, #28a745 40%, #004d00 100%);
                        border: none;
                        border-radius: 12px;
                        box-shadow: inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.5), 0 5px 15px rgba(0,0,0,0.5);
                        color: white; height: 60px; font-size: 1.2em; font-weight: 900; text-shadow: 1px 1px 3px rgba(0,0,0,0.9);
                        cursor: pointer; text-transform: uppercase; overflow: hidden;
                        transition: all 0.2s;
                    }
                    .btn-glass-green::before {
                        content: ''; position: absolute; top: 2px; left: 2%; width: 96%; height: 40%;
                        background: linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,0.1));
                        border-radius: 10px 10px 50px 50px / 10px 10px 15px 15px;
                        pointer-events: none;
                    }
                    .btn-glass-green:hover {
                        background: radial-gradient(circle at 50% 20%, #99ff99 0%, #4cd964 40%, #007300 100%);
                        box-shadow: 0 0 25px #4cd964, inset 0 3px 6px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.4);
                    }
                    .btn-glass-green:active {
                        box-shadow: inset 0 2px 4px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(255,255,255,0.2), 0 2px 5px rgba(0,0,0,0.5);
                        transform: translateY(3px);
                    }
                    .btn-glass-red {
                        position: relative;
                        background: radial-gradient(circle at 50% 20%, #ff6666 0%, #dc3545 40%, #660000 100%);
                        border: none;
                        border-radius: 12px;
                        box-shadow: inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.5), 0 5px 15px rgba(0,0,0,0.5);
                        color: white; height: 60px; font-size: 1.2em; font-weight: 900; text-shadow: 1px 1px 3px rgba(0,0,0,0.9);
                        cursor: pointer; text-transform: uppercase; overflow: hidden;
                        transition: all 0.2s;
                    }
                    .btn-glass-red::before {
                        content: ''; position: absolute; top: 2px; left: 2%; width: 96%; height: 40%;
                        background: linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,0.1));
                        border-radius: 10px 10px 50px 50px / 10px 10px 15px 15px;
                        pointer-events: none;
                    }
                    .btn-glass-red:hover {
                        background: radial-gradient(circle at 50% 20%, #ff9999 0%, #ff4d4d 40%, #990000 100%);
                        box-shadow: 0 0 25px #ff4d4d, inset 0 3px 6px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.4);
                    }
                    .btn-glass-red:active {
                        box-shadow: inset 0 2px 4px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(255,255,255,0.2), 0 2px 5px rgba(0,0,0,0.5);
                        transform: translateY(3px);
                    }
                    .btn-scan {
                        background: linear-gradient(45deg, #1e1e1e, #333);
                        border: 1px solid #56cdfe;
                        color: #56cdfe;
                        padding: 10px; font-weight: bold; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 5px rgba(86,205,254,0.3);
                        transition: all 0.2s;
                    }
                    .btn-scan:hover {
                        background: #56cdfe; color: #000; box-shadow: 0 0 15px rgba(86,205,254,0.8);
                    }
                    .scan-laser {
                        position: absolute; width: 100%; height: 4px; background: #56cdfe; box-shadow: 0 0 10px #56cdfe, 0 0 20px #56cdfe;
                        animation: scanLaserAnim 2s infinite alternate ease-in-out;
                    }
                    @keyframes scanLaserAnim { 0% { top: 0; } 100% { top: 100%; } }
                    @keyframes anomMove { 0% { background-position: 0 0; } 100% { background-position: 28px 0; } }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                </style>
                <div style="display: grid; grid-template-columns: 480px 1fr 1fr; gap: 20px; height: 100%; padding: 10px;">
                    <div style="display: flex; flex-direction: column;">${leftCol}</div>
                    <div style="display: flex; flex-direction: column;">${centerCol}</div>
                    <div style="display: flex; flex-direction: column;">${rightCol}</div>
                </div>
            `;
            return $(html);
        }

        activateListeners(html) {
            super.activateListeners(html);

            html.find('#wr-search').on('input', () => {
                game.macros.getName("Buttons")?.execute();
            });

            const searchInput = html.find('#wr-search');
            searchInput.on('change', () => {
                const val = searchInput.val().trim().toLowerCase();
                this.searchedName = searchInput.val();
                this.selected = roster.find(c => c.name.toLowerCase() === val) || null;
                this.irisState = 0;
                this.anomState = 0;
                this.irisJustFinished = false;
                this.anomJustFinished = false;
                this.render();
            });

            html.find('.active-user-badge').click((ev) => {
                game.macros.getName("Buttons")?.execute();
                const name = $(ev.currentTarget).data('name');
                this.searchedName = name;
                this.selected = roster.find(c => c.name === name) || null;
                this.irisState = 0;
                this.anomState = 0;
                this.irisJustFinished = false;
                this.anomJustFinished = false;
                this.render();
            });

            html.find('#wr-notes').on('change', async (ev) => {
                if (game.user.isGM) {
                    await dummyActor.update({ [`system.wrl-shared-notes`]: $(ev.currentTarget).val() });
                }
            });

            if (this.selected) {
                html.find('#btn-iris').click(() => { 
                    game.macros.getName("Buttons")?.execute();
                    if (this.irisState === 0) {
                        this.irisState = 1; 
                        this.render();
                        setTimeout(() => { 
                            this.irisState = 2; 
                            this.irisJustFinished = true;
                            this.render(); 
                            setTimeout(() => { this.irisJustFinished = false; }, 1000);
                        }, 5000);
                    }
                });
                
                html.find('#btn-anom').click(() => { 
                    game.macros.getName("Buttons")?.execute();
                    if (this.anomState === 0) {
                        this.anomState = 1; 
                        this.render();
                        setTimeout(() => { 
                            this.anomState = 2; 
                            this.anomJustFinished = true;
                            this.render(); 
                            setTimeout(() => { this.anomJustFinished = false; }, 2000);
                        }, 5000);
                    }
                });

                html.find('#btn-aprobar').click(() => {
                    game.macros.getName("Aprobar")?.execute();
                    this.irisState = 0;
                    this.anomState = 0;
                    this.irisJustFinished = false;
                    this.anomJustFinished = false;
                    this.render();
                });

                html.find('#btn-rechazar').click(() => {
                    game.macros.getName("Rechazar")?.execute();
                    this.irisState = 0;
                    this.anomState = 0;
                    this.irisJustFinished = false;
                    this.anomJustFinished = false;
                    this.render();
                });

                if (game.user.isGM) {
                    html.find('.gm-ov').change(async (ev) => {
                        const type = $(ev.currentTarget).data('type');
                        const isChecked = $(ev.currentTarget).is(':checked');
                        const attrBase = this.selected.name.replace(/\s+/g, '').toLowerCase();
                        await dummyActor.update({ [`system.${attrBase}-ov-${type}`]: isChecked });
                        this.render();
                    });
                }
            }

            if (this.interval) clearInterval(this.interval);
            this.interval = setInterval(() => {
                const currentNotes = getProperty(dummyActor, `system.wrl-shared-notes`) || "";
                const textarea = html.find('#wr-notes')[0];
                if (textarea && document.activeElement !== textarea && textarea.value !== currentNotes) {
                    textarea.value = currentNotes;
                }
            }, 1000);
        }

        async close(options) {
            if (this.interval) clearInterval(this.interval);
            return super.close(options);
        }
    }

    new TerminalApp().render(true);
});