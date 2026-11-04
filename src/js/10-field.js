/* The live background: one fragment shader with five scenes, plus a CPU Game of Life grid. */
const VERT = `#version 300 es
in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes,uM,uV,uLifeSize;
uniform float uDpr,uT,uScroll,uDim,uDensity,uForce,uHold,uMix,uLifeCell;
uniform vec3 uAcc;
uniform int uMode,uPrev;
uniform vec3 uR[6];
uniform sampler2D uLife;
const vec3 BG=vec3(.031,.031,.039);

float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float spot(vec2 p,float R){vec2 d=p-uM;return exp(-dot(d,d)/(R*R));}
float ripple(vec2 p){float s=0.;for(int i=0;i<6;i++){float a=uR[i].z;if(a<0.)continue;
 float e=(length(p-uR[i].xy)-a*560.)/64.;s+=exp(-e*e)*exp(-a*1.5);}return s;}
vec2 warp(vec2 p){
 vec2 d=p-uM;float R=230.+60.*uForce;float f=exp(-dot(d,d)/(R*R));
 vec2 q=p-d*f*mix(.3,-.6,uHold)*uForce+uV*f*.9;
 for(int i=0;i<6;i++){float a=uR[i].z;if(a<0.)continue;vec2 e=p-uR[i].xy;float r=length(e)+.001;
  float k=(r-a*560.)/64.;q-=e/r*exp(-k*k)*exp(-a*1.5)*30.*uForce;}
 return q;}

vec3 lattice(vec2 p){
 float cell=48./uDensity;
 vec2 g=(warp(p)+vec2(0.,uScroll*.4))/cell;
 vec2 a=abs(fract(g-.5)-.5)/fwidth(g);float l=1.-min(min(a.x,a.y),1.);
 vec2 g5=g/5.;vec2 b=abs(fract(g5-.5)-.5)/fwidth(g5);float L=1.-min(min(b.x,b.y),1.);
 float sp=spot(p,250.),rp=ripple(p);
 vec2 id=floor(g);float hs=h21(id);
 float tile=step(.84,hs)*(.5+.5*sin(uT*1.4+hs*50.));
 vec2 nd=abs(fract(g+.5)-.5)*cell;float node=step(max(nd.x,nd.y),1.7);
 vec3 c=BG+vec3(.05)*l+vec3(.055)*L;
 c+=uAcc*(l*.5+L*.34)*(sp+rp*.9);
 c+=uAcc*tile*(.012+sp*.13+rp*.1);
 c+=uAcc*node*(sp*.85+rp*.6);
 return c;}

vec2 toW(vec2 v,float c){return vec2(v.x+v.y*.5,v.y*.8660254)*c;}
float terrain(vec2 v,float c,vec2 off){
 vec2 w=toW(v,c)-off;
 float n=vn(v*.16+uT*.04)*1.1+vn(v*.41-uT*.06)*.45+h21(v)*.2;
 n+=spot(w,210.)*mix(1.5,-1.8,uHold)*uForce+ripple(w)*1.3*uForce;
 return n;}
vec3 shards(vec2 p){
 float c=74./uDensity;vec2 off=vec2(0.,uScroll*.4),P=p+off;
 vec2 v=vec2(P.x/c-P.y/(c*1.7320508),P.y/(c*.8660254));
 vec2 i=floor(v),f=fract(v);bool up=f.x+f.y<1.;
 vec2 A=up?i:i+vec2(1.),B=up?i+vec2(1,0):i+vec2(0,1),C=up?i+vec2(0,1):i+vec2(1,0);
 float z=c*.85;
 vec3 a=vec3(toW(A,c)-off,terrain(A,c,off)*z),b=vec3(toW(B,c)-off,terrain(B,c,off)*z),d=vec3(toW(C,c)-off,terrain(C,c,off)*z);
 vec3 n=normalize(cross(b-a,d-a));
 vec2 ctr=(a.xy+b.xy+d.xy)/3.;
 vec3 lg=normalize(vec3(uM-ctr,190.));
 float k=max(dot(n,lg),0.);
 vec2 e=up?f:1.-f;float bar=min(min(e.x,e.y),1.-e.x-e.y);
 float edge=1.-smoothstep(0.,fwidth(bar)*1.25,bar);
 float sp=spot(ctr,320.);
 vec3 col=BG+vec3(.021,.021,.026)*(.3+k*1.5)+h21(i+(up?.3:.7))*.006;
 col+=uAcc*(pow(k,3.)*.2*sp+pow(k,26.)*.55*sp+ripple(ctr)*.06);
 col+=vec3(.06)*edge*(.22+.78*k)+uAcc*edge*sp*.34;
 return col;}

float height(vec2 p){
 vec2 q=(p+vec2(0.,uScroll*.4))*.0032*uDensity;
 float h=vn(q+uT*.025)+.5*vn(q*2.1-uT*.03)+.25*vn(q*4.3);
 return h+spot(p,200.)*mix(.7,-.85,uHold)*uForce+ripple(p)*.35*uForce;}
vec3 contour(vec2 p){
 float h=height(p)*11.;
 float l=1.-smoothstep(0.,1.3,abs(fract(h-.5)-.5)/fwidth(h));
 float h5=h/5.;float L=1.-smoothstep(0.,1.5,abs(fract(h5-.5)-.5)/fwidth(h5));
 float sp=spot(p,290.),rp=ripple(p);
 vec3 c=BG+vec3(.046)*l+vec3(.075)*L;
 c+=uAcc*(l*.38+L*.5)*(sp+rp*.8);
 return c;}

vec3 prism(vec2 p){
 vec2 ctr=uRes/uDpr*vec2(.73,.42),c=p-ctr;
 float r=length(c),n=floor(5.+uDensity*3.);
 float ang=atan(c.y,c.x)+uT*.035+(uM.x/(uRes.x/uDpr)-.5)*.7*uForce;
 float sec=6.2831853/n;float a=abs(mod(ang,sec)-sec*.5);
 vec2 u=r*vec2(cos(a),sin(a))+(uM-ctr)*.2*uForce;
 u+=vec2(ripple(p)*34.*uForce,0.);
 float s=120./uDensity;
 vec3 k=vec3(u.y,u.x*.8660254+u.y*.5,u.x*.8660254-u.y*.5)/s;
 k+=uT*.03*vec3(0.,1.,-1.);
 vec3 fl=floor(k);
 vec3 fw=max(fwidth(k),vec3(.002));
 vec3 dd=abs(fract(k-.5)-.5)/fw;
 float l=1.-min(min(min(dd.x,dd.y),dd.z),1.);
 float h=h21(fl.xy+fl.z*7.31);
 float sp=spot(p,330.);
 float rad=exp(-r*r/(560.*560.));
 vec3 col=BG+vec3(.05)*l;
 col+=uAcc*l*(sp*.5+rad*.05);
 col+=uAcc*step(.7,h)*(.018+.09*sp)*(.5+rad);
 col+=vec3(1.)*step(.9,h)*.012*rad;
 return col;}

vec3 lifeScene(vec2 p){
 vec2 g=p/uLifeCell,id=floor(g);
 float v=texture(uLife,(id+.5)/uLifeSize).r;
 vec2 f=fract(g);float sq=step(max(abs(f.x-.5),abs(f.y-.5)),.44);
 vec2 a=abs(fract(g-.5)-.5)/fwidth(g);float l=1.-min(min(a.x,a.y),1.);
 float sp=spot(p,270.);
 return BG+vec3(.04)*l+uAcc*sq*v*(.34+.55*sp)+vec3(1.)*sq*step(.98,v)*.03;}

vec3 scene(int m,vec2 p){
 if(m==0)return lattice(p);if(m==1)return shards(p);if(m==2)return contour(p);if(m==3)return prism(p);return lifeScene(p);}

void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;
 vec3 c=scene(uMode,p);
 if(uMix<.999)c=mix(scene(uPrev,p),c,uMix);
 float keep=max(uDim,spot(p,300.)*.92);
 fragColor=vec4(mix(BG,c,keep),1.);
}`;

