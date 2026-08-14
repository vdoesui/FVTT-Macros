const COLOR_FUEGO_NUCLEO = [0.5, 1.0, 1.0];
const COLOR_FUEGO_EXTERIOR = [0.2, 0.5, 0.9];
const ALPHA_FUEGO_NUCLEO = 0.9;
const ALPHA_FUEGO_EXTERIOR = 0.5;
const ANGULO_FUEGO_NUCLEO = -0.3;
const ANGULO_FUEGO_EXTERIOR = -0.6;
const SEPARACION_NUCLEO = 0.9;
const DENSIDAD_FUEGO = 0.50;
const SUAVIZADO_FUEGO_NUCLEO = 0.25;
const SUAVIZADO_FUEGO_EXTERIOR = 0.55;
const LONGITUD_BLOOM = 0.55;
const INTENSIDAD_BLOOM = 2.5;
const BLANQUEAMIENTO_LUMINANCIA = 0.7;

const COLOR_TENTACULOS = [0.03, 0.0, 0.08];
const ALPHA_TENTACULOS = 0.78;

const VELOCIDAD_FUEGO_NUCLEO = 0.9;
const VELOCIDAD_FUEGO_EXTERIOR = 1.0;
const VELOCIDAD_TENTACULOS = 0.7;
const ALTURA_FUEGO = 0.4;
const ALTURA_TENTACULOS = 0.6;

let shader = new PIXI.Filter(null, `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec2 filterArea;
    uniform float time;

    uniform vec3 uFireCol1;
    uniform vec3 uFireCol2;
    uniform float uAlphaInner;
    uniform float uAlphaOuter;
    uniform float uFireAngleInner;
    uniform float uFireAngleOuter;
    uniform float uCoreSeparation;
    uniform float uFireDensity;
    uniform float uSmoothInner;
    uniform float uSmoothOuter;
    uniform float uBloomLength;
    uniform float uBloomIntensity;
    uniform float uWhiteLuma;
    
    uniform vec4 uTentacleCol;
    uniform float uFireSpeedInner;
    uniform float uFireSpeedOuter;
    uniform float uTentacleSpeed;
    uniform float uFireHeight;
    uniform float uTentacleHeight;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p) {
        float f = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 6; i++) {
            f += amp * noise(p);
            p *= 2.0;
            amp *= 0.5;
        }
        return f;
    }

    vec2 warp(vec2 p, float t) {
        float n1 = fbm(p + vec2(t * 0.5, t * 0.8));
        float n2 = fbm(p + vec2(-t * 0.4, t * 0.6));
        return p + vec2(n1, n2) * 1.5;
    }

    vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise2(vec2 p) {
        const float K1 = 0.366025404;
        const float K2 = 0.211324865;
        vec2 i = floor(p + (p.x + p.y) * K1);
        vec2 a = p - i + (i.x + i.y) * K2;
        vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec2 b = a - o + K2;
        vec2 c = a - 1.0 + 2.0 * K2;
        vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
        vec3 n = h * h * h * h * vec3(dot(a, hash2(i + 0.0)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));
        return dot(n, vec3(70.0));
    }

    float fbm2(vec2 uv) {
        float f;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        f  = 0.5000 * noise2(uv); uv = m * uv;
        f += 0.2500 * noise2(uv); uv = m * uv;
        f += 0.1250 * noise2(uv); uv = m * uv;
        f += 0.0625 * noise2(uv); uv = m * uv;
        f = 0.5 + 0.5 * f;
        return f;
    }

    void main(void) {
        vec2 uv = vTextureCoord;
        vec4 baseCol = texture2D(uSampler, uv);
        
        float tShadow = time * 0.02 * uTentacleSpeed;
        vec2 shadowUV = uv;
        shadowUV.x *= 4.5;
        vec2 shadowWarp = warp(shadowUV, tShadow * 0.7);
        float shadowDetail = fbm(shadowWarp * 3.5 - vec2(0.0, tShadow * 2.5));
        float shadowBase = smoothstep(1.0 - uTentacleHeight, 1.0, uv.y);
        float shadowMask = smoothstep(0.35, 0.7, shadowDetail * shadowBase);
        float shadowCore = smoothstep(0.55, 0.9, shadowDetail);
        vec3 shadowColor = mix(uTentacleCol.rgb, vec3(0.0), shadowCore);
        float shadowAlpha = shadowMask * uTentacleCol.a;

        float tOuter = time * uFireSpeedOuter * 0.02;
        float tInner = time * uFireSpeedInner * 0.02;
        float scaleBase = max(3.0, 5.0 / max(0.1, uFireHeight));
        float normalizedHeight = (1.0 - uv.y) / uFireHeight;
        
        vec2 stOuter = vec2(uv.x, 1.0 - uv.y);
        stOuter.x += stOuter.y * uFireAngleOuter; 
        vec2 qOuter = stOuter * scaleBase;
        qOuter.x -= tOuter * 1.5;
        qOuter.y -= tOuter * 2.5;
        
        float n_outer = fbm2(qOuter);
        float huecosOuter = fbm2(qOuter * 1.5 + vec2(tOuter, tOuter * 0.5));
        n_outer -= huecosOuter * 0.55; 
        
        float gapNoiseOuter = fbm2(qOuter * 0.5 - vec2(0.0, tOuter * 0.4));
        float gapMaskOuter = smoothstep(1.0 - uFireDensity - 0.1, 1.0 - uFireDensity + 0.3, gapNoiseOuter);
        n_outer -= (1.0 - gapMaskOuter) * 2.0; 
        
        float sdfExterior = n_outer - normalizedHeight;
        float fireAlphaOuter = smoothstep(0.0, max(0.001, uSmoothOuter), sdfExterior) * uAlphaOuter;
        
        vec2 stInner = vec2(uv.x, 1.0 - uv.y);
        stInner.x += stInner.y * uFireAngleInner;
        vec2 qInner = stInner * (scaleBase * 1.2);
        qInner.x -= tInner * 1.2;
        qInner.y -= tInner * 3.0;
        
        float n_inner = fbm2(qInner);
        float huecosInner = fbm2(qInner * 1.8 + vec2(tInner * 1.2));
        n_inner -= huecosInner * 0.45;
        
        float gapNoiseInner = fbm2(qInner * 0.6 - vec2(0.0, tInner * 0.5));
        float gapMaskInner = smoothstep(1.0 - uFireDensity - 0.1, 1.0 - uFireDensity + 0.3, gapNoiseInner);
        n_inner -= (1.0 - gapMaskInner) * 2.0; 
        
        float sdfNucleo = n_inner - (normalizedHeight * uCoreSeparation);
        float fireAlphaInner = smoothstep(0.0, max(0.001, uSmoothInner), sdfNucleo) * uAlphaInner;
        
        float baseFireAlpha = fireAlphaInner + fireAlphaOuter * (1.0 - fireAlphaInner);
        vec3 fireCol = (uFireCol1 * fireAlphaInner + uFireCol2 * fireAlphaOuter * (1.0 - fireAlphaInner)) / max(baseFireAlpha, 0.00001);
        
        float luma = smoothstep(0.0, 0.4, sdfNucleo) * uWhiteLuma;
        fireCol = mix(fireCol, vec3(1.0), luma);

        vec3 finalCol = mix(baseCol.rgb, shadowColor, shadowAlpha);
        finalCol = mix(finalCol, fireCol, baseFireAlpha);
        
        float bloom = pow(smoothstep(-uBloomLength, 0.0, sdfExterior), 1.5) * uBloomIntensity;
        finalCol += uFireCol2 * bloom * (1.0 - baseFireAlpha);

        gl_FragColor = vec4(finalCol, baseCol.a);
    }
`);

