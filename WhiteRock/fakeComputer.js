const directorioBase = "/whiterock/computer";
const fondoPantalla = "/whiterock/computer/_assets/bg.avif";
const imagenArranque = "/whiterock/computer/_assets/boot.avif";

async function obtenerContenidoDirectorio(rutaBase) {
    const busqueda = await FilePicker.browse("data", rutaBase);
    const mapa = new Map();
    const archivosValidos = [];

    busqueda.dirs.forEach(ruta => {
        const nombreDir = decodeURIComponent(ruta.split('/').pop());
        if (!nombreDir.startsWith("_") && !nombreDir.startsWith("mail-")) {
            archivosValidos.push({ nombre: nombreDir, tipo: "dir", ruta: ruta });
        }
    });

    busqueda.files.forEach(ruta => {
        const nombreExt = decodeURIComponent(ruta.split('/').pop());
        if (nombreExt.startsWith("_") || nombreExt.startsWith("error_")) return;
        
        const partes = nombreExt.split('.');
        const ext = partes.pop();
        const base = partes.join('.');
        
        if (ext === "txt" || ext === "avif") {
            if (!mapa.has(base)) mapa.set(base, {});
            mapa.get(base)[ext] = ruta;
        }
    });

    mapa.forEach((datos, base) => {
        if (datos.txt && datos.avif) archivosValidos.push({ nombre: base + ".scp", tipo: "scp", txt: datos.txt, avif: datos.avif });
        else if (datos.txt) archivosValidos.push({ nombre: base + ".txt", tipo: "txt", txt: datos.txt });
        else if (datos.avif) archivosValidos.push({ nombre: base + ".avif", tipo: "avif", avif: datos.avif });
    });
    
    return archivosValidos;
}

async function compilarCatalogo(rutaBase, catalogo = []) {
    const contenido = await obtenerContenidoDirectorio(rutaBase);
    for (const arch of contenido) {
        catalogo.push(arch);
        if (arch.tipo === "dir") {
            await compilarCatalogo(arch.ruta, catalogo);
        }
    }
    return catalogo;
}

