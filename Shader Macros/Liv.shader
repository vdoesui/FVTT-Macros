// CONFIGURACIÓN DE IMAGEN
let imgHeightPct = 0.85; 
let imgAnchorX = 0.15;   
let imgFlipH = true;    
let name = "Roy";

// BÚSQUEDA DE TOKEN Y TEXTURA
// BÚSQUEDA EN LISTA DE ACTORES
const targetToken = game.actors.find(a => a.name.includes(name));
let tokenTexture = targetToken ? PIXI.Texture.from(targetToken.prototypeToken.texture.src) : PIXI.Texture.EMPTY;

// Asegurar carga de la textura
if (tokenTexture.valid === false && targetToken) {
    await new Promise(resolve => { 
        tokenTexture = PIXI.Texture.from(targetToken.prototypeToken.texture.src); 
        if(tokenTexture.baseTexture.valid) resolve();
        else tokenTexture.baseTexture.on('loaded', resolve); 
    });
}




let shader = new PIXI.Filter(null, `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec2 filterArea;
    uniform float time;
    uniform float timedDisplace;
    uniform bool applyLights;
    uniform float fadeAmt;
    
    
    // TOKEN UNIFORMS
    uniform sampler2D uTokenSampler;
    uniform vec2 uTokenSize;
    uniform float uImgHeight;
    uniform float uImgAnchor;
    uniform bool uFlipH;
    uniform bool uHasToken;
    uniform bool uShowToken;
    uniform float uTokenOpac;

    vec3 ColorLight = vec3(0.98, 0.76, 0.29);
    vec3 ColorDark = vec3(0.88, 0.48, 0.16);

    vec3 vignette(vec3 color, float strength){
        vec2 uv = vTextureCoord;
        uv -= vec2(0.5);
        float dToCenter = length(uv);
        color = color*(1.0 - dToCenter)*strength;
        return color;
    }

    vec3 Displace(vec3 finalcolor, float verticalDisplacement){
        if(verticalDisplacement == 0.0){
            return finalcolor;
        }else{
            vec2 displacedUV = vTextureCoord;
            displacedUV.y += verticalDisplacement;
            displacedUV.y = mod(displacedUV.y, 1.0);
            vec4 displacedColor = texture2D(uSampler, displacedUV);
            vec3 displacedColorrgb = vignette(displacedColor.rgb, 1.0);
            return displacedColorrgb;
        }
    }

    vec3 applyLight(vec3 originalColor, vec2 lightPosition, float radius, vec3 lightColor) {
        vec2 uv = vTextureCoord;
        float distanceToLight = distance(uv, lightPosition);
        float intensity = smoothstep(0.0, radius, distanceToLight);
        return mix(lightColor, originalColor, intensity);
    }

    vec3 posterize(vec3 color){
        //get lightness accurately
        float increaseBrightness = 0.0;
        float increateContrast = 0.0;

        //increase contrast
        color = ((color - 0.5) * (1.0 + increateContrast)) + 0.5;
        color = clamp(color, 0.0, 1.0);

        float lightness = min(((max(max(color.r, color.g), color.b) + min(min(color.r, color.g), color.b)) / 2.0) + increaseBrightness, 1.0);
        
        if(lightness > 0.2 && lightness <= 0.6){
            return vec3(ColorLight);
        }else{
            return vec3(ColorDark);
        }


    }

    void main(void) {
        vec2 uv = vTextureCoord;
        vec4 baseColor = texture2D(uSampler, vTextureCoord);
        vec3 finalColor = baseColor.rgb;
        finalColor = posterize(finalColor);
        
        
        // 1. Efecto
        finalColor = Displace(finalColor, timedDisplace * time);

        // 2. Luces
        if(applyLights){
            finalColor = applyLight(finalColor, vec2(0.5, 1.1), 0.5, vec3(0.0, 0.9, 0.5));
            finalColor = applyLight(finalColor, vec2(0.9, 0.8), 0.4, vec3(0.0, 1.0, 0.7));
            finalColor = applyLight(finalColor, vec2(0.95, 1.0), 0.3, vec3(0.0, 1.0, 0.4));
            finalColor = applyLight(finalColor, vec2(0.8, 0.7), 0.07, vec3(0.0, 0.9, 0.9));
            finalColor = applyLight(finalColor, vec2(0.81, 0.69), 0.02, vec3(0.0, 0.7, 0.9));
            finalColor = applyLight(finalColor, vec2(0.75, 0.7), 0.05, vec3(0.0, 0.9, 0.9));
            finalColor = applyLight(finalColor, vec2(0.74, 0.69), 0.01, vec3(0.0, 0.7, 0.9));
            finalColor = applyLight(finalColor, vec2(0.95, 0.5), 0.17, vec3(0.0, 0.9, 0.9));
            finalColor = applyLight(finalColor, vec2(0.6, 0.9), 0.08, vec3(0.0, 0.9, 0.9));
            finalColor = applyLight(finalColor, vec2(0.59, 0.89), 0.03, vec3(0.0, 0.7, 0.9));
        }
        
        // 3. FADE BACKGROUND (Antes del token)
        finalColor = mix(finalColor, baseColor.rgb, fadeAmt);

        // 4. Renderizado del Token
        if (uHasToken && uShowToken) {
            
            float screenRatio = filterArea.x / filterArea.y;
            float tokenRatio = uTokenSize.x / uTokenSize.y;
            float h = uImgHeight; 
            float w = h * (tokenRatio / screenRatio);
            vec2 offset = vec2(uImgAnchor - (w * 0.5), 1.0 - h);
            
            vec2 tokenUV = (uv - offset) / vec2(w, h);
            if (uFlipH) tokenUV.x = 1.0 - tokenUV.x;
            
            if (tokenUV.x >= 0.0 && tokenUV.x <= 1.0 && tokenUV.y >= 0.0 && tokenUV.y <= 1.0) {
                vec4 tokenColor = texture2D(uTokenSampler, tokenUV);
                // Multiplicamos alpha del token por uTokenOpac
                finalColor = mix(finalColor, tokenColor.rgb, tokenColor.a * uTokenOpac);
            }
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`);

