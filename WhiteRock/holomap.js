const THREE = await import('https://esm.sh/three@0.180.0');
const { OrbitControls } = await import('https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js');
const { CSS2DRenderer, CSS2DObject } = await import('https://esm.sh/three@0.180.0/examples/jsm/renderers/CSS2DRenderer.js');
const { EffectComposer } = await import('https://esm.sh/three@0.180.0/examples/jsm/postprocessing/EffectComposer.js');
const { RenderPass } = await import('https://esm.sh/three@0.180.0/examples/jsm/postprocessing/RenderPass.js');
const { UnrealBloomPass } = await import('https://esm.sh/three@0.180.0/examples/jsm/postprocessing/UnrealBloomPass.js');
const BufferGeometryUtils = await import('https://esm.sh/three@0.180.0/examples/jsm/utils/BufferGeometryUtils.js');

class HolomapaApp extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "holomapa-app",
      title: "Mapa de las instalaciones",
      width: window.innerWidth * 0.5,
      height: window.innerHeight * 0.6,
      resizable: true,
      minimizable: true
    });
  }

  async _renderInner(data) {
    const html = document.createElement("div");
    html.innerHTML = `
      <style>
        #hm-wrap { --a-hex:#ffa500; --a-rgb:255,165,0; width:100%; height:100%; position:relative; overflow:hidden; background:#090502; font-family:"DOS"; color:#ffeadb; }
        #hm-wrap:before { content:""; position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(to bottom,rgba(255,255,255,.018) 0,rgba(255,255,255,.018) 1px,transparent 1px,transparent 4px); mix-blend-mode:screen; z-index:20; opacity:.35; }
        #hm-wrap:after { content:""; position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at center,transparent 45%,rgba(0,0,0,.38) 100%); z-index:19; }
        #hm-wrap #scene { position:absolute; inset:0; }
        #hm-wrap #hud { position:absolute; inset:0; pointer-events:none; }
        #hm-wrap #tooltip { position:absolute; z-index:30; min-width:190px; max-width:250px; padding:9px 10px; background:rgba(12,6,2,.96); border:1px solid rgba(var(--a-rgb),.5); box-shadow:0 0 25px rgba(var(--a-rgb),.14); pointer-events:none; display:none; }
        #hm-wrap #tooltip .t { font-size:10px; letter-spacing:.16em; color:var(--a-hex); }
        #hm-wrap #tooltip .n { font-size:15px; margin-top:3px; color:#fff8f3; font-weight:700; letter-spacing:.05em; }
        #hm-wrap #tooltip .d { font-size:10px; margin-top:5px; color:#ab9382; line-height:1.45; }
        #hm-wrap .room-label { font-family:"DOS"; font-weight:700; letter-spacing:.12em; font-size:10px; color:#fff4ec; text-shadow:0 0 2px #1a0a00,0 0 9px rgba(var(--a-rgb),.95); white-space:nowrap; transform:translate(-50%,-50%); pointer-events:none; opacity:.98; padding:5px 7px; background:rgba(13,7,1,.68); border:1px solid rgba(var(--a-rgb),.26); box-shadow:0 0 18px rgba(var(--a-rgb),.09); backdrop-filter:blur(4px); }
        #hm-wrap .room-label .tag { font-size:8px; color:rgba(var(--a-rgb),.8); letter-spacing:.16em; margin-top:2px; }
        #hm-wrap #crosshair { position:absolute; left:50%; top:50%; width:18px; height:18px; transform:translate(-50%,-50%); opacity:.35; }
        #hm-wrap #crosshair:before, #hm-wrap #crosshair:after { content:""; position:absolute; background:rgba(var(--a-rgb),.8); }
        #hm-wrap #crosshair:before { left:8px; top:0; width:1px; height:18px; }
        #hm-wrap #crosshair:after { left:0; top:8px; width:18px; height:1px; }
        #hm-wrap #sectorSelCont { position:absolute; top:18px; left:18px; z-index:40; pointer-events:auto; display:flex; gap:7px; }
        #hm-wrap select { background:rgba(18,10,3,.86); color:#efd6bd; border:1px solid rgba(var(--a-rgb),.2); padding:5px; font-family:inherit; outline:none; text-transform:uppercase; font-size:12px; cursor:pointer; }
      </style>
      <div id="hm-wrap">
        <div id="scene"></div>
        <div id="hud">
          <div id="sectorSelCont">
            <select id="sectorSel">
              <option value="a">Sector A</option>
              <option value="b">Sector B</option>
              <option value="c">Sector C</option>
              <option value="d">Sector D</option>
              <option value="e">Sector E</option>
              <option value="f">Sector F</option>
              <option value="g">Sector G</option>
              <option value="h">Sector H</option>
              <option value="i">Sector I</option>
              <option value="j">Sector J</option>
            </select>
          </div>
        </div>
        <div id="tooltip"><div class="t" id="ttClass">NODO</div><div class="n" id="ttName">SALA</div><div class="d" id="ttDesc">—</div></div>
        <div id="crosshair"></div>
      </div>
    `;
    return $(html);
  }

  activateListeners(html) {
    super.activateListeners(html);
    const wrap = html[0].querySelector('#hm-wrap');
    
    const LAYER_STEP = 1.65;
    const palette = { black:[0,0,0], white:[255,255,255], blue:[0,0,255], yellow:[255,255,0], red:[255,0,0], cyan:[0,255,255], green:[0,255,0] };
    const style = {
      cyan:{label:'TRÁNSITO', color:0x00e6ff, height:.34, mat:0.8},
      yellow:{label:'INVESTIGACIÓN', color:0xffd84d, height:.88, mat:0.86},
      blue:{label:'SEGURIDAD', color:0x3d7fff, height:.70, mat:0.82},
      red:{label:'MÉDICO', color:0xff4d55, height:.62, mat:0.83},
      white:{label:'GENERAL', color:0xd6ecf0, height:.08, mat:0.25},
      green:{label:'ASCENSOR', color:0xd6ecf0, height:.08, mat:0.25}
    };

    let logical = null;
    let nodes = [];
    let allInteractive = [];
    let hovered = null;
    const accentColor = '#ffa500';
    let customNames = null;
    this.animFrame = null;

    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090502);
    scene.fog = new THREE.FogExp2(0x090502, 0.015);

    const camera = new THREE.PerspectiveCamera(44, cw/ch, .1, 400);
    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(cw, ch);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    wrap.querySelector('#scene').appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(cw, ch);
    labelRenderer.domElement.style.position='absolute';
    labelRenderer.domElement.style.inset='0';
    labelRenderer.domElement.style.pointerEvents='none';
    wrap.querySelector('#scene').appendChild(labelRenderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene,camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(cw,ch),0.15,0.75,0.15);
    composer.addPass(bloom);

    const controls = new OrbitControls(camera,renderer.domElement);
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.dampingFactor = .075;
    controls.rotateSpeed = .72;
    controls.zoomSpeed = .8;
    controls.minDistance = 3;
    controls.maxDistance = 140;
    controls.maxPolarAngle = Math.PI;
    controls.minPolarAngle = .08;

    const accentCol = new THREE.Color(accentColor);
    const ambient = new THREE.HemisphereLight(accentCol.clone().lerp(new THREE.Color(0xffffff), 0.5),0x0a0400,1.35);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(accentCol.clone().lerp(new THREE.Color(0xffffff), 0.8),2.6);
    key.position.set(12,22,10);
    scene.add(key);
    const fill = new THREE.PointLight(accentCol,60,34,2);
    fill.position.set(0,7,0);
    scene.add(fill);

    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function rgbDist(a,b){
      const dr=a[0]-b[0], dg=a[1]-b[1], db=a[2]-b[2];
      return Math.sqrt(dr*dr+dg*dg+db*db);
    }

    function classify(r,g,b){
      const a=[r,g,b];
      let best='black', d=Infinity;
      for(const [k,v] of Object.entries(palette)){
        const dd=rgbDist(a,v); if(dd<d){d=dd;best=k;}
      }
      return d < 165 ? best : 'black';
    }

    function decodeImage(img){
      const c=document.createElement('canvas');
      c.width=img.naturalWidth||img.width; c.height=img.naturalHeight||img.height;
      const ctx=c.getContext('2d',{willReadFrequently:true});
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(img,0,0);
      const data=ctx.getImageData(0,0,c.width,c.height).data;
      const cells=[];
      for(let y=0;y<c.height;y++){
        const row=[];
        for(let x=0;x<c.width;x++){
          const i=(y*c.width+x)*4;
          row.push(classify(data[i],data[i+1],data[i+2]));
        }
        cells.push(row);
      }
      return {w:c.width,h:c.height,cells,canvas:c};
    }

    function connectedComponents(cells,w,h,category){
      const seen=new Uint8Array(w*h), out=[];
      const q=[];
      for(let y=0;y<h;y++) for(let x=0;x<w;x++){
        const idx=y*w+x;
        if(seen[idx] || cells[y][x]!==category) continue;
        seen[idx]=1; q.length=0; q.push([x,y]);
        const pts=[];
        while(q.length){
          const [cx,cy]=q.pop(); pts.push([cx,cy]);
          const ns=[[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]];
          for(const [nx,ny] of ns){
            if(nx<0||nx>=w||ny<0||ny>=h) continue;
            const ni=ny*w+nx;
            if(seen[ni] || cells[ny][nx]!==category) continue;
            seen[ni]=1; q.push([nx,ny]);
          }
        }
        out.push(pts);
      }
      return out;
    }

    function roomName(category,count,bbox){
      const w = bbox[2]-bbox[0]+1;
      const h = bbox[3]-bbox[1]+1;
      if(customNames && customNames[category] && customNames[category].length > 0) {
        const actual = [w, h].sort((a,b)=>a-b);
        let best = null;
        let bestDist = Infinity;
        for(const def of customNames[category]) {
          const defDims = [def.w, def.h].sort((a,b)=>a-b);
          const dist = Math.abs(actual[0]-defDims[0]) + Math.abs(actual[1]-defDims[1]);
          if(dist < bestDist) {
            bestDist = dist;
            best = def.name;
          }
        }
        if(best) return best;
      }
      const area=w*h;
      if(category==='yellow') return count>=8 || area>=9 ? 'CÁMARA DE PRUEBAS' : (count>=4 ? 'LAB. DE INVESTIGACIÓN' : 'LAB. DE ANÁLISIS');
      if(category==='blue') return count>=12 || area>=12 ? 'OPERACIONES DE SEGURIDAD' : (count>=6 ? 'CONTROL DE SEGURIDAD' : 'ESTACIÓN DE SEGURIDAD');
      if(category==='red') return count>=8 || area>=9 ? 'ALA MÉDICA' : (count>=4 ? 'CLÍNICA' : 'BAHÍA MÉDICA');
      if(category==='cyan') return count>=6 || area>=6 ? 'CENTRO DE TRÁNSITO' : (count>=3 ? 'PLATAFORMA DE TRANVÍA' : 'ACCESO DE TRÁNSITO');
      return 'GENERAL';
    }

    function nodeDescription(category,count,bbox){
      const [minX,minY,maxX,maxY]=bbox;
      const span=`${maxX-minX+1}×${maxY-minY+1}`;
      const desc={yellow:'Infraestructura de investigación / pruebas',blue:'Controles de seguridad e instalaciones',red:'Infraestructura de soporte médico',cyan:'Infraestructura de tránsito interno / tranvía'}[category];
      return `${desc} · área ${span} · ${count} píxel${count===1?' lógico':'es lógicos'}`;
    }

    function clearGroup(){
      while(mapGroup.children.length){
        const obj=mapGroup.children[mapGroup.children.length-1];
        mapGroup.remove(obj);
        obj.traverse(o=>{
          if(o.geometry) o.geometry.dispose();
          if(o.material){ if(Array.isArray(o.material)) o.material.forEach(m=>m.dispose()); else o.material.dispose(); }
        });
      }
      nodes=[]; allInteractive=[]; hovered=null;
      wrap.querySelector('#tooltip').style.display='none';
    }

    function createMat(color,opacity=1,emissiveIntensity=.2,transparent=false){
      return new THREE.MeshStandardMaterial({
        color,
        roughness:.45,
        metalness:.55,
        emissive:color,
        emissiveIntensity,
        transparent,
        opacity,
        side:THREE.DoubleSide
      });
    }

    function buildMap(parsedOrLayers){
      const layers=Array.isArray(parsedOrLayers) ? parsedOrLayers : [parsedOrLayers];
      if(!layers.length) return;
      const w=layers[0].w, h=layers[0].h;
      logical={layers,w,h};
      clearGroup();

      const layerComps = [];
      for(let li=0; li<layers.length; li++){
        const comps = [];
        for(const cat of Object.keys(palette)){
          if(cat==='black') continue;
          const ptsGroups = connectedComponents(layers[li].cells, w, h, cat);
          for(const pts of ptsGroups){
            const hash = pts.map(p=>p[0]+'_'+p[1]).sort().join('|');
            comps.push({ cat, pts, hash, merged: false });
          }
        }
        layerComps.push(comps);
      }

      const mergedComps = [];
      for(let li=0; li<layers.length; li++){
        for(const comp of layerComps[li]){
          if(comp.merged) continue;
          const mComp = { cat: comp.cat, pts: comp.pts, startLi: li, endLi: li };
          comp.merged = true;
          let currentHash = comp.hash;
          for(let nextLi = li+1; nextLi < layers.length; nextLi++){
            const nextComp = layerComps[nextLi].find(c => !c.merged && c.cat === comp.cat && c.hash === currentHash);
            if(nextComp){
              nextComp.merged = true;
              mComp.endLi = nextLi;
            } else {
              break;
            }
          }
          mergedComps.push(mComp);
        }
      }

      for(const mComp of mergedComps){
        const cat = mComp.cat;
        const s = style[cat];
        const startLi = mComp.startLi;
        const endLi = mComp.endLi;

        const top = (layers.length - 1 - startLi) * LAYER_STEP + s.height;
        const bottom = (layers.length - 1 - endLi) * LAYER_STEP;
        const offsetX=(w-1)/2, offsetZ=(h-1)/2;

        const baseCol = new THREE.Color(s.color);
        const cellColor = baseCol.clone().lerp(new THREE.Color(accentColor), 0.35);

        const isGeneral = (cat === 'white' || cat === 'green');
        const mat = createMat(cellColor, 0.15, isGeneral ? 0.05 : s.mat, true);

        const positions = [];
        const indices = [];
        let vIdx = 0;
        const ptSet = new Set(mComp.pts.map(p => `${p[0]},${p[1]}`));

        function addQuad(p1, p2, p3, p4) {
          positions.push(...p1, ...p2, ...p3, ...p4);
          indices.push(vIdx, vIdx+1, vIdx+2, vIdx, vIdx+2, vIdx+3);
          vIdx += 4;
        }

        for(const [x,y] of mComp.pts) {
          const cx = x - offsetX;
          const cz = y - offsetZ;
          const left = cx - 0.5, right = cx + 0.5;
          const back = cz - 0.5, front = cz + 0.5;

          const tlb = [left, top, back], trb = [right, top, back], tlf = [left, top, front], trf = [right, top, front];
          const blb = [left, bottom, back], brb = [right, bottom, back], blf = [left, bottom, front], brf = [right, bottom, front];

          addQuad(tlf, trf, trb, tlb);
          addQuad(blb, brb, brf, blf);

          if(!ptSet.has(`${x-1},${y}`)) addQuad(tlb, blb, blf, tlf);
          if(!ptSet.has(`${x+1},${y}`)) addQuad(trf, brf, brb, trb);
          if(!ptSet.has(`${x},${y-1}`)) addQuad(trb, brb, blb, tlb);
          if(!ptSet.has(`${x},${y+1}`)) addQuad(tlf, blf, brf, trf);
        }

        let geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setIndex(indices);
        geom = BufferGeometryUtils.mergeVertices(geom);
        geom.computeVertexNormals();

        const mesh = new THREE.Mesh(geom, mat);

        let node = null;
        if (!isGeneral) {
          let minX=w,maxX=0,minY=h,maxY=0,sx=0,sy=0;
          for(const [x,y] of mComp.pts){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);sx+=x;sy+=y;}
          const bbox=[minX,minY,maxX,maxY];
          const count=mComp.pts.length;
          const name=roomName(cat,count,bbox);
          const centerX=sx/count-offsetX, centerZ=sy/count-offsetZ;

          const cx=centerX, cz=centerZ;
          let dx=cx/(Math.max(w,h)*.5+1), dz=cz/(Math.max(w,h)*.5+1);
          if(Math.abs(dx)+Math.abs(dz)<.18){
            const a=(startLi*2%8)/8*Math.PI*2;
            dx=Math.cos(a); dz=Math.sin(a);
          }
          const mag=Math.max(.001,Math.hypot(dx,dz)); dx/=mag; dz/=mag;
          const span=Math.max(bbox[2]-bbox[0]+1,bbox[3]-bbox[1]+1);
          const offset=1.8+Math.min(4.2,span*.42);
          const labelX=cx+dx*offset;
          const labelZ=cz+dz*offset;
          const labelY=top+1.0+Math.min(1.5,span*.12);

          const anchor=new THREE.Vector3(cx,top+.18,cz);
          const target=new THREE.Vector3(labelX,labelY,labelZ);
          const connector=new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([anchor,target]),
            new THREE.LineBasicMaterial({color:cellColor,transparent:true,opacity:.82,depthWrite:false,depthTest:false})
          );
          connector.visible=true;
          mapGroup.add(connector);

          const layerStr = startLi === endLi ? String(startLi+1).padStart(2,'0') : `${String(endLi+1).padStart(2,'0')}-${String(startLi+1).padStart(2,'0')}`;
          const labelDiv=document.createElement('div');
          labelDiv.className='room-label';
          labelDiv.innerHTML=`<div>${name}</div><div class="tag">${style[cat].label} // C ${layerStr}</div>`;
          const label=new CSS2DObject(labelDiv);
          label.position.copy(target);
          label.visible=true;
          mapGroup.add(label);

          node = { category: cat, count, bbox, name, label, connector, pts: mComp.pts, center: [cx,cz], layerIndex: layerStr };
          nodes.push(node);
        }

        mesh.userData = { category: cat, isCell: false, cellColor };
        if (node) mesh.userData.node = node;
        mapGroup.add(mesh);

        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geom), new THREE.LineBasicMaterial({color: cellColor, transparent: true, opacity: 1.0, linewidth: isGeneral ? 2 : 4}));
        edge.userData.cellMesh = mesh;
        mapGroup.add(edge);
        mesh.userData.edge = edge;

        allInteractive.push(mesh);
      }

      fitCamera(w,h,layers.length);
    }

    function fitCamera(w,h,layerCount=1){
      const span=Math.max(w,h);
      camera.position.set(span*.80,Math.max(4,span*.88+layerCount*.7),span*.92);
      controls.target.set(0,Math.max(.35,(layerCount-1)*LAYER_STEP*.52),0);
      controls.update();
      camera.far=Math.max(400,span*7+layerCount*8);
      camera.updateProjectionMatrix();
    }

    function showTooltip(node,x,y){
      const tt=wrap.querySelector('#tooltip');
      wrap.querySelector('#ttClass').textContent=`NODO DE ${style[node.category].label}`;
      wrap.querySelector('#ttName').textContent=node.name;
      wrap.querySelector('#ttDesc').textContent=nodeDescription(node.category,node.count,node.bbox);
      tt.style.display='block';
      const rect=wrap.getBoundingClientRect();
      tt.style.left=Math.min(rect.width-265,Math.max(12,x-rect.left+14))+'px';
      tt.style.top=Math.min(rect.height-100,Math.max(12,y-rect.top+14))+'px';
    }

    function hideTooltip(){wrap.querySelector('#tooltip').style.display='none'}

    function highlight(mesh,on){
      const m=mesh.material;
      const cat=mesh.userData.category;
      if(m && m.emissiveIntensity!==undefined) m.emissiveIntensity=on?1.55:((cat==='white'||cat==='green')?0.05:style[cat].mat);
      if(mesh.userData.edge) {
        mesh.userData.edge.material.color.setHex(on ? 0xffffff : mesh.userData.cellColor.getHex());
      }
    }

    function pointerMove(e){
      const rect = wrap.getBoundingClientRect();
      pointer.x=((e.clientX-rect.left)/rect.width)*2-1; pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(pointer,camera);
      const hits=raycaster.intersectObjects(allInteractive,false);
      if(hovered) highlight(hovered,false);
      hovered=hits.length?hits[0].object:null;
      if(hovered){
        highlight(hovered,true);
        if(hovered.userData.node) {
          showTooltip(hovered.userData.node,e.clientX,e.clientY);
        } else {
          hideTooltip();
        }
      } else {
        hideTooltip();
      }
    }

    wrap.addEventListener('pointermove',pointerMove);

    const ro = new ResizeObserver(entries => {
      for(let entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        labelRenderer.setSize(w, h);
        composer.setSize(w, h);
      }
    });
    ro.observe(wrap);

    wrap.querySelector('#sectorSel').addEventListener('change', async e => {
      const sec = e.target.value;
      if(!sec) return;
      try {
        const bp = await FilePicker.browse("data", "Custom/maps");
        const txtUrl = bp.files.find(f => f.match(new RegExp(`s${sec}-salas\\.txt$`)));
        if(txtUrl) {
          const text = await (await fetch(txtUrl)).text();
          const lines = text.split('\n').map(l=>l.trim()).filter(l=>l);
          let currentCategory = null;
          customNames = {};
          for(const line of lines) {
            if(line.startsWith('#')) {
              const r = parseInt(line.slice(1,3),16);
              const g = parseInt(line.slice(3,5),16);
              const b = parseInt(line.slice(5,7),16);
              currentCategory = classify(r,g,b);
              if(!customNames[currentCategory]) customNames[currentCategory] = [];
            } else if (currentCategory) {
              const match = line.match(/^(\d+)x(\d+)\s+(.+)$/i);
              if(match) {
                customNames[currentCategory].push({ w: parseInt(match[1]), h: parseInt(match[2]), name: match[3] });
              }
            }
          }
        } else { customNames = null; }

        const imgUrls = bp.files.filter(f => f.match(new RegExp(`s${sec}\\d+\\.png$`))).sort();
        if(!imgUrls.length) return ui.notifications.warn(`No se encontraron imágenes para el sector ${sec}`);

        const loadedLayers = [];
        for(const url of imgUrls) {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          await new Promise((res, rej) => { img.onload=res; img.onerror=rej; img.src=url; });
          loadedLayers.push(decodeImage(img));
        }
        buildMap(loadedLayers);
      } catch(err) {}
    });

    const animate = (t) => {
      this.animFrame = requestAnimationFrame(animate);
      controls.update();
      if(fill) fill.intensity=52+7*Math.sin(t*.0016);
      composer.render();
      labelRenderer.render(scene,camera);
    };
    animate(0);
  }

  async close(options) {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    return super.close(options);
  }
}

new HolomapaApp().render(true);