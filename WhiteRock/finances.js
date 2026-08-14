const depts = [
    { name: "Departamento de Materiales anómalos", key: "materiales_anomalos" },
    { name: "Departamento de Partículas de alta energía", key: "particulas_de_alta_energia" },
    { name: "Departamento de Portales", key: "portales" },
    { name: "Departamento de Especímenes", key: "especimenes" },
    { name: "Departamento de Física", key: "fisica" },
    { name: "Departamento de Sistemas y Mantenimiento", key: "sistemas_y_mantenimiento" },
    { name: "Departamento de Logística", key: "logistica" },
    { name: "H.E.C.U.", key: "hecu" },
    { name: "Departamento de Desarrollo Armamentístico", key: "desarrollo_armamentistico" }
];

class WhiterockFinances extends Application {
    constructor(storeCategories) {
        super();
        this.storeCategories = storeCategories;
        this.selectedDept = depts[0].key;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "whiterock-finances",
            title: "Finanzas",
            template: "",
            width: 1200,
            height: 600,
            resizable: true
        });
    }

    async getData() {
        const dummyActor = game.actors.getName("dummy");
        const currentMoney = getProperty(dummyActor, `system.${this.selectedDept}`) || 0;
        let history = [currentMoney];
        try {
            const resp = await fetch(`/whiterock/finances/${this.selectedDept}.txt`);
            if (resp.ok) {
                const text = await resp.text();
                history = text.split('\n').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
                if (history.length === 0) history = [currentMoney];
            }
        } catch (e) {}

        return {
            depts,
            selectedDept: this.selectedDept,
            currentMoney,
            storeCategories: this.storeCategories,
            isGM: game.user.isGM,
            history
        };
    }

    renderChart(container, data) {
        const canvas = container.querySelector('#finance-chart');
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!data || data.length === 0) return;
        
        const padLeft = 100;
        const padRight = 16;
        const padY = 32;
        const w = canvas.width - padLeft - padRight;
        const h = canvas.height - padY * 2;
        const max = Math.max(0, ...data);
        const min = Math.min(0, ...data);
        const range = max - min || 1;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const gridLines = 8;
        for (let i = 0; i <= gridLines; i++) {
            const y = padY + (h / gridLines) * i;
            ctx.moveTo(padLeft, y);
            ctx.lineTo(canvas.width - padRight, y);
        }
        const timeLines = data.length > 1 ? data.length : 2;
        for (let i = 0; i < timeLines; i++) {
            const x = padLeft + (w / (timeLines - 1 || 1)) * i;
            ctx.moveTo(x, padY);
            ctx.lineTo(x, canvas.height - padY);
        }
        ctx.stroke();

        const zeroY = canvas.height - padY - ((0 - min) / range) * h;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.moveTo(padLeft, zeroY);
        ctx.lineTo(canvas.width - padRight, zeroY);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText('$0', 5, zeroY + 5);

        ctx.lineWidth = 3;
        for (let i = 1; i < data.length; i++) {
            const prevVal = data[i-1];
            const val = data[i];
            
            const x1 = padLeft + (w / (data.length - 1 || 1)) * (i - 1);
            const y1 = canvas.height - padY - ((prevVal - min) / range) * h;
            const x2 = padLeft + (w / (data.length - 1 || 1)) * i;
            const y2 = canvas.height - padY - ((val - min) / range) * h;
            
            ctx.beginPath();
            ctx.strokeStyle = val >= prevVal ? '#00ff00' : '#ff3333';
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.fillText(`$${max.toLocaleString('es-ES')}`, 5, padY + 5);
        ctx.fillText(`$${min.toLocaleString('es-ES')}`, 5, canvas.height - padY + 5);
    }

    async _renderInner(data) {
        let storeHtml = '';
        if (data.isGM) {
            for (const cat of data.storeCategories) {
                storeHtml += `<div style="margin-top: 15px; font-weight: bold; border-bottom: 1px solid #555; padding-bottom: 5px; margin-bottom: 10px; color: #ddd;">${cat.name}</div>`;
                for (const item of cat.items) {
                    storeHtml += `<button class="buy-item" data-cost="${item.cost}" style="width: 100%; text-align: left; margin-bottom: 5px; background: #2a2a2a; color: #eee; border: 1px solid #444; font-family: monospace;">[${item.cost}] ${item.name}</button>`;
                }
            }
        }

        const formattedMoney = data.currentMoney.toLocaleString('es-ES');

        const html = `
            <div style="display:flex; height: 100%; background: #111; color: #ccc; font-family: monospace;">
                <div style="width: 380px; border-right: 1px solid #444; padding: 15px; display: flex; flex-direction: column; overflow-y: auto;">
                    <select id="dept-select" style="width:100%; height: 40px; line-height: normal; margin-bottom: 20px; background: #222; color: #fff; border: 1px solid #555; padding: 5px 10px; font-family: monospace; font-size: 18px;">
                        ${data.depts.map(d => `<option value="${d.key}" ${d.key === data.selectedDept ? 'selected' : ''}>${d.name}</option>`).join('')}
                    </select>
                    
                    <div style="font-size: 14px; color: #aaa; margin-bottom: 5px;">Presupuesto Actual ($):</div>
                    ${data.isGM ? 
                        `<input type="text" id="dept-money" value="${formattedMoney}" style="width: 100%; height: 55px; line-height: normal; font-size: 34px; font-weight: bold; margin-bottom: 20px; background: #1a1a1a; border: 1px dashed #555; color: inherit; padding: 5px 10px; font-family: monospace;">` 
                        : `<div style="font-size: 34px; font-weight: bold; margin-bottom: 20px; padding: 5px;">${formattedMoney}</div>`
                    }
                    
                    <div id="gm-controls" style="flex: 1;">
                        ${storeHtml}
                    </div>
                </div>
                <div id="chart-container" style="flex:1; padding: 0; display: flex; flex-direction: column; position: relative; background: #0a0a0a;">
                    <canvas id="finance-chart" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
                </div>
            </div>
        `;
        return $(html);
    }

    activateListeners(html) {
        super.activateListeners(html);

        const container = html.find('#chart-container')[0];
        
        const renderGraph = () => {
            this.getData().then(data => {
                this.renderChart(container, data.history);
            });
        };
        
        renderGraph();
        
        const resizeObserver = new ResizeObserver(() => {
            renderGraph();
        });
        resizeObserver.observe(container);

        html.find('#dept-select').change(ev => {
            this.selectedDept = ev.currentTarget.value;
            this.render();
        });

        if (game.user.isGM) {
            html.find('#dept-money').change(async (ev) => {
                const rawVal = ev.currentTarget.value.replace(/\./g, '').replace(/,/g, '');
                const newVal = parseFloat(rawVal);
                if (!isNaN(newVal)) {
                    await this.updateMoney(newVal);
                }
            });

            html.find('.buy-item').click(async (ev) => {
                const costStr = ev.currentTarget.dataset.cost;
                let costNum = parseFloat(costStr.replace(/[^\d\.]/g, ''));
                if (costStr.includes('k')) costNum *= 1000;
                if (costStr.includes('m')) costNum *= 1000000;
                
                const dummyActor = game.actors.getName("dummy");
                const currentMoney = parseFloat(getProperty(dummyActor, `system.${this.selectedDept}`)) || 0;
                const newMoney = currentMoney - costNum;
                await this.updateMoney(newMoney);
            });
        }
    }

    async updateMoney(newAmount) {
        const dummyActor = game.actors.getName("dummy");
        await dummyActor.update({ [`system.${this.selectedDept}`]: newAmount });
        
        let existing = "";
        try {
            const resp = await fetch(`/whiterock/finances/${this.selectedDept}.txt`);
            if (resp.ok) existing = await resp.text();
        } catch (e) {}
        
        const newLog = existing ? `${existing}\n${newAmount}` : `${newAmount}`;
        const file = new File([newLog], `${this.selectedDept}.txt`, { type: "text/plain" });
        await FilePicker.upload("data", "/whiterock/finances/", file, {});
        
        this.render();
    }
}

(async () => {
    let storeText = "";
    try {
        const resp = await fetch('/whiterock/finances/store.txt');
        if (resp.ok) storeText = await resp.text();
    } catch (e) {
        ui.notifications.error("No se pudo leer store.txt");
        return;
    }

    const storeCategories = [];
    let currentCat = "General";
    const lines = storeText.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.endsWith(':')) {
            currentCat = trimmed.slice(0, -1);
            storeCategories.push({ name: currentCat, items: [] });
        } else {
            const match = trimmed.match(/-\s*([\d\.]+[mk]?\$)\s*-\s*(.+)/);
            if (match) {
                if (storeCategories.length === 0) storeCategories.push({ name: currentCat, items: [] });
                storeCategories[storeCategories.length - 1].items.push({ cost: match[1], name: match[2].trim() });
            }
        }
    }

    new WhiterockFinances(storeCategories).render(true);
})();