const MODES = ["Lattice", "Shards", "Contour", "Prism", "Life"];
const DEFAULT_MODE = 2;

const Field = {
  mode: store.get("background", DEFAULT_MODE) % MODES.length,
  density: 1,
  force: 1,
  paused: false,
  listeners: [],
  onMode(fn) { this.listeners.push(fn); },
  pulse() {},
  setMode() {},
  reset() {},
  gun() {},
  fps: 60,
};

function initField() {
  const cv = $("#field");
  const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) {
    document.documentElement.classList.add("no-webgl");
    return;
  }
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    document.documentElement.classList.add("no-webgl");
    return;
  }
  gl.useProgram(prog);
  const vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  for (const n of ["uRes", "uM", "uV", "uLifeSize", "uDpr", "uT", "uScroll", "uDim", "uDensity", "uForce", "uHold", "uMix", "uLifeCell", "uAcc", "uMode", "uPrev", "uR", "uLife"]) {
    U[n] = gl.getUniformLocation(prog, n);
  }

  let scale = 1;
  let W = 1, H = 1, dpr = 1;
  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5) * scale;
    cv.width = Math.max(1, Math.round(W * dpr));
    cv.height = Math.max(1, Math.round(H * dpr));
    gl.viewport(0, 0, cv.width, cv.height);
    lifeInit();
    dirty = true;
  };

  /* Game of Life state lives on the CPU and is uploaded as a small texture. */
  const LIFE_CELL = 22;
  let lc = 0, lr = 0, life = null, next = null, tex8 = null, lifeAcc = 0;
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  function lifeInit() {
    const c = Math.ceil(W / LIFE_CELL) + 1, r = Math.ceil(H / LIFE_CELL) + 1;
    if (c === lc && r === lr) return;
    lc = c;
    lr = r;
    life = new Uint8Array(c * r);
    next = new Uint8Array(c * r);
    tex8 = new Uint8Array(c * r);
    lifeSeed();
  }
  function lifeSeed() {
    for (let i = 0; i < life.length; i++) {
      life[i] = Math.random() < 0.13 ? 1 : 0;
      tex8[i] = life[i] ? 255 : 0;
    }
    lifeUpload();
  }
  function lifeUpload() {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, lc, lr, 0, gl.RED, gl.UNSIGNED_BYTE, tex8);
  }
  function lifeStep() {
    for (let y = 0; y < lr; y++) {
      const ym = ((y + lr - 1) % lr) * lc, y0 = y * lc, yp = ((y + 1) % lr) * lc;
      for (let x = 0; x < lc; x++) {
        const xm = (x + lc - 1) % lc, xp = (x + 1) % lc;
        const n = life[ym + xm] + life[ym + x] + life[ym + xp] + life[y0 + xm] + life[y0 + xp] + life[yp + xm] + life[yp + x] + life[yp + xp];
        const a = life[y0 + x];
        const v = n === 3 || (a && n === 2) ? 1 : 0;
        next[y0 + x] = v;
        tex8[y0 + x] = v ? 255 : Math.floor(tex8[y0 + x] * 0.72);
      }
    }
    [life, next] = [next, life];
  }
  function lifePaint(px, py, r = 1) {
    const cx = Math.floor(px / LIFE_CELL), cy = Math.floor(py / LIFE_CELL);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.random() < 0.62) {
          const i = ((cy + dy + lr) % lr) * lc + ((cx + dx + lc) % lc);
          life[i] = 1;
          tex8[i] = 255;
        }
      }
    }
  }
  const GUN = [[24,0],[22,1],[24,1],[12,2],[13,2],[20,2],[21,2],[34,2],[35,2],[11,3],[15,3],[20,3],[21,3],[34,3],[35,3],[0,4],[1,4],[10,4],[16,4],[20,4],[21,4],[0,5],[1,5],[10,5],[14,5],[16,5],[17,5],[22,5],[24,5],[10,6],[16,6],[24,6],[11,7],[15,7],[12,8],[13,8]];
  Field.gun = () => {
    Field.setMode(4);
    life.fill(0);
    tex8.fill(0);
    const ox = Math.max(1, (lc >> 1) - 18), oy = Math.max(1, (lr >> 1) - 8);
    for (const [x, y] of GUN) {
      const i = (y + oy) * lc + x + ox;
      if (i < life.length) {
        life[i] = 1;
        tex8[i] = 255;
      }
    }
  };

  /* Pointer state */
  const M = { x: innerWidth * 0.72, y: innerHeight * 0.4, tx: innerWidth * 0.72, ty: innerHeight * 0.4, vx: 0, vy: 0, hold: 0, down: false };
  const ripples = Array.from({ length: 6 }, () => ({ x: 0, y: 0, t0: -99 }));
  let rippleI = 0, dirty = true, t = 0, mix = 1, prev = Field.mode, frames = 0, fpsT = 0, slow = 0, fast = 0;

  Field.pulse = (x = M.x, y = M.y) => {
    const r = ripples[rippleI++ % 6];
    r.x = x;
    r.y = y;
    r.t0 = t;
    dirty = true;
    if (Field.mode === 4) lifePaint(x, y, 2);
  };
  Field.setMode = (m) => {
    if (m === Field.mode) return;
    prev = Field.mode;
    Field.mode = m;
    mix = 0;
    dirty = true;
    store.set("background", m);
    Field.listeners.forEach((f) => f(m));
  };
  Field.reset = () => {
    Field.density = 1;
    Field.force = 1;
    Field.paused = false;
    Field.setMode(DEFAULT_MODE);
    if (life) lifeSeed();
    dirty = true;
  };
  Field.seed = () => life && lifeSeed();
  Field.touch = () => (dirty = true);

  const blocked = (e) => e.target && e.target.closest && e.target.closest("a,button,input,textarea,label,canvas,[data-nofield]");
  addEventListener("pointermove", (e) => {
    M.tx = e.clientX;
    M.ty = e.clientY;
    dirty = true;
    if (Field.mode === 4 && e.pointerType === "mouse" && !blocked(e)) lifePaint(e.clientX, e.clientY, M.down ? 2 : 0);
  }, { passive: true });
  addEventListener("pointerdown", (e) => {
    if (blocked(e)) return;
    M.tx = e.clientX;
    M.ty = e.clientY;
    Field.pulse(e.clientX, e.clientY);
    Sound.blip(180, 0.09, 0.03, "triangle");
    if (e.pointerType === "mouse") M.down = true;
  }, { passive: true });
  addEventListener("pointerup", () => (M.down = false), { passive: true });
  addEventListener("pointercancel", () => (M.down = false), { passive: true });
  addEventListener("blur", () => (M.down = false));
  addEventListener("resize", resize);
  addEventListener("scroll", () => (dirty = true), { passive: true });
  cv.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    document.documentElement.classList.add("no-webgl");
  });
  document.addEventListener("accent", () => (dirty = true));

  resize();
  gl.uniform1i(U.uLife, 0);

  const render = (dt) => {
    const y = scrollY;
    const heroEnd = Math.max(1, H * 0.95);
    const dim = lerp(1, 0.5, clamp(y / heroEnd, 0, 1));
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform1f(U.uT, t);
    gl.uniform2f(U.uM, M.x, M.y);
    gl.uniform2f(U.uV, M.vx, M.vy);
    gl.uniform1f(U.uScroll, y);
    gl.uniform1f(U.uDim, dim);
    gl.uniform1f(U.uDensity, Field.density);
    gl.uniform1f(U.uForce, Field.force);
    gl.uniform1f(U.uHold, M.hold);
    gl.uniform1f(U.uMix, mix);
    gl.uniform1i(U.uMode, Field.mode);
    gl.uniform1i(U.uPrev, prev);
    gl.uniform3f(U.uAcc, Acc.rgb[0] / 255, Acc.rgb[1] / 255, Acc.rgb[2] / 255);
    gl.uniform2f(U.uLifeSize, lc, lr);
    gl.uniform1f(U.uLifeCell, LIFE_CELL);
    const arr = new Float32Array(18);
    ripples.forEach((r, i) => {
      const age = t - r.t0;
      arr[i * 3] = r.x;
      arr[i * 3 + 1] = r.y;
      arr[i * 3 + 2] = age < 3.2 ? age : -1;
    });
    gl.uniform3fv(U.uR, arr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  addTick(null, (dt) => {
    const moving = !REDUCED && !Field.paused;
    if (moving) t += dt;
    else if (ripples.some((r) => t - r.t0 < 3.2)) t += dt;
    const k = 1 - Math.pow(0.0008, dt);
    const ox = M.x, oy = M.y;
    M.x += (M.tx - M.x) * k;
    M.y += (M.ty - M.y) * k;
    M.vx = lerp(M.vx, clamp((M.x - ox) * 3, -90, 90), 0.2);
    M.vy = lerp(M.vy, clamp((M.y - oy) * 3, -90, 90), 0.2);
    M.hold = lerp(M.hold, M.down ? 1 : 0, 1 - Math.pow(0.002, dt));
    if (mix < 1) mix = Math.min(1, mix + dt * 2.4);
    if (Field.mode === 4 && moving) {
      lifeAcc += dt;
      if (lifeAcc > 0.11) {
        lifeAcc = 0;
        lifeStep();
      }
    }
    if (Field.mode === 4 || prev === 4) lifeUpload();
    const settling = Math.abs(M.tx - M.x) + Math.abs(M.ty - M.y) > 0.2 || mix < 1 || ripples.some((r) => t - r.t0 < 3.2);
    if (moving || settling || dirty) {
      render(dt);
      dirty = false;
    }
    /* Trade resolution for smoothness on slower machines. */
    frames++;
    fpsT += dt;
    if (fpsT >= 1) {
      Field.fps = Math.round(frames / fpsT);
      frames = 0;
      fpsT = 0;
      if (Field.fps < 34) slow++, (fast = 0);
      else if (Field.fps > 54) fast++, (slow = 0);
      else slow = fast = 0;
      if (slow >= 2 && scale > 0.5) {
        scale = Math.max(0.5, scale - 0.2);
        slow = 0;
        resize();
      } else if (fast >= 12 && scale < 1) {
        scale = Math.min(1, scale + 0.1);
        fast = 0;
        resize();
      }
    }
  });
}
