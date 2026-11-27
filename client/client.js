/* @local/dsh-canvas v0.3.0 */
window.__ModuleLoader__.load({
  id: "@local/dsh-canvas",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
var Js=Object.create;var vn=Object.defineProperty;var qs=Object.getOwnPropertyDescriptor;var Qs=Object.getOwnPropertyNames;var eo=Object.getPrototypeOf,to=Object.prototype.hasOwnProperty;var ii=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(i){throw n=[i],i}};var wn=(e,t)=>{for(var n in t)vn(e,n,{get:t[n],enumerable:!0})},la=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of Qs(t))!to.call(e,a)&&a!==n&&vn(e,a,{get:()=>t[a],enumerable:!(i=qs(t,a))||i.enumerable});return e};var qe=(e,t,n)=>(n=e!=null?Js(eo(e)):{},la(t||!e||!e.__esModule?vn(n,"default",{value:e,enumerable:!0}):n,e)),no=e=>la(vn({},"__esModule",{value:!0}),e);var sr={};wn(sr,{buildSvg:()=>pi});function gc(e){return e.fit==="contain"||e.scaleMode==="fit"?"xMidYMid meet":e.fit==="fill"||e.scaleMode==="stretch"?"none":"xMidYMid slice"}function nr(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function _t(e){return nr(e).replace(/'/g,"&#39;")}function ir(e){return!e||e.type!=="solid"?"none":e.color??"#000000"}function yc(e,t){if(e.type==="linear-gradient"){let i=(e.stops??[]).map(o=>`<stop offset="${o.position}" stop-color="${o.color}"/>`).join(""),a=(Number(e.angle)||0)*Math.PI/180,r=.5-Math.cos(a)/2,s=.5-Math.sin(a)/2,c=.5+Math.cos(a)/2,d=.5+Math.sin(a)/2;return`<linearGradient id="${t}" x1="${r}" y1="${s}" x2="${c}" y2="${d}">${i}</linearGradient>`}let n=(e.stops??[]).map(i=>`<stop offset="${i.position}" stop-color="${i.color}"/>`).join("");return`<radialGradient id="${t}" cx="${e.center?.x??.5}" cy="${e.center?.y??.5}" r="${e.radius??.7}">${n}</radialGradient>`}function Qa(e,t,n){if(!e)return"none";if(e.type==="solid")return ir(e);if(e.type==="linear-gradient"||e.type==="radial-gradient"){let i=`grad-${n}`;return t.push(yc(e,i)),`url(#${i})`}return"none"}function er(e){return e?` stroke="${e.color??"#000000"}" stroke-width="${e.width??1}"`:""}function xc(e,t,n){let i=(e??[]).filter(c=>c.visible!==!1);if(!i.length)return"";let a=`fx-${n}`,r=[],s=0;for(let c of i)(c.type==="layer-blur"||c.type==="blur")&&(s+=Number(c.blur??c.radius)||0),c.type==="drop-shadow"&&r.push(`<feDropShadow dx="${c.x??0}" dy="${c.y??0}" stdDeviation="${(Number(c.blur)||0)/2}" flood-color="${c.color??"#00000040"}"/>`);return s>0&&r.unshift(`<feGaussianBlur stdDeviation="${s/2}"/>`),r.length?(t.push(`<filter id="${a}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">${r.join("")}</filter>`),` filter="url(#${a})"`):""}function tr(e){return`<rect ${e}/>`}function ui(e,t,n){if(!e||e.visible===!1)return"";let{defs:i,assets:a,keyPrefix:r,clip:s}=t,c=e.absX-(n?.x??0),d=e.absY-(n?.y??0),o=`translate(${c} ${d})${e.rotation?` rotate(${e.rotation} ${e.width/2} ${e.height/2})`:""}`,l=`${r}-${e.key}`,h=xc(e.effects,i,l),u=e.opacity==null?1:e.opacity;if(e.type==="group")return`<g transform="${o}" opacity="${u}">${(e.children??[]).map(k=>ui(k,t,{x:e.absX,y:e.absY})).join("")}</g>`;let f=`clip-${l}`,p="";if(e.clip&&e.children?.length){let k=e.type==="ellipse"?Math.min(e.width,e.height)/2:e.cornerRadius??0;i.push(`<clipPath id="${f}"><rect width="${e.width}" height="${e.height}" rx="${k}" ry="${k}"/></clipPath>`),p=` clip-path="url(#${f})"`}let g=[],y=e.type==="ellipse"?Math.min(e.width,e.height)/2:e.cornerRadius??0;if(e.type==="path"){let k=[];for(let N of e.fills??[]){let I=Qa(N,i,`${l}-${k.length}`),M=e.fillRule==="evenodd"?"evenodd":"nonzero";k.push(`<path d="${_t(e.d??"")}" fill="${I}" fill-rule="${M}"/>`)}for(let N of e.strokes??[])k.push(`<path d="${_t(e.d??"")}" fill="none"${er(N)} stroke-linejoin="round"/>`);return`<g transform="${o}" opacity="${u}"${h}>${k.join("")}</g>`}if(e.type==="text"){let k=e.font??{},N=(k.size??14)*(k.lineHeight??1.4),I=e.lines??[],M=ir(e.fills?.[0]),T=e.align??"left",j=T==="center"?"middle":T==="right"?"end":"start",P=T==="center"?e.width/2:T==="right"?e.width:0,K=I.length*N,W=e.verticalAlign==="center"?(e.height-K)/2:e.verticalAlign==="bottom"?e.height-K:0,Q=I.length?I.map((B,ce)=>`<text x="${P}" y="${W+N*(ce+.8)}" font-family="${_t(`'${k.family??"system-ui"}'`)}" font-size="${k.size??14}" font-weight="${k.weight??400}" font-style="${k.style??"normal"}" letter-spacing="${k.letterSpacing??0}" fill="${M==="none"?"transparent":M}" text-anchor="${j}" xml:space="preserve">${nr(B.text||" ")}</text>`).join(""):"";return g.push(`<g transform="${o}" opacity="${u}"${h}>${Q}</g>`),g.join("")}let A=`x="0" y="0" width="${e.width}" height="${e.height}"`;for(let k of e.fills??[]){if(k.type==="image"){let I=a.get(k.asset);if(!I)continue;let M=gc(k),T=k.crop;if(T){let j=`crop-${l}`;i.push(`<clipPath id="${j}"><rect width="${e.width}" height="${e.height}" rx="${y}" ry="${y}"/></clipPath>`),g.push(`<image href="${_t(I)}" x="${-T.x*e.width/T.width}" y="${-T.y*e.height/T.height}" width="${e.width/T.width}" height="${e.height/T.height}" preserveAspectRatio="${M}" clip-path="url(#${j})"/>`)}else g.push(`<image href="${_t(I)}" ${A} preserveAspectRatio="${M}"${y?` rx="${y}"`:""}/>`);continue}let N=Qa(k,i,`${l}-${g.length}`);e.type==="ellipse"?g.push(`<ellipse cx="${e.width/2}" cy="${e.height/2}" rx="${e.width/2}" ry="${e.height/2}" fill="${N}"/>`):e.type==="line"?g.push(`<line x1="0" y1="0" x2="${e.width}" y2="0"${er(e.strokes?.[0])}/>`):g.push(tr(`width="${e.width}" height="${e.height}" rx="${y}" ry="${y}" fill="${N}"`))}if(e.type==="line"){let k=e.strokes?.[0];g.push(`<line x1="0" y1="0" x2="${e.width}" y2="0" stroke="${k?.color??"#111111"}" stroke-width="${k?.width??1}"/>`)}if((e.strokes??[]).length&&e.type!=="line")for(let k of e.strokes){let N=k.color??"#000000";e.type==="ellipse"?g.push(`<ellipse cx="${e.width/2}" cy="${e.height/2}" rx="${Math.max(0,e.width/2-(k.width??1)/2)}" ry="${Math.max(0,e.height/2-(k.width??1)/2)}" fill="none" stroke="${N}" stroke-width="${k.width??1}"/>`):g.push(tr(`width="${e.width}" height="${e.height}" rx="${y}" ry="${y}" fill="none" stroke="${N}" stroke-width="${k.width??1}"`))}if((e.children??[]).length){let k=e.children.map(N=>ui(N,t,{x:e.absX,y:e.absY})).join("");g.push(`<g${p}>${k}</g>`)}return`<g transform="${o}" opacity="${u}"${h} data-node="${_t(e.key)}">${g.join("")}</g>`}function ar(e,t){for(let n of e.fills??[])n.type==="image"&&n.asset&&t.add(n.asset);for(let n of e.children??[])ar(n,t)}function rr(e,t){e.type==="text"&&e.font?.family&&t.add(`${e.font.family}::${e.font.weight??400}::${e.font.style??"normal"}`);for(let n of e.children??[])rr(n,t)}async function pi(e,t={}){let n=(e?.roots??[]).filter(k=>t.nodeKeys?t.nodeKeys.includes(k.key):!0),i=t.nodeKeys?.length&&e?.byKey?t.nodeKeys.map(k=>e.byKey.get(k)).filter(Boolean):n,a=i.length?i:n,r=new Map,s=new Set,c=new Set;for(let k of a)ar(k,s),rr(k,c);if(t.resolveAsset)for(let k of s)try{let N=await t.resolveAsset(k);typeof N=="string"&&r.set(k,N)}catch{}let d=[],o=[];for(let k of c){let[N,I,M]=k.split("::"),T=(t.fonts??[]).find(j=>j.family===N&&String(j.weight)===I&&(j.style??"normal")===M);if(!(!T||!t.resolveFont))try{let j=await t.resolveFont(T);if(typeof j!="string")continue;let P=T.asset.split(".").pop().toLowerCase();o.push(`@font-face{font-family:'${N.replace(/'/g,"\\'")}';src:url('${j}') format('${mc[P]??"truetype"}');font-weight:${I};font-style:${M};}`)}catch{}}let l=a.length?Math.min(...a.map(k=>k.absX)):0,h=a.length?Math.min(...a.map(k=>k.absY)):0,u=a.length?Math.max(...a.map(k=>k.absX+k.width)):1,f=a.length?Math.max(...a.map(k=>k.absY+k.height)):1,p=Math.max(1,u-l),g=Math.max(1,f-h),y={defs:d,assets:r,keyPrefix:"n",clip:!0},A=a.map(k=>ui(k,y,{x:l,y:h})).join("");return`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${p}" height="${g}" viewBox="0 0 ${p} ${g}">
<defs>${d.join("")}</defs>
${o.length?`<style>${o.join("")}</style>`:""}
${t.background?`<rect width="${p}" height="${g}" fill="${t.background}"/>`:""}
${A}
</svg>`}var mc,fi=ii(()=>{mc={woff2:"woff2",woff:"woff",ttf:"truetype",otf:"opentype"}});var zi={};wn(zi,{svgToPng:()=>Bc});function Bc(e,t=2){return new Promise((n,i)=>{let a=new Blob([e],{type:"image/svg+xml;charset=utf-8"}),r=URL.createObjectURL(a),s=new Image;s.onload=()=>{try{let c=Math.max(1,Math.round((s.naturalWidth||1)*t)),d=Math.max(1,Math.round((s.naturalHeight||1)*t));if(c*d>64e6)throw new Error("\u5BFC\u51FA\u5C3A\u5BF8\u8FC7\u5927");let o=document.createElement("canvas");o.width=c,o.height=d;let l=o.getContext("2d");l.scale(t,t),l.drawImage(s,0,0),n(o.toDataURL("image/png"))}catch(c){i(c)}finally{URL.revokeObjectURL(r)}},s.onerror=()=>{URL.revokeObjectURL(r),i(new Error("SVG \u6805\u683C\u5316\u5931\u8D25"))},s.src=r})}var Ti=ii(()=>{});var Li={};wn(Li,{saveFile:()=>Hc});async function Hc(e,t,n){let i=typeof e=="string"?new Blob([e],{type:n}):e,a=globalThis.showSaveFilePicker;if(typeof a=="function")try{let d=await(await a({suggestedName:t})).createWritable();return await d.write(i),await d.close(),{saved:!0,cancelled:!1,method:"picker",filename:t}}catch(c){if(c instanceof Error&&c.name==="AbortError")return{saved:!1,cancelled:!0,method:"picker",filename:t}}let r=URL.createObjectURL(i),s=document.createElement("a");return s.href=r,s.download=t,document.body.appendChild(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(r),4e3),{saved:!0,cancelled:!1,method:"download",filename:t}}var Bi=ii(()=>{});var Bl={};wn(Bl,{apply:()=>Ll,inject:()=>Tl,name:()=>zl});module.exports=no(Bl);var Ie=qe(require("react"),1);var da="data:image/png;base64,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";var G=qe(require("react"),1);var Oe=class extends Error{constructor(t){super(t),this.name="PathDataError"}};var ao=/[MmZzLlHhVvCcSsQqTtAa]/,ro=/^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/,so=/^[MmZzLlHhVvCcSsQqTtAa0-9eE+.,\-\s]*$/,oo={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};function co(e){if(!so.test(e))throw new Oe("path data contains unsupported characters");let t=[],n=0;for(;n<e.length;){let i=e[n];if(i===" "||i===`
`||i==="\r"||i==="	"||i===","){n+=1;continue}if(ao.test(i)){t.push({command:i}),n+=1;continue}let a=e.slice(n),r=ro.exec(a);if(!r)throw new Oe(`invalid path data near "${a.slice(0,12)}"`);let s=Number(r[0]);if(!Number.isFinite(s))throw new Oe("path data contains a non-finite number");t.push({value:s}),n+=r[0].length}return t}function $t(e){if(typeof e!="string"||e.trim()==="")throw new Oe("path d must be a non-empty string");if(e.length>1e5)throw new Oe("path d exceeds 100000 characters");let t=co(e);if(!t.length)throw new Oe("path d is empty");let n=0,i="",a=0,r=0,s=0,c=0,d=null,o=null,l=1/0,h=1/0,u=-1/0,f=-1/0,p=0,g=(A,k)=>{l=Math.min(l,A),h=Math.min(h,k),u=Math.max(u,A),f=Math.max(f,k)};g(0,0);let y=()=>{let A=t[n];if(!A||A.value===void 0)throw new Oe(`path command ${i} is missing parameters`);return n+=1,A.value};for(;n<t.length;){let A=t[n];if(A.command)i=A.command,n+=1;else if(!i)throw new Oe("path data must begin with a command");let k=i.toUpperCase(),N=i!==k,I=oo[k];if(I===void 0)throw new Oe(`unsupported path command ${i}`);if(I===0){a=s,r=c,d=null,o=null,p+=1;continue}if(t[n]?.command)throw new Oe(`path command ${i} is missing parameters`);p+=1;let M=y(),T=N?a+M:M;if(k==="H"){a=T,g(a,r),d=null,o=null;continue}if(k==="V"){r=N?r+M:M,g(a,r),d=null,o=null;continue}let j=N?r+y():y();switch(k){case"M":a=T,r=j,s=T,c=j,g(T,j),d=null,o=null,i=N?"l":"L";break;case"L":a=T,r=j,g(T,j),d=null,o=null;break;case"C":{let P=T,K=j,W=N?a+y():y(),Q=N?r+y():y(),B=N?a+y():y(),ce=N?r+y():y();g(P,K),g(W,Q),g(B,ce),a=B,r=ce,d=W,o=Q;break}case"S":{let P=T,K=j,W=N?a+y():y(),Q=N?r+y():y();g(P,K),g(W,Q),a=W,r=Q,d=P,o=K;break}case"Q":{let P=T,K=j,W=N?a+y():y(),Q=N?r+y():y();g(P,K),g(W,Q),a=W,r=Q,d=P,o=K;break}case"T":{let P=T,K=j;g(P,K),a=P,r=K,d=P,o=K;break}case"A":{let P=T,K=j,W=y(),Q=y(),B=y(),ce=N?a+y():y(),pe=N?r+y():y();if(P<0||K<0)throw new Oe("path arc radius must be non-negative");if(Q!==0&&Q!==1)throw new Oe("path arc large-arc flag must be 0 or 1");if(B!==0&&B!==1)throw new Oe("path arc sweep flag must be 0 or 1");g(ce,pe),a=ce,r=pe,d=null,o=null;break}default:throw new Oe(`unsupported path command ${i}`)}}if(p===0)throw new Oe("path d has no commands");if(!Number.isFinite(l))throw new Oe("path d has no finite bounds");return{bounds:{minX:l,minY:h,maxX:u,maxY:f},commands:p}}var ma="dsh.canvas",ga=1,bt={components:200,styles:500,comments:1e3,fonts:50,depth:32,textLength:1e4,docBytes:8*1024*1024,imageBytes:20*1024*1024,fontBytes:10*1024*1024},lo=["frame","group","rect","ellipse","line","text","path","instance"],ho=["solid","linear-gradient","radial-gradient","image"],uo=["drop-shadow","inner-shadow","layer-blur","background-blur"],po=["fill","text","effect"],fo=["left","center","right","justify"],mo=["top","center","bottom"],go=["horizontal","vertical"],yo=["start","center","end","space-between"],xo=["start","center","end","stretch"],ha=["fixed","hug","fill"],bo=["cover","contain","fill"],vo=["nonzero","evenodd"],ya=["normal","italic"],ua=["user","ai"],wo=/^[A-Za-z0-9_-]{1,64}$/;var ko=/^assets\/[A-Za-z0-9._-]{1,120}$/,So=/^fonts\/[A-Za-z0-9._-]{1,120}$/,Ro=/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,H=class extends Error{path;code;constructor(t,n,i="invalid-document"){super(`${t}: ${n}`),this.name="CanvasError",this.path=t,this.code=i}};function Ae(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function $o(e){if(typeof structuredClone=="function")try{return structuredClone(e)}catch{}return JSON.parse(JSON.stringify(e))}function xe(e,t,n={}){let{min:i=-1e6,max:a=1e6,int:r=!1}=n;if(typeof e!="number"||!Number.isFinite(e))throw new H(t,"expected a finite number");if(r&&Math.round(e)!==e)throw new H(t,"expected an integer");if(e<i||e>a)throw new H(t,`expected a number in [${i}, ${a}]`);return e}function nt(e,t){return xe(e,t,{min:0,max:1,int:!1})}function rn(e,t){if(typeof e!="string"||!Ro.test(e))throw new H(t,"expected a color like #RRGGBB or #RRGGBBAA");return e.toUpperCase()}function He(e,t){if(typeof e!="string"||!wo.test(e))throw new H(t,"expected an id matching ^[A-Za-z0-9_-]{1,64}$");return e}function Xe(e,t,n){if(typeof e!="string"||!n.includes(e))throw new H(t,`expected one of ${n.map(i=>JSON.stringify(i)).join(", ")}`);return e}var ai=0;function ve(e="n"){ai=(ai+1)%16777215;let t=Math.floor(Math.random()*16777215).toString(36);return`${e}_${Date.now().toString(36)}${ai.toString(36)}${t}`.slice(0,64)}function Eo(e){return typeof e=="string"&&ko.test(e)&&!e.includes("..")}function Io(e){return typeof e=="string"&&So.test(e)&&!e.includes("..")}var At=()=>new Date().toISOString();function xa(e="\u4E3B\u753B\u5E03",t=ve("doc")){return{format:ma,version:ga,id:t,title:e,pages:[{id:ve("page"),name:"\u753B\u5E03 1",background:null,children:[]}],components:[],variantSets:[],styles:[],fonts:[],comments:[],meta:{createdAt:At(),updatedAt:At()}}}function si(e,t){if(!Ae(e))throw new H(t,"expected an object");let n=Xe(e.type,`${t}.type`,ho),i={...e,type:n};if(n==="solid")return i.color=rn(e.color,`${t}.color`),i.opacity=e.opacity==null?1:nt(e.opacity,`${t}.opacity`),i;if(n==="linear-gradient")return i.angle=e.angle==null?180:xe(e.angle,`${t}.angle`,{min:-3600,max:3600}),i.stops=pa(e.stops,`${t}.stops`),i;if(n==="radial-gradient")return i.center={x:e.center?.x==null?.5:nt(e.center.x,`${t}.center.x`),y:e.center?.y==null?.5:nt(e.center.y,`${t}.center.y`)},i.radius=e.radius==null?.7:nt(e.radius,`${t}.radius`),i.stops=pa(e.stops,`${t}.stops`),i;if(!Eo(e.asset))throw new H(`${t}.asset`,"expected assets/<file>");if(i.asset=e.asset,i.fit=e.fit==null?"cover":Xe(e.fit,`${t}.fit`,bo),e.crop!=null){if(!Ae(e.crop))throw new H(`${t}.crop`,"expected an object");let a={x:nt(e.crop.x??0,`${t}.crop.x`),y:nt(e.crop.y??0,`${t}.crop.y`),width:nt(e.crop.width??1,`${t}.crop.width`),height:nt(e.crop.height??1,`${t}.crop.height`)};if(a.width<=0||a.height<=0)throw new H(`${t}.crop`,"crop size must be positive");if(a.x+a.width>1.000001||a.y+a.height>1.000001)throw new H(`${t}.crop`,"crop must stay inside the image");i.crop=a}return i}function pa(e,t){if(!Array.isArray(e)||e.length<2||e.length>32)throw new H(t,"expected 2-32 gradient stops");return e.map((n,i)=>{if(!Ae(n))throw new H(`${t}[${i}]`,"expected an object");return{position:nt(n.position,`${t}[${i}].position`),color:rn(n.color,`${t}[${i}].color`)}})}function No(e,t){if(!Ae(e))throw new H(t,"expected an object");let n=Xe(e.type,`${t}.type`,uo),i={...e,type:n,visible:e.visible!==!1};return n==="layer-blur"||n==="background-blur"?(i.radius=xe(e.radius??4,`${t}.radius`,{min:0,max:200}),i):(i.x=xe(e.x??0,`${t}.x`,{min:-1e3,max:1e3}),i.y=xe(e.y??0,`${t}.y`,{min:-1e3,max:1e3}),i.blur=xe(e.blur??0,`${t}.blur`,{min:0,max:500}),i.spread=xe(e.spread??0,`${t}.spread`,{min:-500,max:500}),i.color=rn(e.color??"#00000040",`${t}.color`),i)}function fa(e,t){if(typeof e!="string"||!e.trim()||e.length>64)throw new H(t,"expected a non-empty label of at most 64 characters");return e.trim()}function ri(e,t){if(e==null)return[];if(!Array.isArray(e)||e.length>8)throw new H(t,"expected at most 8 strokes");return e.map((n,i)=>{if(!Ae(n))throw new H(`${t}[${i}]`,"expected an object");return{...n,color:rn(n.color??"#000000",`${t}[${i}].color`),width:xe(n.width??1,`${t}[${i}].width`,{min:0,max:200}),align:n.align==null?"center":Xe(n.align,`${t}[${i}].align`,["center","inside","outside"])}})}function Co(e,t){if(e!=null){if(!Ae(e))throw new H(t,"expected an object");return{h:Xe(e.h??"fixed",`${t}.h`,ha),v:Xe(e.v??"fixed",`${t}.v`,ha)}}}function Mo(e,t){if(e==null)return;if(!Ae(e))throw new H(t,"expected an object");let n=e.padding??{};return{...e,direction:Xe(e.direction??"vertical",`${t}.direction`,go),gap:xe(e.gap??0,`${t}.gap`,{min:0,max:1e4}),padding:{top:xe(n.top??0,`${t}.padding.top`,{min:0,max:1e4}),right:xe(n.right??0,`${t}.padding.right`,{min:0,max:1e4}),bottom:xe(n.bottom??0,`${t}.padding.bottom`,{min:0,max:1e4}),left:xe(n.left??0,`${t}.padding.left`,{min:0,max:1e4})},alignPrimary:Xe(e.alignPrimary??"start",`${t}.alignPrimary`,yo),alignCounter:Xe(e.alignCounter??"start",`${t}.alignCounter`,xo),...e.wrap===!0?{wrap:!0}:{},...e.ignoreHidden===!0?{ignoreHidden:!0}:{}}}function ba(e,t){let n=Ae(e)?e:{};return{...n,family:typeof n.family=="string"&&n.family.trim()?n.family.trim().slice(0,120):"system-ui",weight:Math.round(xe(n.weight??400,`${t}.weight`,{min:100,max:900})/100)*100,style:Xe(n.style??"normal",`${t}.style`,ya),size:xe(n.size??14,`${t}.size`,{min:1,max:1e3}),lineHeight:xe(n.lineHeight??1.4,`${t}.lineHeight`,{min:.5,max:10}),letterSpacing:xe(n.letterSpacing??0,`${t}.letterSpacing`,{min:-50,max:200})}}function Po(e,t){if(!Ae(e))throw new H(t,"expected an object");let n={...e};if("text"in n&&(typeof n.text!="string"||n.text.length>bt.textLength))throw new H(`${t}.text`,"expected a short string");if("visible"in n&&typeof n.visible!="boolean")throw new H(`${t}.visible`,"expected a boolean");if("fills"in n){if(!Array.isArray(n.fills)||n.fills.length>8)throw new H(`${t}.fills`,"expected an array");n.fills=n.fills.map((i,a)=>si(i,`${t}.fills[${a}]`))}return n}function oi(e,t,n,i){if(n>bt.depth)throw new H(t,`node nesting exceeds ${bt.depth}`);if(!Ae(e))throw new H(t,"expected a node object");let a=Xe(e.type,`${t}.type`,lo),r={...e,type:a};if(r.id=He(e.id,`${t}.id`),i.ids.has(r.id))throw new H(`${t}.id`,`duplicate id "${r.id}"`);if(i.ids.add(r.id),Ae(e.interaction)&&e.interaction.id!=null&&He(e.interaction.id,`${t}.interaction.id`),e.pageRef!=null&&(r.pageRef=He(e.pageRef,`${t}.pageRef`),r.pageRef===r.id))throw new H(`${t}.pageRef`,"a page reference cannot target itself");if(r.name=typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):Ao(a),r.x=xe(e.x??0,`${t}.x`),r.y=xe(e.y??0,`${t}.y`),r.width=xe(e.width??Do(a),`${t}.width`,{min:0,max:1e6}),r.height=xe(e.height??Fo(a),`${t}.height`,{min:0,max:1e6}),r.rotation=xe(e.rotation??0,`${t}.rotation`,{min:-36e3,max:36e3}),r.opacity=nt(e.opacity??1,`${t}.opacity`),r.visible=e.visible!==!1,r.locked=e.locked===!0,r.layoutSizing=Co(e.layoutSizing,`${t}.layoutSizing`),e.layoutPositioning!=null&&(r.layoutPositioning=Xe(e.layoutPositioning,`${t}.layoutPositioning`,["auto","absolute"])),a==="frame"||a==="group"){if(r.children=[],Array.isArray(e.children))for(let s=0;s<e.children.length;s+=1)r.children.push(oi(e.children[s],`${t}.children[${s}]`,n+1,i))}else r.children=void 0;if((a==="frame"||a==="rect"||a==="ellipse")&&(r.fills=an(e.fills,`${t}.fills`),!r.fills.length&&e.fills==null&&e.fillStyleId==null&&(r.fills=[{type:"solid",color:a==="frame"?"#FFFFFF":"#D9D9D9"}]),r.strokes=ri(e.strokes,`${t}.strokes`),r.effects=kn(e.effects,`${t}.effects`),r.cornerRadius=xe(e.cornerRadius??0,`${t}.cornerRadius`,{min:0,max:1e6}),e.cornerRadii!=null)){if(!Array.isArray(e.cornerRadii)||e.cornerRadii.length!==4)throw new H(`${t}.cornerRadii`,"expected a 4-tuple of corner radii");r.cornerRadii=[xe(e.cornerRadii[0],`${t}.cornerRadii[0]`,{min:0,max:1e6}),xe(e.cornerRadii[1],`${t}.cornerRadii[1]`,{min:0,max:1e6}),xe(e.cornerRadii[2],`${t}.cornerRadii[2]`,{min:0,max:1e6}),xe(e.cornerRadii[3],`${t}.cornerRadii[3]`,{min:0,max:1e6})]}if(a==="instance"&&(r.fills=void 0,r.strokes=void 0,r.effects=void 0,r.cornerRadius=e.cornerRadius==null?void 0:xe(e.cornerRadius,`${t}.cornerRadius`,{min:0,max:1e6})),(a==="group"||a==="line")&&(r.fills=void 0,r.strokes=void 0,r.effects=void 0,r.cornerRadius=void 0),a==="line"&&(r.strokes=ri(e.strokes,`${t}.strokes`),r.strokes.length||(r.strokes=[{color:"#111111",width:1,align:"center"}]),r.fills=void 0,r.effects=void 0,r.height=0),a==="text"&&(r.text=typeof e.text=="string"?e.text.slice(0,bt.textLength):"",r.font=ba(e.font,`${t}.font`),r.align=Xe(e.align??"left",`${t}.align`,fo),r.verticalAlign=Xe(e.verticalAlign??"top",`${t}.verticalAlign`,mo),r.fills=an(e.fills,`${t}.fills`),!r.fills.length&&e.fills==null&&e.fillStyleId==null&&(r.fills=[{type:"solid",color:"#111111"}]),r.effects=kn(e.effects,`${t}.effects`),r.autoHeight=e.autoHeight!==!1),a==="path"){r.d=zo(e.d,t);let s=$t(r.d);if(r.viewBox=To(e.viewBox,s.bounds,`${t}.viewBox`),r.fillRule=Xe(e.fillRule??"nonzero",`${t}.fillRule`,vo),r.fills=an(e.fills,`${t}.fills`),r.strokes=ri(e.strokes,`${t}.strokes`),r.effects=kn(e.effects,`${t}.effects`),r.cornerRadius=void 0,r.fills.some(c=>c.type==="image"))throw new H(`${t}.fills`,"path nodes do not support image fills")}if(a==="frame"&&(r.clip=e.clip!==!1,r.layout=Mo(e.layout,`${t}.layout`),e.backgroundColor!=null&&(r.fills=an(e.fills??[{type:"solid",color:e.backgroundColor}],`${t}.fills`))),a==="instance"&&(r.componentId=He(e.componentId,`${t}.componentId`),r.variantProps=va(e.variantProps,`${t}.variantProps`),r.overrides={},e.overrides!=null)){if(!Ae(e.overrides))throw new H(`${t}.overrides`,"expected an object");for(let[s,c]of Object.entries(e.overrides))r.overrides[He(s,`${t}.overrides key`)]=Po(c,`${t}.overrides.${s}`)}return e.fillStyleId!=null&&(r.fillStyleId=He(e.fillStyleId,`${t}.fillStyleId`)),e.textStyleId!=null&&(r.textStyleId=He(e.textStyleId,`${t}.textStyleId`)),e.effectStyleId!=null&&(r.effectStyleId=He(e.effectStyleId,`${t}.effectStyleId`)),r}function an(e,t){if(e==null)return[];if(!Array.isArray(e)||e.length>8)throw new H(t,"expected at most 8 fills");return e.map((n,i)=>si(n,`${t}[${i}]`))}function kn(e,t){if(e==null)return[];if(!Array.isArray(e)||e.length>8)throw new H(t,"expected at most 8 effects");return e.map((n,i)=>No(n,`${t}[${i}]`))}function va(e,t){if(e==null)return{};if(!Ae(e))throw new H(t,"expected an object");let n={};for(let[i,a]of Object.entries(e)){if(typeof a!="string"||a.length>120)throw new H(`${t}.${i}`,"expected a short string");n[i]=a}return n}function Ao(e){return{frame:"Frame",group:"Group",rect:"Rectangle",ellipse:"Ellipse",line:"Line",text:"Text",path:"Path",instance:"Instance"}[e]??"Node"}function Do(e){return e==="line"?100:e==="text"?160:e==="path"?120:e==="frame"?375:120}function Fo(e){return e==="line"?0:e==="text"?24:e==="path"?120:e==="frame"?667:120}function zo(e,t){if(typeof e!="string"||!e.trim())throw new H(`${t}.d`,"expected a non-empty SVG path string");if(e.length>1e5)throw new H(`${t}.d`,"path d exceeds 100000 characters");try{$t(e)}catch(n){throw new H(`${t}.d`,n instanceof Error?n.message:"invalid path data")}return e}function To(e,t,n){let i={x:Number.isFinite(t?.minX)?t.minX:0,y:Number.isFinite(t?.minY)?t.minY:0,width:Number.isFinite(t?.maxX-t?.minX)&&t.maxX>t.minX?t.maxX-t.minX:1,height:Number.isFinite(t?.maxY-t?.minY)&&t.maxY>t.minY?t.maxY-t.minY:1};if(e==null)return i;if(!Ae(e))throw new H(n,"expected a viewBox object");return{x:xe(e.x??i.x,`${n}.x`),y:xe(e.y??i.y,`${n}.y`),width:xe(e.width??i.width,`${n}.width`,{min:1e-4,max:1e6}),height:xe(e.height??i.height,`${n}.height`,{min:1e-4,max:1e6})}}function Lo(e,t){if(!Ae(e))throw new H(t,"expected a style object");let n={...e};return n.id=He(e.id,`${t}.id`),n.type=Xe(e.type,`${t}.type`,po),n.name=typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):n.type,n.type==="fill"?n.value=si(e.value,`${t}.value`):n.type==="text"?n.value={font:ba(e.value?.font,`${t}.value.font`),fills:an(e.value?.fills,`${t}.value.fills`)}:n.value=kn(e.value,`${t}.value`),n}function Bo(e,t,n){if(!Ae(e))throw new H(t,"expected a component object");let i={...e};return i.id=He(e.id,`${t}.id`),i.name=typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):"Component",i.root=oi(e.root,`${t}.root`,1,n),i.root.x=0,i.root.y=0,e.variantSetId!=null&&(i.variantSetId=He(e.variantSetId,`${t}.variantSetId`)),i.variantProps=va(e.variantProps,`${t}.variantProps`),i}function Ho(e,t){if(!Ae(e))throw new H(t,"expected a variant set object");if(!Array.isArray(e.properties)||e.properties.length===0)throw new H(`${t}.properties`,"expected at least one variant property");return{...e,id:He(e.id,`${t}.id`),name:typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):"Variant set",properties:e.properties.map((n,i)=>({name:fa(n?.name,`${t}.properties[${i}].name`),values:Array.isArray(n?.values)?n.values.map((a,r)=>fa(a,`${t}.properties[${i}].values[${r}]`)):[]})),componentIds:Array.isArray(e.componentIds)?e.componentIds.map((n,i)=>He(n,`${t}.componentIds[${i}]`)):[]}}function Oo(e,t){if(!Ae(e))throw new H(t,"expected a font asset object");return{...e,id:He(e.id,`${t}.id`),family:typeof e.family=="string"&&e.family.trim()?e.family.trim().slice(0,120):"Custom",weight:Math.round(xe(e.weight??400,`${t}.weight`,{min:100,max:900})/100)*100,style:Xe(e.style??"normal",`${t}.style`,ya),asset:Io(e.asset)?e.asset:(()=>{throw new H(`${t}.asset`,"expected fonts/<file>")})(),sourceName:typeof e.sourceName=="string"?e.sourceName.slice(0,200):void 0}}function Xo(e,t){if(!Ae(e))throw new H(t,"expected a comment object");let n={...e,id:He(e.id,`${t}.id`),pageId:He(e.pageId,`${t}.pageId`),body:typeof e.body=="string"?e.body.slice(0,4e3):"",author:Xe(e.author??"user",`${t}.author`,ua),createdAt:typeof e.createdAt=="string"?e.createdAt:At(),resolved:e.resolved===!0,replies:[]};return e.nodeId!=null&&(n.nodeId=He(e.nodeId,`${t}.nodeId`)),e.x!=null&&(n.x=nt(e.x,`${t}.x`)),e.y!=null&&(n.y=nt(e.y,`${t}.y`)),Array.isArray(e.replies)&&(n.replies=e.replies.slice(0,100).map((i,a)=>{if(!Ae(i))throw new H(`${t}.replies[${a}]`,"expected an object");return{...i,id:He(i.id??ve("r"),`${t}.replies[${a}].id`),body:typeof i.body=="string"?i.body.slice(0,4e3):"",author:Xe(i.author??"user",`${t}.replies[${a}].author`,ua),createdAt:typeof i.createdAt=="string"?i.createdAt:At()}})),n}function Et(e,t={}){if(!Ae(e))throw new H("$","expected a document object");let n=$o(e);if(n.format=ma,n.version=ga,n.id=He(n.id??ve("doc"),"$.id"),n.title=typeof n.title=="string"&&n.title.trim()?n.title.trim().slice(0,200):"\u672A\u547D\u540D\u753B\u5E03",!Array.isArray(n.pages)||n.pages.length===0)throw new H("$.pages","expected at least one page");if(n.pages.length>50)throw new H("$.pages","expected at most 50 pages");let a={ids:new Set};n.pages=n.pages.map((o,l)=>{if(!Ae(o))throw new H(`$.pages[${l}]`,"expected an object");let h={...o,id:He(o.id??ve("page"),`$.pages[${l}].id`),name:typeof o.name=="string"&&o.name.trim()?o.name.trim().slice(0,120):`\u753B\u5E03 ${l+1}`,children:[]};if(o.background!=null&&(h.background=rn(o.background,`$.pages[${l}].background`)),Array.isArray(o.children))for(let u=0;u<o.children.length;u+=1)h.children.push(oi(o.children[u],`$.pages[${l}].children[${u}]`,1,a));return h});let r=new Map;ka({pages:n.pages},o=>r.set(o.id,o));for(let o of r.values()){if(!o.pageRef)continue;if(r.get(o.pageRef)?.pageRef)throw new H(`node[${o.id}].pageRef`,"expected a direct reference to a source node")}for(let o of r.values())o.pageRef&&!r.has(o.pageRef)&&delete o.pageRef;let s=new Set(n.pages.map(o=>o.id));if(s.size!==n.pages.length)throw new H("$.pages","duplicate page id");if(n.components=Array.isArray(n.components)?n.components.map((o,l)=>Bo(o,`$.components[${l}]`,a)):[],n.components.length>bt.components)throw new H("$.components","too many components");let c=new Set(n.components.map(o=>o.id));if(c.size!==n.components.length)throw new H("$.components","duplicate component id");for(let o of n.components)if(o.variantSetId!=null&&!Array.isArray(n.variantSets))throw new H("$.variantSets","missing variant sets");n.variantSets=Array.isArray(n.variantSets)?n.variantSets.map((o,l)=>Ho(o,`$.variantSets[${l}]`)):[];for(let[o,l]of n.variantSets.entries())for(let h of l.componentIds)if(!c.has(h))throw new H(`$.variantSets[${o}].componentIds`,`unknown component "${h}"`);if(n.styles=Array.isArray(n.styles)?n.styles.map((o,l)=>Lo(o,`$.styles[${l}]`)):[],n.styles.length>bt.styles)throw new H("$.styles","too many styles");if(new Set(n.styles.map(o=>o.id)).size!==n.styles.length)throw new H("$.styles","duplicate style id");if(n.fonts=Array.isArray(n.fonts)?n.fonts.map((o,l)=>Oo(o,`$.fonts[${l}]`)):[],n.fonts.length>bt.fonts)throw new H("$.fonts","too many fonts");if(n.comments=Array.isArray(n.comments)?n.comments.map((o,l)=>Xo(o,`$.comments[${l}]`)):[],n.comments.length>bt.comments)throw new H("$.comments","too many comments");for(let[o,l]of n.comments.entries()){if(!s.has(l.pageId))throw new H(`$.comments[${o}].pageId`,`unknown page "${l.pageId}"`);if(l.nodeId!=null&&!It(n,l.nodeId))throw new H(`$.comments[${o}].nodeId`,`unknown node "${l.nodeId}"`)}return n.meta=Ae(n.meta)?{...n.meta}:{},n.meta.createdAt=typeof n.meta.createdAt=="string"?n.meta.createdAt:At(),n.meta.updatedAt=t.touch===!1?n.meta.updatedAt??At():At(),Vo(n),n}function Vo(e){let t=new Map(e.components.map(o=>[o.id,o])),n=new Map(e.variantSets.map(o=>[o.id,o])),i=new Map(e.styles.map(o=>[o.id,o])),a=new Set;for(let[o,l]of e.fonts.entries()){if(a.has(l.id))throw new H(`$.fonts[${o}].id`,`duplicate font id "${l.id}"`);a.add(l.id)}for(let[o,l]of e.variantSets.entries())for(let h of l.componentIds){let u=t.get(h);if(!u)throw new H(`$.variantSets[${o}].componentIds`,`unknown component "${h}"`);if(u.variantSetId!==l.id)throw new H("$.components",`component "${h}" must set variantSetId "${l.id}"`);for(let f of l.properties){if(!(f.name in u.variantProps))throw new H("$.components",`component "${h}" is missing variant property "${f.name}"`);if(!f.values.includes(u.variantProps[f.name]))throw new H("$.components",`component "${h}" has variant value not declared by "${f.name}"`)}}for(let o of e.components)if(o.variantSetId!=null&&!n.has(o.variantSetId))throw new H("$.components",`component "${o.id}" references unknown variant set`);let r=(o,l,h)=>{if(o==null)return;let u=i.get(o);if(!u)throw new H(h,`unknown ${l} style "${o}"`);if(u.type!==l)throw new H(h,`style "${o}" is a ${u.type} style, expected ${l}`)};for(let o of e.components)for(let l of wa(o.root))r(l.fillStyleId,"fill",`$.components.${o.id}.${l.id}.fillStyleId`),r(l.textStyleId,"text",`$.components.${o.id}.${l.id}.textStyleId`),r(l.effectStyleId,"effect",`$.components.${o.id}.${l.id}.effectStyleId`);let s=(o,l)=>{let h=t.get(o.componentId);if(!h)throw new H(`${l}.componentId`,`unknown component "${o.componentId}"`);if(h.variantSetId!=null){let u=n.get(h.variantSetId);if(u)for(let[f,p]of Object.entries(o.variantProps??{})){let g=u.properties.find(y=>y.name===f);if(!g)throw new H(`${l}.variantProps.${f}`,`variant set has no property "${f}"`);if(!g.values.includes(p))throw new H(`${l}.variantProps.${f}`,`unknown variant value "${p}"`)}}for(let[u,f]of Object.entries(o.overrides??{})){let p=Sa(h.root,u);if(!p)throw new H(`${l}.overrides.${u}`,"override targets an unknown node");if("text"in f&&p.node.type!=="text")throw new H(`${l}.overrides.${u}.text`,"text override on a non-text node");if("fills"in f&&!["frame","rect","ellipse","path","text"].includes(p.node.type))throw new H(`${l}.overrides.${u}.fills`,"fill override on an unsupported node")}},c=(o,l,h)=>{h>bt.depth||(r(o.fillStyleId,"fill",`${l}.fillStyleId`),r(o.textStyleId,"text",`${l}.textStyleId`),r(o.effectStyleId,"effect",`${l}.effectStyleId`),o.type==="instance"&&s(o,l),Array.isArray(o.children)&&o.children.forEach((u,f)=>c(u,`${l}.children[${f}]`,h+1)))};e.pages.forEach((o,l)=>{o.children.forEach((h,u)=>c(h,`$.pages[${l}].children[${u}]`,1))});let d=new Set;for(let[o,l]of e.comments.entries()){if(d.has(l.id))throw new H(`$.comments[${o}].id`,"duplicate comment id");d.add(l.id)}}function*wa(e){if(yield e,Array.isArray(e.children))for(let t of e.children)yield*wa(t)}function ka(e,t){for(let n of e.pages??[]){let i=(a,r,s)=>{t(a,r,{page:n,component:null,index:s}),Array.isArray(a.children)&&a.children.forEach((c,d)=>i(c,a,d))};(n.children??[]).forEach((a,r)=>i(a,null,r))}for(let n of e.components??[]){let i=(a,r,s)=>{t(a,r,{page:null,component:n,index:s}),Array.isArray(a.children)&&a.children.forEach((c,d)=>i(c,a,d))};i(n.root,null,0)}}function It(e,t){let n=null;return ka(e,(i,a,r)=>{!n&&i.id===t&&(n={node:i,parent:a,...r})}),n}function Sa(e,t){let n=(i,a,r)=>{if(i.id===t)return{node:i,parent:a,index:r};if(!Array.isArray(i.children))return null;for(let s=0;s<i.children.length;s+=1){let c=n(i.children[s],i,s);if(c)return c}return null};return n(e,null,0)}function Ra(e,t){return(e.pages??[]).find(n=>n.id===t)??null}function $a(e){return e.pages?.[0]??null}function jo(e,t){return(e.pages??[]).find(n=>n.id===t)??null}function Ea(e,t){let n=t.pageId?jo(e,t.pageId):$a(e);if(!n)throw new H("$.comments","document has no pages");if(typeof t.body!="string"||!t.body.trim())throw new H("$.comments.body","comment body is required");if(t.nodeId!=null&&!It(e,t.nodeId))throw new H("$.comments.nodeId",`unknown node "${t.nodeId}"`);let i={id:ve("c"),pageId:n.id,body:t.body,author:t.author==="ai"?"ai":"user",createdAt:new Date().toISOString(),resolved:!1,replies:[]};return t.nodeId!=null&&(i.nodeId=t.nodeId),t.x!=null&&(i.x=t.x),t.y!=null&&(i.y=t.y),e.comments=Array.isArray(e.comments)?e.comments:[],e.comments.push(i),i}function Ia(e,t,n,i){let a=(e.comments??[]).find(s=>s.id===t);if(!a)throw new H("$.comments",`unknown comment "${t}"`);if(typeof n!="string"||!n.trim())throw new H("$.comments.body","reply body is required");let r={id:ve("r"),body:n,author:i==="ai"?"ai":"user",createdAt:new Date().toISOString()};return a.replies.push(r),r}function Na(e,t,n=!0){let i=(e.comments??[]).find(a=>a.id===t);if(!i)throw new H("$.comments",`unknown comment "${t}"`);return i.resolved=n,i}function Ca(e,t){let n=(e.comments??[]).findIndex(i=>i.id===t);if(n===-1)throw new H("$.comments",`unknown comment "${t}"`);e.comments.splice(n,1)}var sn=Object.freeze({family:"system-ui",weight:400,style:"normal",size:14,lineHeight:1.4,letterSpacing:0}),_o=4e3,Ma=1e-6,Yo="\u2060",Fa=/[\u2E80-\u2FFF\u3000-\u303F\u3040-\u30FF\u3100-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u{1F300}-\u{1FAFF}]/u,Wo=new Set(["system-ui","ui-sans-serif","ui-serif","ui-monospace","ui-rounded","sans-serif","serif","monospace","cursive","fantasy","math","emoji","fangsong","-apple-system","BlinkMacSystemFont","Segoe UI"]);function Dt(){let e=new Map,t=0,n=null,i=!1,a=Da(),r=a&&a.fonts?a.fonts:null,s=r&&typeof r.status=="string"?r.status:"loaded",c=()=>{e.clear(),t+=1};if(r)try{typeof r.addEventListener=="function"?(r.addEventListener("loadingdone",c),r.addEventListener("loadingerror",c)):r.ready&&typeof r.ready.then=="function"&&r.ready.then(c,()=>{})}catch{}function d(){!r||typeof r.status!="string"||r.status!==s&&(s=r.status,s==="loaded"&&c())}function o(){if(i)return n;i=!0;let h=Da();if(!h)return null;try{let u=h.createElement("canvas"),f=u&&typeof u.getContext=="function"?u.getContext("2d"):null;f&&typeof f.measureText=="function"&&(n=f)}catch{n=null}return n}function l(h){d();let u=h&&typeof h.text=="string"?h.text:"",f=Go(h&&h.font),p=h?h.maxWidth:1/0,g=typeof p=="number"&&p>0?p:1/0,y=`${f.family}|${f.weight}|${f.style}|${f.size}|${f.lineHeight}|${f.letterSpacing}|${g===1/0?"inf":g}|${u.length}|${u}`,A=e.get(y);if(A)return A;let k=o(),N=k?Ko(k,u,f,g):Zo(u,f,g);return(!r||r.status!=="loading")&&(e.size>=_o&&e.clear(),e.set(y,N)),N}return l.clearCache=c,l.fontEpoch=()=>t,l.fontsReady=()=>r&&r.ready?r.ready:Promise.resolve(),l.isCanvasBacked=()=>!!o(),l}function Go(e){let t=e&&typeof e=="object"?e:{};return{family:typeof t.family=="string"&&t.family.trim()?t.family.trim():sn.family,weight:Pa(t.weight,sn.weight),style:t.style==="italic"?"italic":"normal",size:Aa(t.size,sn.size),lineHeight:Aa(t.lineHeight,sn.lineHeight),letterSpacing:Pa(t.letterSpacing,sn.letterSpacing)}}function Pa(e,t){return typeof e=="number"&&Number.isFinite(e)?e:t}function Aa(e,t){return typeof e=="number"&&Number.isFinite(e)&&e>0?e:t}function Da(){try{let e=typeof globalThis<"u"?globalThis:void 0,t=e?e.document:null;return t&&typeof t.createElement=="function"?t:null}catch{return null}}function Ko(e,t,n,i){try{e.font=Uo(n)}catch{}return za(t,n,i,r=>{try{let s=e.measureText(r);return s&&Number.isFinite(s.width)?s.width:0}catch{return 0}})}function Zo(e,t,n){return za(e,t,n,a=>{let r=0;for(let s of a)r+=Fa.test(s)?t.size:t.size*.55;return r})}function Uo(e){let t=e.style==="italic"?"italic ":"",n=Jo(e.family);return`${t}${e.weight} ${e.size}px ${n}`}function Jo(e){return e.includes(",")||Wo.has(e)||/^[A-Za-z][A-Za-z0-9_-]*$/.test(e)?e:JSON.stringify(e)}function za(e,t,n,i){let a=t.letterSpacing,r=t.size*t.lineHeight,s=Number.isFinite(n)&&n>0,c=u=>i(u)+a*Qo(u),d=[],o=u=>{let f=u.replace(/[ \t\u00A0]+$/u,"");d.push({text:f,width:Math.max(0,c(f))})},l=String(e).replace(/\r\n?/g,`
`).replace(/\t/g,"    ").split(`
`);for(let u of l){let f=[],p=0,g=()=>{o(f.join("")),f=[],p=0},y=A=>{let k=c(A);if(!s){f.push(A),p+=k;return}if(p+k<=n+Ma){f.push(A),p+=k;return}if(f.length>0){g(),y(A);return}let N="",I=0;for(let M of A){let T=c(M);N&&I+T>n+Ma?(o(N),N=M,I=T):(N+=M,I+=T)}N&&(f.push(N),p=I)};for(let A of qo(u))f.length===0&&/^[ \t\u00A0]+$/u.test(A)||y(A);g()}let h=0;for(let u of d)h=Math.max(h,u.width);return{lines:d,width:h,height:d.length*r}}function qo(e){let t=[],n="";for(let i of e)i!==Yo&&(Fa.test(i)||i===" "||i==="\xA0"?(n&&(t.push(n),n=""),t.push(i)):n+=i);return n&&t.push(n),t}function Qo(e){let t=0;for(let n of e)t+=1;return t}var Xt=Object.freeze({family:"system-ui",weight:400,style:"normal",size:14,lineHeight:1.4,letterSpacing:0}),Ta=1e-6;function lt(e){if(!e||!Array.isArray(e.roots))return e;let t=Array.isArray(e.issues)?e.issues:e.issues=[],n=e.measureText;typeof n!="function"&&e.options&&typeof e.options.measureText=="function"&&(n=e.options.measureText),typeof n!="function"&&(n=Dt()),e.measureText=n;let i={issues:t,measure:n};for(let l of e.roots)a(l);for(let l of e.roots)d(l,0,0);return e;function a(l){if(!l||typeof l!="object")return;if(l.type==="text"){r(l);return}let h=Array.isArray(l.children)?l.children:[];for(let p of h)a(p);let u=Vt(l.layout)?l.layout:null,f=Sn(l);u?s(l,u,f,h):c(l,f,h)}function r(l){let h=Sn(l),u=Vt(l.font)?{...Xt,...l.font}:Xt,f=h.h==="hug"?1/0:Math.max(0,Re(l.width,0)),p=ec(i,{text:typeof l.text=="string"?l.text:"",font:u,maxWidth:f,autoHeight:l.autoHeight!==!1},l);l.lines=p.lines,h.h==="hug"&&(l.width=Math.max(0,p.width)),h.v==="hug"&&(l.height=Math.max(0,p.height))}function s(l,h,u,f){let p=h.ignoreHidden===!0||e?.doc?.meta?.layoutIgnoreHidden===!0,g=f.filter(L=>!(L.layoutPositioning==="absolute"||p&&L.visible===!1)),A=(h.direction==="horizontal"?"horizontal":"vertical")==="horizontal",k=La(h.padding),N=Math.max(0,Re(h.gap,0)),I=h.alignCounter??"start",M=k.left+k.right,T=k.top+k.bottom,j=u.h==="hug"?null:Math.max(0,Re(l.width,0)-M),P=u.v==="hug"?null:Math.max(0,Re(l.height,0)-T),K=A?j:P,W=A?P:j,Q=A?"width":"height",B=A?"height":"width";if(W!=null)for(let L of g){let ae=Sn(L),Pe=A?ae.v:ae.h;(Pe==="fill"||I==="stretch"&&Pe==="fixed")&&Math.abs(Re(L[B],0)-W)>Ta&&(L[B]=W,a(L))}if(K!=null){let L=g.filter(ae=>{let Pe=Sn(ae);return(A?Pe.h:Pe.v)==="fill"});if(L.length){let ae=0;for(let re of g)L.includes(re)||(ae+=Math.max(0,Re(re[Q],0)));let Pe=N*Math.max(0,g.length-1),Z=Math.max(0,(K-ae-Pe)/L.length);for(let re of L)Math.abs(Re(re[Q],0)-Z)>Ta&&(re[Q]=Z,a(re))}}let ce=N*Math.max(0,g.length-1),pe=0;for(let L of g)ce+=Math.max(0,Re(L[Q],0)),pe=Math.max(pe,Math.max(0,Re(L[B],0)));u.h==="hug"&&(l.width=Math.max(0,A?ce+M:pe+M)),u.v==="hug"&&(l.height=Math.max(0,A?pe+T:ce+T))}function c(l,h,u){let f=0,p=0;for(let g of u)f=Math.max(f,Re(g.x,0)+Math.max(0,Re(g.width,0))),p=Math.max(p,Re(g.y,0)+Math.max(0,Re(g.height,0)));h.h==="hug"&&(l.width=Math.max(0,f)),h.v==="hug"&&(l.height=Math.max(0,p))}function d(l,h,u){if(!l||typeof l!="object")return;l.absX=h+Re(l.x,0),l.absY=u+Re(l.y,0);let f=Array.isArray(l.children)?l.children:[];if(!f.length)return;let p=Vt(l.layout)?l.layout:null;p&&o(l,p,f);for(let g of f)d(g,l.absX,l.absY)}function o(l,h,u){let f=h.ignoreHidden===!0||e?.doc?.meta?.layoutIgnoreHidden===!0,p=u.filter(L=>!(L.layoutPositioning==="absolute"||f&&L.visible===!1)),g=h.direction==="horizontal",y=La(h.padding),A=Math.max(0,Re(h.gap,0)),k=h.alignPrimary??"start",N=h.alignCounter??"start",I=g?"width":"height",M=g?"height":"width",T=g?y.left:y.top,j=g?y.top:y.left,P=Math.max(0,Re(l[I],0)-(g?y.left+y.right:y.top+y.bottom)),K=Math.max(0,Re(l[M],0)-(g?y.top+y.bottom:y.left+y.right)),W=A*Math.max(0,p.length-1);for(let L of p)W+=Math.max(0,Re(L[I],0));let Q=P-W,B=0,ce=A;k==="center"?B=Q/2:k==="end"?B=Q:k==="space-between"&&p.length>1&&(ce=A+Math.max(0,Q)/(p.length-1));let pe=T+B;for(let L of p){let ae=Math.max(0,Re(L[I],0)),Pe=Math.max(0,Re(L[M],0)),Z=j;N==="center"?Z=j+(K-Pe)/2:N==="end"&&(Z=j+K-Pe),g?(L.x=pe,L.y=Z):(L.x=Z,L.y=pe),pe+=ae+ce}}}function Sn(e){let t=Vt(e.layoutSizing)?e.layoutSizing:{},n=t.h==="hug"||t.h==="fill"?t.h:"fixed",i;return t.v==="hug"||t.v==="fill"?i=t.v:t.v==="fixed"?i="fixed":i=e.type==="text"&&e.autoHeight!==!1?"hug":"fixed",{h:n,v:i}}function La(e){let t=Vt(e)?e:{};return{top:Re(t.top,0),right:Re(t.right,0),bottom:Re(t.bottom,0),left:Re(t.left,0)}}function ec(e,t,n){try{let i=e.measure(t);if(i&&Array.isArray(i.lines)&&Number.isFinite(i.width)&&Number.isFinite(i.height))return{lines:i.lines.map(a=>({text:typeof a?.text=="string"?a.text:"",width:Re(a?.width,0)})),width:i.width,height:i.height};throw new Error("measureText returned an invalid result")}catch(i){return e.issues.push(`text measurement failed for "${n.key??n.id??"text"}": ${String(i instanceof Error?i.message:i)}`),tc(t)}}function tc(e){let t=Vt(e.font)?{...Xt,...e.font}:Xt,n=Re(t.size,Xt.size),i=Re(t.lineHeight,Xt.lineHeight),a=String(e.text??"").replace(/\r\n?/g,`
`).split(`
`).map(s=>({text:s,width:[...s].length*n*.55})),r=0;for(let s of a)r=Math.max(r,s.width);return{lines:a,width:r,height:a.length*n*i}}function Vt(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function Re(e,t){return typeof e=="number"&&Number.isFinite(e)?e:t}var Ba=24,Ha=2e4,Xa=Object.freeze({family:"system-ui",weight:400,style:"normal",size:14,lineHeight:1.4,letterSpacing:0}),nc=new Set(["left","center","right","justify"]),ic=new Set(["top","center","bottom"]),Oa=new Set(["fixed","hug","fill"]);function vt(e,t={}){let n=ke(e)?e:{},i=ke(t)?{...t}:{},a=[];ke(e)||a.push("document is missing or malformed");let r=i.mode==="component"?"component":"design",s=typeof i.measureText=="function"?i.measureText:Dt(),c=new Map;for(let y of Array.isArray(n.components)?n.components:[])ke(y)&&typeof y.id=="string"&&c.set(y.id,y);let d=new Map;for(let y of Array.isArray(n.styles)?n.styles:[])ke(y)&&typeof y.id=="string"&&d.set(y.id,y);let o=new Map;for(let y of Array.isArray(n.variantSets)?n.variantSets:[])ke(y)&&typeof y.id=="string"&&o.set(y.id,y);let l=new Map,h=new Map,u={issues:a,componentById:c,styleById:d,variantSetById:o,byKey:l,bySourceId:h,expandedNodes:0,budgetIssued:!1,componentStack:[]},f=[],p=r==="design"?lc(n,i.pageId,a):null;if(r==="design"){if(p){let y=Array.isArray(p.children)?p.children:[];for(let A of y){if(!ke(A)){a.push("skipped a malformed page child");continue}let k=ci(A,{key:typeof A.id=="string"?A.id:`node-${f.length}`,keyPrefix:null,instanceId:null,editable:!0,overrides:null,parent:null},u);k&&f.push(k)}}}else{let y=typeof i.componentId=="string"?i.componentId:null,A=y?c.get(y):null;if(!A||!ke(A.root))a.push(`component mode: unknown component "${String(y)}"`);else{let k=A.root,N=ci(k,{key:typeof k.id=="string"?k.id:"component-root",keyPrefix:null,instanceId:null,editable:!0,overrides:null,parent:null},u);N&&f.push(N)}}let g={pageId:p&&typeof p.id=="string"?p.id:null,title:typeof n.title=="string"?n.title:"",mode:r,roots:f,byKey:l,bySourceId:h,componentById:c,styleById:d,issues:a,componentId:r==="component"&&typeof i.componentId=="string"?i.componentId:null,viewportWidth:dt(i.viewportWidth,null),page:p,background:p&&typeof p.background=="string"?p.background:null,doc:n,measureText:s,options:i};return dc(g,e,i),g}function ci(e,t,n){return ke(e)?t.instanceId!=null&&++n.expandedNodes>Ha?(n.budgetIssued||(n.issues.push(`component expansion exceeds ${Ha} nodes; remaining expanded children were skipped`),n.budgetIssued=!0),null):e.type==="instance"?rc(e,t,n):ac(e,t,n):(n.issues.push(`skipped a malformed node at "${t.key}"`),null)}function ac(e,t,n){let i=ja(e,t),a=i.type,r=di(t.overrides,e.id);if(a==="frame"||a==="rect"||a==="ellipse"||a==="path")li(i,e,n,r),a==="frame"&&(i.layout=ke(e.layout)?e.layout:void 0),a==="path"&&(i.d=e.d,i.viewBox=e.viewBox,i.fillRule=e.fillRule??"nonzero");else if(a==="text"){let s=li(i,e,n,r);_a(i,e,s,r)}else a==="line"&&(i.strokes=Array.isArray(e.strokes)?e.strokes:[]);return r&&typeof r.visible=="boolean"&&(i.visible=r.visible),a==="frame"||a==="group"?i.children=Va(e,i,{prefix:t.keyPrefix??null,instanceId:t.instanceId??null,editable:i.editable,overrides:t.overrides??null},n):i.children=[],Ya(i,n),i}function rc(e,t,n){let i=ja(e,t);i.type="instance",i.isInstanceRoot=!0;let a=t.instanceId!=null?t.instanceId:t.key;i.instanceId=a;let r=ke(e.overrides)?e.overrides:{};i.overrides=r,i.variantProps=ke(e.variantProps)?{...e.variantProps}:{},i.componentId=e.componentId;let s=di(t.overrides,e.id),c=oc(e,n),d=c&&ke(c.root)?c.root:null;if(c&&(i.componentId=c.id,i.variantProps={...ke(c.variantProps)?c.variantProps:{},...ke(e.variantProps)?e.variantProps:{}}),d){let o=di(r,d.id),l=li(i,d,n,o);e.cornerRadius!=null&&(i.cornerRadius=Math.max(0,dt(e.cornerRadius,0))),i.visible=i.visible&&d.visible!==!1,d.type==="text"&&(_a(i,d,l,o),i.lines=[]),d.type==="path"&&(i.d=d.d,i.viewBox=d.viewBox,i.fillRule=d.fillRule??"nonzero"),i.layout=ke(d.layout)?d.layout:void 0,i.layoutSizing=Wa(e.layoutSizing),o&&typeof o.visible=="boolean"&&(i.visible=o.visible)}if(s&&typeof s.visible=="boolean"&&(i.visible=s.visible),c&&d)if(n.componentStack.includes(c.id))n.issues.push(`component cycle: ${[...n.componentStack,c.id].join(" -> ")}; instance "${String(e.id)}" rendered empty`);else if(n.componentStack.length>=Ba)n.issues.push(`component nesting exceeds ${Ba} at instance "${String(e.id)}"; rendered empty`);else{n.componentStack.push(c.id);try{i.children=Va(d,i,{prefix:i.key,instanceId:a,editable:!1,overrides:r},n)}finally{n.componentStack.pop()}}return Ya(i,n),i}function Va(e,t,n,i){let a=Array.isArray(e.children)?e.children:[],r=[];for(let s of a){if(!ke(s)){i.issues.push(`skipped a malformed child of "${String(t.id)}"`);continue}let c=typeof s.id=="string"?s.id:`node-${n.prefix??""}-${r.length}`,d=n.prefix?`${n.prefix}::${c}`:c,o=ci(s,{key:d,keyPrefix:n.prefix??null,instanceId:n.instanceId??null,editable:n.editable!==!1,overrides:n.overrides??null,parent:t},i);o&&r.push(o)}return r}function ja(e,t){let n=typeof e.type=="string"?e.type:"rect",i=typeof e.id=="string"?e.id:String(t.key),a={key:t.key,id:i,sourceId:i,type:n,name:typeof e.name=="string"?e.name:n,x:dt(e.x,0),y:dt(e.y,0),width:Math.max(0,dt(e.width,0)),height:Math.max(0,dt(e.height,0)),rotation:dt(e.rotation,0),opacity:hc(dt(e.opacity,1)),visible:e.visible!==!1,locked:e.locked===!0,fill:[],fills:[],strokes:[],effects:[],cornerRadius:0,clip:!1,children:[],sourceNode:e,editable:t.editable!==!1,isInstanceRoot:!1,parent:t.parent??null};t.instanceId!=null&&(a.instanceId=t.instanceId);let r=Wa(e.layoutSizing);return r&&(a.layoutSizing=r),e.layoutPositioning==="absolute"&&(a.layoutPositioning="absolute"),a}function li(e,t,n,i){let a=sc(t,e,n),r=a.fills,s=a.effects;return i&&Array.isArray(i.fills)&&(r=i.fills),e.fill=r,e.fills=r,e.effects=s,e.strokes=Array.isArray(t.strokes)?t.strokes:[],e.cornerRadius=Math.max(0,dt(t.cornerRadius,0)),Array.isArray(t.cornerRadii)&&t.cornerRadii.length===4&&(e.cornerRadii=t.cornerRadii.map(c=>Math.max(0,dt(c,0)))),e.clip=t.type==="frame"?t.clip!==!1:!1,a.font}function _a(e,t,n,i){e.text=typeof t.text=="string"?t.text:"",e.font=ke(n)?n:Xa,e.align=nc.has(t.align)?t.align:"left",e.verticalAlign=ic.has(t.verticalAlign)?t.verticalAlign:"top",e.autoHeight=t.autoHeight!==!1,i&&typeof i.text=="string"&&(e.text=i.text)}function sc(e,t,n){let i=Array.isArray(e.fills)?e.fills:[],a=Array.isArray(e.effects)?e.effects:[],r=ke(e.font)?e.font:Xa,s=`node "${String(t.id)}"`;if(e.textStyleId!=null){let c=n.styleById.get(e.textStyleId);c?c.type!=="text"?n.issues.push(`${s}: style "${String(e.textStyleId)}" is a ${String(c.type)} style, expected text`):ke(c.value)&&(ke(c.value.font)&&(r=c.value.font),Array.isArray(c.value.fills)&&(i=c.value.fills)):n.issues.push(`${s}: unknown text style "${String(e.textStyleId)}"`)}if(e.fillStyleId!=null){let c=n.styleById.get(e.fillStyleId);c?c.type!=="fill"?n.issues.push(`${s}: style "${String(e.fillStyleId)}" is a ${String(c.type)} style, expected fill`):ke(c.value)&&(i=[c.value]):n.issues.push(`${s}: unknown fill style "${String(e.fillStyleId)}"`)}if(e.effectStyleId!=null){let c=n.styleById.get(e.effectStyleId);c?c.type!=="effect"?n.issues.push(`${s}: style "${String(e.effectStyleId)}" is a ${String(c.type)} style, expected effect`):Array.isArray(c.value)&&(a=c.value):n.issues.push(`${s}: unknown effect style "${String(e.effectStyleId)}"`)}return{fills:i,effects:a,font:r}}function oc(e,t){let n=t.componentById.get(e.componentId);if(!n)return t.issues.push(`instance "${String(e.id)}" references unknown component "${String(e.componentId)}"`),null;let i=ke(e.variantProps)?e.variantProps:{};if(!n.variantSetId||Object.keys(i).length===0)return n;let a=t.variantSetById.get(n.variantSetId);if(!a)return t.issues.push(`component "${String(n.id)}" references unknown variant set "${String(n.variantSetId)}"`),n;let r={...ke(n.variantProps)?n.variantProps:{},...i},s=Array.isArray(a.properties)?a.properties:[];for(let c of Array.isArray(a.componentIds)?a.componentIds:[]){let d=t.componentById.get(c);if(!d)continue;let o=ke(d.variantProps)?d.variantProps:{};if(s.every(l=>o[l?.name]===r[l?.name]))return d}return t.issues.push(`instance "${String(e.id)}" has no variant match (${cc(i)}); using "${String(n.id)}"`),n}function cc(e){return Object.entries(e).map(([t,n])=>`${t}=${String(n)}`).join(", ")}function lc(e,t,n){let i=Array.isArray(e.pages)?e.pages.filter(ke):[];if(!i.length)return n.push("document has no pages"),null;if(t==null)return i[0];let a=i.find(r=>r.id===t);return a||(n.push(`unknown page "${String(t)}"`),null)}function Ya(e,t){t.byKey.has(e.key)?t.issues.push(`duplicate render key "${e.key}"`):t.byKey.set(e.key,e);let n=t.bySourceId.get(e.sourceId);n?n.push(e):t.bySourceId.set(e.sourceId,[e])}function dc(e,t,n){e.rebuild=()=>{e.measureText&&typeof e.measureText.clearCache=="function"&&e.measureText.clearCache();let i=vt(t,{...n,measureText:e.measureText});return e.pageId=i.pageId,e.title=i.title,e.mode=i.mode,e.componentId=i.componentId,e.roots=i.roots,e.byKey=i.byKey,e.bySourceId=i.bySourceId,e.componentById=i.componentById,e.styleById=i.styleById,e.page=i.page,e.background=i.background,e.doc=i.doc,Array.isArray(e.issues)?(e.issues.length=0,e.issues.push(...i.issues)):e.issues=i.issues,lt(e),e}}function di(e,t){if(!ke(e)||typeof t!="string")return;let n=e[t];return ke(n)?n:void 0}function Wa(e){if(!ke(e))return;let t={};return Oa.has(e.h)&&(t.h=e.h),Oa.has(e.v)&&(t.v=e.v),Object.keys(t).length?t:void 0}function ke(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function dt(e,t){return typeof e=="number"&&Number.isFinite(e)?e:t}function hc(e){return Math.min(1,Math.max(0,e))}var uc=/^[A-Za-z0-9_-]{1,64}$/,pc=/^assets\/[A-Za-z0-9._-]{1,120}$/;function jt(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)?e:null}function Rn(e){return Array.isArray(e)?e:[]}function Nt(e){return typeof e=="string"&&uc.test(e)}function fc(e){for(let t of Rn(e)){let n=jt(t);if(n?.type==="image"&&typeof n.asset=="string"&&pc.test(n.asset)&&!n.asset.includes(".."))return n.asset}return null}function $n(e){let t=new Map,n=[],i=new Set,a=new Set,r=new Map;function s(d,o,l,h){let u=jt(d);if(!u||!Nt(u.id))return null;let f=jt(u.screenshot)?.id,p={id:u.id,sourceId:u.id,name:typeof u.name=="string"?u.name:u.id,pageId:o,parentId:l,screenshot:Nt(f)?f:null,previewAsset:fc(u.fills),visible:h&&u.visible!==!1};t.set(p.id,p),r.set(p.id,{node:u,entry:p});for(let g of Rn(u.children)){let y=s(g,o,p.id,p.visible);p.previewAsset??=y}return p.visible?p.previewAsset:null}for(let d of Rn(jt(e)?.pages)){let o=jt(d);if(!(!o||!Nt(o.id)))for(let l of Rn(o.children))s(l,o.id,null,!0)}let c=new Map;for(let{node:d,entry:o}of r.values()){let l=Nt(d.pageRef)?r.get(d.pageRef):null;if(l&&!l.node.pageRef&&(o.sourceId=l.entry.id),!o.visible)continue;let h=c.get(o.sourceId);h?h.push(o.id):c.set(o.sourceId,[o.id])}for(let{node:d,entry:o}of r.values()){if(d.type!=="path"&&d.type!=="line")continue;let l=jt(d.interaction);if(!l||!Nt(l.from)||!Nt(l.to))continue;let h=t.get(l.from),u=t.get(l.to);if(!h?.visible||!u?.visible||!o.visible)continue;let f=typeof l.event=="string"&&l.event.trim()?l.event.trim():o.name,p=o.id.endsWith("-arrow")?o.id.replace(/-arrow$/,"-event"):null,g=r.get(Nt(l.labelId)?l.labelId:p??""),y=g?.node.type==="text"&&g.entry.pageId===o.pageId&&(g.entry.id===l.labelId||g.entry.parentId===o.parentId&&(g.node.text===f||g.node.name==="\u89E6\u53D1\u4E8B\u4EF6"))?g.entry.id:null;n.push({id:o.id,from:h.id,to:u.id,event:f,labelId:y,interactionId:Nt(l.id)?l.id:o.id}),a.add(h.id),a.add(u.id),i.add(o.id),y&&i.add(y)}for(let d of[...a]){let o=t.get(d);for(;o;){let l=c.get(o.sourceId);if(l?.length>1)for(let h of l)a.add(h);o=t.get(o.parentId??"")}}return{nodes:t,edges:n,wireIds:i,endpointIds:a,placements:c}}function Ga(e,t,n){let i=t;for(;i;){if(i.id===n)return!0;i=e.nodes.get(i.parentId??"")}return!1}function En(e,t){let n=new Set,i=new Set,a=null;for(let o of t){let l=e.nodes.get(o);if(!l?.visible)continue;let h=[...e.endpointIds].filter(f=>Ga(e,e.nodes.get(f),l.id)),u=l;if(!h.length)for(;u&&!e.endpointIds.has(u.id)&&!u.screenshot;)u=e.nodes.get(u.parentId??"");if(!(!u||!h.length&&!e.endpointIds.has(u.id)))if(i.add(e.nodes.get(u.sourceId)?.name??u.name),a??=u.id,h.length)for(let f of h)n.add(f);else n.add(u.id)}for(let o of t){let l=e.nodes.get(o);for(;l?.visible&&!n.has(l.id);)l=e.nodes.get(l.parentId??"");let h=l?.visible&&e.placements.get(l.sourceId);if(h&&h.length>1)for(let u of h)for(let f of e.endpointIds)Ga(e,e.nodes.get(f),u)&&n.add(f)}let r=[],s=new Map;function c(o,l,h,u){if(o===l)return;let f=s.get(o);f||(f={...e.nodes.get(o),key:o,events:[]},s.set(o,f)),f.events.push({edgeId:h.id,direction:u,text:h.event})}for(let o of e.edges){let l=n.has(o.from),h=n.has(o.to);!l&&!h||(r.push(o),l&&c(o.to,o.from,o,"outgoing"),h&&c(o.from,o.to,o,"incoming"))}let d=t.length===1&&a?e.placements.get(e.nodes.get(a).sourceId)??[]:[];return{ids:n,edges:r,targets:[...s.values()],name:[...i].join("\u3001"),anchorId:a,placements:d}}function Ka(e,t,n){let i=new Set;for(let a of t.edges)i.add(a.id),a.labelId&&i.add(a.labelId);return{emphasized:i,activeEdge:n,anchorId:t.anchorId,placements:t.placements,hidden:new Set([...e.wireIds].filter(a=>!i.has(a)))}}function Fe(e){return Math.round(e*100)/100}function Ua(e,t,n=9){let i=Math.atan2(t.y-e.y,t.x-e.x),a=Math.PI/6.5;return[{x:t.x-n*Math.cos(i-a),y:t.y-n*Math.sin(i-a)},{x:t.x-n*Math.cos(i+a),y:t.y-n*Math.sin(i+a)}]}function Za(e,t,n,i,a){let r=1-a,s=r*r,c=a*a;return{x:s*r*e.x+3*s*a*t.x+3*r*c*n.x+c*a*i.x,y:s*r*e.y+3*s*a*t.y+3*r*c*n.y+c*a*i.y}}function hi(e,t){let n={x:e.x+e.width/2,y:e.y+e.height/2},i={x:t.x+t.width/2,y:t.y+t.height/2},a=i.x-n.x,r=i.y-n.y,s,c,d,o;Math.abs(a)>=Math.abs(r)*.45?a>=0?(s={x:e.x+e.width,y:n.y},c={x:t.x,y:i.y},d={x:1,y:0},o={x:-1,y:0}):(s={x:e.x,y:n.y},c={x:t.x+t.width,y:i.y},d={x:-1,y:0},o={x:1,y:0}):r>=0?(s={x:n.x,y:e.y+e.height},c={x:i.x,y:t.y},d={x:0,y:1},o={x:0,y:-1}):(s={x:n.x,y:e.y},c={x:i.x,y:t.y+t.height},d={x:0,y:-1},o={x:0,y:1});let l=Math.hypot(c.x-s.x,c.y-s.y),h=Math.max(44,Math.min(180,l*.38)),u={x:s.x+d.x*h,y:s.y+d.y*h},f={x:c.x+o.x*h,y:c.y+o.y*h},[p,g]=Ua(f,c,9),y=1/0,A=1/0,k=-1/0,N=-1/0,I=ae=>{ae.x<y&&(y=ae.x),ae.y<A&&(A=ae.y),ae.x>k&&(k=ae.x),ae.y>N&&(N=ae.y)};for(let ae=0;ae<=16;ae+=1)I(Za(s,u,f,c,ae/16));I(p),I(g);let M=12,T=Fe(y-M),j=Fe(A-M),P=Math.max(24,Fe(k-y+M*2)),K=Math.max(24,Fe(N-A+M*2)),W=ae=>Fe(ae.x-T),Q=ae=>Fe(ae.y-j),B=[`M ${W(s)} ${Q(s)}`,`C ${W(u)} ${Q(u)} ${W(f)} ${Q(f)} ${W(c)} ${Q(c)}`,`M ${W(p)} ${Q(p)}`,`L ${W(c)} ${Q(c)}`,`L ${W(g)} ${Q(g)}`].join(" "),ce=Za(s,u,f,c,.5),pe=Fe(ce.x),L=Fe(ce.y-16);return{x:T,y:j,width:P,height:K,viewBox:{x:0,y:0,width:P,height:K},d:B,labelX:pe,labelY:L,start:s,end:c,c1:u,c2:f}}function Ja(e,t){let n=t.x-e.x,i=t.y-e.y,a=Math.hypot(n,i),r=Math.abs(n)>=Math.abs(i)*.45,s=Math.max(36,Math.min(160,a*.36)),c=r?{x:e.x+(n>=0?s:-s),y:e.y}:{x:e.x,y:e.y+(i>=0?s:-s)},d=r?{x:t.x+(n>=0?-s:s),y:t.y}:{x:t.x,y:t.y+(i>=0?-s:s)},[o,l]=Ua(d,t,8);return[`M ${Fe(e.x)} ${Fe(e.y)}`,`C ${Fe(c.x)} ${Fe(c.y)} ${Fe(d.x)} ${Fe(d.y)} ${Fe(t.x)} ${Fe(t.y)}`,`M ${Fe(o.x)} ${Fe(o.y)}`,`L ${Fe(t.x)} ${Fe(t.y)}`,`L ${Fe(l.x)} ${Fe(l.y)}`].join(" ")}function qa(e){if(typeof e!="object"||!e)return!1;let t=e;return typeof t.pageId=="string"&&Number.isFinite(t.x)&&Number.isFinite(t.y)&&Number.isFinite(t.zoom)&&t.zoom>=.02&&t.zoom<=32}var In=class{constructor(t=()=>window.localStorage){this.storage=t}storage;key="";current;byPage=new Map;timer;open(t,n){let i="dsh-canvas:view:1:"+JSON.stringify(t);if(i!==this.key){this.flush(),this.key=i,this.current=void 0,this.byPage.clear();try{let a=JSON.parse(this.storage().getItem(i)??"null");qa(a)&&(this.current=a,this.byPage.set(a.pageId,{x:a.x,y:a.y,zoom:a.zoom}))}catch{}}return n.some(a=>a.id===this.current?.pageId)||(this.current={pageId:n[0].id,x:40,y:40,zoom:1}),this.byPage.has(this.current.pageId)||this.byPage.set(this.current.pageId,{x:this.current.x,y:this.current.y,zoom:this.current.zoom}),this.current}getPageViewport(t){let n=this.byPage.get(t);return n?{...n}:null}observe(t,n){let i=this.current;if(!i||!t||i.pageId===t&&i.x===n.x&&i.y===n.y&&i.zoom===n.zoom)return;let a={pageId:t,...n};qa(a)&&(this.current=a,this.byPage.set(t,{x:n.x,y:n.y,zoom:n.zoom}),this.timer??=setTimeout(this.flush,200))}flush=()=>{if(this.timer!==void 0){clearTimeout(this.timer),this.timer=void 0;try{this.storage().setItem(this.key,JSON.stringify(this.current))}catch{}}}};fi();var tt=class extends Error{status;code;details;doc;revision;constructor(t,n,i,a,r,s){super(t),this.name="ApiError",this.status=n,this.code=i,this.details=a,this.doc=r,this.revision=s}};function bc(e){let t=typeof document<"u"?document.baseURI:void 0;try{let n=new URL(e,t??"http://127.0.0.1/");return n.origin==="null"?e:n.pathname+n.search}catch{return e}}function Ct(e){return bc(`dsh-canvas/api/${e}`)}async function ze(e,t={}){let n=await fetch(Ct(e),{method:t.method??"GET",headers:t.body===void 0?{accept:"application/json"}:{accept:"application/json","content-type":"application/json"},body:t.body===void 0?void 0:JSON.stringify(t.body),signal:t.signal,credentials:"same-origin"}),i=null,a=await n.text();try{i=a?JSON.parse(a):null}catch{throw new tt(`unexpected response from canvas host (${n.status})`,n.status,"bad-response")}if(!n.ok||i?.ok===!1)throw new tt(i?.message??i?.error??`canvas request failed (${n.status})`,n.status,i?.error??"request-failed",i?.details,i?.doc,i?.revision);return i}function Ft(e,t,n){let i=new URLSearchParams({sessionId:e});return t&&i.set("name",t),ze(`state?${i}`,{signal:n})}function gi(e,t,n,i,a){return ze("doc",{method:"PUT",body:{sessionId:e,name:t,baseRevision:n,doc:i},signal:a})}function or(e,t,n){return ze("doc/rename",{method:"POST",body:{sessionId:e,from:t,to:n}})}function cr(e,t){return ze("doc/delete",{method:"POST",body:{sessionId:e,name:t}})}function lr(e,t,n={}){return ze("audit",{method:"POST",body:{sessionId:e,name:t,...n}})}function dr(e){let t=new URLSearchParams({sessionId:e});return ze(`image/capabilities?${t}`)}function hr(e,t,n){return ze("image/generate",{method:"POST",body:{sessionId:e,name:t,prompt:n}})}function ur(e,t,n,i){return ze("selection",{method:"POST",body:{sessionId:e,name:t,ids:n,pageId:i}}).catch(()=>{})}function pr(e,t){let n=new URLSearchParams({sessionId:e,...t?{name:t}:{}});return ze(`pack?${n}`)}function fr(e,t,n){return ze("pack/import",{method:"POST",body:{sessionId:e,pack:t,name:n}})}function mr(e,t,n,i){return ze("snapshot",{method:"POST",body:{sessionId:e,requestId:t,data:n,nodeId:i}})}function ht(e,t,n){let i=new URLSearchParams({sessionId:e,name:t,asset:n});return Ct(`asset?${i}`)}function yi(e,t){let n=new URLSearchParams({sessionId:e,asset:t});return Ct(`font?${n}`)}function gr(e){return new Promise((t,n)=>{let i=new FileReader;i.onload=()=>{let a=String(i.result??""),r=a.indexOf(",");t(r===-1?"":a.slice(r+1))},i.onerror=()=>n(i.error??new Error("read failed")),i.readAsDataURL(e)})}function yr(e){let t=e.lastIndexOf(".");return t===-1?"":e.slice(t).toLowerCase()}async function xi(e,t){let n=yr(t.name);if(![".png",".jpg",".jpeg",".webp",".gif"].includes(n))throw new Error("\u53EA\u652F\u6301 png/jpeg/webp/gif \u56FE\u7247");let a=await gr(t);return ze("asset",{method:"POST",body:{sessionId:e,ext:n,data:a}})}async function xr(e,t,n){let i=yr(t.name);if(![".woff2",".woff",".ttf",".otf"].includes(i))throw new Error("\u53EA\u652F\u6301 woff2/woff/ttf/otf \u5B57\u4F53");let r=await gr(t);return ze("font",{method:"POST",body:{sessionId:e,ext:i,data:r,...n}})}async function br(e,t,n,i){let a=500;for(;!i.aborted;){try{let r=new URLSearchParams({sessionId:e,name:t}),s=await fetch(Ct(`events?${r}`),{headers:{accept:"text/event-stream"},credentials:"same-origin",signal:i});if(!s.ok||!s.body)throw new Error(`event stream failed (${s.status})`);a=500;let c=s.body.getReader(),d=new TextDecoder,o="";for(;!i.aborted;){let{done:l,value:h}=await c.read();if(l)break;o+=d.decode(h,{stream:!0});let u=o.indexOf(`

`);for(;u!==-1;){let f=o.slice(0,u);o=o.slice(u+2);for(let p of f.split(`
`))if(p.startsWith("data: "))try{let g=JSON.parse(p.slice(6));g?.type==="interaction-view-request"?mi.dispatchEvent(new CustomEvent("request",{detail:{sessionId:e,name:t,event:g}})):n(g)}catch{}u=o.indexOf(`

`)}}}catch{if(i.aborted)return}await new Promise(r=>setTimeout(r,a)),a=Math.min(a*2,5e3)}}function wt(e){try{return fetch(Ct("diag"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(e),credentials:"same-origin",keepalive:!0}).catch(()=>{})}catch{return Promise.resolve(void 0)}}var mi=new EventTarget;function vr(e){let t=n=>e(n.detail);return mi.addEventListener("request",t),()=>mi.removeEventListener("request",t)}function wr(e,t,n){return ze("interaction-view/reply",{method:"POST",body:{sessionId:e,requestId:t,result:n}})}function kr(e,t,n=!0){let i=new URLSearchParams({sessionId:e,probe:String(n)});return t&&i.set("name",t),ze(`figma/status?${i}`)}function Sr(e,t="readonly",n=90){return ze("figma/auth/token",{method:"POST",body:{token:e,scopeMode:t,expiresInDays:n}})}function Rr(){return ze("figma/auth/token",{method:"DELETE"})}function $r(e,t){return ze("figma/pair",{method:"POST",body:{sessionId:e,name:t}})}function Er(e,t){return ze("figma/paste",{method:"POST",body:{sessionId:e,...t}})}function bi(e,t,n){return ze("figma/import-url",{method:"POST",body:{sessionId:e,name:t,...n}})}async function vi(e,t,n,i){let a=new URLSearchParams({sessionId:e,name:t,mode:i.mode,dryRun:String(i.dryRun),fileName:n.name,...i.baseRevision?{baseRevision:i.baseRevision}:{}}),r=await fetch(Ct(`figma/import-fig?${a}`),{method:"POST",credentials:"same-origin",headers:{"content-type":"application/octet-stream"},body:n}),s=await r.json();if(!r.ok)throw new Error(s.message??"Figma .fig import failed");return s}function Ir(e,t,n){return ze("figma/push",{method:"POST",body:{sessionId:e,name:t,...n}})}function Nr(e,t,n){return ze("figma/comments/sync",{method:"POST",body:{sessionId:e,name:t,...n?{fileKey:n}:{}}})}async function Cr(e,t){let n=new URLSearchParams({sessionId:e,name:t}),i=await fetch(Ct(`figma/bundle?${n}`),{method:"GET",credentials:"same-origin"});if(!i.ok)throw new Error("Export .dshfig failed");return i.blob()}async function Mr(e,t,n){let i=new URLSearchParams({sessionId:e,name:t}),a=await fetch(Ct(`figma/bundle/import?${i}`),{method:"POST",credentials:"same-origin",headers:{"content-type":"application/octet-stream"},body:n}),r=await a.json();if(!a.ok)throw new Error(r.message??"Import .dshfig failed");return r}var Ar="<!--(figma)",wi=null;function Pr(e){if(!e||typeof e!="object")return!1;let t=e,n=t.tagName;return n==="INPUT"||n==="TEXTAREA"||n==="SELECT"||!!t.isContentEditable}function Dr(e){return!e||!wi||(e.getData("text/html")||"").includes(Ar)?!1:(e.getData("text/plain")||"")===wi}function ki(e){if(!e)return!1;if((e.getData("text/html")||"").includes(Ar))return!0;let n=e.getData("text/plain")||"";return!!/<svg[\s>]/i.test(n)}async function Fr(e,t){let n=typeof document<"u"?document.activeElement:null;if(Pr(e.target)||Pr(n))return!1;let i=e.clipboardData;if(!ki(i))return!1;e.preventDefault();let a=i?.getData("text/html")||void 0,r=i?.getData("text/plain")||void 0,s=vc(t.state.doc);try{let c=await Er(t.sessionId,{html:a,text:r,existingIds:s});if(!Array.isArray(c.nodes)||c.nodes.length===0)return t.toast("\u526A\u8D34\u677F\u4E2D\u6CA1\u6709\u53EF\u5BFC\u5165\u7684 Figma \u56FE\u5C42","error"),!0;let d=wc(t,c.nodes);if(d>0){let o=c.source==="figma-kiwi"?"Figma \u56FE\u5C42":"SVG \u8DEF\u5F84",l=c.warnings?.length?`\uFF08${c.warnings.length} \u6761\u63D0\u793A\uFF09`:"";t.toast(`\u5DF2\u7C98\u8D34 ${d} \u4E2A${o}${l}`)}return!0}catch(c){return t.toast(`\u7C98\u8D34 Figma \u5185\u5BB9\u5931\u8D25\uFF1A${c instanceof Error?c.message:String(c)}`,"error"),!0}}function vc(e){let t=[],n=i=>{for(let a of i??[])typeof a?.id=="string"&&t.push(a.id),Array.isArray(a?.children)&&n(a.children)};for(let i of e?.pages??[])n(i.children??[]);for(let i of e?.components??[])i?.root&&n([i.root]);return t}function wc(e,t){let n=1/0,i=1/0,a=-1/0,r=-1/0;for(let N of t){let I=Number(N.x??0),M=Number(N.y??0),T=Math.max(0,Number(N.width??0)),j=Math.max(0,Number(N.height??0));n=Math.min(n,I),i=Math.min(i,M),a=Math.max(a,I+T),r=Math.max(r,M+j)}let s=Number.isFinite(a-n)?a-n:0,c=Number.isFinite(r-i)?r-i:0,d=e.state.viewport??{x:0,y:0,zoom:1},o=e.viewportSize?.()??{width:800,height:600},l=(-d.x+o.width/2)/Math.max(.05,d.zoom),h=(-d.y+o.height/2)/Math.max(.05,d.zoom),u=0,f=0;if(e.state.componentMode){let N=e.activeRootContainer?.(e.state.doc),I=N?.id?e.findSceneNode?.(N.id):null;I&&(u=Number(I.absX??0),f=Number(I.absY??0))}let p=Math.round(l-u-(s>0?s/2:120)),g=Math.round(h-f-(c>0?c/2:120)),y=Number.isFinite(n)?p-n:0,A=Number.isFinite(i)?g-i:0,k=[];if(typeof e.mutate=="function")return e.mutate(N=>{let I=e.activeRootContainer?.(N)??N.pages.find(M=>M.id===e.state.pageId)??N.pages[0];if(I){if(e.state.componentMode&&I.type!=="frame"&&I.type!=="group")throw new Error("\u5F53\u524D\u4E3B\u7EC4\u4EF6\u6839\u8282\u70B9\u4E0D\u652F\u6301\u7C98\u8D34\u5B50\u56FE\u5C42");I.children=I.children??[];for(let M of t){let T=structuredClone(M);T.x=Math.round((Number(T.x??0)+y)*100)/100,T.y=Math.round((Number(T.y??0)+A)*100)/100,I.children.push(T),typeof T.id=="string"&&k.push(T.id)}}},{select:k}),k.length;if(typeof e.addNode=="function"){for(let N of t){let I=structuredClone(N);I.x=Math.round((Number(I.x??0)+y)*100)/100,I.y=Math.round((Number(I.y??0)+A)*100)/100;let M=e.addNode(I,null);M?.id&&k.push(M.id)}k.length&&e.setSelection?.(k)}return k.length}async function zr(e){try{if(!e.state.scene||!e.state.selection?.length)return!1;let t=await pi(e.state.scene,{nodeKeys:e.state.selection});return!t||typeof navigator>"u"||!navigator.clipboard?.writeText?!1:(await navigator.clipboard.writeText(t),wi=t,!0)}catch{return!1}}var Nn=class{constructor(t=100){this.limit=t,this.entries=[],this.index=-1}reset(t){this.entries=[JSON.stringify(t)],this.index=0}commit(t){let n=JSON.stringify(t);return this.index>=0&&this.entries[this.index]===n?!1:(this.entries=this.entries.slice(0,this.index+1),this.entries.push(n),this.entries.length>this.limit&&this.entries.shift(),this.index=this.entries.length-1,!0)}canUndo(){return this.index>0}canRedo(){return this.index>=0&&this.index<this.entries.length-1}undo(){return this.canUndo()?(this.index-=1,JSON.parse(this.entries[this.index])):null}redo(){return this.canRedo()?(this.index+=1,JSON.parse(this.entries[this.index])):null}replaceCurrent(t){if(this.index<0){this.reset(t);return}this.entries[this.index]=JSON.stringify(t)}};var Tr=/\[([^\][\n]{1,140})\]\(dsh-canvas:\/\/([a-z0-9][a-z0-9-_]{0,63})(?:\?([^)\n]*))?\)/g;function Lr(e){let t=(String(e.label??"\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D").replace(/[\[\]\n]/g," ").replace(/\s+/g," ").trim()||"\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D").slice(0,70),n=new URLSearchParams({node:e.node});return e.page&&n.set("page",e.page),`[${t}](dsh-canvas://${e.doc}?${n})`}function kc(e,t){Tr.lastIndex=t;let n=Tr.exec(e);if(!n)return;let i=new URLSearchParams(n[3]??"");return{id:"dsh-canvas",start:n.index,end:n.index+n[0].length,data:{label:n[1].trim()||"\u753B\u5E03",doc:n[2],node:i.get("node")??void 0,page:i.get("page")??void 0}}}var Br={id:"dsh-canvas",order:20,match:kc};var Cn="dsh-canvas:selection",Si=new Map,Sc=0;function Hr(e){e?.sessionId&&(Si.set(e.sessionId,{...e,at:Date.now(),seq:++Sc}),typeof window<"u"&&window.dispatchEvent(new CustomEvent(Cn,{detail:{...e}})))}function Mn(e){return Si.get(e)??null}function Or(e){Si.delete(e),typeof window<"u"&&window.dispatchEvent(new CustomEvent(Cn,{detail:{sessionId:e,dismissed:!0}}))}function Xr(e){if(typeof window>"u")return()=>{};let t=()=>e();return window.addEventListener(Cn,t),()=>window.removeEventListener(Cn,t)}var $i="material3",Yt={material3:{id:"material3",name:"Material Design 3",source:"Google",platform:"cross-platform",description:"Google \u7684\u8DE8\u5E73\u53F0\u8BBE\u8BA1\u89C4\u8303\uFF0C\u7EC4\u4EF6\u4E0E token \u8986\u76D6\u6700\u5E7F\uFF0C\u662F\u6700\u901A\u7528\u7684\u4E00\u5957\u3002",colors:{primary:"#6750A4",onPrimary:"#FFFFFF",primaryContainer:"#EADDFF",onPrimaryContainer:"#21005D",secondary:"#625B71",onSecondary:"#FFFFFF",secondaryContainer:"#E8DEF8",onSecondaryContainer:"#1D192B",surface:"#FEF7FF",onSurface:"#1D1B20",surfaceVariant:"#E7E0EC",onSurfaceVariant:"#49454F",background:"#FEF7FF",outline:"#79747E",outlineVariant:"#CAC4D0",error:"#B3261E",onError:"#FFFFFF",success:"#146C2E",warning:"#7D5260"},type:{displayLarge:{size:57,lineHeight:64,weight:400,letterSpacing:-.25},displayMedium:{size:45,lineHeight:52,weight:400,letterSpacing:0},displaySmall:{size:36,lineHeight:44,weight:400,letterSpacing:0},headlineLarge:{size:32,lineHeight:40,weight:400,letterSpacing:0},headlineMedium:{size:28,lineHeight:36,weight:400,letterSpacing:0},headlineSmall:{size:24,lineHeight:32,weight:400,letterSpacing:0},titleLarge:{size:22,lineHeight:28,weight:400,letterSpacing:0},titleMedium:{size:16,lineHeight:24,weight:500,letterSpacing:.15},titleSmall:{size:14,lineHeight:20,weight:500,letterSpacing:.1},bodyLarge:{size:16,lineHeight:24,weight:400,letterSpacing:.5},bodyMedium:{size:14,lineHeight:20,weight:400,letterSpacing:.25},bodySmall:{size:12,lineHeight:16,weight:400,letterSpacing:.4},labelLarge:{size:14,lineHeight:20,weight:500,letterSpacing:.1},labelMedium:{size:12,lineHeight:16,weight:500,letterSpacing:.5},labelSmall:{size:11,lineHeight:16,weight:500,letterSpacing:.5}},spacing:{xs:4,sm:8,md:12,lg:16,xl:24,xxl:32,xxxl:48},radius:{xs:4,sm:8,md:12,lg:16,xl:24,full:999},elevation:{level1:[{type:"drop-shadow",x:0,y:1,blur:3,spread:0,color:"#0000001A"}],level2:[{type:"drop-shadow",x:0,y:2,blur:6,spread:0,color:"#0000001F"}],level3:[{type:"drop-shadow",x:0,y:4,blur:12,spread:0,color:"#00000024"}]},components:{button:{height:40,radius:20,paddingX:24,label:"labelLarge"},card:{radius:12,padding:16,elevation:"level1"},textField:{height:56,radius:4,paddingX:16}}},ios:{id:"ios",name:"Apple Human Interface Guidelines",source:"Apple",platform:"iOS",description:"Apple \u7684 iOS \u5E73\u53F0\u89C4\u8303\uFF0C\u72B6\u6001\u680F\u3001\u5BFC\u822A\u680F\u3001\u6807\u7B7E\u680F\u3001\u5B89\u5168\u533A\u5C3A\u5BF8\u90FD\u6309 iPhone \u57FA\u51C6\u3002",colors:{blue:"#007AFF",green:"#34C759",red:"#FF3B30",orange:"#FF9500",yellow:"#FFCC00",purple:"#AF52DE",teal:"#5AC8FA",gray:"#8E8E93",background:"#F2F2F7",surface:"#FFFFFF",surfaceElevated:"#FFFFFFF2",label:"#000000",secondaryLabel:"#3C3C4399",tertiaryLabel:"#3C3C434D",separator:"#3C3C432E",fill:"#7878801F",onBlue:"#FFFFFF"},type:{largeTitle:{size:34,lineHeight:41,weight:700,letterSpacing:.37},title1:{size:28,lineHeight:34,weight:700,letterSpacing:.36},title2:{size:22,lineHeight:28,weight:600,letterSpacing:.35},title3:{size:20,lineHeight:25,weight:600,letterSpacing:.38},headline:{size:17,lineHeight:22,weight:600,letterSpacing:-.41},body:{size:17,lineHeight:22,weight:400,letterSpacing:-.41},callout:{size:16,lineHeight:21,weight:400,letterSpacing:-.32},subheadline:{size:15,lineHeight:20,weight:400,letterSpacing:-.24},footnote:{size:13,lineHeight:18,weight:400,letterSpacing:-.08},caption1:{size:12,lineHeight:16,weight:400,letterSpacing:0},caption2:{size:11,lineHeight:13,weight:400,letterSpacing:.07}},metrics:{screenWidth:393,screenHeight:852,statusBarHeight:54,navBarHeight:44,tabBarHeight:49,homeIndicatorWidth:134,homeIndicatorHeight:5,safeAreaBottom:34,margin:16,cardRadius:12,controlHeight:44},spacing:{xs:4,sm:8,md:12,lg:16,xl:20,xxl:32},radius:{sm:8,md:10,card:12,large:16,full:999},elevation:{card:[{type:"drop-shadow",x:0,y:1,blur:4,spread:0,color:"#0000000F"}]},components:{statusBar:{height:54},navBar:{height:44},tabBar:{height:49,totalWithHomeIndicator:83},button:{height:50,radius:12,paddingX:20}}}},vd=Object.keys(Yt);function Ei(e=$i){return Yt[e]??Yt[$i]}var wd=["If the user does not name a design system, use the built-in design system documented in .dsh-canvas/DESIGN.md:","Material Design 3 tokens for general UI, and Apple Human Interface Guidelines for iOS screens.","For a mobile/iOS screen, start from the foundation (iPhone 16 393\xD7852 by default; iPhone 15 optional) and a page template, then customize it."].join(" ");function Rc(e){return String(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function Ri(e,t,n){return`ds_${e}_${t}_${Rc(n)}`.slice(0,64)}function Vr(e=$i){let t=Ei(e),n=[],i=t.id==="material3"?{primary:"Primary",onPrimary:"On Primary",primaryContainer:"Primary Container",surface:"Surface",onSurface:"On Surface",surfaceVariant:"Surface Variant",onSurfaceVariant:"On Surface Variant",outline:"Outline",error:"Error",success:"Success"}:{blue:"Blue",green:"Green",red:"Red",orange:"Orange",gray:"Gray",background:"Background",surface:"Surface",label:"Label",secondaryLabel:"Secondary Label",separator:"Separator"};for(let[r,s]of Object.entries(i)){let c=t.colors[r];c&&n.push({id:Ri(t.id,"fill",s),type:"fill",name:`${t.id==="material3"?"M3":"iOS"}/Color/${s}`,value:{type:"solid",color:c}})}let a=t.id==="material3"?t.colors.onSurface:t.colors.label;for(let[r,s]of Object.entries(t.type)){let c=r.replace(/([A-Z])/g," $1").replace(/^./,d=>d.toUpperCase()).trim();n.push({id:Ri(t.id,"text",c),type:"text",name:`${t.id==="material3"?"M3":"iOS"}/Type/${c}`,value:{font:{family:"system-ui",weight:s.weight,style:"normal",size:s.size,lineHeight:Math.round(s.lineHeight/s.size*1e3)/1e3,letterSpacing:s.letterSpacing},fills:[{type:"solid",color:a}]}})}for(let[r,s]of Object.entries(t.elevation))n.push({id:Ri(t.id,"effect",r),type:"effect",name:`${t.id==="material3"?"M3":"iOS"}/Elevation/${r}`,value:structuredClone(s)});return n}var Ii={iphone16:{id:"iphone16",name:"iPhone 16",width:393,height:852,statusBarHeight:54,navBarHeight:44,tabBarHeight:49,tabBarTotalHeight:83,homeIndicatorWidth:134,homeIndicatorHeight:5,safeAreaBottom:34,margin:16},iphone15:{id:"iphone15",name:"iPhone 15",width:390,height:844,statusBarHeight:54,navBarHeight:44,tabBarHeight:49,tabBarTotalHeight:83,homeIndicatorWidth:134,homeIndicatorHeight:5,safeAreaBottom:34,margin:16}},Ni={neutral:{id:"neutral",name:"Neutral",pageHorizontal:16,sectionGap:16,cardPadding:16,cardRadius:12,buttonRadius:12,elevation:"soft",description:"\u9ED8\u8BA4\uFF1A\u514B\u5236\u7559\u767D\u3001\u8F7B\u9634\u5F71\u300112 \u5706\u89D2"},minimal:{id:"minimal",name:"Minimal",pageHorizontal:20,sectionGap:24,cardPadding:16,cardRadius:8,buttonRadius:8,elevation:"none",description:"\u66F4\u5927\u7559\u767D\u3001\u65E0\u9634\u5F71\u30018 \u5706\u89D2"},soft:{id:"soft",name:"Soft",pageHorizontal:20,sectionGap:20,cardPadding:20,cardRadius:20,buttonRadius:16,elevation:"soft",description:"\u67D4\u548C\u7559\u767D\u300120/16 \u5706\u89D2\u3001\u67D4\u548C\u9634\u5F71"},compact:{id:"compact",name:"Compact",pageHorizontal:12,sectionGap:12,cardPadding:12,cardRadius:8,buttonRadius:8,elevation:"none",description:"\u7D27\u51D1\u95F4\u8DDD\u30018 \u5706\u89D2\u3001\u65E0\u9634\u5F71"}},Rd=Object.keys(Ii),$d=Object.keys(Ni),ut="iphone16",on="neutral";function pt(e=ut){return Ii[e]??Ii[ut]}function Ci(e=on){return Ni[e]??Ni[on]}var Ed=["Foundation: for new mobile screens default to iPhone 16 393\xD7852 and the Neutral preset;","iPhone 15 390\xD7844 is available for legacy documents. Presets are Neutral/Minimal/Soft/Compact and","control page margins, section gaps, card padding, radii and shadow density only; keep the existing",'Material 3 / iOS HIG colors and typography. Get resolved tokens from canvas_template action "foundation".'].join(" ");var Wt=Yt.ios,J=Wt.colors;function $c(e){let t=Wt.type[e];return{family:"system-ui",weight:t.weight,style:"normal",size:t.size,lineHeight:Math.round(t.lineHeight/t.size*1e3)/1e3,letterSpacing:t.letterSpacing}}function ye(e,t,n,i,a,r,s="body",c=J.label,d={}){let o=$c(s);return{id:e,type:"text",name:t,x:n,y:i,width:a,height:Math.ceil(o.size*o.lineHeight),rotation:0,opacity:1,visible:!0,locked:!1,text:r,font:o,align:d.align??"left",verticalAlign:d.verticalAlign??"top",fills:[{type:"solid",color:c}],effects:[],autoHeight:!0}}function Ze(e,t,n,i,a,r,s={}){return{id:e,type:"rect",name:t,x:n,y:i,width:a,height:r,rotation:s.rotation??0,opacity:1,visible:!0,locked:!1,cornerRadius:s.cornerRadius??0,fills:s.fill?[{type:"solid",color:s.fill}]:[],strokes:s.stroke?[{color:s.stroke,width:s.strokeWidth??1,align:"center"}]:[],effects:s.effects??[]}}function Pi(e,t,n,i,a,r,s={}){return{id:e,type:"ellipse",name:t,x:n,y:i,width:a,height:r,rotation:0,opacity:1,visible:!0,locked:!1,fills:s.fill?[{type:"solid",color:s.fill}]:[],strokes:s.stroke?[{color:s.stroke,width:s.strokeWidth??1,align:"center"}]:[],effects:[]}}function Pn(e,t,n,i,a,r={}){return{id:e,type:"line",name:t,x:n,y:i,width:a,height:0,rotation:r.rotation??0,opacity:1,visible:!0,locked:!1,strokes:[{color:r.color??J.label,width:r.width??1,align:"center"}]}}function Qe(e,t,n,i,a,r,s,c={}){return{id:e,type:"frame",name:t,x:n,y:i,width:a,height:r,rotation:0,opacity:1,visible:!0,locked:!1,clip:c.clip??!0,cornerRadius:c.cornerRadius??0,fills:c.fill?[{type:"solid",color:c.fill}]:[],strokes:c.stroke?[{color:c.stroke,width:c.strokeWidth??1,align:"center"}]:[],effects:c.effects??[],children:s}}function Gt(e,t,n){let i=t==="light"?"#FFFFFF":J.label,a=t==="light"?"#FFFFFFCC":J.secondaryLabel,r=n.width,s=[ye(`${e}-time`,"Time",27,16,56,"9:41","subheadline",i),Ze(`${e}-island`,"Dynamic Island",(r-126)/2,11,126,37,{fill:J.label,cornerRadius:19}),ye(`${e}-5g`,"Network",r-87,17,25,"5G","caption2",i),Ze(`${e}-battery`,"Battery",r-56,19,25,12,{stroke:a,strokeWidth:1,cornerRadius:3}),Ze(`${e}-battery-fill`,"Battery level",r-54,21,20,8,{fill:i,cornerRadius:2}),Ze(`${e}-battery-tip`,"Battery tip",r-30,22,2,6,{fill:a,cornerRadius:1})];for(let c=0;c<4;c+=1){let d=4+c*2;s.push(Ze(`${e}-signal-${c}`,`Signal ${c+1}`,r-108+c*4,33-d,3,d,{fill:i,cornerRadius:1}))}return Qe(`${e}-root`,"Status Bar",0,0,r,n.statusBarHeight,s,{clip:!1})}function jr(e,t="Title"){return Qe("nav-root","Navigation Bar",0,0,e.width,e.navBarHeight,[ye("nav-back","Back",10,4,26,"\u2039","title1",J.blue),ye("nav-title","Title",(e.width-120)/2,10,120,t,"headline",J.label,{align:"center"}),ye("nav-action","Action",e.width-80,10,64,"Done","body",J.blue,{align:"right"})],{fill:J.surfaceElevated})}function Ai(e){let t=["Home","Search","Favorites","Inbox","Profile"],n=e.tabBarTotalHeight,i=[Pn("tab-top-line","Top separator",0,0,e.width,{color:J.separator,width:1})];return t.forEach((a,r)=>{let s=(r+.5)*e.width/t.length,d=r===0?J.blue:J.gray;i.push(Ze(`tab-icon-${r}`,`${a} icon`,s-12,10,24,24,{fill:d,cornerRadius:6}),ye(`tab-label-${r}`,a,s-32,38,64,a,"caption2",d,{align:"center"}))}),i.push(Ze("home-indicator","Home Indicator",(e.width-e.homeIndicatorWidth)/2,n-11,e.homeIndicatorWidth,e.homeIndicatorHeight,{fill:J.label,cornerRadius:3})),Qe("tab-root","Tab Bar",0,0,e.width,n,i,{fill:J.surfaceElevated,clip:!0})}function Ec(e){let t=[{icon:J.blue,label:"Wi-Fi",value:"Home"},{icon:J.green,label:"Bluetooth",value:"On"},{icon:J.orange,label:"Cellular",value:"5G"},{icon:J.gray,label:"Personal Hotspot",value:"Off"}],n=e.width-32,i=[];return t.forEach((a,r)=>{let s=12+r*44,c=n-48;i.push(Ze(`row-${r}-icon`,`${a.label} icon`,16,s,32,32,{fill:a.icon,cornerRadius:8}),Ze(`row-${r}-glyph`,`${a.label} glyph`,25,s+9,14,14,{fill:"#FFFFFF",cornerRadius:4}),ye(`row-${r}-label`,a.label,60,s+5,c-60,a.label,"body",J.label),ye(`row-${r}-value`,`${a.label} value`,c-62,s+7,62,a.value,"subheadline",J.secondaryLabel,{align:"right"}),ye(`row-${r}-chevron`,"Chevron",n-26,s+3,16,"\u203A","title3",J.tertiaryLabel,{align:"center"})),r<t.length-1&&i.push(Pn(`row-${r}-separator`,"Separator",60,s+43,n-76,{color:J.separator,width:1}))}),Qe("settings-card","General Settings Card",16,238,n,200,i,{fill:J.surface,cornerRadius:Wt.metrics.cardRadius,effects:Wt.elevation.card})}function Ic(e){let t=[{icon:J.blue,label:"Apple ID",value:"name@icloud.com"},{icon:J.gray,label:"Password & Security",value:""}],n=e.width-32,i=[];return t.forEach((a,r)=>{let s=12+r*44;i.push(Ze(`account-${r}-icon`,`${a.label} icon`,16,s,32,32,{fill:a.icon,cornerRadius:8}),ye(`account-${r}-label`,a.label,60,s+5,n-160,a.label,"body",J.label),ye(`account-${r}-value`,a.value,n-138,s+7,92,a.value,"footnote",J.secondaryLabel,{align:"right"}),ye(`account-${r}-chevron`,"Chevron",n-26,s+3,16,"\u203A","title3",J.tertiaryLabel,{align:"center"})),r===0&&i.push(Pn(`account-${r}-separator`,"Separator",60,s+43,n-76,{color:J.separator,width:1}))}),Qe("account-card","Account Card",16,480,n,100,i,{fill:J.surface,cornerRadius:Wt.metrics.cardRadius,effects:Wt.elevation.card})}function Nc(e){let t=e.width,n=Gt("screen-status","dark",e),i=Ai(e);i.y=e.height-e.tabBarTotalHeight;let a=Qe("search-field","Search Field",16,154,t-32,36,[Pi("search-icon","Search glyph",12,11,13,13,{stroke:J.secondaryLabel,strokeWidth:1.5}),Pn("search-icon-handle","Search handle",22,23,6,{color:J.secondaryLabel,width:1.5,rotation:45}),ye("search-placeholder","Placeholder",32,8,220,"Search settings","subheadline",J.secondaryLabel)],{fill:J.fill,cornerRadius:10});return Qe("screen-root","iOS Screen",0,0,t,e.height,[n,ye("screen-title","Large Title",16,72,t-50,"Settings","largeTitle",J.label),ye("screen-subtitle","Subtitle",16,124,t-50,"Manage your account and app preferences","subheadline",J.secondaryLabel),a,ye("section-general","Section Label",16,212,200,"GENERAL","caption1",J.secondaryLabel),Ec(e),ye("section-account","Section Label",16,454,200,"ACCOUNT","caption1",J.secondaryLabel),Ic(e),i],{fill:J.background,clip:!0})}function Mi(e,t,n,i,a,r){let s=e.width-32;return Qe(t,n,16,i,s,68,[ye(`${t}-label`,`${n} label`,0,0,s,a,"caption1",J.secondaryLabel),Ze(`${t}-box`,`${n} box`,0,20,s,48,{fill:J.fill,cornerRadius:10}),ye(`${t}-placeholder`,`${n} placeholder`,14,34,s-28,r,"body",J.secondaryLabel)],{clip:!1})}function _r(e,t,n,i){let a=e.width-32;return Qe(t,"Primary Button",16,n,a,52,[Ze(`${t}-bg`,"Button background",0,0,a,52,{fill:J.blue,cornerRadius:12}),ye(`${t}-label`,"Button label",0,16,a,i,"body",J.onBlue,{align:"center"})],{clip:!1})}function Cc(e){let t=e.width,n=e.height;return Qe("form-root","iOS Form Screen",0,0,t,n,[Gt("form-status","dark",e),ye("form-title","Title",16,80,t-32,"Create account","largeTitle",J.label),ye("form-subtitle","Subtitle",16,130,t-32,"Start by adding your details.","subheadline",J.secondaryLabel),Mi(e,"form-name","Name",180,"NAME","Your name"),Mi(e,"form-email","Email",260,"EMAIL","you@example.com"),Mi(e,"form-password","Password",340,"PASSWORD","At least 8 characters"),_r(e,"form-cta",n-158,"Continue"),ye("form-footnote","Footnote",16,n-94,t-32,"By continuing you agree to the terms.","caption1",J.secondaryLabel,{align:"center"}),Ze("form-home","Home Indicator",(t-e.homeIndicatorWidth)/2,n-18,e.homeIndicatorWidth,e.homeIndicatorHeight,{fill:J.label,cornerRadius:3})],{fill:J.background,clip:!0})}function Mc(e){let t=e.width,n=e.height,i=Ai(e);i.y=n-e.tabBarTotalHeight;let r=[["A","Alex Morgan","Design review \xB7 2m"],["M","Mia Chen","Shared a file \xB7 18m"],["S","Sam Rivera","Lunch tomorrow? \xB7 1h"],["J","Jordan Lee","Quarterly plan \xB7 3h"],["T","Taylor Kim","Voice note \xB7 Yesterday"],["N","Noah Patel","Deployment complete \xB7 Yesterday"]].map(([s,c,d],o)=>{let l=226+o*72;return Qe(`list-row-${o}`,`List Row ${o+1}`,16,l,t-32,64,[Pi(`list-avatar-${o}`,"Avatar",0,8,48,48,{fill:J.fill}),ye(`list-initial-${o}`,"Avatar initial",0,18,48,s,"title2",J.secondaryLabel,{align:"center"}),ye(`list-name-${o}`,"Name",64,8,t-140,c,"headline",J.label),ye(`list-preview-${o}`,"Preview",64,32,t-140,d,"subheadline",J.secondaryLabel),ye(`list-chevron-${o}`,"Chevron",t-80,20,16,"\u203A","title3",J.tertiaryLabel,{align:"center"})],{clip:!1})});return Qe("list-root","iOS List Screen",0,0,t,n,[Gt("list-status","dark",e),ye("list-title","Title",16,72,t-32,"Inbox","largeTitle",J.label),ye("list-subtitle","Subtitle",16,120,t-32,"6 conversations","subheadline",J.secondaryLabel),Qe("list-search","Search Field",16,154,t-32,36,[Pi("list-search-icon","Search glyph",12,11,13,13,{stroke:J.secondaryLabel,strokeWidth:1.5}),ye("list-search-placeholder","Placeholder",32,8,220,"Search","subheadline",J.secondaryLabel)],{fill:J.fill,cornerRadius:10}),...r,i],{fill:J.background,clip:!0})}function Pc(e){let t=e.width,n=e.height,i=jr(e,"Details");return Qe("detail-root","iOS Detail Screen",0,0,t,n,[Gt("detail-status","dark",e),i,Ze("detail-hero","Cover image",0,98,t,240,{fill:J.fill}),ye("detail-hero-label","Cover label",16,200,t-32,"Cover image","headline",J.secondaryLabel,{align:"center"}),ye("detail-title","Title",16,360,t-32,"A calmer way to start the day","title1",J.label),ye("detail-body","Body",16,404,t-32,"A short description of the story, collection or product. Replace this copy with real content.","body",J.secondaryLabel),ye("detail-meta","Meta",16,478,t-32,"5 min read \xB7 Today","caption1",J.secondaryLabel),_r(e,"detail-cta",n-158,"Read story"),Ze("detail-home","Home Indicator",(t-e.homeIndicatorWidth)/2,n-18,e.homeIndicatorWidth,e.homeIndicatorHeight,{fill:J.label,cornerRadius:3})],{fill:J.background,clip:!0})}function Ac(e){return Gt("tpl-status","dark",e)}function Dc(e){return Gt("tpl-status-light","light",e)}function Fc(e){return jr(e)}function zc(e){return Ai(e)}var Tc={"ios-screen":Nc,"ios-form-screen":Cc,"ios-list-screen":Mc,"ios-detail-screen":Pc,"ios-status-bar":Ac,"ios-status-bar-light":Dc,"ios-nav-bar":Fc,"ios-tab-bar":zc},We=pt(ut),cn=[{id:"ios-screen",name:"iOS \u5C4F\u5E55",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F + \u7075\u52A8\u5C9B\u3001\u5927\u6807\u9898\u3001\u641C\u7D22\u3001\u8BBE\u7F6E\u5361\u7247\u3001\u6807\u7B7E\u680F\u3001Home Indicator",system:"iOS HIG",category:"page",width:We.width,height:We.height,deviceAware:!0},{id:"ios-form-screen",name:"iOS \u8868\u5355\u9875",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5927\u6807\u9898\u3001\u8F93\u5165\u5B57\u6BB5\u3001\u4E3B\u6309\u94AE\u3001Home Indicator",system:"iOS HIG",category:"page",width:We.width,height:We.height,deviceAware:!0},{id:"ios-list-screen",name:"iOS \u5217\u8868\u9875",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5927\u6807\u9898\u3001\u641C\u7D22\u3001\u5217\u8868\u884C\u3001\u6807\u7B7E\u680F",system:"iOS HIG",category:"page",width:We.width,height:We.height,deviceAware:!0},{id:"ios-detail-screen",name:"iOS \u8BE6\u60C5\u9875",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5BFC\u822A\u680F\u3001\u5C01\u9762\u533A\u3001\u6807\u9898\u6B63\u6587\u3001\u5E95\u90E8\u6309\u94AE",system:"iOS HIG",category:"page",width:We.width,height:We.height,deviceAware:!0},{id:"ios-status-bar",name:"iOS \u72B6\u6001\u680F",description:"\u6807\u51C6 390/393\xD754 \u72B6\u6001\u680F\uFF1A\u65F6\u95F4\u3001\u7075\u52A8\u5C9B\u3001\u4FE1\u53F7\u30015G\u3001\u7535\u91CF\uFF08\u900F\u660E\u80CC\u666F\uFF0C\u6DF1\u8272\u56FE\u6807\uFF09",system:"iOS HIG",category:"system",width:We.width,height:We.statusBarHeight,deviceAware:!0},{id:"ios-status-bar-light",name:"iOS \u72B6\u6001\u680F\uFF08\u6DF1\u8272\u9875\u9762\uFF09",description:"\u6807\u51C6\u72B6\u6001\u680F\u7684\u6D45\u8272\u56FE\u6807\u7248\u672C\uFF0C\u7528\u4E8E\u6DF1\u8272\u80CC\u666F\uFF08\u900F\u660E\u80CC\u666F\uFF09",system:"iOS HIG",category:"system",width:We.width,height:We.statusBarHeight,deviceAware:!0},{id:"ios-nav-bar",name:"iOS \u5BFC\u822A\u680F",description:"iOS \u5BFC\u822A\u680F\uFF1A\u8FD4\u56DE\u3001\u6807\u9898\u3001\u53F3\u4FA7\u52A8\u4F5C",system:"iOS HIG",category:"system",width:We.width,height:We.navBarHeight,deviceAware:!0},{id:"ios-tab-bar",name:"iOS \u6807\u7B7E\u680F",description:"iOS \u6807\u7B7E\u680F\uFF1A5 \u4E2A Tab + Home Indicator",system:"iOS HIG",category:"system",width:We.width,height:We.tabBarTotalHeight,deviceAware:!0}];function An(e,t={}){let n=cn.find(o=>o.id===e),i=Tc[e];if(!n||!i)throw new Error(`unknown canvas template "${e}"`);let a=pt(t.device),r=i(a),s=`tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,c=0,d=o=>(o.id=`${s}_${(++c).toString(36)}`,Array.isArray(o.children)&&o.children.forEach(d),o);return d(r),r.name=n.name,r.rotation=0,{node:r,template:{...n,width:r.width,height:r.height,device:a.id}}}function Yr(e){let t={};for(let n of e.matchAll(/([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g))t[n[1]]=n[3]??n[4]??"";return t}function Wr(e){let t=(e.viewBox??"").trim().split(/[\s,]+/).map(Number);return t.length!==4||t.some(n=>!Number.isFinite(n))||t[2]<=0||t[3]<=0?null:{x:t[0],y:t[1],width:t[2],height:t[3]}}function Lc(e,t){let n=(i,a=0)=>{let r=Number(t[i]);return Number.isFinite(r)?r:a};if(e==="rect"){let i=n("x"),a=n("y"),r=n("width"),s=n("height");return r<=0||s<=0?null:`M${i} ${a}h${r}v${s}h${-r}z`}if(e==="circle"||e==="ellipse"){let i=n("cx"),a=n("cy"),r=n(e==="circle"?"r":"rx"),s=n(e==="circle"?"r":"ry");return r<=0||s<=0?null:`M${i-r} ${a}a${r} ${s} 0 1 0 ${r*2} 0a${r} ${s} 0 1 0 ${-r*2} 0z`}if(e==="line")return`M${n("x1")} ${n("y1")}L${n("x2")} ${n("y2")}`;if(e==="polyline"||e==="polygon"){let i=(t.points??"").trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);if(i.length<4)return null;let a=[];for(let r=0;r+1<i.length;r+=2)a.push(`${i[r]} ${i[r+1]}`);return`M${a.join("L")}${e==="polygon"?"Z":""}`}return null}function Gr(e){let t=[],n=[],i=/<svg\b([^>]*)>/i.exec(e),a=i?Yr(i[1]??""):{},r=Wr(a);/<text\b|<image\b|<filter\b|<mask\b|<clipPath\b/i.test(e)&&t.push("\u5DF2\u8DF3\u8FC7 text/image/filter/mask/clipPath"),(/<g\b[^>]*\btransform\s*=/i.test(e)||/<path\b[^>]*\btransform\s*=/i.test(e))&&t.push("\u5DF2\u8DF3\u8FC7 transform\uFF08\u57FA\u7840\u5BFC\u5165\u6682\u4E0D\u5C55\u5F00\u5206\u7EC4\u53D8\u6362\uFF09");let s=0;for(let c of e.matchAll(/<(path|rect|circle|ellipse|line|polyline|polygon)\b([^>]*)\/?>/gi)){s+=1;let d=c[1].toLowerCase(),o=Yr(c[2]??""),l=d==="path"?o.d:Lc(d,o);if(!l){t.push(`\u7B2C ${s} \u4E2A ${d} \u65E0\u6CD5\u8F6C\u6362\u4E3A path\uFF0C\u5DF2\u8DF3\u8FC7`);continue}let h;try{h=$t(l)}catch(y){t.push(`\u7B2C ${s} \u4E2A path \u65E0\u6CD5\u89E3\u6790\uFF0C\u5DF2\u8DF3\u8FC7\uFF1A${y instanceof Error?y.message:String(y)}`);continue}let u=Wr(o)??{x:h.bounds.minX,y:h.bounds.minY,width:Math.max(1,h.bounds.maxX-h.bounds.minX),height:Math.max(1,h.bounds.maxY-h.bounds.minY)},f=o.fill&&o.fill!=="none"&&/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(o.fill)?o.fill:null,p=o.stroke&&o.stroke!=="none"&&/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(o.stroke)?o.stroke:null,g=Number(o["stroke-width"]);n.push({name:o.id||`Path ${s}`,d:l,viewBox:u,width:r?.width??u.width,height:r?.height??u.height,fills:f?[{type:"solid",color:f}]:[],strokes:p?[{color:p,width:Number.isFinite(g)&&g>0?g:1,align:"center"}]:[],fillRule:o["fill-rule"]==="evenodd"?"evenodd":"nonzero"})}return n.length||t.push("\u6CA1\u6709\u627E\u5230\u53EF\u5BFC\u5165\u7684 <path>"),{paths:n,warnings:t}}function Kr(e){return e*Math.PI/180}function zt(e){return{x:e.absX+e.width/2,y:e.absY+e.height/2}}function Di(e,t){let n=zt(e),i=-Kr(e.rotation||0),a=t.x-n.x,r=t.y-n.y;return{x:a*Math.cos(i)-r*Math.sin(i)+e.width/2,y:a*Math.sin(i)+r*Math.cos(i)+e.height/2}}function $e(e,t){let n=zt(e),i=Kr(e.rotation||0),a=t.x-e.width/2,r=t.y-e.height/2;return{x:a*Math.cos(i)-r*Math.sin(i)+n.x,y:a*Math.sin(i)+r*Math.cos(i)+n.y}}function ln(e,t){if(!e||e.visible===!1)return!1;if(e.type==="group")return(e.children??[]).some(i=>ln(i,t));let n=Di(e,t);return n.x>=0&&n.y>=0&&n.x<=e.width&&n.y<=e.height}function Kt(e){return{x:e.absX,y:e.absY,width:e.width,height:e.height}}function Zr(e,t){return!(e.x+e.width<t.x||t.x+t.width<e.x||e.y+e.height<t.y||t.y+t.height<e.y)}function ft(e){if(!e.length)return null;let t=1/0,n=1/0,i=-1/0,a=-1/0;for(let r of e)t=Math.min(t,r.x),n=Math.min(n,r.y),i=Math.max(i,r.x+r.width),a=Math.max(a,r.y+r.height);return{x:t,y:n,width:i-t,height:a-n}}function Zt(e){return[$e(e,{x:0,y:0}),$e(e,{x:e.width,y:0}),$e(e,{x:e.width,y:e.height}),$e(e,{x:0,y:e.height})]}function ge(e,t){return{x:t.x*e.zoom+e.x,y:t.y*e.zoom+e.y}}function Ve(e,t){return{x:(t.x-e.x)/e.zoom,y:(t.y-e.y)/e.zoom}}function Ur(e,t){let n={nw:{x:0,y:0},n:{x:.5,y:0},ne:{x:1,y:0},e:{x:1,y:.5},se:{x:1,y:1},s:{x:.5,y:1},sw:{x:0,y:1},w:{x:0,y:.5}},i={};for(let[a,r]of Object.entries(n)){let s=$e(e,{x:r.x*e.width,y:r.y*e.height});i[a]=ge(t,s)}return i}function Jr(e,t){let n=$e(e,{x:e.width/2,y:-22/t.zoom});return ge(t,n)}function mt(e,t,n){return Math.min(n,Math.max(t,e))}function Fi(e){return e?.roots?.length?ft(e.roots.filter(t=>t.visible!==!1).map(Kt))??{x:0,y:0,width:1,height:1}:{x:0,y:0,width:1,height:1}}var qr="main";function it(e){return structuredClone(e)}function Ge(e,t){for(let n of e??[]){if(n.id===t)return n;let i=Ge(n.children,t);if(i)return i}return null}function Fn(e,t,n=null){for(let i of e??[]){if(i.id===t)return n;let a=Fn(i.children,t,i);if(a!==void 0)return a}}function dn(e,t){let n=e.findIndex(i=>i.id===t);if(n!==-1)return e.splice(n,1)[0];for(let i of e){let a=dn(i.children??[],t);if(a)return a}return null}function Dn(e,t){let n=it(e),i=new Map,a=s=>{let c=t(s.id,s);i.set(s.id,c),s.id=c,Array.isArray(s.children)&&s.children.forEach(a)};a(n);let r=s=>{if(i.has(s.pageRef)&&(s.pageRef=i.get(s.pageRef)),s.interaction)for(let c of["from","to","labelId"]){let d=s.interaction[c];i.has(d)&&(s.interaction[c]=i.get(d))}for(let c of s.children??[])r(c)};return r(n),n}function Qr(e,t){return e==="fill"?["frame","rect","ellipse","path","text"].includes(t):e==="text"?t==="text":e==="effect"?["frame","rect","ellipse","path","text"].includes(t):!1}var zn=class{viewMemory=new In;viewportListeners=new Set;publishedViewport=null;constructor({sessionId:t,inputActions:n,onToast:i}){this.sessionId=t,this.inputActions=n,this.onToast=i??(()=>{}),this.listeners=new Set,this.version=0,this.measure=Dt(),this.history=new Nn(100),this.saveTimer=null,this.selectionTimer=null,this.eventsAbort=null,this.pollTimer=null,this.mounted=!1,this.loadingAbort=null,this.readyPromise=new Promise(a=>{this.resolveReady=a}),this.fontAssets=new Map,this.state={ready:!1,error:null,loading:!0,docs:[],name:qr,doc:null,revision:null,path:"",pageId:null,selection:[],primaryKey:null,viewport:{x:40,y:40,zoom:1},tool:"pointer",panel:"layers",inspectorOpen:!0,dirty:!1,saving:!1,savedAt:null,conflict:null,notice:null,editingText:null,commentDraft:null,enteredInstance:null,componentMode:null,crop:null,scene:null,sceneIssues:[],showComments:!0,fontVersion:0,zoomLabel:"100%",historyVersion:0,foundation:{device:ut,preset:on},audit:null,imageCapabilities:null,imageGenerating:!1}}subscribe=t=>(this.listeners.add(t),()=>this.listeners.delete(t));getVersion=()=>this.version;subscribeViewport=t=>(this.viewportListeners.add(t),()=>{this.viewportListeners.delete(t)});getViewport=()=>this.state.viewport;getZoomPercentage=()=>Math.round(this.state.viewport.zoom*100);publishViewport(){if(this.mounted&&this.state.ready&&!this.state.componentMode&&this.viewMemory.observe(this.state.pageId,this.state.viewport),this.publishedViewport!==this.state.viewport){this.publishedViewport=this.state.viewport;for(let t of this.viewportListeners)t()}}emit(){this.publishViewport(),this.version+=1;for(let t of this.listeners)t()}set(t,n=!0){Object.assign(this.state,t),n&&this.emit()}toast(t,n="info"){this.state.notice={text:t,kind:n,at:Date.now()},this.emit(),this.onToast?.({text:t,kind:n}),clearTimeout(this.noticeTimer),this.noticeTimer=setTimeout(()=>{this.state.notice=null,this.emit()},3200)}async mount(){this.mounted||(this.mounted=!0,globalThis.window?.addEventListener("pagehide",this.viewMemory.flush),await this.bootstrap())}unmount(){this.viewMemory.flush(),globalThis.window?.removeEventListener("pagehide",this.viewMemory.flush),this.mounted=!1,clearTimeout(this.saveTimer),clearTimeout(this.selectionTimer),this.eventsAbort?.abort(),clearInterval(this.pollTimer),this.loadingAbort?.abort(),this.flush().catch(()=>{})}async bootstrap(){this.state.loading=!0,this.emit();try{let t=await Ft(this.sessionId,void 0);this.applyState(t,{resetHistory:!0}),this.state.ready=!0,this.state.loading=!1,this.emit(),await this.ensureFonts(),this.connectEvents(),this.startPolling()}catch(t){this.state.loading=!1,this.state.ready=!1,this.state.error=et(t),this.emit()}finally{this.resolveReady?.()}}async focusNode(t={}){if(await this.readyPromise,!this.state.ready)return!1;if(t.doc&&t.doc!==this.state.name&&await this.loadDoc(t.doc),t.page&&Ra(this.state.doc,t.page)&&(this.state.pageId=t.page,this.rebuild()),t.node&&!t.page&&!this.state.componentMode&&!this.findSceneNode(t.node)){let i=It(this.state.doc,t.node);i?.page&&i.page.id!==this.state.pageId&&(this.state.pageId=i.page.id,this.rebuild())}let n=t.node?this.findSceneNode(t.node):null;return t.node&&!n?(this.toast("\u753B\u5E03\u4E2D\u627E\u4E0D\u5230\u8FD9\u4E2A\u5143\u7D20\uFF0C\u53EF\u80FD\u5DF2\u88AB\u5220\u9664"),!1):(n&&(n.instanceId&&(this.state.enteredInstance=n.instanceId),this.state.inspectorOpen=!0,this.setSelection([n.key]),this.zoomToSelection()),this.emit(),!0)}applyState(t,{resetHistory:n=!1}={}){let i=Et(t.doc);this.state.doc=i,this.state.name=t.name??qr,this.state.revision=t.revision??null,this.state.path=t.path??"",this.state.docs=t.docs??[];let a=this.viewMemory.open([t.workspaceId??this.sessionId,this.state.name,i.id],i.pages);this.state.pageId=a.pageId,this.state.componentMode||(this.state.viewport={x:a.x,y:a.y,zoom:a.zoom}),this.state.selection=[...new Set(t.selection?.ids??[])],this.state.primaryKey=this.state.selection[0]??null,this.state.conflict=null,this.state.dirty=!1,this.state.error=null,n&&this.history.reset(i),this.rebuild()}rebuild(){if(this.state.doc){try{let t=vt(this.state.doc,{pageId:this.state.pageId,mode:this.state.componentMode?"component":"design",componentId:this.state.componentMode?.componentId,measureText:this.measure});lt(t),this.state.scene=t,this.state.sceneIssues=t.issues??[];let n=new Set(this.state.selection.filter(i=>t.byKey.has(i)));n.size!==this.state.selection.length&&(this.state.selection=[...n],this.state.primaryKey=this.state.selection[0]??null)}catch(t){this.state.scene=null,this.state.error=`\u753B\u5E03\u6E32\u67D3\u5931\u8D25\uFF1A${et(t)}`}this.state.historyVersion+=1}}findSceneNode(t){return this.state.scene?.byKey.get(t)??null}selectedNodes(){return this.state.selection.map(t=>this.findSceneNode(t)).filter(Boolean)}primaryNode(){return this.state.primaryKey?this.findSceneNode(this.state.primaryKey):null}setSelection(t,n){this.state.selection=[...new Set(t)],this.state.primaryKey=n??this.state.selection[0]??null,this.state.editingText=null,this.emit(),this.queueSelectionPost()}toggleSelection(t){let n=this.state.selection.includes(t);this.setSelection(n?this.state.selection.filter(i=>i!==t):[...this.state.selection,t],t)}clearSelection(){this.setSelection([],null)}queueSelectionPost(){clearTimeout(this.selectionTimer),this.selectionTimer=setTimeout(()=>{let t=new Set;for(let n of this.state.selection){let i=this.findSceneNode(n);t.add(i?.instanceId??i?.id??n)}ur(this.sessionId,this.state.name,[...t],this.state.pageId)},120)}setTool(t){this.state.tool=t,t!=="comment"&&(this.state.commentDraft=null),this.emit()}setPanel(t){this.state.panel=t,this.emit()}setViewport(t){let n=this.state.viewport;n.x===t.x&&n.y===t.y&&n.zoom===t.zoom||(this.state.viewport=t,this.publishViewport())}zoomAt(t,n){let i=this.state.viewport,a=Ve(i,t),r=mt(i.zoom*n,.02,32);this.setViewport({zoom:r,x:t.x-a.x*r,y:t.y-a.y*r})}zoomToFit(t=48){let n=this.state.scene;n&&this.zoomToRect(Fi(n),t)}zoomToSelection(t=64){let n=this.state.scene;if(!n)return;let i=ft(this.selectedNodes().map(Kt));this.zoomToRect(i??Fi(n),t)}zoomToRect(t,n=48){let i=this.viewportSize(),a=Math.max(1,t.width),r=Math.max(1,t.height),s=mt(Math.min((i.width-n*2)/a,(i.height-n*2)/r),.02,8);this.setViewport({zoom:s,x:i.width/2-(t.x+a/2)*s,y:i.height/2-(t.y+r/2)*s})}viewportSize(){return this.canvasSize??{width:900,height:600}}async loadDoc(t,{resetHistory:n=!0}={}){await this.flush();try{let i=await Ft(this.sessionId,t);this.applyState(i,{resetHistory:n}),this.emit(),await this.ensureFonts(),this.connectEvents(),this.startPolling()}catch(i){this.toast(i instanceof tt?i.message:String(i),"error")}}async createDoc(t){if(!/^[a-z0-9][a-z0-9-_]{0,63}$/.test(t)){this.toast("\u8BBE\u8BA1\u7A3F\u540D\u79F0\u53EA\u80FD\u662F\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001- \u548C _","error");return}try{await this.flush();let n=xa("\u65B0\u8BBE\u8BA1\u7A3F");n.pages[0].name="\u753B\u5E03 1";let i=await gi(this.sessionId,t,null,n);this.state.revision=i.revision,await this.loadDoc(t),this.toast("\u5DF2\u521B\u5EFA\u8BBE\u8BA1\u7A3F")}catch(n){this.toast(n instanceof tt?n.message:String(n),"error")}}async renameDoc(t,n=this.state.name){if(!/^[a-z0-9][a-z0-9-_]{0,63}$/.test(t)){this.toast("\u8BBE\u8BA1\u7A3F\u540D\u79F0\u53EA\u80FD\u662F\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001- \u548C _","error");return}if(t===n){this.toast("\u540D\u79F0\u6CA1\u6709\u53D8\u5316");return}try{if(await this.flush(),this.state.dirty||this.state.saving){this.toast("\u8BF7\u5148\u89E3\u51B3\u8BBE\u8BA1\u7A3F\u4FDD\u5B58\u51B2\u7A81\uFF0C\u518D\u91CD\u547D\u540D","error");return}let i=this.state.name,a=await or(this.sessionId,n,t),r=a.name??t;if(this.state.docs=a.docs??this.state.docs,n!==i){this.emit(),this.toast("\u5DF2\u91CD\u547D\u540D\u8BBE\u8BA1\u7A3F");return}await this.loadDoc(r);let s=this.state.doc;s&&(!s.title||s.title==="\u4E3B\u753B\u5E03"||s.title==="\u65B0\u753B\u5E03"||s.title==="\u4E3B\u8BBE\u8BA1\u7A3F"||s.title==="\u65B0\u8BBE\u8BA1\u7A3F"||s.title===i)&&s.title!==r&&(s.title=r,this.state.dirty=!0,this.state.docs=(this.state.docs??[]).map(d=>d.name===r?{...d,title:r}:d),this.scheduleSave()),this.toast("\u5DF2\u91CD\u547D\u540D\u8BBE\u8BA1\u7A3F")}catch(i){this.toast(i instanceof tt?i.message:String(i),"error")}}async deleteDoc(){try{if(await this.flush(),this.state.dirty||this.state.saving){this.toast("\u8BF7\u5148\u89E3\u51B3\u8BBE\u8BA1\u7A3F\u4FDD\u5B58\u51B2\u7A81\uFF0C\u518D\u5220\u9664","error");return}let t=await cr(this.sessionId,this.state.name),n=t.name??"main";this.state.docs=t.docs??[],await this.loadDoc(n),this.toast("\u5DF2\u5220\u9664\u8BBE\u8BA1\u7A3F")}catch(t){this.toast(t instanceof tt?t.message:String(t),"error")}}async flush(){if(clearTimeout(this.saveTimer),!this.state.doc||!this.state.dirty||this.state.saving)return;let t=this.state.revision,n=it(this.state.doc);this.state.saving=!0,this.emit();let i=JSON.stringify(n);try{let a=await gi(this.sessionId,this.state.name,t,n);this.state.revision=a.revision,this.state.path=a.path,this.state.savedAt=Date.now(),JSON.stringify(this.state.doc)===i?this.state.dirty=!1:(this.state.dirty=!0,clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.flush(),250))}catch(a){a instanceof tt&&a.status===409?this.state.conflict={revision:a.revision,doc:a.doc?Et(a.doc):null,message:"\u8BBE\u8BA1\u7A3F\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"}:this.toast(a instanceof tt?a.message:String(a),"error")}finally{this.state.saving=!1,this.emit()}}scheduleSave(){this.state.dirty=!0,clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.flush(),400),this.emit()}startPolling(){clearInterval(this.pollTimer),this.pollTimer=setInterval(()=>{!this.mounted||!this.state.ready||this.state.saving||this.pollRemote().catch(()=>{})},3e3)}async pollRemote(){let t=await Ft(this.sessionId,this.state.name);if(!(!t||t.revision===this.state.revision)){if(this.state.dirty){this.state.conflict={revision:t.revision,doc:t.doc?Et(t.doc):null,message:"\u8BBE\u8BA1\u7A3F\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"},this.emit();return}this.applyState(t,{resetHistory:!1}),this.emit()}}connectEvents(){this.eventsAbort?.abort();let t=new AbortController;this.eventsAbort=t,br(this.sessionId,this.state.name,n=>{if(n.type==="snapshot-request"){this.renderSnapshotFor(n).catch(i=>{console.warn("[dsh-canvas] snapshot failed",i)});return}if(n.type==="doc-changed"&&n.revision!==this.state.revision&&n.source!=="client"){if(this.state.dirty||this.state.saving){this.state.conflict={revision:n.revision,message:"\u8BBE\u8BA1\u7A3F\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"},this.emit();return}this.reloadFromServer(!1)}},t.signal)}async reloadFromServer(t=!0){try{let n=await Ft(this.sessionId,this.state.name),i=this.history;this.applyState(n,{resetHistory:!1}),t||i.reset(n.doc),this.emit()}catch(n){this.toast(n instanceof tt?n.message:String(n),"error")}}resolveConflict(t){let n=this.state.conflict;if(n){if(t&&!n.doc){this.state.conflict=null,this.reloadFromServer(!1);return}if(t&&n.doc){this.state.doc=Et(n.doc),this.state.revision=n.revision,this.state.conflict=null,this.state.dirty=!1,this.history.reset(this.state.doc),this.rebuild(),this.emit(),this.toast("\u5DF2\u52A0\u8F7D\u6700\u65B0\u8BBE\u8BA1\u7A3F");return}this.state.revision=n.revision,this.state.conflict=null,this.state.dirty=!0,this.flush()}}mutate(t,{commit:n=!0,select:i}={}){if(this.state.doc){try{t(this.state.doc)}catch(a){this.toast(et(a),"error");return}i&&(this.state.selection=[...new Set(i)],this.state.primaryKey=this.state.selection[0]??null),this.rebuild(),this.emit(),n&&(this.commit(),this.scheduleSave(),this.queueSelectionPost())}}commit(){this.state.doc&&this.history.commit(this.state.doc),this.state.historyVersion+=1,this.emit()}updateNode(t,n,i={}){this.mutate(a=>{let r=Ge([...a.pages.flatMap(s=>s.children),...a.components.map(s=>s.root)],t);if(!r)throw new Error(`\u627E\u4E0D\u5230\u8282\u70B9 ${t}`);Object.assign(r,n)},i)}updateSelected(t,n={}){let i=this.selectedNodes().filter(a=>a.editable);i.length&&this.mutate(a=>{for(let r of i){let s=Ge([...a.pages.flatMap(c=>c.children),...a.components.map(c=>c.root)],r.sourceId);s&&Object.assign(s,t)}},n)}updateNodeBySource(t,n,i={}){this.updateNode(t,n,i)}activeComponent(t=this.state.doc){return!t||!this.state.componentMode?null:t.components?.find(n=>n.id===this.state.componentMode.componentId)??null}activeRootContainer(t=this.state.doc){return t?this.state.componentMode?this.activeComponent(t)?.root??null:t.pages.find(n=>n.id===this.state.pageId)??t.pages[0]??null:null}findActiveDocNode(t,n){if(!t||!n)return null;if(this.state.componentMode){let a=this.activeComponent(t)?.root;return a?Ge([a],n):null}let i=t.pages.find(a=>a.id===this.state.pageId)??t.pages[0];if(i){let a=Ge(i.children,n);if(a)return a}return Ge(t.pages.flatMap(a=>a.children),n)}findActiveDocParent(t,n){if(!t||!n)return;if(this.state.componentMode){let a=this.activeComponent(t)?.root;return a?Fn([a],n,null):void 0}let i=t.pages.find(a=>a.id===this.state.pageId)??t.pages[0];if(i){let a=Fn(i.children,n,null);if(a!==void 0)return a}for(let a of t.pages){if(a===i)continue;let r=Fn(a.children,n,null);if(r!==void 0)return r}}findActiveOwnerList(t,n){let i=this.findActiveDocParent(t,n);if(i===void 0)return null;if(i)return Array.isArray(i.children)?i.children:null;if(this.state.componentMode)return null;let a=this.activeRootContainer(t);return Array.isArray(a?.children)?a.children:null}addNode(t,n,i){let a=t.id??ve(t.type==="instance"?"i":"n"),r={name:t.name??Oc(t.type),x:0,y:0,width:120,height:120,rotation:0,opacity:1,visible:!0,locked:!1,...t,id:a};r.type!=="frame"&&r.type!=="group"&&r.type!=="instance"&&delete r.children;let s=!1;return this.mutate(c=>{let d=this.activeRootContainer(c);if(!d)return;let o=d;if(n){let h=this.findActiveDocNode(c,n);h&&(o=h)}if((o!==d||this.state.componentMode)&&o.type!=="frame"&&o.type!=="group")throw new Error("\u76EE\u6807\u8282\u70B9\u4E0D\u652F\u6301\u6DFB\u52A0\u5B50\u56FE\u5C42");o.children=o.children??[];let l=i==null?o.children.length:mt(i,0,o.children.length);o.children.splice(l,0,r),s=!0},{select:[a]}),s?r:null}createShapeAt(t,n){let i={frame:{name:"Frame",width:320,height:480,fills:[{type:"solid",color:"#FFFFFF"}],strokes:[],effects:[],cornerRadius:0,clip:!0,children:[]},rect:{name:"Rectangle",width:120,height:120,fills:[{type:"solid",color:"#D9D9D9"}],strokes:[],effects:[],cornerRadius:0},ellipse:{name:"Ellipse",width:120,height:120,fills:[{type:"solid",color:"#D9D9D9"}],strokes:[],effects:[],cornerRadius:0},text:{name:"Text",width:200,height:28,text:"Text",font:{family:"system-ui",weight:400,style:"normal",size:16,lineHeight:1.4,letterSpacing:0},align:"left",verticalAlign:"top",fills:[{type:"solid",color:"#111111"}],effects:[],autoHeight:!0},line:{name:"Line",width:160,height:0,strokes:[{color:"#111111",width:1,align:"center"}]}}[t];if(!i)return;let a=this.addNode({type:t,...i,x:n.x,y:n.y,rotation:0,opacity:1,visible:!0,locked:!1},null);return a&&(this.setTool("pointer"),a.type==="text"&&this.beginTextEdit(a.id)),a}deleteSelection(){let t=this.selectedNodes().filter(i=>i.editable),n=[...new Set(t.map(i=>i.sourceId))];if(n.length){if(this.state.componentMode){let i=this.activeComponent(this.state.doc)?.root?.id;if(n=n.filter(a=>a!==i),!n.length){this.toast("\u4E0D\u80FD\u5220\u9664\u4E3B\u7EC4\u4EF6\u6839\u8282\u70B9");return}this.mutate(a=>{let r=this.activeComponent(a)?.root;if(r?.children)for(let s of n)dn(r.children,s)},{select:[]});return}this.mutate(i=>{for(let a of n)for(let r of i.pages)dn(r.children,a)},{select:[]})}}createPageReference(){let t=this.primaryNode();if(this.state.componentMode||this.state.selection.length!==1||!t?.editable||t.isInstanceRoot)return;let n=t.sourceNode,i=$n(this.state.doc).wireIds,a=it(n);function r(c){Array.isArray(c.children)&&(c.children=c.children.filter(d=>!i.has(d.id)),c.children.forEach(r))}r(a);let s=Dn(a,()=>ve("n"));return s.pageRef=It(this.state.doc,n.pageRef)?.node?.id??n.id,s.x+=n.width+32,s.screenshot&&(s.screenshot.use="reused"),this.addNode(s,this.findActiveDocParent(this.state.doc,n.id)?.id??null)}duplicateSelection(){let t=this.state.componentMode?this.activeComponent(this.state.doc)?.root?.id:null,n=this.selectedNodes().filter(a=>a.editable&&a.sourceId!==t);if(!n.length)return;let i=[];this.mutate(a=>{for(let r of n){let s=this.findActiveOwnerList(a,r.sourceId);if(!s)continue;let c=s.find(o=>o.id===r.sourceId)??Ge(s,r.sourceId);if(!c)continue;let d=Dn(c,(o,l)=>ve(l?.type==="instance"?"i":"n"));d.x+=10,d.y+=10,s.push(d),i.push(d.id)}},{select:i})}findDocParent(t,n){return this.findActiveDocParent(t,n)}copySelection(){let t=this.selectedNodes().filter(n=>n.editable);t.length&&(this.clipboard=t.map(n=>it(n.sourceNode)),zr(this),this.toast(`\u5DF2\u590D\u5236 ${t.length} \u4E2A\u56FE\u5C42`))}setPage(t){if(!this.state.doc?.pages?.some(a=>a.id===t)||this.state.pageId===t&&!this.state.componentMode)return;!this.state.componentMode&&this.state.pageId&&this.viewMemory.observe(this.state.pageId,this.state.viewport),this.state.componentMode=null,this.state.pageId=t,this.state.selection=[],this.state.primaryKey=null,this.state.editingText=null,this.state.enteredInstance=null,this.state.commentDraft=null,this.state.crop=null,this.rebuild();let i=this.viewMemory.getPageViewport(t);i?this.state.viewport=i:this.state.scene?.roots?.length?this.zoomToFit():this.state.viewport={x:40,y:40,zoom:1},this.emit(),this.queueSelectionPost()}addPage(t){let n=ve("page");this.mutate(i=>{i.pages.push({id:n,name:t?.trim()||`\u753B\u5E03 ${i.pages.length+1}`,background:"#f5f5f5",children:[]})}),this.setPage(n)}renamePage(t,n){let i=String(n??"").trim().slice(0,120);if(!i)return!1;let a=this.state.doc?.pages?.find(r=>r.id===t);return!a||a.name===i?!1:(this.mutate(r=>{let s=r.pages.find(c=>c.id===t);s&&(s.name=i)}),!0)}deletePage(t){let n=this.state.doc;if(!n)return!1;if(n.pages.length<=1)return this.toast("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u753B\u5E03"),!1;let i=n.pages.findIndex(s=>s.id===t);if(i===-1)return!1;let a=this.state.pageId===t,r=a?n.pages[i+1]?.id??n.pages[i-1]?.id??null:null;return a&&r&&this.setPage(r),this.mutate(s=>{let c=s.pages.findIndex(d=>d.id===t);c!==-1&&s.pages.splice(c,1),s.comments=(s.comments??[]).filter(d=>d.pageId!==t)}),!0}duplicatePage(t){let n=this.state.doc;if(!n||n.pages.findIndex(r=>r.id===t)===-1)return null;let a=ve("page");return this.mutate(r=>{let s=r.pages.findIndex(l=>l.id===t);if(s===-1)return;let c=r.pages[s],d=Dn({id:c.id,children:c.children??[]},(l,h)=>l===c.id?a:ve(h?.type==="instance"?"i":"n")),o={...it(c),id:a,name:`${c.name} \u526F\u672C`,children:d.children??[]};r.pages.splice(s+1,0,o)}),this.setPage(a),a}setPageBackground(t,n){let i=this.state.doc;if(!i)return;let a=n??this.state.pageId??i.pages[0]?.id;if(!a)return;let r=i.pages.find(d=>d.id===a);if(!r)return;let s=typeof t=="string"?t.trim():"",c=s||null;(r.background??null)!==c&&this.mutate(d=>{let o=d.pages.find(l=>l.id===a);o&&(o.background=c)})}async reload(){let t=await Ft(this.sessionId,this.state.name);this.applyState(t,{resetHistory:!0}),this.emit()}paste(){if(!this.clipboard?.length)return;let t=[];this.mutate(n=>{let i=this.activeRootContainer(n);if(i){if(this.state.componentMode&&i.type!=="frame"&&i.type!=="group")throw new Error("\u5F53\u524D\u4E3B\u7EC4\u4EF6\u6839\u8282\u70B9\u4E0D\u652F\u6301\u7C98\u8D34\u5B50\u56FE\u5C42");i.children=i.children??[];for(let a of this.clipboard){let r=Dn(a,(s,c)=>ve(c?.type==="instance"?"i":"n"));r.x+=20,r.y+=20,i.children.push(r),t.push(r.id)}}},{select:t})}groupSelection(){let t=this.state.componentMode?this.activeComponent(this.state.doc)?.root?.id:null,n=this.selectedNodes().filter(s=>s.editable&&s.sourceId!==t);if(n.length<2)return;let i=n[0].parent?.id??null;if(!n.every(s=>(s.parent?.id??null)===i)){this.toast("\u53EA\u6709\u540C\u4E00\u7236\u7EA7\u7684\u56FE\u5C42\u53EF\u4EE5\u6210\u7EC4");return}let a=ft(n.map(s=>({x:s.absX,y:s.absY,width:s.width,height:s.height}))),r=ve("g");this.mutate(s=>{let c=i?this.findActiveDocNode(s,i):this.activeRootContainer(s);if(!c||!Array.isArray(c.children))return;let d=c.children,o=new Set(n.map(p=>p.sourceId)),l=[];for(let p=d.length-1;p>=0;p-=1)o.has(d[p].id)&&l.unshift(d.splice(p,1)[0]);let h=n[0].parent?{x:n[0].parent.absX,y:n[0].parent.absY}:{x:0,y:0},u=a.x-h.x,f=a.y-h.y;for(let p of l)p.x-=u,p.y-=f;d.push({id:r,type:"group",name:"Group",x:u,y:f,width:a.width,height:a.height,rotation:0,opacity:1,visible:!0,locked:!1,children:l})},{select:[r]})}ungroupSelection(){let t=this.selectedNodes().filter(i=>i.sourceNode?.type==="group"&&i.editable);if(!t.length)return;let n=[];this.mutate(i=>{for(let a of t){let r=this.findActiveOwnerList(i,a.sourceId);if(!r)continue;let s=r.findIndex(o=>o.id===a.sourceId);if(s===-1)continue;let[c]=r.splice(s,1),d=s;for(let o of c.children??[])o.x+=c.x,o.y+=c.y,r.splice(d,0,o),d+=1,n.push(o.id)}},{select:n})}reorder(t){let n=this.selectedNodes().filter(i=>i.editable);n.length&&this.mutate(i=>{for(let a of n){let r=this.findActiveOwnerList(i,a.sourceId);if(!r)continue;let s=r.findIndex(d=>d.id===a.sourceId);if(s===-1)continue;let[c]=r.splice(s,1);t==="front"?r.push(c):t==="back"?r.unshift(c):t==="forward"?r.splice(Math.min(r.length,s+1),0,c):r.splice(Math.max(0,s-1),0,c)}},{select:this.state.selection})}moveLayer(t,n,i){let a=this.state.doc;if(!a||!t)return!1;let r=this.activeRootContainer(a);if(!r||this.state.componentMode&&t===r.id)return!1;let s=this.findActiveDocNode(a,t),c=this.findActiveOwnerList(a,t);if(!s||!c||c.findIndex(y=>y.id===t)===-1)return!1;let o=n===null||!this.state.componentMode&&n===r.id||!!this.state.componentMode&&n===r.id,l=null;if(o){if(this.state.componentMode&&r.type!=="frame"&&r.type!=="group")return!1;l=r}else if(l=this.findActiveDocNode(a,n),!l||l.type!=="frame"&&l.type!=="group"||l.id===t||Ge(s.children??[],l.id))return!1;let h=c===l.children,u=this.findSceneNode(t),f={x:0,y:0};if(o){if(this.state.componentMode){let y=this.findSceneNode(r.id);y&&(f={x:y.absX,y:y.absY})}}else{let y=this.findSceneNode(l.id);y&&(f={x:y.absX,y:y.absY})}let p=!1,g=this.state.selection.includes(t)?this.state.selection:[t];return this.mutate(y=>{let A=this.activeRootContainer(y),k=this.findActiveOwnerList(y,t);if(!A||!k)return;let N=o?A:this.findActiveDocNode(y,n);if(!N)return;N.children=N.children??[];let I=k.findIndex(j=>j.id===t);if(I===-1)return;let[M]=k.splice(I,1);!h&&u&&(M.x=u.absX-f.x,M.y=u.absY-f.y);let T=mt(Number.isFinite(i)?Math.trunc(i):N.children.length,0,N.children.length);N.children.splice(T,0,M),p=!0},{select:g}),p}align(t){let n=this.selectedNodes().filter(a=>a.editable);if(n.length<2)return;let i=ft(n.map(a=>({x:a.absX,y:a.absY,width:a.width,height:a.height})));this.mutate(a=>{for(let r of n){let s=this.findActiveDocNode(a,r.sourceId);s&&(t==="left"?s.x+=i.x-r.absX:t==="right"?s.x+=i.x+i.width-(r.absX+r.width):t==="centerX"?s.x+=i.x+i.width/2-(r.absX+r.width/2):t==="top"?s.y+=i.y-r.absY:t==="bottom"?s.y+=i.y+i.height-(r.absY+r.height):t==="centerY"&&(s.y+=i.y+i.height/2-(r.absY+r.height/2)))}},{select:this.state.selection})}distribute(t){let n=this.selectedNodes().filter(i=>i.editable);n.length<3||this.mutate(i=>{let a=[...n].sort((h,u)=>t==="x"?h.absX-u.absX:h.absY-u.absY),r=a[0],s=a[a.length-1],c=t==="x"?s.absX+s.width-r.absX:s.absY+s.height-r.absY,d=a.reduce((h,u)=>h+(t==="x"?u.width:u.height),0),o=(c-d)/(a.length-1),l=t==="x"?r.absX:r.absY;for(let h of a){let u=this.findActiveDocNode(i,h.sourceId);u&&(t==="x"?u.x+=l-h.absX:u.y+=l-h.absY,l+=(t==="x"?h.width:h.height)+o)}},{select:this.state.selection})}renameNode(t,n){this.updateNode(t,{name:n},{commit:!0})}setVisibility(t,n){this.updateNode(t,{visible:n},{commit:!0})}setLocked(t,n){this.updateNode(t,{locked:n},{commit:!0})}setText(t,n){this.updateNode(t,{text:n},{commit:!0})}beginTextEdit(t){let n=this.findSceneNode(t);!n||n.type!=="text"||(this.state.editingText={key:t,sourceId:n.sourceId,value:n.text??""},this.state.selection=[t],this.state.primaryKey=t,this.emit())}commitTextEdit(t){let n=this.state.editingText;n&&(this.state.editingText=null,t!==n.value?this.setText(n.sourceId,t):this.emit())}cancelTextEdit(){this.state.editingText=null,this.emit()}undo(){let t=this.history.undo();t&&(this.state.doc=Et(t,{touch:!1}),this.rebuild(),this.state.dirty=!0,this.emit(),this.scheduleSave())}redo(){let t=this.history.redo();t&&(this.state.doc=Et(t,{touch:!1}),this.rebuild(),this.state.dirty=!0,this.emit(),this.scheduleSave())}enterInstance(t){let n=this.findSceneNode(t);!n||n.type!=="instance"&&!n.isInstanceRoot||(this.state.enteredInstance=n.key,this.state.selection=[],this.state.primaryKey=null,this.toast("\u5DF2\u8FDB\u5165\u5B9E\u4F8B\uFF0C\u53CC\u51FB\u6587\u672C/\u5F62\u72B6\u53EF\u8986\u76D6\uFF0CEsc \u9000\u51FA"),this.emit())}exitInstance(){this.state.enteredInstance=null,this.state.selection=[],this.state.primaryKey=null,this.emit()}setOverride(t,n,i){this.mutate(a=>{let r=this.findActiveDocNode(a,t);!r||r.type!=="instance"||(r.overrides=r.overrides??{},r.overrides[n]={...r.overrides[n]??{},...i})})}detachInstance(t){let n=[];this.mutate(i=>{let a=this.findActiveDocNode(i,t);if(!a||a.type!=="instance")return;let r=i.components.find(o=>o.id===a.componentId);if(!r)throw new Error("\u4E3B\u7EC4\u4EF6\u4E0D\u5B58\u5728");let s=this.findActiveOwnerList(i,t);if(!s)return;let c=s.findIndex(o=>o.id===t);if(c===-1)return;let d=this.materializeInstance(i,r,a);s.splice(c,1,d),n.push(d.id)},{select:n})}materializeInstance(t,n,i){let a=it(n.root),r=new Map,s=l=>{let h=ve("n");r.set(l.id,h),l.id=h;let u=i.overrides?.[l.id];u&&Object.assign(l,u),Array.isArray(l.children)&&l.children.forEach(s)},c=i.overrides??{},d=new Map(Object.entries(c)),o=l=>{let h=l.id,u=ve("n");r.set(h,u),l.id=u;let f=d.get(h);f&&(f.text!=null&&(l.text=f.text),f.fills!=null&&(l.fills=f.fills),f.visible!=null&&(l.visible=f.visible)),Array.isArray(l.children)&&l.children.forEach(o)};return a.x=i.x,a.y=i.y,i.width&&(a.width=i.width),i.height&&(a.height=i.height),o(a),a}createComponentFromSelection(t="Component"){let n=this.primaryNode();if(!n||!n.editable)return;let i=ve("cmp"),a=ve("n"),r=ve("i");this.mutate(s=>{let c=this.findActiveOwnerList(s,n.sourceId);if(!c)return;let d=c.findIndex(u=>u.id===n.sourceId);if(d===-1)return;let[o]=c.splice(d,1),l=it(o);l.x=0,l.y=0,l.id=a,s.components.push({id:i,name:t||o.name||"Component",variantProps:{},root:l});let h={id:r,type:"instance",name:o.name,x:n.absX-(n.parent?.absX??0),y:n.absY-(n.parent?.absY??0),width:o.width,height:o.height,rotation:0,opacity:1,visible:!0,locked:!1,componentId:i,variantProps:{},overrides:{}};c.splice(d,0,h)},{select:[r]}),this.toast("\u5DF2\u521B\u5EFA\u7EC4\u4EF6")}insertInstance(t,n){let a=this.state.doc?.components.find(o=>o.id===t);if(!a)return;if(this.state.componentMode?.componentId===t){this.toast("\u4E0D\u80FD\u5C06\u4E3B\u7EC4\u4EF6\u5B9E\u4F8B\u63D2\u5165\u81EA\u8EAB","error");return}let r=a.root.width??120,s=a.root.height??40,c=n&&Number.isFinite(n.x)&&Number.isFinite(n.y)?n:Ve(this.state.viewport,{x:this.viewportSize().width/2,y:this.viewportSize().height/2}),d={id:ve("i"),type:"instance",name:a.name,x:Math.round(c.x-r/2),y:Math.round(c.y-s/2),width:r,height:s,rotation:0,opacity:1,visible:!0,locked:!1,componentId:t,variantProps:{...a.variantProps??{}},overrides:{}};this.mutate(o=>{let l=this.activeRootContainer(o);if(l){if(this.state.componentMode&&l.type!=="frame"&&l.type!=="group")throw new Error("\u5F53\u524D\u4E3B\u7EC4\u4EF6\u6839\u8282\u70B9\u4E0D\u652F\u6301\u6DFB\u52A0\u5B50\u56FE\u5C42");l.children=l.children??[],l.children.push(d)}},{select:[d.id]}),this.setTool("pointer")}setVariant(t,n,i){this.mutate(a=>{let r=this.findActiveDocNode(a,t);r&&(r.variantProps={...r.variantProps??{},[n]:i})})}swapComponent(t,n){this.state.doc.components.some(i=>i.id===n)&&this.mutate(i=>{let a=this.findActiveDocNode(i,t);a&&(a.componentId=n,a.variantProps={},a.overrides={})})}createVariantSet(t,n){if(t.length<2){this.toast("\u81F3\u5C11\u9009\u62E9\u4E24\u4E2A\u7EC4\u4EF6\u624D\u80FD\u521B\u5EFA\u53D8\u4F53\u96C6");return}let i=String(n??"").trim()||"Variant set";this.mutate(a=>{let r=ve("vs"),s=t.map(d=>(a.components.find(l=>l.id===d)?.name??"Variant").split("/").pop().replace(/\s+/g,"-")),c=[...new Set(s)];for(let d of t){let o=a.components.find(l=>l.id===d);o&&(o.variantSetId=r,o.variantProps={State:(o.name??"Variant").split("/").pop().replace(/\s+/g,"-")})}a.variantSets.push({id:r,name:i,properties:[{name:"State",values:c}],componentIds:t})})}editComponent(t){this.state.doc?.components?.some(n=>n.id===t)&&(!this.state.componentMode&&this.state.pageId&&this.viewMemory.observe(this.state.pageId,this.state.viewport),this.state.componentMode={componentId:t},this.state.selection=[],this.state.primaryKey=null,this.state.editingText=null,this.state.enteredInstance=null,this.state.crop=null,this.rebuild(),this.state.scene?.roots?.length&&this.zoomToFit(),this.emit())}exitComponentMode(){this.state.componentMode=null,this.state.selection=[],this.state.primaryKey=null,this.state.editingText=null,this.state.crop=null,this.rebuild();let t=this.state.pageId?this.viewMemory.getPageViewport(this.state.pageId):null;t&&(this.state.viewport=t),this.emit()}createStyle(t,n){let i=this.primaryNode();if(!i){this.toast("\u8BF7\u5148\u9009\u4E2D\u4E00\u4E2A\u56FE\u5C42");return}let a=t==="fill"?i.fills?.[0]:t==="text"?i.type==="text"&&i.font?{font:i.font,fills:i.fills}:null:Array.isArray(i.effects)&&i.effects.length?i.effects:null;if(!a){this.toast(t==="text"&&i.type!=="text"?"\u8BF7\u5148\u9009\u4E2D\u6587\u672C\u56FE\u5C42\u4EE5\u521B\u5EFA\u6587\u672C\u6837\u5F0F":"\u8BE5\u56FE\u5C42\u6CA1\u6709\u53EF\u521B\u5EFA\u7684\u6837\u5F0F");return}let r=ve("style"),s=String(n??"").trim();this.mutate(c=>{c.styles.push({id:r,type:t,name:s||`${t} style`,value:it(a)});let d=this.findActiveDocNode(c,i.sourceId);d&&(t==="fill"&&(d.fillStyleId=r),t==="text"&&(d.textStyleId=r),t==="effect"&&(d.effectStyleId=r))}),this.toast("\u5DF2\u521B\u5EFA\u6837\u5F0F")}applyStyle(t){let n=this.state.doc?.styles?.find(r=>r.id===t);if(!n)return!1;let i=this.selectedNodes().filter(r=>r.editable);if(!i.length)return this.toast("\u8BF7\u5148\u9009\u4E2D\u8981\u5E94\u7528\u6837\u5F0F\u7684\u56FE\u5C42"),!1;let a=i.filter(r=>Qr(n.type,r.type));if(!a.length){let r=n.type==="text"?"\u6587\u672C\u6837\u5F0F\u53EA\u80FD\u5E94\u7528\u5230\u6587\u672C\u56FE\u5C42":n.type==="fill"?"\u9009\u4E2D\u7684\u56FE\u5C42\u4E0D\u652F\u6301\u586B\u5145\u6837\u5F0F":"\u9009\u4E2D\u7684\u56FE\u5C42\u4E0D\u652F\u6301\u6548\u679C\u6837\u5F0F";return this.toast(r),!1}return this.mutate(r=>{for(let s of a){let c=this.findActiveDocNode(r,s.sourceId);c&&(n.type==="fill"?c.fillStyleId=t:n.type==="text"?c.textStyleId=t:n.type==="effect"&&(c.effectStyleId=t))}}),!0}applyStyleToNode(t,n){let i=this.state.doc?.styles?.find(s=>s.id===t);if(!i)return this.toast("\u627E\u4E0D\u5230\u8BE5\u6837\u5F0F","error"),!1;let a=this.findSceneNode(n);if(!a)return this.toast("\u627E\u4E0D\u5230\u76EE\u6807\u56FE\u5C42","error"),!1;if(!a.editable)return this.toast("\u7EC4\u4EF6\u5B9E\u4F8B\u5185\u90E8\u56FE\u5C42\u4E0D\u80FD\u76F4\u63A5\u5E94\u7528\u6837\u5F0F"),!1;if(!Qr(i.type,a.type)){let s=i.type==="text"?"\u6587\u672C\u6837\u5F0F\u53EA\u80FD\u5E94\u7528\u5230\u6587\u672C\u56FE\u5C42":i.type==="fill"?"\u586B\u5145\u6837\u5F0F\u4E0D\u652F\u6301\u5E94\u7528\u5230\u8BE5\u7C7B\u578B\u56FE\u5C42":"\u6548\u679C\u6837\u5F0F\u4E0D\u652F\u6301\u5E94\u7528\u5230\u8BE5\u7C7B\u578B\u56FE\u5C42";return this.toast(s),!1}let r=!1;return this.mutate(s=>{let c=this.findActiveDocNode(s,a.sourceId);c&&(i.type==="fill"?c.fillStyleId=t:i.type==="text"?c.textStyleId=t:i.type==="effect"&&(c.effectStyleId=t),r=!0)}),r&&this.toast(`\u5DF2\u5E94\u7528\u6837\u5F0F\uFF1A${i.name}`),r}renameStyle(t,n){let i=String(n??"").trim().slice(0,120);if(!i)return!1;let a=this.state.doc?.styles?.find(r=>r.id===t);return!a||a.name===i?!1:(this.updateStyle(t,{name:i}),!0)}detachStyle(t){let n=this.state.doc.styles.find(i=>i.id===t);n&&this.mutate(i=>{let a=r=>{r.fillStyleId===t&&n.type==="fill"&&(r.fills=[it(n.value)],delete r.fillStyleId),r.textStyleId===t&&n.type==="text"&&(r.font=it(n.value.font),r.fills=it(n.value.fills),delete r.textStyleId),r.effectStyleId===t&&n.type==="effect"&&(r.effects=it(n.value),delete r.effectStyleId);for(let s of r.children??[])a(s)};for(let r of i.pages)r.children.forEach(a);for(let r of i.components)a(r.root)})}updateStyle(t,n){this.mutate(i=>{let a=i.styles.find(r=>r.id===t);a&&Object.assign(a,n)})}deleteStyle(t){this.mutate(n=>{n.styles=n.styles.filter(a=>a.id!==t);let i=a=>{a.fillStyleId===t&&delete a.fillStyleId,a.textStyleId===t&&delete a.textStyleId,a.effectStyleId===t&&delete a.effectStyleId;for(let r of a.children??[])i(r)};for(let a of n.pages)a.children.forEach(i);for(let a of n.components)i(a.root)})}pageBounds(){let t=this.state.scene;if(!t)return{x:0,y:0,width:1,height:1};let n=t.roots.filter(i=>i.visible!==!1);return ft(n.map(i=>({x:i.absX,y:i.absY,width:i.width,height:i.height})))??{x:0,y:0,width:1,height:1}}commentPosition(t){if(t.nodeId){let i=this.findSceneNode(t.nodeId);if(i)return ge(this.state.viewport,zt(i))}let n=this.pageBounds();return ge(this.state.viewport,{x:n.x+(t.x??.5)*n.width,y:n.y+(t.y??.5)*n.height})}addComment(t,{nodeId:n,x:i,y:a}){if(!this.state.doc||!t.trim())return;let r=this.pageBounds(),s={x:i==null?.5:mt((i-r.x)/Math.max(1,r.width),0,1),y:a==null?.5:mt((a-r.y)/Math.max(1,r.height),0,1)};this.mutate(c=>{Ea(c,{pageId:this.state.pageId??c.pages[0].id,nodeId:n??void 0,x:s.x,y:s.y,body:t,author:"user"})}),this.state.commentDraft=null,this.emit()}replyComment(t,n){n.trim()&&this.mutate(i=>Ia(i,t,n,"user"))}resolveComment(t,n=!0){this.mutate(i=>Na(i,t,n))}deleteComment(t){this.mutate(n=>Ca(n,t))}focusComment(t){let n=this.state.doc;if(!n||!t)return!1;let i=t.id?n.comments?.find(l=>l.id===t.id):null,a=i?{...i,...t}:t;if(a.pageId){if(!n.pages.some(l=>l.id===a.pageId))return!1;(this.state.componentMode||a.pageId!==this.state.pageId)&&this.setPage(a.pageId)}else this.state.componentMode&&this.exitComponentMode();if(a.nodeId){let l=this.findSceneNode(a.nodeId);if(l)return l.instanceId&&(this.state.enteredInstance=l.instanceId),this.setSelection([l.key]),this.zoomToSelection(),!0}let r=this.pageBounds(),s=r.x+(a.x??.5)*r.width,c=r.y+(a.y??.5)*r.height,d=this.viewportSize(),o=this.state.viewport.zoom||1;return this.setViewport({zoom:o,x:d.width/2-s*o,y:d.height/2-c*o}),!0}fontFaceStyle(){let t=[];for(let n of this.state.doc?.fonts??[]){if(!n?.asset)continue;let i=yi(this.sessionId,n.asset);t.push(`@font-face{font-family:"${n.family}";font-style:${n.style??"normal"};font-weight:${n.weight??400};src:url("${i}") format("${n.asset.endsWith(".woff2")?"woff2":n.asset.endsWith(".woff")?"woff":n.asset.endsWith(".otf")?"opentype":"truetype"}");font-display:block}`)}return t.join(`
`)}async ensureFonts(){let t=this.state.doc?.fonts??[];if(!t.length||typeof document>"u")return;let n=document.getElementById("dsh-canvas-fonts");n||(n=document.createElement("style"),n.id="dsh-canvas-fonts",document.head.appendChild(n)),n.textContent=this.fontFaceStyle();try{await Promise.all(t.map(i=>document.fonts?.load?.(`${i.style??"normal"} ${i.weight??400} 16px "${i.family}"`).catch(()=>{})))}catch{}this.state.fontVersion+=1,this.rebuild(),this.emit()}async uploadFontFile(t,n,i,a){try{let r=await xr(this.sessionId,t,{family:n,weight:Number(i)||400,style:a||"normal"});this.mutate(s=>{s.fonts=s.fonts??[],s.fonts.some(c=>c.asset===r.asset)||s.fonts.push({id:ve("font"),family:n,weight:Number(i)||400,style:a||"normal",asset:r.asset,sourceName:t.name})}),await this.ensureFonts(),this.toast("\u5B57\u4F53\u5DF2\u4E0A\u4F20")}catch(r){this.toast(et(r),"error")}}removeFont(t){let n=this.state.doc.fonts.find(r=>r.id===t);if(!n)return;let i=!1,a=r=>{r.type==="text"&&r.font?.family===n.family&&(r.font?.weight??400)===n.weight&&(i=!0);for(let s of r.children??[])a(s)};for(let r of this.state.doc.pages)r.children.forEach(a);for(let r of this.state.doc.components)a(r.root);if(i){this.toast("\u8BE5\u5B57\u4F53\u4ECD\u88AB\u6587\u672C\u4F7F\u7528\uFF0C\u5148\u66FF\u6362\u540E\u518D\u5220\u9664");return}this.mutate(r=>{r.fonts=r.fonts.filter(s=>s.id!==t)})}async uploadFillImage(t,n,i){try{let a=await xi(this.sessionId,i);this.mutate(r=>{let s=Ge([...r.pages.flatMap(c=>c.children),...r.components.map(c=>c.root)],t);s?.fills?.[n]&&(s.fills[n]={type:"image",asset:a.asset,fit:"cover"})})}catch(a){this.toast(et(a),"error")}}importSvg(t,n){let{paths:i,warnings:a}=Gr(t);if(!i.length)return this.toast(a[0]??"\u6CA1\u6709\u53EF\u5BFC\u5165\u7684 SVG path","error"),0;let r=n&&Number.isFinite(n.x)&&Number.isFinite(n.y)?n:this.viewportCenterWorld(),s=[];for(let[c,d]of i.entries()){let o=Math.min(1,240/Math.max(1,d.viewBox.width),240/Math.max(1,d.viewBox.height)),l=Math.max(1,d.viewBox.width*o),h=Math.max(1,d.viewBox.height*o),u={id:ve("n"),type:"path",name:d.name,x:r.x-l/2+c*8,y:r.y-h/2+c*8,width:l,height:h,rotation:0,opacity:1,visible:!0,locked:!1,d:d.d,viewBox:d.viewBox,fillRule:d.fillRule,fills:d.fills,strokes:d.strokes,effects:[]},f=this.addNode(u,null);f&&s.push(f.id)}return s.length&&this.setSelection(s),this.toast(a.length?`\u5DF2\u5BFC\u5165 ${s.length} \u6761 path\uFF1B${a[0]}`:`\u5DF2\u5BFC\u5165 ${s.length} \u6761 path`),s.length}requestImagePick(){return this.imagePicker?(this.imagePicker.click(),!0):(this.toast("\u56FE\u7247\u9009\u62E9\u5668\u5C1A\u672A\u51C6\u5907\u597D","error"),!1)}async uploadImageFile(t,n){try{let i=await xi(this.sessionId,t),a=await ts(ht(this.sessionId,this.state.name,i.asset)).catch(()=>({width:320,height:200})),r=Math.min(480,a.width||320),s=(a.height||200)*(r/(a.width||320)),c=n??this.viewportCenterWorld(),d={id:ve("n"),type:"rect",name:t.name.replace(/\.[^.]+$/,"")||"Image",x:c.x-r/2,y:c.y-s/2,width:r,height:s,rotation:0,opacity:1,visible:!0,locked:!1,cornerRadius:0,fills:[{type:"image",asset:i.asset,fit:"cover"}],strokes:[],effects:[]};this.addNode(d,null)}catch(i){this.toast(et(i),"error")}}viewportCenterWorld(){let t=this.viewportSize();return Ve(this.state.viewport,{x:t.width/2,y:t.height/2})}selectionText(){let t=this.selectedNodes();if(!t.length)return"";let n=t[0],i=t.length>1?`\u753B\u5E03\u9009\u533A\uFF08${t.length} \u4E2A\u56FE\u5C42\uFF09\uFF1A${n.name}`:`\u753B\u5E03\u9009\u533A\uFF1A${n.name}`;return Lr({doc:this.state.name,node:n.key,page:this.state.pageId??void 0,label:i})}async insertSelectionToComposer(){let t=this.selectionText(),n=this.selectedNodes();if(!t||!n.length){this.toast("\u5148\u9009\u4E2D\u753B\u5E03\u5143\u7D20");return}Hr({sessionId:this.sessionId,doc:this.state.name,node:n[0].key,page:this.state.pageId??void 0,label:n[0].name||n[0].type});let i=this.inputActions,a=!1;try{if(i&&typeof i.captureInsertion=="function"){let r=i.captureInsertion();a=i.insertText(t,r)}}catch{a=!1}if(a)this.toast("\u5DF2\u63D2\u5165\u753B\u5E03\u94FE\u63A5\uFF1B\u53D1\u9001\u540E\u70B9\u6D88\u606F\u91CC\u7684\u753B\u5E03 chip \u53EF\u8DF3\u8F6C");else try{await navigator.clipboard.writeText(t),this.toast("\u8F93\u5165\u6846\u4E0D\u53EF\u7528\uFF0C\u9009\u533A\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F")}catch{this.toast("\u65E0\u6CD5\u5199\u5165\u8F93\u5165\u6846\u6216\u526A\u8D34\u677F","error")}}insertTemplate(t,n){try{let{node:i,template:a}=An(t,{device:this.state.foundation?.device??ut}),r=n&&Number.isFinite(n.x)&&Number.isFinite(n.y)?n:this.viewportCenterWorld();if(i.x=Math.round(r.x-i.width/2),i.y=Math.round(r.y-i.height/2),!this.addNode(i,null))return;this.setTool("pointer"),n||this.zoomToSelection(),this.toast(`\u5DF2\u63D2\u5165\u6A21\u677F\uFF1A${a.name}`)}catch(i){this.toast(et(i),"error")}}setFoundation(t={}){let n=pt(t.device??this.state.foundation?.device??ut),i=Ci(t.preset??this.state.foundation?.preset??on);this.state.foundation={device:n.id,preset:i.id},this.emit()}async loadImageCapabilities(){try{let t=await dr(this.sessionId);return this.state.imageCapabilities=t.capabilities??null,this.emit(),this.state.imageCapabilities}catch{return this.state.imageCapabilities=null,this.emit(),null}}async insertImageAsset(t,n="AI image"){if(!t)return null;let i=await ts(ht(this.sessionId,this.state.name,t)).catch(()=>({width:320,height:200})),a=Math.min(480,i.width||320),r=(i.height||200)*(a/(i.width||320)),s=this.viewportCenterWorld(),c={id:ve("n"),type:"rect",name:n,x:s.x-a/2,y:s.y-r/2,width:a,height:r,rotation:0,opacity:1,visible:!0,locked:!1,cornerRadius:0,fills:[{type:"image",asset:t,fit:"cover"}],strokes:[],effects:[]};return this.addNode(c,null)}async generateImage(t){if(this.state.imageGenerating)return{ok:!1,code:"busy",message:"\u56FE\u7247\u751F\u6210\u8FDB\u884C\u4E2D"};let n=String(t??"").trim();if(!n)return this.toast("\u8BF7\u8F93\u5165\u56FE\u7247\u63CF\u8FF0"),{ok:!1,code:"prompt-required"};this.state.imageGenerating=!0,this.emit();try{let i=await hr(this.sessionId,this.state.name,n);return i?.ok?(await this.insertImageAsset(i.asset,"AI image"),this.toast("\u56FE\u7247\u5DF2\u751F\u6210\u5E76\u63D2\u5165\u753B\u5E03"),i):(this.toast(i?.message??"\u56FE\u7247\u751F\u6210\u5931\u8D25","error"),i)}catch(i){return this.toast(et(i),"error"),{ok:!1,code:i instanceof tt?i.code:"image-failed",message:et(i)}}finally{this.state.imageGenerating=!1,this.emit()}}async runAudit(t="page"){let n=t==="selection"?this.selectedNodes()[0]?.sourceId:void 0;if(t==="selection"&&!n)return this.toast("\u5148\u9009\u4E2D\u4E00\u4E2A\u8282\u70B9"),null;try{let i=await lr(this.sessionId,this.state.name,{...n?{nodeId:n}:{},...this.state.pageId?{pageId:this.state.pageId}:{},system:"ios"});this.state.audit=i,this.emit();let a=(i.findings??[]).filter(r=>r.severity==="high").length;return this.toast(a?`\u68C0\u67E5\u5B8C\u6210\uFF1A${a} \u4E2A\u9AD8\u4F18\u5148\u7EA7\u95EE\u9898`:"\u68C0\u67E5\u5B8C\u6210"),i}catch(i){return this.toast(et(i),"error"),null}}loadDesignSystem(t="material3"){let n=Ei(t),i=Vr(t);this.mutate(a=>{let r=new Set(a.styles.map(s=>s.name));for(let s of i)r.has(s.name)||(a.styles.push(structuredClone(s)),r.add(s.name))},{select:[]}),this.toast(`\u5DF2\u52A0\u8F7D ${n.name} \u6837\u5F0F\uFF08${i.length} \u6761\uFF09\uFF0C\u53EF\u5728\u300C\u6837\u5F0F\u300D\u9762\u677F\u5E94\u7528`)}insertPrompt(t=""){let n=pt(this.state.foundation?.device),i=Ci(this.state.foundation?.preset),a=["\u4F7F\u7528 canvas-ui-design \u6280\u80FD\uFF0C\u76F4\u63A5\u5728\u753B\u5E03\u4E2D\u751F\u6210 UI\u3002",`\u8BBE\u5907\uFF1A${n.name} ${n.width}\xD7${n.height}\uFF1B\u98CE\u683C\u9884\u8BBE\uFF1A${i.name}\u3002`,"\u5148 canvas_read \u8BFB\u53D6\u5F53\u524D\u6587\u6863\u548C\u9009\u533A\uFF0C\u518D\u7528 canvas_template \u7684 foundation/\u9875\u9762\u9AA8\u67B6\u4E0E canvas_write/canvas_edit \u751F\u6210\u771F\u5B9E\u5185\u5BB9\u3002","\u5B8C\u6210\u540E\u8FD0\u884C canvas_audit\uFF0C\u5E76\u6309 findings \u4FEE\u6B63\uFF1B\u4E0D\u8981\u53EA\u7ED9\u8BBE\u8BA1\u5EFA\u8BAE\u3002",`\u9700\u6C42\uFF1A${String(t||"").trim()||"\u751F\u6210\u4E00\u4E2A\u79FB\u52A8\u7AEF\u9875\u9762\uFF0C\u5305\u542B\u6807\u9898\u3001\u4E3B\u5185\u5BB9\u548C\u4E3B\u6309\u94AE\u3002"}`].join(`
`),r=this.inputActions;try{if(r&&typeof r.captureInsertion=="function"){let s=r.captureInsertion();if(r.insertText(a,s)){this.toast("\u5DF2\u5199\u5165 AI \u751F\u6210\u8BF7\u6C42");return}}navigator.clipboard?.writeText(a),this.toast("\u5DF2\u590D\u5236 AI \u751F\u6210\u8BF7\u6C42")}catch{this.toast("\u65E0\u6CD5\u5199\u5165\u8F93\u5165\u6846","error")}}insertImagePrompt(t=""){let n=["\u8BF7\u4F7F\u7528\u5F53\u524D\u6A21\u578B\u7684\u539F\u751F\u56FE\u7247\u751F\u6210\u80FD\u529B\u751F\u6210\u4E00\u5F20\u56FE\u7247\u3002",`\u56FE\u7247\u63CF\u8FF0\uFF1A${String(t||"").trim()||"\u900F\u660E\u80CC\u666F\u7684\u79FB\u52A8 App \u63D2\u753B\u7D20\u6750\u3002"}`,"\u751F\u6210\u540E\u628A\u56FE\u7247\u6587\u4EF6\u901A\u8FC7 canvas_image import \u5BFC\u5165 .dsh-canvas/assets/\uFF0C\u518D\u7528 canvas_edit \u653E\u5230\u5F53\u524D\u8BBE\u8BA1\u91CC\u3002","\u5982\u679C\u5F53\u524D\u6CA1\u6709\u539F\u751F\u56FE\u7247\u5DE5\u5177\uFF0C\u8BF7\u6539\u7528 canvas_image probe \u68C0\u67E5 Codex \u8DEF\u7EBF\uFF0C\u6216\u8981\u6C42\u7528\u6237\u5BFC\u5165\u56FE\u7247\u3002"].join(`
`),i=this.inputActions;try{if(i&&typeof i.captureInsertion=="function"){let a=i.captureInsertion();if(i.insertText(n,a)){this.toast("\u5DF2\u5199\u5165\u751F\u56FE\u8BF7\u6C42");return}}navigator.clipboard?.writeText(n),this.toast("\u5DF2\u590D\u5236\u751F\u56FE\u8BF7\u6C42")}catch{this.toast("\u65E0\u6CD5\u5199\u5165\u8F93\u5165\u6846","error")}}async renderPngFor(t,n=2){let i=this.exportTargetKeys(t),a=await this.buildExportSvg(i),{svgToPng:r}=await Promise.resolve().then(()=>(Ti(),zi));return await r(a,n)}exportTargetKeys(t){if(typeof t=="string"&&t){let i=[...this.state.scene?.byKey.values()??[]].find(a=>a.id===t||a.key===t);if(i)return[i.key]}let n=this.selectedNodes();return n.length?n.map(i=>i.key):this.state.scene?.roots.map(i=>i.key)??[]}async renderSnapshotFor(t){let n=t?.requestId;if(typeof n!="string"||!n)return;let i=await this.renderPngFor(t.nodeId,Number(t.scale)||2);await mr(this.sessionId,n,String(i).split(",")[1],t.nodeId)}async buildExportSvg(t){let{buildSvg:n}=await Promise.resolve().then(()=>(fi(),sr));return await n(this.state.scene,{nodeKeys:t,background:this.state.doc.pages.find(i=>i.id===this.state.pageId)?.background??null,resolveAsset:async i=>{let a=await fetch(ht(this.sessionId,this.state.name,i),{credentials:"same-origin"});if(!a.ok)throw new Error(`asset ${i} unavailable`);let r=await a.blob();return await es(r)},resolveFont:async i=>{let a=await fetch(yi(this.sessionId,i.asset),{credentials:"same-origin"});if(!a.ok)throw new Error(`font ${i.asset} unavailable`);let r=await a.blob();return await es(r)},fonts:this.state.doc.fonts??[]})}async exportSelection(t){let n=this.selectedNodes(),i=n.length?n.map(a=>a.key):this.state.scene?.roots.map(a=>a.key)??[];try{let{saveFile:a}=await Promise.resolve().then(()=>(Bi(),Li)),r=await this.buildExportSvg(i);if(t==="svg"){let l=await a(r,`${this.state.name}.svg`,"image/svg+xml");if(l.cancelled)return;this.toast(`\u5DF2\u4FDD\u5B58 ${l.filename}`);return}let{svgToPng:s}=await Promise.resolve().then(()=>(Ti(),zi)),c=await s(r,2),d=await(await fetch(c)).blob(),o=await a(d,`${this.state.name}.png`,"image/png");if(o.cancelled)return;this.toast(`\u5DF2\u4FDD\u5B58 ${o.filename}`)}catch(a){this.toast(`\u5BFC\u51FA\u5931\u8D25\uFF1A${et(a)}`,"error")}}async exportPack(){try{let{saveFile:t}=await Promise.resolve().then(()=>(Bi(),Li)),n=await pr(this.sessionId,this.state.name),i=JSON.stringify(n.pack),a=await t(i,`${this.state.name}.drafi.json`,"application/json");return a.cancelled?null:(this.toast(`\u5DF2\u4FDD\u5B58 ${a.filename}`),a)}catch(t){return this.toast(`\u6253\u5305\u5931\u8D25\uFF1A${et(t)}`,"error"),null}}async importPackFile(t,n){try{let i=await t.text(),a=JSON.parse(i),r=await fr(this.sessionId,a,n),s=await Ft(this.sessionId,r.name);return this.applyState(s,{resetHistory:!0}),this.toast(`\u5DF2\u5BFC\u5165 ${r.path}\uFF08${r.assets} \u4E2A\u7D20\u6750\uFF09`),this.emit(),r}catch(i){return this.toast(`\u5BFC\u5165\u5931\u8D25\uFF1A${et(i)}`,"error"),null}}async copySelectionImage(){try{let t=await this.renderPngFor(null,2),n=await(await fetch(t)).blob();if(navigator.clipboard?.write&&typeof ClipboardItem<"u"){await navigator.clipboard.write([new ClipboardItem({"image/png":n})]),this.toast("\u5DF2\u590D\u5236\u6E32\u67D3\u56FE\u7247\u5230\u526A\u8D34\u677F");return}let i=document.createElement("a");i.href=t,i.download=`${this.state.name}.png`,i.click(),this.toast("\u526A\u8D34\u677F\u4E0D\u53EF\u7528\uFF0C\u5DF2\u4E0B\u8F7D PNG")}catch(t){this.toast(`\u590D\u5236\u56FE\u7247\u5931\u8D25\uFF1A${et(t)}`,"error")}}beginCrop(t,n=0){let i=this.findSceneNode(t);if(!i||!i.fills?.[n]||i.fills[n].type!=="image"){this.toast("\u8BE5\u56FE\u5C42\u6CA1\u6709\u56FE\u7247\u586B\u5145");return}this.state.crop={key:t,sourceId:i.sourceId,fillIndex:n,crop:{...i.fills[n].crop??{x:0,y:0,width:1,height:1}}},this.state.selection=[t],this.state.primaryKey=t,this.emit()}updateCrop(t){let n=this.state.crop;n&&(n.crop=t,this.emit())}commitCrop(){let t=this.state.crop;t&&(this.mutate(n=>{let i=this.findActiveDocNode(n,t.sourceId);i?.fills?.[t.fillIndex]&&(i.fills[t.fillIndex].crop=t.crop)}),this.state.crop=null,this.emit())}cancelCrop(){this.state.crop=null,this.emit()}createInteraction(t,n,i="\u70B9\u51FB\u8DF3\u8F6C"){if(!this.state.doc)return null;if(this.state.componentMode)return this.toast("\u7EC4\u4EF6\u7F16\u8F91\u6A21\u5F0F\u4E0B\u4E0D\u652F\u6301\u521B\u5EFA\u4EA4\u4E92\u8FDE\u7EBF","error"),null;if(!t||!n||t===n)return this.toast("\u8D77\u70B9\u548C\u7EC8\u70B9\u4E0D\u80FD\u662F\u540C\u4E00\u4E2A\u5143\u7D20","error"),null;let a=It(this.state.doc,t),r=It(this.state.doc,n);if(!a||!r)return this.toast("\u627E\u4E0D\u5230\u8FDE\u7EBF\u8D77\u70B9\u6216\u76EE\u6807\u8282\u70B9","error"),null;let s=this.findSceneNode(t),c=this.findSceneNode(n),d=s?{x:s.absX,y:s.absY,width:Math.max(1,s.width),height:Math.max(1,s.height)}:{x:Number(a.node.x??0),y:Number(a.node.y??0),width:Math.max(1,Number(a.node.width??120)),height:Math.max(1,Number(a.node.height??44))},o=a.page?.id===r.page?.id,l=o&&c?{x:c.absX,y:c.absY,width:Math.max(1,c.width),height:Math.max(1,c.height)}:o?{x:Number(r.node.x??0),y:Number(r.node.y??0),width:Math.max(1,Number(r.node.width??120)),height:Math.max(1,Number(r.node.height??44))}:{x:d.x+d.width+130,y:d.y+d.height/2-14,width:28,height:28},h=String(i??"").trim()||"\u70B9\u51FB\u8DF3\u8F6C",u=hi(d,l),f=ve("wire"),p=ve("ev"),g=ve("ix"),y=Math.max(64,Math.min(220,h.length*13+18)),A={id:f,type:"path",name:h,x:u.x,y:u.y,width:u.width,height:u.height,rotation:0,opacity:1,visible:!0,locked:!1,d:u.d,viewBox:u.viewBox,fillRule:"nonzero",fills:[],strokes:[{color:"#4D6BFE",width:2,align:"center"}],effects:[],interaction:{id:g,from:t,to:n,event:h,labelId:p}},k={id:p,type:"text",name:"\u89E6\u53D1\u4E8B\u4EF6",x:Math.round(u.labelX-y/2),y:Math.round(u.labelY-10),width:y,height:20,rotation:0,opacity:1,visible:!0,locked:!1,text:h,font:{family:"system-ui",weight:600,style:"normal",size:12,lineHeight:1.35,letterSpacing:0},align:"center",verticalAlign:"middle",fills:[{type:"solid",color:"#4D6BFE"}],effects:[],autoHeight:!0},N=a.page?.id??this.state.pageId;this.mutate(T=>{let j=T.pages.find(P=>P.id===N)??T.pages[0];j&&j.children.push(A,k)},{select:[t]});let I=a.node.name||a.node.type,M=r.node.name||r.node.type;return this.toast(`\u5DF2\u5EFA\u7ACB\u4EA4\u4E92\u8FDE\u7EBF\uFF1A${I} \u2192 ${M}`),{wireId:f,labelId:p}}updateInteractionEvent(t,n){if(!this.state.doc||!t)return!1;let i=String(n??"").trim();if(!i)return!1;let a=!1;return this.mutate(r=>{for(let s of r.pages??[]){let c=Ge(s.children,t);if(c?.interaction){if(c.interaction.event=i,c.name=i,c.interaction.labelId){let d=Ge(s.children,c.interaction.labelId);d&&d.type==="text"&&(d.text=i,d.width=Math.max(64,Math.min(220,i.length*13+18)))}a=!0;return}}}),a}deleteInteraction(t){if(!this.state.doc||!t)return!1;let n=!1;return this.mutate(i=>{for(let a of i.pages??[]){let r=Ge(a.children,t);if(!r)continue;let s=r.interaction?.labelId;dn(a.children,t),s&&dn(a.children,s),n=!0;return}}),n&&this.toast("\u5DF2\u5220\u9664\u4EA4\u4E92\u8FDE\u7EBF"),n}syncConnectedWires(t){let n=this.state.doc,i=this.state.scene;if(!n||!i||this.state.componentMode)return;let a=n.pages.find(o=>o.id===this.state.pageId);if(!a)return;let r=t?new Set(t):null,s=[],c=o=>{for(let l of o??[])(l.type==="path"||l.type==="line")&&l.interaction?.from&&l.interaction?.to&&s.push(l),Array.isArray(l.children)&&c(l.children)};if(c(a.children),!s.length)return;let d=!1;for(let o of s){let l=o.interaction.from,h=o.interaction.to;if(r&&!r.has(l)&&!r.has(h)){let g=this.findSceneNode(l),y=this.findSceneNode(h),A=!1;for(let k of[g,y]){let N=k?.parent;for(;N;){if(r.has(N.sourceId)){A=!0;break}N=N.parent}if(A)break}if(!A)continue}let u=this.findSceneNode(l),f=this.findSceneNode(h);if(!u||!f)continue;let p=hi({x:u.absX,y:u.absY,width:Math.max(1,u.width),height:Math.max(1,u.height)},{x:f.absX,y:f.absY,width:Math.max(1,f.width),height:Math.max(1,f.height)});if(o.x=p.x,o.y=p.y,o.width=p.width,o.height=p.height,o.d=p.d,o.viewBox=p.viewBox,o.interaction.labelId){let g=Ge(a.children,o.interaction.labelId);if(g&&g.type==="text"){let y=Number(g.width)||80;g.x=Math.round(p.labelX-y/2),g.y=Math.round(p.labelY-10)}}d=!0}d&&(this.rebuild(),this.emit())}};function et(e){return String(e&&typeof e=="object"&&"message"in e?e.message:e)}function Oc(e){return{frame:"Frame",group:"Group",rect:"Rectangle",ellipse:"Ellipse",line:"Line",text:"Text",instance:"Instance"}[e]??"Node"}function es(e){return new Promise((t,n)=>{let i=new FileReader;i.onload=()=>t(String(i.result??"")),i.onerror=()=>n(i.error),i.readAsDataURL(e)})}function ts(e){return new Promise((t,n)=>{let i=new Image;i.onload=()=>t({width:i.naturalWidth,height:i.naturalHeight}),i.onerror=n,i.src=e})}var Hi="dsh-canvas:focus",Oi="__dshCanvasPendingFocus";function Xi(e){typeof window>"u"||(window[Oi]={...e,at:Date.now()},window.dispatchEvent(new CustomEvent(Hi,{detail:{...e}})))}function Vi(e){if(typeof window>"u")return null;let t=window[Oi];return!t||t.sessionId&&e&&t.sessionId!==e?null:(window[Oi]=null,t)}function ns(e){if(typeof window>"u")return()=>{};let t=n=>e(n.detail??{});return window.addEventListener(Hi,t),()=>window.removeEventListener(Hi,t)}var C=qe(require("react"),1);var Mt=1024,Tn=128,Xc=64;function Vc(e){let t=e.absX,n=e.absY,i=t+e.width,a=n+e.height,r=1;if(e.type==="path"){let c=e.viewBox??{x:0,y:0,width:e.width,height:e.height};if(!e.d||/[aAsStT]/.test(e.d)||!c.width||!c.height)return null;try{let{bounds:d}=$t(e.d),o=e.width/c.width,l=e.height/c.height;r=Math.max(1,o,l),i=Math.max(i,t+(d.maxX-c.x)*o),a=Math.max(a,n+(d.maxY-c.y)*l),t+=Math.min(0,(d.minX-c.x)*o),n+=Math.min(0,(d.minY-c.y)*l)}catch{return null}}let s=(e.strokes??[]).reduce((c,d)=>Math.max(c,d.width??1),0)*r;return{left:t-s,top:n-s,right:i+s,bottom:a+s}}var Ln=class{cells=new Map;wide=[];entries=[];constructor(t){let n=(i,a,r)=>{if(i.visible===!1)return;r||=!!i.rotation||!!i.effects?.length;let s=r?null:Vc(i),c={node:i,parent:a,order:this.entries.length,bounds:s};if(this.entries.push(c),s){let d=Math.floor(s.left/Mt),o=Math.floor(s.right/Mt),l=Math.floor(s.top/Mt),h=Math.floor(s.bottom/Mt);if([d,o,l,h].every(Number.isSafeInteger)&&(o-d+1)*(h-l+1)<=Xc)for(let u=d;u<=o;u++)for(let f=l;f<=h;f++){let p=u+","+f,g=this.cells.get(p);g?g.push(c):this.cells.set(p,[c])}else this.wide.push(c)}else this.wide.push(c);for(let d of i.children??[])n(d,c,r)};for(let i of t)n(i,null,!1)}query(t,n){let i=(-t.x-Tn)/t.zoom,a=(-t.y-Tn)/t.zoom,r=(n.width-t.x+Tn)/t.zoom,s=(n.height-t.y+Tn)/t.zoom,c=Math.floor(i/Mt),d=Math.floor(r/Mt),o=Math.floor(a/Mt),l=Math.floor(s/Mt),h=new Set;function u(p){let g=p.bounds;if(!(g&&(g.right<i||g.bottom<a||g.left>r||g.top>s)))for(let y=p;y&&!h.has(y);y=y.parent)h.add(y)}if(![c,d,o,l].every(Number.isSafeInteger)||(d-c+1)*(l-o+1)>this.cells.size+1)this.entries.forEach(u);else{this.wide.forEach(u);for(let p=c;p<=d;p++)for(let g=o;g<=l;g++)this.cells.get(p+","+g)?.forEach(u)}let f=new Map;for(let p of[...h].sort((g,y)=>g.order-y.order)){let g=p.parent?.node.key??null,y=f.get(g);y?y.push(p.node):f.set(g,[p.node])}return f}};var be=qe(require("react"),1);var rt="dshc";function hn(e){return Math.min(1,Math.max(0,Number(e)||0))}function Bn(e){let t=e.color??"#000000";if(e.opacity==null||e.opacity>=1)return t;let n=Math.round(hn(e.opacity)*255).toString(16).padStart(2,"0");return t.length===7?`${t}${n}`:t}function as(e){if(!e)return"transparent";if(e.type==="solid")return Bn(e);let t=(e.stops??[]).map(n=>`${n.color} ${(hn(n.position)*100).toFixed(2)}%`).join(", ");if(e.type==="linear-gradient")return`linear-gradient(${Number(e.angle)||0}deg, ${t})`;if(e.type==="radial-gradient"){let n=hn(e.center?.x??.5)*100,i=hn(e.center?.y??.5)*100;return`radial-gradient(circle ${Math.max(.01,hn(e.radius??.7))*100}% at ${n}% ${i}%, ${t})`}return"transparent"}function Hn(e){let t=e.fills?.find(n=>n.type==="solid")??e.fills?.[0];return t?t.type==="solid"?{color:Bn(t),gradient:null}:{color:"transparent",gradient:as(t)}:{color:"transparent",gradient:null}}function jc(e){let t=[],n="",i="";for(let a of e.effects??[])a.visible!==!1&&(a.type==="drop-shadow"?t.push(`${a.x??0}px ${a.y??0}px ${a.blur??0}px ${a.spread??0}px ${a.color??"#00000040"}`):a.type==="inner-shadow"?t.push(`inset ${a.x??0}px ${a.y??0}px ${a.blur??0}px ${a.spread??0}px ${a.color??"#00000040"}`):a.type==="layer-blur"||a.type==="blur"?n+=` blur(${a.blur??a.radius??0}px)`:a.type==="background-blur"&&(i+=` blur(${a.blur??a.radius??0}px)`));for(let a of e.strokes??[]){let r=Number(a.width)||1,s=a.color??"#000000";t.push(`${a.align==="outside"?"":"inset "}0 0 0 ${r}px ${s}`)}return{boxShadow:t.length?t.join(", "):void 0,filter:n.trim()?n.trim():void 0,backdropFilter:i.trim()?i.trim():void 0,WebkitBackdropFilter:i.trim()?i.trim():void 0}}function _c(e){if(e.type==="ellipse")return"50%";if(Array.isArray(e.cornerRadii)&&e.cornerRadii.length===4)return e.cornerRadii.map(n=>`${Number(n)||0}px`).join(" ");let t=e.cornerRadius??0;return t?`${t}px`:void 0}function Yc({fill:e,sessionId:t,docName:n}){let i=e.crop??{x:0,y:0,width:1,height:1},a=ht(t,n,e.asset),r=100/Math.max(.01,i.width),s=100/Math.max(.01,i.height);return be.createElement("div",{className:`${rt}-fill`,style:{position:"absolute",inset:0,overflow:"hidden",borderRadius:"inherit"}},be.createElement("img",{src:a,alt:"",draggable:!1,style:{position:"absolute",left:`${-i.x/Math.max(.01,i.width)*100}%`,top:`${-i.y/Math.max(.01,i.height)*100}%`,width:`${r}%`,height:`${s}%`,maxWidth:"none",objectFit:e.fit==="contain"?"contain":e.fit==="fill"?"fill":"cover",borderRadius:"inherit"}}))}function is({node:e,store:t}){return e.fills?.length?e.fills.map((n,i)=>n.type==="image"?be.createElement(Yc,{key:`fill-${i}`,fill:n,sessionId:t.sessionId,docName:t.state.name}):be.createElement("div",{key:`fill-${i}`,className:`${rt}-fill`,style:{position:"absolute",inset:0,background:as(n),borderRadius:"inherit",pointerEvents:"none"}})):null}function Wc({node:e,baseStyle:t,emphasized:n,active:i}){let a=[],r=[];for(let[c,d]of(e.fills??[]).entries())if(d.type==="solid")r.push(be.createElement("path",{key:`fill-${c}`,d:e.d,fill:Bn(d),stroke:n?Bn(d):void 0,strokeWidth:n?1.5:void 0,strokeLinejoin:"round",fillRule:e.fillRule==="evenodd"?"evenodd":"nonzero"}));else if(d.type==="linear-gradient"||d.type==="radial-gradient"){let o=`path-grad-${String(e.key).replace(/[^A-Za-z0-9_-]/g,"_")}-${c}`,l=(d.stops??[]).map((h,u)=>be.createElement("stop",{key:`stop-${u}`,offset:h.position,stopColor:h.color}));if(d.type==="linear-gradient"){let h=(Number(d.angle)||0)*Math.PI/180;a.push(be.createElement("linearGradient",{key:o,id:o,x1:.5-Math.cos(h)/2,y1:.5-Math.sin(h)/2,x2:.5+Math.cos(h)/2,y2:.5+Math.sin(h)/2},l))}else a.push(be.createElement("radialGradient",{key:o,id:o,cx:d.center?.x??.5,cy:d.center?.y??.5,r:d.radius??.7},l));r.push(be.createElement("path",{key:`fill-${c}`,d:e.d,fill:`url(#${o})`,fillRule:e.fillRule==="evenodd"?"evenodd":"nonzero"}))}for(let[c,d]of(e.strokes??[]).entries())r.push(be.createElement("path",{key:`stroke-${c}`,d:e.d,fill:"none",stroke:d.color??"#000000",strokeWidth:n?(d.width??1)*1.5:d.width??1,strokeLinejoin:"round"}));let s=e.viewBox??{x:0,y:0,width:e.width,height:e.height};return be.createElement("div",{className:`${rt}-node ${rt}-path`,"data-active-connection":i||void 0,"data-node-key":e.key,"data-interaction-emphasis":n||void 0,style:{...t,overflow:"visible"}},be.createElement("svg",{width:"100%",height:"100%",viewBox:`${s.x} ${s.y} ${s.width} ${s.height}`,preserveAspectRatio:"none",style:{display:"block",overflow:"visible"}},a.length?be.createElement("defs",null,a):null,r))}var ji=be.memo(function e({node:t,store:n,parentAbs:i,interactions:a,editingKey:r,visibleChildren:s}){if(!t||t.visible===!1||a?.hidden.has(t.key))return null;let c=a?.emphasized.has(t.key),d=t.absX-(i?.x??0),o=t.absY-(i?.y??0),l=jc(t),h=r===t.key,u={position:"absolute",left:`${d}px`,top:`${o}px`,width:`${t.width}px`,height:`${t.height}px`,transform:t.rotation?`rotate(${t.rotation}deg)`:void 0,transformOrigin:"center",opacity:t.opacity==null?1:t.opacity,borderRadius:_c(t),boxSizing:"border-box",...l};if(t.type==="group")return be.createElement("div",{className:`${rt}-node ${rt}-group`,"data-node-key":t.key,style:{...u,pointerEvents:"none"}},(s?s.get(t.key)??[]:t.children??[]).map(p=>be.createElement(e,{key:p.key,node:p,visibleChildren:s,editingKey:r,store:n,interactions:a,parentAbs:{x:t.absX,y:t.absY}})));if(t.type==="path")return be.createElement(Wc,{node:t,baseStyle:u,emphasized:c,active:a?.activeEdge===t.key});if(t.type==="text"){let p=Hn(t),g=t.lines??[],y=(t.font?.size??14)*(t.font?.lineHeight??1.4),A=g.length*y,k=t.verticalAlign??"top",N=k==="center"?(t.height-A)/2:k==="bottom"?t.height-A:0,I={fontFamily:`"${t.font?.family??"system-ui"}", system-ui, sans-serif`,fontWeight:t.font?.weight??400,fontStyle:t.font?.style??"normal",fontSize:`${t.font?.size??14}px`,lineHeight:`${y}px`,letterSpacing:`${t.font?.letterSpacing??0}px`,textAlign:t.align??"left",color:p.color,backgroundImage:p.gradient??void 0,WebkitBackgroundClip:p.gradient?"text":void 0,backgroundClip:p.gradient?"text":void 0};return be.createElement("div",{className:`${rt}-node ${rt}-text`,"data-node-key":t.key,"data-interaction-emphasis":c||void 0,style:{...u,overflow:t.effects?.length?"visible":"hidden"}},be.createElement(is,{node:{...t,fills:t.fills?.filter(M=>M.type!=="solid")??[]},store:n}),!h&&be.createElement("div",{className:`${rt}-text-lines`,style:{position:"absolute",left:0,top:`${N}px`,width:"100%",height:`${A}px`,pointerEvents:"none",...I}},g.length?g.map((M,T)=>be.createElement("div",{key:T,style:{whiteSpace:"pre",height:`${y}px`,overflow:"hidden"}},M.text||" ")):be.createElement("div",{style:{whiteSpace:"pre"}},t.text?String(t.text).split(`
`)[0]:" ")),h&&be.createElement("div",{style:{position:"absolute",inset:0,border:"1px solid var(--dshc-accent)",borderRadius:2,pointerEvents:"none"}}))}let f=(s?s.get(t.key)??[]:t.children??[]).map(p=>be.createElement(e,{key:p.key,node:p,visibleChildren:s,editingKey:r,store:n,interactions:a,parentAbs:{x:t.absX,y:t.absY}}));return be.createElement("div",{className:`${rt}-node ${rt}-${t.type}`,"data-node-key":t.key,"data-interaction-emphasis":c||void 0,"data-active-connection":a?.activeEdge===t.key||void 0,style:{...u,overflow:t.clip?"hidden":void 0}},be.createElement(is,{node:t,store:n}),f)}),rs=be.memo(function({scene:t,store:n,interactions:i,visibleChildren:a,editingKey:r}){return t?be.createElement(be.Fragment,null,(a?a.get(null)??[]:t.roots??[]).map(s=>be.createElement(ji,{key:s.key,node:s,store:n,interactions:i,visibleChildren:a,editingKey:r,parentAbs:{x:0,y:0}}))):null});function _i(e,t,n){if(!e||e.visible===!1||e.locked||n?.has(e.key))return null;if(e.type==="group"){for(let i of[...e.children??[]].reverse()){let a=_i(i,t,n);if(a)return a}return null}if(!ln(e,t))return null;for(let i of[...e.children??[]].reverse()){let a=_i(i,t,n);if(a)return a}return e}function ss(e,t,n={}){if(!e)return null;let i=null;for(let s of[...e.roots??[]].reverse())if(i=_i(s,t,n.ignoredKeys),i)break;if(!i)return null;if(n.deep)return i;let a=n.enteredInstance??null,r=i;for(;r.parent;){let s=r.parent;if(s.type==="group"){r=s;continue}if(s.type==="instance"&&s.key!==a){r=s;continue}break}return r}var q=qe(require("react"),1);var Yi=qe(require("react"),1),os={pointer:"M4 4l7.07 17 2.51-7.39L21 11.07 4 4z",hand:"M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0 1V4.5a1.5 1.5 0 0 1 3 0V11m0 0V6.5a1.5 1.5 0 0 1 3 0V12m0 0V8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-2.2a6 6 0 0 1-4.8-2.4L5 15.5a1.6 1.6 0 0 1 2.4-2.1L9 15",frame:"M7 3v18M17 3v18M3 7h18M3 17h18",rect:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",ellipse:"M12 4c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z",line:"M4 20L20 4",connect:"M5 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8h4c3 0 2 8 6 8h2M16 13l3 3-3 3",path:"M4 18C8 4 14 4 20 16M4 18l3 2M20 16l-2 3",text:"M5 5h14M12 5v13M8 18h8",image:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 15l4.5-4.5L13 15l3-3 4 4M15.5 8.5h.01",comment:"M6 5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3V6a1 1 0 0 1 1-1z",layers:"M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5",panelLeft:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 5v14",panelRight:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM15 5v14",component:"M12 3l9 9-9 9-9-9 9-9zM12 8l4 4-4 4-4-4 4-4z",styles:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",fonts:"M5 20L12 4l7 16M8 14h8",undo:"M9 7H5V3M5 7a8 8 0 1 1-1 9",redo:"M15 7h4V3M19 7a8 8 0 1 0 1 9",plus:"M12 5v14M5 12h14",minus:"M5 12h14",trash:"M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",eye:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",eyeOff:"M3 3l18 18M10.6 6.3A10 10 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3 4M6.2 6.2C3.5 8.2 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4-.8",lock:"M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3",unlock:"M6 11h12v10H6zM8 11V8a4 4 0 0 1 7.3-2.2",chevronDown:"M6 9l6 6 6-6",chevronRight:"M9 6l6 6-6 6",alignLeft:"M4 4v16M8 7h11v4H8zM8 15h7v4H8z",alignCenterX:"M12 3v18M6 7h12v4H6zM8 15h8v4H8z",alignRight:"M20 4v16M5 7h11v4H5zM9 15h7v4H9z",alignTop:"M4 4h16M7 8h4v11H7zM15 8h4v7h-4z",alignCenterY:"M3 12h18M7 6h4v12H7zM15 8h4v8h-4z",alignBottom:"M4 20h16M7 5h4v11H7zM15 9h4v7h-4z",distributeX:"M3 4v16M21 4v16M9 7h6v10H9z",distributeY:"M4 3h16M4 21h16M7 9h10v6H7z",group:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",ungroup:"M4 4h6v6H4zM14 14h6v6h-6zM15 4h5v5M4 15v5h5",front:"M4 8h10v10H4zM10 4h10v10",back:"M10 10h10v10H10zM4 4h10v10",close:"M6 6l12 12M18 6L6 18",check:"M4 12l5 5L20 6",upload:"M12 16V4M7 9l5-5 5 5M4 17v3h16v-3",download:"M12 4v12M7 11l5 5 5-5M4 20h16",copy:"M9 8h11v11H9zM6 5h11v3M6 5v11h3",send:"M4 12l16-8-6 16-2.5-6.5L4 12z",pencil:"M4 20h4L20 8l-4-4L4 16v4zM14 6l4 4",zoomIn:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5M8 11h6M11 8v6",zoomOut:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5M8 11h6",fit:"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",reset:"M4 10a8 8 0 1 1 2.3 6.3M4 4v6h6",more:"M5 12h.01M12 12h.01M19 12h.01",sliders:"M4 7h16M4 12h16M4 17h16M9 5v4M15 10v4M7 15v4",template:"M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 9h16M9 9v10",play:"M7 4l13 8-13 8V4z",sparkle:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z",eyeSmall:"M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"};function Ne({name:e,size:t=16,style:n,className:i}){let a=os[e];if(!a)return null;let r=e==="pointer";return Yi.createElement("svg",{viewBox:"0 0 24 24",width:t,height:t,fill:r?"currentColor":"none",stroke:r?"none":"currentColor",strokeWidth:r?0:1.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,style:n,className:i},Yi.createElement("path",{d:a}))}var oh=Object.keys(os);function O({icon:e,children:t,active:n,primary:i,danger:a,small:r,title:s,onClick:c,disabled:d,className:o=""}){return q.createElement("button",{type:"button",title:s,disabled:d,onClick:c,className:`dshc-btn ${n?"is-active":""} ${i?"is-primary":""} ${a?"is-danger":""} ${r?"is-small":""} ${o}`},e?q.createElement(Ne,{name:e,size:r?14:15}):null,t?q.createElement("span",null,t):null)}function ie({icon:e,title:t,active:n,onClick:i,onMouseDown:a,size:r=20,danger:s,disabled:c,className:d="",...o}){return q.createElement("button",{...o,type:"button","aria-label":t,"data-tip":t,disabled:c,onMouseDown:a,onClick:i,className:`dshc-icon-btn ${n?"is-active":""} ${s?"is-danger":""} ${d}`.trim()},q.createElement(Ne,{name:e,size:r}))}function On({x:e,y:t,items:n,onClose:i,fixed:a=!1}){let r=q.useRef(null);return q.useEffect(()=>{r.current?.querySelector("button:not(:disabled)")?.focus?.({preventScroll:!0})},[e,t]),q.createElement("div",{ref:r,role:"menu",className:"dshc-context-menu",style:{left:e,top:t,position:a?"fixed":"absolute"},onPointerDown:s=>s.stopPropagation(),onContextMenu:s=>s.preventDefault()},n.map((s,c)=>s.separator?q.createElement("div",{key:`sep-${c}`,className:"dshc-context-sep"}):s.heading?q.createElement("div",{key:`head-${c}`,className:"dshc-context-heading"},s.heading):q.createElement("button",{key:`${s.label}-${c}`,type:"button",role:"menuitem",disabled:s.disabled,className:`dshc-context-item ${s.danger?"is-danger":""}`,onClick:()=>{s.action?.(),i?.()}},s.icon?q.createElement(Ne,{name:s.icon,size:14}):null,q.createElement("span",{className:"dshc-context-label"},s.label),s.shortcut?q.createElement("span",{className:"dshc-context-shortcut"},s.shortcut):null)))}function je({title:e,children:t,right:n,defaultOpen:i=!0}){let[a,r]=q.useState(i);return q.createElement("div",{className:"dshc-section"},q.createElement("button",{type:"button",className:"dshc-section-head",onClick:()=>r(!a)},q.createElement(Ne,{name:a?"chevronDown":"chevronRight",size:12}),q.createElement("span",null,e),n?q.createElement("span",{className:"dshc-section-right"},n):null),a?q.createElement("div",{className:"dshc-section-body"},t):null)}function oe({label:e,children:t,wide:n}){return q.createElement("label",{className:`dshc-field ${n?"is-wide":""}`},q.createElement("span",{className:"dshc-field-label"},e),t)}function Ce({value:e,onChange:t,min:n,max:i,step:a=1,disabled:r,suffix:s}){let[c,d]=q.useState(String(e??0));q.useEffect(()=>d(String(e??0)),[e]);let o=()=>{let l=Number(c);if(Number.isFinite(l)){let h=Math.min(i??1/0,Math.max(n??-1/0,l));t(h),d(String(h))}else d(String(e??0))};return q.createElement("span",{className:"dshc-number"},q.createElement("input",{type:"number",value:c,step:a,min:n,max:i,disabled:r,onChange:l=>d(l.target.value),onBlur:o,onKeyDown:l=>{l.key==="Enter"&&(l.preventDefault(),o(),l.currentTarget.blur())}}),s?q.createElement("span",{className:"dshc-number-suffix"},s):null)}function Tt({value:e,onChange:t,allowAlpha:n=!0}){let i=Gc(e),[a,r]=q.useState(i),s=q.useRef(!1);q.useEffect(()=>r(i),[i]);let c=d=>{let o=cs(d,n,!0);o?(r(o),o!==i&&t(o)):r(i)};return q.createElement("span",{className:"dshc-color"},q.createElement("input",{type:"color",value:i.slice(0,7),onChange:d=>{let o=n&&i.length===9?i.slice(7):"";t(`${d.target.value.toUpperCase()}${o}`)}}),q.createElement("input",{className:"dshc-color-text",value:a,spellCheck:!1,onFocus:()=>{s.current=!1},onChange:d=>{let o=d.target.value;r(o);let l=cs(o,n,!1);l&&l!==i&&t(l)},onBlur:()=>{if(s.current){s.current=!1;return}c(a)},onKeyDown:d=>{d.key==="Enter"?(d.preventDefault(),c(a),s.current=!0,d.currentTarget.blur()):d.key==="Escape"&&(d.preventDefault(),d.stopPropagation(),r(i),s.current=!0,d.currentTarget.blur())}}))}function cs(e,t,n){let i=e.trim().toUpperCase(),a=i.startsWith("#")?i:`#${i}`;if(n&&/^#[0-9A-F]{3}$/.test(a)){let[,r,s,c]=a;return`#${r}${r}${s}${s}${c}${c}`}return/^#[0-9A-F]{6}$/.test(a)||t&&/^#[0-9A-F]{8}$/.test(a)?a:null}function Gc(e){return typeof e=="string"&&/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(e)?e.toUpperCase():"#000000"}function De({value:e,onChange:t,options:n,disabled:i,title:a}){return q.createElement("select",{className:"dshc-select",value:e,disabled:i,title:a,onChange:r=>t(r.target.value)},n.map(r=>q.createElement("option",{key:r.value,value:r.value},r.label)))}function Xn({value:e,onChange:t,label:n}){return q.createElement("button",{type:"button",role:"switch","aria-checked":!!e,className:`dshc-toggle ${e?"is-on":""}`,onClick:()=>t(!e),title:n},q.createElement("span",{className:"dshc-toggle-dot"}))}function un({title:e,children:t,onClose:n,footer:i,width:a=360}){let r=q.useRef(n);r.current=n;let s=q.useRef(!1);return q.useEffect(()=>{let c=d=>{d.key==="Escape"&&(d.preventDefault(),d.stopPropagation(),r.current?.())};return window.addEventListener("keydown",c,!0),()=>window.removeEventListener("keydown",c,!0)},[]),q.createElement("div",{className:"dshc-modal-backdrop",onPointerDown:c=>{c.stopPropagation(),s.current=!1},onClick:c=>{c.stopPropagation(),c.target===c.currentTarget&&!s.current&&n?.(),s.current=!1}},q.createElement("div",{className:"dshc-modal",style:{width:a},onPointerDown:c=>{c.stopPropagation(),s.current=!0},onClick:c=>c.stopPropagation()},q.createElement("div",{className:"dshc-modal-head"},q.createElement("span",null,e),q.createElement(ie,{icon:"close",title:"\u5173\u95ED",onClick:n})),q.createElement("div",{className:"dshc-modal-body"},t),i?q.createElement("div",{className:"dshc-modal-foot"},i):null))}function ls({title:e,label:t,defaultValue:n,onCancel:i,onSubmit:a}){let[r,s]=q.useState(n??""),c=()=>{r.trim()&&a(r.trim())};return q.createElement(un,{title:e,onClose:i,footer:q.createElement(q.Fragment,null,q.createElement(O,{onClick:i},"\u53D6\u6D88"),q.createElement(O,{primary:!0,onClick:c,disabled:!r.trim()},"\u786E\u5B9A"))},q.createElement("label",{className:"dshc-dialog-field"},q.createElement("span",null,t??"\u540D\u79F0"),q.createElement("input",{autoFocus:!0,value:r,onChange:d=>s(d.target.value),onKeyDown:d=>{d.key==="Enter"&&c(),d.key==="Escape"&&i()}})))}function Wi({icon:e,title:t,text:n,action:i}){return q.createElement("div",{className:"dshc-empty-panel"},q.createElement(Ne,{name:e,size:26}),q.createElement("div",{className:"dshc-empty-panel-title"},t),n?q.createElement("div",{className:"dshc-empty-panel-text"},n):null,i??null)}function Vn(e){let t=e.selectedNodes(),n=e.primaryNode(),i=t.length>0&&t.every(d=>d.sourceNode?.locked),a=t.length>0&&t.every(d=>d.sourceNode?.visible===!1),r=t.some(d=>d.sourceNode?.type==="group"),s=(e.clipboard?.length??0)>0;return[{label:"\u590D\u5236",shortcut:"\u2318C",icon:"front",disabled:!t.length,action:()=>e.copySelection()},{label:"\u526A\u5207",shortcut:"\u2318X",icon:"trash",disabled:!t.length,action:()=>{e.copySelection(),e.deleteSelection()}},{label:"\u7C98\u8D34",shortcut:"\u2318V",icon:"back",disabled:!s,action:()=>e.paste()},{label:"\u521B\u5EFA\u526F\u672C",shortcut:"\u2318D",icon:"group",disabled:!t.length,action:()=>e.duplicateSelection()},...t.length===1&&n?.editable&&!n.isInstanceRoot&&!e.state.componentMode&&(n.sourceNode?.screenshot||["frame","group"].includes(n.type)||n.sourceNode?.pageRef||n.sourceNode?.fills?.some(d=>d.type==="image"))?[{label:"\u521B\u5EFA\u9875\u9762\u5F15\u7528",icon:"group",action:()=>e.createPageReference()},...n.sourceNode?.pageRef?[{label:"\u5B9A\u4F4D\u6E90\u9875\u9762",icon:"fit",action:()=>e.focusNode({node:n.sourceNode.pageRef})}]:[]]:[],{label:"\u5220\u9664",shortcut:"\u232B",icon:"trash",danger:!0,disabled:!t.length,action:()=>e.deleteSelection()},{separator:!0},{label:"\u63D2\u5165\u5230\u5BF9\u8BDD",icon:"send",disabled:!t.length,action:()=>e.insertSelectionToComposer()},{separator:!0},{label:"\u590D\u5236\u6E32\u67D3\u56FE\u7247",shortcut:"\u21E7\u2318C",icon:"image",action:()=>e.copySelectionImage()},{label:"\u5BFC\u51FA PNG",icon:"download",action:()=>e.exportSelection("png")},{label:"\u5BFC\u51FA SVG",icon:"download",action:()=>e.exportSelection("svg")},{label:"\u5BFC\u51FA Drafi \u5305",icon:"download",action:()=>e.exportPack()},{separator:!0},{label:"\u7F16\u7EC4",shortcut:"\u2318G",icon:"group",disabled:t.length<2,action:()=>e.groupSelection()},{label:"\u53D6\u6D88\u7F16\u7EC4",shortcut:"\u21E7\u2318G",icon:"ungroup",disabled:!r,action:()=>e.ungroupSelection()},{label:"\u7F6E\u9876",shortcut:"\u21E7\u2318]",icon:"front",disabled:!t.length,action:()=>e.reorder("front")},{label:"\u7F6E\u5E95",shortcut:"\u21E7\u2318[",icon:"back",disabled:!t.length,action:()=>e.reorder("back")},{label:"\u4E0A\u79FB\u4E00\u5C42",shortcut:"\u2318]",icon:"front",disabled:!t.length,action:()=>e.reorder("forward")},{label:"\u4E0B\u79FB\u4E00\u5C42",shortcut:"\u2318[",icon:"back",disabled:!t.length,action:()=>e.reorder("backward")},{separator:!0},{label:i?"\u89E3\u9501":"\u9501\u5B9A",shortcut:"\u21E7\u2318L",icon:i?"unlock":"lock",disabled:!t.length,action:()=>t.forEach(d=>e.setLocked(d.sourceId,!i))},{label:a?"\u663E\u793A":"\u9690\u85CF",shortcut:"\u21E7\u2318H",icon:a?"eye":"eyeOff",disabled:!t.length,action:()=>t.forEach(d=>e.setVisibility(d.sourceId,a))},{separator:!0},{label:"\u521B\u5EFA\u7EC4\u4EF6",shortcut:"\u2325\u2318K",icon:"component",disabled:!n||!n.editable||n.isInstanceRoot,action:()=>e.createComponentFromSelection()},{separator:!0},t.length?{label:"\u9002\u5E94\u9009\u533A",shortcut:"2",icon:"fit",action:()=>e.zoomToSelection()}:{label:"\u9002\u5E94\u753B\u5E03",shortcut:"1",icon:"fit",action:()=>e.zoomToFit()},{label:"\u5168\u9009",shortcut:"\u2318A",disabled:!e.state.scene?.roots?.length,action:()=>e.setSelection((e.state.scene?.roots??[]).map(d=>d.key))},{label:"\u53D6\u6D88\u9009\u62E9",action:()=>e.clearSelection()}]}var fn="application/x-dshc-template",Ut="application/x-dshc-component",mn="application/x-dshc-style",pn=null;function gn(e){if(!e){pn=null;return}if(e.kind==="style"){pn={...e,width:e.width??0,height:e.height??0};return}pn=e}function Ki(){return pn}function yt(){pn=null}var ds=new Map;function gt(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Gi(e){if(!Array.isArray(e)||e.length===0)return"none";let t=e.find(n=>n&&typeof n=="object"&&n.type==="solid");return t?.color?t.color:"none"}function Kc(e){if(!Array.isArray(e)||e.length===0)return 1;let t=e.find(n=>n&&typeof n=="object"&&n.type==="solid");return typeof t?.opacity=="number"?t.opacity:1}function jn(e,t,n,i){if(!e||e.visible===!1)return"";let a=(Number(e.absX)||0)-t.x,r=(Number(e.absY)||0)-t.y,s=Math.max(0,Number(e.width)||0),c=Math.max(0,Number(e.height)||0),d=e.opacity==null?1:Number(e.opacity),o=e.type==="ellipse"?Math.min(s,c)/2:Math.max(0,Number(e.cornerRadius)||0),l=`translate(${a} ${r})`,h=[];if(e.type==="group"){let p=(e.children??[]).map((g,y)=>jn(g,{x:e.absX,y:e.absY},n,`${i}_${y}`)).join("");return`<g transform="${l}" opacity="${d}">${p}</g>`}if(e.type==="text"){let p=e.font??{},g=Math.max(1,Number(p.size)||14),y=g*(Number(p.lineHeight)||1.35),A=Array.isArray(e.lines)&&e.lines.length?e.lines:[{text:String(e.text??"")}],k=Gi(e.fills),N=e.align==="center"?"middle":e.align==="right"?"end":"start",I=e.align==="center"?s/2:e.align==="right"?s:0,M=A.length*y,T=e.verticalAlign==="center"?(c-M)/2:e.verticalAlign==="bottom"?c-M:0;for(let j=0;j<A.length;j+=1)h.push(`<text x="${I}" y="${T+y*(j+.8)}" font-family="system-ui,-apple-system,sans-serif" font-size="${g}" font-weight="${Number(p.weight)||400}" fill="${gt(k==="none"?"#111111":k)}" text-anchor="${N}">${gt(A[j].text??"")}</text>`);return`<g transform="${l}" opacity="${d}">${h.join("")}</g>`}if(e.type==="line"){let p=e.strokes?.[0];return h.push(`<line x1="0" y1="0" x2="${s}" y2="0" stroke="${gt(p?.color??"#D1D5DB")}" stroke-width="${Math.max(1,Number(p?.width)||1)}"/>`),`<g transform="${l}" opacity="${d}">${h.join("")}</g>`}if(e.type==="path"&&typeof e.d=="string"){let p=Gi(e.fills),g=e.strokes?.[0];return h.push(`<path d="${gt(e.d)}" fill="${gt(p)}"${g?` stroke="${gt(g.color??"#111111")}" stroke-width="${Number(g.width)||1}"`:""}/>`),`<g transform="${l}" opacity="${d}">${h.join("")}</g>`}let u=Gi(e.fills),f=Kc(e.fills);u!=="none"&&(e.type==="ellipse"?h.push(`<ellipse cx="${s/2}" cy="${c/2}" rx="${s/2}" ry="${c/2}" fill="${gt(u)}"${f<1?` fill-opacity="${f}"`:""}/>`):h.push(`<rect width="${s}" height="${c}" rx="${o}" ry="${o}" fill="${gt(u)}"${f<1?` fill-opacity="${f}"`:""}/>`));for(let p of e.strokes??[]){let g=Number(p?.width)||1;e.type==="ellipse"?h.push(`<ellipse cx="${s/2}" cy="${c/2}" rx="${Math.max(0,s/2-g/2)}" ry="${Math.max(0,c/2-g/2)}" fill="none" stroke="${gt(p.color??"#000000")}" stroke-width="${g}"/>`):h.push(`<rect width="${s}" height="${c}" rx="${o}" ry="${o}" fill="none" stroke="${gt(p.color??"#000000")}" stroke-width="${g}"/>`)}if(Array.isArray(e.children)&&e.children.length>0){let p="";if(e.clip){let y=`tp-${i}`;n.push(`<clipPath id="${y}"><rect width="${s}" height="${c}" rx="${o}" ry="${o}"/></clipPath>`),p=` clip-path="url(#${y})"`}let g=e.children.map((y,A)=>jn(y,{x:e.absX,y:e.absY},n,`${i}_${A}`)).join("");h.push(`<g${p}>${g}</g>`)}return`<g transform="${l}" opacity="${d}">${h.join("")}</g>`}function us(e,t=ut){let n=pt(t),i=`${e}::${n.id}`,a=ds.get(i);if(a)return a;let{node:r}=An(e,{device:n.id}),s={format:"dsh.canvas",version:1,id:`preview_${e}`,title:e,pages:[{id:"p1",name:"Preview",background:null,children:[r]}],styles:[],components:[],variantSets:[],fonts:[],comments:[]},c=vt(s,{pageId:"p1"});lt(c);let d=c.roots?.[0],o=Math.max(1,Number(d?.width??r.width)||n.width),l=Math.max(1,Number(d?.height??r.height)||80),h=[],u=d?jn(d,{x:d.absX??0,y:d.absY??0},h,"r"):"",f=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${o} ${l}" width="${o}" height="${l}">${h.length?`<defs>${h.join("")}</defs>`:""}${u}</svg>`,p={templateId:e,deviceId:n.id,width:o,height:l,svg:f,dataUri:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(f)}`};return ds.set(i,p),p}var hs=new WeakMap;function _n(e,t){let n=t.root&&typeof t.root=="object"?t.root:null;if(n){let o=hs.get(n);if(o&&o.componentId===t.id)return o}let i=Math.max(1,Number(n?.width)||120),a=Math.max(1,Number(n?.height)||40),r=[],s="";try{let o=vt(e,{mode:"component",componentId:t.id});lt(o);let l=o.roots?.[0];l&&(i=Math.max(1,Number(l.width)||i),a=Math.max(1,Number(l.height)||a),s=jn(l,{x:l.absX??0,y:l.absY??0},r,"c"))}catch{s=`<rect width="${i}" height="${a}" rx="4" fill="#E5E7EB"/>`}let c=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${i} ${a}" width="${i}" height="${a}">${r.length?`<defs>${r.join("")}</defs>`:""}${s}</svg>`,d={componentId:t.id,width:i,height:a,svg:c,dataUri:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(c)}`};return n&&hs.set(n,d),d}var Ue=require("react/jsx-runtime"),ue="dshc",Yn=8;function ps(e){let t=16;for(let n of e)t+=n.charCodeAt(0)>255?11.5:6.8;return Math.ceil(t)}function fs(e,t,n,i){let a=n.x-t.x,r=n.y-t.y;if(e==="line"){let l=Math.hypot(a,r),h=Math.atan2(r,a);if(i&&l>0){let y=Math.PI/12;h=Math.round(h/y)*y}let u=Math.cos(h)*l,f=Math.sin(h)*l,p=t.x+u,g=t.y+f;return{x:Math.min(t.x,p),y:Math.min(t.y,g),w:Math.abs(u),h:Math.abs(f),dx:u,dy:f,endX:p,endY:g,length:l,rotation:h*180/Math.PI}}let s=a,c=r;if(i&&(e==="frame"||e==="rect"||e==="ellipse")){let l=Math.max(Math.abs(a),Math.abs(r));s=(a<0?-1:1)*l,c=(r<0?-1:1)*l}let d=t.x+s,o=t.y+c;return{x:Math.min(t.x,d),y:Math.min(t.y,o),w:Math.abs(s),h:Math.abs(c),dx:s,dy:c,endX:d,endY:o,length:Math.hypot(s,c),rotation:0}}function Wn(e){if(!e||!(e instanceof HTMLElement))return!1;let t=e.tagName;return t==="INPUT"||t==="TEXTAREA"||t==="SELECT"||e.isContentEditable}function Zn(e,t){let n=e.state.doc;if(!n)return null;for(let i of n.pages){let a=Ge(i.children,t);if(a)return a}for(let i of n.components){if(i.root.id===t)return i.root;let a=Ge(i.root.children??[],t);if(a)return a}return null}function ms(e,t,n,i){e.mutate(a=>{for(let r of t){let s=Zn(e,r.sourceId);s&&(s.x=r.x+n,s.y=r.y+i)}},{commit:!1})}function Zc(e,t,n,i,a,r){if(a)return{dx:n,dy:i,guides:[]};let s=new Set(t.map(g=>g.sourceId)),c=t.map(g=>({x:g.absX+n,y:g.absY+i,width:g.width,height:g.height})),d=ft(c);if(!d)return{dx:n,dy:i,guides:[]};let o=[],l=new Set;for(let g of t){let y=g.parent;l.add(y?.key??"root");let A=y?y.children:e.state.scene.roots;for(let k of A??[])!s.has(k.sourceId)&&k.visible!==!1&&!r?.has(k.key)&&o.push({x:k.absX,y:k.absY,width:k.width,height:k.height});y&&o.push({x:y.absX,y:y.absY,width:y.width,height:y.height})}let h=6/Math.max(.02,e.state.viewport.zoom),u={x:[d.x,d.x+d.width/2,d.x+d.width],y:[d.y,d.y+d.height/2,d.y+d.height]},f={x:{diff:0,position:null},y:{diff:0,position:null}};for(let g of o){let y={x:[g.x,g.x+g.width/2,g.x+g.width],y:[g.y,g.y+g.height/2,g.y+g.height]};for(let A of["x","y"])for(let k of u[A])for(let N of y[A]){let I=N-k;Math.abs(I)>h||(f[A].position===null||Math.abs(I)<Math.abs(f[A].diff))&&(f[A]={diff:I,position:N})}}let p=[];return f.x.position!==null&&p.push({axis:"x",value:f.x.position}),f.y.position!==null&&p.push({axis:"y",value:f.y.position}),{dx:n+f.x.diff,dy:i+f.y.diff,guides:p}}function Uc(e,t,n){let i=e.state.scene?.byKey.get(t.layoutParent.key);if(!i)return;let a=i.layout?.direction==="horizontal",r=(i.children??[]).filter(c=>c.sourceId!==t.sourceId),s=r.length;for(let c=0;c<r.length;c+=1){let d=r[c],o=a?d.absX+d.width/2:d.absY+d.height/2;if((a?n.x:n.y)<o){s=c;break}}e.mutate(c=>{let d=Zn(e,i.sourceId);if(!d?.children)return;let o=d.children.findIndex(u=>u.id===t.sourceId);if(o===-1)return;let[l]=d.children.splice(o,1),h=Math.min(s,d.children.length);d.children.splice(h,0,l)},{commit:!1})}function Jc(e,t){return t.parent?{x:t.parent.absX,y:t.parent.absY}:{x:0,y:0}}function gs({store:e,version:t,interactions:n,interactionDestination:i}){let a=C.useRef(null),r=C.useRef(null),s=C.useRef(!1),c=C.useRef(0),d=C.useRef(null),[o,l]=C.useState(""),[h,u]=C.useState(""),[f,p]=C.useState(null),[g,y]=C.useState(""),[A,k]=C.useState(null),[N,I]=C.useState(null),[M,T]=C.useState(null),[j,P]=C.useState([]),[K,W]=C.useState(!1),[Q,B]=C.useState(null),[ce,pe]=C.useState([]),[L,ae]=C.useState(null),[Pe,Z]=C.useState(!1),[re,fe]=C.useState(null),[me,Ye]=C.useState(null),ne=e.state,U=C.useSyncExternalStore(e.subscribeViewport,e.getViewport),at=C.useMemo(()=>new Ln(ne.scene?.roots??[]),[ne.scene]),[St,Ht]=C.useState(()=>e.viewportSize()),Ot=C.useMemo(()=>at.query(U,St),[at,U.x,U.y,U.zoom,St.width,St.height]),xn=C.useRef({store:e,version:t});xn.current={store:e,version:t};let z=(b,x=!1)=>ss(e.state.scene,b,{enteredInstance:e.state.enteredInstance,ignoredKeys:n?.hidden,deep:x});C.useEffect(()=>{let b=a.current;if(!b)return;let x=new ResizeObserver(v=>{let D=v[0]?.contentRect;D&&(e.canvasSize={width:D.width,height:D.height},Ht(R=>R.width===D.width&&R.height===D.height?R:e.canvasSize))});return x.observe(b),e.canvasSize={width:b.clientWidth,height:b.clientHeight},()=>x.disconnect()},[e]),C.useEffect(()=>{let b=a.current;if(!b)return;let x=D=>{if(D.target?.closest?.(".dshc-context-menu"))return;D.preventDefault();let R=b.getBoundingClientRect(),S={x:D.clientX-R.left,y:D.clientY-R.top};if(D.ctrlKey||D.metaKey)e.zoomAt(S,Math.exp(-D.deltaY*.0015));else{let $=D.shiftKey?D.deltaY:D.deltaX,F=D.shiftKey?0:D.deltaY;e.setViewport({...e.state.viewport,x:e.state.viewport.x-$,y:e.state.viewport.y-F})}};b.addEventListener("wheel",x,{passive:!1});let v=D=>{let R=a.current?.closest?.(".dshc-root");if(!R)return;let S=D.target,$=document.activeElement,F=S instanceof Node&&(S===R||R.contains(S)),X=$ instanceof Node&&($===R||R.contains($));if(!F&&!X||document.querySelector(".dshc-modal-backdrop")||Wn(S)||Wn($))return;let w=D.clipboardData;if(ki(w)&&!(Dr(w)&&e.clipboard?.length)){Fr(D,e);return}let V=[...w?.files??[]].filter(ee=>ee.type.startsWith("image/"));if(V.length>0){D.preventDefault();for(let ee of V)e.uploadImageFile(ee);return}e.clipboard?.length&&(D.preventDefault(),e.paste())};return window.addEventListener("paste",v),()=>{b.removeEventListener("wheel",x),window.removeEventListener("paste",v)}},[e]),C.useEffect(()=>{ne.editingText&&l(ne.editingText.value??"")},[ne.editingText?.key]),C.useEffect(()=>{let b=v=>{let R=a.current?.closest?.(".dshc-root"),S=document.activeElement;if(!!!(R&&(S===R||R.contains(S)))||document.querySelector(".dshc-modal-backdrop")||Wn(v.target)||Wn(S))return;if(v.key===" "){s.current=!0,W(!0),v.preventDefault();return}let F=v.key.toLowerCase(),X=v.metaKey||v.ctrlKey,w=xn.current.store;if(v.key==="Escape"){r.current?.mode==="connect"?(r.current=null,Ye(null)):w.state.tool==="connect"?w.setTool("pointer"):w.state.crop?w.cancelCrop():w.state.editingText?w.cancelTextEdit():w.state.commentDraft?(w.state.commentDraft=null,w.emit()):w.state.enteredInstance?w.exitInstance():w.clearSelection();return}if(v.shiftKey&&!X&&v.code==="KeyA"){v.preventDefault();let he=w.selectedNodes().filter(we=>we.editable&&(we.type==="frame"||we.type==="group"));for(let we of he)w.updateNode(we.sourceId,{layout:{direction:"vertical",gap:8,padding:{top:12,right:12,bottom:12,left:12},alignPrimary:"start",alignCounter:"start"}});return}if(X&&v.altKey&&F==="k"){v.preventDefault(),w.createComponentFromSelection();return}if(X&&(v.code==="BracketRight"||v.code==="BracketLeft")){v.preventDefault();let we=v.code==="BracketRight"?v.shiftKey?"front":"forward":v.shiftKey?"back":"backward";w.reorder(we);return}if(X&&v.shiftKey&&F==="l"){v.preventDefault();let he=w.selectedNodes(),we=!(he.length>0&&he.every(Me=>Me.sourceNode?.locked));for(let Me of he)w.setLocked(Me.sourceId,we);return}if(X&&v.shiftKey&&F==="h"){v.preventDefault();let he=w.selectedNodes(),we=!(he.length>0&&he.every(Me=>Me.sourceNode?.visible===!1));for(let Me of he)w.setVisibility(Me.sourceId,we);return}if(!X&&v.shiftKey&&(v.code==="Digit1"||v.code==="Digit2")){v.preventDefault(),v.code==="Digit1"?w.zoomToFit():w.zoomToSelection();return}if(!X&&v.shiftKey&&v.code==="Digit0"){v.preventDefault(),w.setViewport({...w.state.viewport,zoom:1});return}if(X&&F==="z"){v.preventDefault(),v.shiftKey?w.redo():w.undo();return}if(X&&F==="a"){v.preventDefault();let he=w.state.scene?.roots??[];w.setSelection(he.map(we=>we.key));return}if(X&&F==="c"){v.preventDefault(),v.shiftKey?w.copySelectionImage():w.copySelection();return}if(X&&F==="x"){v.preventDefault(),w.copySelection(),w.deleteSelection();return}if(X&&F==="d"){v.preventDefault(),w.duplicateSelection();return}if(X&&F==="g"){v.preventDefault(),v.shiftKey?w.ungroupSelection():w.groupSelection();return}if(X&&F==="0"){v.preventDefault(),w.setViewport({...w.state.viewport,zoom:1});return}if(X&&(F==="="||F==="+")){v.preventDefault();let he=w.viewportSize();w.zoomAt({x:he.width/2,y:he.height/2},1.2);return}if(X&&F==="-"){v.preventDefault();let he=w.viewportSize();w.zoomAt({x:he.width/2,y:he.height/2},.8333333333333334);return}if(F==="1"&&!X){w.zoomToFit();return}if(F==="2"&&!X){w.zoomToSelection();return}if(F==="delete"||F==="backspace"){v.preventDefault(),w.deleteSelection();return}if(F==="enter"){let he=w.primaryNode();he&&(he.type==="frame"||he.type==="group")&&he.children?.length&&w.setSelection([he.children[0].key]);return}let V={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1]}[F];if(V){v.preventDefault();let he=v.shiftKey?10:1,we=w.selectedNodes().filter(Se=>Se.editable);if(!we.length)return;let Me=we.map(Se=>({sourceId:Se.sourceId,x:Se.sourceNode.x,y:Se.sourceNode.y,absX:Se.absX,absY:Se.absY,width:Se.width,height:Se.height,parent:Se.parent}));ms(w,Me,V[0]*he,V[1]*he),w.commit(),w.scheduleSave();return}if(!X&&F==="i"){v.preventDefault(),w.requestImagePick?.();return}let ee={v:"pointer",f:"frame",r:"rect",o:"ellipse",l:"line",k:"connect",t:"text",h:"hand",c:"comment"};!X&&ee[F]&&w.setTool(ee[F])},x=v=>{v.key===" "&&(s.current=!1,W(!1)),v.key==="Alt"&&pe([])};return window.addEventListener("keydown",b),window.addEventListener("keyup",x),()=>{window.removeEventListener("keydown",b),window.removeEventListener("keyup",x)}},[]);let se=b=>{d.current=b,!c.current&&(c.current=requestAnimationFrame(()=>{c.current=0;let x=d.current;d.current=null,x?.()}))},Be=b=>{let x=a.current.getBoundingClientRect();return{x:b.clientX-x.left,y:b.clientY-x.top}};C.useEffect(()=>{if(!Q)return;let b=v=>{v.target?.closest?.(".dshc-context-menu")||B(null)},x=v=>{v.key==="Escape"&&(v.preventDefault(),v.stopPropagation(),B(null))};return window.addEventListener("pointerdown",b,!0),window.addEventListener("wheel",b,{capture:!0,passive:!0}),window.addEventListener("keydown",x,!0),()=>{window.removeEventListener("pointerdown",b,!0),window.removeEventListener("wheel",b,!0),window.removeEventListener("keydown",x,!0)}},[Q]);let xt=b=>{if(b.preventDefault(),!a.current)return;let x=Be(b),v=Ve(U,x),D=z(v);D&&!e.state.selection.includes(D.key)&&e.setSelection([D.key]);let{clientWidth:R,clientHeight:S}=a.current,$=Math.min(window.innerHeight*.7,S-16);B({x:mt(x.x,8,Math.max(8,R-226)),y:mt(x.y,8,Math.max(8,S-$-8)),world:v,hit:D?.key??null})},en=b=>{if(!b)return[];let x=4,v={l:b.absX,t:b.absY,r:b.absX+b.width,b:b.absY+b.height},D=(b.parent?.children??e.state.scene?.roots??[]).filter(V=>V&&V!==b&&V.visible!==!1),R=null,S=null,$=null,F=null;for(let V of D){let ee={l:V.absX,t:V.absY,r:V.absX+V.width,b:V.absY+V.height};if(Math.min(v.b,ee.b)-Math.max(v.t,ee.t)>0){let Me=v.l-ee.r,Se=ee.l-v.r;Me>=x&&(!R||ee.r>R.node.r)&&(R={node:ee,gap:Me,cross:(Math.max(v.t,ee.t)+Math.min(v.b,ee.b))/2}),Se>=x&&(!S||ee.l<S.node.l)&&(S={node:ee,gap:Se,cross:(Math.max(v.t,ee.t)+Math.min(v.b,ee.b))/2})}if(Math.min(v.r,ee.r)-Math.max(v.l,ee.l)>0){let Me=v.t-ee.b,Se=ee.t-v.b;Me>=x&&(!$||ee.b>$.node.b)&&($={node:ee,gap:Me,cross:(Math.max(v.l,ee.l)+Math.min(v.r,ee.r))/2}),Se>=x&&(!F||ee.t<F.node.t)&&(F={node:ee,gap:Se,cross:(Math.max(v.l,ee.l)+Math.min(v.r,ee.r))/2})}}let X=[],w=(V,ee,he,we,Me)=>{if(!(ee>0))return;let Se=ge(U,{x:we,y:he}),ct=ge(U,{x:Me,y:he});X.push({axis:V,x1:Se.x,y1:Se.y,x2:ct.x,y2:ct.y,label:String(Math.round(ee))})};if(R&&w("h",R.gap,R.cross,R.node.r,v.l),S&&w("h",S.gap,S.cross,v.r,S.node.l),$){let V=ge(U,{x:$.cross,y:$.node.b}),ee=ge(U,{x:$.cross,y:v.t});X.push({axis:"v",x1:V.x,y1:V.y,x2:ee.x,y2:ee.y,label:String(Math.round($.gap))})}if(F){let V=ge(U,{x:F.cross,y:v.b}),ee=ge(U,{x:F.cross,y:F.node.t});X.push({axis:"v",x1:V.x,y1:V.y,x2:ee.x,y2:ee.y,label:String(Math.round(F.gap))})}return X},Vs=b=>{if(b.button===2)return;pe([]),a.current?.focus?.({preventScroll:!0});let x=b.target,v=Be(b),D=Ve(U,v);if(e.canvasSize={width:a.current.clientWidth,height:a.current.clientHeight},x.closest?.("[data-comment-pin]")||ne.editingText)return;let R=x.closest?.("[data-handle]")?.getAttribute("data-handle");if(R==="connect"){let w=e.primaryNode();if(w&&!ne.componentMode){b.preventDefault();let V=ge(U,$e(w,{x:w.width,y:w.height/2}));r.current={mode:"connect",fromNode:w,startScreen:V,targetNode:null},Ye({fromNode:w,startScreen:V,currentScreen:v,targetNode:null}),a.current.setPointerCapture?.(b.pointerId)}return}if(R){b.preventDefault(),_s(R,v,b.pointerId);return}if(b.button===1||s.current||ne.tool==="hand"){b.preventDefault(),r.current={mode:"pan",startScreen:v,startViewport:{...U}},a.current.setPointerCapture?.(b.pointerId);return}if(ne.crop){let w=e.findSceneNode(ne.crop.key);if(w&&ln(w,D)){r.current={mode:"crop",start:D,startCrop:{...ne.crop.crop},node:w},a.current.setPointerCapture?.(b.pointerId);return}}if(ne.tool==="connect"){let w=z(D);if(!w||w.type==="path"||w.type==="line"||ne.componentMode)return;b.preventDefault(),e.setSelection([w.key]);let V=ge(U,$e(w,{x:w.width,y:w.height/2}));r.current={mode:"connect",fromNode:w,startScreen:V,targetNode:null},Ye({fromNode:w,startScreen:V,currentScreen:v,targetNode:null}),a.current.setPointerCapture?.(b.pointerId);return}if(ne.tool==="comment"){let w=z(D);e.state.commentDraft={x:D.x,y:D.y,nodeId:w?.sourceId,screenX:v.x,screenY:v.y},e.emit();return}if(["frame","rect","ellipse","line","text"].includes(ne.tool)){let w=sa(e,D),V=w?.type==="instance"?null:w;r.current={mode:"draw",tool:ne.tool,start:D,parent:V,startScreen:v},T({tool:ne.tool,x:v.x,y:v.y,width:0,height:0,w:0,h:0}),a.current.setPointerCapture?.(b.pointerId);return}let $=z(D);if(!$){r.current={mode:"marquee",start:D,startScreen:v,container:sa(e,D)},I({x:v.x,y:v.y,width:0,height:0}),b.shiftKey||e.clearSelection(),a.current.setPointerCapture?.(b.pointerId);return}if(b.shiftKey){e.toggleSelection($.key);return}e.state.selection.includes($.key)||e.setSelection([$.key]);let F=e.selectedNodes().filter(w=>w.editable);if(!F.length)return;let X=F.map(w=>({key:w.key,sourceId:w.sourceId,x:w.sourceNode.x,y:w.sourceNode.y,absX:w.absX,absY:w.absY,width:w.width,height:w.height,parent:w.parent,layoutParent:w.parent?.layout&&w.parent.type!=="instance"?w.parent:null,node:w}));r.current={mode:"move",start:D,startScreen:v,entries:X,moved:!1,alt:b.altKey,duplicated:!1},a.current.setPointerCapture?.(b.pointerId)},js=(b,x)=>{if(x.button!==0||(x.stopPropagation(),pe([]),a.current?.focus?.({preventScroll:!0}),ne.editingText))return;let v=Be(x),D=Ve(U,v);if(e.canvasSize={width:a.current.clientWidth,height:a.current.clientHeight},s.current||ne.tool==="hand"){r.current={mode:"pan",startScreen:v,startViewport:{...U}},a.current?.setPointerCapture?.(x.pointerId);return}if(x.shiftKey){e.toggleSelection(b.key);return}e.state.selection.includes(b.key)||e.setSelection([b.key]);let R=e.selectedNodes().filter($=>$.editable);if(!R.length)return;let S=R.map($=>({key:$.key,sourceId:$.sourceId,x:$.sourceNode.x,y:$.sourceNode.y,absX:$.absX,absY:$.absY,width:$.width,height:$.height,parent:$.parent,layoutParent:$.parent?.layout&&$.parent.type!=="instance"?$.parent:null,node:$}));r.current={mode:"move",start:D,startScreen:v,entries:S,moved:!1,alt:x.altKey,duplicated:!1,thresholdPx:2,pointerId:x.pointerId,captured:!1}},sa=(b,x)=>{let v=z(x);if(!v)return null;let D=v;for(;D;){if(D.type==="frame"||D.type==="instance")return D;D=D.parent}return null},_s=(b,x,v)=>{let D=e.primaryNode();if(!(!D||!D.editable)){if(b==="rotate"){let R=ge(U,zt(D));r.current={mode:"rotate",node:D,startAngle:Math.atan2(x.y-R.y,x.x-R.x),startRotation:D.rotation??0},a.current.setPointerCapture?.(v);return}r.current={mode:"resize",handle:b,node:D,startWidth:D.width,startHeight:D.height,startAbsX:D.absX,startAbsY:D.absY,startX:D.sourceNode.x,startY:D.sourceNode.y,startRotation:D.rotation??0,parentAbs:Jc(e,D)},a.current.setPointerCapture?.(v)}},Ys=b=>{let x=r.current,v=Be(b),D=Ve(U,v);if(!x){let R=z(D);(R?.key??null)!==A&&k(R?.key??null),b.altKey&&!ne.editingText?pe(en(e.primaryNode()??R)):ce.length&&pe([]);return}if(x.mode==="connect"){let R=X=>{let w=X,V=null;for(;w;)w.type==="frame"&&(V=w),w=w.parent;return V},S=z(D),$=null;if(S&&S.type!=="path"&&S.type!=="line"&&!S.sourceNode?.interaction){let X=R(S),w=R(x.fromNode);X&&X.sourceId!==w?.sourceId?$=X:S.sourceId!==x.fromNode.sourceId&&($=S)}x.targetNode=$;let F=$?ge(U,$e($,{x:0,y:$.height/2})):v;Ye({fromNode:x.fromNode,startScreen:x.startScreen,currentScreen:F,targetNode:$});return}if(x.mode==="pan"){e.setViewport({...x.startViewport,x:x.startViewport.x+(v.x-x.startScreen.x),y:x.startViewport.y+(v.y-x.startScreen.y)});return}if(x.mode==="crop"){let R=(D.x-x.start.x)/x.node.width,S=(D.y-x.start.y)/x.node.height,$={...x.startCrop};$.x=Math.min(1-$.width,Math.max(0,x.startCrop.x-R*$.width)),$.y=Math.min(1-$.height,Math.max(0,x.startCrop.y-S*$.height)),e.updateCrop($);return}if(x.mode==="marquee"){let R=Math.min(x.startScreen.x,v.x),S=Math.min(x.startScreen.y,v.y);I({x:R,y:S,width:Math.abs(v.x-x.startScreen.x),height:Math.abs(v.y-x.startScreen.y)});return}if(x.mode==="draw"){let R=fs(x.tool,x.start,D,b.shiftKey),S=ge(U,x.start),$=ge(U,{x:R.endX,y:R.endY}),F=Math.min(S.x,$.x),X=Math.min(S.y,$.y);T({tool:x.tool,x:F,y:X,width:Math.abs($.x-S.x),height:Math.abs($.y-S.y),w:Math.round(x.tool==="line"?R.length:R.w),h:Math.round(x.tool==="line"?0:R.h),x1:S.x,y1:S.y,x2:$.x,y2:$.y});return}if(x.mode==="move"){let R=D.x-x.start.x,S=D.y-x.start.y;if(!x.moved){let F=x.thresholdPx?Math.hypot(v.x-x.startScreen.x,v.y-x.startScreen.y):Math.abs(R)+Math.abs(S),X=x.thresholdPx??.5;if(F<=X)return;x.moved=!0,x.pointerId!=null&&!x.captured&&(a.current?.setPointerCapture?.(x.pointerId),x.captured=!0),x.alt&&(e.duplicateSelection(),x.entries=e.selectedNodes().filter(w=>w.editable).map(w=>({key:w.key,sourceId:w.sourceId,x:w.sourceNode.x,y:w.sourceNode.y,absX:w.absX,absY:w.absY,width:w.width,height:w.height,parent:w.parent,node:w})),x.duplicated=!0)}let $=b.shiftKey?Math.abs(R)>=Math.abs(S)?"x":"y":null;if($==="x"?S=0:$==="y"&&(R=0),x.entries.length===1&&x.entries[0].layoutParent){se(()=>Uc(e,x.entries[0],D));return}se(()=>{let F=Zc(e,x.entries,R,S,x.duplicated||b.altKey,n?.hidden),X=$==="y"?0:F.dx,w=$==="x"?0:F.dy,V=$?F.guides.filter(ee=>ee.axis===$):F.guides;ms(e,x.entries,X,w),P(V)});return}if(x.mode==="resize"){se(()=>Ws(x,D,b.shiftKey));return}if(x.mode==="rotate"){let R=ge(e.state.viewport,zt(x.node)),$=(Math.atan2(v.y-R.y,v.x-R.x)-x.startAngle)*180/Math.PI,F=x.startRotation+$,X=b.shiftKey?Math.round(F/15)*15:Math.round(F*10)/10;e.mutate(w=>{let V=Zn(e,x.node.sourceId);V&&(V.rotation=X)},{commit:!1});return}},Ws=(b,x,v)=>{let R={...b.node,absX:b.startAbsX,absY:b.startAbsY,width:b.startWidth,height:b.startHeight,rotation:b.startRotation},S=Di(R,x),$=b.handle,F=b.startWidth,X=b.startHeight,w,V,ee=b.startAbsX+b.startWidth,he=b.startAbsY+b.startHeight;if($.includes("w")&&(F=Math.max(1,b.startWidth-S.x)),$.includes("e")&&(F=Math.max(1,S.x)),$.includes("n")&&(X=Math.max(1,b.startHeight-S.y)),$.includes("s")&&(X=Math.max(1,S.y)),v&&$.length===2&&b.startWidth>0&&b.startHeight>0){let bn=b.startWidth/b.startHeight;F/X>bn?F=X*bn:X=F/bn}$==="nw"?(w={x:F,y:X},V=$e(R,{x:b.startWidth,y:b.startHeight})):$==="ne"?(w={x:0,y:X},V=$e(R,{x:0,y:b.startHeight})):$==="sw"?(w={x:F,y:0},V=$e(R,{x:b.startWidth,y:0})):$==="se"?(w={x:0,y:0},V=$e(R,{x:0,y:0})):$==="n"?(w={x:F/2,y:X},V=$e(R,{x:b.startWidth/2,y:b.startHeight})):$==="s"?(w={x:F/2,y:0},V=$e(R,{x:b.startWidth/2,y:0})):$==="w"?(w={x:F,y:X/2},V=$e(R,{x:b.startWidth,y:b.startHeight/2})):(w={x:0,y:X/2},V=$e(R,{x:0,y:b.startHeight/2}));let we=(b.startRotation??0)*Math.PI/180,Me={x:F/2,y:X/2},Se=Me.x-w.x,ct=Me.y-w.y,Rt={x:V.x+Se*Math.cos(we)-ct*Math.sin(we),y:V.y+Se*Math.sin(we)+ct*Math.cos(we)},tn=Rt.x-F/2,ni=Rt.y-X/2;e.mutate(bn=>{let nn=Zn(e,b.node.sourceId);nn&&(nn.width=Math.round(F),nn.height=Math.round(X),nn.x=Math.round(tn-b.parentAbs.x),nn.y=Math.round(ni-b.parentAbs.y))},{commit:!1})},oa=b=>{let x=r.current;if(r.current=null,P([]),!!x){if(x.mode==="marquee"){let v=Be(b),D=Math.min(x.startScreen.x,v.x),R=Math.min(x.startScreen.y,v.y),S=Math.abs(v.x-x.startScreen.x),$=Math.abs(v.y-x.startScreen.y);if(I(null),S>3||$>3){let F=Ve(U,{x:D,y:R}),X={x:F.x,y:F.y,width:S/U.zoom,height:$/U.zoom},V=(x.container?x.container.children??[]:e.state.scene?.roots??[]).filter(ee=>ee.visible!==!1&&!n?.hidden.has(ee.key)&&Zr(X,{x:ee.absX,y:ee.absY,width:ee.width,height:ee.height})).map(ee=>ee.key);e.setSelection(V)}return}if(x.mode==="draw"){T(null);let v=Be(b),D=x.start,R=Ve(U,v),S=fs(x.tool,D,R,b.shiftKey),$=S.w,F=S.h,X=x.parent,w=X?{x:X.absX,y:X.absY}:{x:0,y:0},V=x.tool==="line"?S.length<4:$<4&&F<4,ee={frame:{width:320,height:480},rect:{width:120,height:120},ellipse:{width:120,height:120},text:{width:200,height:28},line:{width:160,height:0}}[x.tool],he=V?ee.width:Math.max(2,$),we=V?ee.height:Math.max(x.tool==="line"?0:2,F),Me=V?D.x:S.x,Se=V?D.y:S.y,ct=0;if(x.tool==="line"&&!V){let ni=Math.max(2,S.length);Me=(D.x+S.endX)/2-ni/2,Se=(D.y+S.endY)/2,ct=Math.round(S.rotation*10)/10}let Rt={type:x.tool,name:x.tool==="text"?"Text":x.tool==="frame"?"Frame":x.tool==="rect"?"Rectangle":x.tool==="ellipse"?"Ellipse":"Line",x:Me-w.x,y:Se-w.y,width:x.tool==="line"&&!V?Math.max(2,S.length):he,height:x.tool==="line"?0:we,rotation:ct,opacity:1,visible:!0,locked:!1};x.tool==="frame"?Object.assign(Rt,{fills:[{type:"solid",color:"#FFFFFF"}],strokes:[],effects:[],cornerRadius:0,clip:!0,children:[]}):x.tool==="rect"||x.tool==="ellipse"?Object.assign(Rt,{fills:[{type:"solid",color:"#D9D9D9"}],strokes:[],effects:[],cornerRadius:0}):x.tool==="text"?Object.assign(Rt,{text:"Text",font:{family:"system-ui",weight:400,style:"normal",size:16,lineHeight:1.4,letterSpacing:0},align:"left",verticalAlign:"top",fills:[{type:"solid",color:"#111111"}],effects:[],autoHeight:!0}):x.tool==="line"&&Object.assign(Rt,{strokes:[{color:"#111111",width:1,align:"center"}]});let tn=e.addNode(Rt,X?.sourceId??null);tn&&(e.setTool("pointer"),tn.type==="text"&&e.beginTextEdit(tn.id));return}if(x.mode==="connect"){Ye(null),x.targetNode&&x.targetNode.sourceId!==x.fromNode?.sourceId&&e.createInteraction?.(x.fromNode.sourceId,x.targetNode.sourceId,"\u70B9\u51FB\u8DF3\u8F6C");return}if(x.mode==="crop"){e.commitCrop();return}if(x.mode==="move"||x.mode==="resize"||x.mode==="rotate"){if(c.current){cancelAnimationFrame(c.current),c.current=0;let D=d.current;d.current=null,D?.()}if(x.mode==="move"&&!x.moved)return;let v=x.mode==="move"?(x.entries??[]).map(D=>D.sourceId):x.node?.sourceId?[x.node.sourceId]:[];v.length&&e.syncConnectedWires?.(v),e.commit(),e.scheduleSave(),e.queueSelectionPost()}}},Gs=b=>{let x=Be(b),v=Ve(U,x),D=z(v,!0);if(D){if(D.type==="text"){e.beginTextEdit(D.key);return}if(D.type==="instance"){e.enterInstance(D.key);return}if(D.type==="frame"||D.type==="group"){D.children?.length&&e.setSelection([D.children[0].key]);return}if(D.instanceId&&e.state.enteredInstance===D.instanceId){e.setSelection([D.key]);return}}},Ks=()=>{let b=e.selectedNodes().filter(R=>!n?.hidden.has(R.key)),x=b.find(R=>R.key===ne.primaryKey),v=[];for(let R of b){let S=Zt(R).map($=>ge(U,$));v.push(C.createElement("polygon",{key:`outline-${R.key}`,points:S.map($=>`${$.x},${$.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:1}))}if(A&&!ne.selection.includes(A)){let R=e.findSceneNode(A);if(R){let S=Zt(R).map($=>ge(U,$));v.push(C.createElement("polygon",{key:"hover",points:S.map($=>`${$.x},${$.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:1,opacity:.55}))}}if(x&&b.length===1&&x.editable&&!ne.crop){let R=Ur(x,U);for(let[F,X]of Object.entries(R))v.push(C.createElement("rect",{key:`handle-${F}`,x:X.x-Yn/2,y:X.y-Yn/2,width:Yn,height:Yn,fill:"var(--dsw-alias-bg-base)",stroke:"var(--dshc-accent)",strokeWidth:1,style:{cursor:F==="n"||F==="s"?"ns-resize":F==="e"||F==="w"?"ew-resize":F==="nw"||F==="se"?"nwse-resize":"nesw-resize"},"data-handle":F}));let S=Jr(x,U),$=ge(U,$e(x,{x:x.width/2,y:0}));if(v.push(C.createElement("line",{key:"rotate-line",x1:$.x,y1:$.y,x2:S.x,y2:S.y,stroke:"var(--dshc-accent)",strokeWidth:1}),C.createElement("circle",{key:"rotate",cx:S.x,cy:S.y,r:5,fill:"var(--dsw-alias-bg-base)",stroke:"var(--dshc-accent)",strokeWidth:1,"data-handle":"rotate",style:{cursor:"grab"}})),!ne.componentMode&&x.type!=="path"&&x.type!=="line"&&!x.sourceNode?.interaction){let F=ge(U,$e(x,{x:x.width,y:x.height/2})),X=F.x+18,w=F.y;v.push(C.createElement("g",{key:"connect-handle","data-handle":"connect",style:{cursor:"crosshair"}},C.createElement("title",null,"\u62D6\u5411\u76EE\u6807\u754C\u9762\u5EFA\u7ACB\u4EA4\u4E92\u8DF3\u8F6C\u8FDE\u7EBF"),C.createElement("line",{x1:F.x+4,y1:w,x2:X-7,y2:w,stroke:"var(--dshc-accent)",strokeWidth:1.25,opacity:.7}),C.createElement("circle",{cx:X,cy:w,r:7,fill:"#4D6BFE",stroke:"#FFFFFF",strokeWidth:1.5}),C.createElement("path",{d:`M ${X-3} ${w} H ${X+3} M ${X} ${w-3} V ${w+3}`,stroke:"#FFFFFF",strokeWidth:1.5,strokeLinecap:"round",pointerEvents:"none"})))}}if(me){let R=Ja(me.startScreen,me.currentScreen);if(me.targetNode){let S=Zt(me.targetNode).map($=>ge(U,$));v.push(C.createElement("polygon",{key:"connect-target-outline",points:S.map($=>`${$.x},${$.y}`).join(" "),fill:"rgba(77, 107, 254, 0.08)",stroke:"#4D6BFE",strokeWidth:2,strokeDasharray:"6 3"}))}v.push(C.createElement("circle",{key:"connect-start-dot",cx:me.startScreen.x,cy:me.startScreen.y,r:4,fill:"#4D6BFE",stroke:"#FFFFFF",strokeWidth:1.5}),C.createElement("path",{key:"connect-live-wire",d:R,fill:"none",stroke:"#4D6BFE",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}))}if(n?.placements?.length>1)for(let R of n.placements){let S=e.findSceneNode(R);if(!S)continue;let $=ge(U,$e(S,{x:0,y:0})),F=R===n.anchorId;v.push((0,Ue.jsxs)("g",{"data-placement-id":R,pointerEvents:"none",children:[(0,Ue.jsx)("rect",{x:$.x,y:$.y,width:F?62:38,height:18,rx:3,fill:"var(--dshc-accent)"}),(0,Ue.jsx)("text",{x:$.x+5,y:$.y+13,fill:"white",fontSize:12,children:F?"\u805A\u7126\u8D77\u70B9":"\u540C\u9875"})]},"reference-"+R))}let D=i?e.findSceneNode(i):null;if(D){let R=Zt(D).map(S=>ge(U,S));v.push(C.createElement("polygon",{key:"interaction-destination",className:`${ue}-interaction-destination`,points:R.map(S=>`${S.x},${S.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:2,strokeDasharray:"5 3"}))}for(let R of j)if(R.axis==="x"){let S=R.value*U.zoom+U.x;v.push(C.createElement("line",{key:`guide-${R.value}`,x1:S,y1:0,x2:S,y2:"100%",stroke:"var(--dsw-alias-state-error-primary)",strokeWidth:1,strokeDasharray:"4 4"}))}else{let S=R.value*U.zoom+U.y;v.push(C.createElement("line",{key:`guide-${R.value}`,x1:0,y1:S,x2:"100%",y2:S,stroke:"var(--dsw-alias-state-error-primary)",strokeWidth:1,strokeDasharray:"4 4"}))}if(N&&v.push(C.createElement("rect",{key:"marquee",x:N.x,y:N.y,width:N.width,height:N.height,fill:"color-mix(in srgb, var(--dshc-accent) 10%, transparent)",stroke:"var(--dshc-accent)",strokeWidth:1,strokeDasharray:"4 3"})),M&&(M.tool==="line"&&M.x1!=null&&M.y1!=null&&M.x2!=null&&M.y2!=null?v.push(C.createElement("line",{key:"draw-line",x1:M.x1,y1:M.y1,x2:M.x2,y2:M.y2,stroke:"var(--dshc-accent)",strokeWidth:1.5,strokeDasharray:"4 3"})):M.tool==="ellipse"?v.push(C.createElement("ellipse",{key:"draw-ellipse",cx:M.x+M.width/2,cy:M.y+M.height/2,rx:M.width/2,ry:M.height/2,fill:"rgba(77, 107, 254, 0.06)",stroke:"var(--dshc-accent)",strokeWidth:1,strokeDasharray:"4 3"})):v.push(C.createElement("rect",{key:"draw",x:M.x,y:M.y,width:M.width,height:M.height,fill:"rgba(77, 107, 254, 0.06)",stroke:"var(--dshc-accent)",strokeWidth:1,strokeDasharray:"4 3"})),M.width>1||M.height>1)){let R=`${M.w} \xD7 ${M.h}`,S=Math.max(54,ps(R)),$=M.x+M.width/2-S/2,F=M.y+M.height+8;v.push(C.createElement("rect",{key:"draw-dim-bg",x:$,y:F,width:S,height:20,rx:6,fill:"#4D6BFE"}),C.createElement("text",{key:"draw-dim-text",x:$+S/2,y:F+14,fill:"#FFFFFF",fontSize:11,fontFamily:"system-ui",textAnchor:"middle"},R))}if(ne.crop){let R=e.findSceneNode(ne.crop.key);if(R){let S=ne.crop.crop,$=[ge(U,$e(R,{x:S.x*R.width,y:S.y*R.height})),ge(U,$e(R,{x:(S.x+S.width)*R.width,y:S.y*R.height})),ge(U,$e(R,{x:(S.x+S.width)*R.width,y:(S.y+S.height)*R.height})),ge(U,$e(R,{x:S.x*R.width,y:(S.y+S.height)*R.height}))];v.push(C.createElement("polygon",{key:"crop",points:$.map(F=>`${F.x},${F.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:2}))}}for(let[R,S]of ce.entries()){let $="#FF4D6D";v.push(C.createElement("line",{key:`measure-line-${R}`,x1:S.x1,y1:S.y1,x2:S.x2,y2:S.y2,stroke:$,strokeWidth:1}));let F=4;S.axis==="h"?v.push(C.createElement("line",{key:`measure-t1-${R}`,x1:S.x1,y1:S.y1-F,x2:S.x1,y2:S.y1+F,stroke:$,strokeWidth:1}),C.createElement("line",{key:`measure-t2-${R}`,x1:S.x2,y1:S.y2-F,x2:S.x2,y2:S.y2+F,stroke:$,strokeWidth:1})):v.push(C.createElement("line",{key:`measure-t1-${R}`,x1:S.x1-F,y1:S.y1,x2:S.x1+F,y2:S.y1,stroke:$,strokeWidth:1}),C.createElement("line",{key:`measure-t2-${R}`,x1:S.x2-F,y1:S.y2,x2:S.x2+F,y2:S.y2,stroke:$,strokeWidth:1}));let X=(S.x1+S.x2)/2,w=(S.y1+S.y2)/2,V=Math.max(20,S.label.length*6+8),ee=S.axis==="h"?X-V/2:X+6,he=S.axis==="h"?w-13:w-7;v.push(C.createElement("rect",{key:`measure-bg-${R}`,x:ee,y:he,width:V,height:14,rx:3,fill:$}),C.createElement("text",{key:`measure-text-${R}`,x:ee+V/2,y:he+10,fill:"#FFFFFF",fontSize:9,fontFamily:"system-ui",textAnchor:"middle"},S.label))}if(L){let R=ge(U,{x:L.x,y:L.y}),S=L.width*U.zoom,$=L.height*U.zoom,F=`${L.name} \xB7 ${L.width}\xD7${L.height}`,X=Math.max(88,F.length*7+16);v.push(C.createElement("rect",{key:"template-ghost-rect",x:R.x,y:R.y,width:S,height:$,rx:4,fill:"rgba(77, 107, 254, 0.08)",stroke:"#4D6BFE",strokeWidth:1.5,strokeDasharray:"6 4"}),C.createElement("rect",{key:"template-ghost-badge-bg",x:R.x+S/2-X/2,y:R.y+$/2-11,width:X,height:22,rx:6,fill:"#4D6BFE"}),C.createElement("text",{key:"template-ghost-badge-text",x:R.x+S/2,y:R.y+$/2+4,fill:"#FFFFFF",fontSize:11,fontFamily:"system-ui",textAnchor:"middle"},F))}if(re){let R=e.findSceneNode(re.key);if(R){let S=Zt(R).map(w=>ge(U,w)),$=ge(U,$e(R,{x:R.width/2,y:0})),F=`\u5E94\u7528\u6837\u5F0F\uFF1A${re.styleName}`,X=Math.max(76,ps(F));v.push(C.createElement("polygon",{key:"style-drop-outline",points:S.map(w=>`${w.x},${w.y}`).join(" "),fill:"rgba(77, 107, 254, 0.12)",stroke:"#4D6BFE",strokeWidth:2,strokeDasharray:"5 3"}),C.createElement("rect",{key:"style-drop-badge-bg",x:$.x-X/2,y:$.y-28,width:X,height:20,rx:6,fill:"#4D6BFE"}),C.createElement("text",{key:"style-drop-badge-text",x:$.x,y:$.y-14,fill:"#FFFFFF",fontSize:11,fontFamily:"system-ui",textAnchor:"middle"},F))}}return v},ei=ne.editingText?e.findSceneNode(ne.editingText.key):null,ca=(ne.doc?.comments??[]).filter(b=>b.pageId===ne.pageId),Zs=ne.showComments?ca.filter(b=>!b.resolved):[],ti=e.primaryNode(),Hl=ti&&ti.type==="text"?Hn(ti):{color:"var(--dsw-alias-label-primary)"},Us=Q?Vn(e):[];return C.createElement("div",{ref:a,className:`${ue}-viewport`,"data-tool":ne.tool,tabIndex:-1,onPointerDown:Vs,onPointerMove:Ys,onPointerUp:oa,onPointerCancel:oa,onPointerLeave:()=>pe([]),onDoubleClick:Gs,onContextMenu:xt,onDragOver:b=>{let x=[...b.dataTransfer?.types??[]],v=Ki();if(x.includes(mn)||v?.kind==="style"){b.preventDefault(),b.dataTransfer&&(b.dataTransfer.dropEffect="copy"),L&&ae(null),Pe&&Z(!1);let D=a.current?.getBoundingClientRect();if(D){let R=Ve(U,{x:b.clientX-D.left,y:b.clientY-D.top}),S=z(R);if(S){let $=v?.kind==="style"?v.name:"\u6837\u5F0F";fe(F=>F&&F.key===S.key&&F.styleName===$?F:{key:S.key,styleName:$})}else fe($=>$&&null)}return}if(x.includes(fn)||x.includes(Ut)||v?.kind==="template"||v?.kind==="component"){b.preventDefault(),b.dataTransfer&&(b.dataTransfer.dropEffect="copy"),re&&fe(null),Pe&&Z(!1);let D=a.current?.getBoundingClientRect();if(D&&v&&(v.kind==="template"||v.kind==="component")){let R=Ve(U,{x:b.clientX-D.left,y:b.clientY-D.top});ae({x:Math.round(R.x-v.width/2),y:Math.round(R.y-v.height/2),width:v.width,height:v.height,name:v.name})}return}x.includes("Files")&&(b.preventDefault(),b.dataTransfer&&(b.dataTransfer.dropEffect="copy"),L&&ae(null),re&&fe(null),Pe||Z(!0))},onDragLeave:b=>{a.current?.contains(b.relatedTarget)||(ae(null),fe(null),Z(!1))},onDrop:b=>{let x=Ki();Z(!1),fe(null);let v=b.dataTransfer?.getData(mn)||(x?.kind==="style"?x.id:"");if(v){b.preventDefault(),ae(null),yt();let w=a.current?.getBoundingClientRect(),V=w?Ve(U,{x:b.clientX-w.left,y:b.clientY-w.top}):null,ee=V?z(V):null;ee?e.applyStyleToNode(v,ee.key):e.state.selection?.length?e.applyStyle(v):e.toast("\u8BF7\u5C06\u6837\u5F0F\u62D6\u653E\u5230\u76EE\u6807\u56FE\u5C42\u4E0A");return}let D=b.dataTransfer?.getData(Ut)||(x?.kind==="component"?x.id:"");if(D){b.preventDefault();let w=a.current?.getBoundingClientRect(),V=w?Ve(U,{x:b.clientX-w.left,y:b.clientY-w.top}):void 0;ae(null),yt(),e.insertInstance(D,V);return}let R=b.dataTransfer?.getData(fn)||(x?.kind==="template"?x.id:"");if(R){b.preventDefault();let w=a.current?.getBoundingClientRect(),V=w?Ve(U,{x:b.clientX-w.left,y:b.clientY-w.top}):void 0;ae(null),yt(),e.insertTemplate(R,V);return}let S=[...b.dataTransfer?.files??[]];if(!S.length)return;b.preventDefault();let $=a.current?.getBoundingClientRect(),F=$?Ve(U,{x:b.clientX-$.left,y:b.clientY-$.top}):void 0,X=0;for(let w of S){let V=w.type==="image/svg+xml"||/\.svg$/i.test(w.name),ee=!V&&w.type.startsWith("image/");if(!V&&!ee)continue;let he=X*16;X+=1;let we=F?{x:Math.round(F.x+he),y:Math.round(F.y+he)}:void 0;V?w.text().then(Me=>e.importSvg(Me,we)).catch(()=>{e.toast("\u8BFB\u53D6 SVG \u6587\u4EF6\u5931\u8D25","error")}):e.uploadImageFile(w,we)}},style:{position:"absolute",inset:0,overflow:"hidden",cursor:ne.tool==="hand"||K?"grab":ne.tool==="comment"?"crosshair":ne.tool==="pointer"?"default":"crosshair",background:"var(--dsw-alias-bg-base)",backgroundImage:"radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent) 1px, transparent 0)",backgroundSize:"16px 16px",userSelect:"none"}},(0,Ue.jsx)("div",{className:"dshc-scene-surface",children:(0,Ue.jsx)("div",{className:"dshc-world",style:{transform:`translate(${U.x}px, ${U.y}px) scale(${U.zoom})`},children:(0,Ue.jsx)(rs,{scene:ne.scene,store:e,interactions:n,visibleChildren:Ot,editingKey:ne.editingText?.key})})}),C.createElement("svg",{className:`${ue}-overlay`,style:{position:"absolute",inset:0,pointerEvents:"none",overflow:"visible"}},Ks()),(Ot.get(null)??[]).filter(b=>b.type==="frame"&&b.visible!==!1).map(b=>{let x=e.findSceneNode(b.key)??b;return C.createElement(qc,{key:`frame-label-${b.key}`,node:x,viewport:U,selected:ne.selection.includes(b.key),onStartMove:v=>js(x,v),onRename:v=>{x?.sourceId&&e.renameNode(x.sourceId,v)},onFocusViewport:()=>a.current?.focus?.({preventScroll:!0})})}),A&&!n?.hidden.has(A)&&!(ne.scene?.roots??[]).some(b=>b.key===A&&b.type==="frame")&&C.createElement(Qc,{node:e.findSceneNode(A),viewport:U,key:`hover-label-${A}`}),ne.editingText&&ei&&C.createElement(el,{key:`edit-${ei.key}`,node:ei,viewport:U,value:o,onChange:l,onCommit:()=>e.commitTextEdit(o),onCancel:()=>e.cancelTextEdit()}),ne.commentDraft&&C.createElement(tl,{draft:ne.commentDraft,value:h,onChange:u,onCancel:()=>{ne.commentDraft=null,u(""),e.emit()},onSave:()=>{e.addComment(h,{nodeId:ne.commentDraft.nodeId,x:ne.commentDraft.x,y:ne.commentDraft.y}),u("")}}),Zs.map(b=>C.createElement("button",{key:b.id,type:"button","data-comment-pin":b.id,className:`${ue}-comment-pin ${b.author==="ai"?`${ue}-comment-pin-ai`:""}`,style:(()=>{let x=e.commentPosition(b);return{left:x.x,top:x.y}})(),onClick:x=>{x.stopPropagation(),p(f===b.id?null:b.id);let v=b.nodeId?e.findSceneNode(b.nodeId):null;v&&e.setSelection([v.key])},title:b.body},b.replies?.length?String(b.replies.length+1):"1")),f&&(()=>{let b=ca.find(v=>v.id===f);if(!b)return null;let x=e.commentPosition(b);return C.createElement(nl,{comment:b,position:x,replyText:g,onReplyChange:y,onReply:()=>{e.replyComment(b.id,g),y("")},onResolve:()=>{e.resolveComment(b.id,!0),p(null)},onDelete:()=>{e.deleteComment(b.id),p(null)},onClose:()=>p(null)})})(),ne.crop&&C.createElement(il,{crop:ne.crop.crop,onChange:b=>e.updateCrop(b),onCommit:()=>e.commitCrop(),onCancel:()=>e.cancelCrop()}),Q&&C.createElement(On,{x:Q.x,y:Q.y,items:Us,onClose:()=>B(null)}),Pe&&(0,Ue.jsx)("div",{className:`${ue}-canvas-drop-overlay`,children:(0,Ue.jsx)("span",{children:"\u677E\u624B\u63D2\u5165\u56FE\u7247\u6216 SVG \u5230\u6B64\u5904"})}),(ne.tool==="connect"||me)&&(0,Ue.jsxs)("div",{className:`${ue}-connect-banner`,onPointerDown:b=>b.stopPropagation(),children:[(0,Ue.jsx)("span",{className:`${ue}-connect-banner-dot`}),(0,Ue.jsx)("span",{className:`${ue}-connect-banner-text`,children:me?me.targetNode?`\u677E\u624B\u5EFA\u7ACB\u8DF3\u8F6C\uFF1A\u300C${me.fromNode?.name||"\u8D77\u70B9"}\u300D\u2192\u300C${me.targetNode.name||"\u76EE\u6807"}\u300D`:`\u8D77\u70B9\u300C${me.fromNode?.name||"\u5143\u7D20"}\u300D\u2192 \u62D6\u5230\u76EE\u6807\u754C\u9762\u677E\u624B\u5EFA\u7ACB\u8DF3\u8F6C`:"\u4EA4\u4E92\u8FDE\u7EBF\u6A21\u5F0F\uFF1A\u4ECE\u6309\u94AE\u6216\u754C\u9762\u62D6\u5411\u76EE\u6807\u754C\u9762\uFF0C\u6807\u6CE8\u70B9\u51FB\u8DF3\u8F6C\u6D41\u7A0B"}),!me&&(0,Ue.jsx)("button",{type:"button",className:`${ue}-connect-banner-exit`,onClick:()=>e.setTool("pointer"),children:"\u9000\u51FA (Esc)"})]}),!ne.scene?.roots?.length&&C.createElement("div",{className:`${ue}-empty`,style:{pointerEvents:"none"}},C.createElement("div",{className:`${ue}-empty-title`},"\u753B\u5E03\u662F\u7A7A\u7684"),C.createElement("div",{className:`${ue}-empty-text`},"\u7528\u5DE5\u5177\u680F\u753B\u4E00\u4E2A Frame\uFF0C\u6216\u70B9\u300C\u8BA9 AI \u751F\u6210\u300D")))}function qc({node:e,viewport:t,selected:n,onStartMove:i,onRename:a,onFocusViewport:r}){let[s,c]=C.useState(!1),[d,o]=C.useState(e.name||"Frame"),l=C.useRef(null),h=C.useRef(!1);C.useEffect(()=>{s&&(l.current?.focus(),l.current?.select())},[s]);let u=$e(e,{x:0,y:0}),f=ge(t,u),p=()=>{if(h.current)return;h.current=!0;let y=d.trim();c(!1),y&&y!==e.name&&a?.(y),r?.()},g=()=>{h.current=!0,c(!1),o(e.name||"Frame"),r?.()};return s?(0,Ue.jsx)("input",{ref:l,type:"text",className:`${ue}-frame-label-input`,value:d,onChange:y=>o(y.target.value),onPointerDown:y=>y.stopPropagation(),onDoubleClick:y=>y.stopPropagation(),onBlur:p,onKeyDown:y=>{y.stopPropagation(),y.key==="Enter"?(y.preventDefault(),p()):y.key==="Escape"&&(y.preventDefault(),g())},style:{position:"absolute",left:f.x,top:f.y-6,transform:"translateY(-100%)",width:Math.max(80,Math.min(240,(d.length+2)*8)),pointerEvents:"auto",boxSizing:"border-box"}}):C.createElement("div",{className:`${ue}-frame-label ${n?"is-selected":""}`,style:{position:"absolute",left:f.x,top:f.y-6,transform:"translateY(-100%)",maxWidth:220,padding:"1px 6px",borderRadius:4,font:"500 11px/1.5 var(--dsw-font-family, system-ui, sans-serif)",background:n?"var(--dshc-accent)":"var(--dsw-alias-label-primary)",color:n?"#FFFFFF":"var(--dsw-alias-bg-base)",opacity:n?1:.78,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",cursor:"grab",pointerEvents:"auto",userSelect:"none",zIndex:9},title:e.name,onPointerDown:y=>{i?.(y)},onDoubleClick:y=>{y.preventDefault(),y.stopPropagation(),e.editable&&(h.current=!1,o(e.name||""),c(!0))}},e.name||"Frame")}function Qc({node:e,viewport:t}){if(!e)return null;let n=ge(t,{x:e.absX,y:e.absY-18/t.zoom});return C.createElement("div",{className:`${ue}-hover-label`,style:{position:"absolute",left:n.x,top:n.y,pointerEvents:"none"}},e.name)}function el({node:e,viewport:t,value:n,onChange:i,onCommit:a,onCancel:r}){let s=C.useRef(null);C.useEffect(()=>{s.current?.focus(),s.current?.select()},[]);let c=e.absX*t.zoom+t.x,d=e.absY*t.zoom+t.y,o=Math.max(24,e.width*t.zoom),l=Math.max(20,e.height*t.zoom),h=Hn(e);return C.createElement("textarea",{ref:s,className:`${ue}-text-editor`,value:n,onChange:u=>i(u.target.value),onPointerDown:u=>u.stopPropagation(),onBlur:a,onKeyDown:u=>{u.stopPropagation(),u.key==="Escape"?(u.preventDefault(),r()):u.key==="Enter"&&(u.metaKey||u.ctrlKey)&&(u.preventDefault(),a())},style:{position:"absolute",left:c,top:d,width:o,height:l,padding:0,margin:0,border:"1px solid var(--dshc-accent)",outline:"none",resize:"none",overflow:"hidden",background:"color-mix(in srgb, var(--dsw-alias-bg-overlay) 88%, transparent)",color:h.color==="transparent"?"var(--dsw-alias-label-primary)":h.color,fontFamily:`"${e.font?.family??"system-ui"}", system-ui, sans-serif`,fontWeight:e.font?.weight??400,fontStyle:e.font?.style??"normal",fontSize:`${(e.font?.size??14)*t.zoom}px`,lineHeight:String(e.font?.lineHeight??1.4),letterSpacing:`${(e.font?.letterSpacing??0)*t.zoom}px`,textAlign:e.align??"left",zIndex:20,borderRadius:2}})}function tl({draft:e,value:t,onChange:n,onCancel:i,onSave:a}){return C.createElement("div",{className:`${ue}-comment-popover`,style:{left:Math.max(8,e.screenX),top:Math.max(8,e.screenY)},onPointerDown:r=>r.stopPropagation()},C.createElement("div",{className:`${ue}-comment-title`},"\u6DFB\u52A0\u8BC4\u8BBA"),C.createElement("textarea",{autoFocus:!0,value:t,onChange:r=>n(r.target.value),placeholder:"\u5199\u4E0B\u8BBE\u8BA1\u53CD\u9988\u2026",className:`${ue}-comment-input`,rows:3}),C.createElement("div",{className:`${ue}-comment-actions`},C.createElement("button",{type:"button",onClick:i,className:`${ue}-btn`},"\u53D6\u6D88"),C.createElement("button",{type:"button",onClick:a,className:`${ue}-btn ${ue}-btn-primary`,disabled:!t.trim()},"\u8BC4\u8BBA")))}function nl({comment:e,position:t,replyText:n,onReplyChange:i,onReply:a,onResolve:r,onDelete:s,onClose:c}){return C.createElement("div",{className:`${ue}-comment-popover`,style:{left:Math.max(8,t.x+14),top:Math.max(8,t.y-8)},onPointerDown:d=>d.stopPropagation()},C.createElement("div",{className:`${ue}-comment-title`},e.resolved?"\u5DF2\u89E3\u51B3\u8BC4\u8BBA":"\u8BC4\u8BBA"),C.createElement("div",{className:`${ue}-comment-author`},e.author==="ai"?"AI":"\u4F60"),C.createElement("div",{className:`${ue}-comment-body`},e.body),(e.replies??[]).map(d=>C.createElement("div",{key:d.id,className:`${ue}-comment-reply`},C.createElement("b",null,d.author==="ai"?"AI":"\u4F60"),C.createElement("span",null,d.body))),!e.resolved&&C.createElement("div",null,C.createElement("textarea",{value:n,onChange:d=>i(d.target.value),placeholder:"\u56DE\u590D\u2026",className:`${ue}-comment-input`,rows:2}),C.createElement("div",{className:`${ue}-comment-actions`},C.createElement("button",{type:"button",className:`${ue}-btn`,onClick:c},"\u5173\u95ED"),C.createElement("button",{type:"button",className:`${ue}-btn`,onClick:s},"\u5220\u9664"),C.createElement("button",{type:"button",className:`${ue}-btn`,onClick:r},"\u89E3\u51B3"),C.createElement("button",{type:"button",className:`${ue}-btn ${ue}-btn-primary`,onClick:a,disabled:!n.trim()},"\u56DE\u590D"))))}function il({crop:e,onChange:t,onCommit:n,onCancel:i}){return C.createElement("div",{className:`${ue}-crop-bar`,onPointerDown:a=>a.stopPropagation()},C.createElement("span",null,"\u88C1\u526A"),C.createElement("label",null,"X",C.createElement("input",{type:"number",step:.01,min:0,max:1,value:Gn(e.x),onChange:a=>t({...e,x:Kn(a.target.value)})})),C.createElement("label",null,"Y",C.createElement("input",{type:"number",step:.01,min:0,max:1,value:Gn(e.y),onChange:a=>t({...e,y:Kn(a.target.value)})})),C.createElement("label",null,"\u5BBD",C.createElement("input",{type:"number",step:.01,min:.05,max:1,value:Gn(e.width),onChange:a=>t({...e,width:Kn(a.target.value,.05,1)})})),C.createElement("label",null,"\u9AD8",C.createElement("input",{type:"number",step:.01,min:.05,max:1,value:Gn(e.height),onChange:a=>t({...e,height:Kn(a.target.value,.05,1)})})),C.createElement("button",{type:"button",className:`${ue}-btn`,onClick:i},"\u53D6\u6D88"),C.createElement("button",{type:"button",className:`${ue}-btn ${ue}-btn-primary`,onClick:n},"\u5B8C\u6210"))}function Gn(e){return Math.round((Number(e)||0)*100)/100}function Kn(e,t=0,n=1){return Math.min(n,Math.max(t,Number(e)||0))}var Te=qe(require("react"),1);function ys(e,t,n=[]){let i=e.state.pageId!==t.pageId;if(i){let c=e.state.pageId;if(e.set({pageId:t.pageId},!1),e.rebuild(),!e.findSceneNode(t.id))return e.set({pageId:c},!1),e.rebuild(),e.emit(),!1}let a=e.findSceneNode(t.id);if(!a)return!1;let r=Kt(a),s=e.viewportSize?.();if(s&&n.length){let c=n.map(l=>e.findSceneNode(l)).filter(Boolean),d=ft([r,...c.map(Kt)]),o=Math.min((s.width-76)/Math.max(1,d.width),(s.height-76)/Math.max(1,d.height));r.height*o>=Math.min(180,(s.height-76)/2)&&(r=d)}return e.zoomToRect(r,38),i&&e.emit(),!0}function xs(e,t){let n=e.state,i=n.name+"/"+(n.doc?.id??""),[a,r]=Te.useState(null),[s,c]=Te.useState("properties"),[d,o]=Te.useState(),[l,h]=Te.useState(""),[u,f]=Te.useState(null),p=Te.useMemo(()=>$n(n.doc),[n.doc,n.scene]),g=n.componentMode?[]:n.selection,y=Te.useMemo(()=>En(p,g),[p,g]),A=!n.componentMode&&a?.document===i?a:null,k=Te.useMemo(()=>A?En(p,A.ids):null,[p,A]),N=k?.edges.length?k:y,I=!!k?.edges.length,M=Te.useMemo(()=>k?.edges.length?Ka(p,k,u?d:void 0):null,[p,k,d,u]),T=i+"/"+n.pageId+"/"+g.join(","),j=Te.useRef(""),P=Te.useRef(null);function K(){P.current&&(window.cancelAnimationFrame(P.current.id),P.current.complete(!1),P.current=null)}Te.useEffect(()=>{a&&(!A||!k?.edges.length)&&(r(null),o(void 0),f(null),h(""))},[a,A,k]),Te.useEffect(()=>{I||j.current===T||(j.current=T,o(void 0),h(""),f(null),y.edges.length&&(c("interactions"),n.inspectorOpen||e.set({inspectorOpen:!0})))},[T,I,y.edges.length,n.inspectorOpen,e]),Te.useEffect(()=>{if(!u)return;let Z=window.setTimeout(()=>f(null),1300);return()=>window.clearTimeout(Z)},[u]),Te.useEffect(()=>K,[]);function W(Z,re="",fe,me=!1){return K(),new Promise(Ye=>{let ne=window.requestAnimationFrame(()=>{P.current=null;let U=t.current;U&&(e.canvasSize={width:U.clientWidth,height:U.clientHeight});let at=fe&&N.edges.find(Ot=>Ot.id===fe),St=me&&at?[at.from,at.to,at.id,...at.labelId?[at.labelId]:[]]:[],Ht=ys(e,Z,St);Ht&&(o(fe),h(re),f({...Z})),Ye(Ht)});P.current={id:ne,complete:Ye}})}function Q(){K(),j.current=i+"/"+n.pageId+"/"+n.selection.join(","),r(null),o(void 0),h(""),f(null)}function B(Z,re){let fe=p.nodes.get(re);if(!fe)return Promise.resolve(!1);let me={id:re,pageId:fe.pageId};return r({...me,document:i,ids:[...Z]}),c("interactions"),n.inspectorOpen||e.set({inspectorOpen:!0}),W(me)}function ce(){if(I){Q();return}y.edges.length&&B(g,y.anchorId)}function pe(){let Z=N.targets.find(re=>re.key===l);return{pageId:n.pageId,selectedNodeIds:[...n.selection],activeConnectionId:d??null,placementIds:N.placements,focus:A&&I?{nodeId:A.id,nodeIds:A.ids,pageId:A.pageId}:null,viewed:Z?{nodeId:Z.id,pageId:Z.pageId}:null,visibleConnectionIds:p.edges.filter(re=>!M?.hidden.has(re.id)).map(re=>re.id)}}let L=Te.useRef({viewState:pe,execute:null});L.current={viewState:pe,async execute(Z,re){if(n.componentMode||!n.ready)return"not-in-design-view";if(Z==="status")return null;if(Z==="clear")return Q(),null;if(Z==="focus"){let fe=re?[re]:g,me=En(p,fe);return!me.anchorId||!me.edges.length?"no-related-connections":await B(fe,me.anchorId)?null:"navigation-cancelled"}if(Z==="return")return!A||!I?"no-focus":await W(A)?null:"navigation-cancelled";if(Z==="reveal"){let fe=N.targets.find(Ye=>Ye.events.some(ne=>ne.edgeId===re));if(fe)return await W(fe,fe.key,re,!0)?null:"navigation-cancelled";let me=N.targets.find(Ye=>Ye.id===re);return me?await W(me,me.key,me.events[0]?.edgeId)?null:"navigation-cancelled":"target-not-related"}return"unknown-action"}},Te.useEffect(()=>vr(({sessionId:Z,name:re,event:fe})=>{Z!==e.sessionId||re!==e.state.name||(async()=>{let me=await L.current.execute(fe.action,fe.nodeId);await new Promise(ne=>window.requestAnimationFrame(()=>ne()));let Ye=me?{ok:!1,error:me}:{ok:!0,...L.current.viewState()};await wr(Z,fe.requestId,Ye)})().catch(me=>console.warn("[dsh-canvas] interaction view request failed",me))}),[e]);let ae=Te.useMemo(()=>new Map,[n.doc,n.scene]);function Pe(Z){if(Z.pageId===n.pageId)return e.findSceneNode(Z.id);let re=ae.get(Z.pageId);return re||(re=vt(n.doc,{pageId:Z.pageId,measureText:e.measure}),lt(re),ae.set(Z.pageId,re)),re.byKey.get(Z.id)}return{tab:s,setTab:c,scope:N,focused:I,presentation:M,enabled:y.edges.length>0,hasConnections:p.edges.length>0&&!n.componentMode,totalEdges:p.edges.length,allEdges:p.edges.map(Z=>{let re=p.nodes.get(Z.from),fe=p.nodes.get(Z.to);return{id:Z.id,from:Z.from,to:Z.to,event:Z.event,fromName:re?.name??Z.from,toName:fe?.name??Z.to,fromPageId:re?.pageId??n.pageId,toPageId:fe?.pageId??n.pageId}}),available:!n.componentMode,toggle:ce,goTo:W,exit:Q,viewed:l,previewNode:Pe,returnToFocus:()=>{A&&W(A)},visit:(Z,re,fe)=>W(Z,re,fe??Z.events[0]?.edgeId,!!fe),activeEdge:d,visitStart:()=>{let Z=N.edges.find(fe=>fe.id===d),re=Z&&p.nodes.get(Z.from);re&&W(re,l,d)},destination:u?.pageId===n.pageId?u.id:null}}var Je=qe(require("react"),1);var Y=require("react/jsx-runtime");function al({target:e,store:t,previewNode:n}){if(e.previewAsset)return(0,Y.jsx)("img",{src:ht(t.sessionId,t.state.name,e.previewAsset),alt:"",loading:"lazy",draggable:!1});let i=n(e);if(!i)return(0,Y.jsx)(Ne,{name:"frame",size:20});let a=Math.min(1,54/Math.max(1,i.width),74/Math.max(1,i.height));return(0,Y.jsx)("span",{className:"dshc-interaction-mini",style:{width:i.width*a,height:i.height*a},children:(0,Y.jsx)("span",{style:{transform:`scale(${a})`},children:(0,Y.jsx)(ji,{node:i,store:t,parentAbs:{x:i.absX,y:i.absY}})})})}function rl(e,t){let n=[],i=e?.pages??[],a=i.length>1;for(let r of i){let s=a?`[${r.name||r.id}] `:"";for(let c of r.children??[])!c||c.visible===!1||c.id===t||c.interaction||c.type==="path"||c.type==="line"||(c.type==="frame"||c.type==="group"||c.type==="instance")&&n.push({value:c.id,label:`${s}${c.name||c.type}`})}return n}function bs({store:e,sourceNode:t}){let n=Je.useMemo(()=>rl(e.state.doc,t?.sourceId??null),[e.state.doc,t?.sourceId]),[i,a]=Je.useState(""),[r,s]=Je.useState("\u70B9\u51FB\u8DF3\u8F6C");if(Je.useEffect(()=>{n.length>0&&!n.some(d=>d.value===i)&&a(n[0].value)},[n,i]),!t||t.type==="path"||t.type==="line")return null;if(n.length===0)return(0,Y.jsx)("div",{className:"dshc-help",children:"\u5F53\u524D\u53EA\u6709\u4E00\u4E2A\u754C\u9762\uFF1B\u518D\u653E\u4E00\u4E2A\u76EE\u6807\u753B\u677F\uFF08Frame\uFF09\u540E\u5373\u53EF\u5EFA\u7ACB\u8DF3\u8F6C\u8FDE\u7EBF\u3002"});let c=()=>{i&&e.createInteraction?.(t.sourceId,i,r.trim()||"\u70B9\u51FB\u8DF3\u8F6C")};return(0,Y.jsxs)("div",{className:"dshc-interaction-form",children:[(0,Y.jsxs)("div",{className:"dshc-interaction-form-title",children:["\u4ECE\u300C",t.name||t.type,"\u300D\u6DFB\u52A0\u8DF3\u8F6C"]}),(0,Y.jsxs)("label",{className:"dshc-field is-wide",children:[(0,Y.jsx)("span",{className:"dshc-field-label",children:"\u8DF3\u8F6C\u5230\u76EE\u6807\u754C\u9762"}),(0,Y.jsx)(De,{value:i,options:n,onChange:a})]}),(0,Y.jsxs)("label",{className:"dshc-field is-wide",children:[(0,Y.jsx)("span",{className:"dshc-field-label",children:"\u89E6\u53D1\u4E8B\u4EF6\uFF08\u753B\u5E03\u4E0A\u4F1A\u663E\u793A\u6807\u7B7E\uFF09"}),(0,Y.jsx)("input",{className:"dshc-text-input",value:r,placeholder:"\u4F8B\u5982\uFF1A\u70B9\u51FB\u767B\u5F55\u3001\u6253\u5F00\u8BBE\u7F6E",onChange:d=>s(d.target.value),onKeyDown:d=>{d.key==="Enter"&&(d.preventDefault(),c())}})]}),(0,Y.jsx)(O,{small:!0,primary:!0,icon:"connect",disabled:!i,onClick:c,children:"\u6DFB\u52A0\u8DF3\u8F6C\u8FDE\u7EBF"})]})}function vs({scope:e,focused:t,viewed:n,allEdges:i=[],store:a,previewNode:r,onVisit:s,activeEdge:c,onVisitStart:d,onFocus:o,onReturn:l,onExit:h}){let u=Je.useRef(null),[f,p]=Je.useState(null),[g,y]=Je.useState(null),[A,k]=Je.useState(""),[N,I]=Je.useState(!1),M=a.primaryNode?.()??null,T=a.state.tool==="connect";Je.useLayoutEffect(()=>{let P=u.current;if(!P||typeof IntersectionObserver>"u")return;p(new Set);let K=new IntersectionObserver(W=>{p(Q=>{let B=new Set(Q);for(let ce of W){let pe=ce.target.dataset.previewKey;pe&&(ce.isIntersecting?B.add(pe):B.delete(pe))}return B})},{root:P,rootMargin:"120px 0px"});for(let W of P.querySelectorAll("[data-preview-key]"))K.observe(W);return()=>K.disconnect()},[e.targets]);let j=P=>{let K=A.trim();y(null),K&&a.updateInteractionEvent?.(P,K)};return(0,Y.jsx)("section",{ref:u,className:"dshc-interaction-panel","aria-label":"\u4EA4\u4E92\u6D41\u7A0B",children:e.edges.length>0?(0,Y.jsxs)(Y.Fragment,{children:[(0,Y.jsxs)("div",{className:"dshc-interaction-anchor",children:[(0,Y.jsx)("span",{children:t?"\u805A\u7126\u5BF9\u8C61":"\u5F53\u524D\u9009\u4E2D"}),(0,Y.jsx)("strong",{title:e.name,children:e.name}),e.placements.length>1&&(0,Y.jsxs)("span",{children:["\u5171 ",e.placements.length," \u5904 \xB7 ",e.edges.length," \u6761\u8DF3\u8F6C"]}),(0,Y.jsxs)("div",{className:"dshc-interaction-actions",children:[t?(0,Y.jsxs)(Y.Fragment,{children:[(0,Y.jsx)(O,{small:!0,onClick:l,children:"\u8FD4\u56DE\u8D77\u70B9"}),n&&c&&(0,Y.jsx)(O,{small:!0,onClick:d,children:"\u770B\u8FDE\u7EBF\u8D77\u70B9"}),(0,Y.jsx)(O,{small:!0,onClick:h,children:"\u9000\u51FA\u805A\u7126"})]}):(0,Y.jsx)(O,{small:!0,icon:"connect",onClick:o,children:"\u805A\u7126\u8FDE\u7EBF"}),(0,Y.jsx)(O,{small:!0,active:T,icon:"connect",title:"\u5728\u753B\u5E03\u4E0A\u62D6\u51FA\u8FDE\u7EBF\u6807\u6CE8\u754C\u9762\u8DF3\u8F6C",onClick:()=>a.setTool(T?"pointer":"connect"),children:T?"\u9000\u51FA\u753B\u7EBF":"\u753B\u8FDE\u7EBF"}),M&&(0,Y.jsx)(O,{small:!0,active:N,icon:"plus",onClick:()=>I(P=>!P),children:"\u6DFB\u52A0\u8DF3\u8F6C"})]})]}),N&&M&&(0,Y.jsx)(bs,{store:a,sourceNode:M}),e.targets.length?e.targets.map(P=>(0,Y.jsxs)("div",{"data-preview-key":P.key,className:`dshc-interaction-card ${n===P.key?"is-viewed":""}`,"aria-current":n===P.key?"location":void 0,children:[(0,Y.jsx)("button",{type:"button",className:"dshc-preview-link","aria-label":`\u5B9A\u4F4D ${P.name}`,onClick:()=>s(P,P.key)}),(0,Y.jsx)("span",{className:"dshc-interaction-thumb","aria-hidden":"true",children:(f?.has(P.key)||typeof IntersectionObserver>"u")&&(0,Y.jsx)(al,{target:P,store:a,previewNode:r})}),(0,Y.jsxs)("span",{className:"dshc-interaction-detail",children:[(0,Y.jsx)("strong",{children:P.name}),(0,Y.jsxs)("span",{className:"dshc-interaction-meta",children:[(0,Y.jsx)("span",{children:"\u754C\u9762\u8DF3\u8F6C"}),(0,Y.jsx)("span",{className:"dshc-interaction-type",children:"\u4EA4\u4E92"})]}),(0,Y.jsx)("span",{className:"dshc-interaction-event-heading",children:"\u89E6\u53D1\u4E8B\u4EF6"}),P.events.map(K=>(0,Y.jsx)("div",{className:"dshc-interaction-event-row",children:g===K.edgeId?(0,Y.jsx)("input",{className:"dshc-text-input",autoFocus:!0,value:A,onChange:W=>k(W.target.value),onBlur:()=>j(K.edgeId),onKeyDown:W=>{W.key==="Enter"?(W.preventDefault(),j(K.edgeId)):W.key==="Escape"&&(W.preventDefault(),y(null))}}):(0,Y.jsxs)(Y.Fragment,{children:[(0,Y.jsxs)("button",{type:"button",className:"dshc-interaction-event","aria-pressed":c===K.edgeId,onClick:()=>s(P,P.key,K.edgeId),children:[(0,Y.jsx)("span",{children:K.direction==="outgoing"?"\u8DF3\u8F6C\u81F3":"\u6765\u81EA"}),K.text]}),(0,Y.jsxs)("span",{className:"dshc-interaction-event-ops",children:[(0,Y.jsx)(ie,{icon:"pencil",size:11,title:"\u4FEE\u6539\u89E6\u53D1\u4E8B\u4EF6\u6587\u6848",onClick:W=>{W.stopPropagation(),y(K.edgeId),k(K.text)}}),(0,Y.jsx)(ie,{icon:"trash",size:11,danger:!0,title:"\u5220\u9664\u8FD9\u6761\u8DF3\u8F6C\u8FDE\u7EBF",onClick:W=>{W.stopPropagation(),a.deleteInteraction?.(K.edgeId)}})]})]})},K.edgeId+K.direction))]}),(0,Y.jsx)(Ne,{name:"chevronRight",size:13})]},P.key)):(0,Y.jsx)("p",{className:"dshc-interaction-empty",children:"\u6682\u65E0\u5176\u4ED6\u5173\u8054\u754C\u9762"})]}):(0,Y.jsxs)("div",{className:"dshc-interaction-intro",children:[(0,Y.jsxs)("div",{className:"dshc-interaction-intro-head",children:[(0,Y.jsx)(Ne,{name:"connect",size:16}),(0,Y.jsx)("strong",{children:"\u754C\u9762\u8DF3\u8F6C\u8FDE\u7EBF"})]}),(0,Y.jsx)("p",{className:"dshc-help",children:"\u7528\u5E26\u7BAD\u5934\u7684\u8FDE\u7EBF\u4E32\u8054\u6309\u94AE\u4E0E\u76EE\u6807\u754C\u9762\uFF0C\u76F4\u89C2\u6807\u660E\u300C\u70B9\u51FB\u54EA\u91CC \u2192 \u8DF3\u5230\u54EA\u4E00\u9875\u300D\uFF0C\u70B9\u51FB\u8FDE\u7EBF\u5361\u7247\u53EF\u5FEB\u901F\u8DF3\u8F6C\u6838\u5BF9\uFF0C\u4E5F\u65B9\u4FBF AI \u7406\u89E3\u6574\u4E2A\u9875\u9762\u6D41\u8F6C\u3002"}),(0,Y.jsxs)("div",{className:"dshc-interaction-tips",children:[(0,Y.jsx)("div",{children:"1. \u70B9\u4E0B\u65B9\u300C\u5F00\u59CB\u753B\u8FDE\u7EBF (K)\u300D\uFF0C\u76F4\u63A5\u4ECE\u4E00\u4E2A\u6309\u94AE\u6216\u754C\u9762\u62D6\u5411\u76EE\u6807\u754C\u9762\uFF1B"}),(0,Y.jsx)("div",{children:"2. \u6216\u9009\u4E2D\u4EFB\u610F\u5143\u7D20\uFF0C\u62D6\u5B83\u53F3\u4FA7\u7684\u84DD\u8272\u5C0F\u5706\u70B9\u8FDE\u5411\u76EE\u6807\u754C\u9762\u3002"})]}),(0,Y.jsx)(O,{small:!0,primary:!T,active:T,icon:"connect",onClick:()=>a.setTool(T?"pointer":"connect"),children:T?"\u9000\u51FA\u8FDE\u7EBF\u6A21\u5F0F (Esc)":"\u5F00\u59CB\u753B\u8FDE\u7EBF (K)"}),M&&(0,Y.jsx)(bs,{store:a,sourceNode:M}),i.length>0&&(0,Y.jsxs)("div",{className:"dshc-interaction-all-list",children:[(0,Y.jsxs)("div",{className:"dshc-panel-subtitle",children:["\u672C\u7A3F\u5168\u90E8\u8DF3\u8F6C\uFF08",i.length,"\uFF09"]}),i.map(P=>(0,Y.jsxs)("div",{className:"dshc-interaction-all-row",children:[(0,Y.jsxs)("button",{type:"button",className:"dshc-interaction-all-jump",title:`\u5B9A\u4F4D\uFF1A${P.fromName} \u2192 ${P.toName}`,onClick:()=>a.focusNode?.({page:P.fromPageId,node:P.from}),children:[(0,Y.jsx)("span",{className:"dshc-interaction-all-route",children:`${P.fromName} \u2192 ${P.toName}`}),(0,Y.jsx)("span",{className:"dshc-muted",children:P.event})]}),(0,Y.jsx)(ie,{icon:"trash",size:12,danger:!0,title:"\u5220\u9664\u8FDE\u7EBF",onClick:()=>a.deleteInteraction?.(P.id)})]},P.id))]})]})})}var te=qe(require("react"),1);var Le=qe(require("react"),1);var _=require("react/jsx-runtime");function ws({store:e,onClose:t}){let[n,i]=Le.useState("setup"),[a,r]=Le.useState(null),[s,c]=Le.useState(!1),[d,o]=Le.useState(null),[l,h]=Le.useState(null),[u,f]=Le.useState(""),[p,g]=Le.useState("readonly"),[y,A]=Le.useState(null),[k,N]=Le.useState(""),[I,M]=Le.useState("import"),[T,j]=Le.useState(null),[P,K]=Le.useState({}),[W,Q]=Le.useState({}),[B,ce]=Le.useState(null),[pe,L]=Le.useState("in-place"),[ae,Pe]=Le.useState(null),Z=Le.useCallback(async()=>{try{let z=await kr(e.sessionId,e.state.name);r(z),z.binding?.fileUrl&&!k&&N(z.binding.fileUrl),z.binding&&M("pull"),z.channels?.companionPlugin?.pairingCode&&A(z.channels.companionPlugin.pairingCode)}catch(z){o(z instanceof Error?z.message:String(z))}},[e.sessionId,e.state.name]);Le.useEffect(()=>{Z()},[Z]);let re=z=>{let se={};for(let xt of z.entries)se[xt.dshId]=xt.selected!==!1;K(se);let Be={};for(let xt of z.conflicts)Be[xt.conflictKey]="take-figma";Q(Be)},fe=async()=>{if(u.trim()){c(!0),o(null),h(null);try{let z=await Sr(u.trim(),p);f(""),h(`\u5DF2\u9A8C\u6D3B\u5E76\u5B89\u5168\u4FDD\u5B58\u81F3 ${z.source==="keychain"?"macOS Keychain":"\u672C\u5730 0600 \u51ED\u8BC1\u5E93"}\uFF08\u8D26\u53F7\uFF1A${z.account?.handle??z.account?.email??"Figma"}\uFF09`),await Z()}catch(z){o(z instanceof Error?z.message:String(z))}finally{c(!1)}}},me=async()=>{c(!0),o(null);try{await Rr(),h("\u5DF2\u6E05\u9664\u672C\u5730 Figma Token"),await Z()}catch(z){o(z instanceof Error?z.message:String(z))}finally{c(!1)}},Ye=async()=>{c(!0),o(null);try{let z=await $r(e.sessionId,e.state.name);A(z.pairingCode),await navigator.clipboard?.writeText(z.pairingCode).catch(()=>{}),h(`\u914D\u5BF9\u7801 ${z.pairingCode} \u5DF2\u751F\u6210\u5E76\u590D\u5236\u5230\u526A\u8D34\u677F\uFF0C\u8BF7\u5728 Figma Drafi Companion \u63D2\u4EF6\u5185\u7C98\u8D34\u8FDE\u63A5\u3002`),await Z()}catch(z){o(z instanceof Error?z.message:String(z))}finally{c(!1)}},ne=async()=>{if(k.trim()){c(!0),o(null),h(null);try{await e.flush?.();let z=await bi(e.sessionId,e.state.name,{url:k.trim(),mode:I,dryRun:!0,baseRevision:e.state.revision});z.plan?(j(z.plan),re(z.plan)):(j(null),h(`\u9884\u89C8\u5B8C\u6210\uFF1A\u5171 ${z.nodes??0} \u4E2A\u8282\u70B9\u3001${z.images??0} \u5F20\u56FE\u7247\uFF0C\u786E\u8BA4\u540E\u5373\u53EF\u5BFC\u5165\u3002`))}catch(z){o(z instanceof Error?z.message:String(z))}finally{c(!1)}}},U=async()=>{c(!0),o(null);try{await e.flush?.();let z=Object.entries(P).filter(([,se])=>se).map(([se])=>se);B?await vi(e.sessionId,e.state.name,B,{mode:I,dryRun:!1,baseRevision:e.state.revision}):await bi(e.sessionId,e.state.name,{url:k.trim(),mode:I,dryRun:!1,baseRevision:e.state.revision,selectedIds:T?z:void 0,resolutions:T?W:void 0}),await e.reload?.(),j(null),ce(null),h("\u5DF2\u6210\u529F\u540C\u6B65\u5230\u5F53\u524D\u753B\u5E03\uFF01"),await Z()}catch(z){o(z instanceof Error?z.message:String(z))}finally{c(!1)}},at=async z=>{ce(z),c(!0),o(null),h(null);try{await e.flush?.();let se=await vi(e.sessionId,e.state.name,z,{mode:I,dryRun:!0,baseRevision:e.state.revision});se.plan?(j(se.plan),re(se.plan)):h(`\u5DF2\u89E3\u6790 ${z.name}\uFF08${se.nodes??0} \u4E2A\u8282\u70B9\uFF0C${se.images??0} \u5F20\u56FE\u7247\uFF09\uFF0C\u70B9\u51FB\u300C\u786E\u8BA4\u5199\u5165\u300D\u5BFC\u5165\u3002`)}catch(se){o(se instanceof Error?se.message:String(se))}finally{c(!1)}},St=async z=>{c(!0),o(null),h(null);try{await e.flush?.();let se=await Ir(e.sessionId,e.state.name,{mode:pe,dryRun:!z});if(Pe(se.plan),z&&se.patch)if(se.queuedForPlugin)h(`Patch\uFF08${se.patch.operations.length} \u9879\u53D8\u66F4\uFF09\u5DF2\u63A8\u9001\u5230 Companion Plugin \u961F\u5217\uFF0C\u8BF7\u5728 Figma \u63D2\u4EF6\u4E2D\u70B9\u51FB\u300C\u62C9\u53D6\u5E76\u5E94\u7528 Drafi Patch\u300D\u3002`);else{let Be=new Blob([JSON.stringify(se.patch,null,2)],{type:"application/json"}),xt=URL.createObjectURL(Be),en=document.createElement("a");en.href=xt,en.download=`${e.state.name}.dshpatch.json`,en.click(),URL.revokeObjectURL(xt),h("\u672A\u68C0\u6D4B\u5230\u5728\u7EBF\u914D\u5BF9\u63D2\u4EF6\uFF0C\u5DF2\u4E0B\u8F7D\u79BB\u7EBF .dshpatch.json \u4F9B Figma Companion \u63D2\u4EF6\u76F4\u63A5\u5BFC\u5165\u3002")}}catch(se){o(se instanceof Error?se.message:String(se))}finally{c(!1)}},Ht=async()=>{c(!0),o(null);try{let z=await Nr(e.sessionId,e.state.name,k.trim()||void 0);await e.reload?.(),h(`\u5DF2\u540C\u6B65 ${z.totalComments??0} \u6761 Figma \u8BC4\u8BBA\uFF08\u65B0\u589E ${z.imported??0}\u3001\u66F4\u65B0 ${z.updated??0}\uFF09\u3002`)}catch(z){o(z instanceof Error?z.message:String(z))}finally{c(!1)}},Ot=async()=>{c(!0),o(null);try{await e.flush?.();let z=await Cr(e.sessionId,e.state.name),se=URL.createObjectURL(z),Be=document.createElement("a");Be.href=se,Be.download=`${e.state.name}.dshfig`,Be.click(),URL.revokeObjectURL(se),h(`\u5DF2\u5BFC\u51FA\u4FBF\u643A\u65E0\u635F\u5305 ${e.state.name}.dshfig`)}catch(z){o(z instanceof Error?z.message:String(z))}finally{c(!1)}},xn=async z=>{c(!0),o(null);try{let se=await Mr(e.sessionId,e.state.name,z);await e.reload?.(),h(`\u5DF2\u5BFC\u5165 .dshfig\uFF08\u6062\u590D ${se.assetsRestored??0} \u4E2A\u8D44\u6E90${se.hasSidecar?" + Figma \u7ED1\u5B9A":""}\uFF09`),await Z()}catch(se){o(se instanceof Error?se.message:String(se))}finally{c(!1)}};return(0,_.jsxs)(un,{title:"Figma \u751F\u6001\u540C\u6B65\u4E0E\u5FEB\u901F\u914D\u7F6E",width:540,onClose:t,children:[(0,_.jsxs)("div",{className:"dshc-figma-tabs",children:[(0,_.jsx)(O,{small:!0,active:n==="setup",onClick:()=>i("setup"),children:"\u5FEB\u901F\u914D\u7F6E"}),(0,_.jsx)(O,{small:!0,active:n==="pull",onClick:()=>i("pull"),children:"\u5BFC\u5165 / \u62C9\u53D6 Diff"}),(0,_.jsx)(O,{small:!0,active:n==="push",onClick:()=>i("push"),children:"\u63A8\u9001 / \u8BC4\u8BBA / .dshfig"})]}),d&&(0,_.jsx)("div",{className:"dshc-figma-banner is-error",children:d}),l&&(0,_.jsx)("div",{className:"dshc-figma-banner is-ok",children:l}),n==="setup"&&(0,_.jsxs)("div",{className:"dshc-figma-section",children:[(0,_.jsxs)("div",{className:"dshc-figma-card",children:[(0,_.jsx)("strong",{children:"L0 \u514D\u914D\u7F6E\uFF08\u7ACB\u5373\u53EF\u7528\uFF09"}),(0,_.jsx)("p",{className:"dshc-muted",children:"\u5728 Figma \u4E2D \u2318C \u590D\u5236\u56FE\u5C42\uFF0C\u56DE\u5230 Drafi \u753B\u5E03\u76F4\u63A5 \u2318V \u7C98\u8D34\uFF08\u81EA\u52A8\u89E3\u7801\u4E0E\u56FE\u7247\u843D\u76D8\uFF09\u3002"})]}),(0,_.jsxs)("div",{className:"dshc-figma-card",children:[(0,_.jsx)("strong",{children:"L1 Companion Plugin \u672C\u5730\u76F4\u8FDE\uFF08\u514D Token\uFF09"}),(0,_.jsx)("p",{className:"dshc-muted",children:"\u5728 Figma Desktop \u2192 Plugins \u2192 Development \u2192 Import plugin from manifest \u5BFC\u5165\u63D2\u4EF6\uFF0C\u4F7F\u7528\u4E0B\u65B9\u914D\u5BF9\u7801\u5B9E\u73B0\u539F\u4F4D\u53CC\u5411\u540C\u6B65\u3002"}),a?.channels?.companionPlugin?.manifestPath&&(0,_.jsx)("code",{className:"dshc-figma-code",children:a.channels.companionPlugin.manifestPath}),(0,_.jsx)("div",{className:"dshc-figma-row",children:(0,_.jsx)(O,{small:!0,primary:!0,disabled:s,onClick:Ye,children:y?`\u91CD\u65B0\u751F\u6210\u914D\u5BF9\u7801\uFF08\u5F53\u524D\uFF1A${y}\uFF09`:"\u751F\u6210\u4E00\u6B21\u6027\u914D\u5BF9\u7801"})})]}),(0,_.jsxs)("div",{className:"dshc-figma-card",children:[(0,_.jsx)("strong",{children:"L2 Figma REST Token\uFF08URL \u5BFC\u5165 & \u8BC4\u8BBA\u8054\u52A8\uFF09"}),a?.auth?.configured&&a.auth.valid?(0,_.jsxs)("div",{className:"dshc-figma-auth-ok",children:[(0,_.jsxs)("span",{children:["\u5DF2\u8FDE\u63A5\uFF1A",a.auth.account?.handle??a.auth.account?.email??"Figma","\uFF08",a.auth.source,"\uFF0C",a.auth.daysUntilExpiry!=null?`\u5269\u4F59\u7EA6 ${a.auth.daysUntilExpiry} \u5929`:"\u6709\u6548","\uFF09"]}),(0,_.jsx)(O,{small:!0,disabled:s,onClick:me,children:"\u6E05\u9664 Token"})]}):(0,_.jsxs)("p",{className:"dshc-muted",children:["\u4EC5\u5728\u672C\u5730\u5BC6\u7801\u6846\u4E2D\u7C98\u8D34\uFF0C\u7EDD\u4E0D\u7ECF\u8FC7\u804A\u5929\u8BB0\u5F55\u3002\u524D\u5F80"," ",(0,_.jsx)("a",{href:"https://www.figma.com/settings",target:"_blank",rel:"noreferrer",children:"figma.com/settings"})," ","\u2192 Security \u2192 Personal access tokens \u751F\u6210\uFF08\u52FE Current user / File content / Comments\uFF09\u3002"]}),(0,_.jsxs)("div",{className:"dshc-figma-row",children:[(0,_.jsx)("input",{type:"password",className:"dshc-input",placeholder:"\u7C98\u8D34 figd_... Token\uFF08\u4EC5\u5B58\u7CFB\u7EDF Keychain\uFF09",value:u,onChange:z=>f(z.target.value),autoComplete:"off"}),(0,_.jsxs)("select",{className:"dshc-input",style:{width:120},value:p,onChange:z=>g(z.target.value),children:[(0,_.jsx)("option",{value:"readonly",children:"\u53EA\u8BFB"}),(0,_.jsx)("option",{value:"comments-write",children:"\u542B\u8BC4\u8BBA\u56DE\u5199"})]}),(0,_.jsx)(O,{small:!0,primary:!0,disabled:s||!u.trim(),onClick:fe,children:"\u9A8C\u8BC1\u5E76\u4FDD\u5B58"})]})]})]}),n==="pull"&&(0,_.jsxs)("div",{className:"dshc-figma-section",children:[(0,_.jsxs)("div",{className:"dshc-figma-row",children:[(0,_.jsx)("input",{className:"dshc-input",placeholder:"\u7C98\u8D34 Figma \u6587\u4EF6\u6216\u753B\u677F URL\uFF08\u652F\u6301 ?node-id=...\uFF09",value:k,onChange:z=>N(z.target.value)}),(0,_.jsxs)("select",{className:"dshc-input",style:{width:110},value:I,onChange:z=>M(z.target.value),children:[(0,_.jsx)("option",{value:"import",children:"\u51B7\u5BFC\u5165"}),(0,_.jsx)("option",{value:"pull",children:"\u4E09\u65B9 Pull"})]}),(0,_.jsx)(O,{small:!0,primary:!0,disabled:s||!k.trim(),onClick:ne,children:"\u9884\u89C8 Diff"})]}),(0,_.jsxs)("div",{className:"dshc-figma-row",children:[(0,_.jsxs)("label",{className:"dshc-btn is-small",children:["\u9009\u62E9\u672C\u5730 .fig \u6587\u4EF6",(0,_.jsx)("input",{type:"file",accept:".fig",style:{display:"none"},onChange:z=>{let se=z.target.files?.[0];se&&at(se),z.target.value=""}})]}),(0,_.jsx)(O,{small:!0,primary:!0,disabled:s||!k.trim()&&!B,onClick:U,children:"\u786E\u8BA4\u5199\u5165\u753B\u5E03"})]}),T&&(0,_.jsxs)("div",{className:"dshc-figma-diff",children:[(0,_.jsxs)("div",{className:"dshc-muted",children:["+",T.summary.added," \u65B0\u589E \xB7 ~",T.summary.modified," \u4FEE\u6539 \xB7 \u21C4",T.summary.moved," \u79FB\u52A8 \xB7 -",T.summary.deleted," \u5220\u9664 \xB7 \u26A0",T.summary.conflicts," \u51B2\u7A81"]}),T.entries.map(z=>(0,_.jsxs)("label",{className:"dshc-figma-diff-row",children:[(0,_.jsx)("input",{type:"checkbox",checked:P[z.dshId]!==!1,onChange:se=>K(Be=>({...Be,[z.dshId]:se.target.checked}))}),(0,_.jsxs)("span",{children:["[",z.kind,"] ",z.nodeName]}),(0,_.jsx)("span",{className:"dshc-muted",children:z.fields.map(se=>se.field).join(", ")})]},z.dshId)),T.conflicts.map(z=>(0,_.jsxs)("div",{className:"dshc-figma-diff-row is-conflict",children:[(0,_.jsxs)("span",{children:["\u51B2\u7A81\uFF1A",z.nodeName," (",z.field,")"]}),(0,_.jsxs)("select",{value:W[z.conflictKey]??"take-figma",onChange:se=>Q(Be=>({...Be,[z.conflictKey]:se.target.value})),children:[(0,_.jsx)("option",{value:"take-figma",children:"\u91C7\u7528 Figma"}),(0,_.jsx)("option",{value:"keep-drafi",children:"\u4FDD\u7559 Drafi"}),(0,_.jsx)("option",{value:"skip",children:"\u8DF3\u8FC7"})]})]},z.conflictKey))]})]}),n==="push"&&(0,_.jsxs)("div",{className:"dshc-figma-section",children:[(0,_.jsxs)("div",{className:"dshc-figma-card",children:[(0,_.jsx)("strong",{children:"\u63A8\u56DE Figma\uFF08\u7C7B Git Diff \u5BA1\u67E5\uFF09"}),(0,_.jsxs)("div",{className:"dshc-figma-row",children:[(0,_.jsxs)("select",{className:"dshc-input",value:pe,onChange:z=>L(z.target.value),children:[(0,_.jsx)("option",{value:"in-place",children:"\u539F\u4F4D\u66F4\u65B0\uFF08\u4FDD\u7559\u539F URL / \u8BC4\u8BBA / \u900F\u4F20\u5C5E\u6027\uFF09"}),(0,_.jsx)("option",{value:"proposal-frame",children:"\u65B0\u5EFA [Drafi Diff] \u5BF9\u6BD4\u753B\u677F"})]}),(0,_.jsx)(O,{small:!0,disabled:s,onClick:()=>St(!1),children:"\u751F\u6210 Diff"}),(0,_.jsx)(O,{small:!0,primary:!0,disabled:s,onClick:()=>St(!0),children:"\u63A8\u9001 Patch"})]}),ae&&(0,_.jsxs)("div",{className:"dshc-muted",style:{marginTop:6},children:["\u5F85\u63A8\u9001\uFF1A+",ae.summary.added," \u65B0\u589E \xB7 ~",ae.summary.modified," \u4FEE\u6539 \xB7 \u21C4",ae.summary.moved," \u79FB\u52A8 \xB7 -",ae.summary.deleted," \u5220\u9664"]})]}),(0,_.jsxs)("div",{className:"dshc-figma-card",children:[(0,_.jsx)("strong",{children:"\u56E2\u961F\u8BC4\u8BBA\u8054\u52A8"}),(0,_.jsx)("div",{className:"dshc-figma-row",children:(0,_.jsx)(O,{small:!0,disabled:s,onClick:Ht,children:"\u62C9\u53D6 Figma \u8BC4\u8BBA\u5230\u753B\u5E03"})})]}),(0,_.jsxs)("div",{className:"dshc-figma-card",children:[(0,_.jsx)("strong",{children:"\u4FBF\u643A\u65E0\u635F\u5305\uFF08.dshfig\uFF09"}),(0,_.jsxs)("div",{className:"dshc-figma-row",children:[(0,_.jsx)(O,{small:!0,disabled:s,onClick:Ot,children:"\u5BFC\u51FA .dshfig\uFF08\u542B\u7ED1\u5B9A\u4E0E\u539F\u56FE\uFF09"}),(0,_.jsxs)("label",{className:"dshc-btn is-small",children:["\u5BFC\u5165 .dshfig",(0,_.jsx)("input",{type:"file",accept:".dshfig",style:{display:"none"},onChange:z=>{let se=z.target.files?.[0];se&&xn(se),z.target.value=""}})]})]})]})]})]})}var Jt=require("react/jsx-runtime");function Zi({store:e}){let t=te.useSyncExternalStore(e.subscribeViewport,e.getZoomPercentage);return(0,Jt.jsxs)(Jt.Fragment,{children:[t,"%"]})}var sl=[["pointer","v","\u79FB\u52A8/\u9009\u62E9 (V)"],["frame","f","Frame (F)"],["rect","r","\u77E9\u5F62 (R)"],["ellipse","o","\u692D\u5706 (O)"],["line","l","\u76F4\u7EBF (L)"],["connect","k","\u4EA4\u4E92\u8FDE\u7EBF (K) \xB7 \u8FDE\u63A5\u6309\u94AE\u4E0E\u76EE\u6807\u754C\u9762\uFF0C\u6807\u660E\u8DF3\u8F6C\u6D41\u7A0B"],["text","t","\u6587\u672C (T)"],["image","i","\u56FE\u7247 (I)"],["hand","h","\u6293\u624B (H)"],["comment","c","\u8BC4\u8BBA (C)"]];function ks({store:e,onNewDoc:t,onRenameDoc:n,onDeleteDoc:i,onNeedName:a,inspectorOpen:r,onToggleInspector:s,connections:c}){let d=e.state,[o,l]=te.useState(!1),[h,u]=te.useState(!1),[f,p]=te.useState(!1),g=te.useRef(null),y=te.useRef(null),A=te.useRef(null),k=te.useRef(null);te.useEffect(()=>{if(!f)return;let B=pe=>{g.current?.contains(pe.target)||p(!1)},ce=pe=>{pe.key==="Escape"&&p(!1)};return window.addEventListener("pointerdown",B,!0),window.addEventListener("keydown",ce,!0),()=>{window.removeEventListener("pointerdown",B,!0),window.removeEventListener("keydown",ce,!0)}},[f]);let N=B=>B.title&&B.title!==B.name?`${B.title} \xB7 ${B.name}`:B.name,I=d.docs.some(B=>B.name===d.name)?d.docs:[{name:d.name,title:d.name},...d.docs],M=I.find(B=>B.name===d.name)??I[0],T=M?N(M):d.name,P=d.scene?.roots??[],K=d.selection.length,W=()=>{e.imageInsertPoint=null,e.requestImagePick?.()},Q=B=>{if(B==="image"){W();return}e.setTool(B)};return te.createElement("div",{className:"dshc-topbar"},te.createElement("div",{className:"dshc-topbar-row dshc-topbar-docs"},te.createElement("div",{className:"dshc-doc-picker",ref:g},te.createElement("button",{type:"button",className:"dshc-doc-trigger",title:"\u5207\u6362 / \u91CD\u547D\u540D\u8BBE\u8BA1\u7A3F",onClick:()=>p(B=>!B)},te.createElement("span",{className:"dshc-doc-trigger-label"},T),te.createElement(Ne,{name:"chevronDown",size:12})),f&&te.createElement("div",{className:"dshc-doc-menu"},I.map(B=>te.createElement("div",{key:B.name,className:`dshc-doc-row ${B.name===d.name?"is-active":""}`},te.createElement("button",{type:"button",className:"dshc-doc-open",onClick:()=>{p(!1),e.loadDoc(B.name)}},te.createElement(Ne,{name:"check",size:12,className:B.name===d.name?"":"dshc-doc-check-hidden"}),te.createElement("span",{className:"dshc-doc-label"},N(B))),te.createElement(ie,{icon:"pencil",size:12,title:`\u91CD\u547D\u540D ${B.name}`,onClick:()=>{p(!1),n?.(B.name)}}))),I.length===0&&te.createElement("div",{className:"dshc-doc-empty"},"\u8FD8\u6CA1\u6709\u8BBE\u8BA1\u7A3F"))),te.createElement(ie,{icon:"plus",title:"\u65B0\u5EFA\u8BBE\u8BA1\u7A3F",onClick:t}),te.createElement(ie,{icon:"path",title:"\u5BFC\u5165 SVG path",onClick:()=>A.current?.click()}),te.createElement(ie,{icon:"pencil",title:"\u91CD\u547D\u540D\u8BBE\u8BA1\u7A3F",onClick:()=>n?.(d.name)}),te.createElement(ie,{icon:"trash",title:"\u5220\u9664\u8BBE\u8BA1\u7A3F",onClick:()=>i?.()}),te.createElement(ie,{icon:"download",title:"\u5BFC\u51FA SVG / PNG",onClick:()=>l(!o)}),te.createElement(O,{small:!0,icon:"sparkle",className:"dshc-figma-btn",title:"Figma \u5BFC\u5165 / \u540C\u6B65\u4E0E\u5FEB\u901F\u914D\u7F6E",active:h,onClick:()=>u(!0)},"Figma"),te.createElement("span",{className:"dshc-spacer"}),te.createElement(ie,{icon:"undo",title:"\u64A4\u9500 (\u2318Z)",onClick:()=>e.undo(),disabled:!e.history.canUndo()}),te.createElement(ie,{icon:"redo",title:"\u91CD\u505A (\u21E7\u2318Z)",onClick:()=>e.redo(),disabled:!e.history.canRedo()})),te.createElement("div",{className:"dshc-topbar-row dshc-topbar-tools"},te.createElement("div",{className:"dshc-tools-scroll"},...sl.map(([B,ce,pe])=>te.createElement(ie,{key:B,icon:B,title:pe,active:d.tool===B,onClick:()=>Q(B)})),te.createElement("span",{className:"dshc-divider"}),te.createElement(ie,{icon:"comment",title:"\u663E\u793A/\u9690\u85CF\u8BC4\u8BBA",active:d.showComments,onClick:()=>{d.showComments=!d.showComments,e.emit()}}),te.createElement(ie,{icon:"zoomOut",title:"\u7F29\u5C0F",onClick:()=>{let B=e.viewportSize();e.zoomAt({x:B.width/2,y:B.height/2},1/1.2)}}),te.createElement("button",{type:"button",className:"dshc-zoom-label",title:"\u91CD\u7F6E\u5230 100%",onClick:()=>e.setViewport({...e.state.viewport,zoom:1})},(0,Jt.jsx)(Zi,{store:e})),te.createElement(ie,{icon:"zoomIn",title:"\u653E\u5927",onClick:()=>{let B=e.viewportSize();e.zoomAt({x:B.width/2,y:B.height/2},1.2)}}),te.createElement(ie,{icon:"fit",title:K?"\u9002\u5E94\u9009\u533A (2)":"\u9002\u5E94\u753B\u5E03 (1)",onClick:()=>K?e.zoomToSelection():e.zoomToFit()}),c?.hasConnections&&te.createElement(O,{small:!0,icon:"connect",active:c.focused,disabled:!c.enabled&&!c.focused,title:c.focused?"\u9000\u51FA\u805A\u7126\uFF0C\u6062\u590D\u663E\u793A\u5168\u90E8\u754C\u9762\u548C\u8FDE\u7EBF":c.enabled?"\u53EA\u663E\u793A\u4E0E\u5F53\u524D\u9009\u4E2D\u5143\u7D20\u76F8\u5173\u7684\u8DF3\u8F6C\u8FDE\u7EBF\uFF0C\u6DE1\u5316\u65E0\u5173\u754C\u9762":"\u5148\u9009\u4E2D\u5E26\u4EA4\u4E92\u8FDE\u7EBF\u7684\u5143\u7D20\u6216\u754C\u9762\u540E\u518D\u805A\u7126",onClick:c.toggle},c.focused?"\u9000\u51FA\u805A\u7126":"\u805A\u7126\u8FDE\u7EBF")),te.createElement("span",{className:"dshc-topbar-end"},te.createElement("span",{className:"dshc-divider"}),te.createElement(ie,{icon:"panelRight",title:r?"\u6536\u8D77\u5C5E\u6027\u9762\u677F":"\u5C55\u5F00\u5C5E\u6027\u9762\u677F",active:!!r,onClick:s}))),o&&te.createElement(un,{title:K?`\u5BFC\u51FA\u9009\u533A\uFF08${K} \u4E2A\u56FE\u5C42\uFF09`:"\u5BFC\u51FA\u5F53\u524D\u753B\u5E03",width:420,onClose:()=>l(!1)},te.createElement("div",{className:"dshc-export-section"},"\u56FE\u7247"),te.createElement("div",{className:"dshc-export-grid"},te.createElement(O,{icon:"download",onClick:()=>{l(!1),e.exportSelection("svg")}},"SVG \u77E2\u91CF"),te.createElement(O,{icon:"download",onClick:()=>{l(!1),e.exportSelection("png")}},"PNG\uFF082x\uFF09")),te.createElement("div",{className:"dshc-export-section"},"\u5DE5\u7A0B\u6587\u4EF6"),te.createElement(O,{icon:"download",onClick:()=>{l(!1),e.exportPack()}},"\u5BFC\u51FA Drafi \u5305\uFF08\u542B\u7D20\u6750\uFF0C\u53EF\u518D\u5BFC\u5165\uFF09"),te.createElement(O,{icon:"upload",onClick:()=>{l(!1),k.current?.click()}},"\u5BFC\u5165 Drafi \u5305"),te.createElement("div",{className:"dshc-export-section"},"Figma \u751F\u6001"),te.createElement(O,{icon:"sparkle",onClick:()=>{l(!1),u(!0)}},"Figma \u540C\u6B65\u4E0E\u5FEB\u901F\u914D\u7F6E\u2026")),h&&te.createElement(ws,{store:e,onClose:()=>u(!1)}),te.createElement("input",{ref:B=>{y.current=B,e.imagePicker=B},type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",style:{display:"none"},onChange:B=>{let ce=B.target.files?.[0];ce&&e.uploadImageFile(ce,e.imageInsertPoint??void 0),e.imageInsertPoint=null,B.target.value=""}}),te.createElement("input",{ref:k,type:"file",accept:".json,application/json",style:{display:"none"},onChange:async B=>{let ce=B.target.files?.[0];ce&&await e.importPackFile(ce),B.target.value=""}}),te.createElement("input",{ref:A,type:"file",accept:".svg,image/svg+xml",style:{display:"none"},onChange:async B=>{let ce=B.target.files?.[0];ce&&e.importSvg(await ce.text()),B.target.value=""}}))}var kt=qe(require("react"),1);var Pt=qe(require("react"),1);var Ke=require("react/jsx-runtime");function Ss({store:e}){let t=e.state.doc?.pages??[],n=e.state.pageId??t[0]?.id??"",i=t.find(f=>f.id===n)??t[0],[a,r]=Pt.useState(!1),[s,c]=Pt.useState(""),d=Pt.useRef(null);if(Pt.useEffect(()=>{r(!1)},[n]),Pt.useEffect(()=>{a&&(d.current?.focus(),d.current?.select())},[a]),t.length===0)return null;let o=()=>{i&&(c(i.name||""),r(!0))},l=()=>{if(r(!1),!i)return;let f=s.trim();f&&f!==i.name&&e.renamePage?.(i.id,f)},h=()=>{i&&e.duplicatePage?.(i.id)},u=()=>{!i||t.length<=1||(i.children?.length??0)>0&&typeof window<"u"&&!window.confirm(`\u5220\u9664\u753B\u5E03\u300C${i.name||i.id}\u300D\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`)||e.deletePage?.(i.id)};return(0,Ke.jsx)("div",{className:"dshc-page-switcher","aria-label":"\u753B\u5E03\u5207\u6362",children:a?(0,Ke.jsxs)(Ke.Fragment,{children:[(0,Ke.jsx)("input",{ref:d,className:"dshc-page-input","aria-label":"\u753B\u5E03\u540D\u79F0",value:s,maxLength:120,onChange:f=>c(f.target.value),onBlur:l,onKeyDown:f=>{f.key==="Enter"?(f.preventDefault(),l()):f.key==="Escape"&&(f.preventDefault(),r(!1))}}),(0,Ke.jsx)(ie,{icon:"check",title:"\u786E\u8BA4\u91CD\u547D\u540D",onMouseDown:f=>f.preventDefault(),onClick:l})]}):(0,Ke.jsxs)(Ke.Fragment,{children:[(0,Ke.jsx)("select",{className:"dshc-page-select","aria-label":"\u5F53\u524D\u753B\u5E03",value:n,onChange:f=>e.setPage(f.target.value),children:t.map(f=>(0,Ke.jsx)("option",{value:f.id,children:f.name||f.id},f.id))}),(0,Ke.jsx)(ie,{icon:"pencil",title:"\u91CD\u547D\u540D\u753B\u5E03",onClick:o}),(0,Ke.jsx)(ie,{icon:"copy",title:"\u590D\u5236\u5F53\u524D\u753B\u5E03",onClick:h}),(0,Ke.jsx)(ie,{icon:"plus",title:"\u65B0\u5EFA\u753B\u5E03",onClick:()=>e.addPage?.(`\u753B\u5E03 ${t.length+1}`)}),(0,Ke.jsx)(ie,{icon:"trash",danger:!0,title:t.length<=1?"\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u753B\u5E03":"\u5220\u9664\u5F53\u524D\u753B\u5E03",disabled:t.length<=1,onClick:u})]})})}var Ee=require("react/jsx-runtime"),Ui="application/x-dshc-layer",ol={frame:"frame",group:"group",text:"text",instance:"component",ellipse:"ellipse",line:"line",path:"path",rect:"rect"};function $s(e){return e.type==="frame"||e.type==="group"}function Es(e,t){return(e.children??[]).some(n=>t.has(n.key)||Es(n,t))}function cl(e,t){let n=e.parent??null;for(;n;){if(n.sourceId===t)return!0;n=n.parent??null}return!1}function Rs(e,t,n){let i=$s(t);if(n)return i?"inside":null;let a=e.currentTarget.getBoundingClientRect(),r=a.height>0?(e.clientY-a.top)/a.height:.5;return i&&r>=.25&&r<=.75?"inside":r<.5?"before":"after"}function Is({node:e,depth:t,parentId:n,siblings:i,realIndex:a,store:r,dragSourceId:s,dropTarget:c,onDragStartLayer:d,onDragEndLayer:o,onDropTargetChange:l,onRename:h,onRowContextMenu:u}){let f=r.state.selection.includes(e.key),p=r.state.primaryKey===e.key,[g,y]=kt.useState(!1),A=e.children??[],k=A.length>0;kt.useEffect(()=>{let L=new Set(r.state.selection);(L.has(e.key)||Es(e,L))&&y(!0)},[r.state.selection,e]);let N=!!(r.state.componentMode&&t===0),I=!!(e.editable&&!e.instanceId&&!N),M=e.visible===!1,T=!!e.locked,j=c?.key===e.key?c.position:null,P=ol[e.type]??"rect",K=L=>!(!e.editable||L&&(L===e.sourceId||cl(e,L))||N&&!$s(e)),W=L=>{if(L.target?.closest?.("button")){L.preventDefault();return}L.dataTransfer.effectAllowed="move",L.dataTransfer.setData(Ui,e.sourceId),L.dataTransfer.setData("text/plain",e.name||e.type),d(e.sourceId)},Q=L=>{if(!(!!s||Array.from(L.dataTransfer.types??[]).includes(Ui)))return;if(!K(s)){j&&l(null);return}let Pe=Rs(L,e,N);if(!Pe){j&&l(null);return}L.preventDefault(),L.dataTransfer.dropEffect="move",(c?.key!==e.key||c.position!==Pe)&&l({key:e.key,position:Pe})},B=L=>{j&&!L.currentTarget.contains(L.relatedTarget)&&l(null)},ce=L=>{let ae=L.dataTransfer.getData(Ui)||s;if(l(null),o(),!ae||!K(ae))return;let Z=L.currentTarget.getBoundingClientRect().height>0?Rs(L,e,N):j;if(!Z)return;if(L.preventDefault(),L.stopPropagation(),Z==="inside"){r.moveLayer?.(ae,e.sourceId,A.length)&&y(!0);return}let re=Z==="before"?a+1:a,fe=i.findIndex(me=>me.sourceId===ae);fe!==-1&&(fe<re&&(re-=1),re===fe)||r.moveLayer?.(ae,n,re)},pe=["dshc-layer-row",f?"is-selected":"",p?"is-primary":"",M?"is-hidden":"",T?"is-locked":"",j==="before"?"is-drop-before":"",j==="after"?"is-drop-after":"",j==="inside"?"is-drop-inside":""].filter(Boolean).join(" ");return(0,Ee.jsxs)(Ee.Fragment,{children:[(0,Ee.jsxs)("div",{className:pe,style:{paddingLeft:6+t*14},draggable:I||void 0,onDragStart:I?W:void 0,onDragEnd:I?o:void 0,onDragOver:Q,onDragLeave:B,onDrop:ce,onClick:L=>{L.shiftKey?r.toggleSelection(e.key):r.setSelection([e.key])},onDoubleClick:()=>h?.(e),onContextMenu:L=>{L.preventDefault(),L.stopPropagation(),f||r.setSelection([e.key]),u?.(L,e)},title:`${e.name||e.type} \xB7 ${e.type}`,children:[k?(0,Ee.jsx)("button",{type:"button",className:"dshc-layer-caret",onClick:L=>{L.stopPropagation(),y(!g)},children:(0,Ee.jsx)(Ne,{name:g?"chevronDown":"chevronRight",size:11})}):(0,Ee.jsx)("span",{className:"dshc-layer-caret"}),(0,Ee.jsx)(Ne,{name:P,size:14}),(0,Ee.jsx)("span",{className:"dshc-layer-name",children:e.name||e.type}),(M||T)&&(0,Ee.jsxs)("span",{className:"dshc-layer-status",children:[M?(0,Ee.jsx)(Ne,{name:"eyeOff",size:12}):null,T?(0,Ee.jsx)(Ne,{name:"lock",size:12}):null]}),e.editable&&(0,Ee.jsxs)("span",{className:"dshc-layer-actions",children:[(0,Ee.jsx)(ie,{icon:M?"eyeOff":"eye",title:M?"\u663E\u793A":"\u9690\u85CF",size:14,onClick:L=>{L.stopPropagation(),r.setVisibility(e.sourceId,M)}}),(0,Ee.jsx)(ie,{icon:T?"lock":"unlock",title:T?"\u89E3\u9501":"\u9501\u5B9A",size:14,onClick:L=>{L.stopPropagation(),r.setLocked(e.sourceId,!T)}}),(0,Ee.jsx)(ie,{icon:"front",title:"\u4E0A\u79FB",size:14,onClick:L=>{L.stopPropagation(),r.setSelection([e.key]),r.reorder("forward")}}),(0,Ee.jsx)(ie,{icon:"back",title:"\u4E0B\u79FB",size:14,onClick:L=>{L.stopPropagation(),r.setSelection([e.key]),r.reorder("backward")}})]})]}),k&&g?A.map((L,ae)=>({child:L,childIndex:ae})).reverse().map(({child:L,childIndex:ae})=>(0,Ee.jsx)(Is,{node:L,depth:t+1,parentId:e.sourceId,siblings:A,realIndex:ae,store:r,dragSourceId:s,dropTarget:c,onDragStartLayer:d,onDragEndLayer:o,onDropTargetChange:l,onRename:h,onRowContextMenu:u},L.key)):null]})}function Ns({store:e,onRename:t,onRowContextMenu:n}){let a=e.state.scene?.roots??[],[r,s]=kt.useState(null),[c,d]=kt.useState(null),o=kt.useCallback(h=>{s(h),d(null)},[]),l=kt.useCallback(()=>{s(null),d(null)},[]);return(0,Ee.jsxs)("div",{className:"dshc-layer-panel",children:[(0,Ee.jsx)(Ss,{store:e}),(0,Ee.jsxs)("div",{className:"dshc-panel-title",children:[(0,Ee.jsx)("span",{children:"\u56FE\u5C42"}),(0,Ee.jsx)("span",{className:"dshc-panel-count",children:a.length?`${Cs(a)}`:""})]}),a.length?a.map((h,u)=>({node:h,realIndex:u})).reverse().map(({node:h,realIndex:u})=>(0,Ee.jsx)(Is,{node:h,depth:0,parentId:null,siblings:a,realIndex:u,store:e,dragSourceId:r,dropTarget:c,onDragStartLayer:o,onDragEndLayer:l,onDropTargetChange:d,onRename:t,onRowContextMenu:n},h.key)):(0,Ee.jsx)("div",{className:"dshc-panel-empty",children:"\u753B\u5E03\u4E3A\u7A7A"})]})}function Cs(e){let t=0;for(let n of e)t+=1,n.children?.length&&(t+=Cs(n.children));return t}var m=qe(require("react"),1);var ll=["system-ui","Inter","Helvetica Neue","Arial","Georgia","Times New Roman","Menlo","PingFang SC","Microsoft YaHei"],dl=new Set(["opacity","rotation","fills","strokes","effects","cornerRadius","font","align","autoHeight","clip","layout","layoutSizing","fillStyleId","textStyleId","effectStyleId"]);function hl(e){return e.primaryNode()}function le(e,t,n){if(!t)return;if(t.instanceId&&t.instanceId!==t.key){let a={};"text"in n&&(a.text=n.text),"fills"in n&&(a.fills=n.fills),"visible"in n&&(a.visible=n.visible),Object.keys(a).length&&e.setOverride(t.instanceId,t.sourceId,a);return}let i=Object.keys(n);if((e.state?.selection?.length??0)>1&&i.length>0&&i.every(a=>dl.has(a))){e.updateSelected(n);return}e.updateNode(t.sourceId,n)}function Un({children:e,className:t=""}){return m.createElement("div",{className:`dshc-row ${t}`},e)}function ta({store:e,onNameDialog:t}){let n=hl(e),i=e.state,a=i.doc;if(!n){let l=a?.pages?.find(u=>u.id===i.pageId)??a?.pages?.[0]??null,h=l?Ps(l.children??[]):0;return m.createElement("div",{className:"dshc-inspector"},m.createElement(je,{title:"\u753B\u5E03"},l&&m.createElement("div",{className:"dshc-stat-line"},`${l.name||"\u753B\u5E03"} \xB7 ${h} \u4E2A\u56FE\u5C42`),l&&m.createElement(oe,{label:"\u753B\u5E03\u80CC\u666F",wide:!0},m.createElement(Tt,{value:l.background??"#F5F5F5",onChange:u=>e.setPageBackground?.(u)})),m.createElement(O,{icon:"sparkle",onClick:()=>e.insertPrompt()},"\u8BA9 AI \u751F\u6210 UI"),m.createElement(O,{icon:"fit",onClick:()=>e.zoomToFit()},"\u9002\u5E94\u753B\u5E03")))}let r=n.instanceId&&n.instanceId!==n.key,s=r,c=n.editable&&!s,d=i.selection?.length??0,o=d>1?`\u6279\u91CF \xB7 ${d}`:null;return r?m.createElement(ul,{store:e,node:n}):m.createElement("div",{className:"dshc-inspector","data-node":n.sourceId},m.createElement("div",{className:"dshc-inspector-head"},m.createElement(Ne,{name:n.type==="frame"?"frame":n.type==="text"?"text":n.type==="group"?"group":n.type==="instance"?"component":n.type==="ellipse"?"ellipse":n.type==="path"?"path":"rect",size:14}),m.createElement("input",{className:"dshc-name-input",defaultValue:n.name??"",key:`${n.sourceId}-name-${n.name}`,disabled:!c,onBlur:l=>{let h=l.target.value.trim();h&&h!==n.name&&e.renameNode(n.sourceId,h)},onKeyDown:l=>{l.key==="Enter"&&l.currentTarget.blur()}}),d>1&&m.createElement("span",{className:"dshc-type-chip"},`\xD7${d}`),m.createElement("span",{className:"dshc-type-chip"},n.type)),d>1&&m.createElement(je,{title:`\u5BF9\u9F50 \xB7 ${d} \u4E2A\u56FE\u5C42`},m.createElement("div",{className:"dshc-align-grid"},...[["alignLeft","left","\u5DE6\u5BF9\u9F50"],["alignCenterX","centerX","\u6C34\u5E73\u5C45\u4E2D"],["alignRight","right","\u53F3\u5BF9\u9F50"],["alignTop","top","\u9876\u5BF9\u9F50"],["alignCenterY","centerY","\u5782\u76F4\u5C45\u4E2D"],["alignBottom","bottom","\u5E95\u5BF9\u9F50"]].map(([l,h,u])=>m.createElement(ie,{key:h,icon:l,title:u,onClick:()=>e.align(h)})),m.createElement(ie,{icon:"distributeX",title:"\u6C34\u5E73\u5206\u5E03",onClick:()=>e.distribute("x")}),m.createElement(ie,{icon:"distributeY",title:"\u5782\u76F4\u5206\u5E03",onClick:()=>e.distribute("y")}),m.createElement(ie,{icon:"group",title:"\u6210\u7EC4 (\u2318G)",onClick:()=>e.groupSelection()}),m.createElement(ie,{icon:"ungroup",title:"\u89E3\u7EC4 (\u21E7\u2318G)",onClick:()=>e.ungroupSelection()}))),m.createElement(je,{title:"\u4F4D\u7F6E\u4E0E\u5C3A\u5BF8",right:o},m.createElement("div",{className:"dshc-grid-2"},m.createElement(oe,{label:"X"},m.createElement(Ce,{value:de(n.sourceNode.x),disabled:!c,onChange:l=>le(e,n,{x:l})})),m.createElement(oe,{label:"Y"},m.createElement(Ce,{value:de(n.sourceNode.y),disabled:!c,onChange:l=>le(e,n,{y:l})})),m.createElement(oe,{label:"\u5BBD"},m.createElement(Ce,{value:de(n.sourceNode.width),min:0,disabled:!c,onChange:l=>le(e,n,{width:l})})),m.createElement(oe,{label:"\u9AD8"},m.createElement(Ce,{value:de(n.sourceNode.height),min:0,disabled:!c,onChange:l=>le(e,n,{height:l})})),m.createElement(oe,{label:"\u65CB\u8F6C"},m.createElement(Ce,{value:de(n.sourceNode.rotation),disabled:!c,onChange:l=>le(e,n,{rotation:l})})),m.createElement(oe,{label:"\u900F\u660E\u5EA6"},m.createElement(Ce,{value:de(n.sourceNode.opacity??1),min:0,max:1,step:.05,disabled:!c,onChange:l=>le(e,n,{opacity:l})}))),m.createElement(Un,null,m.createElement(ie,{icon:"front",title:"\u7F6E\u9876",onClick:()=>e.reorder("front")}),m.createElement(ie,{icon:"back",title:"\u7F6E\u5E95",onClick:()=>e.reorder("back")}),m.createElement(ie,{icon:"trash",title:"\u5220\u9664",danger:!0,onClick:()=>e.deleteSelection()}))),(n.type==="frame"||n.type==="instance")&&m.createElement(je,{title:"\u81EA\u52A8\u5E03\u5C40",right:n.sourceNode.layout?"\u5DF2\u542F\u7528":o},n.sourceNode.layout?m.createElement(m.Fragment,null,m.createElement("div",{className:"dshc-seg"},m.createElement(O,{small:!0,active:n.sourceNode.layout.direction==="horizontal",onClick:()=>Lt(e,n,{direction:"horizontal"})},"\u6A2A\u5411"),m.createElement(O,{small:!0,active:n.sourceNode.layout.direction==="vertical",onClick:()=>Lt(e,n,{direction:"vertical"})},"\u7EB5\u5411")),m.createElement("div",{className:"dshc-grid-2"},m.createElement(oe,{label:"\u95F4\u8DDD"},m.createElement(Ce,{value:n.sourceNode.layout.gap??0,min:0,onChange:l=>Lt(e,n,{gap:l})})),m.createElement(oe,{label:"\u5185\u8FB9\u8DDD"},m.createElement(Ce,{value:n.sourceNode.layout.padding?.top??0,min:0,onChange:l=>Lt(e,n,{padding:{...n.sourceNode.layout.padding,top:l,right:l,bottom:l,left:l}})})),m.createElement(oe,{label:"\u4E3B\u8F74\u5BF9\u9F50"},m.createElement(De,{value:n.sourceNode.layout.alignPrimary??"start",options:[{value:"start",label:"\u8D77\u59CB"},{value:"center",label:"\u5C45\u4E2D"},{value:"end",label:"\u672B\u5C3E"},{value:"space-between",label:"\u4E24\u7AEF"}],onChange:l=>Lt(e,n,{alignPrimary:l})})),m.createElement(oe,{label:"\u4EA4\u53C9\u8F74"},m.createElement(De,{value:n.sourceNode.layout.alignCounter??"start",options:[{value:"start",label:"\u8D77\u59CB"},{value:"center",label:"\u5C45\u4E2D"},{value:"end",label:"\u672B\u5C3E"},{value:"stretch",label:"\u62C9\u4F38"}],onChange:l=>Lt(e,n,{alignCounter:l})}))),m.createElement(oe,{label:"\u81EA\u8EAB\u5C3A\u5BF8"},m.createElement(De,{value:n.sourceNode.layoutSizing?.v??"fixed",options:[{value:"fixed",label:"\u56FA\u5B9A"},{value:"hug",label:"\u9002\u5E94\u5185\u5BB9"},{value:"fill",label:"\u586B\u5145"}],onChange:l=>le(e,n,{layoutSizing:{...n.sourceNode.layoutSizing??{h:"fixed"},v:l}})})),m.createElement(O,{small:!0,icon:"close",onClick:()=>le(e,n,{layout:null})},"\u79FB\u9664\u81EA\u52A8\u5E03\u5C40")):m.createElement(O,{small:!0,icon:"plus",onClick:()=>Lt(e,n,{direction:"vertical",gap:8,padding:{top:12,right:12,bottom:12,left:12},alignPrimary:"start",alignCounter:"start"})},"\u6DFB\u52A0\u81EA\u52A8\u5E03\u5C40")),n.parent?.layout&&m.createElement(je,{title:"\u5E03\u5C40\u5B50\u9879",right:o},m.createElement("div",{className:"dshc-grid-2"},m.createElement(oe,{label:"\u6C34\u5E73"},m.createElement(De,{value:n.sourceNode.layoutSizing?.h??"fixed",options:[{value:"fixed",label:"\u56FA\u5B9A"},{value:"hug",label:"\u9002\u5E94"},{value:"fill",label:"\u586B\u5145"}],onChange:l=>le(e,n,{layoutSizing:{...n.sourceNode.layoutSizing??{v:"fixed"},h:l}})})),m.createElement(oe,{label:"\u5782\u76F4"},m.createElement(De,{value:n.sourceNode.layoutSizing?.v??"fixed",options:[{value:"fixed",label:"\u56FA\u5B9A"},{value:"hug",label:"\u9002\u5E94"},{value:"fill",label:"\u586B\u5145"}],onChange:l=>le(e,n,{layoutSizing:{...n.sourceNode.layoutSizing??{h:"fixed"},v:l}})})))),n.type==="text"&&m.createElement(je,{title:"\u6587\u672C",right:o},m.createElement(Ji,{store:e,node:n,doc:a,type:"text"}),m.createElement("textarea",{className:"dshc-textarea",value:n.sourceNode.text??"",onChange:l=>le(e,n,{text:l.target.value}),rows:3,disabled:!c}),m.createElement("div",{className:"dshc-grid-2"},m.createElement(oe,{label:"\u5B57\u4F53"},m.createElement(De,{value:n.sourceNode.font?.family??"system-ui",options:[...new Set([...ll,...(a?.fonts??[]).map(l=>l.family),n.sourceNode.font?.family].filter(Boolean))].map(l=>({value:l,label:l})),onChange:l=>le(e,n,{font:{...n.sourceNode.font??{},family:l}})})),m.createElement(oe,{label:"\u5B57\u91CD"},m.createElement(De,{value:String(n.sourceNode.font?.weight??400),options:[100,200,300,400,500,600,700,800,900].map(l=>({value:String(l),label:String(l)})),onChange:l=>le(e,n,{font:{...n.sourceNode.font??{},weight:Number(l)}})})),m.createElement(oe,{label:"\u5B57\u53F7"},m.createElement(Ce,{value:de(n.sourceNode.font?.size??14),min:1,onChange:l=>le(e,n,{font:{...n.sourceNode.font??{},size:l}})})),m.createElement(oe,{label:"\u884C\u9AD8"},m.createElement(Ce,{value:de(n.sourceNode.font?.lineHeight??1.4),min:.5,step:.1,onChange:l=>le(e,n,{font:{...n.sourceNode.font??{},lineHeight:l}})})),m.createElement(oe,{label:"\u5B57\u8DDD"},m.createElement(Ce,{value:de(n.sourceNode.font?.letterSpacing??0),step:.1,onChange:l=>le(e,n,{font:{...n.sourceNode.font??{},letterSpacing:l}})})),m.createElement(oe,{label:"\u5BF9\u9F50"},m.createElement(De,{value:n.sourceNode.align??"left",options:[{value:"left",label:"\u5DE6"},{value:"center",label:"\u4E2D"},{value:"right",label:"\u53F3"},{value:"justify",label:"\u4E24\u7AEF"}],onChange:l=>le(e,n,{align:l})}))),m.createElement(Un,null,m.createElement("span",{className:"dshc-field-label"},"\u81EA\u52A8\u9AD8\u5EA6"),m.createElement(Xn,{value:n.sourceNode.autoHeight!==!1,onChange:l=>le(e,n,{autoHeight:l})}))),!s&&["frame","rect","ellipse","text","path"].includes(n.type)&&m.createElement(je,{title:"\u586B\u5145",right:o},m.createElement(Ji,{store:e,node:n,doc:a,type:"fill"}),(n.sourceNode.fills??[]).map((l,h)=>m.createElement(pl,{key:h,fill:l,index:h,store:e,node:n,onChange:u=>{let f=(n.sourceNode.fills??[]).slice();f[h]=u,le(e,n,{fills:f})},onRemove:()=>{let u=(n.sourceNode.fills??[]).filter((f,p)=>p!==h);le(e,n,{fills:u})},onCrop:()=>e.beginCrop(n.key,h)})),m.createElement("div",{className:"dshc-row"},m.createElement(O,{small:!0,icon:"plus",onClick:()=>le(e,n,{fills:[...n.sourceNode.fills??[],{type:"solid",color:"#D9D9D9"}]})},"\u7EAF\u8272"),m.createElement(O,{small:!0,icon:"plus",onClick:()=>le(e,n,{fills:[...n.sourceNode.fills??[],{type:"linear-gradient",angle:180,stops:[{position:0,color:"#4D6BFE"},{position:1,color:"#8B9DFF"}]}]})},"\u6E10\u53D8"))),!s&&["frame","rect","ellipse","line","path"].includes(n.type)&&m.createElement(je,{title:"\u63CF\u8FB9",right:o},(n.sourceNode.strokes??[]).map((l,h)=>m.createElement("div",{key:h,className:"dshc-fill-row"},m.createElement(Tt,{value:l.color,onChange:u=>{let f=(n.sourceNode.strokes??[]).slice();f[h]={...l,color:u},le(e,n,{strokes:f})}}),m.createElement(Ce,{value:l.width,min:0,onChange:u=>{let f=(n.sourceNode.strokes??[]).slice();f[h]={...l,width:u},le(e,n,{strokes:f})}}),m.createElement(ie,{icon:"trash",title:"\u5220\u9664\u63CF\u8FB9",size:13,onClick:()=>{let u=(n.sourceNode.strokes??[]).filter((f,p)=>p!==h);le(e,n,{strokes:u})}}))),m.createElement(O,{small:!0,icon:"plus",onClick:()=>le(e,n,{strokes:[...n.sourceNode.strokes??[],{color:"#94A3B8",width:1,align:"center"}]})},"\u6DFB\u52A0\u63CF\u8FB9")),!s&&m.createElement(je,{title:"\u6548\u679C",right:o},m.createElement(Ji,{store:e,node:n,doc:a,type:"effect"}),(n.sourceNode.effects??[]).map((l,h)=>m.createElement(fl,{key:h,effect:l,onChange:u=>{let f=(n.sourceNode.effects??[]).slice();f[h]=u,le(e,n,{effects:f})},onRemove:()=>le(e,n,{effects:(n.sourceNode.effects??[]).filter((u,f)=>f!==h)})})),m.createElement("div",{className:"dshc-row"},m.createElement(O,{small:!0,icon:"plus",onClick:()=>le(e,n,{effects:[...n.sourceNode.effects??[],{type:"drop-shadow",x:0,y:8,blur:24,spread:0,color:"#00000040"}]})},"\u6295\u5F71"),m.createElement(O,{small:!0,icon:"plus",onClick:()=>le(e,n,{effects:[...n.sourceNode.effects??[],{type:"inner-shadow",x:0,y:2,blur:8,spread:0,color:"#00000033"}]})},"\u5185\u9634\u5F71"),m.createElement(O,{small:!0,icon:"plus",onClick:()=>le(e,n,{effects:[...n.sourceNode.effects??[],{type:"layer-blur",radius:4}]})},"\u6A21\u7CCA"),m.createElement(O,{small:!0,icon:"plus",onClick:()=>le(e,n,{effects:[...n.sourceNode.effects??[],{type:"background-blur",radius:10}]})},"\u80CC\u666F\u6A21\u7CCA"))),!s&&(n.type==="frame"||n.type==="rect"||n.type==="ellipse"||n.type==="instance")&&m.createElement(je,{title:"\u5916\u89C2",right:o},m.createElement(oe,{label:"\u5706\u89D2"},m.createElement(Ce,{value:de(n.type==="instance"?n.cornerRadius??n.sourceNode.cornerRadius??0:n.sourceNode.cornerRadius??0),min:0,onChange:l=>le(e,n,{cornerRadius:l})})),n.type==="frame"&&m.createElement(Un,null,m.createElement("span",{className:"dshc-field-label"},"\u88C1\u526A\u5185\u5BB9"),m.createElement(Xn,{value:n.sourceNode.clip!==!1,onChange:l=>le(e,n,{clip:l})}))),n.type==="instance"&&m.createElement(ml,{store:e,node:n,doc:a}),n.type==="path"&&m.createElement(je,{title:"Path"},m.createElement(oe,{label:"d",wide:!0},m.createElement("textarea",{defaultValue:n.sourceNode.d??"",className:"dshc-path-input",onBlur:l=>le(e,n,{d:l.target.value})})),m.createElement("div",{className:"dshc-grid-2"},m.createElement(oe,{label:"ViewBox X"},m.createElement(Ce,{value:de(n.sourceNode.viewBox?.x??0),onChange:l=>le(e,n,{viewBox:{...n.sourceNode.viewBox??{x:0,y:0,width:n.width,height:n.height},x:l}})})),m.createElement(oe,{label:"Y"},m.createElement(Ce,{value:de(n.sourceNode.viewBox?.y??0),onChange:l=>le(e,n,{viewBox:{...n.sourceNode.viewBox??{x:0,y:0,width:n.width,height:n.height},y:l}})})),m.createElement(oe,{label:"\u5BBD"},m.createElement(Ce,{value:de(n.sourceNode.viewBox?.width??n.width),min:.01,onChange:l=>le(e,n,{viewBox:{...n.sourceNode.viewBox??{x:0,y:0,width:n.width,height:n.height},width:l}})})),m.createElement(oe,{label:"\u9AD8"},m.createElement(Ce,{value:de(n.sourceNode.viewBox?.height??n.height),min:.01,onChange:l=>le(e,n,{viewBox:{...n.sourceNode.viewBox??{x:0,y:0,width:n.width,height:n.height},height:l}})}))),m.createElement(oe,{label:"\u586B\u5145\u89C4\u5219",wide:!0},m.createElement(De,{value:n.sourceNode.fillRule??"nonzero",options:[{value:"nonzero",label:"nonzero"},{value:"evenodd",label:"evenodd"}],onChange:l=>le(e,n,{fillRule:l})}))),!r&&m.createElement(je,{title:"\u6837\u5F0F",right:o},m.createElement(qi,{store:e,node:n,type:"fill",label:"\u586B\u5145\u6837\u5F0F"}),n.type==="text"&&m.createElement(qi,{store:e,node:n,type:"text",label:"\u6587\u672C\u6837\u5F0F"}),m.createElement(qi,{store:e,node:n,type:"effect",label:"\u6548\u679C\u6837\u5F0F"}),m.createElement("div",{className:"dshc-row"},m.createElement(O,{small:!0,onClick:()=>t?.({title:"\u521B\u5EFA\u586B\u5145\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:n.name+" fill",onSubmit:l=>e.createStyle("fill",l)})},"\u4ECE\u586B\u5145\u521B\u5EFA\u6837\u5F0F"),n.type==="text"&&m.createElement(O,{small:!0,onClick:()=>t?.({title:"\u521B\u5EFA\u6587\u672C\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:n.name+" text",onSubmit:l=>e.createStyle("text",l)})},"\u521B\u5EFA\u6587\u672C\u6837\u5F0F"))),n.type==="frame"||n.type==="group"?m.createElement(je,{title:"\u7EC4\u4EF6"},m.createElement(O,{small:!0,icon:"component",onClick:()=>t?.({title:"\u521B\u5EFA\u7EC4\u4EF6",label:"\u7EC4\u4EF6\u540D\u79F0",defaultValue:n.name,onSubmit:l=>e.createComponentFromSelection(l)})},"\u4ECE\u9009\u533A\u521B\u5EFA\u7EC4\u4EF6"),n.type==="group"&&m.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.ungroupSelection()},"\u89E3\u7EC4")):null,n.type==="instance"&&m.createElement(gl,{store:e,node:n,doc:a}),m.createElement(je,{title:"\u4EE3\u7801",defaultOpen:!1},m.createElement("div",{className:"dshc-row"},m.createElement(O,{small:!0,icon:"copy",onClick:()=>{let l=Ms(e,n);navigator.clipboard?.writeText(l),e.toast("\u5DF2\u590D\u5236 CSS")}},"\u590D\u5236 CSS")),m.createElement("pre",{className:"dshc-code"},Ms(e,n))))}function Ji({store:e,node:t,doc:n,type:i}){let a=i==="fill"?"fillStyleId":i==="text"?"textStyleId":"effectStyleId",r=t.sourceNode?.[a];if(!r)return null;let s=(n?.styles??[]).find(o=>o.id===r),c=s?.name??r,d=()=>{let o={[a]:null};s?.value!=null&&(i==="fill"&&typeof s.value=="object"?o.fills=[structuredClone(s.value)]:i==="text"&&typeof s.value=="object"?(s.value.font&&(o.font=structuredClone(s.value.font)),Array.isArray(s.value.fills)&&(o.fills=structuredClone(s.value.fills))):i==="effect"&&Array.isArray(s.value)&&(o.effects=structuredClone(s.value))),le(e,t,o)};return m.createElement("div",{className:"dshc-style-bound-bar"},m.createElement("span",{className:"dshc-style-bound-label",title:`\u5DF2\u7ED1\u5B9A\u6837\u5F0F\uFF1A${c}`},`\u5DF2\u7ED1\u5B9A\u6837\u5F0F\uFF1A${c}`),m.createElement(O,{small:!0,onClick:d},"\u89E3\u7ED1"))}function Ms(e,t){if(!t)return"";let n=[],i=(o,l)=>{l==null||l===""||l==="none"||n.push(`  ${o}: ${l};`)};t.type!=="group"&&(i("width",`${de(t.width)}px`),i("height",`${de(t.height)}px`));let a=(t.fills??[])[0];if(t.type!=="text"){if(a?.type==="solid"&&a.color&&i("background",a.color),a?.type==="linear-gradient"&&Array.isArray(a.stops)){let o=a.stops.map(l=>`${l.color} ${Math.round(l.position*100)}%`).join(", ");i("background",`linear-gradient(${de(a.angle??180)}deg, ${o})`)}if(a?.type==="radial-gradient"&&Array.isArray(a.stops)){let o=a.stops.map(l=>`${l.color} ${Math.round(l.position*100)}%`).join(", ");i("background",`radial-gradient(circle, ${o})`)}a?.type==="image"&&a.asset&&i("background-image",`url("${ht(e.sessionId,e.state.name,a.asset)}")`)}t.cornerRadius&&i("border-radius",`${de(t.cornerRadius)}px`);let r=(t.strokes??[])[0];r&&i("border",`${de(r.width??1)}px solid ${r.color??"#000000"}`);let s=[],c=[];for(let o of t.effects??[])o.type==="drop-shadow"&&s.push(`${de(o.x??0)}px ${de(o.y??0)}px ${de(o.blur??0)}px ${de(o.spread??0)}px ${o.color??"#00000033"}`),o.type==="inner-shadow"&&s.push(`inset ${de(o.x??0)}px ${de(o.y??0)}px ${de(o.blur??0)}px ${de(o.spread??0)}px ${o.color??"#00000033"}`),o.type==="layer-blur"&&c.push(`blur(${de(o.radius??0)}px)`);if(s.length&&i("box-shadow",s.join(", ")),c.length&&i("filter",c.join(" ")),t.type==="text"){let o=t.font??{};i("font-family",`'${o.family??"system-ui"}'`),i("font-size",`${de(o.size??14)}px`),i("font-weight",`${o.weight??400}`),i("line-height",`${Math.round((o.lineHeight??1.4)*100)}%`),i("letter-spacing",`${de(o.letterSpacing??0)}px`);let l=a?.type==="solid"?a.color:null;l&&i("color",l),i("text-align",t.align==="center"?"center":t.align==="right"?"right":"left")}let d=t.layout;if(d&&t.type==="frame"){i("display","flex"),i("flex-direction",d.direction==="horizontal"?"row":"column"),d.gap&&i("gap",`${de(d.gap)}px`);let o=d.padding;o&&i("padding",`${de(o.top??0)}px ${de(o.right??0)}px ${de(o.bottom??0)}px ${de(o.left??0)}px`)}return t.opacity!=null&&t.opacity<1&&i("opacity",String(t.opacity)),n.length?`/* ${t.type} \xB7 ${t.name??""} */
.${String(t.name||t.type).replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").toLowerCase()||"node"} {
${n.join(`
`)}
}`:"/* \u6682\u65E0\u53EF\u5BFC\u51FA\u7684 CSS \u5C5E\u6027 */"}function ul({store:e,node:t}){let n=r=>e.setOverride(t.instanceId,t.sourceId,r),i=()=>e.mutate(r=>{let s=Qi(r,t.instanceId);s?.overrides&&delete s.overrides[t.sourceId]}),a=(t.fills??[]).find(r=>r.type==="solid");return m.createElement("div",{className:"dshc-inspector"},m.createElement("div",{className:"dshc-inspector-head"},m.createElement(Ne,{name:"component",size:14}),m.createElement("span",{className:"dshc-instance-title"},t.name),m.createElement("span",{className:"dshc-type-chip"},"\u8986\u76D6")),m.createElement(je,{title:"\u5B9E\u4F8B\u8986\u76D6"},m.createElement("div",{className:"dshc-help"},`\u5B9E\u4F8B ${t.instanceId} \xB7 \u6E90\u8282\u70B9 ${t.sourceId}`),t.type==="text"&&m.createElement("textarea",{className:"dshc-textarea",value:t.sourceNode.text??"",rows:3,onChange:r=>n({text:r.target.value})}),a&&m.createElement(oe,{label:"\u586B\u5145\u989C\u8272",wide:!0},m.createElement(Tt,{value:a.color,onChange:r=>{let s=(t.fills??[]).map((c,d)=>d===0?{...c,color:r}:c);n({fills:s})}})),m.createElement(Un,null,m.createElement("span",{className:"dshc-field-label"},"\u53EF\u89C1"),m.createElement(Xn,{value:t.visible!==!1,onChange:r=>n({visible:r})})),m.createElement("div",{className:"dshc-row"},m.createElement(O,{small:!0,icon:"reset",onClick:i},"\u91CD\u7F6E\u6B64\u8282\u70B9\u8986\u76D6"),m.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.exitInstance()},"\u9000\u51FA\u5B9E\u4F8B"),m.createElement(O,{small:!0,icon:"trash",onClick:()=>e.detachInstance(t.instanceId)},"\u5206\u79BB"))))}function Lt(e,t,n){let i=t.sourceNode.layout??{direction:"vertical",gap:0,padding:{top:0,right:0,bottom:0,left:0},alignPrimary:"start",alignCounter:"start"},a={...i,...n,padding:{...i.padding??{},...n.padding??{}}};le(e,t,{layout:a})}function de(e){return Math.round((Number(e)||0)*100)/100}function Ps(e){return(e??[]).reduce((t,n)=>t+1+Ps(n.children??[]),0)}function pl({fill:e,onChange:t,onRemove:n,onCrop:i,store:a,node:r,index:s}){let c=e.type,d=r?.type==="path",o=m.useRef(null),l=[{value:"solid",label:"\u7EAF\u8272"},{value:"linear-gradient",label:"\u7EBF\u6027\u6E10\u53D8"},{value:"radial-gradient",label:"\u5F84\u5411\u6E10\u53D8"},...d?[]:[{value:"image",label:"\u56FE\u7247"}]];return m.createElement("div",{className:"dshc-fill-editor"},m.createElement("div",{className:"dshc-fill-row"},m.createElement(De,{value:c,options:l,onChange:h=>{h==="solid"?t({type:"solid",color:"#D9D9D9",opacity:1}):h==="linear-gradient"?t({type:"linear-gradient",angle:180,stops:[{position:0,color:"#4D6BFE"},{position:1,color:"#8B9DFF"}]}):h==="radial-gradient"?t({type:"radial-gradient",center:{x:.5,y:.5},radius:.7,stops:[{position:0,color:"#FFFFFF"},{position:1,color:"#00000000"}]}):d||t({type:"image",asset:e.asset??"assets/missing.png",fit:"cover"})}}),m.createElement(ie,{icon:"trash",title:"\u5220\u9664\u586B\u5145",size:13,onClick:n})),c==="solid"&&m.createElement("div",{className:"dshc-fill-row"},m.createElement(Tt,{value:e.color,onChange:h=>t({...e,color:h})}),m.createElement(Ce,{value:de(e.opacity??1),min:0,max:1,step:.05,onChange:h=>t({...e,opacity:h})})),(c==="linear-gradient"||c==="radial-gradient")&&m.createElement(m.Fragment,null,c==="linear-gradient"?m.createElement(oe,{label:"\u89D2\u5EA6"},m.createElement(Ce,{value:de(e.angle??180),onChange:h=>t({...e,angle:h})})):null,(e.stops??[]).map((h,u)=>m.createElement("div",{key:u,className:"dshc-stop-row"},m.createElement(Tt,{value:h.color,onChange:f=>{let p=e.stops.slice();p[u]={...h,color:f},t({...e,stops:p})}}),m.createElement(Ce,{value:de(h.position),min:0,max:1,step:.05,onChange:f=>{let p=e.stops.slice();p[u]={...h,position:f},t({...e,stops:p})}}),m.createElement(ie,{icon:"close",title:"\u5220\u9664\u505C\u6B62\u70B9",size:12,onClick:()=>{(e.stops??[]).length<=2||t({...e,stops:e.stops.filter((f,p)=>p!==u)})}}))),m.createElement(O,{small:!0,icon:"plus",onClick:()=>t({...e,stops:[...e.stops??[],{position:.5,color:"#FFFFFF"}]})},"\u6DFB\u52A0\u505C\u6B62\u70B9")),c==="image"&&!d&&m.createElement(m.Fragment,null,m.createElement("div",{className:"dshc-fill-row"},m.createElement("span",{className:"dshc-muted"},e.asset??"\u65E0\u56FE\u7247"),m.createElement(De,{value:e.fit??"cover",options:[{value:"cover",label:"\u8986\u76D6"},{value:"contain",label:"\u5305\u542B"},{value:"fill",label:"\u62C9\u4F38"}],onChange:h=>t({...e,fit:h})}),m.createElement(O,{small:!0,onClick:i},"\u88C1\u526A")),m.createElement("div",{className:"dshc-fill-row"},m.createElement("input",{ref:o,type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",style:{display:"none"},onChange:h=>{let u=h.target.files?.[0];u&&a&&r&&a.uploadFillImage(r.sourceId,s,u),h.target.value=""}}),m.createElement(O,{small:!0,icon:"upload",onClick:()=>o.current?.click()},"\u4E0A\u4F20\u56FE\u7247\u586B\u5145"))))}function fl({effect:e,onChange:t,onRemove:n}){return m.createElement("div",{className:"dshc-effect-editor"},m.createElement("div",{className:"dshc-fill-row"},m.createElement(De,{value:e.type,options:[{value:"drop-shadow",label:"\u6295\u5F71"},{value:"inner-shadow",label:"\u5185\u9634\u5F71"},{value:"layer-blur",label:"\u56FE\u5C42\u6A21\u7CCA"},{value:"background-blur",label:"\u80CC\u666F\u6A21\u7CCA"}],onChange:i=>{t(i==="layer-blur"||i==="background-blur"?{type:i,radius:e.radius??6}:{type:i,x:e.x??0,y:e.y??8,blur:e.blur??24,spread:e.spread??0,color:e.color??"#00000040"})}}),m.createElement(ie,{icon:"trash",title:"\u5220\u9664\u6548\u679C",size:13,onClick:n})),e.type==="layer-blur"||e.type==="background-blur"?m.createElement(oe,{label:"\u534A\u5F84"},m.createElement(Ce,{value:de(e.radius??0),min:0,onChange:i=>t({...e,radius:i})})):m.createElement("div",{className:"dshc-grid-2"},m.createElement(oe,{label:"X"},m.createElement(Ce,{value:de(e.x??0),onChange:i=>t({...e,x:i})})),m.createElement(oe,{label:"Y"},m.createElement(Ce,{value:de(e.y??0),onChange:i=>t({...e,y:i})})),m.createElement(oe,{label:"\u6A21\u7CCA"},m.createElement(Ce,{value:de(e.blur??0),min:0,onChange:i=>t({...e,blur:i})})),m.createElement(oe,{label:"\u6269\u6563"},m.createElement(Ce,{value:de(e.spread??0),onChange:i=>t({...e,spread:i})})),m.createElement(oe,{label:"\u989C\u8272",wide:!0},m.createElement(Tt,{value:e.color??"#00000040",onChange:i=>t({...e,color:i})}))))}function qi({store:e,node:t,type:n,label:i}){let a=(e.state.doc?.styles??[]).filter(o=>o.type===n),r=n==="fill"?"fillStyleId":n==="text"?"textStyleId":"effectStyleId",s=t.sourceNode?.[r]??"",c=s?a.find(o=>o.id===s)??(e.state.doc?.styles??[]).find(o=>o.id===s):null,d=[{value:"",label:s?"\u79FB\u9664\u6837\u5F0F":a.length?"\u5E94\u7528\u6837\u5F0F\u2026":"\u6682\u65E0\u6837\u5F0F"},...a.map(o=>({value:o.id,label:o.name}))];return s&&!d.some(o=>o.value===s)&&c&&d.push({value:s,label:c.name}),m.createElement(oe,{label:i,wide:!0},m.createElement(De,{value:s,disabled:!a.length&&!s,options:d,onChange:o=>{if(!o){le(e,t,{[r]:null});return}(e.state.selection?.length??0)<=1&&e.setSelection([t.key]),e.applyStyle(o)}}))}function ml({store:e,node:t,doc:n}){let i=(n?.components??[]).find(r=>r.id===t.sourceNode.componentId),a=i?.variantSetId?(n?.variantSets??[]).find(r=>r.id===i.variantSetId):null;return m.createElement(je,{title:"\u5B9E\u4F8B"},m.createElement("div",{className:"dshc-stat-line"},`\u4E3B\u7EC4\u4EF6\uFF1A${i?.name??t.sourceNode.componentId}`),a&&a.properties.map(r=>m.createElement(oe,{key:r.name,label:r.name,wide:!0},m.createElement(De,{value:t.sourceNode.variantProps?.[r.name]??r.values[0],options:r.values.map(s=>({value:s,label:s})),onChange:s=>e.setVariant(t.sourceId,r.name,s)}))),m.createElement(oe,{label:"\u6362\u7EC4\u4EF6",wide:!0},m.createElement(De,{value:t.sourceNode.componentId,options:(n?.components??[]).map(r=>({value:r.id,label:r.name})),onChange:r=>e.swapComponent(t.sourceId,r)})),m.createElement("div",{className:"dshc-row"},m.createElement(O,{small:!0,icon:"component",onClick:()=>i&&e.editComponent(i.id)},"\u7F16\u8F91\u4E3B\u7EC4\u4EF6"),m.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.enterInstance(t.key)},"\u8FDB\u5165\u5B9E\u4F8B"),m.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.detachInstance(t.sourceId)},"\u5206\u79BB")))}function gl({store:e,node:t}){let n=t.sourceNode.overrides??{},i=Object.keys(n).length;return m.createElement(je,{title:"\u5B9E\u4F8B\u8986\u76D6",right:i?`${i}`:null},i?m.createElement("div",null,Object.entries(n).map(([a])=>m.createElement("div",{key:a,className:"dshc-override-row"},m.createElement("span",{className:"dshc-muted"},a),m.createElement(O,{small:!0,onClick:()=>{e.mutate(r=>{let s=Qi(r,t.sourceId);s?.overrides&&delete s.overrides[a]})}},"\u91CD\u7F6E")))):m.createElement("div",{className:"dshc-help"},"\u53CC\u51FB\u8FDB\u5165\u5B9E\u4F8B\uFF0C\u4FEE\u6539\u6587\u672C/\u586B\u5145/\u663E\u9690\u540E\u751F\u6210\u8986\u76D6\u3002"),m.createElement(O,{small:!0,icon:"reset",onClick:()=>e.mutate(a=>{let r=Qi(a,t.sourceId);r&&(r.overrides={})})},"\u91CD\u7F6E\u5168\u90E8\u8986\u76D6"))}function Qi(e,t){for(let n of e.pages??[]){let i=ea(n.children,t);if(i)return i}for(let n of e.components??[]){if(n.root.id===t)return n.root;let i=ea(n.root.children??[],t);if(i)return i}return null}function ea(e,t){for(let n of e??[]){if(n.id===t)return n;let i=ea(n.children,t);if(i)return i}return null}var _e=qe(require("react"),1);function na(e,t){let n=t?.variantProps&&typeof t.variantProps=="object"?t.variantProps:null;if(n){let s=(e?.properties??[]).map(d=>n[d.name]).filter(d=>typeof d=="string"&&d.trim().length>0);if(s.length>0)return s.join(" / ");let c=Object.values(n).filter(d=>typeof d=="string"&&d.trim().length>0);if(c.length>0)return c.join(" / ")}let i=String(t?.name??"").trim(),a=e?.name?`${e.name}/`:"";if(a&&i.startsWith(a)){let s=i.slice(a.length).trim();if(s)return s}return i.split("/").pop()?.trim()||i||"Variant"}var E=require("react/jsx-runtime");function Bt(e,t,n){return Math.min(n,Math.max(t,e))}function qt(e){return Bt(Number(e)||0,0,1)}function yl(e){let t=e.color??"#000000";if(e.opacity==null||e.opacity>=1)return t;let n=Math.round(qt(e.opacity)*255).toString(16).padStart(2,"0");return t.length===7?`${t}${n}`:t}function As(e){return(e??[]).map(t=>`${t.color} ${(qt(t.position)*100).toFixed(1)}%`).join(", ")}function xl(e){let t=e&&typeof e=="object"?e:null;if(!t)return{swatchStyle:void 0,meta:"\u586B\u5145"};if(t.type==="solid"){let n=(t.color??"#000000").toUpperCase(),i=t.opacity!=null&&t.opacity<1?` \xB7 ${Math.round(qt(t.opacity)*100)}%`:"";return{swatchStyle:{background:yl(t)},meta:`${n}${i}`}}if(t.type==="linear-gradient"){let n=Number.isFinite(Number(t.angle))?Number(t.angle):180,i=As(t.stops);return{swatchStyle:i?{background:`linear-gradient(${n}deg, ${i})`}:void 0,meta:`\u7EBF\u6027\u6E10\u53D8 ${Math.round(n)}\xB0`}}if(t.type==="radial-gradient"){let n=qt(t.center?.x??.5)*100,i=qt(t.center?.y??.5)*100,a=Math.max(1,qt(t.radius??.7)*100),r=As(t.stops);return{swatchStyle:r?{background:`radial-gradient(circle ${a}% at ${n}% ${i}%, ${r})`}:void 0,meta:"\u5F84\u5411\u6E10\u53D8"}}return t.type==="image"?{swatchStyle:void 0,meta:"\u56FE\u7247\u586B\u5145"}:{swatchStyle:void 0,meta:"\u586B\u5145"}}function bl(e){let n=(e&&typeof e=="object"?e:null)?.font??{},i=n.family||"system-ui",a=Number.isFinite(Number(n.size))?Number(n.size):14,r=Number.isFinite(Number(n.weight))?Number(n.weight):400,s=n.style==="italic";return{swatchStyle:{fontFamily:i,fontWeight:r,fontStyle:s?"italic":"normal"},meta:`${i} \xB7 ${a}px/${r}`}}var Ds={"drop-shadow":"\u6295\u5F71","inner-shadow":"\u5185\u9634\u5F71","layer-blur":"\u6A21\u7CCA","background-blur":"\u80CC\u666F\u6A21\u7CCA"};function vl(e){let n=(Array.isArray(e)?e:[]).filter(l=>l&&l.visible!==!1);if(n.length===0)return{swatchStyle:void 0,meta:"\u65E0\u6548\u679C"};let i=[],a=!1,r=!1,s=0,c=0;for(let l of n)if(l.type==="drop-shadow"||l.type==="inner-shadow"){let h=l.type==="inner-shadow"?"inset ":"",u=Bt(Number(l.x)||0,-3,3),f=Bt(Number(l.y)||0,-3,3),p=Bt(Number(l.blur)||0,1,7),g=Bt(Number(l.spread)||0,-2,2);i.push(`${h}${u}px ${f}px ${p}px ${g}px ${l.color??"#00000040"}`)}else l.type==="layer-blur"?(a=!0,s=Math.max(s,Number(l.radius??l.blur)||4)):l.type==="background-blur"&&(r=!0,c=Math.max(c,Number(l.radius??l.blur)||8));let d={};if(i.length&&(d.boxShadow=i.join(", ")),r){let l=Bt(c/4,1.5,4);d.backdropFilter=`blur(${l}px)`,d.WebkitBackdropFilter=`blur(${l}px)`,d.background="linear-gradient(135deg, rgba(255,255,255,0.68), rgba(148,163,184,0.34))"}if(a){let l=Bt(s/6,.7,2);d.filter=`blur(${l}px)`}let o;if(n.length===1){let l=n[0],h=Ds[l.type??""]??"\u6548\u679C";l.type==="layer-blur"||l.type==="background-blur"?o=`${h} \xB7 ${Math.round(Number(l.radius??l.blur)||0)}px`:o=`${h} \xB7 ${Math.round(Number(l.blur)||0)}px`}else{let l=[...new Set(n.map(h=>Ds[h.type??""]??"\u6548\u679C"))];o=`${n.length} \u9879 \xB7 ${l.join("/")}`}return{swatchStyle:d,meta:o}}function wl(e,t){let n=t.map(r=>e.find(s=>s.id===r)?.name?.trim()??"").filter(Boolean);if(n.length<2)return"Variant Set";let i=n.map(r=>r.split("/").map(s=>s.trim()).filter(Boolean));if(i.every(r=>r.length>=2)){let r=[],s=Math.min(...i.map(c=>c.length))-1;for(let c=0;c<s;c+=1){let d=i[0][c];if(i.every(o=>o[c]===d))r.push(d);else break}if(r.length>0)return r.join("/")}let a=n.map(r=>r.split(/\s+/).filter(Boolean));if(a.every(r=>r.length>=2)){let r=[],s=Math.min(...a.map(c=>c.length))-1;for(let c=0;c<s;c+=1){let d=a[0][c];if(a.every(o=>o[c]===d))r.push(d);else break}if(r.length>0)return r.join(" ")}return"Variant Set"}function ia(e,t){for(let n of e??[]){if(!n)continue;if(n.id===t)return n.name||n.type||null;let i=ia(n.children,t);if(i)return i}return null}function kl(e,t,n){if(!n)return"\u753B\u5E03";let i=e.state.scene?.byKey?.get?.(n);if(i)return i.name||i.type||"\u672A\u547D\u540D\u56FE\u5C42";for(let a of t?.pages??[]){let r=ia(a.children,n);if(r)return r}for(let a of t?.components??[]){if(a.root?.id===n)return a.root.name||a.name||"\u7EC4\u4EF6";let r=ia(a.root?.children,n);if(r)return r}return"\u5DF2\u79FB\u9664\u56FE\u5C42"}function Sl({template:e,device:t,store:n}){let i=_e.useMemo(()=>us(e.id,t.id),[e.id,t.id]),a=e.category==="page",r=`${i.width}\xD7${i.height}`;return(0,E.jsxs)("div",{className:`dshc-template-card ${a?"is-page":"is-bar"}`,draggable:!0,title:`${e.description}\uFF08\u62D6\u5165\u753B\u5E03\u6307\u5B9A\u4F4D\u7F6E\uFF0C\u6216\u70B9 + \u63D2\u5165\uFF09`,onDragStart:s=>{s.dataTransfer.effectAllowed="copy",s.dataTransfer.setData(fn,e.id),s.dataTransfer.setData("text/plain",e.name),gn({kind:"template",id:e.id,name:e.name,width:i.width,height:i.height})},onDragEnd:()=>{yt()},children:[(0,E.jsx)("div",{className:`dshc-template-thumb ${a?"is-page":"is-bar"}`,children:(0,E.jsx)("img",{src:i.dataUri,alt:e.name,draggable:!1})}),(0,E.jsxs)("div",{className:"dshc-template-foot",children:[(0,E.jsxs)("div",{className:"dshc-template-info",children:[(0,E.jsx)("div",{className:"dshc-template-name",children:e.name}),(0,E.jsx)("div",{className:"dshc-template-meta",children:r})]}),(0,E.jsx)(ie,{icon:"plus",title:`\u63D2\u5165${e.name}`,size:14,onClick:s=>{s.stopPropagation(),n.insertTemplate(e.id)}})]})]})}function Fs({store:e}){let t=pt(e.state.foundation?.device),n=[["\u9875\u9762","page",cn.filter(i=>i.category==="page")],["\u7CFB\u7EDF\u680F","bar",cn.filter(i=>i.category!=="page")]];return(0,E.jsxs)("div",{className:"dshc-panel",children:[(0,E.jsxs)("div",{className:"dshc-panel-title",children:["\u6A21\u677F",(0,E.jsx)("span",{className:"dshc-panel-count",children:cn.length})]}),(0,E.jsxs)("div",{className:"dshc-row dshc-template-device",children:[(0,E.jsx)("span",{className:"dshc-field-label",children:"\u8BBE\u5907"}),(0,E.jsx)(De,{value:t.id,options:[{value:"iphone16",label:"iPhone 16 \xB7 393\xD7852"},{value:"iphone15",label:"iPhone 15 \xB7 390\xD7844"}],onChange:i=>e.setFoundation({device:i})})]}),(0,E.jsx)("div",{className:"dshc-help dshc-pad",children:"\u62D6\u62FD\u7F29\u7565\u56FE\u5361\u7247\u5230\u753B\u5E03\u4EFB\u610F\u4F4D\u7F6E\uFF0C\u6216\u70B9\u51FB + \u63D2\u5165\u3002"}),n.map(([i,a,r])=>(0,E.jsxs)("div",{className:"dshc-panel-group",children:[(0,E.jsx)("div",{className:"dshc-panel-subtitle",children:i}),(0,E.jsx)("div",{className:`dshc-template-grid is-${a}`,children:r.map(s=>(0,E.jsx)(Sl,{template:s,device:t,store:e},s.id))})]},i))]})}function zs(e,t){let n=0,i=a=>{if(a){t(a)&&(n+=1);for(let r of a.children??[])i(r)}};for(let a of e.state.doc?.pages??[])a.children.forEach(i);for(let a of e.state.doc?.components??[])i(a.root);return n}function Rl({set:e,doc:t,store:n,componentById:i}){let a=(e.componentIds??[]).map(h=>i.get(h)).filter(h=>!!h),[r,s]=_e.useState(()=>a[0]?.id??""),c=a.find(h=>h.id===r)??a[0]??null;if(!c)return null;let d=_n(t,c),o=na(e,c),l=(h,u)=>{let f=u.id===c.id?d:_n(t,u);h.dataTransfer.effectAllowed="copy",h.dataTransfer.setData(Ut,u.id),h.dataTransfer.setData("text/plain",u.name),gn({kind:"component",id:u.id,name:u.name,width:f.width,height:f.height})};return(0,E.jsxs)("div",{className:"dshc-set-card",draggable:!0,title:`${e.name} \xB7 ${o}\uFF08\u70B9\u9009\u4E0B\u65B9\u53D8\u4F53\u5207\u6362\u9884\u89C8\uFF0C\u62D6\u62FD\u5230\u753B\u5E03\u653E\u7F6E\uFF0C\u6216\u70B9 + \u63D2\u5165\uFF09`,onDragStart:h=>{if(h.target?.closest?.("input, button")){h.preventDefault();return}l(h,c)},onDragEnd:()=>yt(),children:[(0,E.jsx)("div",{className:"dshc-component-thumb",onDoubleClick:()=>n.editComponent(c.id),children:(0,E.jsx)("img",{src:d.dataUri,alt:c.name,draggable:!1})}),(0,E.jsxs)("div",{className:"dshc-set-body",children:[(0,E.jsxs)("div",{className:"dshc-set-header",children:[(0,E.jsxs)("div",{className:"dshc-template-info",onDoubleClick:()=>n.editComponent(c.id),children:[(0,E.jsx)("div",{className:"dshc-set-name",title:e.name,children:e.name}),(0,E.jsx)("div",{className:"dshc-template-meta",title:`${o} \xB7 ${d.width}\xD7${d.height}`,children:`${o} \xB7 ${d.width}\xD7${d.height}`})]}),(0,E.jsx)(ie,{icon:"plus",title:`\u63D2\u5165 ${o} \u5B9E\u4F8B`,size:13,onClick:h=>{h.stopPropagation(),n.insertInstance(c.id)}}),(0,E.jsx)(ie,{icon:"text",title:`\u7F16\u8F91 ${o} \u4E3B\u7EC4\u4EF6`,size:13,onClick:h=>{h.stopPropagation(),n.editComponent(c.id)}})]}),(0,E.jsx)("div",{className:"dshc-set-variants",children:a.map(h=>{let u=h.id===c.id,f=na(e,h);return(0,E.jsx)("button",{type:"button",className:`dshc-variant-chip ${u?"is-active":""}`,"aria-pressed":u,draggable:!0,title:`${h.name}\uFF08\u70B9\u51FB\u5207\u6362\u9884\u89C8\uFF0C\u62D6\u5165\u753B\u5E03\u653E\u7F6E\uFF09`,onDragStart:p=>{p.stopPropagation(),s(h.id),l(p,h)},onDragEnd:p=>{p.stopPropagation(),yt()},onClick:p=>{p.stopPropagation(),s(h.id)},children:f},h.id)})})]})]})}function Ts({store:e,onNeedName:t}){let n=e.state.doc,[i,a]=_e.useState([]),[r,s]=_e.useState(""),[c,d]=_e.useState(!1);if(!n)return null;let o=n.components??[],l=n.variantSets??[],h=e.primaryNode(),u=!!(h&&(h.type==="frame"||h.type==="group")&&h.editable),f=new Map(o.map(P=>[P.id,P])),p=i.filter(P=>f.has(P)),g=r.trim().toLowerCase(),y=o.length+l.length>=4,A=new Set(l.flatMap(P=>P.componentIds??[])),k=o.filter(P=>A.has(P.id)).length,N=g?l.filter(P=>P.name.toLowerCase().includes(g)||(P.componentIds??[]).some(K=>f.get(K)?.name?.toLowerCase().includes(g))):l,I=g?o.filter(P=>P.name.toLowerCase().includes(g)):o,M=I.filter(P=>!A.has(P.id)),T=c?I:M,j=()=>{if(p.length<2)return;let P=wl(o,p);t?t({title:"\u5408\u5E76\u4E3A\u53D8\u4F53\u96C6",label:"\u53D8\u4F53\u96C6\u540D\u79F0",defaultValue:P,onSubmit:K=>{e.createVariantSet(p,K),a([])}}):(e.createVariantSet(p,P),a([]))};return(0,E.jsxs)("div",{className:"dshc-panel",children:[(0,E.jsxs)("div",{className:"dshc-panel-title",children:["\u7EC4\u4EF6",(0,E.jsx)("span",{className:"dshc-panel-count",children:o.length})]}),(0,E.jsxs)("div",{className:"dshc-panel-actions",children:[(0,E.jsx)(O,{small:!0,icon:"component",disabled:!u,title:u?"\u4ECE\u5F53\u524D\u9009\u4E2D\u5BB9\u5668\u521B\u5EFA\u4E3B\u7EC4\u4EF6":"\u9009\u4E2D\u4E00\u4E2A Frame \u6216 Group \u540E\u53EF\u521B\u5EFA\u7EC4\u4EF6",onClick:()=>t?.({title:"\u521B\u5EFA\u7EC4\u4EF6",label:"\u7EC4\u4EF6\u540D\u79F0",defaultValue:h?.name??"Component",onSubmit:P=>e.createComponentFromSelection(P)}),children:"\u4ECE\u9009\u533A\u521B\u5EFA"}),(0,E.jsx)(O,{small:!0,icon:"layers",disabled:p.length<2,title:p.length>=2?"\u5C06\u52FE\u9009\u7684\u7EC4\u4EF6\u5408\u5E76\u4E3A\u53D8\u4F53\u96C6":"\u52FE\u9009\u81F3\u5C11 2 \u4E2A\u7EC4\u4EF6\u4EE5\u5408\u5E76\u4E3A\u53D8\u4F53\u96C6",onClick:j,children:"\u5408\u5E76\u4E3A\u53D8\u4F53"})]}),y&&(0,E.jsx)("input",{type:"search",className:"dshc-search-input",placeholder:"\u641C\u7D22\u7EC4\u4EF6\u6216\u53D8\u4F53\u96C6\u2026","aria-label":"\u641C\u7D22\u7EC4\u4EF6",value:r,onChange:P=>s(P.target.value)}),N.length>0&&(0,E.jsxs)("div",{className:"dshc-panel-group",children:[(0,E.jsx)("div",{className:"dshc-panel-subtitle",children:"\u53D8\u4F53\u96C6"}),N.map(P=>(0,E.jsx)(Rl,{set:P,doc:n,store:e,componentById:f},P.id))]}),(0,E.jsxs)("div",{className:"dshc-panel-group",children:[(0,E.jsx)("div",{className:"dshc-panel-subtitle",children:c?"\u5168\u90E8\u4E3B\u7EC4\u4EF6":"\u7EC4\u4EF6"}),o.length===0?(0,E.jsx)(Wi,{icon:"component",title:"\u8FD8\u6CA1\u6709\u7EC4\u4EF6",text:"\u9009\u4E2D\u4E00\u4E2A Frame\uFF0C\u70B9\u201C\u4ECE\u9009\u533A\u521B\u5EFA\u201D\u3002"}):g&&N.length===0&&T.length===0?(0,E.jsx)("div",{className:"dshc-muted dshc-pad",children:"\u65E0\u5339\u914D\u7EC4\u4EF6"}):T.map(P=>{let K=_n(n,P);return(0,E.jsxs)("div",{className:"dshc-component-card",draggable:!0,title:`${P.name}\uFF08\u62D6\u5165\u753B\u5E03\u6216\u70B9\u51FB + \u63D2\u5165\uFF0C\u53CC\u51FB\u7F16\u8F91\u4E3B\u7EC4\u4EF6\uFF09`,onDragStart:W=>{if(W.target?.closest?.("input, button")){W.preventDefault();return}W.dataTransfer.effectAllowed="copy",W.dataTransfer.setData(Ut,P.id),W.dataTransfer.setData("text/plain",P.name),gn({kind:"component",id:P.id,name:P.name,width:K.width,height:K.height})},onDragEnd:()=>yt(),children:[(0,E.jsx)("div",{className:"dshc-component-thumb",onDoubleClick:()=>e.editComponent(P.id),children:(0,E.jsx)("img",{src:K.dataUri,alt:P.name,draggable:!1})}),(0,E.jsxs)("div",{className:"dshc-component-bar",children:[(0,E.jsx)("input",{type:"checkbox",draggable:!1,checked:p.includes(P.id),onChange:W=>a(W.target.checked?[...p,P.id]:p.filter(Q=>Q!==P.id))}),(0,E.jsxs)("div",{className:"dshc-template-info",onDoubleClick:()=>e.editComponent(P.id),children:[(0,E.jsx)("div",{className:"dshc-template-name",title:P.name,children:P.name}),(0,E.jsx)("div",{className:"dshc-template-meta",children:`${K.width}\xD7${K.height}`})]}),(0,E.jsx)(ie,{icon:"plus",title:"\u63D2\u5165\u5B9E\u4F8B",size:13,onClick:()=>e.insertInstance(P.id)}),(0,E.jsx)(ie,{icon:"text",title:"\u7F16\u8F91\u4E3B\u7EC4\u4EF6",size:13,onClick:()=>e.editComponent(P.id)}),(0,E.jsx)(ie,{icon:"trash",title:"\u5220\u9664\u7EC4\u4EF6",size:13,danger:!0,onClick:()=>{let W=e.state.scene?zs(e,Q=>Q.type==="instance"&&(Q.componentId===P.id||Q.sourceNode?.componentId===P.id)):0;if(W){e.toast(`\u6709 ${W} \u4E2A\u5B9E\u4F8B\u5728\u4F7F\u7528\uFF0C\u65E0\u6CD5\u5220\u9664`);return}a(Q=>Q.filter(B=>B!==P.id)),e.mutate(Q=>{Q.components=Q.components.filter(B=>B.id!==P.id),Q.variantSets=Q.variantSets.filter(B=>!B.componentIds.includes(P.id))})}})]})]},P.id)}),k>0&&(0,E.jsxs)("button",{type:"button",className:"dshc-collapse-toggle",onClick:()=>d(!c),children:[(0,E.jsx)(Ne,{name:c?"chevronDown":"chevronRight",size:12}),(0,E.jsx)("span",{children:c?"\u6536\u8D77\u53D8\u4F53\u4E3B\u7EC4\u4EF6":`\u663E\u793A\u5168\u90E8\u4E3B\u7EC4\u4EF6\uFF08\u542B ${k} \u4E2A\u53D8\u4F53\uFF09`})]})]})]})}function Ls({store:e,onNeedName:t}){let n=e.state.doc,[i,a]=_e.useState("");if(!n)return null;let r=n.styles??[],s=i.trim().toLowerCase(),c=s?r.filter(o=>o.name.toLowerCase().includes(s)):r,d=[["fill","\u586B\u5145"],["text","\u6587\u672C"],["effect","\u6548\u679C"]];return(0,E.jsxs)("div",{className:"dshc-panel",children:[(0,E.jsxs)("div",{className:"dshc-panel-title",children:["\u6837\u5F0F\u5E93",(0,E.jsx)("span",{className:"dshc-panel-count",children:r.length})]}),(0,E.jsxs)("div",{className:"dshc-panel-group",children:[(0,E.jsx)("div",{className:"dshc-panel-subtitle",children:"\u5185\u7F6E\u89C4\u8303"}),(0,E.jsxs)("div",{className:"dshc-panel-actions",children:[(0,E.jsx)(O,{small:!0,icon:"styles",title:"\u52A0\u8F7D Material 3 \u7684\u586B\u5145/\u6587\u672C/\u6548\u679C\u6837\u5F0F\u5230\u5F53\u524D\u6587\u6863",onClick:()=>e.loadDesignSystem("material3"),children:"Material 3"}),(0,E.jsx)(O,{small:!0,icon:"styles",title:"\u52A0\u8F7D iOS HIG \u7684\u586B\u5145/\u6587\u672C/\u6548\u679C\u6837\u5F0F\u5230\u5F53\u524D\u6587\u6863",onClick:()=>e.loadDesignSystem("ios"),children:"iOS HIG"})]}),(0,E.jsx)("div",{className:"dshc-help",children:"\u52A0\u5165\u4E0B\u65B9\u6837\u5F0F\u5E93\uFF0C\u70B9\u51FB\u5E94\u7528\u6216\u76F4\u63A5\u62D6\u5230\u753B\u5E03\u56FE\u5C42\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u4FEE\u6539\u73B0\u6709\u56FE\u5C42\u3002"})]}),(0,E.jsxs)("div",{className:"dshc-panel-actions",children:[(0,E.jsx)(O,{small:!0,icon:"plus",onClick:()=>t?.({title:"\u521B\u5EFA\u586B\u5145\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:"Brand/Primary",onSubmit:o=>e.createStyle("fill",o)}),children:"\u586B\u5145"}),(0,E.jsx)(O,{small:!0,icon:"plus",onClick:()=>t?.({title:"\u521B\u5EFA\u6587\u672C\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:"Text/Body",onSubmit:o=>e.createStyle("text",o)}),children:"\u6587\u672C"}),(0,E.jsx)(O,{small:!0,icon:"plus",onClick:()=>t?.({title:"\u521B\u5EFA\u6548\u679C\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:"Shadow/Card",onSubmit:o=>e.createStyle("effect",o)}),children:"\u6548\u679C"})]}),r.length>=6&&(0,E.jsx)("input",{type:"search",className:"dshc-search-input",placeholder:"\u641C\u7D22\u6837\u5F0F\u2026","aria-label":"\u641C\u7D22\u6837\u5F0F",value:i,onChange:o=>a(o.target.value)}),s&&c.length===0?(0,E.jsx)("div",{className:"dshc-muted dshc-pad",children:"\u65E0\u5339\u914D\u6837\u5F0F"}):d.map(([o,l])=>{let h=c.filter(u=>u.type===o);return s&&h.length===0?null:(0,E.jsxs)("div",{className:"dshc-panel-group",children:[(0,E.jsx)("div",{className:"dshc-panel-subtitle",children:l}),h.length===0?(0,E.jsx)("div",{className:"dshc-muted dshc-pad",children:"\u6682\u65E0\u6837\u5F0F"}):h.map(u=>{let f=zs(e,g=>o==="fill"&&g.fillStyleId===u.id||o==="text"&&g.textStyleId===u.id||o==="effect"&&g.effectStyleId===u.id),p=o==="fill"?xl(u.value):o==="text"?bl(u.value):vl(u.value);return(0,E.jsxs)("div",{className:"dshc-list-row dshc-style-row",draggable:!0,title:`${u.name}\uFF08\u70B9\u51FB\u5E94\u7528\u5230\u9009\u533A\uFF0C\u6216\u62D6\u5230\u753B\u5E03\u56FE\u5C42\u4E0A\uFF09`,onClick:()=>e.applyStyle(u.id),onDragStart:g=>{if(g.target?.closest?.("button, input")){g.preventDefault();return}g.dataTransfer.effectAllowed="copy",g.dataTransfer.setData(mn,u.id),g.dataTransfer.setData("text/plain",u.name),gn({kind:"style",id:u.id,name:u.name,styleType:u.type})},onDragEnd:()=>yt(),children:[(0,E.jsx)("span",{className:`dshc-style-swatch is-${o}`,style:p.swatchStyle,children:o==="text"?"Aa":null}),(0,E.jsxs)("div",{className:"dshc-template-info",children:[(0,E.jsx)("span",{className:"dshc-list-name",title:u.name,children:u.name}),(0,E.jsx)("span",{className:"dshc-style-meta",children:p.meta})]}),(0,E.jsx)("span",{className:"dshc-muted",children:`${f}`}),(0,E.jsx)(ie,{icon:"pencil",title:"\u91CD\u547D\u540D\u6837\u5F0F",size:13,onClick:g=>{g.stopPropagation(),t?.({title:"\u91CD\u547D\u540D\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:u.name,onSubmit:y=>e.renameStyle?.(u.id,y)})}}),(0,E.jsx)(ie,{icon:"check",title:"\u5E94\u7528\u5230\u9009\u533A",size:13,onClick:g=>{g.stopPropagation(),e.applyStyle(u.id)}}),(0,E.jsx)(ie,{icon:"ungroup",title:"\u89E3\u7ED1\u5F15\u7528",size:13,onClick:g=>{g.stopPropagation(),e.detachStyle(u.id)}}),(0,E.jsx)(ie,{icon:"trash",title:"\u5220\u9664\u6837\u5F0F",size:13,danger:!0,onClick:g=>{g.stopPropagation(),e.deleteStyle(u.id)}})]},u.id)})]},o)})]})}function Bs({store:e}){let t=e.state.doc,[n,i]=_e.useState(""),[a,r]=_e.useState("400"),[s,c]=_e.useState("normal"),[d,o]=_e.useState(null),[l,h]=_e.useState(!1),u=_e.useRef(null);if(!t)return null;let f=async()=>{if(!d||!n.trim()){e.toast("\u9009\u62E9\u5B57\u4F53\u6587\u4EF6\u5E76\u586B\u5199\u5BB6\u65CF\u540D");return}h(!0),await e.uploadFontFile(d,n.trim(),Number(a),s),h(!1),i(""),o(null),u.current&&(u.current.value="")};return(0,E.jsxs)("div",{className:"dshc-panel",children:[(0,E.jsxs)("div",{className:"dshc-panel-title",children:["\u5B57\u4F53",(0,E.jsx)("span",{className:"dshc-panel-count",children:t.fonts?.length??0})]}),(0,E.jsxs)("div",{className:"dshc-panel-group",children:[(0,E.jsx)("div",{className:"dshc-panel-subtitle",children:"\u4E0A\u4F20\u5B57\u4F53"}),(0,E.jsx)(oe,{label:"\u5B57\u4F53\u6587\u4EF6",wide:!0,children:(0,E.jsx)("input",{ref:u,type:"file",accept:".woff2,.woff,.ttf,.otf",onChange:p=>{let g=p.target.files?.[0]??null;o(g),g&&!n&&i(g.name.replace(/\.[^.]+$/,"").replace(/[-_](Regular|Medium|SemiBold|Bold|Light|Italic)$/i,""))}})}),(0,E.jsx)(oe,{label:"\u5BB6\u65CF\u540D",wide:!0,children:(0,E.jsx)("input",{className:"dshc-text-input",value:n,onChange:p=>i(p.target.value)})}),(0,E.jsxs)("div",{className:"dshc-grid-2",children:[(0,E.jsx)(oe,{label:"\u5B57\u91CD",children:(0,E.jsx)(De,{value:a,options:[100,200,300,400,500,600,700,800,900].map(p=>({value:String(p),label:String(p)})),onChange:r})}),(0,E.jsx)(oe,{label:"\u6837\u5F0F",children:(0,E.jsx)(De,{value:s,options:[{value:"normal",label:"\u5E38\u89C4"},{value:"italic",label:"\u659C\u4F53"}],onChange:c})})]}),(0,E.jsx)(O,{small:!0,primary:!0,icon:"upload",disabled:l||!d||!n.trim(),onClick:f,children:l?"\u4E0A\u4F20\u4E2D\u2026":"\u4E0A\u4F20\u5E76\u767B\u8BB0"}),(0,E.jsx)("div",{className:"dshc-help",children:"\u6587\u4EF6\u4FDD\u5B58\u5230 .dsh-canvas/fonts/\uFF0C\u5BA2\u6237\u7AEF @font-face \u52A0\u8F7D\uFF1B\u4E0D\u505A\u670D\u52A1\u7AEF\u8F6C\u6362\u6216\u5B50\u96C6\u5316\u3002"})]}),(0,E.jsxs)("div",{className:"dshc-panel-group",children:[(0,E.jsx)("div",{className:"dshc-panel-subtitle",children:"\u5DF2\u4E0A\u4F20"}),(t.fonts??[]).length===0?(0,E.jsx)("div",{className:"dshc-muted dshc-pad",children:"\u8FD8\u6CA1\u6709\u81EA\u5B9A\u4E49\u5B57\u4F53\uFF1B\u7CFB\u7EDF\u5B57\u4F53\u53EF\u76F4\u63A5\u4F7F\u7528\u3002"}):(t.fonts??[]).map(p=>(0,E.jsxs)("div",{className:"dshc-list-row",children:[(0,E.jsx)(Ne,{name:"fonts",size:13}),(0,E.jsx)("span",{className:"dshc-list-name",children:p.family}),(0,E.jsx)("span",{className:"dshc-muted",children:`${p.weight} ${p.style}`}),(0,E.jsx)(ie,{icon:"trash",title:"\u5220\u9664\u5B57\u4F53",size:13,danger:!0,onClick:()=>e.removeFont(p.id)})]},p.id))]})]})}function Hs({store:e}){let t=e.state.doc,[n,i]=_e.useState(!1),[a,r]=_e.useState(""),[s,c]=_e.useState(null);if(!t)return null;let d=(t.comments??[]).filter(o=>o.pageId===e.state.pageId&&(n||!o.resolved));return(0,E.jsxs)("div",{className:"dshc-panel",children:[(0,E.jsxs)("div",{className:"dshc-panel-title",children:["\u8BC4\u8BBA",(0,E.jsx)("span",{className:"dshc-panel-count",children:d.length})]}),(0,E.jsxs)("div",{className:"dshc-panel-actions",children:[(0,E.jsx)(O,{small:!0,icon:"comment",onClick:()=>e.setTool("comment"),children:"\u6DFB\u52A0\u8BC4\u8BBA"}),(0,E.jsx)(O,{small:!0,active:n,onClick:()=>i(!n),children:"\u5DF2\u89E3\u51B3"})]}),d.length===0?(0,E.jsx)(Wi,{icon:"comment",title:"\u6CA1\u6709\u8BC4\u8BBA",text:"\u7528\u8BC4\u8BBA\u5DE5\u5177\u70B9\u753B\u5E03\uFF0C\u6216\u9009\u4E2D\u5143\u7D20\u540E\u6DFB\u52A0\u3002"}):d.map(o=>{let l=kl(e,t,o.nodeId);return(0,E.jsxs)("div",{className:`dshc-comment-card ${o.resolved?"is-resolved":""}`,children:[(0,E.jsxs)("div",{className:"dshc-comment-card-head",children:[(0,E.jsx)("span",{className:"dshc-comment-author",children:o.figmaAuthor?o.figmaAuthor:o.author==="ai"?"AI":"\u4F60"}),o.source==="figma"?(0,E.jsx)("span",{className:"dshc-comment-badge",children:"\u6765\u81EA Figma"}):null,o.anchorState==="unanchored-needs-relocate"?(0,E.jsx)("span",{className:"dshc-comment-badge is-warn",children:"\u5F85\u5B9A\u4F4D"}):null,(0,E.jsx)("span",{className:"dshc-muted",title:o.nodeId?`${l} (${o.nodeId})`:"\u753B\u5E03",children:l}),o.resolved?(0,E.jsx)("span",{className:"dshc-muted",children:"\u5DF2\u89E3\u51B3"}):null]}),(0,E.jsx)("div",{className:"dshc-comment-card-body",children:o.body}),(o.replies??[]).map(h=>(0,E.jsxs)("div",{className:"dshc-comment-card-reply",children:[(0,E.jsx)("b",{children:h.author==="ai"?"AI":"\u4F60"}),h.body]},h.id)),s===o.id&&(0,E.jsxs)("div",{children:[(0,E.jsx)("textarea",{className:"dshc-comment-input",rows:2,value:a,onChange:h=>r(h.target.value),placeholder:"\u56DE\u590D\u2026"}),(0,E.jsxs)("div",{className:"dshc-row",children:[(0,E.jsx)(O,{small:!0,onClick:()=>{e.replyComment(o.id,a),r(""),c(null)},children:"\u53D1\u9001"}),(0,E.jsx)(O,{small:!0,onClick:()=>{c(null),r("")},children:"\u53D6\u6D88"})]})]}),(0,E.jsxs)("div",{className:"dshc-comment-card-actions",children:[(0,E.jsx)(O,{small:!0,onClick:()=>e.focusComment?.(o),children:"\u5B9A\u4F4D"}),(0,E.jsx)(O,{small:!0,onClick:()=>{c(s===o.id?null:o.id),r("")},children:"\u56DE\u590D"}),(0,E.jsx)(O,{small:!0,onClick:()=>e.resolveComment(o.id,!o.resolved),children:o.resolved?"\u91CD\u5F00":"\u89E3\u51B3"}),(0,E.jsx)(O,{small:!0,danger:!0,onClick:()=>e.deleteComment(o.id),children:"\u5220\u9664"})]})]},o.id)})]})}var st=null,Jn=0;function $l(){return st||(st=document.createElement("div"),st.className="dshc-tooltip",st.style.display="none",document.body.appendChild(st),st)}function Qt(){st&&(st.style.display="none")}function Os(){Jn+=1;let e=n=>{let i=n.target?.closest?.("[data-tip]");if(!i||!i.closest(".dshc-root")){Qt();return}let a=i.getAttribute("data-tip");if(!a)return;let r=i.getBoundingClientRect(),s=$l();s.textContent=a,s.style.display="block",s.style.left=`${Math.round(r.left+r.width/2)}px`,s.style.top=`${Math.round(r.bottom+7)}px`},t=n=>{n.target?.closest?.("[data-tip]")&&Qt()};return document.addEventListener("pointerover",e,!0),document.addEventListener("pointerout",t,!0),document.addEventListener("pointerdown",Qt,!0),window.addEventListener("scroll",Qt,!0),()=>{Jn-=1,document.removeEventListener("pointerover",e,!0),document.removeEventListener("pointerout",t,!0),document.removeEventListener("pointerdown",Qt,!0),window.removeEventListener("scroll",Qt,!0),Jn<=0&&(st?.remove(),st=null,Jn=0)}}var aa=`/* dsh-canvas chrome. Host theme tokens only; the design content owns its colors. */

.dshc-root {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-base, #f7f7f8);
  color: var(--dsw-alias-label-primary, #111);
  font: 12px/1.45 var(--dsw-font-family, system-ui, -apple-system, "PingFang SC", sans-serif);
  container-type: inline-size;
  --dshc-line: var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.08));
  --dshc-line-strong: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
  --dshc-hover: color-mix(in srgb, var(--dsw-alias-label-primary, #111) 7%, transparent);
  --dshc-accent: #4D6BFE;
  --dshc-accent-strong: #3D5AFE;
  --dshc-icon: color-mix(in srgb, var(--dsw-alias-label-primary) 62%, transparent);
  --dshc-active: color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent);
  --dshc-selected-bar: color-mix(in srgb, var(--dshc-accent) 45%, transparent);
  --dshc-muted: var(--dsw-alias-label-secondary, #667085);
  --dshc-raise: var(--dsw-alias-bg-layer-1, #fff);
  --dshc-overlay: var(--dsw-alias-bg-overlay, #fff);
}

.dshc-root *,
.dshc-root *::before,
.dshc-root *::after {
  box-sizing: border-box;
}

.dshc-root button {
  font: inherit;
  color: inherit;
}

.dshc-root input,
.dshc-root textarea,
.dshc-root select {
  font: inherit;
  color: var(--dsw-alias-label-primary);
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #fff) 70%, transparent);
  border: 1px solid var(--dshc-line);
  border-radius: 6px;
  outline: none;
}

.dshc-root input:focus,
.dshc-root textarea:focus,
.dshc-root select:focus {
  border-color: var(--dshc-accent);
}

.dshc-muted {
  color: var(--dshc-muted);
}

.dshc-pad {
  padding: 4px 8px;
}

.dshc-help {
  color: var(--dshc-muted);
  font-size: 11px;
  line-height: 1.5;
  padding: 4px 0;
}

.dshc-spacer {
  flex: 1 1 auto;
}

.dshc-divider {
  width: 1px;
  height: 18px;
  background: var(--dshc-line);
  margin: 0 3px;
  flex: none;
}

/* \u2500\u2500 topbar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.dshc-topbar {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px 5px;
  border-bottom: 1px solid var(--dshc-line);
  background: var(--dshc-raise);
  position: relative;
  z-index: 30;
}

.dshc-topbar-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.dshc-topbar-docs .dshc-select {
  max-width: 160px;
}

/* document picker */
.dshc-doc-picker {
  position: relative;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 200px;
}

.dshc-doc-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
  height: 28px;
  padding: 0 7px;
  border: 1px solid var(--dshc-line);
  border-radius: 7px;
  background: var(--dshc-raise);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.dshc-doc-trigger:hover {
  background: var(--dshc-hover);
}

.dshc-doc-trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-doc-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 80;
  min-width: 230px;
  max-width: 340px;
  max-height: 50vh;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--dshc-line-strong);
  border-radius: 9px;
  background: var(--dshc-overlay);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
}

.dshc-doc-row {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: 6px;
}

.dshc-doc-row:hover {
  background: var(--dshc-hover);
}

.dshc-doc-row.is-active {
  background: var(--dshc-accent);
  color: #fff;
}

.dshc-doc-open {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding: 6px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 11px;
  text-align: left;
  cursor: pointer;
}

.dshc-doc-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-doc-check-hidden {
  opacity: 0;
}

.dshc-doc-row .dshc-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex: none;
}

.dshc-doc-row.is-active .dshc-icon-btn {
  color: #fff;
}

.dshc-doc-row.is-active .dshc-icon-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}

.dshc-doc-empty {
  padding: 8px;
  color: var(--dshc-muted);
  font-size: 11px;
}

.dshc-topbar-tools {
  overflow: visible;
}

/* The tool strip scrolls on a narrow dock; the drawer toggle stays pinned to the
   toolbar's right edge, level with the rest of the row. */
.dshc-tools-scroll {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.dshc-tools-scroll::-webkit-scrollbar {
  display: none;
}

.dshc-topbar-end {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
}

.dshc-page-select {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.dshc-page-select .dshc-select {
  max-width: 96px;
}

.dshc-zoom-label {
  border: none;
  background: transparent;
  min-width: 44px;
  height: 28px;
  border-radius: 7px;
  color: var(--dshc-muted);
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}

.dshc-zoom-label:hover {
  background: var(--dshc-hover);
}

/* \u2500\u2500 buttons / controls \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.dshc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  border: 1px solid var(--dshc-line);
  border-radius: 7px;
  background: var(--dshc-raise);
  color: var(--dshc-muted);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.dshc-btn:hover {
  background: var(--dshc-hover);
  color: var(--dsw-alias-label-primary);
}

.dshc-btn.is-active {
  background: var(--dshc-active);
  border-color: color-mix(in srgb, var(--dshc-accent) 35%, transparent);
  color: var(--dshc-accent);
}

.dshc-btn.is-primary {
  background: var(--dshc-accent);
  border-color: var(--dshc-accent);
  color: #fff;
}

.dshc-btn.is-primary:hover {
  filter: brightness(1.05);
  color: #fff;
}

.dshc-btn.is-danger {
  color: var(--dsw-alias-state-error-primary, #dc2626);
}

.dshc-btn.is-small {
  height: 22px;
  padding: 0 7px;
  border-radius: 6px;
  font-size: 11.5px;
}

.dshc-btn:disabled {
  opacity: 0.42;
  cursor: default;
  pointer-events: none;
}

.dshc-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--dshc-icon);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}

.dshc-icon-btn:hover {
  background: var(--dshc-hover);
  color: var(--dsw-alias-label-primary);
}

.dshc-icon-btn.is-active {
  background: var(--dshc-hover);
  color: var(--dsw-alias-label-primary);
}

.dshc-icon-btn.is-danger:hover {
  color: var(--dsw-alias-state-error-primary);
}

.dshc-icon-btn:disabled {
  opacity: 0.35;
  pointer-events: none;
}

.dshc-toggle {
  width: 26px;
  height: 15px;
  border-radius: 999px;
  border: none;
  background: var(--dshc-line-strong);
  position: relative;
  cursor: pointer;
  flex: none;
  padding: 0;
}

.dshc-toggle.is-on {
  background: var(--dshc-accent);
}

.dshc-toggle-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.12s ease;
}

.dshc-toggle.is-on .dshc-toggle-dot {
  left: 13px;
}

.dshc-select {
  height: 24px;
  padding: 0 20px 0 7px;
  min-width: 0;
  cursor: pointer;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: calc(100% - 10px) 10px, calc(100% - 6px) 10px;
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
  font-size: 11px;
}

.dshc-text-input,
.dshc-name-input {
  height: 24px;
  width: 100%;
  padding: 0 7px;
  font-size: 11px;
}

.dshc-name-input {
  font-weight: 600;
  background: transparent;
  border-color: transparent;
}

.dshc-name-input:hover {
  border-color: var(--dshc-line);
}

.dshc-number {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  height: 24px;
  border: 1px solid var(--dshc-line);
  border-radius: 6px;
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #fff) 70%, transparent);
  overflow: hidden;
}

.dshc-number input {
  border: none;
  background: transparent;
  width: 100%;
  min-width: 0;
  height: 22px;
  padding: 0 5px;
  font-size: 11px;
  text-align: left;
}

.dshc-number-suffix {
  color: var(--dshc-muted);
  font-size: 10px;
  padding-right: 5px;
}

.dshc-color {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.dshc-color input[type="color"] {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 1px solid var(--dshc-line);
  padding: 0;
  background: transparent;
  cursor: pointer;
  flex: none;
}

.dshc-color-text {
  width: 72px;
  height: 20px;
  padding: 0 5px;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  text-transform: uppercase;
}

/* \u2500\u2500 layout chrome \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.dshc-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: stretch;
  position: relative;
  /* Panel slot geometry is shared with the drawer pulls. */
  --dshc-rail-w: 44px;
  --dshc-panel-w: 216px;
  --dshc-inspector-w: 236px;
}

.dshc-rail {
  flex: none;
  width: var(--dshc-rail-w);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border-right: 1px solid var(--dshc-line);
  background: var(--dshc-raise);
  z-index: 6;
}

.dshc-rail-item {
  position: relative;
}

.dshc-rail-divider {
  flex: none;
  width: 20px;
  height: 1px;
  margin: 3px 0;
  background: var(--dshc-line);
}

.dshc-rail .dshc-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
}

.dshc-badge {
  position: absolute;
  top: -2px;
  right: -3px;
  min-width: 12px;
  height: 12px;
  padding: 0 3px;
  border-radius: 999px;
  background: var(--dshc-accent);
  color: #fff;
  font-size: 8px;
  line-height: 12px;
  text-align: center;
}

.dshc-panel-wrap {
  flex: none;
  width: var(--dshc-panel-w);
  min-width: 0;
  border-right: 1px solid var(--dshc-line);
  background: var(--dshc-raise);
  overflow: auto;
  z-index: 5;
  animation: dshc-panel-slide-in-left 180ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

@keyframes dshc-panel-slide-in-left {
  from {
    opacity: 0.4;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes dshc-panel-slide-in-right {
  from {
    opacity: 0.4;
    transform: translateX(10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dshc-panel-wrap,
  .dshc-inspector {
    animation: none;
  }
}

.dshc-panel {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dshc-panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 4px;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.02em;
}

.dshc-panel-count {
  color: var(--dshc-muted);
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

.dshc-panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.dshc-panel-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 5px;
  border-top: 1px solid var(--dshc-line);
}

.dshc-panel-subtitle {
  font-size: 10px;
  color: var(--dshc-muted);
  padding: 2px 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dshc-list-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 4px;
  border-radius: 5px;
  min-width: 0;
}

.dshc-list-row:hover {
  background: var(--dshc-hover);
}

.dshc-list-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.dshc-list-row .dshc-icon-btn {
  width: 20px;
  height: 20px;
}

/* Variant sets, templates list & style dots */
.dshc-set-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 6px;
  border: 1px solid var(--dshc-line);
  border-radius: 7px;
  background: color-mix(in srgb, var(--dshc-raise) 75%, transparent);
  overflow: hidden;
  min-width: 0;
  cursor: grab;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dshc-set-card:hover {
  border-color: color-mix(in srgb, var(--dshc-accent) 55%, var(--dshc-line));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07);
}

.dshc-set-card:active {
  cursor: grabbing;
}

.dshc-set-card:last-child {
  margin-bottom: 0;
}

.dshc-set-body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px 7px 7px;
  min-width: 0;
}

.dshc-set-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-width: 0;
}

.dshc-set-header .dshc-icon-btn {
  width: 20px;
  height: 20px;
}

.dshc-collapse-toggle {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.dshc-collapse-toggle:hover {
  color: var(--dshc-accent);
}

.dshc-search-input {
  width: 100%;
  height: 24px;
  padding: 0 7px;
  border: 1px solid var(--dshc-line);
  border-radius: 6px;
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #fff) 72%, transparent);
  color: var(--dsw-alias-label-primary);
  font-size: 11px;
  transition: border-color 120ms ease;
}

.dshc-search-input::placeholder {
  color: var(--dshc-muted);
}

.dshc-search-input:focus {
  border-color: var(--dshc-accent);
}

.dshc-set-name {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-set-card .dshc-muted {
  font-size: 10px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-set-variants {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.dshc-variant-chip {
  appearance: none;
  display: inline-flex;
  align-items: center;
  height: 22px;
  max-width: 100%;
  padding: 0 7px;
  border: 1px solid var(--dshc-line);
  border-radius: 5px;
  background: var(--dshc-hover);
  color: inherit;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease, transform 80ms ease;
}

.dshc-variant-chip:hover {
  border-color: color-mix(in srgb, var(--dshc-accent) 55%, var(--dshc-line));
  background: color-mix(in srgb, var(--dshc-accent) 10%, var(--dshc-hover));
  color: var(--dshc-accent);
}

.dshc-variant-chip.is-active {
  border-color: color-mix(in srgb, var(--dshc-accent) 65%, var(--dshc-line));
  background: color-mix(in srgb, var(--dshc-accent) 16%, transparent);
  color: var(--dshc-accent);
  font-weight: 550;
}

.dshc-variant-chip:active {
  cursor: grabbing;
  transform: scale(0.97);
}

.dshc-component-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--dshc-line);
  border-radius: 7px;
  background: color-mix(in srgb, var(--dshc-raise) 75%, transparent);
  overflow: hidden;
  margin-bottom: 6px;
  min-width: 0;
  cursor: grab;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dshc-component-card:last-child {
  margin-bottom: 0;
}

.dshc-component-card:hover {
  border-color: color-mix(in srgb, var(--dshc-accent) 55%, var(--dshc-line));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07);
}

.dshc-component-card:active {
  cursor: grabbing;
}

.dshc-component-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 54px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--dshc-line);
  background-color: color-mix(in srgb, var(--dsw-alias-label-primary, #111) 6%, transparent);
  background-image: conic-gradient(
    color-mix(in srgb, var(--dsw-alias-label-primary, #111) 6%, transparent) 90deg,
    transparent 90deg 180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #111) 6%, transparent) 180deg 270deg,
    transparent 270deg
  );
  background-size: 12px 12px;
  overflow: hidden;
}

.dshc-component-thumb img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.dshc-component-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  min-width: 0;
}

.dshc-component-bar .dshc-icon-btn {
  width: 20px;
  height: 20px;
}

.dshc-variant-chip:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--dshc-accent) 50%, transparent);
  outline-offset: 1px;
}

.dshc-template-device {
  padding: 2px 4px 4px;
}

.dshc-template-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dshc-template-grid {
  display: grid;
  gap: 6px;
}

.dshc-template-grid.is-page {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dshc-template-grid.is-bar {
  grid-template-columns: minmax(0, 1fr);
}

.dshc-template-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--dshc-line);
  border-radius: 7px;
  background: color-mix(in srgb, var(--dshc-raise) 75%, transparent);
  overflow: hidden;
  min-width: 0;
  cursor: grab;
  transition: border-color 120ms ease, box-shadow 120ms ease, transform 100ms ease;
}

.dshc-template-card:hover {
  border-color: color-mix(in srgb, var(--dshc-accent) 55%, var(--dshc-line));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dshc-template-card:active {
  cursor: grabbing;
  transform: scale(0.985);
}

.dshc-template-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #111) 5%, transparent);
  border-bottom: 1px solid var(--dshc-line);
  overflow: hidden;
}

.dshc-template-thumb.is-page {
  aspect-ratio: 393 / 540;
}

.dshc-template-thumb.is-bar {
  min-height: 40px;
  max-height: 60px;
}

.dshc-template-thumb img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.14);
  pointer-events: none;
}

.dshc-template-foot {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  min-width: 0;
}

.dshc-template-foot .dshc-icon-btn {
  width: 20px;
  height: 20px;
  opacity: 0.65;
  transition: opacity 120ms ease;
}

.dshc-template-card:hover .dshc-template-foot .dshc-icon-btn {
  opacity: 1;
}

.dshc-template-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  min-width: 0;
  transition: background 120ms ease, border-color 120ms ease;
}

.dshc-template-row:hover {
  background: var(--dshc-hover);
  border-color: var(--dshc-line);
}

.dshc-template-info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.dshc-template-name {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-template-meta {
  font-size: 10px;
  color: var(--dshc-muted);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-style-dot {
  flex: 0 0 auto;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1px solid var(--dshc-line-strong);
  background: var(--dshc-hover);
}

.dshc-style-fill {
  background: var(--dshc-accent);
}

.dshc-style-text {
  border-radius: 3px;
  background: color-mix(in srgb, var(--dshc-muted) 25%, transparent);
}

.dshc-style-effect {
  background: radial-gradient(circle at 35% 35%, var(--dshc-overlay), color-mix(in srgb, var(--dshc-muted) 45%, transparent));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.dshc-style-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 5px;
  border-radius: 6px;
  min-width: 0;
  cursor: grab;
  transition: background 120ms ease;
}

.dshc-style-row:hover {
  background: var(--dshc-hover);
}

.dshc-style-row:active {
  cursor: grabbing;
  background: var(--dshc-active);
}

.dshc-style-row .dshc-icon-btn {
  width: 20px;
  height: 20px;
}

.dshc-style-swatch {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid var(--dshc-line-strong);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--dshc-hover);
  color: var(--dsw-alias-label-primary);
  font-size: 10px;
  font-weight: 600;
}

.dshc-style-swatch.is-fill {
  background: var(--dshc-accent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-label-primary, #111) 8%, transparent);
}

.dshc-style-swatch.is-text {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #111) 6%, transparent);
  font-size: 11px;
  letter-spacing: -0.02em;
}

.dshc-style-swatch.is-effect {
  background: var(--dshc-overlay);
  box-shadow: inset 0 0 0 1px var(--dshc-line), 0 2px 5px rgba(0, 0, 0, 0.16);
}

.dshc-style-meta {
  font-size: 10px;
  color: var(--dshc-muted);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 18px 10px;
  text-align: center;
  color: var(--dshc-muted);
}

.dshc-empty-panel-title {
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
  font-size: 11px;
}

.dshc-empty-panel-text {
  font-size: 10px;
  line-height: 1.5;
}

/* layers */
.dshc-layer-panel {
  padding: 5px 4px;
}

.dshc-layer-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  border-radius: 5px;
  padding-right: 4px;
  cursor: default;
  min-width: 0;
}

.dshc-layer-row:hover {
  background: var(--dshc-hover);
}

.dshc-layer-row.is-selected {
  background: var(--dshc-active);
}

.dshc-layer-row.is-primary {
  box-shadow: inset 2px 0 0 var(--dshc-selected-bar);
}

.dshc-layer-row.is-selected .dshc-icon-btn {
  color: var(--dsw-alias-label-primary);
}

.dshc-layer-caret {
  width: 12px;
  height: 16px;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--dshc-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.dshc-layer-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.dshc-layer-actions {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding-left: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, transparent, var(--dshc-hover) 14px);
  opacity: 0;
  pointer-events: none;
}

.dshc-layer-row.is-selected .dshc-layer-actions {
  background: linear-gradient(90deg, transparent, var(--dshc-active) 14px);
}

.dshc-layer-row:hover .dshc-layer-actions,
.dshc-layer-row.is-selected .dshc-layer-actions {
  opacity: 1;
  pointer-events: auto;
}

.dshc-layer-name {
  font-size: 11.5px;
}

.dshc-layer-actions .dshc-icon-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
}

.dshc-layer-row.is-hidden {
  opacity: 0.48;
}

.dshc-layer-row.is-locked {
  color: var(--dshc-muted);
}

.dshc-layer-status {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  padding-right: 2px;
  flex: none;
  color: var(--dshc-muted);
  transition: opacity 120ms ease;
}

.dshc-layer-row:hover .dshc-layer-status,
.dshc-layer-row.is-selected .dshc-layer-status {
  opacity: 0;
  pointer-events: none;
}

.dshc-layer-row.is-drop-before {
  position: relative;
}

.dshc-layer-row.is-drop-before::before {
  content: '';
  position: absolute;
  left: 6px;
  right: 4px;
  top: -1px;
  height: 2px;
  border-radius: 1px;
  background: var(--dshc-accent);
  pointer-events: none;
  z-index: 2;
}

.dshc-layer-row.is-drop-after {
  position: relative;
}

.dshc-layer-row.is-drop-after::after {
  content: '';
  position: absolute;
  left: 6px;
  right: 4px;
  bottom: -1px;
  height: 2px;
  border-radius: 1px;
  background: var(--dshc-accent);
  pointer-events: none;
  z-index: 2;
}

.dshc-layer-row.is-drop-inside {
  background: color-mix(in srgb, var(--dshc-accent) 14%, transparent);
  outline: 1.5px solid var(--dshc-accent);
  outline-offset: -1.5px;
}

/* inspector */
.dshc-inspector {
  flex: none;
  width: var(--dshc-inspector-w);
  border-left: 1px solid var(--dshc-line);
  background: var(--dshc-raise);
  overflow: auto;
  z-index: 5;
  animation: dshc-panel-slide-in-right 180ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.dshc-inspector-head {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 8px 3px;
}

.dshc-type-chip {
  flex: none;
  font-size: 9px;
  color: var(--dshc-muted);
  border: 1px solid var(--dshc-line);
  border-radius: 4px;
  padding: 1px 4px;
  text-transform: uppercase;
}

.dshc-section {
  border-top: 1px solid var(--dshc-line);
}

.dshc-section-head {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 27px;
  padding: 0 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
}

.dshc-section-head:hover {
  background: var(--dshc-hover);
}

.dshc-section-right {
  margin-left: auto;
  font-weight: 400;
  color: var(--dshc-muted);
  font-size: 10px;
}

.dshc-section-body {
  padding: 2px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dshc-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex-wrap: wrap;
}

.dshc-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 7px;
}

.dshc-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dshc-field.is-wide {
  grid-column: 1 / -1;
}

.dshc-field-label {
  color: var(--dshc-muted);
  font-size: 10px;
}

.dshc-textarea {
  width: 100%;
  padding: 5px 6px;
  resize: vertical;
  font-size: 11px;
  line-height: 1.45;
}

.dshc-align-grid {
  display: grid;
  grid-template-columns: repeat(5, 24px);
  gap: 3px;
}

.dshc-seg {
  display: flex;
  gap: 3px;
}

.dshc-seg .dshc-btn {
  flex: 1;
}

.dshc-fill-editor,
.dshc-effect-editor {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 5px;
  border: 1px solid var(--dshc-line);
  border-radius: 7px;
  margin-bottom: 4px;
}

.dshc-style-bound-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 6px;
  border: 1px solid color-mix(in srgb, var(--dshc-accent) 28%, var(--dshc-line));
  border-radius: 6px;
  background: color-mix(in srgb, var(--dshc-accent) 9%, transparent);
  font-size: 10.5px;
  line-height: 1.35;
  min-width: 0;
}

.dshc-style-bound-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-primary);
}

.dshc-style-bound-bar .dshc-btn {
  flex: none;
  height: 20px;
  padding: 0 6px;
  font-size: 10.5px;
}

.dshc-fill-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex-wrap: wrap;
}

.dshc-fill-row .dshc-select {
  flex: 1;
}

.dshc-fill-row .dshc-color {
  flex: 1;
}

.dshc-stop-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dshc-stop-row .dshc-color {
  flex: 1;
}

.dshc-stop-row .dshc-number {
  width: 58px;
}

.dshc-stat-line {
  font-size: 10px;
  color: var(--dshc-muted);
  line-height: 1.6;
  word-break: break-all;
}

.dshc-override-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 2px 0;
  font-size: 10px;
}

/* statusbar */
.dshc-statusbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-top: 1px solid var(--dshc-line);
  background: var(--dshc-raise);
  min-height: 32px;
  font-size: 10px;
  color: var(--dshc-muted);
}

.dshc-status-selection {
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-status-warn {
  color: var(--dsw-alias-state-warn-primary, #b45309);
}

/* canvas */
.dshc-canvas-wrap {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
}

.dshc-viewport {
  touch-action: none;
}

/* Bound scene painting to the visible viewport even when document coordinates
   span many screens. Screen-space controls and menus live outside this layer. */
.dshc-scene-surface {
  position: absolute;
  inset: 0;
  overflow: hidden;
  contain: strict;
  isolation: isolate;
}

.dshc-world {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}

.dshc-node {
  contain: layout style;
}

.dshc-text-lines {
  overflow: hidden;
}

.dshc-frame-label {
  letter-spacing: 0.01em;
}

.dshc-frame-label:hover {
  opacity: 1 !important;
}

.dshc-frame-label-input {
  height: 20px;
  min-width: 72px;
  max-width: 240px;
  padding: 0 5px;
  border: 1px solid var(--dshc-accent);
  border-radius: 4px;
  background: var(--dshc-overlay);
  color: var(--dsw-alias-label-primary);
  font: 500 11px/1.2 var(--dsw-font-family, system-ui, -apple-system, "PingFang SC", sans-serif);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshc-accent) 24%, transparent), 0 2px 8px rgba(0, 0, 0, 0.14);
  outline: none;
  z-index: 25;
}

.dshc-canvas-drop-overlay {
  position: absolute;
  inset: 10px;
  z-index: 35;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed var(--dshc-accent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--dshc-accent) 8%, transparent);
  color: var(--dshc-accent);
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
}

.dshc-canvas-drop-overlay > span,
.dshc-canvas-drop-overlay > div {
  padding: 6px 14px;
  border: 1px solid color-mix(in srgb, var(--dshc-accent) 40%, var(--dshc-line));
  border-radius: 999px;
  background: var(--dshc-overlay);
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14);
}

.dshc-hover-label {
  transform: translateY(-100%);
  background: var(--dshc-accent);
  color: #fff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  z-index: 8;
}

.dshc-overlay {
  z-index: 7;
}

.dshc-overlay [data-handle] {
  pointer-events: all;
}

.dshc-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--dshc-muted);
}

.dshc-empty-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}

.dshc-empty-text {
  font-size: 11px;
}

.dshc-spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--dshc-line-strong);
  border-top-color: var(--dshc-accent);
  animation: dshc-spin 0.8s linear infinite;
}

@keyframes dshc-spin {
  to {
    transform: rotate(360deg);
  }
}

.dshc-loading,
.dshc-crashed {
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
}

.dshc-crash-title {
  font-size: 13px;
  font-weight: 650;
}

.dshc-crash-message {
  max-width: 100%;
  max-height: 160px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--dshc-line);
  border-radius: 7px;
  background: var(--dshc-raise);
  color: var(--dsw-alias-state-error-primary);
  font: 10px/1.5 ui-monospace, Menlo, monospace;
  white-space: pre-wrap;
  text-align: left;
}

/* text editor */
.dshc-text-editor {
  z-index: 20;
}

/* comments */
.dshc-comment-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  padding: 0;
  border-radius: 50% 50% 50% 2px;
  border: 1.5px solid var(--dshc-accent);
  background: var(--dshc-overlay);
  color: var(--dshc-accent);
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  z-index: 12;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}

.dshc-comment-pin-ai {
  border-color: var(--dsw-alias-state-success-primary, #059669);
  color: var(--dsw-alias-state-success-primary, #059669);
}

.dshc-comment-popover {
  position: absolute;
  z-index: 20;
  width: 232px;
  max-height: 340px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--dshc-line-strong);
  border-radius: 9px;
  background: var(--dshc-overlay);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dshc-comment-title {
  font-weight: 650;
  font-size: 11px;
}

.dshc-comment-author {
  font-size: 10px;
  color: var(--dshc-accent);
  font-weight: 600;
}

.dshc-comment-body {
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.dshc-comment-reply {
  font-size: 10px;
  line-height: 1.5;
  border-left: 2px solid var(--dshc-line-strong);
  padding-left: 6px;
  color: var(--dshc-muted);
}

.dshc-comment-reply b {
  color: var(--dsw-alias-label-primary);
  margin-right: 4px;
}

.dshc-comment-input {
  width: 100%;
  padding: 4px 6px;
  resize: vertical;
  font-size: 11px;
}

.dshc-comment-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.dshc-comment-card {
  border: 1px solid var(--dshc-line);
  border-radius: 7px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dshc-comment-card.is-resolved {
  opacity: 0.6;
}

.dshc-comment-card-head {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
}

.dshc-comment-card-body {
  font-size: 11px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.dshc-comment-card-reply {
  font-size: 10px;
  color: var(--dshc-muted);
  border-left: 2px solid var(--dshc-line-strong);
  padding-left: 6px;
}

.dshc-comment-card-reply b {
  color: var(--dsw-alias-label-primary);
  margin-right: 4px;
}

.dshc-comment-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

/* crop */
.dshc-crop-bar {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border: 1px solid var(--dshc-line-strong);
  border-radius: 9px;
  background: var(--dshc-overlay);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  z-index: 25;
  font-size: 10px;
}

.dshc-crop-bar label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--dshc-muted);
}

.dshc-crop-bar input {
  width: 54px;
  height: 22px;
  padding: 0 4px;
  font-size: 10px;
}

/* toast / conflict / banner */
.dshc-toast {
  position: absolute;
  left: 50%;
  bottom: 46px;
  transform: translateX(-50%);
  z-index: 40;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-bg-base);
  font-size: 11px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-width: 80%;
}

.dshc-toast.is-error {
  background: var(--dsw-alias-state-error-primary, #dc2626);
  color: #fff;
}

.dshc-conflict,
.dshc-banner {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  font-size: 11px;
  border-bottom: 1px solid var(--dshc-line);
}

.dshc-conflict {
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #b45309) 12%, transparent);
  color: var(--dsw-alias-state-warn-primary, #b45309);
}

.dshc-banner {
  background: color-mix(in srgb, var(--dshc-accent) 10%, transparent);
}

.dshc-path-input {
  width: 100%;
  min-height: 90px;
  resize: vertical;
  padding: 6px 7px;
  font: 10px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
  border: 1px solid var(--dshc-line);
  border-radius: 7px;
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #fff) 70%, transparent);
  color: var(--dsw-alias-label-primary);
}

/* code preview */
.dshc-code {
  max-height: 220px;
  overflow: auto;
  margin: 0;
  padding: 8px;
  border: 1px solid var(--dshc-line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent);
  color: var(--dsw-alias-label-primary);
  font: 10px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre;
  tab-size: 2;
}

/* template device selector */
.dshc-template-device {
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.dshc-template-device .dshc-field-label {
  flex: none;
}
.dshc-template-device .dshc-select {
  min-width: 0;
}

/* context menu */
.dshc-viewport > .dshc-context-menu {
  max-height: min(70vh, calc(100% - 16px));
  overscroll-behavior: contain;
}

.dshc-context-menu {
  position: absolute;
  z-index: 60;
  min-width: 218px;
  max-height: 70vh;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--dshc-line-strong);
  border-radius: 10px;
  background: var(--dshc-overlay);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
  color: var(--dsw-alias-label-primary);
  font: 12px/1.4 var(--dsw-font-family, system-ui, -apple-system, "PingFang SC", sans-serif);
  outline: none;
}

.dshc-context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.dshc-context-item:hover:not(:disabled) {
  background: var(--dshc-hover);
}

.dshc-context-item:disabled {
  opacity: 0.38;
  cursor: default;
}

.dshc-context-item.is-danger {
  color: var(--dsw-alias-state-error-primary, #b3261e);
}

.dshc-context-label {
  flex: 1;
  white-space: nowrap;
}

.dshc-context-shortcut {
  color: var(--dshc-muted);
  font-size: 10px;
}



/* modal dialogs */
.dshc-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, #0b1220 34%, transparent);
}

.dshc-modal {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 48px);
  max-height: min(78vh, 620px);
  border: 1px solid var(--dshc-line-strong);
  border-radius: 14px;
  background: var(--dshc-overlay);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
  color: var(--dsw-alias-label-primary);
  font: 12px/1.5 var(--dsw-font-family, system-ui, -apple-system, "PingFang SC", sans-serif);
  overflow: hidden;
}

.dshc-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 10px 10px 16px;
  border-bottom: 1px solid var(--dshc-line);
  font-size: 13px;
  font-weight: 600;
}

.dshc-modal-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  overflow: auto;
}

.dshc-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px 14px;
}

.dshc-dialog-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dshc-dialog-field > span {
  color: var(--dshc-muted);
  font-size: 11px;
}

.dshc-dialog-field input {
  height: 30px;
  padding: 0 9px;
  border: 1px solid var(--dshc-line-strong);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
}

.dshc-dialog-field input:focus {
  outline: 2px solid color-mix(in srgb, #4D6BFE 45%, transparent);
  outline-offset: -1px;
}

/* export dialog */
.dshc-export-section {
  margin-top: 4px;
  color: var(--dshc-muted);
  font-size: 11px;
}

.dshc-export-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.dshc-export-grid > * {
  justify-content: center;
}

.dshc-export-hint {
  margin-top: 4px;
  color: var(--dshc-muted);
  font-size: 11px;
  line-height: 1.6;
}


/* hover labels */
.dshc-tooltip {
  position: fixed;
  z-index: 200;
  transform: translateX(-50%);
  padding: 3px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, #0b1220 90%, transparent);
  color: #fff;
  font: 11px/1.45 var(--dsw-font-family, system-ui, -apple-system, "PingFang SC", sans-serif);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

/* Icons are flex items in every row; without this they shrink when hover
   actions appear, which reads as a zoom-out. */
.dshc-root svg {
  flex: 0 0 auto;
}

/* Interaction focus uses the existing inspector slot and theme. */
.dshc-inspector-shell {
  display: flex;
  flex: none;
  flex-direction: column;
  width: var(--dshc-inspector-w);
  min-width: 0;
  border-left: 1px solid var(--dshc-line);
  background: var(--dshc-raise);
  z-index: 5;
}

.dshc-inspector-shell > .dshc-inspector {
  flex: 1 1 auto;
  width: 100%;
  border: 0;
  animation: none;
}

.dshc-inspector-tabs {
  display: flex;
  flex: none;
  gap: 3px;
  padding: 6px;
  border-bottom: 1px solid var(--dshc-line);
}

.dshc-inspector-tabs button {
  flex: 1;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  white-space: nowrap;
  cursor: pointer;
}

.dshc-inspector-tabs button:hover,
.dshc-interaction-card:hover {
  background: var(--dshc-hover);
}

.dshc-inspector-tabs button[aria-pressed="true"] {
  background: var(--dshc-active);
  font-weight: 650;
}

.dshc-interaction-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  min-height: 0;
  overflow: auto;
}

.dshc-interaction-anchor {
  position: sticky;
  z-index: 1;
  top: -8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 0 8px;
  border-bottom: 1px solid var(--dshc-line);
  background: var(--dshc-raise);
}

.dshc-interaction-anchor > span,
.dshc-interaction-event > span,
.dshc-interaction-empty {
  color: var(--dshc-muted);
  font-size: 11px;
}

.dshc-interaction-anchor strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-interaction-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.dshc-interaction-card {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) 13px;
  gap: 8px;
  align-items: start;
  flex: none;
  width: 100%;
  padding: 6px;
  border: 1px solid var(--dshc-line);
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.dshc-interaction-card.is-viewed {
  border-color: var(--dshc-accent);
  background: var(--dshc-active);
}

.dshc-interaction-card:focus-visible,
.dshc-inspector-tabs button:focus-visible {
  outline: 2px solid var(--dshc-accent);
  outline-offset: 1px;
}

.dshc-interaction-thumb {
  display: grid;
  place-items: center;
  height: 74px;
  border-radius: 5px;
  overflow: hidden;
  background: var(--dshc-hover);
  color: var(--dshc-muted);
  pointer-events: none;
}

.dshc-interaction-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.dshc-interaction-mini {
  display: block;
  position: relative;
  overflow: hidden;
}

.dshc-interaction-mini > span {
  position: absolute;
  transform-origin: top left;
  inset: 0;
}

.dshc-interaction-detail {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-wrap: anywhere;
}

.dshc-interaction-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 5px;
}

.dshc-interaction-meta,
.dshc-interaction-event-heading {
  color: var(--dshc-muted);
  font-size: 10px;
}

.dshc-interaction-type {
  padding: 1px 5px;
  border: 1px solid var(--dshc-line);
  border-radius: 4px;
  background: var(--dshc-hover);
  color: var(--dsw-alias-label-primary, #111);
}

.dshc-interaction-event {
  font-size: 11px;
}

.dshc-interaction-event > span {
  margin-right: 5px;
}

.dshc-interaction-empty {
  margin: 4px 0;
}

.dshc-text[data-interaction-emphasis] .dshc-text-lines {
  text-shadow: 0.35px 0 currentColor;
}

.dshc-line[data-interaction-emphasis] {
  filter: drop-shadow(0 0 1px currentColor);
}

@container (max-width: 690px) {
  .dshc-body:has(.dshc-inspector-shell) {
    --dshc-panel-w: clamp(90px, 25cqw, 216px);
    --dshc-inspector-w: clamp(130px, 39cqw, 236px);
  }

  .dshc-interaction-card {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 6px;
  }

  .dshc-interaction-card > svg {
    display: none;
  }
}

.dshc-interaction-card { position: relative; }
.dshc-preview-link { position: absolute; inset: 0; width: 100%; border: 0; border-radius: inherit; background: transparent; cursor: pointer; }
.dshc-preview-link:focus-visible { outline: 2px solid var(--dshc-accent); }
.dshc-interaction-detail button.dshc-interaction-event {
  position: relative;
  border: 0;
  padding: 2px 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.dshc-interaction-event:hover, .dshc-interaction-event[aria-pressed="true"] { color: var(--dshc-accent); }
.dshc-path[data-active-connection] svg path { stroke: var(--dshc-accent); stroke-width: 3; }
.dshc-line[data-active-connection] { outline: 2px solid var(--dshc-accent); }

/* Page switcher + Figma sync dialog + comment badges */
.dshc-page-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--dshc-line);
}
.dshc-page-select,
.dshc-page-input {
  flex: 1;
  min-width: 0;
  height: 26px;
  padding: 0 6px;
  border: 1px solid var(--dshc-line);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
}
.dshc-page-input:focus {
  outline: 2px solid color-mix(in srgb, #4D6BFE 45%, transparent);
  outline-offset: -1px;
}
.dshc-figma-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.dshc-figma-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dshc-figma-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--dshc-line);
  border-radius: 8px;
}
.dshc-figma-card p {
  margin: 0;
  font-size: 12px;
}
.dshc-figma-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dshc-figma-row .dshc-input {
  flex: 1;
  min-width: 140px;
}
.dshc-input {
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--dshc-line);
  border-radius: 6px;
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #fff) 75%, transparent);
  color: var(--dsw-alias-label-primary);
  font-size: 11.5px;
  line-height: 1.4;
  min-width: 0;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.dshc-input::placeholder {
  color: var(--dshc-muted);
}
.dshc-input:focus {
  border-color: var(--dshc-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshc-accent) 22%, transparent);
}
select.dshc-input {
  cursor: pointer;
}
.dshc-figma-btn {
  border-color: color-mix(in srgb, var(--dshc-accent) 32%, var(--dshc-line));
  background: color-mix(in srgb, var(--dshc-accent) 8%, var(--dshc-raise));
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
  padding: 0 8px;
}
.dshc-figma-btn svg {
  color: var(--dshc-accent);
}
.dshc-figma-btn:hover {
  border-color: color-mix(in srgb, var(--dshc-accent) 52%, var(--dshc-line));
  background: color-mix(in srgb, var(--dshc-accent) 14%, var(--dshc-raise));
  color: var(--dshc-accent);
}
.dshc-figma-btn.is-active {
  border-color: var(--dshc-accent);
  background: color-mix(in srgb, var(--dshc-accent) 18%, var(--dshc-raise));
  color: var(--dshc-accent);
}
.dshc-figma-code {
  display: block;
  padding: 5px 8px;
  border-radius: 6px;
  background: var(--dshc-hover);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  word-break: break-all;
}
.dshc-figma-auth-ok {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}
.dshc-figma-banner {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 8px;
}
.dshc-figma-banner.is-error {
  background: color-mix(in srgb, #ef4444 14%, transparent);
  color: #dc2626;
}
.dshc-figma-banner.is-ok {
  background: color-mix(in srgb, #10b981 14%, transparent);
  color: #059669;
}
.dshc-figma-diff {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--dshc-line);
  border-radius: 8px;
  font-size: 12px;
}
.dshc-figma-diff-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dshc-figma-diff-row.is-conflict {
  justify-content: space-between;
  padding: 4px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, #f59e0b 14%, transparent);
}
.dshc-comment-badge {
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background: color-mix(in srgb, #6366f1 16%, transparent);
  color: #4f46e5;
}
.dshc-comment-badge.is-warn {
  background: color-mix(in srgb, #f59e0b 18%, transparent);
  color: #b45309;
}

/* Interactive connector banner & self-explanatory flow panel */
.dshc-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 15px;
  height: 15px;
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dshc-accent) 16%, transparent);
  color: var(--dshc-accent);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.dshc-connect-banner {
  position: absolute;
  left: 50%;
  top: 10px;
  transform: translateX(-50%);
  z-index: 24;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 24px);
  padding: 5px 10px;
  border: 1px solid color-mix(in srgb, var(--dshc-accent) 45%, var(--dshc-line));
  border-radius: 999px;
  background: color-mix(in srgb, var(--dshc-overlay) 92%, transparent);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14);
  color: var(--dsw-alias-label-primary);
  font-size: 11px;
  white-space: nowrap;
  pointer-events: auto;
}

.dshc-connect-banner-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dshc-accent);
  flex: none;
}

.dshc-connect-banner-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.dshc-connect-banner-exit {
  border: none;
  border-radius: 999px;
  padding: 2px 7px;
  background: var(--dshc-hover);
  color: var(--dshc-muted);
  font-size: 10.5px;
  cursor: pointer;
}

.dshc-connect-banner-exit:hover {
  background: var(--dshc-active);
  color: var(--dsw-alias-label-primary);
}

.dshc-interaction-intro {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px 0;
}

.dshc-interaction-intro-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--dsw-alias-label-primary);
}

.dshc-interaction-intro-head svg {
  color: var(--dshc-accent);
}

.dshc-interaction-tips {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 8px;
  border-radius: 7px;
  background: var(--dshc-hover);
  color: var(--dshc-muted);
  font-size: 10.5px;
  line-height: 1.5;
}

.dshc-interaction-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--dshc-line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--dshc-raise) 75%, transparent);
}

.dshc-interaction-form-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-interaction-event-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.dshc-interaction-event-row .dshc-interaction-event {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dshc-interaction-event-ops {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  flex: none;
  opacity: 0.72;
}

.dshc-interaction-event-row:hover .dshc-interaction-event-ops {
  opacity: 1;
}

.dshc-interaction-event-ops .dshc-icon-btn {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}

.dshc-interaction-all-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px solid var(--dshc-line);
}

.dshc-interaction-all-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid var(--dshc-line);
  border-radius: 6px;
  min-width: 0;
}

.dshc-interaction-all-row:hover {
  background: var(--dshc-hover);
}

.dshc-interaction-all-jump {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: none;
  padding: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.dshc-interaction-all-route {
  font-size: 11px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dshc-interaction-all-row .dshc-icon-btn {
  width: 20px;
  height: 20px;
}
`;var ot=require("react/jsx-runtime"),Il=[["layers","layers","\u56FE\u5C42"],["components","component","\u7EC4\u4EF6"],["templates","template","\u6A21\u677F"],["styles","styles","\u6837\u5F0F"],["fonts","fonts","\u5B57\u4F53"],["comments","comment","\u8BC4\u8BBA"]],qn=class extends G.Component{constructor(t){super(t),this.state={error:null}}static getDerivedStateFromError(t){return{error:t}}componentDidCatch(t,n){console.error("[dsh-canvas] panel crashed",t),wt({phase:"panel-crash",message:String(t?.message??t),stack:String(t?.stack??""),componentStack:String(n?.componentStack??"")})}render(){return this.state.error?G.createElement("div",{className:"dshc-root dshc-crashed"},G.createElement("div",{className:"dshc-crash-title"},"\u753B\u5E03\u9762\u677F\u51FA\u9519\u4E86"),G.createElement("pre",{className:"dshc-crash-message"},String(this.state.error?.message??this.state.error)),G.createElement("button",{type:"button",className:"dshc-btn is-primary",onClick:()=>this.setState({error:null})},"\u91CD\u8BD5")):this.props.children}};function ra({sessionId:e,inputActions:t}){let n=G.useRef(null);(!n.current||n.current.sessionId!==e)&&(n.current=new zn({sessionId:e,inputActions:t,onToast:void 0}));let i=n.current;i.inputActions=t,G.useSyncExternalStore(i.subscribe,i.getVersion);let[a,r]=G.useState(null),[s,c]=G.useState(null),d=i.state,o=G.useRef(null),l=xs(i,o),h=G.useMemo(()=>(0,ot.jsx)(gs,{store:i,interactions:l.presentation,interactionDestination:l.destination}),[i,l.presentation,l.destination,d.scene,d.name,d.selection,d.primaryKey,d.tool,d.editingText,d.enteredInstance,d.crop,d.crop?.crop,d.commentDraft,d.showComments,d.doc?.comments,d.pageId,i.clipboard]);G.useEffect(()=>Os(),[]),G.useEffect(()=>{wt({phase:"panel-mount",sessionId:e,width:i.canvasSize?.width??null}),i.mount();let I=j=>{j&&(j.sessionId&&e&&j.sessionId!==e||i.focusNode(j).catch(P=>console.warn("[dsh-canvas] focus failed",P)))},M=Vi(e);M&&I(M);let T=ns(j=>{j.sessionId&&e&&j.sessionId!==e||(Vi(e),I(j))});return()=>{T(),wt({phase:"panel-unmount",sessionId:e}),i.unmount()}},[i]),G.useEffect(()=>{if(!s)return;let I=T=>{T.type==="pointerdown"&&T.target?.closest?.(".dshc-context-menu")||c(null)},M=T=>{T.key==="Escape"&&(T.preventDefault(),T.stopPropagation(),c(null))};return window.addEventListener("pointerdown",I,!0),window.addEventListener("wheel",I,{capture:!0,passive:!0}),window.addEventListener("keydown",M,!0),()=>{window.removeEventListener("pointerdown",I,!0),window.removeEventListener("wheel",I,!0),window.removeEventListener("keydown",M,!0)}},[s]);let u=I=>r(I),f=(I,M)=>{i.state.selection.includes(M.key)||i.setSelection([M.key]),c({x:Math.min(Math.max(8,I.clientX),Math.max(8,(window.innerWidth??1200)-240)),y:Math.min(Math.max(8,I.clientY),Math.max(8,(window.innerHeight??800)-440)),node:M})},p=i.state.panel,g=G.useRef(p??"layers");p&&(g.current=p);let y=()=>i.setPanel(p?null:g.current),A=()=>{d.inspectorOpen=!d.inspectorOpen,i.emit()},k=(d.doc?.comments??[]).filter(I=>!I.resolved&&I.pageId===d.pageId);if(d.loading||!d.ready)return G.createElement("div",{className:"dshc-root dshc-loading"},G.createElement("style",null,aa),d.error?G.createElement(G.Fragment,null,G.createElement("div",{className:"dshc-crash-title"},"\u65E0\u6CD5\u6253\u5F00\u753B\u5E03"),G.createElement("pre",{className:"dshc-crash-message"},d.error),G.createElement("button",{type:"button",className:"dshc-btn is-primary",onClick:()=>i.bootstrap()},"\u91CD\u8BD5")):G.createElement(G.Fragment,null,G.createElement("div",{className:"dshc-spinner"}),G.createElement("div",{className:"dshc-muted"},"\u6B63\u5728\u6253\u5F00\u753B\u5E03\u2026")));let N=d.componentMode?d.doc.components.find(I=>I.id===d.componentMode.componentId):null;return G.createElement("div",{className:"dshc-root"},G.createElement("style",null,aa),G.createElement(ks,{store:i,inspectorOpen:d.inspectorOpen,onToggleInspector:A,connections:l,onNewDoc:()=>u({title:"\u65B0\u5EFA\u8BBE\u8BA1\u7A3F",label:"\u6587\u6863\u540D\uFF08\u5C0F\u5199 slug\uFF09",defaultValue:`canvas-${(d.docs?.length??0)+1}`,onSubmit:I=>i.createDoc(I)}),onNeedName:u,onRenameDoc:(I=i.state.name)=>u({title:"\u91CD\u547D\u540D\u8BBE\u8BA1\u7A3F",label:"\u6587\u6863\u540D\uFF08\u5C0F\u5199 slug\uFF09",defaultValue:I,onSubmit:M=>i.renameDoc(M,I)}),onDeleteDoc:()=>{typeof window<"u"&&!window.confirm(`\u5220\u9664\u8BBE\u8BA1\u7A3F\u300C${i.state.name}\u300D\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`)||i.deleteDoc()}}),N&&G.createElement("div",{className:"dshc-banner"},G.createElement(Ne,{name:"component",size:14}),G.createElement("span",null,`\u6B63\u5728\u7F16\u8F91\u7EC4\u4EF6\uFF1A${N.name}`),G.createElement(O,{small:!0,onClick:()=>i.exitComponentMode()},"\u8FD4\u56DE\u753B\u5E03")),d.conflict&&G.createElement("div",{className:"dshc-conflict"},G.createElement("span",null,d.conflict.message??"\u753B\u5E03\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"),G.createElement(O,{small:!0,onClick:()=>i.resolveConflict(!0)},"\u52A0\u8F7D\u6700\u65B0"),G.createElement(O,{small:!0,onClick:()=>i.resolveConflict(!1)},"\u4FDD\u7559\u672C\u5730\u5E76\u8986\u76D6")),G.createElement("div",{className:"dshc-body"},G.createElement("div",{className:"dshc-rail"},G.createElement(ie,{icon:"panelLeft",size:22,title:p?"\u6536\u8D77\u62BD\u5C49":"\u5C55\u5F00\u62BD\u5C49",active:!!p,onClick:y}),G.createElement("span",{className:"dshc-rail-divider"}),Il.map(([I,M,T])=>G.createElement("div",{key:I,className:"dshc-rail-item"},G.createElement(ie,{icon:M,title:T,size:22,active:p===I,onClick:()=>i.setPanel(p===I?null:I)}),I==="comments"&&k.length?G.createElement("span",{className:"dshc-badge"},k.length>9?"9+":k.length):null))),p&&G.createElement("div",{className:"dshc-panel-wrap"},p==="layers"&&G.createElement(Ns,{store:i,onRename:I=>u({title:"\u91CD\u547D\u540D\u56FE\u5C42",label:"\u540D\u79F0",defaultValue:I.name,onSubmit:M=>i.renameNode(I.sourceId,M)}),onRowContextMenu:f}),p==="components"&&G.createElement(Ts,{store:i,onNeedName:u}),p==="templates"&&G.createElement(Fs,{store:i}),p==="styles"&&G.createElement(Ls,{store:i,onNeedName:u}),p==="fonts"&&G.createElement(Bs,{store:i,onNeedName:u}),p==="comments"&&G.createElement(Hs,{store:i})),G.createElement("div",{className:"dshc-canvas-wrap",ref:o},h),d.inspectorOpen&&(l.available?(0,ot.jsxs)("div",{className:"dshc-inspector-shell",children:[(0,ot.jsxs)("nav",{className:"dshc-inspector-tabs","aria-label":"\u53F3\u4FA7\u9762\u677F",children:[(0,ot.jsx)("button",{type:"button","aria-pressed":l.tab==="properties",onClick:()=>l.setTab("properties"),children:"\u5C5E\u6027"}),(0,ot.jsxs)("button",{type:"button","aria-pressed":l.tab==="interactions",onClick:()=>l.setTab("interactions"),children:["\u4EA4\u4E92\u6D41\u7A0B",l.totalEdges>0&&(0,ot.jsx)("span",{className:"dshc-tab-count",children:l.totalEdges})]})]}),l.tab==="interactions"?(0,ot.jsx)(vs,{scope:l.scope,focused:l.focused,viewed:l.viewed,allEdges:l.allEdges,store:i,previewNode:l.previewNode,onVisit:l.visit,activeEdge:l.activeEdge,onVisitStart:l.visitStart,onFocus:l.toggle,onReturn:l.returnToFocus,onExit:l.exit}):(0,ot.jsx)(ta,{store:i,onNameDialog:u})]}):G.createElement(ta,{store:i,onNameDialog:u}))),G.createElement("div",{className:"dshc-statusbar"},G.createElement("span",{className:"dshc-status-selection"},d.selection.length?`\u5DF2\u9009 ${d.selection.length} \u4E2A \xB7 ${i.primaryNode()?.name??""}`:"\u672A\u9009\u62E9 \xB7 \u753B\u5E03"),G.createElement("span",{className:"dshc-spacer"}),d.sceneIssues?.length?G.createElement("span",{className:"dshc-status-warn",title:d.sceneIssues.join(`
`)},`${d.sceneIssues.length} \u4E2A\u8B66\u544A`):null,G.createElement("span",{className:"dshc-muted"},d.dirty?"\u672A\u4FDD\u5B58":d.saving?"\u4FDD\u5B58\u4E2D\u2026":"\u5DF2\u4FDD\u5B58"),G.createElement("span",{className:"dshc-muted"},(0,ot.jsx)(Zi,{store:i})),G.createElement(O,{small:!0,primary:d.selection.length>0,onClick:()=>i.insertSelectionToComposer(),disabled:!d.selection.length},"\u63D2\u5165\u5230\u5BF9\u8BDD"),G.createElement(O,{small:!0,icon:"sparkle",onClick:()=>i.insertPrompt()},"\u8BA9 AI \u751F\u6210")),d.notice&&G.createElement("div",{className:`dshc-toast ${d.notice.kind==="error"?"is-error":""}`},d.notice.text),s&&G.createElement(On,{fixed:!0,x:s.x,y:s.y,items:[{label:"\u91CD\u547D\u540D",icon:"text",action:()=>{let I=s.node;I&&u({title:"\u91CD\u547D\u540D\u56FE\u5C42",label:"\u540D\u79F0",defaultValue:I.name,onSubmit:M=>i.renameNode(I.sourceId,M)})}},{label:"\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D",icon:"fit",action:()=>i.zoomToSelection()},{separator:!0},...Vn(i)],onClose:()=>c(null)}),a&&G.createElement(ls,{title:a.title,label:a.label,defaultValue:a.defaultValue,onCancel:()=>r(null),onSubmit:I=>{r(null),a.onSubmit?.(I)}}))}var Xs="@local/dsh-canvas",yn="dsh-canvas",Nl={"tab.title":"Drafi","guide.title":"Drafi","guide.description":"AI \u539F\u751F\u8BBE\u8BA1\u753B\u5E03\uFF1A\u53EF\u89C6\u5316\u8BBE\u8BA1 UI \u7A3F\uFF0C\u9009\u533A\u63D2\u5165\u5BF9\u8BDD\uFF0CAI \u53EF\u901A\u8FC7 .dsh-canvas/*.canvas.json \u751F\u6210\u4E0E\u4FEE\u6539\u3002","dock.open":"\u6253\u5F00 Drafi","dock.close":"\u6536\u8D77 Drafi"},Cl={"tab.title":"Drafi","guide.title":"Drafi","guide.description":"An AI-native design canvas: design UI mockups, send selections to the composer, and let the AI edit .dsh-canvas/*.canvas.json.","dock.open":"Open Drafi","dock.close":"Hide Drafi"};function Qn({size:e=18}){return Ie.createElement("img",{src:da,width:e,height:e,alt:"","aria-hidden":!0,draggable:!1,style:{display:"block",flexShrink:0,objectFit:"contain"}})}function Ml(e){return Ie.createElement(qn,null,Ie.createElement(ra,{sessionId:e.sessionId,inputActions:e.inputActions}))}function Pl(e){let[t,n]=Ie.useState(!1);return Ie.createElement("div",{style:{border:"1px solid var(--dsw-alias-border-l1)",borderRadius:10,background:"var(--dsw-alias-bg-layer-1)",overflow:"hidden",margin:"4px 0"},"data-dsh-canvas":"dock"},Ie.createElement("button",{type:"button",onClick:()=>n(i=>!i),style:{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"7px 10px",border:"none",background:"transparent",color:"var(--dsw-alias-label-primary)",cursor:"pointer",font:"inherit"}},Ie.createElement(Qn,{size:15}),Ie.createElement("span",{style:{fontWeight:600}},e.title??"Drafi"),Ie.createElement("span",{style:{marginLeft:"auto",color:"var(--dsw-alias-label-secondary)",fontSize:11}},t?e.closeLabel:e.openLabel)),t&&Ie.createElement("div",{style:{height:"60vh",minHeight:320,borderTop:"1px solid var(--dsw-alias-border-l1)"}},Ie.createElement(ra,{sessionId:e.sessionId,inputActions:e.inputActions})))}function Al({node:e,raw:t,interactive:n,openCanvas:i}){let a=e?.data??{},r=()=>{!n||typeof i!="function"||i(a)};return Ie.createElement("span",{role:n?"button":void 0,tabIndex:n?0:void 0,title:t??a.label??"\u753B\u5E03",onClick:r,onKeyDown:s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),r())},style:{display:"inline-flex",alignItems:"center",gap:4,margin:"0 2px",padding:"1px 6px",borderRadius:5,border:"1px solid var(--dsw-alias-border-l1)",background:"color-mix(in srgb, #4D6BFE 10%, transparent)",color:"var(--dsw-alias-label-primary)",fontSize:"0.94em",lineHeight:1.5,verticalAlign:"baseline",cursor:n?"pointer":"default"}},Ie.createElement(Qn,{size:13}),Ie.createElement("span",null,a.label??"\u753B\u5E03"))}function Dl(e,t){e.inject(["uiConversation"],n=>{n.effect(()=>n.uiConversation.userText.register(Br),"dsh-canvas: user text rule");try{n.effect(()=>n.slots.inject("conversation.user.text.node",()=>n.slots.register({name:"conversation.user.text.node",key:"dsh-canvas",priority:120,inject:i=>({openCanvas:a=>{try{t.openTab("canvas")}catch(r){console.warn("[dsh-canvas] openTab from reference failed",r)}Xi({...a,sessionId:i})}})},Al)),"dsh-canvas: user text chip")}catch(i){console.warn("[dsh-canvas] could not register the in-chat canvas link renderer",i),wt({phase:"user-text-chip-failed",message:String(i instanceof Error?i.message:i)})}})}function Fl({sessionId:e,nav:t}){let[n,i]=Ie.useState(()=>Mn(e));if(Ie.useEffect(()=>(i(Mn(e)),Xr(()=>i(Mn(e)))),[e]),!n)return null;let a=()=>{try{t.openTab("canvas")}catch(d){console.warn("[dsh-canvas] openTab from selection dock failed",d)}Xi({...n,sessionId:e})},r="var(--dsh-composer-side-clearance, 16px)",s="var(--dsh-composer-dock-inset, 8px)";return Ie.createElement("div",{style:{boxSizing:"border-box",display:"flex",justifyContent:"flex-start",width:`calc(100% - ${r} * 2 - ${s} * 2)`,maxWidth:`calc(var(--dsh-composer-card-max-width, 780px) - ${s} * 2)`,margin:"0 auto",padding:`0 ${s}`,flex:"none"}},Ie.createElement("div",{style:{display:"inline-flex",minWidth:0,alignItems:"center",gap:6,maxWidth:"100%",padding:"2px 8px",border:"1px solid color-mix(in srgb, #4D6BFE 16%, transparent)",borderRadius:999,background:"color-mix(in srgb, #4D6BFE 7%, transparent)",color:"var(--dsw-alias-label-primary)",font:"12px/1.5 var(--dsw-font-family, system-ui, sans-serif)"}},Ie.createElement("button",{type:"button",onClick:a,title:"\u6253\u5F00\u753B\u5E03\u5E76\u5B9A\u4F4D\u5230\u8BE5\u8282\u70B9",style:{display:"flex",alignItems:"center",gap:5,minWidth:0,padding:0,border:"none",background:"transparent",color:"#4D6BFE",cursor:"pointer",font:"inherit"}},Ie.createElement(Qn,{size:14}),Ie.createElement("span",{style:{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},`\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D\uFF1A${n.label}`)),Ie.createElement("button",{type:"button",title:"\u5173\u95ED","aria-label":"\u5173\u95ED",onClick:()=>Or(e),style:{border:"none",background:"transparent",color:"var(--dsw-alias-label-secondary)",cursor:"pointer",font:"inherit"}},"\xD7")))}var zl="dsh-canvas",Tl=["slots","locale"];function Ll(e){wt({phase:"client-apply",href:typeof location>"u"?null:location.href}),typeof window<"u"&&(window.addEventListener("error",s=>{wt({phase:"window-error",message:String(s.message??""),stack:String(s.error?.stack??"")})}),window.addEventListener("unhandledrejection",s=>{wt({phase:"unhandled-rejection",message:String(s.reason?.message??s.reason??"")})})),e.effect(()=>e.locale.register(yn,{zh:Nl,en:Cl}),"dsh-canvas: locale");let t=e.locale.bind(yn),n=(s,c)=>{c.effect(()=>s.register({id:Xs,kind:"canvas",priority:"extension",title:()=>t("tab.title"),guide:[{id:"canvas",order:30,title:()=>t("guide.title"),description:()=>t("guide.description"),icon:Qn}],keepMounted:!0}),"dsh-canvas: tab type"),c.effect(()=>c.slots.inject("sidebar.right.pane.tab",()=>c.slots.register({name:"sidebar.right.pane.tab",key:Xs,locale:yn},Ml)),"dsh-canvas: tab body"),c.inject(["sidebarRight"],d=>{let o=d.sidebarRight;!o||typeof o.openTab!="function"||(Dl(d,o),d.effect(()=>d.slots.inject("conversation.input.dock",()=>d.slots.register({name:"conversation.input.dock",id:"dsh-canvas-selection",order:55,locale:yn},l=>Ie.createElement(Fl,{sessionId:l.sessionId,nav:o}))),"dsh-canvas: selection dock"))})},i=()=>{let s=null;return e.effect(()=>(s=e.slots.inject("conversation.input.dock",()=>e.slots.register({name:"conversation.input.dock",id:"dsh-canvas-dock",order:45,locale:yn},c=>Ie.createElement(Pl,{sessionId:c.sessionId,inputActions:c.inputActions,openLabel:t("dock.open"),closeLabel:t("dock.close"),title:t("tab.title")}))),()=>{s?.(),s=null}),"dsh-canvas: inline dock"),()=>{s?.(),s=null}},a=e.get("sidebarRightTabs");if(a&&typeof a.register=="function"){n(a,e);return}let r=i();e.inject(["sidebarRightTabs"],s=>{r();let c=s.sidebarRightTabs;!c||typeof c.register!="function"||n(c,s)})}

    return module.exports;
  },
});
