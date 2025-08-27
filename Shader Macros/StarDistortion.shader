let shader = new PIXI.Filter(null, `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float strength;
uniform float pinch;
uniform float progress;
uniform float time;
uniform float targetSize;
uniform float sinSpeed;
uniform float sinMult;
uniform vec2 aspect;
uniform float bloomThreshold;
uniform float bloomStrength;
uniform float bloomRadius;  // New: control blur radius

vec2 pinchFunc(vec2 uv, vec2 c, float p){
    vec2 d = uv - c;
    vec2 border = c + normalize(d);
    return mix(uv, border, p);
}

vec2 fisheye(vec2 uv, vec2 c, float s){
    vec2 d = uv - c;
    float r = length(d);
    float nr = r + s * r * r;
    return c + normalize(d) * nr;
}

vec3 applyOrange(vec3 color){
    float intensity = max(max(color.r, color.g), color.b);
    return vec3(intensity, min(intensity * color.g * 0.65, 1.0), 0.0);
}

float astroidDistance(vec2 uv, vec2 center){
    vec2 adj = uv - center;
    adj.y *= aspect.y / aspect.x;
    float x = abs(adj.x);
    float y = abs(adj.y);
    float r = pow(pow(x, 2.0/3.0) + pow(y, 2.0/3.0), 1.5);
    return r;
}

vec3 computeFinalColor(vec2 uvCoord) {
    vec2 c = vec2(0.5);
    float dist = distance((uvCoord - c) * vec2(1.0, aspect.y / aspect.x), vec2(0.0));
    float offset = dist * 0.005;

    vec2 uv1 = pinchFunc(uvCoord, c, pinch);
    vec2 uv2 = fisheye(uv1, c, strength);

    vec4 colR = texture2D(uSampler, uv2 + vec2(offset, 0.0));
    vec4 colG = texture2D(uSampler, uv2);
    vec4 colB = texture2D(uSampler, uv2 - vec2(offset, 0.0));
    vec4 col = vec4(colR.r, colG.g, colB.b, 1.0);

    vec3 baseColor = col.rgb;
    vec3 orange = applyOrange(baseColor);

    float maxDist = length(vec2(0.5, 0.5) * vec2(1.0, aspect.y / aspect.x));
    float smoothSpread = smoothstep(0.0, 1.0, progress);
    float spreadDist = smoothSpread * (maxDist * 1.15);
    float fadeFactor = smoothstep(spreadDist, spreadDist - 0.15, dist);
    vec3 fadedColor = mix(baseColor, orange, fadeFactor);

    float size = progress * targetSize;
    size += sinMult * 0.01 * sin(time * sinSpeed);

    float adist = astroidDistance(uvCoord, c);
    float edgeGlow = smoothstep(size + 0.002, size - 0.002, adist);
    float glowFalloff = 1.0 - smoothstep(size, size + 0.03, adist);
    vec3 glowColor = vec3(1.0, 0.5, 0.0) * glowFalloff * 2.0;

    vec3 finalColor = mix(fadedColor, glowColor, glowFalloff);
    finalColor = mix(finalColor, vec3(1.0), edgeGlow);

    return finalColor;
}

// Improved bloom function with radius control
vec3 applyBloom(vec2 uv, vec3 centerColor) {
    vec2 texelSize = 1.0 / aspect;
    vec2 step = texelSize * bloomRadius;
    
    // Optimized 9-tap Gaussian kernel
    vec3 bloomSum = vec3(0.0);
    float weights = 0.0;
    
    // Sample in a plus pattern with radius scaling
    for (float y = -2.0; y <= 2.0; y++) {
        for (float x = -2.0; x <= 2.0; x++) {
            // Skip center sample (we already have it)
            if (x == 0.0 && y == 0.0) continue;
            
            vec2 offset = vec2(x, y) * step;
            vec3 sampleColor = computeFinalColor(uv + offset);
            
            // Distance-based weighting
            float dist = length(vec2(x, y));
            float weight = exp(-dist * dist / 2.0);
            
            bloomSum += sampleColor * weight;
            weights += weight;
        }
    }
    
    vec3 bloomBlur = bloomSum / weights;
    vec3 brightAreas = max(bloomBlur - bloomThreshold, 0.0);
    
    return brightAreas * bloomStrength;
}

void main() {
    vec2 uv = vTextureCoord;
    vec3 centerColor = computeFinalColor(uv);
    
    // Apply bloom effect
    vec3 bloom = applyBloom(uv, centerColor);
    vec3 finalColor = centerColor + bloom;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`);

// Initialize uniforms
shader.uniforms.strength = 0;
shader.uniforms.pinch = 0;
shader.uniforms.progress = 0;
shader.uniforms.time = 0;
shader.uniforms.targetSize = 0.02;
shader.uniforms.sinSpeed = 19.0;
shader.uniforms.sinMult = 0.1;
shader.uniforms.aspect = [canvas.app.renderer.width, canvas.app.renderer.height];
shader.uniforms.bloomThreshold = 0.3;

let elapsed = 0;
canvas.app.ticker.add((delta) => {
    elapsed += delta * (1000 / 60);
    let t = Math.min(elapsed / 10000, 1);
    shader.uniforms.pinch = t;
    shader.uniforms.strength = -1.5 * t;
    shader.uniforms.progress = Math.min(elapsed / 1000, 1);
    shader.uniforms.time = elapsed / 1000;
    shader.uniforms.bloomRadius = 21.0 * t;
    shader.uniforms.bloomStrength = 0.9 * t;
});
canvas.app.stage.filters = [shader];