// Asignación de Uniforms
shader.uniforms.timedDisplace = 0.001;
shader.uniforms.applyLights = false;
shader.uniforms.fadeAmt = 0.0;
shader.uniforms.uTokenSampler = tokenTexture;
shader.uniforms.uTokenSize = [tokenTexture.width, tokenTexture.height];
shader.uniforms.uImgHeight = imgHeightPct;
shader.uniforms.uImgAnchor = imgAnchorX;
shader.uniforms.uFlipH = imgFlipH;
shader.uniforms.uHasToken = !!targetToken;
shader.uniforms.uShowToken = false;
shader.uniforms.uTokenOpac = 1.0; 

let boolTwistedTD = false;
let doneMoving = false;
let finished = false;
let displaceCap = 0.5;
let time = 0;
let timerFade = 0;

if(!finished){
canvas.app.ticker.add((delta) => {
    if(!finished){
        time += delta;
        shader.uniforms.time = time;

        if(!doneMoving){
            if(shader.uniforms.timedDisplace > displaceCap){
                boolTwistedTD = true;
            }
            if(shader.uniforms.timedDisplace <= 0.0){
                    shader.uniforms.timedDisplace = 0.0;
                    doneMoving = true;
                    shader.uniforms.fadeAmt = 0.2; 
            }else
            if(shader.uniforms.timedDisplace > 0.0){
                if(boolTwistedTD){
                    shader.uniforms.timedDisplace -= 0.014;
                }else{
                    shader.uniforms.timedDisplace += 0.02;
                }
            }
        }else{
            shader.uniforms.applyLights = true;
            shader.uniforms.uShowToken = true;
            
            timerFade += delta;
            
            // FASE DE FINALIZACIÓN
            if(timerFade > 50){
                // Restaurar fondo
                if(shader.uniforms.fadeAmt < 1.0){
                    shader.uniforms.fadeAmt += 0.01;
                }
                // Desvanecer Token
                if(shader.uniforms.uTokenOpac > 0.0){
                    shader.uniforms.uTokenOpac -= 0.01; 
                }
            }
            
            // CORRECCIÓN: Solo terminar si AMBOS han terminado
            if(shader.uniforms.fadeAmt >= 1.0 && shader.uniforms.uTokenOpac <= 0.0){
                finished = true;
            }
        }
    }
});}
shader.uniforms.filterArea = [canvas.app.renderer.width, canvas.app.renderer.height];
canvas.app.stage.filters = [shader];
AudioHelper.play({
    src: "https://raw.githubusercontent.com/venomweb99/FVTT-Macros/main/Res/DiscoElisium.mp3",
    volume: 0.6,
    autoplay: true,
    loop: false
});