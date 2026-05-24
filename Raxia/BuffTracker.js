const CONTROLLER_NAME = "game_controller";
const controllerActor = game.actors.getName(CONTROLLER_NAME);

if (!controllerActor) {
    ui.notifications.error(`No se encontró el actor llamado "${CONTROLLER_NAME}".`);
    return;
}

class TrackerApp extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: "Contador de efectos",
            width: 600,
            height: 500,
            id: "tracker-app",
            resizable: true
        });
    }

    async loadValues() {
        this.allies = getProperty(controllerActor.system, "Tracker.allies") || [];
        this.enemies = getProperty(controllerActor.system, "Tracker.enemies") || [];
    }

    async saveValues() {
        await controllerActor.update({
            "system.Tracker.allies": this.allies,
            "system.Tracker.enemies": this.enemies
        });
    }

    async _renderInner() {
        await this.loadValues();
        const buildList = (list, type) => list.map((e, i) => `
            <div style="display: flex; gap: 5px; margin-bottom: 5px;" data-index="${i}" data-type="${type}">
                <input type="text" class="text-input" value="${e.text}" style="flex: 3;">
                <input type="number" class="turn-input" value="${e.turns}" style="flex: 1;">
            </div>
        `).join('');

        return $(`
            <div style="padding: 10px; height: 100%; display: flex; flex-direction: column;">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <button id="clear-btn">Limpiar todo</button>
                    <button id="turn-btn">Pasar turno</button>
                </div>
                <div style="display: flex; gap: 8px; flex: 1; overflow-y: auto;">
                    <div style="flex: 1; border: 1px solid #E9A42999; background: #E9A42933; padding: 4px; border-radius: 5px;">
                        <h3 style="text-align: center; margin: 0 0 10px 0;">Aliados</h3>
                        <button class="add-btn" data-type="allies" style="margin-bottom: 10px;">Añadir</button>
                        <div id="allies-list">${buildList(this.allies, 'allies')}</div>
                    </div>
                    <div style="flex: 1; border: 1px solid #FF006E99; background: #FF060E33; padding: 4px; border-radius: 5px;">
                        <h3 style="text-align: center; margin: 0 0 10px 0;">Enemigos</h3>
                        <button class="add-btn" data-type="enemies" style="margin-bottom: 10px;">Añadir</button>
                        <div id="enemies-list">${buildList(this.enemies, 'enemies')}</div>
                    </div>
                </div>
            </div>
        `);
    }

    activateListeners(html) {
        super.activateListeners(html);
        
        html.find("#clear-btn").click(() => {
            Dialog.confirm({
                title: "Confirmación",
                content: "¿Limpiar todas las entradas?",
                yes: async () => {
                    this.allies = [];
                    this.enemies = [];
                    await this.saveValues();
                    this.render(true);
                }
            });
        });

        html.find("#turn-btn").click(async () => {
            this.allies = this.allies.map(e => ({...e, turns: e.turns - 1})).filter(e => e.turns > 0);
            this.enemies = this.enemies.map(e => ({...e, turns: e.turns - 1})).filter(e => e.turns > 0);
            await this.saveValues();
            this.render(true);
        });

        html.find(".add-btn").click(async (ev) => {
            const type = ev.currentTarget.dataset.type;
            this[type].push({text: "", turns: 1});
            await this.saveValues();
            this.render(true);
        });

        html.find(".text-input, .turn-input").change(async (ev) => {
            const el = ev.currentTarget;
            const parent = el.parentElement;
            const index = parent.dataset.index;
            const type = parent.dataset.type;
            const isTurn = el.classList.contains("turn-input");
            
            this[type][index][isTurn ? "turns" : "text"] = isTurn ? parseInt(el.value) || 0 : el.value;
            await this.saveValues();
        });
    }
}

new TrackerApp().render(true);