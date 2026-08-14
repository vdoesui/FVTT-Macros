const roleConfig = [
    { color: "#56cdfe", keywords: ["seguridad", "guardia"] },
    { color: "#ff9c9a", keywords: ["medicina", "médico", "medico", "enfermeria", "enfermería"] }
];
const defaultColor = "#f9aa65";
const fontMain = "Trebuchet";
const fontTitles = "Trebuchet";

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

const dummyActor = game.actors.getName("dummy");
if (!dummyActor) return ui.notifications.error("Actor 'dummy' no encontrado.");

Promise.all([
    fetch('/whiterock/Jugadores/lista.txt').then(r => r.text()),
    fetch('/whiterock/Jugadores/rasgos.txt').then(r => r.text()).catch(() => "")
])
.then(([text, rasgosText]) => {
    const rasgosTextClean = rasgosText ? rasgosText.split(/\r?\n/) : [];

    const lines = text.split(/\r?\n/).map(l => l.trim());
    const roster = [];
    let current = null;
    
    for (const line of lines) {
        if (!line) {
            if (current) roster.push(current);
            current = null;
        } else {
            if (!current) {
                current = { name: line, role: "Desconocido", traits: [], imgPath: "", color: defaultColor };
                current.imgPath = `/whiterock/Jugadores/img/${line.toLowerCase().replace(/\s+/g, '_')}.avif`;
            } else if (line.startsWith('*')) {
                current.role = line.substring(1).trim();
                const roleLow = current.role.toLowerCase();
                let foundColor = defaultColor;
                for (const cfg of roleConfig) {
                    if (cfg.keywords.some(kw => roleLow.includes(kw))) {
                        foundColor = cfg.color;
                        break;
                    }
                }
                current.color = foundColor;
            } else if (line.startsWith('-')) {
                current.traits.push(line.substring(1).trim());
            }
        }
    }
    if (current) roster.push(current);

    if (roster.length === 0) return ui.notifications.error("Lista vacía o archivo no encontrado.");

    class WhiteRockIDApp extends Application {
        static get defaultOptions() {
            return mergeObject(super.defaultOptions, {
                id: "whiterock-id-card",
                title: "Base de Datos - White Rock Labs",
                width: 510,
                height: "auto",
                resizable: false
            });
        }

        constructor(roster) {
            super();
            this.roster = roster;
            const userMatch = this.roster.find(c => c.name === game.user.name);
            this.selected = userMatch ? userMatch : this.roster[0];
            this.interval = null;
        }

        async _renderInner(data) {
            const canEdit = game.user.isGM || game.user.name === this.selected.name;
            const disabledStr = canEdit ? "" : "disabled";

            const optionsHtml = this.roster.map(c => 
                `<option value="${c.name}" ${c.name === this.selected.name ? "selected" : ""}>${c.name}</option>`
            ).join("");

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

            const attrBase = this.selected.name.replace(/\s+/g, '').toLowerCase();
            const tfValue = getProperty(dummyActor, `system.${attrBase}-tf`) || "";
            const tpValue = getProperty(dummyActor, `system.${attrBase}-tp`) || "";
            
            const pointsValue = getProperty(dummyActor, `system.${attrBase}-points`) || 0;
            let pointsHtml = '<div style="display: grid; grid-template-columns: repeat(20, 1fr); justify-items: center; align-items: center; margin-top: 2px; width: 100%;">';
            for (let i = 1; i <= 20; i++) {
                const bg = i <= pointsValue ? '#000' : '#ddd';
                const pointer = game.user.isGM ? 'cursor: pointer;' : '';
                pointsHtml += `<div class="wr-point" data-val="${i}" style="width: 12px; height: 12px; border-radius: 50%; border: 1px solid #333; background: ${bg}; ${pointer}"></div>`;
            }
            pointsHtml += '</div>';

            const gridValue = getProperty(dummyActor, `system.${attrBase}-grid`) || "0000000000";
            const letters = ['A','B','C','D','E','F','G','H','I','J'];
            let gridHtml = '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-top: 2px; width: 100%;">';
            for (let i = 0; i < 10; i++) {
                const bg = gridValue[i] === '1' ? '#000' : '#ddd';
                const col = gridValue[i] === '1' ? '#fff' : '#000';
                const pointer = game.user.isGM ? 'cursor: pointer;' : '';
                gridHtml += `<div class="wr-grid-cell" data-idx="${i}" style="display: flex; align-items: center; justify-content: center; height: 24px; border: 1px solid #333; background: ${bg}; color: ${col}; font-weight: bold; font-size: 0.85em; ${pointer}">${letters[i]}</div>`;
            }
            gridHtml += '</div>';

            const barcodeHtml = getBarcode(this.selected.name);

            const html = `
                <div style="display: flex; flex-direction: column; width: 100%; height: 100%; font-family: ${fontMain};">
                    <div style="padding-bottom: 10px; margin-bottom: 15px; border-bottom: 1px solid #555;">
                        <select id="wr-character-select" style="width: 100%; padding: 0px; font-size: 1em; font-family: ${fontMain};">
                            ${optionsHtml}
                        </select>
                    </div>

                    <div style="position: relative; background: #f4f4f4; color: #111; border-radius: 16px; overflow: hidden; border: 1px solid #d3d3d3; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('/whiterock/Jugadores/img/idoverlay.avif') center/cover; pointer-events: none; opacity: 0.15; z-index: 1;"></div>

                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 75px; background-color: ${this.selected.color}; z-index: 0;"></div>

                        <div style="position: absolute; top: 20px; right: 20px; z-index: 3;">
                            ${barcodeHtml}
                        </div>

                        <div style="display: flex; padding: 20px 20px 10px 20px; gap: 15px; position: relative; z-index: 2;">
                            <div style="flex: 0 0 120px; display: flex; flex-direction: column; align-items: center;">
                                <img src="${this.selected.imgPath}" onerror="this.src='icons/svg/mystery-man.svg'" style="width: 120px; height: 160px; object-fit: cover; border: 2px solid #333; background: #fff;">
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
                                            <input id="wr-tf-input" type="text" value="${tfValue}" ${disabledStr} style="width: 100%; height: 26px; text-align: center; background: ${canEdit ? '#fff' : '#ddd'}; color: #000 !important; border: 1px solid #999; padding: 2px; font-size: 1.1em; font-weight: bold; font-family: ${fontMain};">
                                        </div>
                                        <div>
                                            <label style="font-size: 0.7em; font-weight: bold; text-transform: uppercase; color: #000; display: block; font-family: ${fontTitles};">Trauma Psico.</label>
                                            <input id="wr-tp-input" type="text" value="${tpValue}" ${disabledStr} style="width: 100%; height: 26px; text-align: center; background: ${canEdit ? '#fff' : '#ddd'}; color: #000 !important; border: 1px solid #999; padding: 2px; font-size: 1.1em; font-weight: bold; font-family: ${fontMain};">
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
                </div>
            `;
            return $(html);
        }

        activateListeners(html) {
            super.activateListeners(html);
            
            html.find('#wr-character-select').change(ev => {
                this.selected = this.roster.find(c => c.name === ev.target.value);
                this.render();
            });

            const saveToActor = async () => {
                const attrBase = this.selected.name.replace(/\s+/g, '').toLowerCase();
                const tf = html.find('#wr-tf-input').val();
                const tp = html.find('#wr-tp-input').val();
                await dummyActor.update({
                    [`system.${attrBase}-tf`]: tf,
                    [`system.${attrBase}-tp`]: tp
                });
            };

            html.find('#wr-tf-input, #wr-tp-input').on('change', saveToActor);

            if (game.user.isGM) {
                html.find('.wr-point').click(async (ev) => {
                    const val = parseInt($(ev.currentTarget).data('val'));
                    const attrBase = this.selected.name.replace(/\s+/g, '').toLowerCase();
                    const currentVal = getProperty(dummyActor, `system.${attrBase}-points`) || 0;
                    const newVal = val === currentVal ? val - 1 : val; 
                    await dummyActor.update({ [`system.${attrBase}-points`]: newVal });
                    html.find('.wr-point').each(function() {
                        const v = parseInt($(this).data('val'));
                        $(this).css('background', v <= newVal ? '#000' : '#ddd');
                    });
                });

                html.find('.wr-grid-cell').click(async (ev) => {
                    const idx = parseInt($(ev.currentTarget).data('idx'));
                    const attrBase = this.selected.name.replace(/\s+/g, '').toLowerCase();
                    let gridStr = getProperty(dummyActor, `system.${attrBase}-grid`) || "0000000000";
                    let gridArr = gridStr.split('');
                    gridArr[idx] = gridArr[idx] === '1' ? '0' : '1';
                    const newGridStr = gridArr.join('');
                    await dummyActor.update({ [`system.${attrBase}-grid`]: newGridStr });
                    html.find('.wr-grid-cell').each(function() {
                        const i = parseInt($(this).data('idx'));
                        const isOn = newGridStr[i] === '1';
                        $(this).css('background', isOn ? '#000' : '#ddd');
                        $(this).css('color', isOn ? '#fff' : '#000');
                    });
                });
            }

            if (this.interval) clearInterval(this.interval);
            this.interval = setInterval(() => {
                const attrBase = this.selected.name.replace(/\s+/g, '').toLowerCase();
                
                const tfValue = getProperty(dummyActor, `system.${attrBase}-tf`) || "";
                const tpValue = getProperty(dummyActor, `system.${attrBase}-tp`) || "";
                const tfInput = html.find('#wr-tf-input')[0];
                const tpInput = html.find('#wr-tp-input')[0];
                if (tfInput && document.activeElement !== tfInput) $(tfInput).val(tfValue);
                if (tpInput && document.activeElement !== tpInput) $(tpInput).val(tpValue);

                const pointsValue = getProperty(dummyActor, `system.${attrBase}-points`) || 0;
                html.find('.wr-point').each(function() {
                    const v = parseInt($(this).data('val'));
                    $(this).css('background', v <= pointsValue ? '#000' : '#ddd');
                });

                const gridValue = getProperty(dummyActor, `system.${attrBase}-grid`) || "0000000000";
                html.find('.wr-grid-cell').each(function() {
                    const idx = parseInt($(this).data('idx'));
                    const isOn = gridValue[idx] === '1';
                    $(this).css('background', isOn ? '#000' : '#ddd');
                    $(this).css('color', isOn ? '#fff' : '#000');
                });
            }, 1000);
        }

        async close(options) {
            if (this.interval) clearInterval(this.interval);
            return super.close(options);
        }
    }

    new WhiteRockIDApp(roster).render(true);
})
.catch(err => ui.notifications.error("Error leyendo archivos de datos."));