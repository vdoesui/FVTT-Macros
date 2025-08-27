let shader = new PIXI.Filter(null, `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec2 filterArea;
    uniform float time;
    uniform float expansionSpeed;
    uniform float edgeSmoothing;
    uniform float acceleration;
    uniform float zoomLevel;

    vec4 invertColors(vec4 color) {
        return vec4(1.0 - color.rgb, color.a);
    }
    
    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    
    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    vec4 cyanBlueCorrection(vec4 color) {
        vec3 hsv = rgb2hsv(color.rgb);
        float hue = hsv.x;
        float saturation = hsv.y;
        float value = hsv.z;
        
        float wave = sin(hue * 6.28318);
        float targetHue = 0.5 + (wave * 0.085) + 0.085;
        hsv.x = targetHue;
        
        return vec4(hsv2rgb(hsv), color.a);
    }

    void main(void) {
        vec2 uv = vTextureCoord;
        vec2 px = vec2(1.0 / filterArea.x, 1.0 / filterArea.y);
        vec2 center = vec2(0.5, 0.5);
        
        vec2 zoomedUV = center + (uv - center) / zoomLevel;
        
        float aspectRatio = filterArea.x / filterArea.y;
        vec2 aspectCorrectedUV = zoomedUV;
        aspectCorrectedUV.x *= aspectRatio;
        vec2 aspectCorrectedCenter = center;
        aspectCorrectedCenter.x *= aspectRatio;
        
        float distanceFromCenter = distance(aspectCorrectedCenter, aspectCorrectedUV);
        vec4 originalColor = texture2D(uSampler, zoomedUV);
        
        float maxDistance = distance(aspectCorrectedCenter, vec2(0.0, 0.0));
        float currentSpeed = expansionSpeed + (time * acceleration);
        float expandRadius = (time * currentSpeed) * maxDistance;
        
        float smoothEdge = smoothstep(expandRadius - edgeSmoothing, expandRadius + edgeSmoothing, distanceFromCenter);
        
        vec4 invertedColor = invertColors(originalColor);
        vec4 correctedColor = cyanBlueCorrection(invertedColor);
        
        vec4 finalColor = mix(correctedColor, originalColor, smoothEdge);
        
        gl_FragColor = vec4(finalColor.rgb, finalColor.a);
    }
`);

let time = 0;
let zoomInSpeed = 40.0;
let zoomOutSpeed = 0.1;
let zoomPhaseTransition = 5;
let zoomPhase = 0;
let zoomStartTime = 0;
let currentZoom = 1.0;

function easeIn(t) {
    return Math.pow(t, 1.3);
}

function easeOut(t) {
    return 1 - Math.pow(1 - t, 2);
}

canvas.app.ticker.add((delta) => {
    time += delta;
    
    if (zoomPhase === 0) {
        let progress = 1.0 - Math.exp(-time * zoomInSpeed * 0.016);
        currentZoom = 1.0 + easeIn(progress);
        if (time > zoomPhaseTransition) {
            zoomPhase = 1;
            zoomStartTime = time;
        }
    } else if (zoomPhase === 1) {
        let zoomOutProgress = (time - zoomStartTime) * zoomOutSpeed * 0.016;
        let easedProgress = easeOut(Math.min(1.0, zoomOutProgress));
        currentZoom = Math.max(1.0, currentZoom - easedProgress);
    }
    
    shader.uniforms.time = time;
    shader.uniforms.zoomLevel = currentZoom;
});
shader.uniforms.filterArea = [canvas.app.renderer.width, canvas.app.renderer.height];
shader.uniforms.expansionSpeed = 0.01;
shader.uniforms.edgeSmoothing = 0.001;
shader.uniforms.acceleration = 0.003;
shader.uniforms.zoomLevel = 1.0;
canvas.app.stage.filters = [shader];