class Win98Desktop extends Application {
    constructor(archivos, catalogoGlobal, archivoErrorInicial) {
        super();
        this.archivos = archivos;
        this.catalogoGlobal = catalogoGlobal;
        this.archivoErrorInicial = archivoErrorInicial;
        this.ventanasAbiertas = 0;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "win98-desktop",
            title: "Ordenador Personal",
            width: 1024,
            height: 768,
            resizable: true,
            template: null
        });
    }

    _generarIconosHTML(archivos = this.archivos) {
        return archivos.map((archivo) => {
            const icono = archivo.tipo === "txt" ? "📝" : archivo.tipo === "avif" ? "🖼️" : archivo.tipo === "dir" ? "📁" : archivo.tipo === "mail" ? "📧" : "🗃️";
            const dataStr = encodeURIComponent(JSON.stringify(archivo));
            return `
                <div class="win98-icono" data-file="${dataStr}" style="display: flex; flex-direction: column; align-items: center; width: 80px; margin-bottom: 15px; cursor: var(--cursorg-url), auto !important;">
                    <div style="font-size: 32px; filter: drop-shadow(2px 2px 0px rgba(0,0,0,0.5));">${icono}</div>
                    <div style="color: white; font-family: 'DOS', sans-serif; font-size: 12px; text-align: center; word-break: break-all; background: rgba(0,0,128,0.5); padding: 2px;">${archivo.nombre}</div>
                </div>
            `;
        }).join('');
    }

    _procesarEnlaces(textoOriginal) {
        let htmlResult = textoOriginal.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        let placeholders = {};
        let pIndex = 0;
        
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const archivosOrdenados = [...this.catalogoGlobal].sort((a, b) => {
            const baseA = a.nombre.includes('.') ? a.nombre.split('.').slice(0, -1).join('.') : a.nombre;
            const baseB = b.nombre.includes('.') ? b.nombre.split('.').slice(0, -1).join('.') : b.nombre;
            return baseB.length - baseA.length;
        });

        archivosOrdenados.forEach(archivo => {
            const base = archivo.nombre.includes('.') ? archivo.nombre.split('.').slice(0, -1).join('.') : archivo.nombre;
            const terminoBusqueda = base.replace(/_/g, ' ');
            if (!terminoBusqueda) return;
            
            const regex = new RegExp(`\\b(${escapeRegExp(terminoBusqueda)})\\b`, 'gi');
            htmlResult = htmlResult.replace(regex, (match) => {
                const pid = `__LINK${pIndex++}__`;
                const dataStr = encodeURIComponent(JSON.stringify(archivo));
                placeholders[pid] = `<span class="win98-icono" data-file="${dataStr}" style="color: blue; font-weight: bold; text-decoration: underline; cursor: var(--cursorg-url), auto !important;">${match}</span>`;
                return pid;
            });
        });
        
        for (const pid in placeholders) {
            htmlResult = htmlResult.replace(new RegExp(pid, 'g'), placeholders[pid]);
        }
        return htmlResult;
    }

    async _renderInner(data) {
        return $(`
            <div id="win98-desktop-wrapper" style="position: relative; width: 100%; height: 100%; background: url('${fondoPantalla}') center/cover; font-family: 'DOS', sans-serif; overflow: hidden; display: flex; flex-direction: column;">
                <style>
                    #win98-desktop-wrapper { scrollbar-width: auto; scrollbar-color: #c0c0c0 #dfdfdf; }
                    #win98-desktop-wrapper *::-webkit-scrollbar { width: 16px !important; height: 16px !important; background: #dfdfdf !important; }
                    #win98-desktop-wrapper *::-webkit-scrollbar-thumb { background: #c0c0c0 !important; border: 2px solid !important; border-color: #fff #000 #000 #fff !important; }
                    #win98-desktop-wrapper *::-webkit-scrollbar-track { background: #dfdfdf !important; }
                    #win98-desktop-wrapper button:hover { background: #c0c0c0 !important; color: black !important; text-shadow: none !important; box-shadow: none !important; }
                    #win98-desktop-wrapper button { transition: none !important; text-shadow: none !important; box-shadow: none !important; outline: none !important; }
                    #win98-desktop-wrapper .start-item:hover { background: #000080 !important; color: white !important; }
                </style>
                
                <div id="win98-boot-screen" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 30000; background: white url('${imagenArranque}') center/contain no-repeat; background-origin: content-box; padding: 15%; box-sizing: border-box; ${this.archivoErrorInicial ? 'display: none;' : ''}"></div>
                ${this.archivoErrorInicial ? `<div id="win98-error-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; background: black url('${this.archivoErrorInicial}') center/100% 100% no-repeat; pointer-events: all;"></div>` : ''}
                
                <div style="flex: 1; padding: 10px; display: flex; flex-direction: column; flex-wrap: wrap; align-content: flex-start; position: relative;" id="win98-desktop-area">
                    ${this._generarIconosHTML()}
                </div>

                <div id="win98-start-menu" style="display: none; position: absolute; bottom: 30px; left: 0; width: 180px; background: #c0c0c0; border: 2px solid; border-color: #fff #000 #000 #fff; z-index: 20000; flex-direction: row;">
                    <div style="background: linear-gradient(180deg, #000080, #1084d0); width: 25px; color: white; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; box-sizing: border-box;">
                        <span style="writing-mode: vertical-lr; transform: rotate(180deg); white-space: nowrap; font-weight: bold; font-size: 14px;">White Rock OS</span>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; padding: 2px;">
                        <button class="start-item" style="border: none !important; background: transparent; text-align: left; padding: 6px; cursor: var(--cursorg-url), auto !important;">Programas</button>
                        <button class="start-item" style="border: none !important; background: transparent; text-align: left; padding: 6px; cursor: var(--cursorg-url), auto !important;">Documentos</button>
                        <button class="start-item" style="border: none !important; background: transparent; text-align: left; padding: 6px; cursor: var(--cursorg-url), auto !important;">Configuración</button>
                        <div style="height: 1px; background: #808080; border-bottom: 1px solid #fff; margin: 4px 0;"></div>
                        <button id="btn-reiniciar" class="start-item" style="border: none !important; background: transparent; text-align: left; padding: 6px; cursor: var(--cursorg-url), auto !important;">Reiniciar</button>
                        <button id="btn-apagar" class="start-item" style="border: none !important; background: transparent; text-align: left; padding: 6px; cursor: var(--cursorg-url), auto !important;">Apagar</button>
                    </div>
                </div>

                <div style="height: 30px; background: #c0c0c0; border-top: 2px solid #dfdfdf; display: flex; align-items: center; padding: 0 4px; z-index: 10000; box-sizing: border-box; width: 100%;">
                    <button id="btn-inicio" style="flex: 0 0 auto; width: 80px; font-weight: bold; font-family: 'DOS', sans-serif; padding: 2px 6px; margin: 0; border: 2px solid !important; border-color: #fff #000 #000 #fff !important; border-radius: 0; background: #c0c0c0; cursor: var(--cursorg-url), auto !important; color: black; height: 22px; line-height: 14px;">Inicio</button>
                    <div id="win98-taskbar-windows" style="flex: 1; display: flex; gap: 4px; padding: 0 10px; overflow: hidden; align-items: center;"></div>
                    <div id="win98-clock" style="border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 2px 8px; font-size: 11px; color: black; background: #c0c0c0; display: flex; align-items: center; height: 22px; box-sizing: border-box; margin-right: 2px; flex: 0 0 auto;"></div>
                </div>
            </div>
        `);
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.on("click", () => {
            game.macros.getName("Click").execute();
        });
        
        if (!this.archivoErrorInicial) {
            setTimeout(() => {
                html.find("#win98-boot-screen").hide();
            }, 3000);
        }

        let errorPrevio = !!this.archivoErrorInicial;
        let comprobando = false;

        const comprobarError = async () => {
            if (comprobando) return;
            comprobando = true;
            try {
                const busqueda = await FilePicker.browse("data", directorioBase);
                const archivoError = busqueda.files.find(ruta => {
                    const nombre = ruta.split('/').pop();
                    return nombre.startsWith("error_") && nombre.endsWith(".avif");
                });

                if (archivoError) {
                    if (!errorPrevio) {
                        errorPrevio = true;
                        game.macros.getName("Error").execute();
                        if (!html.find("#win98-error-overlay").length) {
                            html.append(`
                                <div id="win98-error-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; background: black url('${archivoError}') center/100% 100% no-repeat; pointer-events: all;"></div>
                            `);
                            html.find("#win98-boot-screen").hide();
                        }
                    }
                } else {
                    if (errorPrevio) {
                        errorPrevio = false;
                        html.find("#win98-error-overlay").remove();
                        html.find("#btn-reiniciar").click();
                    }
                }
            } finally {
                comprobando = false;
            }
        };
        setInterval(comprobarError, 3000);

        const actualizarReloj = () => {
            const ahora = new Date();
            const horas = ahora.getHours().toString().padStart(2, '0');
            const minutos = ahora.getMinutes().toString().padStart(2, '0');
            html.find("#win98-clock").text(`${horas}:${minutos}`);
        };
        actualizarReloj();
        setInterval(actualizarReloj, 60000);

        html.click((e) => {
            if (!$(e.target).closest('#btn-inicio, #win98-start-menu').length) {
                html.find("#win98-start-menu").css("display", "none");
            }
        });

        html.find("#btn-inicio").click((e) => {
            const menu = html.find("#win98-start-menu");
            menu.css("display", menu.css("display") === "none" ? "flex" : "none");
        });

        html.find("#btn-apagar").click(() => {
            this.close();
        });

        html.find("#btn-reiniciar").click(async () => {
            html.find("#win98-start-menu").css("display", "none");
            
            const busqueda = await FilePicker.browse("data", directorioBase);
            const archivoError = busqueda.files.find(ruta => {
                const nombre = ruta.split('/').pop();
                return nombre.startsWith("error_") && nombre.endsWith(".avif");
            });

            if (archivoError) {
                if (!html.find("#win98-error-overlay").length) {
                    html.append(`
                        <div id="win98-error-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; background: black url('${archivoError}') center/100% 100% no-repeat; pointer-events: all;"></div>
                    `);
                }
            } else {
                html.find("#win98-boot-screen").show();
                game.macros.getName("Boot").execute();
                setTimeout(() => {
                    html.find("#win98-boot-screen").hide();
                }, 3000);
            }
            
            html.find(".win-window").remove();
            html.find("#win98-taskbar-windows").empty();
            this.ventanasAbiertas = 0;

            this.archivos = await obtenerContenidoDirectorio(directorioBase);
            this.archivos.unshift({ nombre: "Correo", tipo: "mail" });
            this.catalogoGlobal = await compilarCatalogo(directorioBase);
            html.find("#win98-desktop-area").html(this._generarIconosHTML());
        });

        html.on("click", ".win98-icono", async (e) => {
            const archivo = JSON.parse(decodeURIComponent(e.currentTarget.dataset.file));
            const nombre = archivo.nombre;
            const idVentana = `win-${this.ventanasAbiertas++}`;
            const iconoTaskbar = archivo.tipo === "txt" ? "📝" : archivo.tipo === "avif" ? "🖼️" : archivo.tipo === "dir" ? "📁" : archivo.tipo === "mail" ? "📧" : "🗃️";
            
            const btnTaskbar = $(`<button id="task-${idVentana}" style="flex: 0 0 auto; width: auto; font-family: 'DOS', sans-serif; padding: 2px 6px; margin: 0; border: 2px solid !important; border-color: #fff #000 #000 #fff !important; border-radius: 0; background: #c0c0c0; color: black; cursor: var(--cursorg-url), auto !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; height: 22px; line-height: 14px; text-align: left; font-weight: bold; display: flex; align-items: center; gap: 4px;"><span style="line-height: 1;">${iconoTaskbar}</span><span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${nombre}</span></button>`);
            html.find("#win98-taskbar-windows").append(btnTaskbar);

            const ventana = $(`
                <div id="${idVentana}" class="win-window" style="position: absolute; top: ${5 + (this.ventanasAbiertas * 3)}%; left: ${5 + (this.ventanasAbiertas * 3)}%; width: 50%; height: 60%; background: #c0c0c0; border: 2px solid; border-color: #fff #000 #000 #fff; display: flex; flex-direction: column; z-index: ${10 + this.ventanasAbiertas};">
                    <div class="win-header" style="background: #000080; color: #fff; font-weight: bold; padding: 2px 4px; display: flex; justify-content: space-between; align-items: center; cursor: move;">
                        <span style="font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nombre}</span>
                        <div style="display: flex; gap: 2px;">
                            <button class="btn-min" style="width: 16px; height: 14px; padding: 0; margin: 0; border: 2px solid !important; border-color: #fff #000 #000 #fff !important; border-radius: 0; background: #c0c0c0; color: black; font-size: 10px; line-height: 10px; font-weight: bold; cursor: var(--cursorg-url), auto !important; min-width: 0;">_</button>
                            <button class="btn-max" style="width: 16px; height: 14px; padding: 0; margin: 0; border: 2px solid !important; border-color: #fff #000 #000 #fff !important; border-radius: 0; background: #c0c0c0; color: black; font-size: 10px; line-height: 10px; font-weight: bold; cursor: var(--cursorg-url), auto !important; min-width: 0;">□</button>
                            <button class="btn-close" style="width: 16px; height: 14px; padding: 0; margin: 0; border: 2px solid !important; border-color: #fff #000 #000 #fff !important; border-radius: 0; background: #c0c0c0; color: black; font-size: 10px; line-height: 10px; font-weight: bold; cursor: var(--cursorg-url), auto !important; min-width: 0;">X</button>
                        </div>
                    </div>
                    <div style="flex: 1; margin: 4px; background: #fff; border: 2px solid; border-color: #808080 #fff #fff #808080; position: relative; overflow: hidden; box-sizing: border-box;">
                        <div class="win-content" style="width: 100%; height: 100%; box-sizing: border-box; background: #fff; overflow: hidden;"></div>
                    </div>
                </div>
            `);

            html.find("#win98-desktop-area").append(ventana);
            const contenido = ventana.find(".win-content");

            btnTaskbar.click(() => {
                if (ventana.css("display") === "none") {
                    ventana.css("display", "flex");
                    btnTaskbar.css("border-color", "#fff #000 #000 #fff");
                } else {
                    ventana.css("display", "none");
                    btnTaskbar.css("border-color", "#808080 #fff #fff #808080");
                }
            });

            ventana.find(".btn-close").click(() => {
                ventana.remove();
                btnTaskbar.remove();
            });

            ventana.find(".btn-min").click(() => {
                ventana.css("display", "none");
                btnTaskbar.css("border-color", "#808080 #fff #fff #808080");
            });

            let isMax = false;
            let oldStyles = {};
            ventana.find(".btn-max").click(() => {
                if (!isMax) {
                    oldStyles = { top: ventana.css("top"), left: ventana.css("left"), width: ventana.css("width"), height: ventana.css("height") };
                    ventana.css({ top: 0, left: 0, width: "100%", height: "100%" });
                } else {
                    ventana.css(oldStyles);
                }
                isMax = !isMax;
            });

            if (archivo.tipo === "txt") {
                const divText = $(`<div style="width: 100%; height: 100%; font-smooth: never; -webkit-font-smoothing: never; box-sizing: border-box; font-family: 'Courier New', Courier, monospace; padding: 4px; overflow: auto; background: #fff; color: #000; white-space: pre-wrap;"></div>`);
                contenido.append(divText);
                
                const respuesta = await fetch(archivo.txt);
                const texto = await respuesta.text();
                
                let i = 0;
                const escribirAleatorio = () => {
                    if (!$.contains(document, divText[0])) return;
                    if (i >= texto.length) {
                        divText.html(this._procesarEnlaces(texto));
                        return;
                    }
                    const chunkSize = Math.floor(Math.random() * 180) + 5;
                    i += chunkSize;
                    
                    const textoVisible = texto.slice(0, i);
                    const ultimoPunto = textoVisible.lastIndexOf('.');
                    
                    if (ultimoPunto !== -1) {
                        const parteProcesada = this._procesarEnlaces(textoVisible.slice(0, ultimoPunto + 1));
                        const parteCruda = textoVisible.slice(ultimoPunto + 1).replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        divText.html(parteProcesada + parteCruda);
                    } else {
                        divText.text(textoVisible);
                    }
                    
                    const delay = Math.floor(Math.random() * 250) + 50;
                    setTimeout(escribirAleatorio, delay);
                };
                escribirAleatorio();

            } else if (archivo.tipo === "avif") {
                const divImg = $(`<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; overflow: hidden;"><img src="${archivo.avif}" style="max-width: 100%; max-height: 100%; clip-path: inset(0 0 100% 0); transition: clip-path 2500ms steps(14);" /></div>`);
                contenido.append(divImg);
                setTimeout(() => {
                    divImg.find("img").css("clip-path", "inset(0 0 0 0)");
                }, 50);
            } else if (archivo.tipo === "scp") {
                contenido.css({ "overflow": "auto", "display": "flex", "flex-direction": "column" });
                
                const divImg = $(`<div style="width: 100%; display: flex; justify-content: center; align-items: center; padding-bottom: 10px;"><img src="${archivo.avif}" style="max-width: 100%; clip-path: inset(0 0 100% 0); transition: clip-path 2500ms steps(14);" /></div>`);
                contenido.append(divImg);
                setTimeout(() => {
                    divImg.find("img").css("clip-path", "inset(0 0 0 0)");
                }, 50);

                const divText = $(`<div style="width: 100%; box-sizing: border-box; font-smooth: never; -webkit-font-smoothing: never; font-family: 'Courier New', Courier, monospace; padding: 4px; color: #000; white-space: pre-wrap;"></div>`);
                contenido.append(divText);

                const respuesta = await fetch(archivo.txt);
                const texto = await respuesta.text();
                
                let i = 0;
                const escribirAleatorio = () => {
                    if (!$.contains(document, divText[0])) return;
                    if (i >= texto.length) {
                        divText.html(this._procesarEnlaces(texto));
                        return;
                    }
                    const chunkSize = Math.floor(Math.random() * 180) + 5;
                    i += chunkSize;
                    
                    const textoVisible = texto.slice(0, i);
                    const ultimoPunto = textoVisible.lastIndexOf('.');
                    
                    if (ultimoPunto !== -1) {
                        const parteProcesada = this._procesarEnlaces(textoVisible.slice(0, ultimoPunto + 1));
                        const parteCruda = textoVisible.slice(ultimoPunto + 1).replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        divText.html(parteProcesada + parteCruda);
                    } else {
                        divText.text(textoVisible);
                    }
                    
                    const delay = Math.floor(Math.random() * 250) + 50;
                    setTimeout(escribirAleatorio, delay);
                };
                setTimeout(escribirAleatorio, 500);
            } else if (archivo.tipo === "dir") {
                contenido.css({ "overflow": "auto", "display": "flex", "flex-wrap": "wrap", "align-content": "flex-start", "padding": "10px" });
                const subArchivos = await obtenerContenidoDirectorio(archivo.ruta);
                contenido.html(this._generarIconosHTML(subArchivos));
            } else if (archivo.tipo === "mail") {
                const nombreUsuario = game.user.name.replace(/ /g, "_");
                const esGM = game.user.isGM;

                const divMail = $(`<div style="width: 100%; height: 100%; display: flex; flex-direction: column; background: #c0c0c0; font-family: 'DOS', sans-serif; font-size: 12px; box-sizing: border-box; overflow: hidden; color: #000000;">
                    <div style="display: flex; gap: 4px; padding: 4px; border-bottom: 2px solid #808080; background: #c0c0c0;">
                        <button class="btn-recibidos" style="border: 2px solid; border-color: #fff #000 #000 #fff; background: #c0c0c0; color: #000000; cursor: var(--cursorg-url), auto !important; padding: 2px 6px;">Recibidos</button>
                        <button class="btn-nuevo" style="border: 2px solid; border-color: #fff #000 #000 #fff; background: #c0c0c0; color: #000000; cursor: var(--cursorg-url), auto !important; padding: 2px 6px;">Nuevo</button>
                    </div>
                    <div class="mail-content" style="flex: 1; display: flex; overflow: hidden; padding: 4px; background: #c0c0c0;"></div>
                </div>`);
                contenido.append(divMail);

                const cargarRecibidos = async () => {
                    divMail.find(".mail-content").html('<div style="width: 100%; padding: 10px; color: #000000;">Cargando mensajes...</div>');
                    const listaMails = [];
                    let directoriosMail = [];

                    if (esGM) {
                        try {
                            const busquedaBase = await FilePicker.browse("data", directorioBase);
                            directoriosMail = busquedaBase.dirs.filter(d => d.split('/').pop().startsWith("mail-"));
                        } catch (e) {}
                    } else {
                        directoriosMail = [`${directorioBase}/mail-${nombreUsuario}`];
                    }

                    for (const dirMail of directoriosMail) {
                        try {
                            const busquedaDir = await FilePicker.browse("data", dirMail);
                            for (const archivoRuta of busquedaDir.files) {
                                if (archivoRuta.endsWith(".txt")) {
                                    const resp = await fetch(archivoRuta);
                                    const textoMail = await resp.text();
                                    if (textoMail.trim() === "_DELETED_") continue;

                                    const lineas = textoMail.split('\n');
                                    const lineaEmisor = lineas.find(l => l.startsWith("Emisor: ")) || "Emisor: Desconocido";
                                    const lineaAsunto = lineas.find(l => l.startsWith("Asunto: ")) || "Asunto: Sin Asunto";
                                    const cuerpoLimpio = lineas.filter(l => !l.startsWith("Emisor: ") && !l.startsWith("Asunto: ")).join('\n').replace(/^\s+/, '');
                                    
                                    let asuntoFinal = lineaAsunto.replace("Asunto: ", "").trim();
                                    if (esGM) {
                                        const receptor = dirMail.split('/').pop().replace("mail-", "");
                                        asuntoFinal = `[${receptor}] ${asuntoFinal}`;
                                    }

                                    listaMails.push({
                                        ruta: archivoRuta,
                                        dir: dirMail,
                                        emisor: lineaEmisor.replace("Emisor: ", "").trim(),
                                        asunto: asuntoFinal,
                                        cuerpo: cuerpoLimpio
                                    });
                                }
                            }
                        } catch (e) {}
                    }

                    let htmlLista = `<div style="width: 35%; border: 2px solid; border-color: #808080 #fff #fff #808080; background: #fff; overflow-y: auto; margin-right: 4px;">`;
                    listaMails.forEach((m, i) => {
                        htmlLista += `<div class="mail-item" data-index="${i}" style="padding: 4px; cursor: var(--cursorg-url), auto !important; border-bottom: 1px solid #c0c0c0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000000;">${m.asunto}</div>`;
                    });
                    htmlLista += `</div><div style="flex: 1; border: 2px solid; border-color: #808080 #fff #fff #808080; background: #c0c0c0; padding: 4px; overflow: hidden; display: flex; flex-direction: column;" class="mail-body"><div style="background:#fff; width:100%; height:100%; padding:4px; color:#000000;">Seleccione un mensaje.</div></div>`;
                    
                    divMail.find(".mail-content").html(htmlLista);

                    divMail.find(".mail-item").click(function() {
                        divMail.find(".mail-item").css("background", "transparent").css("color", "#000000");
                        $(this).css("background", "#000080").css("color", "white");
                        const mensaje = listaMails[$(this).data("index")];
                        
                        divMail.find(".mail-body").html(`
                            <div style="display: flex; flex-direction: column; height: 100%;">
                                <div style="background: #c0c0c0; border: 2px solid; border-color: #dfdfdf #808080 #808080 #dfdfdf; padding: 4px; margin-bottom: 4px; display: flex; flex-direction: column; gap: 4px;">
                                    <div style="display: flex; gap: 4px; align-items: center;"><span style="width: 55px; color: #000000;">Emisor:</span><div style="flex: 1; background: #fff; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 2px 4px; color: #000000;">${mensaje.emisor}</div></div>
                                    <div style="display: flex; gap: 4px; align-items: center;"><span style="width: 55px; color: #000000;">Asunto:</span><div style="flex: 1; background: #fff; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 2px 4px; color: #000000;">${mensaje.asunto}</div></div>
                                </div>
                                <div style="flex: 1; background: #fff; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 4px; overflow-y: auto;">
                                    <pre style="font-family: 'Courier New', Courier, monospace; margin: 0; white-space: pre-wrap; font-size: 12px; color: #000000;">${mensaje.cuerpo}</pre>
                                </div>
                                <div style="margin-top: 4px; display: flex; justify-content: flex-end;">
                                    <button class="btn-borrar-mail" style="border: 2px solid; border-color: #fff #000 #000 #fff; background: #c0c0c0; color: #000000; cursor: var(--cursorg-url), auto !important; padding: 2px 12px; font-weight: bold;">Borrar</button>
                                </div>
                            </div>
                        `);

                        divMail.find(".btn-borrar-mail").click(async () => {
                            const nombreArchivo = mensaje.ruta.split('/').pop();
                            const archivoBorrador = new File(["_DELETED_"], nombreArchivo, {type: "text/plain"});
                            await FilePicker.upload("data", mensaje.dir, archivoBorrador);
                            cargarRecibidos();
                        });
                    });
                };

                const cargarNuevo = () => {
                    const opcionesReceptor = game.users.filter(u => !u.isGM).map(u => `<option value="${u.name}">${u.name}</option>`).join('');
                    
                    divMail.find(".mail-content").html(`
                        <div style="display: flex; flex-direction: column; width: 100%; gap: 6px; padding: 4px;">
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="width: 65px; color: #000000;">Emisor:</span>
                                <input type="text" id="mail-emisor" value="${game.user.name}" ${esGM ? '' : 'disabled'} style="flex: 1; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 2px; font-family: inherit; color: #000000 !important; background: ${esGM ? '#fff' : '#c0c0c0'};">
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="width: 65px; color: #000000;">Receptor:</span>
                                <select id="mail-receptor" style="flex: 1; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 2px; font-family: inherit; color: #000000 !important; background: #fff;">
                                    ${opcionesReceptor}
                                </select>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="width: 65px; color: #000000;">Asunto:</span>
                                <input type="text" id="mail-asunto" style="flex: 1; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 2px; font-family: inherit; color: #000000 !important; background: #fff;">
                            </div>
                            <textarea id="mail-texto" style="flex: 1; border: 2px solid; border-color: #808080 #fff #fff #808080; padding: 4px; font-family: 'Courier New', Courier, monospace; resize: none; color: #000000 !important; background: #fff;"></textarea>
                            <button id="mail-enviar" style="border: 2px solid; border-color: #fff #000 #000 #fff; background: #c0c0c0; color: #000000; cursor: var(--cursorg-url), auto !important; padding: 4px; font-family: inherit; font-weight: bold;">Enviar</button>
                        </div>
                    `);

                    divMail.find("#mail-enviar").click(async () => {
                        const valEmisor = divMail.find("#mail-emisor").val();
                        const valReceptorCrudo = divMail.find("#mail-receptor").val();
                        const valReceptor = valReceptorCrudo.replace(/ /g, "_");
                        const valAsunto = divMail.find("#mail-asunto").val() || "Sin Asunto";
                        const valTexto = divMail.find("#mail-texto").val();
                        game.macros.getName("Mail").execute();

                        const rutaDestino = `${directorioBase}/mail-${valReceptor}`;
                        try {
                            await FilePicker.browse("data", rutaDestino);
                        } catch (e) {
                            await FilePicker.createDirectory("data", rutaDestino);
                        }

                        const estructuraArchivo = `Emisor: ${valEmisor}\nAsunto: ${valAsunto}\n\n${valTexto}`;
                        const nuevoArchivo = new File([estructuraArchivo], `${Date.now()}.txt`, {type: "text/plain"});
                        await FilePicker.upload("data", rutaDestino, nuevoArchivo);

                        cargarRecibidos();
                    });
                };

                divMail.find(".btn-recibidos").click(cargarRecibidos);
                divMail.find(".btn-nuevo").click(cargarNuevo);

                cargarRecibidos();
            }
        });

        html.on("mousedown", ".win-header", function(e) {
            if ($(e.target).closest('button').length) return;
            const ventana = $(this).closest('.win-window');
            let startX = e.clientX;
            let startY = e.clientY;
            let startPos = ventana.position();
            
            const maxZ = Math.max(...html.find('.win-window').map(function() { return parseInt($(this).css('z-index')) || 10; }).get()) + 1;
            ventana.css("z-index", maxZ);

            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                ventana.css({ left: startPos.left + dx, top: startPos.top + dy });
            };
            
            const onMouseUp = () => {
                $(document).off("mousemove", onMouseMove);
                $(document).off("mouseup", onMouseUp);
            };
            
            $(document).on("mousemove", onMouseMove);
            $(document).on("mouseup", onMouseUp);
        });
    }
}

async function ejecutarMacro() {
    const busqueda = await FilePicker.browse("data", directorioBase);
    const archivoError = busqueda.files.find(ruta => {
        const nombre = ruta.split('/').pop();
        return nombre.startsWith("error_") && nombre.endsWith(".avif");
    });

    if (!archivoError) {
        game.macros.getName("Boot").execute();
    } else {
        game.macros.getName("Error").execute();
    }

    const archivosValidos = await obtenerContenidoDirectorio(directorioBase);
    archivosValidos.unshift({ nombre: "Correo", tipo: "mail" });
    const catalogoGlobal = await compilarCatalogo(directorioBase);
    new Win98Desktop(archivosValidos, catalogoGlobal, archivoError).render(true);
}

ejecutarMacro();