let time = 0;
canvas.app.ticker.add((delta) => {
    time += delta;
    shader.uniforms.time = time;
});

shader.uniforms.uFireCol1 = COLOR_FUEGO_NUCLEO;
shader.uniforms.uFireCol2 = COLOR_FUEGO_EXTERIOR;
shader.uniforms.uAlphaInner = ALPHA_FUEGO_NUCLEO;
shader.uniforms.uAlphaOuter = ALPHA_FUEGO_EXTERIOR;
shader.uniforms.uFireAngleInner = ANGULO_FUEGO_NUCLEO;
shader.uniforms.uFireAngleOuter = ANGULO_FUEGO_EXTERIOR;
shader.uniforms.uCoreSeparation = SEPARACION_NUCLEO;
shader.uniforms.uFireDensity = DENSIDAD_FUEGO;
shader.uniforms.uSmoothInner = SUAVIZADO_FUEGO_NUCLEO;
shader.uniforms.uSmoothOuter = SUAVIZADO_FUEGO_EXTERIOR;
shader.uniforms.uBloomLength = LONGITUD_BLOOM;
shader.uniforms.uBloomIntensity = INTENSIDAD_BLOOM;
shader.uniforms.uWhiteLuma = BLANQUEAMIENTO_LUMINANCIA;

shader.uniforms.uTentacleCol = [...COLOR_TENTACULOS, ALPHA_TENTACULOS];
shader.uniforms.uFireSpeedInner = VELOCIDAD_FUEGO_NUCLEO;
shader.uniforms.uFireSpeedOuter = VELOCIDAD_FUEGO_EXTERIOR;
shader.uniforms.uTentacleSpeed = VELOCIDAD_TENTACULOS;
shader.uniforms.uFireHeight = ALTURA_FUEGO;
shader.uniforms.uTentacleHeight = ALTURA_TENTACULOS;

shader.uniforms.filterArea = [canvas.app.renderer.width, canvas.app.renderer.height];
canvas.app.stage.filters = [shader];