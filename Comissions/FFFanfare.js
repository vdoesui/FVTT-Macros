const altura_del_rectangulo_maxima = "12vh";
const color_del_fondo_del_rectangulo = "#22201F";
const color_del_borde = "#B18B6B";
const color_tinte_imagenes = "#FBE7AF";
const color_tinte_circulo = "#FFFADA";
const color_oscurecimiento_pantalla = "#22201Fbb";
const fuente_del_texto = "serif";
const tiempo_transicion_entrada = 150;
const duracion_texto = 5000;
const tiempo_transicion_salida_caja = 1000;
const duracion_fondo = 0;
const tiempo_transicion_salida_fondo = 1000;
const duracion_imagenes_bordes = 0;
const tiempo_transicion_salida_imagenes_bordes = 2000;
const tiempo_expansion_circulo_secundario = 1500;
const escala_expansion_circulo_secundario = 1.2;
const ruta_imagen_decoracion_arriba = "/ui/shinedown.avif";
const ruta_imagen_decoracion_abajo = "/ui/shinedown.avif";
const ruta_circulo_magico = "/ui/magiccircle.avif";
const ruta_audio = "/ui/fanfare.ogg";
const volumen_audio = 0.7;
const delay = 1500;

const precargarImagen = (src) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";

        img.onload = async () => {
            try {
                if (typeof img.decode === "function") {
                    await img.decode();
                }
            } catch (e) {}

            resolve(img);
        };

        img.onerror = () => {
            console.warn(`[Fanfarria] No se pudo precargar la imagen: ${src}`);
            resolve(null);
        };

        img.src = src;
    });
};

const precargarAudio = async (src) => {
    if (!src) return null;

    const AudioAPI =
        globalThis.foundry?.audio?.AudioHelper ??
        globalThis.AudioHelper;

    if (AudioAPI?.preloadSound) {
        try {
            return await AudioAPI.preloadSound(src);
        } catch (e) {
            console.warn(`[Fanfarria] No se pudo precargar el audio mediante AudioHelper: ${src}`, e);
        }
    }

    return new Promise((resolve) => {
        const audio = new Audio();
        audio.preload = "auto";

        audio.addEventListener("canplaythrough", () => {
            resolve(audio);
        }, { once: true });

        audio.addEventListener("error", () => {
            console.warn(`[Fanfarria] No se pudo precargar el audio: ${src}`);
            resolve(null);
        }, { once: true });

        audio.src = src;
        audio.load();
    });
};

if (!window.fanfarriaRecursosPrecargados) {
    const imagenes = [...new Set([
        ruta_imagen_decoracion_arriba,
        ruta_imagen_decoracion_abajo,
        ruta_circulo_magico
    ].filter(Boolean))];

    window.fanfarriaRecursosPrecargados = {
        imagenes: Promise.all(imagenes.map(src => precargarImagen(src))),
        audio: precargarAudio(ruta_audio)
    };
}

const mostrarEfecto = async (textoCentral) => {
    const precarga = window.fanfarriaRecursosPrecargados;

    if (precarga) {
        await Promise.all([
            precarga.imagenes.catch(() => []),
            precarga.audio.catch(() => null)
        ]);
    }

    if (ruta_audio) {
        AudioHelper.play(
            {
                src: ruta_audio,
                volume: volumen_audio
            },
            false
        );
    }

    const contenedor = document.createElement("div");
    contenedor.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;z-index:9999;pointer-events:none;background-color:transparent;transition:background-color ${tiempo_transicion_entrada}ms ease-out;`;

    const cuadradoFondo = document.createElement("div");
    cuadradoFondo.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%, -50%) scale(0);width:calc(${altura_del_rectangulo_maxima} * 3);height:calc(${altura_del_rectangulo_maxima} * 3);background-color:${color_tinte_circulo};-webkit-mask-image:url('${ruta_circulo_magico}');-webkit-mask-position:center;-webkit-mask-size:contain;-webkit-mask-repeat:no-repeat;mask-image:url('${ruta_circulo_magico}');mask-position:center;mask-size:contain;mask-repeat:no-repeat;opacity:0;transition:transform ${tiempo_transicion_entrada}ms ease-out, opacity ${tiempo_transicion_entrada}ms ease-out;`;

    const cuadradoFondoSecundario = document.createElement("div");
    cuadradoFondoSecundario.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%, -50%) scale(0);width:calc(${altura_del_rectangulo_maxima} * 3);height:calc(${altura_del_rectangulo_maxima} * 3);background-color:${color_tinte_circulo};-webkit-mask-image:url('${ruta_circulo_magico}');-webkit-mask-position:center;-webkit-mask-size:contain;-webkit-mask-repeat:no-repeat;mask-image:url('${ruta_circulo_magico}');mask-position:center;mask-size:contain;mask-repeat:no-repeat;opacity:0;transition:transform ${tiempo_transicion_entrada}ms ease-out, opacity ${tiempo_transicion_entrada}ms ease-out;`;

    const maskWrapper = document.createElement("div");
    maskWrapper.style.cssText = "position:absolute;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;-webkit-mask-image:linear-gradient(90deg, transparent 0%, transparent 10%, black 15%, black 85%, transparent 90%, transparent 100%);mask-image:linear-gradient(90deg, transparent 0%, transparent 10%, black 15%, black 85%, transparent 90%, transparent 100%);";

    const cajaAnimada = document.createElement("div");
    cajaAnimada.style.cssText = `position:relative;width:100vw;height:0px;background:${color_del_fondo_del_rectangulo};border-top:1px solid ${color_del_borde};border-bottom:1px solid ${color_del_borde};box-sizing:border-box;transition:height ${tiempo_transicion_entrada}ms ease-out, opacity ${tiempo_transicion_entrada}ms ease-out;opacity:0;`;

    const textoWrapper = document.createElement("div");
    textoWrapper.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;";

    const decoracionArriba = document.createElement("div");
    decoracionArriba.style.cssText = "position:absolute;bottom:100%;left:50%;transform:translateX(-50%) scaleY(-1);z-index:10;display:inline-flex;";
    decoracionArriba.innerHTML = `<img src="${ruta_imagen_decoracion_arriba}" style="opacity:0;display:block;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:${color_tinte_imagenes};-webkit-mask-image:url('${ruta_imagen_decoracion_arriba}');-webkit-mask-size:100% 100%;mask-image:url('${ruta_imagen_decoracion_arriba}');mask-size:100% 100%;"></div>`;

    const decoracionAbajo = document.createElement("div");
    decoracionAbajo.style.cssText = "position:absolute;top:100%;left:50%;transform:translateX(-50%);z-index:10;display:inline-flex;";
    decoracionAbajo.innerHTML = `<img src="${ruta_imagen_decoracion_abajo}" style="opacity:0;display:block;"><div style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:${color_tinte_imagenes};-webkit-mask-image:url('${ruta_imagen_decoracion_abajo}');-webkit-mask-size:100% 100%;mask-image:url('${ruta_imagen_decoracion_abajo}');mask-size:100% 100%;"></div>`;

    const elementoTexto = document.createElement("div");
    elementoTexto.innerText = textoCentral;
    elementoTexto.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:80%;color:white;font-size:3rem;text-align:center;text-shadow:0 0 4px black;font-family:${fuente_del_texto};`;

    textoWrapper.appendChild(elementoTexto);
    cajaAnimada.appendChild(decoracionArriba);
    cajaAnimada.appendChild(decoracionAbajo);
    cajaAnimada.appendChild(textoWrapper);
    maskWrapper.appendChild(cajaAnimada);
    contenedor.appendChild(cuadradoFondo);
    contenedor.appendChild(cuadradoFondoSecundario);
    contenedor.appendChild(maskWrapper);
    document.body.appendChild(contenedor);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            contenedor.style.backgroundColor = color_oscurecimiento_pantalla;

            setTimeout(() => {
                cuadradoFondo.style.opacity = "1";
                cuadradoFondo.style.transform = "translate(-50%, -50%) scale(1)";
                cuadradoFondoSecundario.style.opacity = "0.5";
                cuadradoFondoSecundario.style.transform = "translate(-50%, -50%) scale(1)";
                cajaAnimada.style.opacity = "1";
                cajaAnimada.style.height = altura_del_rectangulo_maxima;
            }, delay);
        });
    });

    setTimeout(() => {
        cuadradoFondo.style.transition = `opacity ${tiempo_transicion_salida_fondo}ms ease-out`;
        cuadradoFondo.style.opacity = "0";
    }, delay + tiempo_transicion_entrada + duracion_fondo);

    setTimeout(() => {
        cuadradoFondoSecundario.style.transition = `transform ${tiempo_expansion_circulo_secundario}ms ease-out, opacity ${tiempo_expansion_circulo_secundario}ms ease-out`;
        cuadradoFondoSecundario.style.transform = `translate(-50%, -50%) scale(${escala_expansion_circulo_secundario})`;
        cuadradoFondoSecundario.style.opacity = "0";
    }, delay + tiempo_transicion_entrada);

    setTimeout(() => {
        decoracionArriba.style.transition = `opacity ${tiempo_transicion_salida_imagenes_bordes}ms ease-out`;
        decoracionArriba.style.opacity = "0";
        decoracionAbajo.style.transition = `opacity ${tiempo_transicion_salida_imagenes_bordes}ms ease-out`;
        decoracionAbajo.style.opacity = "0";
    }, delay + tiempo_transicion_entrada + duracion_imagenes_bordes);

    setTimeout(() => {
        cajaAnimada.style.transition = `opacity ${tiempo_transicion_salida_caja}ms ease-out`;
        cajaAnimada.style.opacity = "0";
        contenedor.style.transition = `background-color ${tiempo_transicion_salida_caja}ms ease-out`;
        contenedor.style.backgroundColor = "transparent";

        setTimeout(() => contenedor.remove(), tiempo_transicion_salida_caja);
    }, delay + tiempo_transicion_entrada + duracion_texto);
};

if (game.user.isGM) {
    new Dialog({
        title: "Fanfarria",
        content: `<div style="margin-bottom:10px;"><label style="font-weight:bold;">Texto Central:</label><input type="text" id="texto-efecto" style="width:100%;margin-top:5px;"></div>`,
        buttons: {
            mostrar: {
                label: "Mostrar a jugadores",
                callback: async (html) => {
                    const txt = html.find("#texto-efecto").val();
                    const gmUser = game.users.find(u => u.isGM);

                    if (gmUser) {
                        await gmUser.setFlag("world", "efectoTexto", txt);
                        await gmUser.setFlag("world", "efectoTrigger", Date.now());
                    }

                    mostrarEfecto(txt);
                }
            }
        },
        default: "mostrar"
    }).render(true);
} else {
    if (!window.buclePullEfectoActivo) {
        window.buclePullEfectoActivo = true;
        window.ultimoTriggerConocido = 0;

        setInterval(() => {
            const gmUser = game.users.find(u => u.isGM);

            if (gmUser) {
                const trigger = gmUser.getFlag("world", "efectoTrigger") || 0;
                const txt = gmUser.getFlag("world", "efectoTexto") || "";

                if (trigger > window.ultimoTriggerConocido) {
                    if (window.ultimoTriggerConocido !== 0) {
                        mostrarEfecto(txt);
                    }

                    window.ultimoTriggerConocido = trigger;
                }
            }
        }, 1000);
    }
}
