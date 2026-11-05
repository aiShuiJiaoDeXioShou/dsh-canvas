/* @local/dsh-canvas v0.2.0 — built 2026-11-05T11:21:16.080Z */
window.__ModuleLoader__.load({
  id: "@local/dsh-canvas",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
var Ta=Object.create;var wt=Object.defineProperty;var Pa=Object.getOwnPropertyDescriptor;var Da=Object.getOwnPropertyNames;var La=Object.getPrototypeOf,Oa=Object.prototype.hasOwnProperty;var Fn=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(i){throw n=[i],i}};var Wt=(e,t)=>{for(var n in t)wt(e,n,{get:t[n],enumerable:!0})},Tn=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of Da(t))!Oa.call(e,a)&&a!==n&&wt(e,a,{get:()=>t[a],enumerable:!(i=Pa(t,a))||i.enumerable});return e};var Oe=(e,t,n)=>(n=e!=null?Ta(La(e)):{},Tn(t||!e||!e.__esModule?wt(n,"default",{value:e,enumerable:!0}):n,e)),Ha=e=>Tn(wt({},"__esModule",{value:!0}),e);var Xi={};Wt(Xi,{buildSvg:()=>cr});function Yi(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Nt(e){return Yi(e).replace(/'/g,"&#39;")}function Wi(e){return!e||e.type!=="solid"?"none":e.color??"#000000"}function ar(e,t){if(e.type==="linear-gradient"){let i=(e.stops??[]).map(c=>`<stop offset="${c.position}" stop-color="${c.color}"/>`).join(""),a=(Number(e.angle)||0)*Math.PI/180,s=.5-Math.cos(a)/2,r=.5-Math.sin(a)/2,l=.5+Math.cos(a)/2,o=.5+Math.sin(a)/2;return`<linearGradient id="${t}" x1="${s}" y1="${r}" x2="${l}" y2="${o}">${i}</linearGradient>`}let n=(e.stops??[]).map(i=>`<stop offset="${i.position}" stop-color="${i.color}"/>`).join("");return`<radialGradient id="${t}" cx="${e.center?.x??.5}" cy="${e.center?.y??.5}" r="${e.radius??.7}">${n}</radialGradient>`}function sr(e,t,n){if(!e)return"none";if(e.type==="solid")return Wi(e);if(e.type==="linear-gradient"||e.type==="radial-gradient"){let i=`grad-${n}`;return t.push(ar(e,i)),`url(#${i})`}return"none"}function rr(e){return e?` stroke="${e.color??"#000000"}" stroke-width="${e.width??1}"`:""}function or(e,t,n){let i=(e??[]).filter(l=>l.visible!==!1);if(!i.length)return"";let a=`fx-${n}`,s=[],r=0;for(let l of i)l.type==="layer-blur"&&(r+=Number(l.radius)||0),l.type==="drop-shadow"&&s.push(`<feDropShadow dx="${l.x??0}" dy="${l.y??0}" stdDeviation="${(Number(l.blur)||0)/2}" flood-color="${l.color??"#00000040"}"/>`);return r>0&&s.unshift(`<feGaussianBlur stdDeviation="${r/2}"/>`),s.length?(t.push(`<filter id="${a}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">${s.join("")}</filter>`),` filter="url(#${a})"`):""}function ji(e){return`<rect ${e}/>`}function gn(e,t,n){if(!e||e.visible===!1)return"";let{defs:i,assets:a,keyPrefix:s,clip:r}=t,l=e.absX-(n?.x??0),o=e.absY-(n?.y??0),c=`translate(${l} ${o})${e.rotation?` rotate(${e.rotation} ${e.width/2} ${e.height/2})`:""}`,d=`${s}-${e.key}`,u=or(e.effects,i,d),p=e.opacity==null?1:e.opacity;if(e.type==="group")return`<g transform="${c}" opacity="${p}">${(e.children??[]).map(x=>gn(x,t,{x:e.absX,y:e.absY})).join("")}</g>`;let w=`clip-${d}`,v="";if(e.clip&&e.children?.length){let x=e.type==="ellipse"?Math.min(e.width,e.height)/2:e.cornerRadius??0;i.push(`<clipPath id="${w}"><rect width="${e.width}" height="${e.height}" rx="${x}" ry="${x}"/></clipPath>`),v=` clip-path="url(#${w})"`}let k=[],A=e.type==="ellipse"?Math.min(e.width,e.height)/2:e.cornerRadius??0;if(e.type==="text"){let x=e.font??{},P=(x.size??14)*(x.lineHeight??1.4),_=e.lines??[],C=Wi(e.fills?.[0]),q=e.align??"left",le=q==="center"?"middle":q==="right"?"end":"start",ke=q==="center"?e.width/2:q==="right"?e.width:0,pe=_.length*P,Ee=e.verticalAlign==="center"?(e.height-pe)/2:e.verticalAlign==="bottom"?e.height-pe:0,Ae=_.length?_.map((we,D)=>`<text x="${ke}" y="${Ee+P*(D+.8)}" font-family="${Nt(`'${x.family??"system-ui"}'`)}" font-size="${x.size??14}" font-weight="${x.weight??400}" font-style="${x.style??"normal"}" letter-spacing="${x.letterSpacing??0}" fill="${C==="none"?"transparent":C}" text-anchor="${le}" xml:space="preserve">${Yi(we.text||" ")}</text>`).join(""):"";return k.push(`<g transform="${c}" opacity="${p}"${u}>${Ae}</g>`),k.join("")}let H=`x="0" y="0" width="${e.width}" height="${e.height}"`;for(let x of e.fills??[]){if(x.type==="image"){let _=a.get(x.asset);if(!_)continue;let C=x.crop;if(C){let q=`crop-${d}`;i.push(`<clipPath id="${q}"><rect width="${e.width}" height="${e.height}" rx="${A}" ry="${A}"/></clipPath>`),k.push(`<image href="${Nt(_)}" x="${-C.x*e.width/C.width}" y="${-C.y*e.height/C.height}" width="${e.width/C.width}" height="${e.height/C.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${q})"/>`)}else k.push(`<image href="${Nt(_)}" ${H} preserveAspectRatio="xMidYMid slice"${A?` rx="${A}"`:""}/>`);continue}let P=sr(x,i,`${d}-${k.length}`);e.type==="ellipse"?k.push(`<ellipse cx="${e.width/2}" cy="${e.height/2}" rx="${e.width/2}" ry="${e.height/2}" fill="${P}"/>`):e.type==="line"?k.push(`<line x1="0" y1="0" x2="${e.width}" y2="0"${rr(e.strokes?.[0])}/>`):k.push(ji(`width="${e.width}" height="${e.height}" rx="${A}" ry="${A}" fill="${P}"`))}if(e.type==="line"){let x=e.strokes?.[0];k.push(`<line x1="0" y1="0" x2="${e.width}" y2="0" stroke="${x?.color??"#111111"}" stroke-width="${x?.width??1}"/>`)}if((e.strokes??[]).length&&e.type!=="line")for(let x of e.strokes){let P=x.color??"#000000";e.type==="ellipse"?k.push(`<ellipse cx="${e.width/2}" cy="${e.height/2}" rx="${Math.max(0,e.width/2-(x.width??1)/2)}" ry="${Math.max(0,e.height/2-(x.width??1)/2)}" fill="none" stroke="${P}" stroke-width="${x.width??1}"/>`):k.push(ji(`width="${e.width}" height="${e.height}" rx="${A}" ry="${A}" fill="none" stroke="${P}" stroke-width="${x.width??1}"`))}if((e.children??[]).length){let x=e.children.map(P=>gn(P,t,{x:e.absX,y:e.absY})).join("");k.push(`<g${v}>${x}</g>`)}return`<g transform="${c}" opacity="${p}"${u} data-node="${Nt(e.key)}">${k.join("")}</g>`}function Vi(e,t){for(let n of e.fills??[])n.type==="image"&&n.asset&&t.add(n.asset);for(let n of e.children??[])Vi(n,t)}function _i(e,t){e.type==="text"&&e.font?.family&&t.add(`${e.font.family}::${e.font.weight??400}::${e.font.style??"normal"}`);for(let n of e.children??[])_i(n,t)}async function cr(e,t={}){let n=(e?.roots??[]).filter(x=>t.nodeKeys?t.nodeKeys.includes(x.key):!0),i=t.nodeKeys?.length&&e?.byKey?t.nodeKeys.map(x=>e.byKey.get(x)).filter(Boolean):n,a=i.length?i:n,s=new Map,r=new Set,l=new Set;for(let x of a)Vi(x,r),_i(x,l);if(t.resolveAsset)for(let x of r)try{s.set(x,await t.resolveAsset(x))}catch{}let o=[],c=[];for(let x of l){let[P,_,C]=x.split("::"),q=(t.fonts??[]).find(le=>le.family===P&&String(le.weight)===_&&(le.style??"normal")===C);if(!(!q||!t.resolveFont))try{let le=await t.resolveFont(q),ke=q.asset.split(".").pop().toLowerCase();c.push(`@font-face{font-family:'${P.replace(/'/g,"\\'")}';src:url('${le}') format('${ir[ke]??"truetype"}');font-weight:${_};font-style:${C};}`)}catch{}}let d=Math.min(...a.map(x=>x.absX)),u=Math.min(...a.map(x=>x.absY)),p=Math.max(...a.map(x=>x.absX+x.width)),w=Math.max(...a.map(x=>x.absY+x.height)),v=Math.max(1,p-d),k=Math.max(1,w-u),A={defs:o,assets:s,keyPrefix:"n",clip:!0},H=a.map(x=>{let P={...x,absX:x.absX-d,absY:x.absY-u};return gn(P,A,{x:0,y:0})}).join("");return`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${v}" height="${k}" viewBox="0 0 ${v} ${k}">
<defs>${o.join("")}</defs>
${c.length?`<style>${c.join("")}</style>`:""}
${t.background?`<rect width="${v}" height="${k}" fill="${t.background}"/>`:""}
${H}
</svg>`}var ir,Gi=Fn(()=>{ir={woff2:"woff2",woff:"woff",ttf:"truetype",otf:"opentype"}});var Ki={};Wt(Ki,{svgToPng:()=>lr});function lr(e,t=2){return new Promise((n,i)=>{let a=new Blob([e],{type:"image/svg+xml;charset=utf-8"}),s=URL.createObjectURL(a),r=new Image;r.onload=()=>{try{let l=Math.max(1,Math.round((r.naturalWidth||1)*t)),o=Math.max(1,Math.round((r.naturalHeight||1)*t));if(l*o>64e6)throw new Error("\u5BFC\u51FA\u5C3A\u5BF8\u8FC7\u5927");let c=document.createElement("canvas");c.width=l,c.height=o;let d=c.getContext("2d");d.scale(t,t),d.drawImage(r,0,0),n(c.toDataURL("image/png"))}catch(l){i(l)}finally{URL.revokeObjectURL(s)}},r.onerror=()=>{URL.revokeObjectURL(s),i(new Error("SVG \u6805\u683C\u5316\u5931\u8D25"))},r.src=s})}var Ui=Fn(()=>{});var Ur={};Wt(Ur,{apply:()=>Kr,inject:()=>Gr,name:()=>Xr});module.exports=Ha(Ur);var K=Oe(require("react"),1);var M=Oe(require("react"),1);var Bn="dsh.canvas";var Fe={nodes:2e3,components:200,styles:500,comments:1e3,fonts:50,depth:32,textLength:1e4,docBytes:8388608,imageBytes:20971520,fontBytes:10485760},Ba=["frame","group","rect","ellipse","line","text","instance"],ja=["solid","linear-gradient","radial-gradient","image"],Ya=["drop-shadow","inner-shadow","layer-blur","background-blur"],Wa=["fill","text","effect"],Va=["left","center","right","justify"],_a=["top","center","bottom"],Xa=["horizontal","vertical"],Ga=["start","center","end","space-between"],Ka=["start","center","end","stretch"],Pn=["fixed","hug","fill"],Ua=["cover","contain","fill"],jn=["normal","italic"],Dn=["user","ai"],Ja=/^[A-Za-z0-9_-]{1,64}$/;var Za=/^assets\/[A-Za-z0-9._-]{1,120}$/,qa=/^fonts\/[A-Za-z0-9._-]{1,120}$/,Qa=/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,N=class extends Error{constructor(t,n,i="invalid-document"){super(`${t}: ${n}`),this.name="CanvasError",this.path=t,this.code=i}};function se(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function es(e){if(typeof structuredClone=="function")try{return structuredClone(e)}catch{}return JSON.parse(JSON.stringify(e))}function ne(e,t,n={}){let{min:i=-1e6,max:a=1e6,int:s=!1}=n;if(typeof e!="number"||!Number.isFinite(e))throw new N(t,"expected a finite number");if(s&&Math.round(e)!==e)throw new N(t,"expected an integer");if(e<i||e>a)throw new N(t,`expected a number in [${i}, ${a}]`);return e}function ze(e,t){return ne(e,t,{min:0,max:1,int:!1})}function lt(e,t){if(typeof e!="string"||!Qa.test(e))throw new N(t,"expected a color like #RRGGBB or #RRGGBBAA");return e.toUpperCase()}function ge(e,t){if(typeof e!="string"||!Ja.test(e))throw new N(t,"expected an id matching ^[A-Za-z0-9_-]{1,64}$");return e}function xe(e,t,n){if(typeof e!="string"||!n.includes(e))throw new N(t,`expected one of ${n.map(i=>JSON.stringify(i)).join(", ")}`);return e}var Vt=0;function ie(e="n"){Vt=(Vt+1)%16777215;let t=Math.floor(Math.random()*16777215).toString(36);return`${e}_${Date.now().toString(36)}${Vt.toString(36)}${t}`.slice(0,64)}function ts(e){return typeof e=="string"&&Za.test(e)&&!e.includes("..")}function ns(e){return typeof e=="string"&&qa.test(e)&&!e.includes("..")}var Ke=()=>new Date().toISOString();function Yn(e="\u4E3B\u753B\u5E03",t=ie("doc")){return{format:Bn,version:1,id:t,title:e,pages:[{id:ie("page"),name:"Page 1",background:null,children:[]}],components:[],variantSets:[],styles:[],fonts:[],comments:[],meta:{createdAt:Ke(),updatedAt:Ke()}}}function Xt(e,t){if(!se(e))throw new N(t,"expected an object");let n=xe(e.type,`${t}.type`,ja),i={...e,type:n};if(n==="solid")return i.color=lt(e.color,`${t}.color`),i.opacity=e.opacity==null?1:ze(e.opacity,`${t}.opacity`),i;if(n==="linear-gradient")return i.angle=e.angle==null?180:ne(e.angle,`${t}.angle`,{min:-3600,max:3600}),i.stops=Ln(e.stops,`${t}.stops`),i;if(n==="radial-gradient")return i.center={x:e.center?.x==null?.5:ze(e.center.x,`${t}.center.x`),y:e.center?.y==null?.5:ze(e.center.y,`${t}.center.y`)},i.radius=e.radius==null?.7:ze(e.radius,`${t}.radius`),i.stops=Ln(e.stops,`${t}.stops`),i;if(!ts(e.asset))throw new N(`${t}.asset`,"expected assets/<file>");if(i.asset=e.asset,i.fit=e.fit==null?"cover":xe(e.fit,`${t}.fit`,Ua),e.crop!=null){if(!se(e.crop))throw new N(`${t}.crop`,"expected an object");let a={x:ze(e.crop.x??0,`${t}.crop.x`),y:ze(e.crop.y??0,`${t}.crop.y`),width:ze(e.crop.width??1,`${t}.crop.width`),height:ze(e.crop.height??1,`${t}.crop.height`)};if(a.width<=0||a.height<=0)throw new N(`${t}.crop`,"crop size must be positive");if(a.x+a.width>1.000001||a.y+a.height>1.000001)throw new N(`${t}.crop`,"crop must stay inside the image");i.crop=a}return i}function Ln(e,t){if(!Array.isArray(e)||e.length<2||e.length>32)throw new N(t,"expected 2-32 gradient stops");return e.map((n,i)=>{if(!se(n))throw new N(`${t}[${i}]`,"expected an object");return{position:ze(n.position,`${t}[${i}].position`),color:lt(n.color,`${t}[${i}].color`)}})}function is(e,t){if(!se(e))throw new N(t,"expected an object");let n=xe(e.type,`${t}.type`,Ya),i={...e,type:n,visible:e.visible!==!1};return n==="layer-blur"||n==="background-blur"?(i.radius=ne(e.radius??4,`${t}.radius`,{min:0,max:200}),i):(i.x=ne(e.x??0,`${t}.x`,{min:-1e3,max:1e3}),i.y=ne(e.y??0,`${t}.y`,{min:-1e3,max:1e3}),i.blur=ne(e.blur??0,`${t}.blur`,{min:0,max:500}),i.spread=ne(e.spread??0,`${t}.spread`,{min:-500,max:500}),i.color=lt(e.color??"#00000040",`${t}.color`),i)}function On(e,t){if(typeof e!="string"||!e.trim()||e.length>64)throw new N(t,"expected a non-empty label of at most 64 characters");return e.trim()}function Hn(e,t){if(e==null)return[];if(!Array.isArray(e)||e.length>8)throw new N(t,"expected at most 8 strokes");return e.map((n,i)=>{if(!se(n))throw new N(`${t}[${i}]`,"expected an object");return{...n,color:lt(n.color??"#000000",`${t}[${i}].color`),width:ne(n.width??1,`${t}[${i}].width`,{min:0,max:200}),align:n.align==null?"center":xe(n.align,`${t}[${i}].align`,["center","inside","outside"])}})}function as(e,t){if(e!=null){if(!se(e))throw new N(t,"expected an object");return{h:xe(e.h??"fixed",`${t}.h`,Pn),v:xe(e.v??"fixed",`${t}.v`,Pn)}}}function ss(e,t){if(e==null)return;if(!se(e))throw new N(t,"expected an object");let n=e.padding??{};return{...e,direction:xe(e.direction??"vertical",`${t}.direction`,Xa),gap:ne(e.gap??0,`${t}.gap`,{min:0,max:1e4}),padding:{top:ne(n.top??0,`${t}.padding.top`,{min:0,max:1e4}),right:ne(n.right??0,`${t}.padding.right`,{min:0,max:1e4}),bottom:ne(n.bottom??0,`${t}.padding.bottom`,{min:0,max:1e4}),left:ne(n.left??0,`${t}.padding.left`,{min:0,max:1e4})},alignPrimary:xe(e.alignPrimary??"start",`${t}.alignPrimary`,Ga),alignCounter:xe(e.alignCounter??"start",`${t}.alignCounter`,Ka)}}function Wn(e,t){let n=se(e)?e:{};return{...n,family:typeof n.family=="string"&&n.family.trim()?n.family.trim().slice(0,120):"system-ui",weight:Math.round(ne(n.weight??400,`${t}.weight`,{min:100,max:900})/100)*100,style:xe(n.style??"normal",`${t}.style`,jn),size:ne(n.size??14,`${t}.size`,{min:1,max:1e3}),lineHeight:ne(n.lineHeight??1.4,`${t}.lineHeight`,{min:.5,max:10}),letterSpacing:ne(n.letterSpacing??0,`${t}.letterSpacing`,{min:-50,max:200})}}function rs(e,t){if(!se(e))throw new N(t,"expected an object");let n={...e};if("text"in n&&(typeof n.text!="string"||n.text.length>Fe.textLength))throw new N(`${t}.text`,"expected a short string");if("visible"in n&&typeof n.visible!="boolean")throw new N(`${t}.visible`,"expected a boolean");if("fills"in n){if(!Array.isArray(n.fills)||n.fills.length>8)throw new N(`${t}.fills`,"expected an array");n.fills=n.fills.map((i,a)=>Xt(i,`${t}.fills[${a}]`))}return n}function Gt(e,t,n,i){if(n>Fe.depth)throw new N(t,`node nesting exceeds ${Fe.depth}`);if(!se(e))throw new N(t,"expected a node object");if(i.count+=1,i.count>Fe.nodes)throw new N(t,`document exceeds ${Fe.nodes} nodes`);let a=xe(e.type,`${t}.type`,Ba),s={...e,type:a};if(s.id=ge(e.id,`${t}.id`),i.ids.has(s.id))throw new N(`${t}.id`,`duplicate id "${s.id}"`);if(i.ids.add(s.id),s.name=typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):os(a),s.x=ne(e.x??0,`${t}.x`),s.y=ne(e.y??0,`${t}.y`),s.width=ne(e.width??cs(a),`${t}.width`,{min:0,max:1e6}),s.height=ne(e.height??ls(a),`${t}.height`,{min:0,max:1e6}),s.rotation=ne(e.rotation??0,`${t}.rotation`,{min:-36e3,max:36e3}),s.opacity=ze(e.opacity??1,`${t}.opacity`),s.visible=e.visible!==!1,s.locked=e.locked===!0,s.layoutSizing=as(e.layoutSizing,`${t}.layoutSizing`),a==="frame"||a==="group"){if(s.children=[],Array.isArray(e.children))for(let r=0;r<e.children.length;r+=1)s.children.push(Gt(e.children[r],`${t}.children[${r}]`,n+1,i))}else s.children=void 0;if((a==="frame"||a==="rect"||a==="ellipse")&&(s.fills=vt(e.fills,`${t}.fills`),!s.fills.length&&e.fills==null&&e.fillStyleId==null&&(s.fills=[{type:"solid",color:a==="frame"?"#FFFFFF":"#D9D9D9"}]),s.strokes=Hn(e.strokes,`${t}.strokes`),s.effects=_t(e.effects,`${t}.effects`),s.cornerRadius=ne(e.cornerRadius??0,`${t}.cornerRadius`,{min:0,max:1e6})),a==="instance"&&(s.fills=void 0,s.strokes=void 0,s.effects=void 0,s.cornerRadius=e.cornerRadius==null?void 0:ne(e.cornerRadius,`${t}.cornerRadius`,{min:0,max:1e6})),(a==="group"||a==="line")&&(s.fills=void 0,s.strokes=void 0,s.effects=void 0,s.cornerRadius=void 0),a==="line"&&(s.strokes=Hn(e.strokes,`${t}.strokes`),s.strokes.length||(s.strokes=[{color:"#111111",width:1,align:"center"}]),s.fills=void 0,s.effects=void 0,s.height=0),a==="text"&&(s.text=typeof e.text=="string"?e.text.slice(0,Fe.textLength):"",s.font=Wn(e.font,`${t}.font`),s.align=xe(e.align??"left",`${t}.align`,Va),s.verticalAlign=xe(e.verticalAlign??"top",`${t}.verticalAlign`,_a),s.fills=vt(e.fills,`${t}.fills`),!s.fills.length&&e.fills==null&&e.fillStyleId==null&&(s.fills=[{type:"solid",color:"#111111"}]),s.effects=_t(e.effects,`${t}.effects`),s.autoHeight=e.autoHeight!==!1),a==="frame"&&(s.clip=e.clip!==!1,s.layout=ss(e.layout,`${t}.layout`),e.backgroundColor!=null&&(s.fills=vt(e.fills??[{type:"solid",color:e.backgroundColor}],`${t}.fills`))),a==="instance"&&(s.componentId=ge(e.componentId,`${t}.componentId`),s.variantProps=Vn(e.variantProps,`${t}.variantProps`),s.overrides={},e.overrides!=null)){if(!se(e.overrides))throw new N(`${t}.overrides`,"expected an object");for(let[r,l]of Object.entries(e.overrides))s.overrides[ge(r,`${t}.overrides key`)]=rs(l,`${t}.overrides.${r}`)}return e.fillStyleId!=null&&(s.fillStyleId=ge(e.fillStyleId,`${t}.fillStyleId`)),e.textStyleId!=null&&(s.textStyleId=ge(e.textStyleId,`${t}.textStyleId`)),e.effectStyleId!=null&&(s.effectStyleId=ge(e.effectStyleId,`${t}.effectStyleId`)),s}function vt(e,t){if(e==null)return[];if(!Array.isArray(e)||e.length>8)throw new N(t,"expected at most 8 fills");return e.map((n,i)=>Xt(n,`${t}[${i}]`))}function _t(e,t){if(e==null)return[];if(!Array.isArray(e)||e.length>8)throw new N(t,"expected at most 8 effects");return e.map((n,i)=>is(n,`${t}[${i}]`))}function Vn(e,t){if(e==null)return{};if(!se(e))throw new N(t,"expected an object");let n={};for(let[i,a]of Object.entries(e)){if(typeof a!="string"||a.length>120)throw new N(`${t}.${i}`,"expected a short string");n[i]=a}return n}function os(e){return{frame:"Frame",group:"Group",rect:"Rectangle",ellipse:"Ellipse",line:"Line",text:"Text",instance:"Instance"}[e]??"Node"}function cs(e){return e==="line"?100:e==="text"?160:e==="frame"?375:120}function ls(e){return e==="line"?0:e==="text"?24:e==="frame"?667:120}function ds(e,t){if(!se(e))throw new N(t,"expected a style object");let n={...e};return n.id=ge(e.id,`${t}.id`),n.type=xe(e.type,`${t}.type`,Wa),n.name=typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):n.type,n.type==="fill"?n.value=Xt(e.value,`${t}.value`):n.type==="text"?n.value={font:Wn(e.value?.font,`${t}.value.font`),fills:vt(e.value?.fills,`${t}.value.fills`)}:n.value=_t(e.value,`${t}.value`),n}function hs(e,t,n){if(!se(e))throw new N(t,"expected a component object");let i={...e};return i.id=ge(e.id,`${t}.id`),i.name=typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):"Component",i.root=Gt(e.root,`${t}.root`,1,n),i.root.x=0,i.root.y=0,e.variantSetId!=null&&(i.variantSetId=ge(e.variantSetId,`${t}.variantSetId`)),i.variantProps=Vn(e.variantProps,`${t}.variantProps`),i}function us(e,t){if(!se(e))throw new N(t,"expected a variant set object");if(!Array.isArray(e.properties)||e.properties.length===0)throw new N(`${t}.properties`,"expected at least one variant property");return{...e,id:ge(e.id,`${t}.id`),name:typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):"Variant set",properties:e.properties.map((n,i)=>({name:On(n?.name,`${t}.properties[${i}].name`),values:Array.isArray(n?.values)?n.values.map((a,s)=>On(a,`${t}.properties[${i}].values[${s}]`)):[]})),componentIds:Array.isArray(e.componentIds)?e.componentIds.map((n,i)=>ge(n,`${t}.componentIds[${i}]`)):[]}}function ps(e,t){if(!se(e))throw new N(t,"expected a font asset object");return{...e,id:ge(e.id,`${t}.id`),family:typeof e.family=="string"&&e.family.trim()?e.family.trim().slice(0,120):"Custom",weight:Math.round(ne(e.weight??400,`${t}.weight`,{min:100,max:900})/100)*100,style:xe(e.style??"normal",`${t}.style`,jn),asset:ns(e.asset)?e.asset:(()=>{throw new N(`${t}.asset`,"expected fonts/<file>")})(),sourceName:typeof e.sourceName=="string"?e.sourceName.slice(0,200):void 0}}function ms(e,t){if(!se(e))throw new N(t,"expected a comment object");let n={...e,id:ge(e.id,`${t}.id`),pageId:ge(e.pageId,`${t}.pageId`),body:typeof e.body=="string"?e.body.slice(0,4e3):"",author:xe(e.author??"user",`${t}.author`,Dn),createdAt:typeof e.createdAt=="string"?e.createdAt:Ke(),resolved:e.resolved===!0,replies:[]};return e.nodeId!=null&&(n.nodeId=ge(e.nodeId,`${t}.nodeId`)),e.x!=null&&(n.x=ze(e.x,`${t}.x`)),e.y!=null&&(n.y=ze(e.y,`${t}.y`)),Array.isArray(e.replies)&&(n.replies=e.replies.slice(0,100).map((i,a)=>{if(!se(i))throw new N(`${t}.replies[${a}]`,"expected an object");return{id:ge(i.id??ie("r"),`${t}.replies[${a}].id`),body:typeof i.body=="string"?i.body.slice(0,4e3):"",author:xe(i.author??"user",`${t}.replies[${a}].author`,Dn),createdAt:typeof i.createdAt=="string"?i.createdAt:Ke()}})),n}function Ye(e,t={}){if(!se(e))throw new N("$","expected a document object");let n=es(e);if(n.format=Bn,n.version=1,n.id=ge(n.id??ie("doc"),"$.id"),n.title=typeof n.title=="string"&&n.title.trim()?n.title.trim().slice(0,200):"\u672A\u547D\u540D\u753B\u5E03",!Array.isArray(n.pages)||n.pages.length===0)throw new N("$.pages","expected at least one page");if(n.pages.length>50)throw new N("$.pages","expected at most 50 pages");let a={count:0,ids:new Set};n.pages=n.pages.map((o,c)=>{if(!se(o))throw new N(`$.pages[${c}]`,"expected an object");let d={...o,id:ge(o.id??ie("page"),`$.pages[${c}].id`),name:typeof o.name=="string"&&o.name.trim()?o.name.trim().slice(0,120):`Page ${c+1}`,children:[]};if(o.background!=null&&(d.background=lt(o.background,`$.pages[${c}].background`)),Array.isArray(o.children))for(let u=0;u<o.children.length;u+=1)d.children.push(Gt(o.children[u],`$.pages[${c}].children[${u}]`,1,a));return d});let s=new Set(n.pages.map(o=>o.id));if(s.size!==n.pages.length)throw new N("$.pages","duplicate page id");if(n.components=Array.isArray(n.components)?n.components.map((o,c)=>hs(o,`$.components[${c}]`,a)):[],n.components.length>Fe.components)throw new N("$.components","too many components");let r=new Set(n.components.map(o=>o.id));if(r.size!==n.components.length)throw new N("$.components","duplicate component id");for(let o of n.components)if(o.variantSetId!=null&&!Array.isArray(n.variantSets))throw new N("$.variantSets","missing variant sets");n.variantSets=Array.isArray(n.variantSets)?n.variantSets.map((o,c)=>us(o,`$.variantSets[${c}]`)):[];for(let[o,c]of n.variantSets.entries())for(let d of c.componentIds)if(!r.has(d))throw new N(`$.variantSets[${o}].componentIds`,`unknown component "${d}"`);if(n.styles=Array.isArray(n.styles)?n.styles.map((o,c)=>ds(o,`$.styles[${c}]`)):[],n.styles.length>Fe.styles)throw new N("$.styles","too many styles");if(new Set(n.styles.map(o=>o.id)).size!==n.styles.length)throw new N("$.styles","duplicate style id");if(n.fonts=Array.isArray(n.fonts)?n.fonts.map((o,c)=>ps(o,`$.fonts[${c}]`)):[],n.fonts.length>Fe.fonts)throw new N("$.fonts","too many fonts");if(n.comments=Array.isArray(n.comments)?n.comments.map((o,c)=>ms(o,`$.comments[${c}]`)):[],n.comments.length>Fe.comments)throw new N("$.comments","too many comments");for(let[o,c]of n.comments.entries()){if(!s.has(c.pageId))throw new N(`$.comments[${o}].pageId`,`unknown page "${c.pageId}"`);if(c.nodeId!=null&&!Kt(n,c.nodeId))throw new N(`$.comments[${o}].nodeId`,`unknown node "${c.nodeId}"`)}return n.meta=se(n.meta)?{...n.meta}:{},n.meta.createdAt=typeof n.meta.createdAt=="string"?n.meta.createdAt:Ke(),n.meta.updatedAt=t.touch===!1?n.meta.updatedAt??Ke():Ke(),fs(n),n}function fs(e){let t=new Map(e.components.map(c=>[c.id,c])),n=new Map(e.variantSets.map(c=>[c.id,c])),i=new Map(e.styles.map(c=>[c.id,c])),a=new Set;for(let[c,d]of e.fonts.entries()){if(a.has(d.id))throw new N(`$.fonts[${c}].id`,`duplicate font id "${d.id}"`);a.add(d.id)}for(let[c,d]of e.variantSets.entries())for(let u of d.componentIds){let p=t.get(u);if(!p)throw new N(`$.variantSets[${c}].componentIds`,`unknown component "${u}"`);if(p.variantSetId!==d.id)throw new N("$.components",`component "${u}" must set variantSetId "${d.id}"`);for(let w of d.properties){if(!(w.name in p.variantProps))throw new N("$.components",`component "${u}" is missing variant property "${w.name}"`);if(!w.values.includes(p.variantProps[w.name]))throw new N("$.components",`component "${u}" has variant value not declared by "${w.name}"`)}}for(let c of e.components)if(c.variantSetId!=null&&!n.has(c.variantSetId))throw new N("$.components",`component "${c.id}" references unknown variant set`);let s=(c,d,u)=>{if(c==null)return;let p=i.get(c);if(!p)throw new N(u,`unknown ${d} style "${c}"`);if(p.type!==d)throw new N(u,`style "${c}" is a ${p.type} style, expected ${d}`)};for(let c of e.components)for(let d of _n(c.root))s(d.fillStyleId,"fill",`$.components.${c.id}.${d.id}.fillStyleId`),s(d.textStyleId,"text",`$.components.${c.id}.${d.id}.textStyleId`),s(d.effectStyleId,"effect",`$.components.${c.id}.${d.id}.effectStyleId`);let r=(c,d)=>{let u=t.get(c.componentId);if(!u)throw new N(`${d}.componentId`,`unknown component "${c.componentId}"`);if(u.variantSetId!=null){let p=n.get(u.variantSetId);if(p)for(let[w,v]of Object.entries(c.variantProps??{})){let k=p.properties.find(A=>A.name===w);if(!k)throw new N(`${d}.variantProps.${w}`,`variant set has no property "${w}"`);if(!k.values.includes(v))throw new N(`${d}.variantProps.${w}`,`unknown variant value "${v}"`)}}for(let[p,w]of Object.entries(c.overrides??{})){let v=Xn(u.root,p);if(!v)throw new N(`${d}.overrides.${p}`,"override targets an unknown node");if("text"in w&&v.node.type!=="text")throw new N(`${d}.overrides.${p}.text`,"text override on a non-text node");if("fills"in w&&!["frame","rect","ellipse","text"].includes(v.node.type))throw new N(`${d}.overrides.${p}.fills`,"fill override on an unsupported node")}},l=(c,d,u)=>{u>Fe.depth||(s(c.fillStyleId,"fill",`${d}.fillStyleId`),s(c.textStyleId,"text",`${d}.textStyleId`),s(c.effectStyleId,"effect",`${d}.effectStyleId`),c.type==="instance"&&r(c,d),Array.isArray(c.children)&&c.children.forEach((p,w)=>l(p,`${d}.children[${w}]`,u+1)))};e.pages.forEach((c,d)=>{c.children.forEach((u,p)=>l(u,`$.pages[${d}].children[${p}]`,1))});let o=new Set;for(let[c,d]of e.comments.entries()){if(o.has(d.id))throw new N(`$.comments[${c}].id`,"duplicate comment id");o.add(d.id)}}function*_n(e){if(yield e,Array.isArray(e.children))for(let t of e.children)yield*_n(t)}function gs(e,t){for(let n of e.pages??[]){let i=(a,s,r)=>{t(a,s,{page:n,component:null,index:r}),Array.isArray(a.children)&&a.children.forEach((l,o)=>i(l,a,o))};(n.children??[]).forEach((a,s)=>i(a,null,s))}for(let n of e.components??[]){let i=(a,s,r)=>{t(a,s,{page:null,component:n,index:r}),Array.isArray(a.children)&&a.children.forEach((l,o)=>i(l,a,o))};i(n.root,null,0)}}function Kt(e,t){let n=null;return gs(e,(i,a,s)=>{!n&&i.id===t&&(n={node:i,parent:a,...s})}),n}function Xn(e,t){let n=(i,a,s)=>{if(i.id===t)return{node:i,parent:a,index:s};if(!Array.isArray(i.children))return null;for(let r=0;r<i.children.length;r+=1){let l=n(i.children[r],i,r);if(l)return l}return null};return n(e,null,0)}function Gn(e,t){return(e.pages??[]).find(n=>n.id===t)??null}function Kn(e){return e.pages?.[0]??null}function ys(e,t){return(e.pages??[]).find(n=>n.id===t)??null}function Un(e,t){let n=t.pageId?ys(e,t.pageId):Kn(e);if(!n)throw new N("$.comments","document has no pages");if(typeof t.body!="string"||!t.body.trim())throw new N("$.comments.body","comment body is required");if(t.nodeId!=null&&!Kt(e,t.nodeId))throw new N("$.comments.nodeId",`unknown node "${t.nodeId}"`);let i={id:ie("c"),pageId:n.id,body:t.body,author:t.author==="ai"?"ai":"user",createdAt:new Date().toISOString(),resolved:!1,replies:[]};return t.nodeId!=null&&(i.nodeId=t.nodeId),t.x!=null&&(i.x=t.x),t.y!=null&&(i.y=t.y),e.comments=Array.isArray(e.comments)?e.comments:[],e.comments.push(i),i}function Jn(e,t,n,i){let a=(e.comments??[]).find(r=>r.id===t);if(!a)throw new N("$.comments",`unknown comment "${t}"`);if(typeof n!="string"||!n.trim())throw new N("$.comments.body","reply body is required");let s={id:ie("r"),body:n,author:i==="ai"?"ai":"user",createdAt:new Date().toISOString()};return a.replies.push(s),s}function Zn(e,t,n=!0){let i=(e.comments??[]).find(a=>a.id===t);if(!i)throw new N("$.comments",`unknown comment "${t}"`);return i.resolved=n,i}function qn(e,t){let n=(e.comments??[]).findIndex(i=>i.id===t);if(n===-1)throw new N("$.comments",`unknown comment "${t}"`);e.comments.splice(n,1)}var dt=Object.freeze({family:"system-ui",weight:400,style:"normal",size:14,lineHeight:1.4,letterSpacing:0}),xs=4e3,Qn=1e-6,bs="\u2060",ii=/[\u2E80-\u2FFF\u3000-\u303F\u3040-\u30FF\u3100-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u{1F300}-\u{1FAFF}]/u,ws=new Set(["system-ui","ui-sans-serif","ui-serif","ui-monospace","ui-rounded","sans-serif","serif","monospace","cursive","fantasy","math","emoji","fangsong","-apple-system","BlinkMacSystemFont","Segoe UI"]);function Qe(){let e=new Map,t=0,n=null,i=!1,a=ni(),s=a&&a.fonts?a.fonts:null,r=s&&typeof s.status=="string"?s.status:"loaded",l=()=>{e.clear(),t+=1};if(s)try{typeof s.addEventListener=="function"?(s.addEventListener("loadingdone",l),s.addEventListener("loadingerror",l)):s.ready&&typeof s.ready.then=="function"&&s.ready.then(l,()=>{})}catch{}function o(){!s||typeof s.status!="string"||s.status!==r&&(r=s.status,r==="loaded"&&l())}function c(){if(i)return n;i=!0;let u=ni();if(!u)return null;try{let p=u.createElement("canvas"),w=p&&typeof p.getContext=="function"?p.getContext("2d"):null;w&&typeof w.measureText=="function"&&(n=w)}catch{n=null}return n}function d(u){o();let p=u&&typeof u.text=="string"?u.text:"",w=vs(u&&u.font),v=u?u.maxWidth:1/0,k=typeof v=="number"&&v>0?v:1/0,A=`${w.family}|${w.weight}|${w.style}|${w.size}|${w.lineHeight}|${w.letterSpacing}|${k===1/0?"inf":k}|${p.length}|${p}`,H=e.get(A);if(H)return H;let x=c(),P=x?Rs(x,p,w,k):Es(p,w,k);return(!s||s.status!=="loading")&&(e.size>=xs&&e.clear(),e.set(A,P)),P}return d.clearCache=l,d.fontEpoch=()=>t,d.fontsReady=()=>s&&s.ready?s.ready:Promise.resolve(),d.isCanvasBacked=()=>!!c(),d}function vs(e){let t=e&&typeof e=="object"?e:{};return{family:typeof t.family=="string"&&t.family.trim()?t.family.trim():dt.family,weight:ei(t.weight,dt.weight),style:t.style==="italic"?"italic":"normal",size:ti(t.size,dt.size),lineHeight:ti(t.lineHeight,dt.lineHeight),letterSpacing:ei(t.letterSpacing,dt.letterSpacing)}}function ei(e,t){return typeof e=="number"&&Number.isFinite(e)?e:t}function ti(e,t){return typeof e=="number"&&Number.isFinite(e)&&e>0?e:t}function ni(){try{let e=typeof globalThis<"u"?globalThis:void 0,t=e?e.document:null;return t&&typeof t.createElement=="function"?t:null}catch{return null}}function Rs(e,t,n,i){try{e.font=Ss(n)}catch{}return ai(t,n,i,s=>{try{let r=e.measureText(s);return r&&Number.isFinite(r.width)?r.width:0}catch{return 0}})}function Es(e,t,n){return ai(e,t,n,a=>{let s=0;for(let r of a)s+=ii.test(r)?t.size:t.size*.55;return s})}function Ss(e){let t=e.style==="italic"?"italic ":"",n=$s(e.family);return`${t}${e.weight} ${e.size}px ${n}`}function $s(e){return e.includes(",")||ws.has(e)||/^[A-Za-z][A-Za-z0-9_-]*$/.test(e)?e:JSON.stringify(e)}function ai(e,t,n,i){let a=t.letterSpacing,s=t.size*t.lineHeight,r=Number.isFinite(n)&&n>0,l=p=>i(p)+a*Is(p),o=[],c=p=>{let w=p.replace(/[ \t\u00A0]+$/u,"");o.push({text:w,width:Math.max(0,l(w))})},d=String(e).replace(/\r\n?/g,`
`).replace(/\t/g,"    ").split(`
`);for(let p of d){let w=[],v=0,k=()=>{c(w.join("")),w=[],v=0},A=H=>{let x=l(H);if(!r){w.push(H),v+=x;return}if(v+x<=n+Qn){w.push(H),v+=x;return}if(w.length>0){k(),A(H);return}let P="",_=0;for(let C of H){let q=l(C);P&&_+q>n+Qn?(c(P),P=C,_=q):(P+=C,_+=q)}P&&(w.push(P),v=_)};for(let H of ks(p))w.length===0&&/^[ \t\u00A0]+$/u.test(H)||A(H);k()}let u=0;for(let p of o)u=Math.max(u,p.width);return{lines:o,width:u,height:o.length*s}}function ks(e){let t=[],n="";for(let i of e)i!==bs&&(ii.test(i)||i===" "||i==="\xA0"?(n&&(t.push(n),n=""),t.push(i)):n+=i);return n&&t.push(n),t}function Is(e){let t=0;for(let n of e)t+=1;return t}var et=Object.freeze({family:"system-ui",weight:400,style:"normal",size:14,lineHeight:1.4,letterSpacing:0}),si=1e-6;function Et(e){if(!e||!Array.isArray(e.roots))return e;let t=Array.isArray(e.issues)?e.issues:e.issues=[],n=e.measureText;typeof n!="function"&&e.options&&typeof e.options.measureText=="function"&&(n=e.options.measureText),typeof n!="function"&&(n=Qe()),e.measureText=n;let i={issues:t,measure:n};for(let d of e.roots)a(d);for(let d of e.roots)o(d,0,0);return e;function a(d){if(!d||typeof d!="object")return;if(d.type==="text"){s(d);return}let u=Array.isArray(d.children)?d.children:[];for(let v of u)a(v);let p=tt(d.layout)?d.layout:null,w=Rt(d);p?r(d,p,w,u):l(d,w,u)}function s(d){let u=Rt(d),p=tt(d.font)?{...et,...d.font}:et,w=u.h==="hug"?1/0:Math.max(0,ee(d.width,0)),v=Ns(i,{text:typeof d.text=="string"?d.text:"",font:p,maxWidth:w,autoHeight:d.autoHeight!==!1},d);d.lines=v.lines,u.h==="hug"&&(d.width=Math.max(0,v.width)),u.v==="hug"&&(d.height=Math.max(0,v.height))}function r(d,u,p,w){let k=(u.direction==="horizontal"?"horizontal":"vertical")==="horizontal",A=ri(u.padding),H=Math.max(0,ee(u.gap,0)),x=u.alignCounter??"start",P=A.left+A.right,_=A.top+A.bottom,C=p.h==="hug"?null:Math.max(0,ee(d.width,0)-P),q=p.v==="hug"?null:Math.max(0,ee(d.height,0)-_),le=k?C:q,ke=k?q:C,pe=k?"width":"height",Ee=k?"height":"width";if(ke!=null)for(let D of w){let j=Rt(D),Se=k?j.v:j.h;(Se==="fill"||x==="stretch"&&Se==="fixed")&&Math.abs(ee(D[Ee],0)-ke)>si&&(D[Ee]=ke,a(D))}if(le!=null){let D=w.filter(j=>{let Se=Rt(j);return(k?Se.h:Se.v)==="fill"});if(D.length){let j=0;for(let Ie of w)D.includes(Ie)||(j+=Math.max(0,ee(Ie[pe],0)));let Se=H*Math.max(0,w.length-1),Ce=Math.max(0,(le-j-Se)/D.length);for(let Ie of D)Math.abs(ee(Ie[pe],0)-Ce)>si&&(Ie[pe]=Ce,a(Ie))}}let Ae=H*Math.max(0,w.length-1),we=0;for(let D of w)Ae+=Math.max(0,ee(D[pe],0)),we=Math.max(we,Math.max(0,ee(D[Ee],0)));p.h==="hug"&&(d.width=Math.max(0,k?Ae+P:we+P)),p.v==="hug"&&(d.height=Math.max(0,k?we+_:Ae+_))}function l(d,u,p){let w=0,v=0;for(let k of p)w=Math.max(w,ee(k.x,0)+Math.max(0,ee(k.width,0))),v=Math.max(v,ee(k.y,0)+Math.max(0,ee(k.height,0)));u.h==="hug"&&(d.width=Math.max(0,w)),u.v==="hug"&&(d.height=Math.max(0,v))}function o(d,u,p){if(!d||typeof d!="object")return;d.absX=u+ee(d.x,0),d.absY=p+ee(d.y,0);let w=Array.isArray(d.children)?d.children:[];if(!w.length)return;let v=tt(d.layout)?d.layout:null;v&&c(d,v,w);for(let k of w)o(k,d.absX,d.absY)}function c(d,u,p){let w=u.direction==="horizontal",v=ri(u.padding),k=Math.max(0,ee(u.gap,0)),A=u.alignPrimary??"start",H=u.alignCounter??"start",x=w?"width":"height",P=w?"height":"width",_=w?v.left:v.top,C=w?v.top:v.left,q=Math.max(0,ee(d[x],0)-(w?v.left+v.right:v.top+v.bottom)),le=Math.max(0,ee(d[P],0)-(w?v.top+v.bottom:v.left+v.right)),ke=k*Math.max(0,p.length-1);for(let D of p)ke+=Math.max(0,ee(D[x],0));let pe=q-ke,Ee=0,Ae=k;A==="center"?Ee=pe/2:A==="end"?Ee=pe:A==="space-between"&&p.length>1&&(Ae=k+Math.max(0,pe)/(p.length-1));let we=_+Ee;for(let D of p){let j=Math.max(0,ee(D[x],0)),Se=Math.max(0,ee(D[P],0)),Ce=C;H==="center"?Ce=C+(le-Se)/2:H==="end"&&(Ce=C+le-Se),w?(D.x=we,D.y=Ce):(D.x=Ce,D.y=we),we+=j+Ae}}}function Rt(e){let t=tt(e.layoutSizing)?e.layoutSizing:{},n=t.h==="hug"||t.h==="fill"?t.h:"fixed",i;return t.v==="hug"||t.v==="fill"?i=t.v:t.v==="fixed"?i="fixed":i=e.type==="text"&&e.autoHeight!==!1?"hug":"fixed",{h:n,v:i}}function ri(e){let t=tt(e)?e:{};return{top:ee(t.top,0),right:ee(t.right,0),bottom:ee(t.bottom,0),left:ee(t.left,0)}}function Ns(e,t,n){try{let i=e.measure(t);if(i&&Array.isArray(i.lines)&&Number.isFinite(i.width)&&Number.isFinite(i.height))return{lines:i.lines.map(a=>({text:typeof a?.text=="string"?a.text:"",width:ee(a?.width,0)})),width:i.width,height:i.height};throw new Error("measureText returned an invalid result")}catch(i){return e.issues.push(`text measurement failed for "${n.key??n.id??"text"}": ${String(i?.message??i)}`),Cs(t)}}function Cs(e){let t=tt(e.font)?{...et,...e.font}:et,n=ee(t.size,et.size),i=ee(t.lineHeight,et.lineHeight),a=String(e.text??"").replace(/\r\n?/g,`
`).split(`
`).map(r=>({text:r,width:[...r].length*n*.55})),s=0;for(let r of a)s=Math.max(s,r.width);return{lines:a,width:s,height:a.length*n*i}}function tt(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function ee(e,t){return typeof e=="number"&&Number.isFinite(e)?e:t}var oi=24,ci=2e4,di=Object.freeze({family:"system-ui",weight:400,style:"normal",size:14,lineHeight:1.4,letterSpacing:0}),Ms=new Set(["left","center","right","justify"]),zs=new Set(["top","center","bottom"]),li=new Set(["fixed","hug","fill"]);function qt(e,t={}){let n=Q(e)?e:{},i=Q(t)?{...t}:{},a=[];Q(e)||a.push("document is missing or malformed");let s=i.mode==="component"?"component":"design",r=typeof i.measureText=="function"?i.measureText:Qe(),l=new Map;for(let A of Array.isArray(n.components)?n.components:[])Q(A)&&typeof A.id=="string"&&l.set(A.id,A);let o=new Map;for(let A of Array.isArray(n.styles)?n.styles:[])Q(A)&&typeof A.id=="string"&&o.set(A.id,A);let c=new Map;for(let A of Array.isArray(n.variantSets)?n.variantSets:[])Q(A)&&typeof A.id=="string"&&c.set(A.id,A);let d=new Map,u=new Map,p={issues:a,componentById:l,styleById:o,variantSetById:c,byKey:d,bySourceId:u,nodeCount:0,budgetIssued:!1,componentStack:[]},w=[],v=s==="design"?Ls(n,i.pageId,a):null;if(s==="design"){if(v){let A=Array.isArray(v.children)?v.children:[];for(let H of A){if(!Q(H)){a.push("skipped a malformed page child");continue}let x=Ut(H,{key:typeof H.id=="string"?H.id:`node-${w.length}`,keyPrefix:null,instanceId:null,editable:!0,overrides:null,parent:null},p);x&&w.push(x)}}}else{let A=typeof i.componentId=="string"?i.componentId:null,H=A?l.get(A):null;if(!H||!Q(H.root))a.push(`component mode: unknown component "${String(A)}"`);else{let x=H.root,P=Ut(x,{key:typeof x.id=="string"?x.id:"component-root",keyPrefix:null,instanceId:null,editable:!0,overrides:null,parent:null},p);P&&w.push(P)}}let k={pageId:v&&typeof v.id=="string"?v.id:null,title:typeof n.title=="string"?n.title:"",mode:s,roots:w,byKey:d,bySourceId:u,componentById:l,styleById:o,issues:a,componentId:s==="component"&&typeof i.componentId=="string"?i.componentId:null,viewportWidth:Be(i.viewportWidth,null),page:v,background:v&&typeof v.background=="string"?v.background:null,doc:n,measureText:r,options:i};return Os(k,e,i),k}function Ut(e,t,n){return Q(e)?(n.nodeCount+=1,n.nodeCount>ci?(n.budgetIssued||(n.issues.push(`scene exceeds ${ci} nodes; remaining children were skipped`),n.budgetIssued=!0),null):e.type==="instance"?Fs(e,t,n):As(e,t,n)):(n.issues.push(`skipped a malformed node at "${t.key}"`),null)}function As(e,t,n){let i=ui(e,t),a=i.type,s=Zt(t.overrides,e.id);if(a==="frame"||a==="rect"||a==="ellipse")Jt(i,e,n,s),a==="frame"&&(i.layout=Q(e.layout)?e.layout:void 0);else if(a==="text"){let r=Jt(i,e,n,s);pi(i,e,r,s)}else a==="line"&&(i.strokes=Array.isArray(e.strokes)?e.strokes:[]);return s&&typeof s.visible=="boolean"&&(i.visible=s.visible),a==="frame"||a==="group"?i.children=hi(e,i,{prefix:t.keyPrefix??null,instanceId:t.instanceId??null,editable:i.editable,overrides:t.overrides??null},n):i.children=[],mi(i,n),i}function Fs(e,t,n){let i=ui(e,t);i.type="instance",i.isInstanceRoot=!0;let a=t.instanceId!=null?t.instanceId:t.key;i.instanceId=a;let s=Q(e.overrides)?e.overrides:{};i.overrides=s,i.variantProps=Q(e.variantProps)?{...e.variantProps}:{},i.componentId=e.componentId;let r=Zt(t.overrides,e.id),l=Ps(e,n),o=l&&Q(l.root)?l.root:null;if(l&&(i.componentId=l.id,i.variantProps={...Q(l.variantProps)?l.variantProps:{},...Q(e.variantProps)?e.variantProps:{}}),o){let c=Zt(s,o.id),d=Jt(i,o,n,c);e.cornerRadius!=null&&(i.cornerRadius=Math.max(0,Be(e.cornerRadius,0))),i.visible=i.visible&&o.visible!==!1,o.type==="text"&&(pi(i,o,d,c),i.lines=[]),i.layout=Q(o.layout)?o.layout:void 0,i.layoutSizing=fi(e.layoutSizing),c&&typeof c.visible=="boolean"&&(i.visible=c.visible)}if(r&&typeof r.visible=="boolean"&&(i.visible=r.visible),l&&o)if(n.componentStack.includes(l.id))n.issues.push(`component cycle: ${[...n.componentStack,l.id].join(" -> ")}; instance "${String(e.id)}" rendered empty`);else if(n.componentStack.length>=oi)n.issues.push(`component nesting exceeds ${oi} at instance "${String(e.id)}"; rendered empty`);else{n.componentStack.push(l.id);try{i.children=hi(o,i,{prefix:i.key,instanceId:a,editable:!1,overrides:s},n)}finally{n.componentStack.pop()}}return mi(i,n),i}function hi(e,t,n,i){let a=Array.isArray(e.children)?e.children:[],s=[];for(let r of a){if(!Q(r)){i.issues.push(`skipped a malformed child of "${String(t.id)}"`);continue}let l=typeof r.id=="string"?r.id:`node-${n.prefix??""}-${s.length}`,o=n.prefix?`${n.prefix}::${l}`:l,c=Ut(r,{key:o,keyPrefix:n.prefix??null,instanceId:n.instanceId??null,editable:n.editable!==!1,overrides:n.overrides??null,parent:t},i);c&&s.push(c)}return s}function ui(e,t){let n=typeof e.type=="string"?e.type:"rect",i=typeof e.id=="string"?e.id:String(t.key),a={key:t.key,id:i,sourceId:i,type:n,name:typeof e.name=="string"?e.name:n,x:Be(e.x,0),y:Be(e.y,0),width:Math.max(0,Be(e.width,0)),height:Math.max(0,Be(e.height,0)),rotation:Be(e.rotation,0),opacity:Hs(Be(e.opacity,1)),visible:e.visible!==!1,locked:e.locked===!0,fill:[],fills:[],strokes:[],effects:[],cornerRadius:0,clip:!1,children:[],sourceNode:e,editable:t.editable!==!1,isInstanceRoot:!1,parent:t.parent??null};t.instanceId!=null&&(a.instanceId=t.instanceId);let s=fi(e.layoutSizing);return s&&(a.layoutSizing=s),a}function Jt(e,t,n,i){let a=Ts(t,e,n),s=a.fills,r=a.effects;return i&&Array.isArray(i.fills)&&(s=i.fills),e.fill=s,e.fills=s,e.effects=r,e.strokes=Array.isArray(t.strokes)?t.strokes:[],e.cornerRadius=Math.max(0,Be(t.cornerRadius,0)),e.clip=t.type==="frame"?t.clip!==!1:!1,a.font}function pi(e,t,n,i){e.text=typeof t.text=="string"?t.text:"",e.font=Q(n)?n:di,e.align=Ms.has(t.align)?t.align:"left",e.verticalAlign=zs.has(t.verticalAlign)?t.verticalAlign:"top",e.autoHeight=t.autoHeight!==!1,i&&typeof i.text=="string"&&(e.text=i.text)}function Ts(e,t,n){let i=Array.isArray(e.fills)?e.fills:[],a=Array.isArray(e.effects)?e.effects:[],s=Q(e.font)?e.font:di,r=`node "${String(t.id)}"`;if(e.textStyleId!=null){let l=n.styleById.get(e.textStyleId);l?l.type!=="text"?n.issues.push(`${r}: style "${String(e.textStyleId)}" is a ${String(l.type)} style, expected text`):Q(l.value)&&(Q(l.value.font)&&(s=l.value.font),Array.isArray(l.value.fills)&&(i=l.value.fills)):n.issues.push(`${r}: unknown text style "${String(e.textStyleId)}"`)}if(e.fillStyleId!=null){let l=n.styleById.get(e.fillStyleId);l?l.type!=="fill"?n.issues.push(`${r}: style "${String(e.fillStyleId)}" is a ${String(l.type)} style, expected fill`):Q(l.value)&&(i=[l.value]):n.issues.push(`${r}: unknown fill style "${String(e.fillStyleId)}"`)}if(e.effectStyleId!=null){let l=n.styleById.get(e.effectStyleId);l?l.type!=="effect"?n.issues.push(`${r}: style "${String(e.effectStyleId)}" is a ${String(l.type)} style, expected effect`):Array.isArray(l.value)&&(a=l.value):n.issues.push(`${r}: unknown effect style "${String(e.effectStyleId)}"`)}return{fills:i,effects:a,font:s}}function Ps(e,t){let n=t.componentById.get(e.componentId);if(!n)return t.issues.push(`instance "${String(e.id)}" references unknown component "${String(e.componentId)}"`),null;let i=Q(e.variantProps)?e.variantProps:{};if(!n.variantSetId||Object.keys(i).length===0)return n;let a=t.variantSetById.get(n.variantSetId);if(!a)return t.issues.push(`component "${String(n.id)}" references unknown variant set "${String(n.variantSetId)}"`),n;let s={...Q(n.variantProps)?n.variantProps:{},...i},r=Array.isArray(a.properties)?a.properties:[];for(let l of Array.isArray(a.componentIds)?a.componentIds:[]){let o=t.componentById.get(l);if(!o)continue;let c=Q(o.variantProps)?o.variantProps:{};if(r.every(d=>c[d?.name]===s[d?.name]))return o}return t.issues.push(`instance "${String(e.id)}" has no variant match (${Ds(i)}); using "${String(n.id)}"`),n}function Ds(e){return Object.entries(e).map(([t,n])=>`${t}=${String(n)}`).join(", ")}function Ls(e,t,n){let i=Array.isArray(e.pages)?e.pages.filter(Q):[];if(!i.length)return n.push("document has no pages"),null;if(t==null)return i[0];let a=i.find(s=>s.id===t);return a||(n.push(`unknown page "${String(t)}"`),null)}function mi(e,t){t.byKey.has(e.key)?t.issues.push(`duplicate render key "${e.key}"`):t.byKey.set(e.key,e);let n=t.bySourceId.get(e.sourceId);n?n.push(e):t.bySourceId.set(e.sourceId,[e])}function Os(e,t,n){e.rebuild=()=>{e.measureText&&typeof e.measureText.clearCache=="function"&&e.measureText.clearCache();let i=qt(t,{...n,measureText:e.measureText});return e.pageId=i.pageId,e.title=i.title,e.mode=i.mode,e.componentId=i.componentId,e.roots=i.roots,e.byKey=i.byKey,e.bySourceId=i.bySourceId,e.componentById=i.componentById,e.styleById=i.styleById,e.page=i.page,e.background=i.background,e.doc=i.doc,Array.isArray(e.issues)?(e.issues.length=0,e.issues.push(...i.issues)):e.issues=i.issues,Et(e),e}}function Zt(e,t){if(!Q(e)||typeof t!="string")return;let n=e[t];return Q(n)?n:void 0}function fi(e){if(!Q(e))return;let t={};return li.has(e.h)&&(t.h=e.h),li.has(e.v)&&(t.v=e.v),Object.keys(t).length?t:void 0}function Q(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function Be(e,t){return typeof e=="number"&&Number.isFinite(e)?e:t}function Hs(e){return Math.min(1,Math.max(0,e))}var St=class{constructor(t=100){this.limit=t,this.entries=[],this.index=-1}reset(t){this.entries=[JSON.stringify(t)],this.index=0}commit(t){let n=JSON.stringify(t);return this.index>=0&&this.entries[this.index]===n?!1:(this.entries=this.entries.slice(0,this.index+1),this.entries.push(n),this.entries.length>this.limit&&this.entries.shift(),this.index=this.entries.length-1,!0)}canUndo(){return this.index>0}canRedo(){return this.index>=0&&this.index<this.entries.length-1}undo(){return this.canUndo()?(this.index-=1,JSON.parse(this.entries[this.index])):null}redo(){return this.canRedo()?(this.index+=1,JSON.parse(this.entries[this.index])):null}replaceCurrent(t){if(this.index<0){this.reset(t);return}this.entries[this.index]=JSON.stringify(t)}};var gi=/\[([^\][\n]{1,140})\]\(dsh-canvas:\/\/([a-z0-9][a-z0-9-_]{0,63})(?:\?([^)\n]*))?\)/g;function yi(e){let t=(String(e.label??"\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D").replace(/[\[\]\n]/g," ").replace(/\s+/g," ").trim()||"\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D").slice(0,70),n=new URLSearchParams({node:e.node});return e.page&&n.set("page",e.page),`[${t}](dsh-canvas://${e.doc}?${n})`}function Bs(e,t){gi.lastIndex=t;let n=gi.exec(e);if(!n)return;let i=new URLSearchParams(n[3]??"");return{id:"dsh-canvas",start:n.index,end:n.index+n[0].length,data:{label:n[1].trim()||"\u753B\u5E03",doc:n[2],node:i.get("node")??void 0,page:i.get("page")??void 0}}}var xi={id:"dsh-canvas",order:20,match:Bs};var $t="dsh-canvas:selection",Qt=new Map,js=0;function bi(e){e?.sessionId&&(Qt.set(e.sessionId,{...e,at:Date.now(),seq:++js}),typeof window<"u"&&window.dispatchEvent(new CustomEvent($t,{detail:{...e}})))}function kt(e){return Qt.get(e)??null}function wi(e){Qt.delete(e),typeof window<"u"&&window.dispatchEvent(new CustomEvent($t,{detail:{sessionId:e,dismissed:!0}}))}function vi(e){if(typeof window>"u")return()=>{};let t=()=>e();return window.addEventListener($t,t),()=>window.removeEventListener($t,t)}var tn="material3",nt={material3:{id:"material3",name:"Material Design 3",source:"Google",platform:"cross-platform",description:"Google \u7684\u8DE8\u5E73\u53F0\u8BBE\u8BA1\u89C4\u8303\uFF0C\u7EC4\u4EF6\u4E0E token \u8986\u76D6\u6700\u5E7F\uFF0C\u662F\u6700\u901A\u7528\u7684\u4E00\u5957\u3002",colors:{primary:"#6750A4",onPrimary:"#FFFFFF",primaryContainer:"#EADDFF",onPrimaryContainer:"#21005D",secondary:"#625B71",onSecondary:"#FFFFFF",secondaryContainer:"#E8DEF8",onSecondaryContainer:"#1D192B",surface:"#FEF7FF",onSurface:"#1D1B20",surfaceVariant:"#E7E0EC",onSurfaceVariant:"#49454F",background:"#FEF7FF",outline:"#79747E",outlineVariant:"#CAC4D0",error:"#B3261E",onError:"#FFFFFF",success:"#146C2E",warning:"#7D5260"},type:{displayLarge:{size:57,lineHeight:64,weight:400,letterSpacing:-.25},displayMedium:{size:45,lineHeight:52,weight:400,letterSpacing:0},displaySmall:{size:36,lineHeight:44,weight:400,letterSpacing:0},headlineLarge:{size:32,lineHeight:40,weight:400,letterSpacing:0},headlineMedium:{size:28,lineHeight:36,weight:400,letterSpacing:0},headlineSmall:{size:24,lineHeight:32,weight:400,letterSpacing:0},titleLarge:{size:22,lineHeight:28,weight:400,letterSpacing:0},titleMedium:{size:16,lineHeight:24,weight:500,letterSpacing:.15},titleSmall:{size:14,lineHeight:20,weight:500,letterSpacing:.1},bodyLarge:{size:16,lineHeight:24,weight:400,letterSpacing:.5},bodyMedium:{size:14,lineHeight:20,weight:400,letterSpacing:.25},bodySmall:{size:12,lineHeight:16,weight:400,letterSpacing:.4},labelLarge:{size:14,lineHeight:20,weight:500,letterSpacing:.1},labelMedium:{size:12,lineHeight:16,weight:500,letterSpacing:.5},labelSmall:{size:11,lineHeight:16,weight:500,letterSpacing:.5}},spacing:{xs:4,sm:8,md:12,lg:16,xl:24,xxl:32,xxxl:48},radius:{xs:4,sm:8,md:12,lg:16,xl:24,full:999},elevation:{level1:[{type:"drop-shadow",x:0,y:1,blur:3,spread:0,color:"#0000001A"}],level2:[{type:"drop-shadow",x:0,y:2,blur:6,spread:0,color:"#0000001F"}],level3:[{type:"drop-shadow",x:0,y:4,blur:12,spread:0,color:"#00000024"}]},components:{button:{height:40,radius:20,paddingX:24,label:"labelLarge"},card:{radius:12,padding:16,elevation:"level1"},textField:{height:56,radius:4,paddingX:16}}},ios:{id:"ios",name:"Apple Human Interface Guidelines",source:"Apple",platform:"iOS",description:"Apple \u7684 iOS \u5E73\u53F0\u89C4\u8303\uFF0C\u72B6\u6001\u680F\u3001\u5BFC\u822A\u680F\u3001\u6807\u7B7E\u680F\u3001\u5B89\u5168\u533A\u5C3A\u5BF8\u90FD\u6309 iPhone \u57FA\u51C6\u3002",colors:{blue:"#007AFF",green:"#34C759",red:"#FF3B30",orange:"#FF9500",yellow:"#FFCC00",purple:"#AF52DE",teal:"#5AC8FA",gray:"#8E8E93",background:"#F2F2F7",surface:"#FFFFFF",surfaceElevated:"#FFFFFFF2",label:"#000000",secondaryLabel:"#3C3C4399",tertiaryLabel:"#3C3C434D",separator:"#3C3C432E",fill:"#7878801F",onBlue:"#FFFFFF"},type:{largeTitle:{size:34,lineHeight:41,weight:700,letterSpacing:.37},title1:{size:28,lineHeight:34,weight:700,letterSpacing:.36},title2:{size:22,lineHeight:28,weight:600,letterSpacing:.35},title3:{size:20,lineHeight:25,weight:600,letterSpacing:.38},headline:{size:17,lineHeight:22,weight:600,letterSpacing:-.41},body:{size:17,lineHeight:22,weight:400,letterSpacing:-.41},callout:{size:16,lineHeight:21,weight:400,letterSpacing:-.32},subheadline:{size:15,lineHeight:20,weight:400,letterSpacing:-.24},footnote:{size:13,lineHeight:18,weight:400,letterSpacing:-.08},caption1:{size:12,lineHeight:16,weight:400,letterSpacing:0},caption2:{size:11,lineHeight:13,weight:400,letterSpacing:.07}},metrics:{screenWidth:393,screenHeight:852,statusBarHeight:54,navBarHeight:44,tabBarHeight:49,homeIndicatorWidth:134,homeIndicatorHeight:5,safeAreaBottom:34,margin:16,cardRadius:12,controlHeight:44},spacing:{xs:4,sm:8,md:12,lg:16,xl:20,xxl:32},radius:{sm:8,md:10,card:12,large:16,full:999},elevation:{card:[{type:"drop-shadow",x:0,y:1,blur:4,spread:0,color:"#0000000F"}]},components:{statusBar:{height:54},navBar:{height:44},tabBar:{height:49,totalWithHomeIndicator:83},button:{height:50,radius:12,paddingX:20}}}},ho=Object.keys(nt);function nn(e=tn){return nt[e]??nt[tn]}var uo=["If the user does not name a design system, use the built-in design system documented in canvas/DESIGN.md:","Material Design 3 tokens for general UI, and Apple Human Interface Guidelines for iOS screens.","For a mobile/iOS screen, start from the foundation (iPhone 16 393\xD7852 by default; iPhone 15 optional) and a page template, then customize it."].join(" ");function Ys(e){return String(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function en(e,t,n){return`ds_${e}_${t}_${Ys(n)}`.slice(0,64)}function Ri(e=tn){let t=nn(e),n=[],i=t.id==="material3"?{primary:"Primary",onPrimary:"On Primary",primaryContainer:"Primary Container",surface:"Surface",onSurface:"On Surface",surfaceVariant:"Surface Variant",onSurfaceVariant:"On Surface Variant",outline:"Outline",error:"Error",success:"Success"}:{blue:"Blue",green:"Green",red:"Red",orange:"Orange",gray:"Gray",background:"Background",surface:"Surface",label:"Label",secondaryLabel:"Secondary Label",separator:"Separator"};for(let[s,r]of Object.entries(i)){let l=t.colors[s];l&&n.push({id:en(t.id,"fill",r),type:"fill",name:`${t.id==="material3"?"M3":"iOS"}/Color/${r}`,value:{type:"solid",color:l}})}let a=t.id==="material3"?t.colors.onSurface:t.colors.label;for(let[s,r]of Object.entries(t.type)){let l=s.replace(/([A-Z])/g," $1").replace(/^./,o=>o.toUpperCase()).trim();n.push({id:en(t.id,"text",l),type:"text",name:`${t.id==="material3"?"M3":"iOS"}/Type/${l}`,value:{font:{family:"system-ui",weight:r.weight,style:"normal",size:r.size,lineHeight:Math.round(r.lineHeight/r.size*1e3)/1e3,letterSpacing:r.letterSpacing},fills:[{type:"solid",color:a}]}})}for(let[s,r]of Object.entries(t.elevation))n.push({id:en(t.id,"effect",s),type:"effect",name:`${t.id==="material3"?"M3":"iOS"}/Elevation/${s}`,value:structuredClone(r)});return n}var an={iphone16:{id:"iphone16",name:"iPhone 16",width:393,height:852,statusBarHeight:54,navBarHeight:44,tabBarHeight:49,tabBarTotalHeight:83,homeIndicatorWidth:134,homeIndicatorHeight:5,safeAreaBottom:34,margin:16},iphone15:{id:"iphone15",name:"iPhone 15",width:390,height:844,statusBarHeight:54,navBarHeight:44,tabBarHeight:49,tabBarTotalHeight:83,homeIndicatorWidth:134,homeIndicatorHeight:5,safeAreaBottom:34,margin:16}},sn={neutral:{id:"neutral",name:"Neutral",pageHorizontal:16,sectionGap:16,cardPadding:16,cardRadius:12,buttonRadius:12,elevation:"soft",description:"\u9ED8\u8BA4\uFF1A\u514B\u5236\u7559\u767D\u3001\u8F7B\u9634\u5F71\u300112 \u5706\u89D2"},minimal:{id:"minimal",name:"Minimal",pageHorizontal:20,sectionGap:24,cardPadding:16,cardRadius:8,buttonRadius:8,elevation:"none",description:"\u66F4\u5927\u7559\u767D\u3001\u65E0\u9634\u5F71\u30018 \u5706\u89D2"},soft:{id:"soft",name:"Soft",pageHorizontal:20,sectionGap:20,cardPadding:20,cardRadius:20,buttonRadius:16,elevation:"soft",description:"\u67D4\u548C\u7559\u767D\u300120/16 \u5706\u89D2\u3001\u67D4\u548C\u9634\u5F71"},compact:{id:"compact",name:"Compact",pageHorizontal:12,sectionGap:12,cardPadding:12,cardRadius:8,buttonRadius:8,elevation:"none",description:"\u7D27\u51D1\u95F4\u8DDD\u30018 \u5706\u89D2\u3001\u65E0\u9634\u5F71"}},fo=Object.keys(an),go=Object.keys(sn),We="iphone16",ht="neutral";function Ve(e=We){return an[e]??an[We]}function rn(e=ht){return sn[e]??sn[ht]}var yo=["Foundation: for new mobile screens default to iPhone 16 393\xD7852 and the Neutral preset;","iPhone 15 390\xD7844 is available for legacy documents. Presets are Neutral/Minimal/Soft/Compact and","control page margins, section gaps, card padding, radii and shadow density only; keep the existing",'Material 3 / iOS HIG colors and typography. Get resolved tokens from canvas_template action "foundation".'].join(" ");var it=nt.ios,T=it.colors;function Ws(e){let t=it.type[e];return{family:"system-ui",weight:t.weight,style:"normal",size:t.size,lineHeight:Math.round(t.lineHeight/t.size*1e3)/1e3,letterSpacing:t.letterSpacing}}function U(e,t,n,i,a,s,r="body",l=T.label,o={}){let c=Ws(r);return{id:e,type:"text",name:t,x:n,y:i,width:a,height:Math.ceil(c.size*c.lineHeight),rotation:0,opacity:1,visible:!0,locked:!1,text:s,font:c,align:o.align??"left",verticalAlign:o.verticalAlign??"top",fills:[{type:"solid",color:l}],effects:[],autoHeight:!0}}function Re(e,t,n,i,a,s,r={}){return{id:e,type:"rect",name:t,x:n,y:i,width:a,height:s,rotation:r.rotation??0,opacity:1,visible:!0,locked:!1,cornerRadius:r.cornerRadius??0,fills:r.fill?[{type:"solid",color:r.fill}]:[],strokes:r.stroke?[{color:r.stroke,width:r.strokeWidth??1,align:"center"}]:[],effects:r.effects??[]}}function cn(e,t,n,i,a,s,r={}){return{id:e,type:"ellipse",name:t,x:n,y:i,width:a,height:s,rotation:0,opacity:1,visible:!0,locked:!1,fills:r.fill?[{type:"solid",color:r.fill}]:[],strokes:r.stroke?[{color:r.stroke,width:r.strokeWidth??1,align:"center"}]:[],effects:[]}}function It(e,t,n,i,a,s={}){return{id:e,type:"line",name:t,x:n,y:i,width:a,height:0,rotation:s.rotation??0,opacity:1,visible:!0,locked:!1,strokes:[{color:s.color??T.label,width:s.width??1,align:"center"}]}}function $e(e,t,n,i,a,s,r,l={}){return{id:e,type:"frame",name:t,x:n,y:i,width:a,height:s,rotation:0,opacity:1,visible:!0,locked:!1,clip:l.clip??!0,cornerRadius:l.cornerRadius??0,fills:l.fill?[{type:"solid",color:l.fill}]:[],strokes:l.stroke?[{color:l.stroke,width:l.strokeWidth??1,align:"center"}]:[],effects:l.effects??[],children:r}}function at(e,t,n){let i=t==="light"?"#FFFFFF":T.label,a=t==="light"?"#FFFFFFCC":T.secondaryLabel,s=n.width,r=[U(`${e}-time`,"Time",27,16,56,"9:41","subheadline",i),Re(`${e}-island`,"Dynamic Island",(s-126)/2,11,126,37,{fill:T.label,cornerRadius:19}),U(`${e}-5g`,"Network",s-87,17,25,"5G","caption2",i),Re(`${e}-battery`,"Battery",s-56,19,25,12,{stroke:a,strokeWidth:1,cornerRadius:3}),Re(`${e}-battery-fill`,"Battery level",s-54,21,20,8,{fill:i,cornerRadius:2}),Re(`${e}-battery-tip`,"Battery tip",s-30,22,2,6,{fill:a,cornerRadius:1})];for(let l=0;l<4;l+=1){let o=4+l*2;r.push(Re(`${e}-signal-${l}`,`Signal ${l+1}`,s-108+l*4,33-o,3,o,{fill:i,cornerRadius:1}))}return $e(`${e}-root`,"Status Bar",0,0,s,n.statusBarHeight,r,{clip:!1})}function Ei(e,t="Title"){return $e("nav-root","Navigation Bar",0,0,e.width,e.navBarHeight,[U("nav-back","Back",10,4,26,"\u2039","title1",T.blue),U("nav-title","Title",(e.width-120)/2,10,120,t,"headline",T.label,{align:"center"}),U("nav-action","Action",e.width-80,10,64,"Done","body",T.blue,{align:"right"})],{fill:T.surfaceElevated})}function ln(e){let t=["Home","Search","Favorites","Inbox","Profile"],n=e.tabBarTotalHeight,i=[It("tab-top-line","Top separator",0,0,e.width,{color:T.separator,width:1})];return t.forEach((a,s)=>{let r=(s+.5)*e.width/t.length,o=s===0?T.blue:T.gray;i.push(Re(`tab-icon-${s}`,`${a} icon`,r-12,10,24,24,{fill:o,cornerRadius:6}),U(`tab-label-${s}`,a,r-32,38,64,a,"caption2",o,{align:"center"}))}),i.push(Re("home-indicator","Home Indicator",(e.width-e.homeIndicatorWidth)/2,n-11,e.homeIndicatorWidth,e.homeIndicatorHeight,{fill:T.label,cornerRadius:3})),$e("tab-root","Tab Bar",0,0,e.width,n,i,{fill:T.surfaceElevated,clip:!0})}function Vs(e){let t=[{icon:T.blue,label:"Wi-Fi",value:"Home"},{icon:T.green,label:"Bluetooth",value:"On"},{icon:T.orange,label:"Cellular",value:"5G"},{icon:T.gray,label:"Personal Hotspot",value:"Off"}],n=e.width-32,i=[];return t.forEach((a,s)=>{let r=12+s*44,l=n-48;i.push(Re(`row-${s}-icon`,`${a.label} icon`,16,r,32,32,{fill:a.icon,cornerRadius:8}),Re(`row-${s}-glyph`,`${a.label} glyph`,25,r+9,14,14,{fill:"#FFFFFF",cornerRadius:4}),U(`row-${s}-label`,a.label,60,r+5,l-60,a.label,"body",T.label),U(`row-${s}-value`,`${a.label} value`,l-62,r+7,62,a.value,"subheadline",T.secondaryLabel,{align:"right"}),U(`row-${s}-chevron`,"Chevron",n-26,r+3,16,"\u203A","title3",T.tertiaryLabel,{align:"center"})),s<t.length-1&&i.push(It(`row-${s}-separator`,"Separator",60,r+43,n-76,{color:T.separator,width:1}))}),$e("settings-card","General Settings Card",16,238,n,200,i,{fill:T.surface,cornerRadius:it.metrics.cardRadius,effects:it.elevation.card})}function _s(e){let t=[{icon:T.blue,label:"Apple ID",value:"name@icloud.com"},{icon:T.gray,label:"Password & Security",value:""}],n=e.width-32,i=[];return t.forEach((a,s)=>{let r=12+s*44;i.push(Re(`account-${s}-icon`,`${a.label} icon`,16,r,32,32,{fill:a.icon,cornerRadius:8}),U(`account-${s}-label`,a.label,60,r+5,n-160,a.label,"body",T.label),U(`account-${s}-value`,a.value,n-138,r+7,92,a.value,"footnote",T.secondaryLabel,{align:"right"}),U(`account-${s}-chevron`,"Chevron",n-26,r+3,16,"\u203A","title3",T.tertiaryLabel,{align:"center"})),s===0&&i.push(It(`account-${s}-separator`,"Separator",60,r+43,n-76,{color:T.separator,width:1}))}),$e("account-card","Account Card",16,480,n,100,i,{fill:T.surface,cornerRadius:it.metrics.cardRadius,effects:it.elevation.card})}function Xs(e){let t=e.width,n=at("screen-status","dark",e),i=ln(e);i.y=e.height-e.tabBarTotalHeight;let a=$e("search-field","Search Field",16,154,t-32,36,[cn("search-icon","Search glyph",12,11,13,13,{stroke:T.secondaryLabel,strokeWidth:1.5}),It("search-icon-handle","Search handle",22,23,6,{color:T.secondaryLabel,width:1.5,rotation:45}),U("search-placeholder","Placeholder",32,8,220,"Search settings","subheadline",T.secondaryLabel)],{fill:T.fill,cornerRadius:10});return $e("screen-root","iOS Screen",0,0,t,e.height,[n,U("screen-title","Large Title",16,72,t-50,"Settings","largeTitle",T.label),U("screen-subtitle","Subtitle",16,124,t-50,"Manage your account and app preferences","subheadline",T.secondaryLabel),a,U("section-general","Section Label",16,212,200,"GENERAL","caption1",T.secondaryLabel),Vs(e),U("section-account","Section Label",16,454,200,"ACCOUNT","caption1",T.secondaryLabel),_s(e),i],{fill:T.background,clip:!0})}function on(e,t,n,i,a,s){let r=e.width-32;return $e(t,n,16,i,r,68,[U(`${t}-label`,`${n} label`,0,0,r,a,"caption1",T.secondaryLabel),Re(`${t}-box`,`${n} box`,0,20,r,48,{fill:T.fill,cornerRadius:10}),U(`${t}-placeholder`,`${n} placeholder`,14,34,r-28,s,"body",T.secondaryLabel)],{clip:!1})}function Si(e,t,n,i){let a=e.width-32;return $e(t,"Primary Button",16,n,a,52,[Re(`${t}-bg`,"Button background",0,0,a,52,{fill:T.blue,cornerRadius:12}),U(`${t}-label`,"Button label",0,16,a,i,"body",T.onBlue,{align:"center"})],{clip:!1})}function Gs(e){let t=e.width,n=e.height;return $e("form-root","iOS Form Screen",0,0,t,n,[at("form-status","dark",e),U("form-title","Title",16,80,t-32,"Create account","largeTitle",T.label),U("form-subtitle","Subtitle",16,130,t-32,"Start by adding your details.","subheadline",T.secondaryLabel),on(e,"form-name","Name",180,"NAME","Your name"),on(e,"form-email","Email",260,"EMAIL","you@example.com"),on(e,"form-password","Password",340,"PASSWORD","At least 8 characters"),Si(e,"form-cta",n-158,"Continue"),U("form-footnote","Footnote",16,n-94,t-32,"By continuing you agree to the terms.","caption1",T.secondaryLabel,{align:"center"}),Re("form-home","Home Indicator",(t-e.homeIndicatorWidth)/2,n-18,e.homeIndicatorWidth,e.homeIndicatorHeight,{fill:T.label,cornerRadius:3})],{fill:T.background,clip:!0})}function Ks(e){let t=e.width,n=e.height,i=ln(e);i.y=n-e.tabBarTotalHeight;let s=[["A","Alex Morgan","Design review \xB7 2m"],["M","Mia Chen","Shared a file \xB7 18m"],["S","Sam Rivera","Lunch tomorrow? \xB7 1h"],["J","Jordan Lee","Quarterly plan \xB7 3h"],["T","Taylor Kim","Voice note \xB7 Yesterday"],["N","Noah Patel","Deployment complete \xB7 Yesterday"]].map(([r,l,o],c)=>{let d=226+c*72;return $e(`list-row-${c}`,`List Row ${c+1}`,16,d,t-32,64,[cn(`list-avatar-${c}`,"Avatar",0,8,48,48,{fill:T.fill}),U(`list-initial-${c}`,"Avatar initial",0,18,48,r,"title2",T.secondaryLabel,{align:"center"}),U(`list-name-${c}`,"Name",64,8,t-140,l,"headline",T.label),U(`list-preview-${c}`,"Preview",64,32,t-140,o,"subheadline",T.secondaryLabel),U(`list-chevron-${c}`,"Chevron",t-80,20,16,"\u203A","title3",T.tertiaryLabel,{align:"center"})],{clip:!1})});return $e("list-root","iOS List Screen",0,0,t,n,[at("list-status","dark",e),U("list-title","Title",16,72,t-32,"Inbox","largeTitle",T.label),U("list-subtitle","Subtitle",16,120,t-32,"6 conversations","subheadline",T.secondaryLabel),$e("list-search","Search Field",16,154,t-32,36,[cn("list-search-icon","Search glyph",12,11,13,13,{stroke:T.secondaryLabel,strokeWidth:1.5}),U("list-search-placeholder","Placeholder",32,8,220,"Search","subheadline",T.secondaryLabel)],{fill:T.fill,cornerRadius:10}),...s,i],{fill:T.background,clip:!0})}function Us(e){let t=e.width,n=e.height,i=Ei(e,"Details");return $e("detail-root","iOS Detail Screen",0,0,t,n,[at("detail-status","dark",e),i,Re("detail-hero","Cover image",0,98,t,240,{fill:T.fill}),U("detail-hero-label","Cover label",16,200,t-32,"Cover image","headline",T.secondaryLabel,{align:"center"}),U("detail-title","Title",16,360,t-32,"A calmer way to start the day","title1",T.label),U("detail-body","Body",16,404,t-32,"A short description of the story, collection or product. Replace this copy with real content.","body",T.secondaryLabel),U("detail-meta","Meta",16,478,t-32,"5 min read \xB7 Today","caption1",T.secondaryLabel),Si(e,"detail-cta",n-158,"Read story"),Re("detail-home","Home Indicator",(t-e.homeIndicatorWidth)/2,n-18,e.homeIndicatorWidth,e.homeIndicatorHeight,{fill:T.label,cornerRadius:3})],{fill:T.background,clip:!0})}function Js(e){return at("tpl-status","dark",e)}function Zs(e){return at("tpl-status-light","light",e)}function qs(e){return Ei(e)}function Qs(e){return ln(e)}var er={"ios-screen":Xs,"ios-form-screen":Gs,"ios-list-screen":Ks,"ios-detail-screen":Us,"ios-status-bar":Js,"ios-status-bar-light":Zs,"ios-nav-bar":qs,"ios-tab-bar":Qs},ve=Ve(We),ut=[{id:"ios-screen",name:"iOS \u5C4F\u5E55",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F + \u7075\u52A8\u5C9B\u3001\u5927\u6807\u9898\u3001\u641C\u7D22\u3001\u8BBE\u7F6E\u5361\u7247\u3001\u6807\u7B7E\u680F\u3001Home Indicator",system:"iOS HIG",category:"page",width:ve.width,height:ve.height,deviceAware:!0},{id:"ios-form-screen",name:"iOS \u8868\u5355\u9875",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5927\u6807\u9898\u3001\u8F93\u5165\u5B57\u6BB5\u3001\u4E3B\u6309\u94AE\u3001Home Indicator",system:"iOS HIG",category:"page",width:ve.width,height:ve.height,deviceAware:!0},{id:"ios-list-screen",name:"iOS \u5217\u8868\u9875",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5927\u6807\u9898\u3001\u641C\u7D22\u3001\u5217\u8868\u884C\u3001\u6807\u7B7E\u680F",system:"iOS HIG",category:"page",width:ve.width,height:ve.height,deviceAware:!0},{id:"ios-detail-screen",name:"iOS \u8BE6\u60C5\u9875",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5BFC\u822A\u680F\u3001\u5C01\u9762\u533A\u3001\u6807\u9898\u6B63\u6587\u3001\u5E95\u90E8\u6309\u94AE",system:"iOS HIG",category:"page",width:ve.width,height:ve.height,deviceAware:!0},{id:"ios-status-bar",name:"iOS \u72B6\u6001\u680F",description:"\u6807\u51C6 390/393\xD754 \u72B6\u6001\u680F\uFF1A\u65F6\u95F4\u3001\u7075\u52A8\u5C9B\u3001\u4FE1\u53F7\u30015G\u3001\u7535\u91CF\uFF08\u900F\u660E\u80CC\u666F\uFF0C\u6DF1\u8272\u56FE\u6807\uFF09",system:"iOS HIG",category:"system",width:ve.width,height:ve.statusBarHeight,deviceAware:!0},{id:"ios-status-bar-light",name:"iOS \u72B6\u6001\u680F\uFF08\u6DF1\u8272\u9875\u9762\uFF09",description:"\u6807\u51C6\u72B6\u6001\u680F\u7684\u6D45\u8272\u56FE\u6807\u7248\u672C\uFF0C\u7528\u4E8E\u6DF1\u8272\u80CC\u666F\uFF08\u900F\u660E\u80CC\u666F\uFF09",system:"iOS HIG",category:"system",width:ve.width,height:ve.statusBarHeight,deviceAware:!0},{id:"ios-nav-bar",name:"iOS \u5BFC\u822A\u680F",description:"iOS \u5BFC\u822A\u680F\uFF1A\u8FD4\u56DE\u3001\u6807\u9898\u3001\u53F3\u4FA7\u52A8\u4F5C",system:"iOS HIG",category:"system",width:ve.width,height:ve.navBarHeight,deviceAware:!0},{id:"ios-tab-bar",name:"iOS \u6807\u7B7E\u680F",description:"iOS \u6807\u7B7E\u680F\uFF1A5 \u4E2A Tab + Home Indicator",system:"iOS HIG",category:"system",width:ve.width,height:ve.tabBarTotalHeight,deviceAware:!0}];function $i(e,t={}){let n=ut.find(c=>c.id===e),i=er[e];if(!n||!i)throw new Error(`unknown canvas template "${e}"`);let a=Ve(t.device),s=i(a),r=`tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,l=0,o=c=>(c.id=`${r}_${(++l).toString(36)}`,Array.isArray(c.children)&&c.children.forEach(o),c);return o(s),s.name=n.name,s.rotation=0,{node:s,template:{...n,width:s.width,height:s.height,device:a.id}}}function ki(e){return e*Math.PI/180}function Ue(e){return{x:e.absX+e.width/2,y:e.absY+e.height/2}}function dn(e,t){let n=Ue(e),i=-ki(e.rotation||0),a=t.x-n.x,s=t.y-n.y;return{x:a*Math.cos(i)-s*Math.sin(i)+e.width/2,y:a*Math.sin(i)+s*Math.cos(i)+e.height/2}}function de(e,t){let n=Ue(e),i=ki(e.rotation||0),a=t.x-e.width/2,s=t.y-e.height/2;return{x:a*Math.cos(i)-s*Math.sin(i)+n.x,y:a*Math.sin(i)+s*Math.cos(i)+n.y}}function pt(e,t){if(!e||e.visible===!1)return!1;if(e.type==="group")return(e.children??[]).some(i=>pt(i,t));let n=dn(e,t);return n.x>=0&&n.y>=0&&n.x<=e.width&&n.y<=e.height}function tr(e){return{x:e.absX,y:e.absY,width:e.width,height:e.height}}function Ii(e,t){return!(e.x+e.width<t.x||t.x+t.width<e.x||e.y+e.height<t.y||t.y+t.height<e.y)}function _e(e){if(!e.length)return null;let t=1/0,n=1/0,i=-1/0,a=-1/0;for(let s of e)t=Math.min(t,s.x),n=Math.min(n,s.y),i=Math.max(i,s.x+s.width),a=Math.max(a,s.y+s.height);return{x:t,y:n,width:i-t,height:a-n}}function hn(e){return[de(e,{x:0,y:0}),de(e,{x:e.width,y:0}),de(e,{x:e.width,y:e.height}),de(e,{x:0,y:e.height})]}function ae(e,t){return{x:t.x*e.zoom+e.x,y:t.y*e.zoom+e.y}}function Te(e,t){return{x:(t.x-e.x)/e.zoom,y:(t.y-e.y)/e.zoom}}function Ni(e,t){let n={nw:{x:0,y:0},n:{x:.5,y:0},ne:{x:1,y:0},e:{x:1,y:.5},se:{x:1,y:1},s:{x:.5,y:1},sw:{x:0,y:1},w:{x:0,y:.5}},i={};for(let[a,s]of Object.entries(n)){let r=de(e,{x:s.x*e.width,y:s.y*e.height});i[a]=ae(t,r)}return i}function Ci(e,t){let n=de(e,{x:e.width/2,y:-22/t.zoom});return ae(t,n)}function mt(e,t,n){return Math.min(n,Math.max(t,e))}function Mi(e){return e?.roots?.length?_e(e.roots.filter(t=>t.visible!==!1).map(tr))??{x:0,y:0,width:1,height:1}:{x:0,y:0,width:1,height:1}}var Ne=class extends Error{constructor(t,n,i,a,s,r){super(t),this.name="ApiError",this.status=n,this.code=i,this.details=a,this.doc=s,this.revision=r}};function nr(e){let t=typeof document<"u"?document.baseURI:void 0;try{let n=new URL(e,t??"http://127.0.0.1/");return n.origin==="null"?e:n.pathname+n.search}catch{return e}}function ft(e){return nr(`dsh-canvas/api/${e}`)}async function Pe(e,t={}){let n=await fetch(ft(e),{method:t.method??"GET",headers:t.body===void 0?{accept:"application/json"}:{accept:"application/json","content-type":"application/json"},body:t.body===void 0?void 0:JSON.stringify(t.body),signal:t.signal,credentials:"same-origin"}),i=null,a=await n.text();try{i=a?JSON.parse(a):null}catch{throw new Ne(`unexpected response from canvas host (${n.status})`,n.status,"bad-response")}if(!n.ok||i?.ok===!1)throw new Ne(i?.message??i?.error??`canvas request failed (${n.status})`,n.status,i?.error??"request-failed",i?.details,i?.doc,i?.revision);return i}function gt(e,t,n){let i=new URLSearchParams({sessionId:e});return t&&i.set("name",t),Pe(`state?${i}`,{signal:n})}function un(e,t,n,i,a){return Pe("doc",{method:"PUT",body:{sessionId:e,name:t,baseRevision:n,doc:i},signal:a})}function zi(e,t,n){return Pe("doc/rename",{method:"POST",body:{sessionId:e,from:t,to:n}})}function Ai(e,t){return Pe("doc/delete",{method:"POST",body:{sessionId:e,name:t}})}function Fi(e,t,n={}){return Pe("audit",{method:"POST",body:{sessionId:e,name:t,...n}})}function Ti(e){let t=new URLSearchParams({sessionId:e});return Pe(`image/capabilities?${t}`)}function Pi(e,t,n){return Pe("image/generate",{method:"POST",body:{sessionId:e,name:t,prompt:n}})}function Di(e,t,n,i){return Pe("selection",{method:"POST",body:{sessionId:e,name:t,ids:n,pageId:i}}).catch(()=>{})}function pn(e,t,n,i){return Pe("export",{method:"POST",body:{sessionId:e,name:t,kind:n,data:i}})}function Xe(e,t,n){let i=new URLSearchParams({sessionId:e,name:t,asset:n});return ft(`asset?${i}`)}function mn(e,t){let n=new URLSearchParams({sessionId:e,asset:t});return ft(`font?${n}`)}function Li(e){return new Promise((t,n)=>{let i=new FileReader;i.onload=()=>{let a=String(i.result??""),s=a.indexOf(",");t(s===-1?"":a.slice(s+1))},i.onerror=()=>n(i.error??new Error("read failed")),i.readAsDataURL(e)})}function Oi(e){let t=e.lastIndexOf(".");return t===-1?"":e.slice(t).toLowerCase()}async function fn(e,t){let n=Oi(t.name);if(![".png",".jpg",".jpeg",".webp",".gif"].includes(n))throw new Error("\u53EA\u652F\u6301 png/jpeg/webp/gif \u56FE\u7247");let a=await Li(t);return Pe("asset",{method:"POST",body:{sessionId:e,ext:n,data:a}})}async function Hi(e,t,n){let i=Oi(t.name);if(![".woff2",".woff",".ttf",".otf"].includes(i))throw new Error("\u53EA\u652F\u6301 woff2/woff/ttf/otf \u5B57\u4F53");let s=await Li(t);return Pe("font",{method:"POST",body:{sessionId:e,ext:i,data:s,...n}})}async function Bi(e,t,n,i){let a=500;for(;!i.aborted;){try{let s=new URLSearchParams({sessionId:e,name:t}),r=await fetch(ft(`events?${s}`),{headers:{accept:"text/event-stream"},credentials:"same-origin",signal:i});if(!r.ok||!r.body)throw new Error(`event stream failed (${r.status})`);a=500;let l=r.body.getReader(),o=new TextDecoder,c="";for(;!i.aborted;){let{done:d,value:u}=await l.read();if(d)break;c+=o.decode(u,{stream:!0});let p=c.indexOf(`

`);for(;p!==-1;){let w=c.slice(0,p);c=c.slice(p+2);for(let v of w.split(`
`))if(v.startsWith("data: "))try{n(JSON.parse(v.slice(6)))}catch{}p=c.indexOf(`

`)}}}catch{if(i.aborted)return}await new Promise(s=>setTimeout(s,a)),a=Math.min(a*2,5e3)}}function De(e){try{return fetch(ft("diag"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(e),credentials:"same-origin",keepalive:!0}).catch(()=>{})}catch{return Promise.resolve(void 0)}}var Ji="main";function He(e){return structuredClone(e)}function me(e,t){for(let n of e??[]){if(n.id===t)return n;let i=me(n.children,t);if(i)return i}return null}function yn(e,t,n=null){for(let i of e??[]){if(i.id===t)return n;let a=yn(i.children,t,i);if(a!==void 0)return a}}function ea(e,t){let n=e.findIndex(i=>i.id===t);if(n!==-1)return e.splice(n,1)[0];for(let i of e){let a=ea(i.children??[],t);if(a)return a}return null}function Zi(e,t){let n=He(e),i=a=>{let s=t(a.id);a.id=s,Array.isArray(a.children)&&a.children.forEach(i)};if(i(n),n.type==="instance"&&n.overrides){let a={};for(let[s,r]of Object.entries(n.overrides))a[t(s)]=r;n.overrides=a}return n}var Ct=class{constructor({sessionId:t,inputActions:n,onToast:i}){this.sessionId=t,this.inputActions=n,this.onToast=i??(()=>{}),this.listeners=new Set,this.version=0,this.measure=Qe(),this.history=new St(100),this.saveTimer=null,this.selectionTimer=null,this.eventsAbort=null,this.pollTimer=null,this.mounted=!1,this.loadingAbort=null,this.readyPromise=new Promise(a=>{this.resolveReady=a}),this.fontAssets=new Map,this.state={ready:!1,error:null,loading:!0,docs:[],name:Ji,doc:null,revision:null,path:"",pageId:null,selection:[],primaryKey:null,viewport:{x:40,y:40,zoom:1},tool:"pointer",panel:"layers",inspectorOpen:!0,dirty:!1,saving:!1,savedAt:null,conflict:null,notice:null,editingText:null,commentDraft:null,enteredInstance:null,componentMode:null,crop:null,scene:null,sceneIssues:[],showComments:!0,fontVersion:0,zoomLabel:"100%",historyVersion:0,foundation:{device:We,preset:ht},audit:null,imageCapabilities:null,imageGenerating:!1}}subscribe=t=>(this.listeners.add(t),()=>this.listeners.delete(t));getVersion=()=>this.version;emit(){this.version+=1;for(let t of this.listeners)t()}set(t,n=!0){Object.assign(this.state,t),n&&this.emit()}toast(t,n="info"){this.state.notice={text:t,kind:n,at:Date.now()},this.emit(),this.onToast?.({text:t,kind:n}),clearTimeout(this.noticeTimer),this.noticeTimer=setTimeout(()=>{this.state.notice=null,this.emit()},3200)}async mount(){this.mounted||(this.mounted=!0,await this.bootstrap())}unmount(){this.mounted=!1,clearTimeout(this.saveTimer),clearTimeout(this.selectionTimer),this.eventsAbort?.abort(),clearInterval(this.pollTimer),this.loadingAbort?.abort(),this.flush().catch(()=>{})}async bootstrap(){this.state.loading=!0,this.emit();try{let t=await gt(this.sessionId,void 0);this.applyState(t,{resetHistory:!0}),this.state.ready=!0,this.state.loading=!1,this.emit(),await this.ensureFonts(),this.connectEvents(),this.startPolling()}catch(t){this.state.loading=!1,this.state.ready=!1,this.state.error=t instanceof Ne?t.message:String(t?.message??t),this.emit()}finally{this.resolveReady?.()}}async focusNode(t={}){if(await this.readyPromise,!this.state.ready)return!1;t.doc&&t.doc!==this.state.name&&await this.loadDoc(t.doc),t.page&&Gn(this.state.doc,t.page)&&(this.state.pageId=t.page,this.rebuild());let n=t.node?this.findSceneNode(t.node):null;return t.node&&!n?(this.toast("\u753B\u5E03\u4E2D\u627E\u4E0D\u5230\u8FD9\u4E2A\u5143\u7D20\uFF0C\u53EF\u80FD\u5DF2\u88AB\u5220\u9664"),!1):(n&&(n.instanceId&&(this.state.enteredInstance=n.instanceId),this.state.inspectorOpen=!0,this.setSelection([n.key]),this.zoomToSelection()),this.emit(),!0)}applyState(t,{resetHistory:n=!1}={}){let i=Ye(t.doc);this.state.doc=i,this.state.name=t.name??Ji,this.state.revision=t.revision??null,this.state.path=t.path??"",this.state.docs=t.docs??[],this.state.pageId=i.pages[0]?.id??null,this.state.selection=[...new Set(t.selection?.ids??[])],this.state.primaryKey=this.state.selection[0]??null,this.state.conflict=null,this.state.dirty=!1,this.state.error=null,n&&this.history.reset(i),this.rebuild()}rebuild(){if(this.state.doc){try{let t=qt(this.state.doc,{pageId:this.state.pageId,mode:this.state.componentMode?"component":"design",componentId:this.state.componentMode?.componentId,measureText:this.measure});Et(t),this.state.scene=t,this.state.sceneIssues=t.issues??[];let n=new Set(this.state.selection.filter(i=>t.byKey.has(i)));n.size!==this.state.selection.length&&(this.state.selection=[...n],this.state.primaryKey=this.state.selection[0]??null)}catch(t){this.state.scene=null,this.state.error=`\u753B\u5E03\u6E32\u67D3\u5931\u8D25\uFF1A${String(t?.message??t)}`}this.state.historyVersion+=1}}findSceneNode(t){return this.state.scene?.byKey.get(t)??null}selectedNodes(){return this.state.selection.map(t=>this.findSceneNode(t)).filter(Boolean)}primaryNode(){return this.state.primaryKey?this.findSceneNode(this.state.primaryKey):null}setSelection(t,n){this.state.selection=[...new Set(t)],this.state.primaryKey=n??this.state.selection[0]??null,this.state.editingText=null,this.emit(),this.queueSelectionPost()}toggleSelection(t){let n=this.state.selection.includes(t);this.setSelection(n?this.state.selection.filter(i=>i!==t):[...this.state.selection,t],t)}clearSelection(){this.setSelection([],null)}queueSelectionPost(){clearTimeout(this.selectionTimer),this.selectionTimer=setTimeout(()=>{let t=new Set;for(let n of this.state.selection){let i=this.findSceneNode(n);t.add(i?.instanceId??i?.id??n)}Di(this.sessionId,this.state.name,[...t],this.state.pageId)},120)}setTool(t){this.state.tool=t,t!=="comment"&&(this.state.commentDraft=null),this.emit()}setPanel(t){this.state.panel=t,this.emit()}setViewport(t){this.state.viewport=t,this.emit()}zoomAt(t,n){let i=this.state.viewport,a=Te(i,t),s=mt(i.zoom*n,.02,32);this.state.viewport={zoom:s,x:t.x-a.x*s,y:t.y-a.y*s},this.emit()}zoomToFit(t=48){let n=this.state.scene?Mi(this.state.scene):null;n&&this.zoomToRect(n,t)}zoomToSelection(t=64){let n=this.selectedNodes();if(!n.length){this.zoomToFit(t);return}let i=_e(n.map(a=>({x:a.absX,y:a.absY,width:a.width,height:a.height})));i&&this.zoomToRect(i,t)}zoomToRect(t,n=48){let i=this.viewportSize(),a=Math.max(1,t.width),s=Math.max(1,t.height),r=mt(Math.min((i.width-n*2)/a,(i.height-n*2)/s),.02,8);this.state.viewport={zoom:r,x:i.width/2-(t.x+a/2)*r,y:i.height/2-(t.y+s/2)*r},this.emit()}viewportSize(){return this.canvasSize??{width:900,height:600}}async loadDoc(t,{resetHistory:n=!0}={}){await this.flush();try{let i=await gt(this.sessionId,t);this.applyState(i,{resetHistory:n}),this.emit(),await this.ensureFonts(),this.connectEvents(),this.startPolling()}catch(i){this.toast(i instanceof Ne?i.message:String(i),"error")}}async createDoc(t){if(!/^[a-z0-9][a-z0-9-_]{0,63}$/.test(t)){this.toast("\u6587\u6863\u540D\u53EA\u80FD\u662F\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001- \u548C _","error");return}try{await this.flush();let n=Yn("\u65B0\u753B\u5E03");n.pages[0].name="Page 1";let i=await un(this.sessionId,t,null,n);this.state.revision=i.revision,await this.loadDoc(t),this.toast("\u5DF2\u521B\u5EFA\u753B\u5E03")}catch(n){this.toast(n instanceof Ne?n.message:String(n),"error")}}async renameDoc(t,n=this.state.name){if(!/^[a-z0-9][a-z0-9-_]{0,63}$/.test(t)){this.toast("\u6587\u6863\u540D\u53EA\u80FD\u662F\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001- \u548C _","error");return}if(t===n){this.toast("\u540D\u79F0\u6CA1\u6709\u53D8\u5316");return}try{if(await this.flush(),this.state.dirty||this.state.saving){this.toast("\u8BF7\u5148\u89E3\u51B3\u753B\u5E03\u4FDD\u5B58\u51B2\u7A81\uFF0C\u518D\u91CD\u547D\u540D","error");return}let i=this.state.name,a=await zi(this.sessionId,n,t),s=a.name??t;if(this.state.docs=a.docs??this.state.docs,n!==i){this.emit(),this.toast("\u5DF2\u91CD\u547D\u540D\u753B\u5E03");return}await this.loadDoc(s);let r=this.state.doc;r&&(!r.title||r.title==="\u4E3B\u753B\u5E03"||r.title==="\u65B0\u753B\u5E03"||r.title===i)&&r.title!==s&&(r.title=s,this.state.dirty=!0,this.state.docs=(this.state.docs??[]).map(o=>o.name===s?{...o,title:s}:o),this.scheduleSave()),this.toast("\u5DF2\u91CD\u547D\u540D\u753B\u5E03")}catch(i){this.toast(i instanceof Ne?i.message:String(i),"error")}}async deleteDoc(){try{if(await this.flush(),this.state.dirty||this.state.saving){this.toast("\u8BF7\u5148\u89E3\u51B3\u753B\u5E03\u4FDD\u5B58\u51B2\u7A81\uFF0C\u518D\u5220\u9664","error");return}let t=await Ai(this.sessionId,this.state.name),n=t.name??"main";this.state.docs=t.docs??[],await this.loadDoc(n),this.toast("\u5DF2\u5220\u9664\u753B\u5E03")}catch(t){this.toast(t instanceof Ne?t.message:String(t),"error")}}async flush(){if(clearTimeout(this.saveTimer),!this.state.doc||!this.state.dirty||this.state.saving)return;let t=this.state.revision,n=He(this.state.doc);this.state.saving=!0,this.emit();let i=JSON.stringify(n);try{let a=await un(this.sessionId,this.state.name,t,n);this.state.revision=a.revision,this.state.path=a.path,this.state.savedAt=Date.now(),JSON.stringify(this.state.doc)===i?this.state.dirty=!1:(this.state.dirty=!0,clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.flush(),250))}catch(a){a instanceof Ne&&a.status===409?this.state.conflict={revision:a.revision,doc:a.doc?Ye(a.doc):null,message:"\u753B\u5E03\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"}:this.toast(a instanceof Ne?a.message:String(a),"error")}finally{this.state.saving=!1,this.emit()}}scheduleSave(){this.state.dirty=!0,clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.flush(),400),this.emit()}startPolling(){clearInterval(this.pollTimer),this.pollTimer=setInterval(()=>{!this.mounted||!this.state.ready||this.state.saving||this.pollRemote().catch(()=>{})},3e3)}async pollRemote(){let t=await gt(this.sessionId,this.state.name);if(!(!t||t.revision===this.state.revision)){if(this.state.dirty){this.state.conflict={revision:t.revision,doc:t.doc?Ye(t.doc):null,message:"\u753B\u5E03\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"},this.emit();return}this.applyState(t,{resetHistory:!1}),this.emit()}}connectEvents(){this.eventsAbort?.abort();let t=new AbortController;this.eventsAbort=t,Bi(this.sessionId,this.state.name,n=>{if(n.type==="doc-changed"&&n.revision!==this.state.revision&&n.source!=="client"){if(this.state.dirty||this.state.saving){this.state.conflict={revision:n.revision,message:"\u753B\u5E03\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"},this.emit();return}this.reloadFromServer(!1)}},t.signal)}async reloadFromServer(t=!0){try{let n=await gt(this.sessionId,this.state.name),i=this.history;this.applyState(n,{resetHistory:!1}),t||i.reset(n.doc),this.emit()}catch(n){this.toast(n instanceof Ne?n.message:String(n),"error")}}resolveConflict(t){let n=this.state.conflict;if(n){if(t&&!n.doc){this.state.conflict=null,this.reloadFromServer(!1);return}if(t&&n.doc){this.state.doc=Ye(n.doc),this.state.revision=n.revision,this.state.conflict=null,this.state.dirty=!1,this.history.reset(this.state.doc),this.rebuild(),this.emit(),this.toast("\u5DF2\u52A0\u8F7D\u6700\u65B0\u753B\u5E03");return}this.state.revision=n.revision,this.state.conflict=null,this.state.dirty=!0,this.flush()}}mutate(t,{commit:n=!0,select:i,label:a}={}){if(this.state.doc){try{t(this.state.doc)}catch(s){this.toast(String(s?.message??s),"error");return}i&&(this.state.selection=[...new Set(i)],this.state.primaryKey=this.state.selection[0]??null),this.rebuild(),this.emit(),n&&(this.commit(a),this.scheduleSave(),this.queueSelectionPost())}}commit(){this.state.doc&&this.history.commit(this.state.doc),this.state.historyVersion+=1,this.emit()}updateNode(t,n,i={}){this.mutate(a=>{let s=me([...a.pages.flatMap(r=>r.children),...a.components.map(r=>r.root)],t);if(!s)throw new Error(`\u627E\u4E0D\u5230\u8282\u70B9 ${t}`);Object.assign(s,n)},i)}updateSelected(t,n={}){let i=this.selectedNodes().filter(a=>a.editable);i.length&&this.mutate(a=>{for(let s of i){let r=me([...a.pages.flatMap(l=>l.children),...a.components.map(l=>l.root)],s.sourceId);r&&Object.assign(r,t)}},n)}updateNodeBySource(t,n,i={}){this.updateNode(t,n,i)}addNode(t,n,i){let a=t.id??ie(t.type==="instance"?"i":"n"),s={name:t.name??dr(t.type),x:0,y:0,width:120,height:120,rotation:0,opacity:1,visible:!0,locked:!1,...t,id:a};return s.type!=="frame"&&s.type!=="group"&&s.type!=="instance"&&delete s.children,this.mutate(r=>{let l=r.pages,o=l.find(d=>d.id===this.state.pageId)??l[0],c=null;n&&(c=me(l.flatMap(d=>d.children),n),c&&(o=c)),c?(c.children=c.children??[],c.children.splice(i??c.children.length,0,s)):(o.children=o.children??[],o.children.push(s))},{select:[a]}),s}createShapeAt(t,n){let i={frame:{name:"Frame",width:320,height:480,fills:[{type:"solid",color:"#FFFFFF"}],strokes:[],effects:[],cornerRadius:0,clip:!0,children:[]},rect:{name:"Rectangle",width:120,height:120,fills:[{type:"solid",color:"#D9D9D9"}],strokes:[],effects:[],cornerRadius:0},ellipse:{name:"Ellipse",width:120,height:120,fills:[{type:"solid",color:"#D9D9D9"}],strokes:[],effects:[],cornerRadius:0},text:{name:"Text",width:200,height:28,text:"Text",font:{family:"system-ui",weight:400,style:"normal",size:16,lineHeight:1.4,letterSpacing:0},align:"left",verticalAlign:"top",fills:[{type:"solid",color:"#111111"}],effects:[],autoHeight:!0},line:{name:"Line",width:160,height:0,strokes:[{color:"#111111",width:1,align:"center"}]}}[t];if(!i)return;let a=this.addNode({type:t,...i,x:n.x,y:n.y,rotation:0,opacity:1,visible:!0,locked:!1},null);return a&&(this.setTool("pointer"),a.type==="text"&&this.beginTextEdit(a.id)),a}deleteSelection(){let t=this.selectedNodes().filter(a=>a.editable&&!a.isInstanceRoot).map(a=>a.sourceId),n=this.selectedNodes().filter(a=>a.isInstanceRoot).map(a=>a.sourceId),i=[...new Set([...t,...n])];i.length&&this.mutate(a=>{for(let s of i)for(let r of a.pages)ea(r.children,s)},{select:[]})}duplicateSelection(){let t=this.selectedNodes().filter(i=>i.editable&&!i.isInstanceRoot);if(!t.length)return;let n=[];this.mutate(i=>{for(let a of t){let s=this.findDocParent(i,a.sourceId),r=s?s.children:i.pages.find(c=>c.id===this.state.pageId)?.children;if(!r)continue;let l=me(r,a.sourceId);if(!l)continue;let o=Zi(l,c=>ie("n"));o.x+=10,o.y+=10,r.push(o),n.push(o.id)}},{select:n})}findDocParent(t,n){for(let i of t.pages){let a=yn(i.children,n,null);if(a!==void 0)return a}}copySelection(){let t=this.selectedNodes().filter(n=>n.editable);t.length&&(this.clipboard=t.map(n=>He(n.sourceNode)),this.toast(`\u5DF2\u590D\u5236 ${t.length} \u4E2A\u56FE\u5C42`))}paste(){if(!this.clipboard?.length)return;let t=[];this.mutate(n=>{let i=n.pages.find(a=>a.id===this.state.pageId)??n.pages[0];for(let a of this.clipboard){let s=Zi(a,()=>ie("n"));s.x+=20,s.y+=20,i.children.push(s),t.push(s.id)}},{select:t})}groupSelection(){let t=this.selectedNodes().filter(s=>s.editable&&!s.isInstanceRoot);if(t.length<2)return;let n=t[0].parent?.id??null;if(!t.every(s=>(s.parent?.id??null)===n)){this.toast("\u53EA\u6709\u540C\u4E00\u7236\u7EA7\u7684\u56FE\u5C42\u53EF\u4EE5\u6210\u7EC4");return}let i=_e(t.map(s=>({x:s.absX,y:s.absY,width:s.width,height:s.height}))),a=ie("g");this.mutate(s=>{let r=n?me(s.pages.flatMap(v=>v.children),n):s.pages.find(v=>v.id===this.state.pageId);if(!r)return;let l=r.children,o=new Set(t.map(v=>v.sourceId)),c=0,d=[];for(let v=l.length-1;v>=0;v-=1)o.has(l[v].id)&&d.unshift(l.splice(v,1)[0]);let u=t[0].parent?{x:t[0].parent.absX,y:t[0].parent.absY}:{x:0,y:0},p=i.x-u.x,w=i.y-u.y;for(let v of d)v.x-=p-c,v.y-=w-originY;l.push({id:a,type:"group",name:"Group",x:p,y:w,width:i.width,height:i.height,rotation:0,opacity:1,visible:!0,locked:!1,children:d})},{select:[a]})}ungroupSelection(){let t=this.selectedNodes().filter(i=>i.sourceNode?.type==="group"&&i.editable);if(!t.length)return;let n=[];this.mutate(i=>{for(let a of t){let s=this.findDocParent(i,a.sourceId),r=s?s.children:i.pages.find(d=>d.id===this.state.pageId)?.children;if(!r)continue;let l=r.findIndex(d=>d.id===a.sourceId);if(l===-1)continue;let[o]=r.splice(l,1),c=l;for(let d of o.children??[])d.x+=o.x,d.y+=o.y,r.splice(c,0,d),c+=1,n.push(d.id)}},{select:n})}reorder(t){let n=this.selectedNodes().filter(i=>i.editable);n.length&&this.mutate(i=>{for(let a of n){let s=this.findDocParent(i,a.sourceId),r=s?s.children:i.pages.find(c=>c.id===this.state.pageId)?.children;if(!r)continue;let l=r.findIndex(c=>c.id===a.sourceId);if(l===-1)continue;let[o]=r.splice(l,1);t==="front"?r.push(o):t==="back"?r.unshift(o):t==="forward"?r.splice(Math.min(r.length,l+1),0,o):r.splice(Math.max(0,l-1),0,o)}},{select:this.state.selection})}align(t){let n=this.selectedNodes().filter(a=>a.editable&&!a.isInstanceRoot);if(n.length<2)return;let i=_e(n.map(a=>({x:a.absX,y:a.absY,width:a.width,height:a.height})));this.mutate(a=>{for(let s of n){let r=me(a.pages.flatMap(l=>l.children),s.sourceId);r&&(t==="left"?r.x+=i.x-s.absX:t==="right"?r.x+=i.x+i.width-(s.absX+s.width):t==="centerX"?r.x+=i.x+i.width/2-(s.absX+s.width/2):t==="top"?r.y+=i.y-s.absY:t==="bottom"?r.y+=i.y+i.height-(s.absY+s.height):t==="centerY"&&(r.y+=i.y+i.height/2-(s.absY+s.height/2)))}},{select:this.state.selection})}distribute(t){let n=this.selectedNodes().filter(i=>i.editable&&!i.isInstanceRoot);n.length<3||this.mutate(i=>{let a=[...n].sort((u,p)=>t==="x"?u.absX-p.absX:u.absY-p.absY),s=a[0],r=a[a.length-1],l=t==="x"?r.absX+r.width-s.absX:r.absY+r.height-s.absY,o=a.reduce((u,p)=>u+(t==="x"?p.width:p.height),0),c=(l-o)/(a.length-1),d=t==="x"?s.absX:s.absY;for(let u of a){let p=me(i.pages.flatMap(w=>w.children),u.sourceId);p&&(t==="x"?p.x+=d-u.absX:p.y+=d-u.absY,d+=(t==="x"?u.width:u.height)+c)}},{select:this.state.selection})}renameNode(t,n){this.updateNode(t,{name:n},{commit:!0})}setVisibility(t,n){this.updateNode(t,{visible:n},{commit:!0})}setLocked(t,n){this.updateNode(t,{locked:n},{commit:!0})}setText(t,n){this.updateNode(t,{text:n},{commit:!0})}beginTextEdit(t){let n=this.findSceneNode(t);!n||n.type!=="text"||(this.state.editingText={key:t,sourceId:n.sourceId,value:n.text??""},this.state.selection=[t],this.state.primaryKey=t,this.emit())}commitTextEdit(t){let n=this.state.editingText;n&&(this.state.editingText=null,t!==n.value?this.setText(n.sourceId,t):this.emit())}cancelTextEdit(){this.state.editingText=null,this.emit()}undo(){let t=this.history.undo();t&&(this.state.doc=Ye(t,{touch:!1}),this.rebuild(),this.state.dirty=!0,this.emit(),this.scheduleSave())}redo(){let t=this.history.redo();t&&(this.state.doc=Ye(t,{touch:!1}),this.rebuild(),this.state.dirty=!0,this.emit(),this.scheduleSave())}enterInstance(t){let n=this.findSceneNode(t);!n||n.type!=="instance"&&!n.isInstanceRoot||(this.state.enteredInstance=n.key,this.state.selection=[],this.state.primaryKey=null,this.toast("\u5DF2\u8FDB\u5165\u5B9E\u4F8B\uFF0C\u53CC\u51FB\u6587\u672C/\u5F62\u72B6\u53EF\u8986\u76D6\uFF0CEsc \u9000\u51FA"),this.emit())}exitInstance(){this.state.enteredInstance=null,this.state.selection=[],this.state.primaryKey=null,this.emit()}setOverride(t,n,i){this.mutate(a=>{let s=me(a.pages.flatMap(r=>r.children),t);!s||s.type!=="instance"||(s.overrides=s.overrides??{},s.overrides[n]={...s.overrides[n]??{},...i})})}detachInstance(t){this.mutate(n=>{for(let i of n.pages){let a=me(i.children,t);if(!a)continue;let s=n.components.find(d=>d.id===a.componentId);if(!s)throw new Error("\u4E3B\u7EC4\u4EF6\u4E0D\u5B58\u5728");let r=yn(i.children,t,null),l=r?r.children:i.children,o=l.findIndex(d=>d.id===t),c=this.materializeInstance(n,s,a);l.splice(o,1,c);return}},{select:[t]})}materializeInstance(t,n,i){let a=He(n.root),s=new Map,r=d=>{let u=ie("n");s.set(d.id,u),d.id=u;let p=i.overrides?.[d.id];p&&Object.assign(d,p),Array.isArray(d.children)&&d.children.forEach(r)},l=i.overrides??{},o=new Map(Object.entries(l)),c=d=>{let u=d.id,p=ie("n");s.set(u,p),d.id=p;let w=o.get(u);w&&(w.text!=null&&(d.text=w.text),w.fills!=null&&(d.fills=w.fills),w.visible!=null&&(d.visible=w.visible)),Array.isArray(d.children)&&d.children.forEach(c)};return a.x=i.x,a.y=i.y,i.width&&(a.width=i.width),i.height&&(a.height=i.height),c(a),a}createComponentFromSelection(t="Component"){let n=this.primaryNode();if(!n||!n.editable)return;let i=ie("cmp"),a=ie("n"),s=ie("i");this.mutate(r=>{let l=this.findDocParent(r,n.sourceId),o=l?l.children:r.pages.find(v=>v.id===this.state.pageId)?.children;if(!o)return;let c=o.findIndex(v=>v.id===n.sourceId);if(c===-1)return;let[d]=o.splice(c,1),u={x:n.absX,y:n.absY},p=He(d);p.x=0,p.y=0,p.id=a,r.components.push({id:i,name:t||d.name||"Component",variantProps:{},root:p});let w={id:s,type:"instance",name:d.name,x:u.x-(l?this.findSceneNode(n.parent?.key)?.absX??0:0),y:u.y-(l?this.findSceneNode(n.parent?.key)?.absY??0:0),width:d.width,height:d.height,rotation:0,opacity:1,visible:!0,locked:!1,componentId:i,variantProps:{},overrides:{}};w.x=n.absX-(n.parent?.absX??0),w.y=n.absY-(n.parent?.absY??0),o.splice(c,0,w)},{select:[s]}),this.toast("\u5DF2\u521B\u5EFA\u7EC4\u4EF6")}insertInstance(t){let i=this.state.doc?.components.find(o=>o.id===t);if(!i)return;let a=this.viewportSize(),s=this.state.viewport,r=Te(s,{x:a.width/2,y:a.height/2}),l={id:ie("i"),type:"instance",name:i.name,x:r.x-(i.root.width??120)/2,y:r.y-(i.root.height??40)/2,width:i.root.width??120,height:i.root.height??40,rotation:0,opacity:1,visible:!0,locked:!1,componentId:t,variantProps:{...i.variantProps??{}},overrides:{}};this.mutate(o=>{(o.pages.find(d=>d.id===this.state.pageId)??o.pages[0]).children.push(l)},{select:[l.id]})}setVariant(t,n,i){this.mutate(a=>{let s=me(a.pages.flatMap(r=>r.children),t);s&&(s.variantProps={...s.variantProps??{},[n]:i})})}swapComponent(t,n){this.state.doc.components.some(i=>i.id===n)&&this.mutate(i=>{let a=me(i.pages.flatMap(s=>s.children),t);a&&(a.componentId=n,a.variantProps={},a.overrides={})})}createVariantSet(t){if(t.length<2){this.toast("\u81F3\u5C11\u9009\u62E9\u4E24\u4E2A\u7EC4\u4EF6\u624D\u80FD\u521B\u5EFA\u53D8\u4F53\u96C6");return}this.mutate(n=>{let i=ie("vs"),a=t.map(r=>(n.components.find(o=>o.id===r)?.name??"Variant").split("/").pop().replace(/\s+/g,"-")),s=[...new Set(a)];for(let r of t){let l=n.components.find(o=>o.id===r);l&&(l.variantSetId=i,l.variantProps={State:(l.name??"Variant").split("/").pop().replace(/\s+/g,"-")})}n.variantSets.push({id:i,name:"Variant set",properties:[{name:"State",values:s}],componentIds:t})})}editComponent(t){this.state.componentMode={componentId:t},this.state.selection=[],this.state.primaryKey=null,this.rebuild(),this.emit()}exitComponentMode(){this.state.componentMode=null,this.state.selection=[],this.state.primaryKey=null,this.rebuild(),this.emit()}createStyle(t,n){let i=this.primaryNode();if(!i)return;let a=t==="fill"?i.fills?.[0]:t==="text"?{font:i.font,fills:i.fills}:i.effects;if(!a){this.toast("\u8BE5\u56FE\u5C42\u6CA1\u6709\u53EF\u521B\u5EFA\u7684\u6837\u5F0F");return}let s=ie("style");this.mutate(r=>{r.styles.push({id:s,type:t,name:n||`${t} style`,value:He(a)});let l=me(r.pages.flatMap(o=>o.children),i.sourceId);l&&(t==="fill"&&(l.fillStyleId=s),t==="text"&&(l.textStyleId=s),t==="effect"&&(l.effectStyleId=s))}),this.toast("\u5DF2\u521B\u5EFA\u6837\u5F0F")}applyStyle(t){let n=this.state.doc.styles.find(a=>a.id===t);if(!n)return;let i=this.selectedNodes().filter(a=>a.editable);i.length&&this.mutate(a=>{for(let s of i){let r=me(a.pages.flatMap(l=>l.children),s.sourceId);r&&(n.type==="fill"&&["frame","rect","ellipse","text"].includes(r.type)&&(r.fillStyleId=t),n.type==="text"&&r.type==="text"&&(r.textStyleId=t),n.type==="effect"&&(r.effectStyleId=t))}})}detachStyle(t){let n=this.state.doc.styles.find(i=>i.id===t);n&&this.mutate(i=>{let a=s=>{s.fillStyleId===t&&n.type==="fill"&&(s.fills=[He(n.value)],delete s.fillStyleId),s.textStyleId===t&&n.type==="text"&&(s.font=He(n.value.font),s.fills=He(n.value.fills),delete s.textStyleId),s.effectStyleId===t&&n.type==="effect"&&(s.effects=He(n.value),delete s.effectStyleId);for(let r of s.children??[])a(r)};for(let s of i.pages)s.children.forEach(a);for(let s of i.components)a(s.root)})}updateStyle(t,n){this.mutate(i=>{let a=i.styles.find(s=>s.id===t);a&&Object.assign(a,n)})}deleteStyle(t){this.mutate(n=>{n.styles=n.styles.filter(a=>a.id!==t);let i=a=>{a.fillStyleId===t&&delete a.fillStyleId,a.textStyleId===t&&delete a.textStyleId,a.effectStyleId===t&&delete a.effectStyleId;for(let s of a.children??[])i(s)};for(let a of n.pages)a.children.forEach(i);for(let a of n.components)i(a.root)})}pageBounds(){let t=this.state.scene;if(!t)return{x:0,y:0,width:1,height:1};let n=t.roots.filter(i=>i.visible!==!1);return _e(n.map(i=>({x:i.absX,y:i.absY,width:i.width,height:i.height})))??{x:0,y:0,width:1,height:1}}commentPosition(t){if(t.nodeId){let i=this.findSceneNode(t.nodeId);if(i)return ae(this.state.viewport,Ue(i))}let n=this.pageBounds();return ae(this.state.viewport,{x:n.x+(t.x??.5)*n.width,y:n.y+(t.y??.5)*n.height})}addComment(t,{nodeId:n,x:i,y:a}){if(!this.state.doc||!t.trim())return;let s=this.pageBounds(),r={x:i==null?.5:mt((i-s.x)/Math.max(1,s.width),0,1),y:a==null?.5:mt((a-s.y)/Math.max(1,s.height),0,1)};this.mutate(l=>{Un(l,{pageId:this.state.pageId??l.pages[0].id,nodeId:n??void 0,x:r.x,y:r.y,body:t,author:"user"})}),this.state.commentDraft=null,this.emit()}replyComment(t,n){n.trim()&&this.mutate(i=>Jn(i,t,n,"user"))}resolveComment(t,n=!0){this.mutate(i=>Zn(i,t,n))}deleteComment(t){this.mutate(n=>qn(n,t))}fontFaceStyle(){let t=[];for(let n of this.state.doc?.fonts??[]){if(!n?.asset)continue;let i=mn(this.sessionId,n.asset);t.push(`@font-face{font-family:"${n.family}";font-style:${n.style??"normal"};font-weight:${n.weight??400};src:url("${i}") format("${n.asset.endsWith(".woff2")?"woff2":n.asset.endsWith(".woff")?"woff":n.asset.endsWith(".otf")?"opentype":"truetype"}");font-display:block}`)}return t.join(`
`)}async ensureFonts(){let t=this.state.doc?.fonts??[];if(!t.length||typeof document>"u")return;let n=document.getElementById("dsh-canvas-fonts");n||(n=document.createElement("style"),n.id="dsh-canvas-fonts",document.head.appendChild(n)),n.textContent=this.fontFaceStyle();try{await Promise.all(t.map(i=>document.fonts?.load?.(`${i.style??"normal"} ${i.weight??400} 16px "${i.family}"`).catch(()=>{})))}catch{}this.state.fontVersion+=1,this.rebuild(),this.emit()}async uploadFontFile(t,n,i,a){try{let s=await Hi(this.sessionId,t,{family:n,weight:Number(i)||400,style:a||"normal"});this.mutate(r=>{r.fonts=r.fonts??[],r.fonts.some(l=>l.asset===s.asset)||r.fonts.push({id:ie("font"),family:n,weight:Number(i)||400,style:a||"normal",asset:s.asset,sourceName:t.name})}),await this.ensureFonts(),this.toast("\u5B57\u4F53\u5DF2\u4E0A\u4F20")}catch(s){this.toast(s?.message??String(s),"error")}}removeFont(t){let n=this.state.doc.fonts.find(s=>s.id===t);if(!n)return;let i=!1,a=s=>{s.type==="text"&&s.font?.family===n.family&&(s.font?.weight??400)===n.weight&&(i=!0);for(let r of s.children??[])a(r)};for(let s of this.state.doc.pages)s.children.forEach(a);for(let s of this.state.doc.components)a(s.root);if(i){this.toast("\u8BE5\u5B57\u4F53\u4ECD\u88AB\u6587\u672C\u4F7F\u7528\uFF0C\u5148\u66FF\u6362\u540E\u518D\u5220\u9664");return}this.mutate(s=>{s.fonts=s.fonts.filter(r=>r.id!==t)})}async uploadFillImage(t,n,i){try{let a=await fn(this.sessionId,i);this.mutate(s=>{let r=me([...s.pages.flatMap(l=>l.children),...s.components.map(l=>l.root)],t);r?.fills?.[n]&&(r.fills[n]={type:"image",asset:a.asset,fit:"cover"})})}catch(a){this.toast(a?.message??String(a),"error")}}requestImagePick(){return this.imagePicker?(this.imagePicker.click(),!0):(this.toast("\u56FE\u7247\u9009\u62E9\u5668\u5C1A\u672A\u51C6\u5907\u597D","error"),!1)}async uploadImageFile(t,n){try{let i=await fn(this.sessionId,t),a=await Qi(Xe(this.sessionId,this.state.name,i.asset)).catch(()=>({width:320,height:200})),s=Math.min(480,a.width||320),r=(a.height||200)*(s/(a.width||320)),l=n??this.viewportCenterWorld(),o={id:ie("n"),type:"rect",name:t.name.replace(/\.[^.]+$/,"")||"Image",x:l.x-s/2,y:l.y-r/2,width:s,height:r,rotation:0,opacity:1,visible:!0,locked:!1,cornerRadius:0,fills:[{type:"image",asset:i.asset,fit:"cover"}],strokes:[],effects:[]};this.addNode(o,null)}catch(i){this.toast(i?.message??String(i),"error")}}viewportCenterWorld(){let t=this.viewportSize();return Te(this.state.viewport,{x:t.width/2,y:t.height/2})}selectionText(){let t=this.selectedNodes();if(!t.length)return"";let n=t[0],i=t.length>1?`\u753B\u5E03\u9009\u533A\uFF08${t.length} \u4E2A\u56FE\u5C42\uFF09\uFF1A${n.name}`:`\u753B\u5E03\u9009\u533A\uFF1A${n.name}`;return yi({doc:this.state.name,node:n.key,page:this.state.pageId??void 0,label:i})}async insertSelectionToComposer(){let t=this.selectionText(),n=this.selectedNodes();if(!t||!n.length){this.toast("\u5148\u9009\u4E2D\u753B\u5E03\u5143\u7D20");return}bi({sessionId:this.sessionId,doc:this.state.name,node:n[0].key,page:this.state.pageId??void 0,label:n[0].name||n[0].type});let i=this.inputActions,a=!1;try{if(i&&typeof i.captureInsertion=="function"){let s=i.captureInsertion();a=i.insertText(t,s)}}catch{a=!1}if(a)this.toast("\u5DF2\u63D2\u5165\u753B\u5E03\u94FE\u63A5\uFF1B\u53D1\u9001\u540E\u70B9\u6D88\u606F\u91CC\u7684\u753B\u5E03 chip \u53EF\u8DF3\u8F6C");else try{await navigator.clipboard.writeText(t),this.toast("\u8F93\u5165\u6846\u4E0D\u53EF\u7528\uFF0C\u9009\u533A\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F")}catch{this.toast("\u65E0\u6CD5\u5199\u5165\u8F93\u5165\u6846\u6216\u526A\u8D34\u677F","error")}}insertTemplate(t){try{let{node:n,template:i}=$i(t,{device:this.state.foundation?.device??We}),a=this.viewportCenterWorld();if(n.x=Math.round(a.x-n.width/2),n.y=Math.round(a.y-n.height/2),!this.addNode(n,null))return;this.setTool("pointer"),this.zoomToSelection(),this.toast(`\u5DF2\u63D2\u5165\u6A21\u677F\uFF1A${i.name}`)}catch(n){this.toast(n?.message??String(n),"error")}}setFoundation(t={}){let n=Ve(t.device??this.state.foundation?.device??We),i=rn(t.preset??this.state.foundation?.preset??ht);this.state.foundation={device:n.id,preset:i.id},this.emit()}async loadImageCapabilities(){try{let t=await Ti(this.sessionId);return this.state.imageCapabilities=t.capabilities??null,this.emit(),this.state.imageCapabilities}catch{return this.state.imageCapabilities=null,this.emit(),null}}async insertImageAsset(t,n="AI image"){if(!t)return null;let i=await Qi(Xe(this.sessionId,this.state.name,t)).catch(()=>({width:320,height:200})),a=Math.min(480,i.width||320),s=(i.height||200)*(a/(i.width||320)),r=this.viewportCenterWorld(),l={id:ie("n"),type:"rect",name:n,x:r.x-a/2,y:r.y-s/2,width:a,height:s,rotation:0,opacity:1,visible:!0,locked:!1,cornerRadius:0,fills:[{type:"image",asset:t,fit:"cover"}],strokes:[],effects:[]};return this.addNode(l,null)}async generateImage(t){if(this.state.imageGenerating)return{ok:!1,code:"busy",message:"\u56FE\u7247\u751F\u6210\u8FDB\u884C\u4E2D"};let n=String(t??"").trim();if(!n)return this.toast("\u8BF7\u8F93\u5165\u56FE\u7247\u63CF\u8FF0"),{ok:!1,code:"prompt-required"};this.state.imageGenerating=!0,this.emit();try{let i=await Pi(this.sessionId,this.state.name,n);return i?.ok?(await this.insertImageAsset(i.asset,"AI image"),this.toast("\u56FE\u7247\u5DF2\u751F\u6210\u5E76\u63D2\u5165\u753B\u5E03"),i):(this.toast(i?.message??"\u56FE\u7247\u751F\u6210\u5931\u8D25","error"),i)}catch(i){return this.toast(i?.message??String(i),"error"),{ok:!1,code:i?.code??"image-failed",message:i?.message}}finally{this.state.imageGenerating=!1,this.emit()}}async runAudit(t="page"){let n=t==="selection"?this.selectedNodes()[0]?.sourceId:void 0;if(t==="selection"&&!n)return this.toast("\u5148\u9009\u4E2D\u4E00\u4E2A\u8282\u70B9"),null;try{let i=await Fi(this.sessionId,this.state.name,{...n?{nodeId:n}:{},...this.state.pageId?{pageId:this.state.pageId}:{},system:"ios"});this.state.audit=i,this.emit();let a=(i.findings??[]).filter(s=>s.severity==="high").length;return this.toast(a?`\u68C0\u67E5\u5B8C\u6210\uFF1A${a} \u4E2A\u9AD8\u4F18\u5148\u7EA7\u95EE\u9898`:"\u68C0\u67E5\u5B8C\u6210"),i}catch(i){return this.toast(i?.message??String(i),"error"),null}}loadDesignSystem(t="material3"){let n=nn(t),i=Ri(t);this.mutate(a=>{let s=new Set(a.styles.map(r=>r.name));for(let r of i)s.has(r.name)||(a.styles.push(structuredClone(r)),s.add(r.name))},{select:[]}),this.toast(`\u5DF2\u52A0\u8F7D ${n.name} \u6837\u5F0F\uFF08${i.length} \u6761\uFF09\uFF0C\u53EF\u5728\u300C\u6837\u5F0F\u300D\u9762\u677F\u5E94\u7528`)}insertPrompt(t=""){let n=Ve(this.state.foundation?.device),i=rn(this.state.foundation?.preset),a=["\u4F7F\u7528 canvas-ui-design \u6280\u80FD\uFF0C\u76F4\u63A5\u5728\u753B\u5E03\u4E2D\u751F\u6210 UI\u3002",`\u8BBE\u5907\uFF1A${n.name} ${n.width}\xD7${n.height}\uFF1B\u98CE\u683C\u9884\u8BBE\uFF1A${i.name}\u3002`,"\u5148 canvas_read \u8BFB\u53D6\u5F53\u524D\u6587\u6863\u548C\u9009\u533A\uFF0C\u518D\u7528 canvas_template \u7684 foundation/\u9875\u9762\u9AA8\u67B6\u4E0E canvas_write/canvas_edit \u751F\u6210\u771F\u5B9E\u5185\u5BB9\u3002","\u5B8C\u6210\u540E\u8FD0\u884C canvas_audit\uFF0C\u5E76\u6309 findings \u4FEE\u6B63\uFF1B\u4E0D\u8981\u53EA\u7ED9\u8BBE\u8BA1\u5EFA\u8BAE\u3002",`\u9700\u6C42\uFF1A${String(t||"").trim()||"\u751F\u6210\u4E00\u4E2A\u79FB\u52A8\u7AEF\u9875\u9762\uFF0C\u5305\u542B\u6807\u9898\u3001\u4E3B\u5185\u5BB9\u548C\u4E3B\u6309\u94AE\u3002"}`].join(`
`),s=this.inputActions;try{if(s&&typeof s.captureInsertion=="function"){let r=s.captureInsertion();if(s.insertText(a,r)){this.toast("\u5DF2\u5199\u5165 AI \u751F\u6210\u8BF7\u6C42");return}}navigator.clipboard?.writeText(a),this.toast("\u5DF2\u590D\u5236 AI \u751F\u6210\u8BF7\u6C42")}catch{this.toast("\u65E0\u6CD5\u5199\u5165\u8F93\u5165\u6846","error")}}insertImagePrompt(t=""){let n=["\u8BF7\u4F7F\u7528\u5F53\u524D\u6A21\u578B\u7684\u539F\u751F\u56FE\u7247\u751F\u6210\u80FD\u529B\u751F\u6210\u4E00\u5F20\u56FE\u7247\u3002",`\u56FE\u7247\u63CF\u8FF0\uFF1A${String(t||"").trim()||"\u900F\u660E\u80CC\u666F\u7684\u79FB\u52A8 App \u63D2\u753B\u7D20\u6750\u3002"}`,"\u751F\u6210\u540E\u628A\u56FE\u7247\u6587\u4EF6\u901A\u8FC7 canvas_image import \u5BFC\u5165 canvas/assets/\uFF0C\u518D\u7528 canvas_edit \u653E\u5230\u5F53\u524D\u8BBE\u8BA1\u91CC\u3002","\u5982\u679C\u5F53\u524D\u6CA1\u6709\u539F\u751F\u56FE\u7247\u5DE5\u5177\uFF0C\u8BF7\u6539\u7528 canvas_image probe \u68C0\u67E5 Codex \u8DEF\u7EBF\uFF0C\u6216\u8981\u6C42\u7528\u6237\u5BFC\u5165\u56FE\u7247\u3002"].join(`
`),i=this.inputActions;try{if(i&&typeof i.captureInsertion=="function"){let a=i.captureInsertion();if(i.insertText(n,a)){this.toast("\u5DF2\u5199\u5165\u751F\u56FE\u8BF7\u6C42");return}}navigator.clipboard?.writeText(n),this.toast("\u5DF2\u590D\u5236\u751F\u56FE\u8BF7\u6C42")}catch{this.toast("\u65E0\u6CD5\u5199\u5165\u8F93\u5165\u6846","error")}}async exportSelection(t){let n=this.selectedNodes(),i=n.length?n.map(a=>a.key):this.state.scene?.roots.map(a=>a.key)??[];try{let{buildSvg:a}=await Promise.resolve().then(()=>(Gi(),Xi)),s=await a(this.state.scene,{nodeKeys:i,background:this.state.doc.pages.find(c=>c.id===this.state.pageId)?.background??null,resolveAsset:async c=>{let d=await fetch(Xe(this.sessionId,this.state.name,c),{credentials:"same-origin"});if(!d.ok)throw new Error(`asset ${c} unavailable`);let u=await d.blob();return await qi(u)},resolveFont:async c=>{let d=await fetch(mn(this.sessionId,c.asset),{credentials:"same-origin"});if(!d.ok)throw new Error(`font ${c.asset} unavailable`);let u=await d.blob();return await qi(u)},fonts:this.state.doc.fonts??[]});if(t==="svg"){let c=await pn(this.sessionId,this.state.name,"svg",hr(s));this.toast(`\u5DF2\u5BFC\u51FA ${c.path}`),this.insertExportPath(c.path);return}let{svgToPng:r}=await Promise.resolve().then(()=>(Ui(),Ki)),l=await r(s,2),o=await pn(this.sessionId,this.state.name,"png",l.split(",")[1]);this.toast(`\u5DF2\u5BFC\u51FA ${o.path}`),this.insertExportPath(o.path)}catch(a){this.toast(`\u5BFC\u51FA\u5931\u8D25\uFF1A${String(a?.message??a)}`,"error")}}insertExportPath(t){let n=this.inputActions;if(n?.captureInsertion)try{n.insertText(`

\u753B\u5E03\u9884\u89C8\u56FE\uFF1A${t}
`,n.captureInsertion())}catch{}}beginCrop(t,n=0){let i=this.findSceneNode(t);if(!i||!i.fills?.[n]||i.fills[n].type!=="image"){this.toast("\u8BE5\u56FE\u5C42\u6CA1\u6709\u56FE\u7247\u586B\u5145");return}this.state.crop={key:t,sourceId:i.sourceId,fillIndex:n,crop:{...i.fills[n].crop??{x:0,y:0,width:1,height:1}}},this.state.selection=[t],this.state.primaryKey=t,this.emit()}updateCrop(t){let n=this.state.crop;n&&(n.crop=t,this.emit())}commitCrop(){let t=this.state.crop;t&&(this.mutate(n=>{let i=me(n.pages.flatMap(a=>a.children),t.sourceId);i?.fills?.[t.fillIndex]&&(i.fills[t.fillIndex].crop=t.crop)}),this.state.crop=null,this.emit())}cancelCrop(){this.state.crop=null,this.emit()}};function dr(e){return{frame:"Frame",group:"Group",rect:"Rectangle",ellipse:"Ellipse",line:"Line",text:"Text",instance:"Instance"}[e]??"Node"}function qi(e){return new Promise((t,n)=>{let i=new FileReader;i.onload=()=>t(String(i.result??"")),i.onerror=()=>n(i.error),i.readAsDataURL(e)})}function hr(e){return btoa(unescape(encodeURIComponent(e)))}function Qi(e){return new Promise((t,n)=>{let i=new Image;i.onload=()=>t({width:i.naturalWidth,height:i.naturalHeight}),i.onerror=n,i.src=e})}var xn="dsh-canvas:focus",bn="__dshCanvasPendingFocus";function wn(e){typeof window>"u"||(window[bn]={...e,at:Date.now()},window.dispatchEvent(new CustomEvent(xn,{detail:{...e}})))}function vn(e){if(typeof window>"u")return null;let t=window[bn];return!t||t.sessionId&&e&&t.sessionId!==e?null:(window[bn]=null,t)}function ta(e){if(typeof window>"u")return()=>{};let t=n=>e(n.detail??{});return window.addEventListener(xn,t),()=>window.removeEventListener(xn,t)}var $=Oe(require("react"),1);var re=Oe(require("react"),1);var je="dshc";function yt(e){return Math.min(1,Math.max(0,Number(e)||0))}function ia(e){let t=e.color??"#000000";if(e.opacity==null||e.opacity>=1)return t;let n=Math.round(yt(e.opacity)*255).toString(16).padStart(2,"0");return t.length===7?`${t}${n}`:t}function aa(e){if(!e)return"transparent";if(e.type==="solid")return ia(e);let t=(e.stops??[]).map(n=>`${n.color} ${(yt(n.position)*100).toFixed(2)}%`).join(", ");if(e.type==="linear-gradient")return`linear-gradient(${Number(e.angle)||0}deg, ${t})`;if(e.type==="radial-gradient"){let n=yt(e.center?.x??.5)*100,i=yt(e.center?.y??.5)*100;return`radial-gradient(circle ${Math.max(.01,yt(e.radius??.7))*100}% at ${n}% ${i}%, ${t})`}return"transparent"}function Mt(e){let t=e.fills?.find(n=>n.type==="solid")??e.fills?.[0];return t?t.type==="solid"?{color:ia(t),gradient:null}:{color:"transparent",gradient:aa(t)}:{color:"transparent",gradient:null}}function ur(e){let t=[],n="",i="";for(let a of e.effects??[])a.visible!==!1&&(a.type==="drop-shadow"?t.push(`${a.x??0}px ${a.y??0}px ${a.blur??0}px ${a.spread??0}px ${a.color??"#00000040"}`):a.type==="inner-shadow"?t.push(`inset ${a.x??0}px ${a.y??0}px ${a.blur??0}px ${a.spread??0}px ${a.color??"#00000040"}`):a.type==="layer-blur"?n+=` blur(${a.radius??0}px)`:a.type==="background-blur"&&(i+=` blur(${a.radius??0}px)`));for(let a of e.strokes??[]){let s=Number(a.width)||1,r=a.color??"#000000";t.push(`${a.align==="outside"?"":"inset "}0 0 0 ${s}px ${r}`)}return{boxShadow:t.length?t.join(", "):void 0,filter:n.trim()?n.trim():void 0,backdropFilter:i.trim()?i.trim():void 0,WebkitBackdropFilter:i.trim()?i.trim():void 0}}function pr(e){let t=e.cornerRadius??0;return e.type==="ellipse"?"50%":t?`${t}px`:void 0}function mr({fill:e,sessionId:t,docName:n}){let i=e.crop??{x:0,y:0,width:1,height:1},a=Xe(t,n,e.asset),s=100/Math.max(.01,i.width),r=100/Math.max(.01,i.height);return re.createElement("div",{className:`${je}-fill`,style:{position:"absolute",inset:0,overflow:"hidden",borderRadius:"inherit"}},re.createElement("img",{src:a,alt:"",draggable:!1,style:{position:"absolute",left:`${-i.x/Math.max(.01,i.width)*100}%`,top:`${-i.y/Math.max(.01,i.height)*100}%`,width:`${s}%`,height:`${r}%`,maxWidth:"none",objectFit:e.fit==="contain"?"contain":e.fit==="fill"?"fill":"cover",borderRadius:"inherit"}}))}function na({node:e,store:t}){return e.fills?.length?e.fills.map((n,i)=>n.type==="image"?re.createElement(mr,{key:`fill-${i}`,fill:n,sessionId:t.sessionId,docName:t.state.name}):re.createElement("div",{key:`fill-${i}`,className:`${je}-fill`,style:{position:"absolute",inset:0,background:aa(n),borderRadius:"inherit",pointerEvents:"none"}})):null}var fr=re.memo(function e({node:t,store:n,parentAbs:i}){if(!t||t.visible===!1)return null;let a=t.absX-(i?.x??0),s=t.absY-(i?.y??0),r=ur(t),l=n.state.editingText?.key===t.key,o={position:"absolute",left:`${a}px`,top:`${s}px`,width:`${t.width}px`,height:`${t.height}px`,transform:t.rotation?`rotate(${t.rotation}deg)`:void 0,transformOrigin:"center",opacity:t.opacity==null?1:t.opacity,borderRadius:pr(t),boxSizing:"border-box",...r};if(t.type==="group")return re.createElement("div",{className:`${je}-node ${je}-group`,"data-node-key":t.key,style:{...o,pointerEvents:"none"}},(t.children??[]).map(d=>re.createElement(e,{key:d.key,node:d,store:n,parentAbs:{x:t.absX,y:t.absY}})));if(t.type==="text"){let d=Mt(t),u=t.lines??[],p=(t.font?.size??14)*(t.font?.lineHeight??1.4),w=u.length*p,v=t.verticalAlign??"top",k=v==="center"?(t.height-w)/2:v==="bottom"?t.height-w:0,A={fontFamily:`"${t.font?.family??"system-ui"}", system-ui, sans-serif`,fontWeight:t.font?.weight??400,fontStyle:t.font?.style??"normal",fontSize:`${t.font?.size??14}px`,lineHeight:`${p}px`,letterSpacing:`${t.font?.letterSpacing??0}px`,textAlign:t.align??"left",color:d.color,backgroundImage:d.gradient??void 0,WebkitBackgroundClip:d.gradient?"text":void 0,backgroundClip:d.gradient?"text":void 0};return re.createElement("div",{className:`${je}-node ${je}-text`,"data-node-key":t.key,style:{...o,overflow:t.effects?.length?"visible":"hidden"}},re.createElement(na,{node:{...t,fills:t.fills?.filter(H=>H.type!=="solid")??[]},store:n}),!l&&re.createElement("div",{className:`${je}-text-lines`,style:{position:"absolute",left:0,top:`${k}px`,width:"100%",height:`${w}px`,pointerEvents:"none",...A}},u.length?u.map((H,x)=>re.createElement("div",{key:x,style:{whiteSpace:"pre",height:`${p}px`,overflow:"hidden"}},H.text||" ")):re.createElement("div",{style:{whiteSpace:"pre"}},t.text?String(t.text).split(`
`)[0]:" ")),l&&re.createElement("div",{style:{position:"absolute",inset:0,border:"1px solid var(--dshc-accent)",borderRadius:2,pointerEvents:"none"}}))}let c=(t.children??[]).map(d=>re.createElement(e,{key:d.key,node:d,store:n,parentAbs:{x:t.absX,y:t.absY}}));return re.createElement("div",{className:`${je}-node ${je}-${t.type}`,"data-node-key":t.key,style:{...o,overflow:t.clip?"hidden":void 0}},re.createElement(na,{node:t,store:n}),c)});function sa({scene:e,store:t}){return e?re.createElement(re.Fragment,null,(e.roots??[]).map(n=>re.createElement(fr,{key:n.key,node:n,store:t,parentAbs:{x:0,y:0}}))):null}function Rn(e,t){if(!e||e.visible===!1||e.locked)return null;if(e.type==="group"){for(let n of[...e.children??[]].reverse()){let i=Rn(n,t);if(i)return i}return null}if(!pt(e,t))return null;for(let n of[...e.children??[]].reverse()){let i=Rn(n,t);if(i)return i}return e}function Je(e,t,n={}){if(!e)return null;let i=null;for(let r of[...e.roots??[]].reverse())if(i=Rn(r,t),i)break;if(!i)return null;if(n.deep)return i;let a=n.enteredInstance??null,s=i;for(;s.parent;){let r=s.parent;if(r.type==="group"){s=r;continue}if(r.type==="instance"&&r.key!==a){s=r;continue}break}return s}var L=Oe(require("react"),1);var En=Oe(require("react"),1),ra={pointer:"M4 4l7.07 17 2.51-7.39L21 11.07 4 4z",hand:"M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0 1V4.5a1.5 1.5 0 0 1 3 0V11m0 0V6.5a1.5 1.5 0 0 1 3 0V12m0 0V8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-2.2a6 6 0 0 1-4.8-2.4L5 15.5a1.6 1.6 0 0 1 2.4-2.1L9 15",frame:"M7 3v18M17 3v18M3 7h18M3 17h18",rect:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",ellipse:"M12 4c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z",line:"M4 20L20 4",text:"M5 5h14M12 5v13M8 18h8",image:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 15l4.5-4.5L13 15l3-3 4 4M15.5 8.5h.01",comment:"M6 5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3V6a1 1 0 0 1 1-1z",layers:"M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5",component:"M12 3l9 9-9 9-9-9 9-9zM12 8l4 4-4 4-4-4 4-4z",styles:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",fonts:"M5 20L12 4l7 16M8 14h8",undo:"M9 7H5V3M5 7a8 8 0 1 1-1 9",redo:"M15 7h4V3M19 7a8 8 0 1 0 1 9",plus:"M12 5v14M5 12h14",minus:"M5 12h14",trash:"M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",eye:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",eyeOff:"M3 3l18 18M10.6 6.3A10 10 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3 4M6.2 6.2C3.5 8.2 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4-.8",lock:"M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3",unlock:"M6 11h12v10H6zM8 11V8a4 4 0 0 1 7.3-2.2",chevronDown:"M6 9l6 6 6-6",chevronRight:"M9 6l6 6-6 6",alignLeft:"M4 4v16M8 7h11v4H8zM8 15h7v4H8z",alignCenterX:"M12 3v18M6 7h12v4H6zM8 15h8v4H8z",alignRight:"M20 4v16M5 7h11v4H5zM9 15h7v4H9z",alignTop:"M4 4h16M7 8h4v11H7zM15 8h4v7h-4z",alignCenterY:"M3 12h18M7 6h4v12H7zM15 8h4v8h-4z",alignBottom:"M4 20h16M7 5h4v11H7zM15 9h4v7h-4z",distributeX:"M3 4v16M21 4v16M9 7h6v10H9z",distributeY:"M4 3h16M4 21h16M7 9h10v6H7z",group:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",ungroup:"M4 4h6v6H4zM14 14h6v6h-6zM15 4h5v5M4 15v5h5",front:"M4 8h10v10H4zM10 4h10v10",back:"M10 10h10v10H10zM4 4h10v10",close:"M6 6l12 12M18 6L6 18",check:"M4 12l5 5L20 6",upload:"M12 16V4M7 9l5-5 5 5M4 17v3h16v-3",download:"M12 4v12M7 11l5 5 5-5M4 20h16",copy:"M9 8h11v11H9zM6 5h11v3M6 5v11h3",send:"M4 12l16-8-6 16-2.5-6.5L4 12z",pencil:"M4 20h4L20 8l-4-4L4 16v4zM14 6l4 4",zoomIn:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5M8 11h6M11 8v6",zoomOut:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5M8 11h6",fit:"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",reset:"M4 10a8 8 0 1 1 2.3 6.3M4 4v6h6",more:"M5 12h.01M12 12h.01M19 12h.01",sliders:"M4 7h16M4 12h16M4 17h16M9 5v4M15 10v4M7 15v4",template:"M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 9h16M9 9v10",play:"M7 4l13 8-13 8V4z",sparkle:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z",eyeSmall:"M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"};function oe({name:e,size:t=16,style:n,className:i}){let a=ra[e];if(!a)return null;let s=e==="pointer";return En.createElement("svg",{viewBox:"0 0 24 24",width:t,height:t,fill:s?"currentColor":"none",stroke:s?"none":"currentColor",strokeWidth:s?0:1.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,style:n,className:i},En.createElement("path",{d:a}))}var Vo=Object.keys(ra);function O({icon:e,children:t,active:n,primary:i,danger:a,small:s,title:r,onClick:l,disabled:o,className:c=""}){return L.createElement("button",{type:"button",title:r,disabled:o,onClick:l,className:`dshc-btn ${n?"is-active":""} ${i?"is-primary":""} ${a?"is-danger":""} ${s?"is-small":""} ${c}`},e?L.createElement(oe,{name:e,size:s?14:15}):null,t?L.createElement("span",null,t):null)}function Y({icon:e,title:t,active:n,onClick:i,size:a=20,danger:s}){return L.createElement("button",{type:"button",title:t,"aria-label":t,onClick:i,className:`dshc-icon-btn ${n?"is-active":""} ${s?"is-danger":""}`},L.createElement(oe,{name:e,size:a}))}function zt({x:e,y:t,items:n,onClose:i,fixed:a=!1}){let s=L.useRef(null);return L.useEffect(()=>{s.current?.querySelector("button:not(:disabled)")?.focus?.({preventScroll:!0})},[e,t]),L.createElement("div",{ref:s,role:"menu",className:"dshc-context-menu",style:{left:e,top:t,position:a?"fixed":"absolute"},onPointerDown:r=>r.stopPropagation(),onContextMenu:r=>r.preventDefault()},n.map((r,l)=>r.separator?L.createElement("div",{key:`sep-${l}`,className:"dshc-context-sep"}):r.heading?L.createElement("div",{key:`head-${l}`,className:"dshc-context-heading"},r.heading):L.createElement("button",{key:`${r.label}-${l}`,type:"button",role:"menuitem",disabled:r.disabled,className:`dshc-context-item ${r.danger?"is-danger":""}`,onClick:()=>{r.action?.(),i?.()}},r.icon?L.createElement(oe,{name:r.icon,size:14}):null,L.createElement("span",{className:"dshc-context-label"},r.label),r.shortcut?L.createElement("span",{className:"dshc-context-shortcut"},r.shortcut):null)))}function be({title:e,children:t,right:n,defaultOpen:i=!0}){let[a,s]=L.useState(i);return L.createElement("div",{className:"dshc-section"},L.createElement("button",{type:"button",className:"dshc-section-head",onClick:()=>s(!a)},L.createElement(oe,{name:a?"chevronDown":"chevronRight",size:12}),L.createElement("span",null,e),n?L.createElement("span",{className:"dshc-section-right"},n):null),a?L.createElement("div",{className:"dshc-section-body"},t):null)}function G({label:e,children:t,wide:n}){return L.createElement("label",{className:`dshc-field ${n?"is-wide":""}`},L.createElement("span",{className:"dshc-field-label"},e),t)}function ce({value:e,onChange:t,min:n,max:i,step:a=1,disabled:s,suffix:r}){let[l,o]=L.useState(String(e??0));L.useEffect(()=>o(String(e??0)),[e]);let c=()=>{let d=Number(l);if(Number.isFinite(d)){let u=Math.min(i??1/0,Math.max(n??-1/0,d));t(u),o(String(u))}else o(String(e??0))};return L.createElement("span",{className:"dshc-number"},L.createElement("input",{type:"number",value:l,step:a,min:n,max:i,disabled:s,onChange:d=>o(d.target.value),onBlur:c,onKeyDown:d=>{d.key==="Enter"&&(d.preventDefault(),c(),d.currentTarget.blur())}}),r?L.createElement("span",{className:"dshc-number-suffix"},r):null)}function st({value:e,onChange:t,allowAlpha:n=!0}){let i=gr(e);return L.createElement("span",{className:"dshc-color"},L.createElement("input",{type:"color",value:i.slice(0,7),onChange:a=>{let s=i.length===9?i.slice(7):"";t(`${a.target.value.toUpperCase()}${s}`)}}),L.createElement("input",{className:"dshc-color-text",value:i,spellCheck:!1,onChange:a=>{let s=a.target.value.trim().toUpperCase();/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(s)&&t(s)},onBlur:a=>{/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(a.target.value.trim().toUpperCase())||(a.target.value=i)}}))}function gr(e){return typeof e=="string"&&/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(e)?e.toUpperCase():"#000000"}function ue({value:e,onChange:t,options:n,disabled:i,title:a}){return L.createElement("select",{className:"dshc-select",value:e,disabled:i,title:a,onChange:s=>t(s.target.value)},n.map(s=>L.createElement("option",{key:s.value,value:s.value},s.label)))}function At({value:e,onChange:t,label:n}){return L.createElement("button",{type:"button",role:"switch","aria-checked":!!e,className:`dshc-toggle ${e?"is-on":""}`,onClick:()=>t(!e),title:n},L.createElement("span",{className:"dshc-toggle-dot"}))}function yr({title:e,children:t,onClose:n,footer:i,width:a=360}){return L.createElement("div",{className:"dshc-modal-backdrop",onPointerDown:s=>s.stopPropagation()},L.createElement("div",{className:"dshc-modal",style:{width:a}},L.createElement("div",{className:"dshc-modal-head"},L.createElement("span",null,e),L.createElement(Y,{icon:"close",title:"\u5173\u95ED",onClick:n})),L.createElement("div",{className:"dshc-modal-body"},t),i?L.createElement("div",{className:"dshc-modal-foot"},i):null))}function oa({title:e,label:t,defaultValue:n,onCancel:i,onSubmit:a}){let[s,r]=L.useState(n??""),l=()=>{s.trim()&&a(s.trim())};return L.createElement(yr,{title:e,onClose:i,footer:L.createElement(L.Fragment,null,L.createElement(O,{onClick:i},"\u53D6\u6D88"),L.createElement(O,{primary:!0,onClick:l,disabled:!s.trim()},"\u786E\u5B9A"))},L.createElement("label",{className:"dshc-dialog-field"},L.createElement("span",null,t??"\u540D\u79F0"),L.createElement("input",{autoFocus:!0,value:s,onChange:o=>r(o.target.value),onKeyDown:o=>{o.key==="Enter"&&l(),o.key==="Escape"&&i()}})))}function Sn({icon:e,title:t,text:n,action:i}){return L.createElement("div",{className:"dshc-empty-panel"},L.createElement(oe,{name:e,size:26}),L.createElement("div",{className:"dshc-empty-panel-title"},t),n?L.createElement("div",{className:"dshc-empty-panel-text"},n):null,i??null)}function Ft(e){let t=e.selectedNodes(),n=e.primaryNode(),i=t.length>0&&t.every(o=>o.sourceNode?.locked),a=t.length>0&&t.every(o=>o.sourceNode?.visible===!1),s=t.some(o=>o.sourceNode?.type==="group"),r=(e.clipboard?.length??0)>0;return[{label:"\u590D\u5236",shortcut:"\u2318C",icon:"front",disabled:!t.length,action:()=>e.copySelection()},{label:"\u526A\u5207",shortcut:"\u2318X",icon:"trash",disabled:!t.length,action:()=>{e.copySelection(),e.deleteSelection()}},{label:"\u7C98\u8D34",shortcut:"\u2318V",icon:"back",disabled:!r,action:()=>e.paste()},{label:"\u521B\u5EFA\u526F\u672C",shortcut:"\u2318D",icon:"group",disabled:!t.length,action:()=>e.duplicateSelection()},{label:"\u5220\u9664",shortcut:"\u232B",icon:"trash",danger:!0,disabled:!t.length,action:()=>e.deleteSelection()},{separator:!0},{label:"\u63D2\u5165\u5230\u5BF9\u8BDD",icon:"send",disabled:!t.length,action:()=>e.insertSelectionToComposer()},{separator:!0},{label:"\u7F16\u7EC4",shortcut:"\u2318G",icon:"group",disabled:t.length<2,action:()=>e.groupSelection()},{label:"\u53D6\u6D88\u7F16\u7EC4",shortcut:"\u21E7\u2318G",icon:"ungroup",disabled:!s,action:()=>e.ungroupSelection()},{label:"\u7F6E\u9876",shortcut:"]",icon:"front",disabled:!t.length,action:()=>e.reorder("front")},{label:"\u7F6E\u5E95",shortcut:"[",icon:"back",disabled:!t.length,action:()=>e.reorder("back")},{label:"\u4E0A\u79FB\u4E00\u5C42",icon:"front",disabled:!t.length,action:()=>e.reorder("forward")},{label:"\u4E0B\u79FB\u4E00\u5C42",icon:"back",disabled:!t.length,action:()=>e.reorder("backward")},{separator:!0},{label:i?"\u89E3\u9501":"\u9501\u5B9A",shortcut:"\u21E7\u2318L",icon:i?"unlock":"lock",disabled:!t.length,action:()=>t.forEach(o=>e.setLocked(o.sourceId,!i))},{label:a?"\u663E\u793A":"\u9690\u85CF",shortcut:"\u21E7\u2318H",icon:a?"eye":"eyeOff",disabled:!t.length,action:()=>t.forEach(o=>e.setVisibility(o.sourceId,a))},{separator:!0},{label:"\u521B\u5EFA\u7EC4\u4EF6",shortcut:"\u2325\u2318K",icon:"component",disabled:!n||!n.editable||n.isInstanceRoot,action:()=>e.createComponentFromSelection()},{separator:!0},{label:"\u9002\u5408\u9009\u533A",shortcut:"2",icon:"fit",disabled:!t.length,action:()=>e.zoomToSelection()},{label:"\u9002\u5408\u753B\u5E03",shortcut:"1",icon:"fit",action:()=>e.zoomToFit()},{label:"\u5168\u9009",shortcut:"\u2318A",disabled:!e.state.scene?.roots?.length,action:()=>e.setSelection((e.state.scene?.roots??[]).map(o=>o.key))},{label:"\u53D6\u6D88\u9009\u62E9",action:()=>e.clearSelection()}]}var J="dshc",Tt=8;function Pt(e){if(!e||!(e instanceof HTMLElement))return!1;let t=e.tagName;return t==="INPUT"||t==="TEXTAREA"||t==="SELECT"||e.isContentEditable}function Ot(e,t){let n=e.state.doc;if(!n)return null;for(let i of n.pages){let a=me(i.children,t);if(a)return a}for(let i of n.components){if(i.root.id===t)return i.root;let a=me(i.root.children??[],t);if(a)return a}return null}function ca(e,t,n,i){e.mutate(a=>{for(let s of t){let r=Ot(e,s.sourceId);r&&(r.x=s.x+n,r.y=s.y+i)}},{commit:!1})}function xr(e,t,n,i,a){if(a)return{dx:n,dy:i,guides:[]};let s=new Set(t.map(v=>v.sourceId)),r=t.map(v=>({x:v.absX+n,y:v.absY+i,width:v.width,height:v.height})),l=_e(r);if(!l)return{dx:n,dy:i,guides:[]};let o=[],c=new Set;for(let v of t){let k=v.parent;c.add(k?.key??"root");let A=k?k.children:e.state.scene.roots;for(let H of A??[])!s.has(H.sourceId)&&H.visible!==!1&&o.push({x:H.absX,y:H.absY,width:H.width,height:H.height});k&&o.push({x:k.absX,y:k.absY,width:k.width,height:k.height})}let d=6/Math.max(.02,e.state.viewport.zoom),u={x:[l.x,l.x+l.width/2,l.x+l.width],y:[l.y,l.y+l.height/2,l.y+l.height]},p={x:{diff:0,position:null},y:{diff:0,position:null}};for(let v of o){let k={x:[v.x,v.x+v.width/2,v.x+v.width],y:[v.y,v.y+v.height/2,v.y+v.height]};for(let A of["x","y"])for(let H of u[A])for(let x of k[A]){let P=x-H;Math.abs(P)>d||(p[A].position===null||Math.abs(P)<Math.abs(p[A].diff))&&(p[A]={diff:P,position:x})}}let w=[];return p.x.position!==null&&w.push({axis:"x",value:p.x.position}),p.y.position!==null&&w.push({axis:"y",value:p.y.position}),{dx:n+p.x.diff,dy:i+p.y.diff,guides:w}}function br(e,t,n){let i=e.state.scene?.byKey.get(t.layoutParent.key);if(!i)return;let a=i.layout?.direction==="horizontal",s=(i.children??[]).filter(l=>l.sourceId!==t.sourceId),r=s.length;for(let l=0;l<s.length;l+=1){let o=s[l],c=a?o.absX+o.width/2:o.absY+o.height/2;if((a?n.x:n.y)<c){r=l;break}}e.mutate(l=>{let o=Ot(e,i.sourceId);if(!o?.children)return;let c=o.children.findIndex(p=>p.id===t.sourceId);if(c===-1)return;let[d]=o.children.splice(c,1),u=Math.min(r,o.children.length);o.children.splice(u,0,d)},{commit:!1})}function wr(e,t){return t.parent?{x:t.parent.absX,y:t.parent.absY}:{x:0,y:0}}function la({store:e,version:t}){let n=$.useRef(null),i=$.useRef(null),a=$.useRef(!1),s=$.useRef(0),r=$.useRef(null),[l,o]=$.useState(""),[c,d]=$.useState(""),[u,p]=$.useState(null),[w,v]=$.useState(""),[k,A]=$.useState(null),[H,x]=$.useState(null),[P,_]=$.useState(null),[C,q]=$.useState([]),[le,ke]=$.useState(!1),[pe,Ee]=$.useState(null),[Ae,we]=$.useState([]),D=e.state,j=D.viewport,Se=$.useRef({});Se.current={store:e,version:t},$.useEffect(()=>{let f=n.current;if(!f)return;let y=new ResizeObserver(m=>{let g=m[0]?.contentRect;g&&(e.canvasSize={width:g.width,height:g.height},e.emit())});return y.observe(f),e.canvasSize={width:f.clientWidth,height:f.clientHeight},()=>y.disconnect()},[e]),$.useEffect(()=>{let f=n.current;if(!f)return;let y=g=>{g.preventDefault();let R=f.getBoundingClientRect(),I={x:g.clientX-R.left,y:g.clientY-R.top};if(g.ctrlKey||g.metaKey)e.zoomAt(I,Math.exp(-g.deltaY*.0015));else{let E=g.shiftKey?g.deltaY:g.deltaX,S=g.shiftKey?0:g.deltaY;e.setViewport({...e.state.viewport,x:e.state.viewport.x-E,y:e.state.viewport.y-S})}};f.addEventListener("wheel",y,{passive:!1});let m=g=>{let R=n.current?.closest?.(".dshc-root"),I=g.target;if(!R||!(I instanceof Node)||!R.contains(I))return;let E=document.activeElement;if(!(E===n.current||n.current?.contains(E))||Pt(I))return;let S=[...g.clipboardData?.files??[]];if(S.length){g.preventDefault();for(let X of S)X.type.startsWith("image/")&&e.uploadImageFile(X)}};return window.addEventListener("paste",m),()=>{f.removeEventListener("wheel",y),window.removeEventListener("paste",m)}},[e]),$.useEffect(()=>{D.editingText&&o(D.editingText.value??"")},[D.editingText?.key]),$.useEffect(()=>{let f=m=>{let g=n.current;if(!(g&&(document.activeElement===g||g.contains(document.activeElement)))&&!Pt(m.target))return;if(m.key===" "&&!Pt(m.target)){a.current=!0,ke(!0),m.preventDefault();return}if(Pt(m.target))return;let I=m.key.toLowerCase(),E=m.metaKey||m.ctrlKey,S=Se.current.store;if(m.key==="Escape"){S.state.crop?S.cancelCrop():S.state.editingText?S.cancelTextEdit():S.state.commentDraft?(S.state.commentDraft=null,S.emit()):S.state.enteredInstance?S.exitInstance():S.clearSelection();return}if(m.shiftKey&&!E&&m.code==="KeyA"){m.preventDefault();let z=S.selectedNodes().filter(F=>F.editable&&(F.type==="frame"||F.type==="group"));for(let F of z)S.updateNode(F.sourceId,{layout:{direction:"vertical",gap:8,padding:{top:12,right:12,bottom:12,left:12},alignPrimary:"start",alignCounter:"start"}});return}if(E&&m.altKey&&I==="k"){m.preventDefault(),S.createComponentFromSelection();return}if(E&&(m.code==="BracketRight"||m.code==="BracketLeft")){m.preventDefault();let F=m.code==="BracketRight"?m.shiftKey?"front":"forward":m.shiftKey?"back":"backward";S.reorder(F);return}if(E&&m.shiftKey&&I==="l"){m.preventDefault();let z=S.selectedNodes(),F=!(z.length>0&&z.every(fe=>fe.sourceNode?.locked));for(let fe of z)S.setLocked(fe.sourceId,F);return}if(E&&m.shiftKey&&I==="h"){m.preventDefault();let z=S.selectedNodes(),F=!(z.length>0&&z.every(fe=>fe.sourceNode?.visible===!1));for(let fe of z)S.setVisibility(fe.sourceId,F);return}if(!E&&m.shiftKey&&(m.code==="Digit1"||m.code==="Digit2")){m.preventDefault(),m.code==="Digit1"?S.zoomToFit():S.zoomToSelection();return}if(!E&&m.shiftKey&&m.code==="Digit0"){m.preventDefault(),S.setViewport({...S.state.viewport,zoom:1});return}if(E&&I==="z"){m.preventDefault(),m.shiftKey?S.redo():S.undo();return}if(E&&I==="a"){m.preventDefault();let z=S.state.scene?.roots??[];S.setSelection(z.map(F=>F.key));return}if(E&&I==="c"){m.preventDefault(),S.copySelection();return}if(E&&I==="x"){m.preventDefault(),S.copySelection(),S.deleteSelection();return}if(E&&I==="v"){m.preventDefault(),S.paste();return}if(E&&I==="d"){m.preventDefault(),S.duplicateSelection();return}if(E&&I==="g"){m.preventDefault(),m.shiftKey?S.ungroupSelection():S.groupSelection();return}if(E&&I==="0"){m.preventDefault(),S.setViewport({...S.state.viewport,zoom:1});return}if(E&&(I==="="||I==="+")){m.preventDefault();let z=S.viewportSize();S.zoomAt({x:z.width/2,y:z.height/2},1.2);return}if(E&&I==="-"){m.preventDefault();let z=S.viewportSize();S.zoomAt({x:z.width/2,y:z.height/2},.8333333333333334);return}if(I==="1"&&!E){S.zoomToFit();return}if(I==="2"&&!E){S.zoomToSelection();return}if(I==="delete"||I==="backspace"){m.preventDefault(),S.deleteSelection();return}if(I==="enter"){let z=S.primaryNode();z&&(z.type==="frame"||z.type==="group")&&z.children?.length&&S.setSelection([z.children[0].key]);return}let X={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1]}[I];if(X){m.preventDefault();let z=m.shiftKey?10:1,F=S.selectedNodes().filter(he=>he.editable);if(!F.length)return;let fe=F.map(he=>({sourceId:he.sourceId,x:he.sourceNode.x,y:he.sourceNode.y,absX:he.absX,absY:he.absY,width:he.width,height:he.height,parent:he.parent}));ca(S,fe,X[0]*z,X[1]*z),S.commit(),S.scheduleSave();return}let B={v:"pointer",f:"frame",r:"rect",o:"ellipse",l:"line",t:"text",h:"hand",c:"comment",i:"image"};!E&&B[I]&&(S.setTool(B[I]),I==="i"&&Se.current.store.requestImagePick?.())},y=m=>{m.key===" "&&(a.current=!1,ke(!1)),m.key==="Alt"&&we([])};return window.addEventListener("keydown",f),window.addEventListener("keyup",y),()=>{window.removeEventListener("keydown",f),window.removeEventListener("keyup",y)}},[]);let Ce=f=>{r.current=f,!s.current&&(s.current=requestAnimationFrame(()=>{s.current=0;let y=r.current;r.current=null,y?.()}))},Ie=f=>{let y=n.current.getBoundingClientRect();return{x:f.clientX-y.left,y:f.clientY-y.top}};$.useEffect(()=>{if(!pe)return;let f=m=>{m.type==="pointerdown"&&m.target?.closest?.(".dshc-context-menu")||Ee(null)},y=m=>{m.key==="Escape"&&(m.preventDefault(),m.stopPropagation(),Ee(null))};return window.addEventListener("pointerdown",f,!0),window.addEventListener("wheel",f,{capture:!0,passive:!0}),window.addEventListener("keydown",y,!0),()=>{window.removeEventListener("pointerdown",f,!0),window.removeEventListener("wheel",f,!0),window.removeEventListener("keydown",y,!0)}},[pe]);let Sa=f=>{if(f.preventDefault(),!n.current)return;let y=Ie(f),m=Te(j,y),g=Je(e.state.scene,m,{enteredInstance:e.state.enteredInstance});g&&!e.state.selection.includes(g.key)&&e.setSelection([g.key]);let R=n.current?.getBoundingClientRect?.(),I=typeof window<"u"?window.innerWidth:1200,E=typeof window<"u"?window.innerHeight:800,S=Math.max(8,(R?.bottom??E)-460);Ee({x:Math.min(Math.max(8,f.clientX),Math.max(8,I-224)),y:Math.min(Math.max(8,f.clientY),S),fixed:!0,world:m,hit:g?.key??null})},$a=f=>{if(!f)return[];let y=4,m={l:f.absX,t:f.absY,r:f.absX+f.width,b:f.absY+f.height},g=(f.parent?.children??e.state.scene?.roots??[]).filter(z=>z&&z!==f&&z.visible!==!1),R=null,I=null,E=null,S=null;for(let z of g){let F={l:z.absX,t:z.absY,r:z.absX+z.width,b:z.absY+z.height};if(Math.min(m.b,F.b)-Math.max(m.t,F.t)>0){let Me=m.l-F.r,ye=F.l-m.r;Me>=y&&(!R||F.r>R.node.r)&&(R={node:F,gap:Me,cross:(Math.max(m.t,F.t)+Math.min(m.b,F.b))/2}),ye>=y&&(!I||F.l<I.node.l)&&(I={node:F,gap:ye,cross:(Math.max(m.t,F.t)+Math.min(m.b,F.b))/2})}if(Math.min(m.r,F.r)-Math.max(m.l,F.l)>0){let Me=m.t-F.b,ye=F.t-m.b;Me>=y&&(!E||F.b>E.node.b)&&(E={node:F,gap:Me,cross:(Math.max(m.l,F.l)+Math.min(m.r,F.r))/2}),ye>=y&&(!S||F.t<S.node.t)&&(S={node:F,gap:ye,cross:(Math.max(m.l,F.l)+Math.min(m.r,F.r))/2})}}let X=[],B=(z,F,fe,he,Me)=>{if(!(F>0))return;let ye=ae(j,{x:he,y:fe}),Le=ae(j,{x:Me,y:fe});X.push({axis:z,x1:ye.x,y1:ye.y,x2:Le.x,y2:Le.y,label:String(Math.round(F))})};if(R&&B("h",R.gap,R.cross,R.node.r,m.l),I&&B("h",I.gap,I.cross,m.r,I.node.l),E){let z=ae(j,{x:E.cross,y:E.node.b}),F=ae(j,{x:E.cross,y:m.t});X.push({axis:"v",x1:z.x,y1:z.y,x2:F.x,y2:F.y,label:String(Math.round(E.gap))})}if(S){let z=ae(j,{x:S.cross,y:m.b}),F=ae(j,{x:S.cross,y:S.node.t});X.push({axis:"v",x1:z.x,y1:z.y,x2:F.x,y2:F.y,label:String(Math.round(S.gap))})}return X},ka=f=>{if(f.button===2)return;we([]),n.current?.focus?.({preventScroll:!0});let y=f.target,m=Ie(f),g=Te(j,m);if(e.canvasSize={width:n.current.clientWidth,height:n.current.clientHeight},y.closest?.("[data-comment-pin]")||D.editingText)return;let R=y.closest?.("[data-handle]")?.getAttribute("data-handle");if(R){f.preventDefault(),Ia(R,m,f.pointerId);return}if(f.button===1||a.current||D.tool==="hand"){f.preventDefault(),i.current={mode:"pan",startScreen:m,startViewport:{...j}},n.current.setPointerCapture?.(f.pointerId);return}if(D.crop){let B=e.findSceneNode(D.crop.key);if(B&&pt(B,g)){i.current={mode:"crop",start:g,startCrop:{...D.crop.crop},node:B},n.current.setPointerCapture?.(f.pointerId);return}}if(D.tool==="comment"){let B=Je(e.state.scene,g,{enteredInstance:e.state.enteredInstance});e.state.commentDraft={x:g.x,y:g.y,nodeId:B?.sourceId,screenX:m.x,screenY:m.y},e.emit();return}if(["frame","rect","ellipse","line","text"].includes(D.tool)){let B=Mn(e,g),z=B?.type==="instance"?null:B;i.current={mode:"draw",tool:D.tool,start:g,parent:z,startScreen:m},_({x:m.x,y:m.y,width:0,height:0}),n.current.setPointerCapture?.(f.pointerId);return}let E=Je(e.state.scene,g,{enteredInstance:e.state.enteredInstance});if(!E){i.current={mode:"marquee",start:g,startScreen:m,container:Mn(e,g)},x({x:m.x,y:m.y,width:0,height:0}),f.shiftKey||e.clearSelection(),n.current.setPointerCapture?.(f.pointerId);return}if(f.shiftKey){e.toggleSelection(E.key);return}e.state.selection.includes(E.key)||e.setSelection([E.key]);let S=e.selectedNodes().filter(B=>B.editable);if(!S.length)return;let X=S.map(B=>({key:B.key,sourceId:B.sourceId,x:B.sourceNode.x,y:B.sourceNode.y,absX:B.absX,absY:B.absY,width:B.width,height:B.height,parent:B.parent,layoutParent:B.parent?.layout&&B.parent.type!=="instance"?B.parent:null,node:B}));i.current={mode:"move",start:g,startScreen:m,entries:X,moved:!1,alt:f.altKey,duplicated:!1},n.current.setPointerCapture?.(f.pointerId)},Mn=(f,y)=>{let m=Je(f.state.scene,y,{enteredInstance:f.state.enteredInstance});if(!m)return null;let g=m;for(;g;){if(g.type==="frame"||g.type==="instance")return g;g=g.parent}return null},Ia=(f,y,m)=>{let g=e.primaryNode();if(!(!g||!g.editable)){if(f==="rotate"){let R=ae(j,Ue(g));i.current={mode:"rotate",node:g,startAngle:Math.atan2(y.y-R.y,y.x-R.x),startRotation:g.rotation??0},n.current.setPointerCapture?.(m);return}i.current={mode:"resize",handle:f,node:g,startWidth:g.width,startHeight:g.height,startAbsX:g.absX,startAbsY:g.absY,startX:g.sourceNode.x,startY:g.sourceNode.y,startRotation:g.rotation??0,parentAbs:wr(e,g)},n.current.setPointerCapture?.(m)}},Na=f=>{let y=i.current,m=Ie(f),g=Te(j,m);if(!y){let R=Je(e.state.scene,g,{enteredInstance:e.state.enteredInstance});(R?.key??null)!==k&&A(R?.key??null),f.altKey&&!D.editingText?we($a(e.primaryNode()??R)):Ae.length&&we([]);return}if(y.mode==="pan"){e.setViewport({...y.startViewport,x:y.startViewport.x+(m.x-y.startScreen.x),y:y.startViewport.y+(m.y-y.startScreen.y)});return}if(y.mode==="crop"){let R=(g.x-y.start.x)/y.node.width,I=(g.y-y.start.y)/y.node.height,E={...y.startCrop};E.x=Math.min(1-E.width,Math.max(0,y.startCrop.x-R*E.width)),E.y=Math.min(1-E.height,Math.max(0,y.startCrop.y-I*E.height)),e.updateCrop(E);return}if(y.mode==="marquee"){let R=Math.min(y.startScreen.x,m.x),I=Math.min(y.startScreen.y,m.y);x({x:R,y:I,width:Math.abs(m.x-y.startScreen.x),height:Math.abs(m.y-y.startScreen.y)});return}if(y.mode==="draw"){let R=Math.min(y.startScreen.x,m.x),I=Math.min(y.startScreen.y,m.y);_({x:R,y:I,width:Math.abs(m.x-y.startScreen.x),height:Math.abs(m.y-y.startScreen.y)});return}if(y.mode==="move"){let R=g.x-y.start.x,I=g.y-y.start.y;if(!y.moved&&Math.abs(R)+Math.abs(I)>.5&&(y.moved=!0,y.alt&&(e.duplicateSelection(),y.entries=e.selectedNodes().filter(E=>E.editable).map(E=>({key:E.key,sourceId:E.sourceId,x:E.sourceNode.x,y:E.sourceNode.y,absX:E.absX,absY:E.absY,width:E.width,height:E.height,parent:E.parent,node:E})),y.duplicated=!0)),y.entries.length===1&&y.entries[0].layoutParent){Ce(()=>br(e,y.entries[0],g));return}Ce(()=>{let E=xr(e,y.entries,R,I,y.duplicated||f.altKey);ca(e,y.entries,E.dx,E.dy),q(E.guides)});return}if(y.mode==="resize"){Ce(()=>Ca(y,g,f.shiftKey));return}if(y.mode==="rotate"){let R=ae(e.state.viewport,Ue(y.node)),E=(Math.atan2(m.y-R.y,m.x-R.x)-y.startAngle)*180/Math.PI;e.mutate(S=>{let X=Ot(e,y.node.sourceId);X&&(X.rotation=Math.round((y.startRotation+E)*10)/10)},{commit:!1});return}},Ca=(f,y,m)=>{let R={...f.node,absX:f.startAbsX,absY:f.startAbsY,width:f.startWidth,height:f.startHeight,rotation:f.startRotation},I=dn(R,y),E=f.handle,S=f.startWidth,X=f.startHeight,B,z,F=f.startAbsX+f.startWidth,fe=f.startAbsY+f.startHeight;if(E.includes("w")&&(S=Math.max(1,f.startWidth-I.x)),E.includes("e")&&(S=Math.max(1,I.x)),E.includes("n")&&(X=Math.max(1,f.startHeight-I.y)),E.includes("s")&&(X=Math.max(1,I.y)),m&&E.length===2&&f.startWidth>0&&f.startHeight>0){let qe=f.startWidth/f.startHeight;S/X>qe?S=X*qe:X=S/qe}E==="nw"?(B={x:S,y:X},z=de(R,{x:f.startWidth,y:f.startHeight})):E==="ne"?(B={x:0,y:X},z=de(R,{x:0,y:f.startHeight})):E==="sw"?(B={x:S,y:0},z=de(R,{x:f.startWidth,y:0})):E==="se"?(B={x:0,y:0},z=de(R,{x:0,y:0})):E==="n"?(B={x:S/2,y:X},z=de(R,{x:f.startWidth/2,y:f.startHeight})):E==="s"?(B={x:S/2,y:0},z=de(R,{x:f.startWidth/2,y:0})):E==="w"?(B={x:S,y:X/2},z=de(R,{x:f.startWidth,y:f.startHeight/2})):(B={x:0,y:X/2},z=de(R,{x:0,y:f.startHeight/2}));let he=(f.startRotation??0)*Math.PI/180,Me={x:S/2,y:X/2},ye=Me.x-B.x,Le=Me.y-B.y,rt={x:z.x+ye*Math.cos(he)-Le*Math.sin(he),y:z.y+ye*Math.sin(he)+Le*Math.cos(he)},Ge=rt.x-S/2,ot=rt.y-X/2;e.mutate(qe=>{let ct=Ot(e,f.node.sourceId);ct&&(ct.width=Math.round(S),ct.height=Math.round(X),ct.x=Math.round(Ge-f.parentAbs.x),ct.y=Math.round(ot-f.parentAbs.y))},{commit:!1})},zn=f=>{let y=i.current;if(i.current=null,q([]),!!y){if(y.mode==="marquee"){let m=Ie(f),g=Math.min(y.startScreen.x,m.x),R=Math.min(y.startScreen.y,m.y),I=Math.abs(m.x-y.startScreen.x),E=Math.abs(m.y-y.startScreen.y);if(x(null),I>3||E>3){let S=Te(j,{x:g,y:R}),X={x:S.x,y:S.y,width:I/j.zoom,height:E/j.zoom},z=(y.container?y.container.children??[]:e.state.scene?.roots??[]).filter(F=>F.visible!==!1&&Ii(X,{x:F.absX,y:F.absY,width:F.width,height:F.height})).map(F=>F.key);e.setSelection(z)}return}if(y.mode==="draw"){_(null);let m=Ie(f),g=y.start,R=Te(j,m),I=R.x-g.x,E=R.y-g.y,S=Math.abs(I),X=Math.abs(E),B=y.parent,z=B?{x:B.absX,y:B.absY}:{x:0,y:0},F=S<4&&X<4,fe={frame:{width:320,height:480},rect:{width:120,height:120},ellipse:{width:120,height:120},text:{width:200,height:28},line:{width:160,height:0}}[y.tool],he=F?fe.width:Math.max(2,S),Me=F?fe.height:Math.max(y.tool==="line"?0:2,X),ye=F?g.x:Math.min(g.x,R.x),Le=F?g.y:Math.min(g.y,R.y),rt=0;if(y.tool==="line"&&!F){let qe=Math.max(2,Math.hypot(I,E));ye=(g.x+R.x)/2-qe/2,Le=(g.y+R.y)/2,rt=Math.atan2(E,I)*180/Math.PI}let Ge={type:y.tool,name:y.tool==="text"?"Text":y.tool==="frame"?"Frame":y.tool==="rect"?"Rectangle":y.tool==="ellipse"?"Ellipse":"Line",x:ye-z.x,y:Le-z.y,width:y.tool==="line"&&!F?Math.max(2,Math.hypot(I,E)):he,height:y.tool==="line"?0:Me,rotation:rt,opacity:1,visible:!0,locked:!1};y.tool==="frame"?Object.assign(Ge,{fills:[{type:"solid",color:"#FFFFFF"}],strokes:[],effects:[],cornerRadius:0,clip:!0,children:[]}):y.tool==="rect"||y.tool==="ellipse"?Object.assign(Ge,{fills:[{type:"solid",color:"#D9D9D9"}],strokes:[],effects:[],cornerRadius:0}):y.tool==="text"?Object.assign(Ge,{text:"Text",font:{family:"system-ui",weight:400,style:"normal",size:16,lineHeight:1.4,letterSpacing:0},align:"left",verticalAlign:"top",fills:[{type:"solid",color:"#111111"}],effects:[],autoHeight:!0}):y.tool==="line"&&Object.assign(Ge,{strokes:[{color:"#111111",width:1,align:"center"}]});let ot=e.addNode(Ge,B?.sourceId??null);ot&&(e.setTool("pointer"),ot.type==="text"&&e.beginTextEdit(ot.id));return}if(y.mode==="crop"){e.commitCrop();return}if(y.mode==="move"||y.mode==="resize"||y.mode==="rotate"){if(s.current){cancelAnimationFrame(s.current),s.current=0;let m=r.current;r.current=null,m?.()}e.commit(),e.scheduleSave(),e.queueSelectionPost()}}},Ma=f=>{let y=Ie(f),m=Te(j,y),g=Je(e.state.scene,m,{enteredInstance:e.state.enteredInstance,deep:!0});if(g){if(g.type==="text"){e.beginTextEdit(g.key);return}if(g.type==="instance"){e.enterInstance(g.key);return}if(g.type==="frame"||g.type==="group"){g.children?.length&&e.setSelection([g.children[0].key]);return}if(g.instanceId&&e.state.enteredInstance===g.instanceId){e.setSelection([g.key]);return}}},za=()=>{let f=e.selectedNodes(),y=e.primaryNode(),m=[];for(let g of f){let R=hn(g).map(I=>ae(j,I));m.push($.createElement("polygon",{key:`outline-${g.key}`,points:R.map(I=>`${I.x},${I.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:1}))}if(k&&!D.selection.includes(k)){let g=e.findSceneNode(k);if(g){let R=hn(g).map(I=>ae(j,I));m.push($.createElement("polygon",{key:"hover",points:R.map(I=>`${I.x},${I.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:1,opacity:.55}))}}if(y&&f.length===1&&y.editable&&!D.crop){let g=Ni(y,j);for(let[E,S]of Object.entries(g))m.push($.createElement("rect",{key:`handle-${E}`,x:S.x-Tt/2,y:S.y-Tt/2,width:Tt,height:Tt,fill:"var(--dsw-alias-bg-base)",stroke:"var(--dshc-accent)",strokeWidth:1,style:{cursor:E==="n"||E==="s"?"ns-resize":E==="e"||E==="w"?"ew-resize":E==="nw"||E==="se"?"nwse-resize":"nesw-resize"},"data-handle":E}));let R=Ci(y,j),I=ae(j,de(y,{x:y.width/2,y:0}));m.push($.createElement("line",{key:"rotate-line",x1:I.x,y1:I.y,x2:R.x,y2:R.y,stroke:"var(--dshc-accent)",strokeWidth:1}),$.createElement("circle",{key:"rotate",cx:R.x,cy:R.y,r:5,fill:"var(--dsw-alias-bg-base)",stroke:"var(--dshc-accent)",strokeWidth:1,"data-handle":"rotate",style:{cursor:"grab"}}))}for(let g of C)if(g.axis==="x"){let R=g.value*j.zoom+j.x;m.push($.createElement("line",{key:`guide-${g.value}`,x1:R,y1:0,x2:R,y2:"100%",stroke:"var(--dsw-alias-state-error-primary)",strokeWidth:1,strokeDasharray:"4 4"}))}else{let R=g.value*j.zoom+j.y;m.push($.createElement("line",{key:`guide-${g.value}`,x1:0,y1:R,x2:"100%",y2:R,stroke:"var(--dsw-alias-state-error-primary)",strokeWidth:1,strokeDasharray:"4 4"}))}if(H&&m.push($.createElement("rect",{key:"marquee",x:H.x,y:H.y,width:H.width,height:H.height,fill:"color-mix(in srgb, var(--dshc-accent) 10%, transparent)",stroke:"var(--dshc-accent)",strokeWidth:1,strokeDasharray:"4 3"})),P&&m.push($.createElement("rect",{key:"draw",x:P.x,y:P.y,width:P.width,height:P.height,fill:"none",stroke:"var(--dshc-accent)",strokeWidth:1,strokeDasharray:"4 3"})),D.crop){let g=e.findSceneNode(D.crop.key);if(g){let R=D.crop.crop,I=[ae(j,de(g,{x:R.x*g.width,y:R.y*g.height})),ae(j,de(g,{x:(R.x+R.width)*g.width,y:R.y*g.height})),ae(j,de(g,{x:(R.x+R.width)*g.width,y:(R.y+R.height)*g.height})),ae(j,de(g,{x:R.x*g.width,y:(R.y+R.height)*g.height}))];m.push($.createElement("polygon",{key:"crop",points:I.map(E=>`${E.x},${E.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:2}))}}for(let[g,R]of Ae.entries()){let I="#FF4D6D";m.push($.createElement("line",{key:`measure-line-${g}`,x1:R.x1,y1:R.y1,x2:R.x2,y2:R.y2,stroke:I,strokeWidth:1}));let E=4;R.axis==="h"?m.push($.createElement("line",{key:`measure-t1-${g}`,x1:R.x1,y1:R.y1-E,x2:R.x1,y2:R.y1+E,stroke:I,strokeWidth:1}),$.createElement("line",{key:`measure-t2-${g}`,x1:R.x2,y1:R.y2-E,x2:R.x2,y2:R.y2+E,stroke:I,strokeWidth:1})):m.push($.createElement("line",{key:`measure-t1-${g}`,x1:R.x1-E,y1:R.y1,x2:R.x1+E,y2:R.y1,stroke:I,strokeWidth:1}),$.createElement("line",{key:`measure-t2-${g}`,x1:R.x2-E,y1:R.y2,x2:R.x2+E,y2:R.y2,stroke:I,strokeWidth:1}));let S=(R.x1+R.x2)/2,X=(R.y1+R.y2)/2,B=Math.max(20,R.label.length*6+8),z=R.axis==="h"?S-B/2:S+6,F=R.axis==="h"?X-13:X-7;m.push($.createElement("rect",{key:`measure-bg-${g}`,x:z,y:F,width:B,height:14,rx:3,fill:I}),$.createElement("text",{key:`measure-text-${g}`,x:z+B/2,y:F+10,fill:"#FFFFFF",fontSize:9,fontFamily:"system-ui",textAnchor:"middle"},R.label))}return m},jt=D.editingText?e.findSceneNode(D.editingText.key):null,An=(D.doc?.comments??[]).filter(f=>f.pageId===D.pageId),Aa=D.showComments?An.filter(f=>!f.resolved):[],Yt=e.primaryNode(),Jr=Yt&&Yt.type==="text"?Mt(Yt):{color:"var(--dsw-alias-label-primary)"},Fa=pe?Ft(e):[];return $.createElement("div",{ref:n,className:`${J}-viewport`,"data-tool":D.tool,tabIndex:-1,onPointerDown:ka,onPointerMove:Na,onPointerUp:zn,onPointerCancel:zn,onPointerLeave:()=>we([]),onDoubleClick:Ma,onContextMenu:Sa,onDragOver:f=>{f.dataTransfer?.types?.includes("Files")&&f.preventDefault()},onDrop:f=>{let y=[...f.dataTransfer?.files??[]];if(y.length){f.preventDefault();for(let m of y)m.type.startsWith("image/")&&e.uploadImageFile(m)}},style:{position:"absolute",inset:0,overflow:"hidden",cursor:D.tool==="hand"||le?"grab":D.tool==="comment"?"crosshair":D.tool==="pointer"?"default":"crosshair",background:"var(--dsw-alias-bg-base)",backgroundImage:"radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent) 1px, transparent 0)",backgroundSize:"16px 16px",userSelect:"none"}},$.createElement("div",{className:`${J}-world`,style:{position:"absolute",left:0,top:0,transform:`translate(${j.x}px, ${j.y}px) scale(${j.zoom})`,transformOrigin:"0 0"}},$.createElement(sa,{scene:D.scene,store:e})),$.createElement("svg",{className:`${J}-overlay`,style:{position:"absolute",inset:0,pointerEvents:"none",overflow:"visible"}},za()),(D.scene?.roots??[]).filter(f=>f.type==="frame"&&f.visible!==!1).map(f=>$.createElement(vr,{key:`frame-label-${f.key}`,node:f,viewport:j,selected:D.selection.includes(f.key),onSelect:()=>{e.setSelection([f.key]),e.emit()}})),k&&!(D.scene?.roots??[]).some(f=>f.key===k&&f.type==="frame")&&$.createElement(Rr,{node:e.findSceneNode(k),viewport:j,key:`hover-label-${k}`}),D.editingText&&jt&&$.createElement(Er,{key:`edit-${jt.key}`,node:jt,viewport:j,value:l,onChange:o,onCommit:()=>e.commitTextEdit(l),onCancel:()=>e.cancelTextEdit()}),D.commentDraft&&$.createElement(Sr,{draft:D.commentDraft,value:c,onChange:d,onCancel:()=>{D.commentDraft=null,d(""),e.emit()},onSave:()=>{e.addComment(c,{nodeId:D.commentDraft.nodeId,x:D.commentDraft.x,y:D.commentDraft.y}),d("")}}),Aa.map(f=>$.createElement("button",{key:f.id,type:"button","data-comment-pin":f.id,className:`${J}-comment-pin ${f.author==="ai"?`${J}-comment-pin-ai`:""}`,style:(()=>{let y=e.commentPosition(f);return{left:y.x,top:y.y}})(),onClick:y=>{y.stopPropagation(),p(u===f.id?null:f.id);let m=f.nodeId?e.findSceneNode(f.nodeId):null;m&&e.setSelection([m.key])},title:f.body},f.replies?.length?String(f.replies.length+1):"1")),u&&(()=>{let f=An.find(m=>m.id===u);if(!f)return null;let y=e.commentPosition(f);return $.createElement($r,{comment:f,position:y,replyText:w,onReplyChange:v,onReply:()=>{e.replyComment(f.id,w),v("")},onResolve:()=>{e.resolveComment(f.id,!0),p(null)},onDelete:()=>{e.deleteComment(f.id),p(null)},onClose:()=>p(null)})})(),D.crop&&$.createElement(kr,{crop:D.crop.crop,onChange:f=>e.updateCrop(f),onCommit:()=>e.commitCrop(),onCancel:()=>e.cancelCrop()}),pe&&$.createElement(zt,{x:pe.x,y:pe.y,fixed:pe.fixed,items:Fa,onClose:()=>Ee(null)}),!D.scene?.roots?.length&&$.createElement("div",{className:`${J}-empty`,style:{pointerEvents:"none"}},$.createElement("div",{className:`${J}-empty-title`},"\u753B\u5E03\u662F\u7A7A\u7684"),$.createElement("div",{className:`${J}-empty-text`},"\u7528\u5DE5\u5177\u680F\u753B\u4E00\u4E2A Frame\uFF0C\u6216\u70B9\u300C\u8BA9 AI \u751F\u6210\u300D")))}function vr({node:e,viewport:t,selected:n,onSelect:i}){let a=de(e,{x:0,y:0}),s=ae(t,a);return $.createElement("div",{className:`${J}-frame-label ${n?"is-selected":""}`,style:{position:"absolute",left:s.x,top:s.y-6,transform:"translateY(-100%)",maxWidth:220,padding:"1px 6px",borderRadius:4,font:"500 11px/1.5 var(--dsw-font-family, system-ui, sans-serif)",background:n?"var(--dshc-accent)":"var(--dsw-alias-label-primary)",color:n?"#FFFFFF":"var(--dsw-alias-bg-base)",opacity:n?1:.78,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",cursor:"pointer",pointerEvents:"auto",userSelect:"none",zIndex:9},title:e.name,onPointerDown:r=>{r.preventDefault(),r.stopPropagation(),i?.()}},e.name||"Frame")}function Rr({node:e,viewport:t}){if(!e)return null;let n=ae(t,{x:e.absX,y:e.absY-18/t.zoom});return $.createElement("div",{className:`${J}-hover-label`,style:{position:"absolute",left:n.x,top:n.y,pointerEvents:"none"}},e.name)}function Er({node:e,viewport:t,value:n,onChange:i,onCommit:a,onCancel:s}){let r=$.useRef(null);$.useEffect(()=>{r.current?.focus(),r.current?.select()},[]);let l=e.absX*t.zoom+t.x,o=e.absY*t.zoom+t.y,c=Math.max(24,e.width*t.zoom),d=Math.max(20,e.height*t.zoom),u=Mt(e);return $.createElement("textarea",{ref:r,className:`${J}-text-editor`,value:n,onChange:p=>i(p.target.value),onPointerDown:p=>p.stopPropagation(),onBlur:a,onKeyDown:p=>{p.stopPropagation(),p.key==="Escape"?(p.preventDefault(),s()):p.key==="Enter"&&(p.metaKey||p.ctrlKey)&&(p.preventDefault(),a())},style:{position:"absolute",left:l,top:o,width:c,height:d,padding:0,margin:0,border:"1px solid var(--dshc-accent)",outline:"none",resize:"none",overflow:"hidden",background:"color-mix(in srgb, var(--dsw-alias-bg-overlay) 88%, transparent)",color:u.color==="transparent"?"var(--dsw-alias-label-primary)":u.color,fontFamily:`"${e.font?.family??"system-ui"}", system-ui, sans-serif`,fontWeight:e.font?.weight??400,fontStyle:e.font?.style??"normal",fontSize:`${(e.font?.size??14)*t.zoom}px`,lineHeight:String(e.font?.lineHeight??1.4),letterSpacing:`${(e.font?.letterSpacing??0)*t.zoom}px`,textAlign:e.align??"left",zIndex:20,borderRadius:2}})}function Sr({draft:e,value:t,onChange:n,onCancel:i,onSave:a}){return $.createElement("div",{className:`${J}-comment-popover`,style:{left:Math.max(8,e.screenX),top:Math.max(8,e.screenY)},onPointerDown:s=>s.stopPropagation()},$.createElement("div",{className:`${J}-comment-title`},"\u6DFB\u52A0\u8BC4\u8BBA"),$.createElement("textarea",{autoFocus:!0,value:t,onChange:s=>n(s.target.value),placeholder:"\u5199\u4E0B\u8BBE\u8BA1\u53CD\u9988\u2026",className:`${J}-comment-input`,rows:3}),$.createElement("div",{className:`${J}-comment-actions`},$.createElement("button",{type:"button",onClick:i,className:`${J}-btn`},"\u53D6\u6D88"),$.createElement("button",{type:"button",onClick:a,className:`${J}-btn ${J}-btn-primary`,disabled:!t.trim()},"\u8BC4\u8BBA")))}function $r({comment:e,position:t,replyText:n,onReplyChange:i,onReply:a,onResolve:s,onDelete:r,onClose:l}){return $.createElement("div",{className:`${J}-comment-popover`,style:{left:Math.max(8,t.x+14),top:Math.max(8,t.y-8)},onPointerDown:o=>o.stopPropagation()},$.createElement("div",{className:`${J}-comment-title`},e.resolved?"\u5DF2\u89E3\u51B3\u8BC4\u8BBA":"\u8BC4\u8BBA"),$.createElement("div",{className:`${J}-comment-author`},e.author==="ai"?"AI":"\u4F60"),$.createElement("div",{className:`${J}-comment-body`},e.body),(e.replies??[]).map(o=>$.createElement("div",{key:o.id,className:`${J}-comment-reply`},$.createElement("b",null,o.author==="ai"?"AI":"\u4F60"),$.createElement("span",null,o.body))),!e.resolved&&$.createElement("div",null,$.createElement("textarea",{value:n,onChange:o=>i(o.target.value),placeholder:"\u56DE\u590D\u2026",className:`${J}-comment-input`,rows:2}),$.createElement("div",{className:`${J}-comment-actions`},$.createElement("button",{type:"button",className:`${J}-btn`,onClick:l},"\u5173\u95ED"),$.createElement("button",{type:"button",className:`${J}-btn`,onClick:r},"\u5220\u9664"),$.createElement("button",{type:"button",className:`${J}-btn`,onClick:s},"\u89E3\u51B3"),$.createElement("button",{type:"button",className:`${J}-btn ${J}-btn-primary`,onClick:a,disabled:!n.trim()},"\u56DE\u590D"))))}function kr({crop:e,onChange:t,onCommit:n,onCancel:i}){return $.createElement("div",{className:`${J}-crop-bar`,onPointerDown:a=>a.stopPropagation()},$.createElement("span",null,"\u88C1\u526A"),$.createElement("label",null,"X",$.createElement("input",{type:"number",step:.01,min:0,max:1,value:Dt(e.x),onChange:a=>t({...e,x:Lt(a.target.value)})})),$.createElement("label",null,"Y",$.createElement("input",{type:"number",step:.01,min:0,max:1,value:Dt(e.y),onChange:a=>t({...e,y:Lt(a.target.value)})})),$.createElement("label",null,"\u5BBD",$.createElement("input",{type:"number",step:.01,min:.05,max:1,value:Dt(e.width),onChange:a=>t({...e,width:Lt(a.target.value,.05,1)})})),$.createElement("label",null,"\u9AD8",$.createElement("input",{type:"number",step:.01,min:.05,max:1,value:Dt(e.height),onChange:a=>t({...e,height:Lt(a.target.value,.05,1)})})),$.createElement("button",{type:"button",className:`${J}-btn`,onClick:i},"\u53D6\u6D88"),$.createElement("button",{type:"button",className:`${J}-btn ${J}-btn-primary`,onClick:n},"\u5B8C\u6210"))}function Dt(e){return Math.round((Number(e)||0)*100)/100}function Lt(e,t=0,n=1){return Math.min(n,Math.max(t,Number(e)||0))}var W=Oe(require("react"),1);var Ir=[["pointer","v","\u79FB\u52A8/\u9009\u62E9 (V)"],["frame","f","Frame (F)"],["rect","r","\u77E9\u5F62 (R)"],["ellipse","o","\u692D\u5706 (O)"],["line","l","\u76F4\u7EBF (L)"],["text","t","\u6587\u672C (T)"],["image","i","\u56FE\u7247 (I)"],["hand","h","\u6293\u624B (H)"],["comment","c","\u8BC4\u8BBA (C)"]];function da({store:e,onNewDoc:t,onRenameDoc:n,onDeleteDoc:i,onNeedName:a}){let s=e.state,[r,l]=W.useState(!1),[o,c]=W.useState(!1),d=W.useRef(null),u=W.useRef(null);W.useEffect(()=>{if(!o)return;let C=le=>{d.current?.contains(le.target)||c(!1)},q=le=>{le.key==="Escape"&&c(!1)};return window.addEventListener("pointerdown",C,!0),window.addEventListener("keydown",q,!0),()=>{window.removeEventListener("pointerdown",C,!0),window.removeEventListener("keydown",q,!0)}},[o]);let p=C=>C.title&&C.title!==C.name?`${C.title} \xB7 ${C.name}`:C.name,w=s.docs.some(C=>C.name===s.name)?s.docs:[{name:s.name,title:s.name},...s.docs],v=w.find(C=>C.name===s.name)??w[0],k=v?p(v):s.name,H=s.scene?.roots??[],x=s.selection.length,P=()=>{e.imageInsertPoint=null,e.requestImagePick?.()},_=C=>{if(C==="image"){P();return}e.setTool(C)};return W.createElement("div",{className:"dshc-topbar"},W.createElement("div",{className:"dshc-topbar-row dshc-topbar-docs"},W.createElement("div",{className:"dshc-doc-picker",ref:d},W.createElement("button",{type:"button",className:"dshc-doc-trigger",title:"\u5207\u6362 / \u91CD\u547D\u540D\u753B\u5E03\u6587\u6863",onClick:()=>c(C=>!C)},W.createElement("span",{className:"dshc-doc-trigger-label"},k),W.createElement(oe,{name:"chevronDown",size:12})),o&&W.createElement("div",{className:"dshc-doc-menu"},w.map(C=>W.createElement("div",{key:C.name,className:`dshc-doc-row ${C.name===s.name?"is-active":""}`},W.createElement("button",{type:"button",className:"dshc-doc-open",onClick:()=>{c(!1),e.loadDoc(C.name)}},W.createElement(oe,{name:"check",size:12,className:C.name===s.name?"":"dshc-doc-check-hidden"}),W.createElement("span",{className:"dshc-doc-label"},p(C))),W.createElement(Y,{icon:"pencil",size:12,title:`\u91CD\u547D\u540D ${C.name}`,onClick:()=>{c(!1),n?.(C.name)}}))),w.length===0&&W.createElement("div",{className:"dshc-doc-empty"},"\u8FD8\u6CA1\u6709\u753B\u5E03"))),W.createElement(Y,{icon:"plus",title:"\u65B0\u5EFA\u753B\u5E03",onClick:t}),W.createElement(Y,{icon:"pencil",title:"\u91CD\u547D\u540D\u753B\u5E03",onClick:()=>n?.(s.name)}),W.createElement(Y,{icon:"trash",title:"\u5220\u9664\u753B\u5E03",onClick:()=>i?.()}),W.createElement(Y,{icon:"download",title:"\u5BFC\u51FA SVG / PNG",onClick:()=>l(!r)}),W.createElement("span",{className:"dshc-spacer"}),W.createElement(Y,{icon:"undo",title:"\u64A4\u9500 (\u2318Z)",onClick:()=>e.undo(),disabled:!e.history.canUndo()}),W.createElement(Y,{icon:"redo",title:"\u91CD\u505A (\u21E7\u2318Z)",onClick:()=>e.redo(),disabled:!e.history.canRedo()})),W.createElement("div",{className:"dshc-topbar-row dshc-topbar-tools"},...Ir.map(([C,q,le])=>W.createElement(Y,{key:C,icon:C,title:le,active:s.tool===C,onClick:()=>_(C)})),W.createElement("span",{className:"dshc-divider"}),W.createElement(Y,{icon:"comment",title:"\u663E\u793A/\u9690\u85CF\u8BC4\u8BBA",active:s.showComments,onClick:()=>{s.showComments=!s.showComments,e.emit()}}),W.createElement(Y,{icon:"zoomOut",title:"\u7F29\u5C0F",onClick:()=>{let C=e.viewportSize();e.zoomAt({x:C.width/2,y:C.height/2},1/1.2)}}),W.createElement("button",{type:"button",className:"dshc-zoom-label",title:"\u91CD\u7F6E\u5230 100%",onClick:()=>e.setViewport({...e.viewport,zoom:1})},`${Math.round(s.viewport.zoom*100)}%`),W.createElement(Y,{icon:"zoomIn",title:"\u653E\u5927",onClick:()=>{let C=e.viewportSize();e.zoomAt({x:C.width/2,y:C.height/2},1.2)}}),W.createElement(Y,{icon:"fit",title:"\u9002\u5E94\u753B\u5E03 (1)",onClick:()=>e.zoomToFit()}),W.createElement(Y,{icon:"reset",title:"\u9002\u5E94\u9009\u533A (2)",onClick:()=>e.zoomToSelection()})),r&&W.createElement("div",{className:"dshc-export-menu"},W.createElement("div",{className:"dshc-export-title"},x?"\u5BFC\u51FA\u9009\u533A":"\u5BFC\u51FA\u6574\u9875"),W.createElement(O,{icon:"download",onClick:()=>{l(!1),e.exportSelection("svg")}},"SVG"),W.createElement(O,{icon:"download",onClick:()=>{l(!1),e.exportSelection("png")}},"PNG (2x)"),W.createElement("div",{className:"dshc-export-hint"},"\u4FDD\u5B58\u5230 canvas/exports/\uFF0C\u5E76\u628A\u8DEF\u5F84\u63D2\u5165\u8F93\u5165\u6846")),W.createElement("input",{ref:C=>{u.current=C,e.imagePicker=C},type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",style:{display:"none"},onChange:C=>{let q=C.target.files?.[0];q&&e.uploadImageFile(q,e.imageInsertPoint??void 0),e.imageInsertPoint=null,C.target.value=""}}))}var te=Oe(require("react"),1);function ha(e,t){return(e.children??[]).some(n=>t.has(n.key)||ha(n,t))}function ua({node:e,depth:t,store:n,onRename:i,onRowContextMenu:a}){let s=n.state.selection.includes(e.key),r=n.state.primaryKey===e.key,[l,o]=te.useState(!1),c=e.children?.length>0;te.useEffect(()=>{let u=new Set(n.state.selection);(u.has(e.key)||ha(e,u))&&o(!0)},[n.state.selection,e]);let d=e.type==="frame"?"frame":e.type==="group"?"group":e.type==="text"?"text":e.type==="instance"?"component":e.type==="ellipse"?"ellipse":e.type==="line"?"line":"rect";return te.createElement(te.Fragment,null,te.createElement("div",{className:`dshc-layer-row ${s?"is-selected":""} ${r?"is-primary":""}`,style:{paddingLeft:6+t*14},onClick:u=>{u.shiftKey?n.toggleSelection(e.key):n.setSelection([e.key])},onDoubleClick:()=>i?.(e),onContextMenu:u=>{u.preventDefault(),u.stopPropagation(),s||n.setSelection([e.key]),a?.(u,e)},title:`${e.name} \xB7 ${e.type}`},c?te.createElement("button",{type:"button",className:"dshc-layer-caret",onClick:u=>{u.stopPropagation(),o(!l)}},te.createElement(oe,{name:l?"chevronDown":"chevronRight",size:11})):te.createElement("span",{className:"dshc-layer-caret"}),te.createElement(oe,{name:d,size:14}),te.createElement("span",{className:"dshc-layer-name"},e.name||e.type),e.editable&&te.createElement("span",{className:"dshc-layer-actions"},te.createElement(Y,{icon:e.visible===!1?"eyeOff":"eye",title:e.visible===!1?"\u663E\u793A":"\u9690\u85CF",size:14,onClick:u=>{u.stopPropagation(),n.setVisibility(e.sourceId,e.visible===!1)}}),te.createElement(Y,{icon:e.locked?"lock":"unlock",title:e.locked?"\u89E3\u9501":"\u9501\u5B9A",size:14,onClick:u=>{u.stopPropagation(),n.setLocked(e.sourceId,!e.locked)}}),te.createElement(Y,{icon:"front",title:"\u4E0A\u79FB",size:14,onClick:u=>{u.stopPropagation(),n.setSelection([e.key]),n.reorder("forward")}}),te.createElement(Y,{icon:"back",title:"\u4E0B\u79FB",size:14,onClick:u=>{u.stopPropagation(),n.setSelection([e.key]),n.reorder("backward")}}))),c&&l?e.children.map(u=>te.createElement(ua,{key:u.key,node:u,depth:t+1,store:n,onRename:i,onRowContextMenu:a})):null)}function pa({store:e,onRename:t,onRowContextMenu:n}){let a=e.state.scene?.roots??[];return te.createElement("div",{className:"dshc-layer-panel"},te.createElement("div",{className:"dshc-panel-title"},te.createElement("span",null,"\u56FE\u5C42"),te.createElement("span",{className:"dshc-panel-count"},a.length?`${ma(a)}`:"")),a.length?a.slice().reverse().map(s=>te.createElement(ua,{key:s.key,node:s,depth:0,store:e,onRename:t,onRowContextMenu:n})):te.createElement("div",{className:"dshc-panel-empty"},"\u753B\u5E03\u4E3A\u7A7A"))}function ma(e){let t=0;for(let n of e)t+=1,n.children&&(t+=ma(n.children));return t}var h=Oe(require("react"),1);var Nr=["system-ui","Inter","Helvetica Neue","Arial","Georgia","Times New Roman","Menlo","PingFang SC","Microsoft YaHei"];function Cr(e){return e.primaryNode()}function Z(e,t,n){if(t){if(t.instanceId&&t.instanceId!==t.key){let i={};"text"in n&&(i.text=n.text),"fills"in n&&(i.fills=n.fills),"visible"in n&&(i.visible=n.visible),Object.keys(i).length&&e.setOverride(t.instanceId,t.sourceId,i);return}e.updateNode(t.sourceId,n)}}function Ht({children:e,className:t=""}){return h.createElement("div",{className:`dshc-row ${t}`},e)}function ga({store:e,onNameDialog:t}){let n=Cr(e),i=e.state,a=i.doc;if(!n)return h.createElement("div",{className:"dshc-inspector"},h.createElement(be,{title:"\u753B\u5E03"},h.createElement(O,{icon:"sparkle",onClick:()=>e.insertPrompt()},"\u8BA9 AI \u751F\u6210 UI"),h.createElement(O,{icon:"upload",onClick:()=>e.zoomToFit()},"\u9002\u5E94\u753B\u5E03")));let s=n.instanceId&&n.instanceId!==n.key,r=s,l=n.editable&&!r;return s?h.createElement(Mr,{store:e,node:n}):h.createElement("div",{className:"dshc-inspector","data-node":n.sourceId},h.createElement("div",{className:"dshc-inspector-head"},h.createElement(oe,{name:n.type==="frame"?"frame":n.type==="text"?"text":n.type==="group"?"group":n.type==="instance"?"component":n.type==="ellipse"?"ellipse":"rect",size:14}),h.createElement("input",{className:"dshc-name-input",defaultValue:n.name??"",key:`${n.sourceId}-name-${n.name}`,disabled:!l,onBlur:o=>{let c=o.target.value.trim();c&&c!==n.name&&e.renameNode(n.sourceId,c)},onKeyDown:o=>{o.key==="Enter"&&o.currentTarget.blur()}}),h.createElement("span",{className:"dshc-type-chip"},n.type)),i.selection.length>1&&h.createElement(be,{title:`\u5BF9\u9F50 \xB7 ${i.selection.length} \u4E2A\u56FE\u5C42`},h.createElement("div",{className:"dshc-align-grid"},...[["alignLeft","left","\u5DE6\u5BF9\u9F50"],["alignCenterX","centerX","\u6C34\u5E73\u5C45\u4E2D"],["alignRight","right","\u53F3\u5BF9\u9F50"],["alignTop","top","\u9876\u5BF9\u9F50"],["alignCenterY","centerY","\u5782\u76F4\u5C45\u4E2D"],["alignBottom","bottom","\u5E95\u5BF9\u9F50"]].map(([o,c,d])=>h.createElement(Y,{key:c,icon:o,title:d,onClick:()=>e.align(c)})),h.createElement(Y,{icon:"distributeX",title:"\u6C34\u5E73\u5206\u5E03",onClick:()=>e.distribute("x")}),h.createElement(Y,{icon:"distributeY",title:"\u5782\u76F4\u5206\u5E03",onClick:()=>e.distribute("y")}),h.createElement(Y,{icon:"group",title:"\u6210\u7EC4 (\u2318G)",onClick:()=>e.groupSelection()}),h.createElement(Y,{icon:"ungroup",title:"\u89E3\u7EC4 (\u21E7\u2318G)",onClick:()=>e.ungroupSelection()}))),h.createElement(be,{title:"\u4F4D\u7F6E\u4E0E\u5C3A\u5BF8"},h.createElement("div",{className:"dshc-grid-2"},h.createElement(G,{label:"X"},h.createElement(ce,{value:V(n.sourceNode.x),disabled:!l,onChange:o=>Z(e,n,{x:o})})),h.createElement(G,{label:"Y"},h.createElement(ce,{value:V(n.sourceNode.y),disabled:!l,onChange:o=>Z(e,n,{y:o})})),h.createElement(G,{label:"\u5BBD"},h.createElement(ce,{value:V(n.sourceNode.width),min:0,disabled:!l,onChange:o=>Z(e,n,{width:o})})),h.createElement(G,{label:"\u9AD8"},h.createElement(ce,{value:V(n.sourceNode.height),min:0,disabled:!l,onChange:o=>Z(e,n,{height:o})})),h.createElement(G,{label:"\u65CB\u8F6C"},h.createElement(ce,{value:V(n.sourceNode.rotation),disabled:!l,onChange:o=>Z(e,n,{rotation:o})})),h.createElement(G,{label:"\u900F\u660E\u5EA6"},h.createElement(ce,{value:V(n.sourceNode.opacity??1),min:0,max:1,step:.05,disabled:!l,onChange:o=>Z(e,n,{opacity:o})}))),h.createElement(Ht,null,h.createElement(Y,{icon:"front",title:"\u7F6E\u9876",onClick:()=>e.reorder("front")}),h.createElement(Y,{icon:"back",title:"\u7F6E\u5E95",onClick:()=>e.reorder("back")}),h.createElement(Y,{icon:"trash",title:"\u5220\u9664",danger:!0,onClick:()=>e.deleteSelection()}))),(n.type==="frame"||n.type==="instance")&&h.createElement(be,{title:"\u81EA\u52A8\u5E03\u5C40",right:n.sourceNode.layout?"\u5DF2\u542F\u7528":null},n.sourceNode.layout?h.createElement(h.Fragment,null,h.createElement("div",{className:"dshc-seg"},h.createElement(O,{small:!0,active:n.sourceNode.layout.direction==="horizontal",onClick:()=>Ze(e,n,{direction:"horizontal"})},"\u6A2A\u5411"),h.createElement(O,{small:!0,active:n.sourceNode.layout.direction==="vertical",onClick:()=>Ze(e,n,{direction:"vertical"})},"\u7EB5\u5411")),h.createElement("div",{className:"dshc-grid-2"},h.createElement(G,{label:"\u95F4\u8DDD"},h.createElement(ce,{value:n.sourceNode.layout.gap??0,min:0,onChange:o=>Ze(e,n,{gap:o})})),h.createElement(G,{label:"\u5185\u8FB9\u8DDD"},h.createElement(ce,{value:n.sourceNode.layout.padding?.top??0,min:0,onChange:o=>Ze(e,n,{padding:{...n.sourceNode.layout.padding,top:o,right:o,bottom:o,left:o}})})),h.createElement(G,{label:"\u4E3B\u8F74\u5BF9\u9F50"},h.createElement(ue,{value:n.sourceNode.layout.alignPrimary??"start",options:[{value:"start",label:"\u8D77\u59CB"},{value:"center",label:"\u5C45\u4E2D"},{value:"end",label:"\u672B\u5C3E"},{value:"space-between",label:"\u4E24\u7AEF"}],onChange:o=>Ze(e,n,{alignPrimary:o})})),h.createElement(G,{label:"\u4EA4\u53C9\u8F74"},h.createElement(ue,{value:n.sourceNode.layout.alignCounter??"start",options:[{value:"start",label:"\u8D77\u59CB"},{value:"center",label:"\u5C45\u4E2D"},{value:"end",label:"\u672B\u5C3E"},{value:"stretch",label:"\u62C9\u4F38"}],onChange:o=>Ze(e,n,{alignCounter:o})}))),h.createElement(G,{label:"\u81EA\u8EAB\u5C3A\u5BF8"},h.createElement(ue,{value:n.sourceNode.layoutSizing?.v??"fixed",options:[{value:"fixed",label:"\u56FA\u5B9A"},{value:"hug",label:"\u9002\u5E94\u5185\u5BB9"},{value:"fill",label:"\u586B\u5145"}],onChange:o=>Z(e,n,{layoutSizing:{...n.sourceNode.layoutSizing??{h:"fixed"},v:o}})})),h.createElement(O,{small:!0,icon:"close",onClick:()=>Z(e,n,{layout:null})},"\u79FB\u9664\u81EA\u52A8\u5E03\u5C40")):h.createElement(O,{small:!0,icon:"plus",onClick:()=>Ze(e,n,{direction:"vertical",gap:8,padding:{top:12,right:12,bottom:12,left:12},alignPrimary:"start",alignCounter:"start"})},"\u6DFB\u52A0\u81EA\u52A8\u5E03\u5C40")),n.parent?.layout&&h.createElement(be,{title:"\u5E03\u5C40\u5B50\u9879"},h.createElement("div",{className:"dshc-grid-2"},h.createElement(G,{label:"\u6C34\u5E73"},h.createElement(ue,{value:n.sourceNode.layoutSizing?.h??"fixed",options:[{value:"fixed",label:"\u56FA\u5B9A"},{value:"hug",label:"\u9002\u5E94"},{value:"fill",label:"\u586B\u5145"}],onChange:o=>Z(e,n,{layoutSizing:{...n.sourceNode.layoutSizing??{v:"fixed"},h:o}})})),h.createElement(G,{label:"\u5782\u76F4"},h.createElement(ue,{value:n.sourceNode.layoutSizing?.v??"fixed",options:[{value:"fixed",label:"\u56FA\u5B9A"},{value:"hug",label:"\u9002\u5E94"},{value:"fill",label:"\u586B\u5145"}],onChange:o=>Z(e,n,{layoutSizing:{...n.sourceNode.layoutSizing??{h:"fixed"},v:o}})})))),n.type==="text"&&h.createElement(be,{title:"\u6587\u672C"},h.createElement("textarea",{className:"dshc-textarea",value:n.sourceNode.text??"",onChange:o=>Z(e,n,{text:o.target.value}),rows:3,disabled:!l}),h.createElement("div",{className:"dshc-grid-2"},h.createElement(G,{label:"\u5B57\u4F53"},h.createElement(ue,{value:n.sourceNode.font?.family??"system-ui",options:[...new Set([...Nr,...(a.fonts??[]).map(o=>o.family),n.sourceNode.font?.family].filter(Boolean))].map(o=>({value:o,label:o})),onChange:o=>Z(e,n,{font:{...n.sourceNode.font??{},family:o}})})),h.createElement(G,{label:"\u5B57\u91CD"},h.createElement(ue,{value:String(n.sourceNode.font?.weight??400),options:[100,200,300,400,500,600,700,800,900].map(o=>({value:String(o),label:String(o)})),onChange:o=>Z(e,n,{font:{...n.sourceNode.font??{},weight:Number(o)}})})),h.createElement(G,{label:"\u5B57\u53F7"},h.createElement(ce,{value:V(n.sourceNode.font?.size??14),min:1,onChange:o=>Z(e,n,{font:{...n.sourceNode.font??{},size:o}})})),h.createElement(G,{label:"\u884C\u9AD8"},h.createElement(ce,{value:V(n.sourceNode.font?.lineHeight??1.4),min:.5,step:.1,onChange:o=>Z(e,n,{font:{...n.sourceNode.font??{},lineHeight:o}})})),h.createElement(G,{label:"\u5B57\u8DDD"},h.createElement(ce,{value:V(n.sourceNode.font?.letterSpacing??0),step:.1,onChange:o=>Z(e,n,{font:{...n.sourceNode.font??{},letterSpacing:o}})})),h.createElement(G,{label:"\u5BF9\u9F50"},h.createElement(ue,{value:n.sourceNode.align??"left",options:[{value:"left",label:"\u5DE6"},{value:"center",label:"\u4E2D"},{value:"right",label:"\u53F3"},{value:"justify",label:"\u4E24\u7AEF"}],onChange:o=>Z(e,n,{align:o})}))),h.createElement(Ht,null,h.createElement("span",{className:"dshc-field-label"},"\u81EA\u52A8\u9AD8\u5EA6"),h.createElement(At,{value:n.sourceNode.autoHeight!==!1,onChange:o=>Z(e,n,{autoHeight:o})}))),!r&&["frame","rect","ellipse","text"].includes(n.type)&&h.createElement(be,{title:"\u586B\u5145"},(n.sourceNode.fills??[]).map((o,c)=>h.createElement(zr,{key:c,fill:o,index:c,store:e,node:n,onChange:d=>{let u=(n.sourceNode.fills??[]).slice();u[c]=d,Z(e,n,{fills:u})},onRemove:()=>{let d=(n.sourceNode.fills??[]).filter((u,p)=>p!==c);Z(e,n,{fills:d})},onCrop:()=>e.beginCrop(n.key,c)})),h.createElement("div",{className:"dshc-row"},h.createElement(O,{small:!0,icon:"plus",onClick:()=>Z(e,n,{fills:[...n.sourceNode.fills??[],{type:"solid",color:"#D9D9D9"}]})},"\u7EAF\u8272"),h.createElement(O,{small:!0,icon:"plus",onClick:()=>Z(e,n,{fills:[...n.sourceNode.fills??[],{type:"linear-gradient",angle:180,stops:[{position:0,color:"#4D6BFE"},{position:1,color:"#8B9DFF"}]}]})},"\u6E10\u53D8"))),!r&&["frame","rect","ellipse","line"].includes(n.type)&&h.createElement(be,{title:"\u63CF\u8FB9"},(n.sourceNode.strokes??[]).map((o,c)=>h.createElement("div",{key:c,className:"dshc-fill-row"},h.createElement(st,{value:o.color,onChange:d=>{let u=(n.sourceNode.strokes??[]).slice();u[c]={...o,color:d},Z(e,n,{strokes:u})}}),h.createElement(ce,{value:o.width,min:0,onChange:d=>{let u=(n.sourceNode.strokes??[]).slice();u[c]={...o,width:d},Z(e,n,{strokes:u})}}),h.createElement(Y,{icon:"trash",title:"\u5220\u9664\u63CF\u8FB9",size:13,onClick:()=>{let d=(n.sourceNode.strokes??[]).filter((u,p)=>p!==c);Z(e,n,{strokes:d})}}))),h.createElement(O,{small:!0,icon:"plus",onClick:()=>Z(e,n,{strokes:[...n.sourceNode.strokes??[],{color:"#94A3B8",width:1,align:"center"}]})},"\u6DFB\u52A0\u63CF\u8FB9")),!r&&h.createElement(be,{title:"\u6548\u679C"},(n.sourceNode.effects??[]).map((o,c)=>h.createElement(Ar,{key:c,effect:o,onChange:d=>{let u=(n.sourceNode.effects??[]).slice();u[c]=d,Z(e,n,{effects:u})},onRemove:()=>Z(e,n,{effects:(n.sourceNode.effects??[]).filter((d,u)=>u!==c)})})),h.createElement("div",{className:"dshc-row"},h.createElement(O,{small:!0,icon:"plus",onClick:()=>Z(e,n,{effects:[...n.sourceNode.effects??[],{type:"drop-shadow",x:0,y:8,blur:24,spread:0,color:"#00000040"}]})},"\u6295\u5F71"),h.createElement(O,{small:!0,icon:"plus",onClick:()=>Z(e,n,{effects:[...n.sourceNode.effects??[],{type:"inner-shadow",x:0,y:2,blur:8,spread:0,color:"#00000033"}]})},"\u5185\u9634\u5F71"),h.createElement(O,{small:!0,icon:"plus",onClick:()=>Z(e,n,{effects:[...n.sourceNode.effects??[],{type:"layer-blur",radius:4}]})},"\u6A21\u7CCA"),h.createElement(O,{small:!0,icon:"plus",onClick:()=>Z(e,n,{effects:[...n.sourceNode.effects??[],{type:"background-blur",radius:10}]})},"\u80CC\u666F\u6A21\u7CCA"))),!r&&(n.type==="frame"||n.type==="rect"||n.type==="ellipse"||n.type==="instance")&&h.createElement(be,{title:"\u5916\u89C2"},h.createElement(G,{label:"\u5706\u89D2"},h.createElement(ce,{value:V(n.type==="instance"?n.cornerRadius??n.sourceNode.cornerRadius??0:n.sourceNode.cornerRadius??0),min:0,onChange:o=>Z(e,n,{cornerRadius:o})})),n.type==="frame"&&h.createElement(Ht,null,h.createElement("span",{className:"dshc-field-label"},"\u88C1\u526A\u5185\u5BB9"),h.createElement(At,{value:n.sourceNode.clip!==!1,onChange:o=>Z(e,n,{clip:o})}))),n.type==="instance"&&h.createElement(Fr,{store:e,node:n,doc:a}),!s&&h.createElement(be,{title:"\u6837\u5F0F"},h.createElement($n,{store:e,node:n,type:"fill",label:"\u586B\u5145\u6837\u5F0F"}),n.type==="text"&&h.createElement($n,{store:e,node:n,type:"text",label:"\u6587\u672C\u6837\u5F0F"}),h.createElement($n,{store:e,node:n,type:"effect",label:"\u6548\u679C\u6837\u5F0F"}),h.createElement("div",{className:"dshc-row"},h.createElement(O,{small:!0,onClick:()=>t?.({title:"\u521B\u5EFA\u586B\u5145\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:n.name+" fill",onSubmit:o=>e.createStyle("fill",o)})},"\u4ECE\u586B\u5145\u521B\u5EFA\u6837\u5F0F"),n.type==="text"&&h.createElement(O,{small:!0,onClick:()=>t?.({title:"\u521B\u5EFA\u6587\u672C\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:n.name+" text",onSubmit:o=>e.createStyle("text",o)})},"\u521B\u5EFA\u6587\u672C\u6837\u5F0F"))),n.type==="frame"||n.type==="group"?h.createElement(be,{title:"\u7EC4\u4EF6"},h.createElement(O,{small:!0,icon:"component",onClick:()=>t?.({title:"\u521B\u5EFA\u7EC4\u4EF6",label:"\u7EC4\u4EF6\u540D\u79F0",defaultValue:n.name,onSubmit:o=>e.createComponentFromSelection(o)})},"\u4ECE\u9009\u533A\u521B\u5EFA\u7EC4\u4EF6"),n.type==="group"&&h.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.ungroupSelection()},"\u89E3\u7EC4")):null,n.type==="instance"&&h.createElement(Tr,{store:e,node:n,doc:a}),h.createElement(be,{title:"\u4EE3\u7801",defaultOpen:!1},h.createElement("div",{className:"dshc-row"},h.createElement(O,{small:!0,icon:"copy",onClick:()=>{let o=fa(e,n);navigator.clipboard?.writeText(o),e.toast("\u5DF2\u590D\u5236 CSS")}},"\u590D\u5236 CSS")),h.createElement("pre",{className:"dshc-code"},fa(e,n))))}function fa(e,t){if(!t)return"";let n=[],i=(c,d)=>{d==null||d===""||d==="none"||n.push(`  ${c}: ${d};`)};t.type!=="group"&&(i("width",`${V(t.width)}px`),i("height",`${V(t.height)}px`));let a=(t.fills??[])[0];if(t.type!=="text"){if(a?.type==="solid"&&a.color&&i("background",a.color),a?.type==="linear-gradient"&&Array.isArray(a.stops)){let c=a.stops.map(d=>`${d.color} ${Math.round(d.position*100)}%`).join(", ");i("background",`linear-gradient(${V(a.angle??180)}deg, ${c})`)}if(a?.type==="radial-gradient"&&Array.isArray(a.stops)){let c=a.stops.map(d=>`${d.color} ${Math.round(d.position*100)}%`).join(", ");i("background",`radial-gradient(circle, ${c})`)}a?.type==="image"&&a.asset&&i("background-image",`url("${Xe(e.sessionId,e.state.name,a.asset)}")`)}t.cornerRadius&&i("border-radius",`${V(t.cornerRadius)}px`);let s=(t.strokes??[])[0];s&&i("border",`${V(s.width??1)}px solid ${s.color??"#000000"}`);let r=[],l=[];for(let c of t.effects??[])c.type==="drop-shadow"&&r.push(`${V(c.x??0)}px ${V(c.y??0)}px ${V(c.blur??0)}px ${V(c.spread??0)}px ${c.color??"#00000033"}`),c.type==="inner-shadow"&&r.push(`inset ${V(c.x??0)}px ${V(c.y??0)}px ${V(c.blur??0)}px ${V(c.spread??0)}px ${c.color??"#00000033"}`),c.type==="layer-blur"&&l.push(`blur(${V(c.radius??0)}px)`);if(r.length&&i("box-shadow",r.join(", ")),l.length&&i("filter",l.join(" ")),t.type==="text"){let c=t.font??{};i("font-family",`'${c.family??"system-ui"}'`),i("font-size",`${V(c.size??14)}px`),i("font-weight",`${c.weight??400}`),i("line-height",`${Math.round((c.lineHeight??1.4)*100)}%`),i("letter-spacing",`${V(c.letterSpacing??0)}px`);let d=a?.type==="solid"?a.color:null;d&&i("color",d),i("text-align",t.align==="center"?"center":t.align==="right"?"right":"left")}let o=t.layout;if(o&&t.type==="frame"){i("display","flex"),i("flex-direction",o.direction==="horizontal"?"row":"column"),o.gap&&i("gap",`${V(o.gap)}px`);let c=o.padding;c&&i("padding",`${V(c.top??0)}px ${V(c.right??0)}px ${V(c.bottom??0)}px ${V(c.left??0)}px`)}return t.opacity!=null&&t.opacity<1&&i("opacity",String(t.opacity)),n.length?`/* ${t.type} \xB7 ${t.name??""} */
.${String(t.name||t.type).replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").toLowerCase()||"node"} {
${n.join(`
`)}
}`:"/* \u6682\u65E0\u53EF\u5BFC\u51FA\u7684 CSS \u5C5E\u6027 */"}function Mr({store:e,node:t}){let n=s=>e.setOverride(t.instanceId,t.sourceId,s),i=()=>e.mutate(s=>{let r=kn(s,t.instanceId);r?.overrides&&delete r.overrides[t.sourceId]}),a=(t.fills??[]).find(s=>s.type==="solid");return h.createElement("div",{className:"dshc-inspector"},h.createElement("div",{className:"dshc-inspector-head"},h.createElement(oe,{name:"component",size:14}),h.createElement("span",{className:"dshc-instance-title"},t.name),h.createElement("span",{className:"dshc-type-chip"},"\u8986\u76D6")),h.createElement(be,{title:"\u5B9E\u4F8B\u8986\u76D6"},h.createElement("div",{className:"dshc-help"},`\u5B9E\u4F8B ${t.instanceId} \xB7 \u6E90\u8282\u70B9 ${t.sourceId}`),t.type==="text"&&h.createElement("textarea",{className:"dshc-textarea",value:t.sourceNode.text??"",rows:3,onChange:s=>n({text:s.target.value})}),a&&h.createElement(G,{label:"\u586B\u5145\u989C\u8272",wide:!0},h.createElement(st,{value:a.color,onChange:s=>{let r=(t.fills??[]).map((l,o)=>o===0?{...l,color:s}:l);n({fills:r})}})),h.createElement(Ht,null,h.createElement("span",{className:"dshc-field-label"},"\u53EF\u89C1"),h.createElement(At,{value:t.visible!==!1,onChange:s=>n({visible:s})})),h.createElement("div",{className:"dshc-row"},h.createElement(O,{small:!0,icon:"reset",onClick:i},"\u91CD\u7F6E\u6B64\u8282\u70B9\u8986\u76D6"),h.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.exitInstance()},"\u9000\u51FA\u5B9E\u4F8B"),h.createElement(O,{small:!0,icon:"trash",onClick:()=>e.detachInstance(t.instanceId)},"\u5206\u79BB"))))}function Ze(e,t,n){let i=t.sourceNode.layout??{direction:"vertical",gap:0,padding:{top:0,right:0,bottom:0,left:0},alignPrimary:"start",alignCounter:"start"},a={...i,...n,padding:{...i.padding??{},...n.padding??{}}};e.updateNode(t.sourceId,{layout:a})}function V(e){return Math.round((Number(e)||0)*100)/100}function zr({fill:e,onChange:t,onRemove:n,onCrop:i,store:a,node:s,index:r}){let l=e.type,o=h.useRef(null);return h.createElement("div",{className:"dshc-fill-editor"},h.createElement("div",{className:"dshc-fill-row"},h.createElement(ue,{value:l,options:[{value:"solid",label:"\u7EAF\u8272"},{value:"linear-gradient",label:"\u7EBF\u6027\u6E10\u53D8"},{value:"radial-gradient",label:"\u5F84\u5411\u6E10\u53D8"},{value:"image",label:"\u56FE\u7247"}],onChange:c=>{t(c==="solid"?{type:"solid",color:"#D9D9D9",opacity:1}:c==="linear-gradient"?{type:"linear-gradient",angle:180,stops:[{position:0,color:"#4D6BFE"},{position:1,color:"#8B9DFF"}]}:c==="radial-gradient"?{type:"radial-gradient",center:{x:.5,y:.5},radius:.7,stops:[{position:0,color:"#FFFFFF"},{position:1,color:"#00000000"}]}:{type:"image",asset:e.asset??"assets/missing.png",fit:"cover"})}}),h.createElement(Y,{icon:"trash",title:"\u5220\u9664\u586B\u5145",size:13,onClick:n})),l==="solid"&&h.createElement("div",{className:"dshc-fill-row"},h.createElement(st,{value:e.color,onChange:c=>t({...e,color:c})}),h.createElement(ce,{value:V(e.opacity??1),min:0,max:1,step:.05,onChange:c=>t({...e,opacity:c})})),(l==="linear-gradient"||l==="radial-gradient")&&h.createElement(h.Fragment,null,l==="linear-gradient"?h.createElement(G,{label:"\u89D2\u5EA6"},h.createElement(ce,{value:V(e.angle??180),onChange:c=>t({...e,angle:c})})):null,(e.stops??[]).map((c,d)=>h.createElement("div",{key:d,className:"dshc-stop-row"},h.createElement(st,{value:c.color,onChange:u=>{let p=e.stops.slice();p[d]={...c,color:u},t({...e,stops:p})}}),h.createElement(ce,{value:V(c.position),min:0,max:1,step:.05,onChange:u=>{let p=e.stops.slice();p[d]={...c,position:u},t({...e,stops:p})}}),h.createElement(Y,{icon:"close",title:"\u5220\u9664\u505C\u6B62\u70B9",size:12,onClick:()=>{(e.stops??[]).length<=2||t({...e,stops:e.stops.filter((u,p)=>p!==d)})}}))),h.createElement(O,{small:!0,icon:"plus",onClick:()=>t({...e,stops:[...e.stops??[],{position:.5,color:"#FFFFFF"}]})},"\u6DFB\u52A0\u505C\u6B62\u70B9")),l==="image"&&h.createElement(h.Fragment,null,h.createElement("div",{className:"dshc-fill-row"},h.createElement("span",{className:"dshc-muted"},e.asset??"\u65E0\u56FE\u7247"),h.createElement(ue,{value:e.fit??"cover",options:[{value:"cover",label:"\u8986\u76D6"},{value:"contain",label:"\u5305\u542B"},{value:"fill",label:"\u62C9\u4F38"}],onChange:c=>t({...e,fit:c})}),h.createElement(O,{small:!0,onClick:i},"\u88C1\u526A")),h.createElement("div",{className:"dshc-fill-row"},h.createElement("input",{ref:o,type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",style:{display:"none"},onChange:c=>{let d=c.target.files?.[0];d&&a&&s&&a.uploadFillImage(s.sourceId,r,d),c.target.value=""}}),h.createElement(O,{small:!0,icon:"upload",onClick:()=>o.current?.click()},"\u4E0A\u4F20\u56FE\u7247\u586B\u5145"))))}function Ar({effect:e,onChange:t,onRemove:n}){return h.createElement("div",{className:"dshc-effect-editor"},h.createElement("div",{className:"dshc-fill-row"},h.createElement(ue,{value:e.type,options:[{value:"drop-shadow",label:"\u6295\u5F71"},{value:"inner-shadow",label:"\u5185\u9634\u5F71"},{value:"layer-blur",label:"\u56FE\u5C42\u6A21\u7CCA"},{value:"background-blur",label:"\u80CC\u666F\u6A21\u7CCA"}],onChange:i=>{t(i==="layer-blur"||i==="background-blur"?{type:i,radius:e.radius??6}:{type:i,x:e.x??0,y:e.y??8,blur:e.blur??24,spread:e.spread??0,color:e.color??"#00000040"})}}),h.createElement(Y,{icon:"trash",title:"\u5220\u9664\u6548\u679C",size:13,onClick:n})),e.type==="layer-blur"||e.type==="background-blur"?h.createElement(G,{label:"\u534A\u5F84"},h.createElement(ce,{value:V(e.radius??0),min:0,onChange:i=>t({...e,radius:i})})):h.createElement("div",{className:"dshc-grid-2"},h.createElement(G,{label:"X"},h.createElement(ce,{value:V(e.x??0),onChange:i=>t({...e,x:i})})),h.createElement(G,{label:"Y"},h.createElement(ce,{value:V(e.y??0),onChange:i=>t({...e,y:i})})),h.createElement(G,{label:"\u6A21\u7CCA"},h.createElement(ce,{value:V(e.blur??0),min:0,onChange:i=>t({...e,blur:i})})),h.createElement(G,{label:"\u6269\u6563"},h.createElement(ce,{value:V(e.spread??0),onChange:i=>t({...e,spread:i})})),h.createElement(G,{label:"\u989C\u8272",wide:!0},h.createElement(st,{value:e.color??"#00000040",onChange:i=>t({...e,color:i})}))))}function $n({store:e,node:t,type:n,label:i}){let a=(e.state.doc.styles??[]).filter(c=>c.type===n),s=n==="fill"?"fillStyleId":n==="text"?"textStyleId":"effectStyleId",r=t.sourceNode?.[s]??"",l=r?a.find(c=>c.id===r)??(e.state.doc.styles??[]).find(c=>c.id===r):null,o=[{value:"",label:r?"\u79FB\u9664\u6837\u5F0F":a.length?"\u5E94\u7528\u6837\u5F0F\u2026":"\u6682\u65E0\u6837\u5F0F"},...a.map(c=>({value:c.id,label:c.name}))];return r&&!o.some(c=>c.value===r)&&l&&o.push({value:r,label:l.name}),h.createElement(G,{label:i,wide:!0},h.createElement(ue,{value:r,disabled:!a.length&&!r,options:o,onChange:c=>{if(!c){e.updateNode(t.sourceId,{[s]:null});return}e.setSelection([t.key]),e.applyStyle(c)}}))}function Fr({store:e,node:t,doc:n}){let i=n.components.find(s=>s.id===t.sourceNode.componentId),a=i?.variantSetId?n.variantSets.find(s=>s.id===i.variantSetId):null;return h.createElement(be,{title:"\u5B9E\u4F8B"},h.createElement("div",{className:"dshc-stat-line"},`\u4E3B\u7EC4\u4EF6\uFF1A${i?.name??t.sourceNode.componentId}`),a&&a.properties.map(s=>h.createElement(G,{key:s.name,label:s.name,wide:!0},h.createElement(ue,{value:t.sourceNode.variantProps?.[s.name]??s.values[0],options:s.values.map(r=>({value:r,label:r})),onChange:r=>e.setVariant(t.sourceId,s.name,r)}))),h.createElement(G,{label:"\u6362\u7EC4\u4EF6",wide:!0},h.createElement(ue,{value:t.sourceNode.componentId,options:n.components.map(s=>({value:s.id,label:s.name})),onChange:s=>e.swapComponent(t.sourceId,s)})),h.createElement("div",{className:"dshc-row"},h.createElement(O,{small:!0,icon:"component",onClick:()=>i&&e.editComponent(i.id)},"\u7F16\u8F91\u4E3B\u7EC4\u4EF6"),h.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.enterInstance(t.key)},"\u8FDB\u5165\u5B9E\u4F8B"),h.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.detachInstance(t.sourceId)},"\u5206\u79BB")))}function Tr({store:e,node:t,doc:n}){let i=t.sourceNode.overrides??{},a=Object.keys(i).length;return h.createElement(be,{title:"\u5B9E\u4F8B\u8986\u76D6",right:a?`${a}`:null},a?h.createElement("div",null,Object.entries(i).map(([s,r])=>h.createElement("div",{key:s,className:"dshc-override-row"},h.createElement("span",{className:"dshc-muted"},s),h.createElement(O,{small:!0,onClick:()=>{e.mutate(l=>{let o=kn(l,t.sourceId);o?.overrides&&delete o.overrides[s]})}},"\u91CD\u7F6E")))):h.createElement("div",{className:"dshc-help"},"\u53CC\u51FB\u8FDB\u5165\u5B9E\u4F8B\uFF0C\u4FEE\u6539\u6587\u672C/\u586B\u5145/\u663E\u9690\u540E\u751F\u6210\u8986\u76D6\u3002"),h.createElement(O,{small:!0,icon:"reset",onClick:()=>e.mutate(s=>{let r=kn(s,t.sourceId);r&&(r.overrides={})})},"\u91CD\u7F6E\u5168\u90E8\u8986\u76D6"))}function kn(e,t){for(let n of e.pages??[]){let i=In(n.children,t);if(i)return i}for(let n of e.components??[]){if(n.root.id===t)return n.root;let i=In(n.root.children??[],t);if(i)return i}return null}function In(e,t){for(let n of e??[]){if(n.id===t)return n;let i=In(n.children,t);if(i)return i}return null}var b=Oe(require("react"),1);function ya({store:e}){let t=Ve(e.state.foundation?.device),n=[["\u9875\u9762",ut.filter(i=>i.category==="page")],["\u7CFB\u7EDF\u680F",ut.filter(i=>i.category!=="page")]];return b.createElement("div",{className:"dshc-panel"},b.createElement("div",{className:"dshc-panel-title"},"\u6A21\u677F",b.createElement("span",{className:"dshc-panel-count"},ut.length)),b.createElement("div",{className:"dshc-row dshc-template-device"},b.createElement("span",{className:"dshc-field-label"},"\u8BBE\u5907"),b.createElement(ue,{value:t.id,options:[{value:"iphone16",label:"iPhone 16 \xB7 393\xD7852"},{value:"iphone15",label:"iPhone 15 \xB7 390\xD7844"}],onChange:i=>e.setFoundation({device:i})})),n.map(([i,a])=>b.createElement("div",{key:i,className:"dshc-panel-group"},b.createElement("div",{className:"dshc-panel-subtitle"},i),b.createElement("div",{className:"dshc-template-list"},a.map(s=>b.createElement("div",{key:s.id,className:"dshc-template-row",title:s.description},b.createElement("div",{className:"dshc-template-info"},b.createElement("div",{className:"dshc-template-name"},s.name),b.createElement("div",{className:"dshc-template-meta"},`${s.system} \xB7 ${t.width}\xD7${s.category==="page"?t.height:s.height}`)),b.createElement(Y,{icon:"plus",title:`\u63D2\u5165${s.name}`,size:16,onClick:()=>e.insertTemplate(s.id)})))))))}function xa(e,t){let n=0,i=a=>{t(a)&&(n+=1);for(let s of a.children??[])i(s)};for(let a of e.state.doc?.pages??[])a.children.forEach(i);for(let a of e.state.doc?.components??[])i(a.root);return n}function ba({store:e,onNeedName:t}){let n=e.state.doc,[i,a]=b.useState([]);if(!n)return null;let s=n.components??[],r=n.variantSets??[],l=e.primaryNode(),o=l&&(l.type==="frame"||l.type==="group")&&l.editable;return b.createElement("div",{className:"dshc-panel"},b.createElement("div",{className:"dshc-panel-title"},"\u7EC4\u4EF6",b.createElement("span",{className:"dshc-panel-count"},s.length)),b.createElement("div",{className:"dshc-panel-actions"},b.createElement(O,{small:!0,icon:"component",disabled:!o,onClick:()=>t?.({title:"\u521B\u5EFA\u7EC4\u4EF6",label:"\u7EC4\u4EF6\u540D\u79F0",defaultValue:l?.name??"Component",onSubmit:c=>e.createComponentFromSelection(c)})},"\u4ECE\u9009\u533A\u521B\u5EFA"),b.createElement(O,{small:!0,icon:"layers",disabled:i.length<2,onClick:()=>e.createVariantSet(i)},"\u5408\u5E76\u4E3A\u53D8\u4F53")),r.length>0&&b.createElement("div",{className:"dshc-panel-group"},b.createElement("div",{className:"dshc-panel-subtitle"},"\u53D8\u4F53\u96C6"),r.map(c=>b.createElement("div",{key:c.id,className:"dshc-set-card"},b.createElement("div",{className:"dshc-set-name"},c.name),c.properties.map(d=>b.createElement("div",{key:d.name,className:"dshc-muted"},`${d.name}: ${d.values.join(" / ")}`)),b.createElement("div",{className:"dshc-set-variants"},c.componentIds.map(d=>{let u=s.find(p=>p.id===d);return u?b.createElement("button",{key:d,type:"button",className:"dshc-variant-chip",onClick:()=>e.insertInstance(d)},u.variantProps?.State??u.name):null}))))),b.createElement("div",{className:"dshc-panel-group"},b.createElement("div",{className:"dshc-panel-subtitle"},"\u7EC4\u4EF6"),s.length===0?b.createElement(Sn,{icon:"component",title:"\u8FD8\u6CA1\u6709\u7EC4\u4EF6",text:"\u9009\u4E2D\u4E00\u4E2A Frame\uFF0C\u70B9\u201C\u4ECE\u9009\u533A\u521B\u5EFA\u201D\u3002"}):s.map(c=>b.createElement("div",{key:c.id,className:"dshc-list-row"},b.createElement("input",{type:"checkbox",checked:i.includes(c.id),onChange:d=>a(d.target.checked?[...i,c.id]:i.filter(u=>u!==c.id))}),b.createElement(oe,{name:"component",size:13}),b.createElement("span",{className:"dshc-list-name"},c.name),b.createElement(Y,{icon:"plus",title:"\u63D2\u5165\u5B9E\u4F8B",size:13,onClick:()=>e.insertInstance(c.id)}),b.createElement(Y,{icon:"text",title:"\u7F16\u8F91\u4E3B\u7EC4\u4EF6",size:13,onClick:()=>e.editComponent(c.id)}),b.createElement(Y,{icon:"trash",title:"\u5220\u9664\u7EC4\u4EF6",size:13,danger:!0,onClick:()=>{let d=e.state.scene?xa(e,u=>u.type==="instance"&&u.sourceNode?.componentId===c.id):0;if(d){e.toast(`\u6709 ${d} \u4E2A\u5B9E\u4F8B\u5728\u4F7F\u7528\uFF0C\u65E0\u6CD5\u5220\u9664`);return}e.mutate(u=>{u.components=u.components.filter(p=>p.id!==c.id),u.variantSets=u.variantSets.filter(p=>!p.componentIds.includes(c.id))})}})))))}function wa({store:e,onNeedName:t}){let n=e.state.doc;if(!n)return null;let i=[["fill","\u586B\u5145"],["text","\u6587\u672C"],["effect","\u6548\u679C"]];return b.createElement("div",{className:"dshc-panel"},b.createElement("div",{className:"dshc-panel-title"},"\u6837\u5F0F\u5E93",b.createElement("span",{className:"dshc-panel-count"},n.styles?.length??0)),b.createElement("div",{className:"dshc-panel-group"},b.createElement("div",{className:"dshc-panel-subtitle"},"\u5185\u7F6E\u89C4\u8303"),b.createElement("div",{className:"dshc-panel-actions"},b.createElement(O,{small:!0,icon:"styles",title:"\u52A0\u8F7D Material 3 \u7684\u586B\u5145/\u6587\u672C/\u6548\u679C\u6837\u5F0F\u5230\u5F53\u524D\u6587\u6863",onClick:()=>e.loadDesignSystem("material3")},"Material 3"),b.createElement(O,{small:!0,icon:"styles",title:"\u52A0\u8F7D iOS HIG \u7684\u586B\u5145/\u6587\u672C/\u6548\u679C\u6837\u5F0F\u5230\u5F53\u524D\u6587\u6863",onClick:()=>e.loadDesignSystem("ios")},"iOS HIG")),b.createElement("div",{className:"dshc-help"},"\u52A0\u5165\u4E0B\u65B9\u6837\u5F0F\u5E93\uFF0C\u53EF\u5E94\u7528\u5230\u56FE\u5C42\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u4FEE\u6539\u73B0\u6709\u56FE\u5C42\u3002")),b.createElement("div",{className:"dshc-panel-actions"},b.createElement(O,{small:!0,icon:"plus",onClick:()=>t?.({title:"\u521B\u5EFA\u586B\u5145\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:"Brand/Primary",onSubmit:a=>e.createStyle("fill",a)})},"\u586B\u5145"),b.createElement(O,{small:!0,icon:"plus",onClick:()=>t?.({title:"\u521B\u5EFA\u6587\u672C\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:"Text/Body",onSubmit:a=>e.createStyle("text",a)})},"\u6587\u672C"),b.createElement(O,{small:!0,icon:"plus",onClick:()=>t?.({title:"\u521B\u5EFA\u6548\u679C\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:"Shadow/Card",onSubmit:a=>e.createStyle("effect",a)})},"\u6548\u679C")),i.map(([a,s])=>b.createElement("div",{key:a,className:"dshc-panel-group"},b.createElement("div",{className:"dshc-panel-subtitle"},s),(n.styles??[]).filter(r=>r.type===a).length===0?b.createElement("div",{className:"dshc-muted dshc-pad"},"\u6682\u65E0\u6837\u5F0F"):(n.styles??[]).filter(r=>r.type===a).map(r=>{let l=xa(e,o=>a==="fill"&&o.fillStyleId===r.id||a==="text"&&o.textStyleId===r.id||a==="effect"&&o.effectStyleId===r.id);return b.createElement("div",{key:r.id,className:"dshc-list-row"},b.createElement("span",{className:`dshc-style-dot dshc-style-${a}`}),b.createElement("span",{className:"dshc-list-name"},r.name),b.createElement("span",{className:"dshc-muted"},`${l}`),b.createElement(Y,{icon:"check",title:"\u5E94\u7528\u5230\u9009\u533A",size:13,onClick:()=>e.applyStyle(r.id)}),b.createElement(Y,{icon:"ungroup",title:"\u89E3\u7ED1\u5F15\u7528",size:13,onClick:()=>e.detachStyle(r.id)}),b.createElement(Y,{icon:"trash",title:"\u5220\u9664\u6837\u5F0F",size:13,danger:!0,onClick:()=>e.deleteStyle(r.id)}))}))))}function va({store:e,onNeedName:t}){let n=e.state.doc,[i,a]=b.useState(""),[s,r]=b.useState("400"),[l,o]=b.useState("normal"),[c,d]=b.useState(null),[u,p]=b.useState(!1),w=b.useRef(null);if(!n)return null;let v=async()=>{if(!c||!i.trim()){e.toast("\u9009\u62E9\u5B57\u4F53\u6587\u4EF6\u5E76\u586B\u5199\u5BB6\u65CF\u540D");return}p(!0),await e.uploadFontFile(c,i.trim(),Number(s),l),p(!1),a(""),d(null),w.current&&(w.current.value="")};return b.createElement("div",{className:"dshc-panel"},b.createElement("div",{className:"dshc-panel-title"},"\u5B57\u4F53",b.createElement("span",{className:"dshc-panel-count"},n.fonts?.length??0)),b.createElement("div",{className:"dshc-panel-group"},b.createElement("div",{className:"dshc-panel-subtitle"},"\u4E0A\u4F20\u5B57\u4F53"),b.createElement(G,{label:"\u5B57\u4F53\u6587\u4EF6",wide:!0},b.createElement("input",{ref:w,type:"file",accept:".woff2,.woff,.ttf,.otf",onChange:k=>{let A=k.target.files?.[0]??null;d(A),A&&!i&&a(A.name.replace(/\.[^.]+$/,"").replace(/[-_](Regular|Medium|SemiBold|Bold|Light|Italic)$/i,""))}})),b.createElement(G,{label:"\u5BB6\u65CF\u540D",wide:!0},b.createElement("input",{className:"dshc-text-input",value:i,onChange:k=>a(k.target.value)})),b.createElement("div",{className:"dshc-grid-2"},b.createElement(G,{label:"\u5B57\u91CD"},b.createElement(ue,{value:s,options:[100,200,300,400,500,600,700,800,900].map(k=>({value:String(k),label:String(k)})),onChange:r})),b.createElement(G,{label:"\u6837\u5F0F"},b.createElement(ue,{value:l,options:[{value:"normal",label:"\u5E38\u89C4"},{value:"italic",label:"\u659C\u4F53"}],onChange:o}))),b.createElement(O,{small:!0,primary:!0,icon:"upload",disabled:u||!c||!i.trim(),onClick:v},u?"\u4E0A\u4F20\u4E2D\u2026":"\u4E0A\u4F20\u5E76\u767B\u8BB0"),b.createElement("div",{className:"dshc-help"},"\u6587\u4EF6\u4FDD\u5B58\u5230 canvas/fonts/\uFF0C\u5BA2\u6237\u7AEF @font-face \u52A0\u8F7D\uFF1B\u4E0D\u505A\u670D\u52A1\u7AEF\u8F6C\u6362\u6216\u5B50\u96C6\u5316\u3002")),b.createElement("div",{className:"dshc-panel-group"},b.createElement("div",{className:"dshc-panel-subtitle"},"\u5DF2\u4E0A\u4F20"),(n.fonts??[]).length===0?b.createElement("div",{className:"dshc-muted dshc-pad"},"\u8FD8\u6CA1\u6709\u81EA\u5B9A\u4E49\u5B57\u4F53\uFF1B\u7CFB\u7EDF\u5B57\u4F53\u53EF\u76F4\u63A5\u4F7F\u7528\u3002"):(n.fonts??[]).map(k=>b.createElement("div",{key:k.id,className:"dshc-list-row"},b.createElement(oe,{name:"fonts",size:13}),b.createElement("span",{className:"dshc-list-name"},k.family),b.createElement("span",{className:"dshc-muted"},`${k.weight} ${k.style}`),b.createElement(Y,{icon:"trash",title:"\u5220\u9664\u5B57\u4F53",size:13,danger:!0,onClick:()=>e.removeFont(k.id)})))))}function Ra({store:e}){let t=e.state.doc,[n,i]=b.useState(!1),[a,s]=b.useState(""),[r,l]=b.useState(null);if(!t)return null;let o=(t.comments??[]).filter(c=>c.pageId===e.state.pageId&&(n||!c.resolved));return b.createElement("div",{className:"dshc-panel"},b.createElement("div",{className:"dshc-panel-title"},"\u8BC4\u8BBA",b.createElement("span",{className:"dshc-panel-count"},o.length)),b.createElement("div",{className:"dshc-panel-actions"},b.createElement(O,{small:!0,icon:"comment",onClick:()=>e.setTool("comment")},"\u6DFB\u52A0\u8BC4\u8BBA"),b.createElement(O,{small:!0,active:n,onClick:()=>i(!n)},"\u5DF2\u89E3\u51B3")),o.length===0?b.createElement(Sn,{icon:"comment",title:"\u6CA1\u6709\u8BC4\u8BBA",text:"\u7528\u8BC4\u8BBA\u5DE5\u5177\u70B9\u753B\u5E03\uFF0C\u6216\u9009\u4E2D\u5143\u7D20\u540E\u6DFB\u52A0\u3002"}):o.map(c=>b.createElement("div",{key:c.id,className:`dshc-comment-card ${c.resolved?"is-resolved":""}`},b.createElement("div",{className:"dshc-comment-card-head"},b.createElement("span",{className:"dshc-comment-author"},c.author==="ai"?"AI":"\u4F60"),b.createElement("span",{className:"dshc-muted"},c.nodeId?`@${c.nodeId}`:"\u9875\u9762"),c.resolved?b.createElement("span",{className:"dshc-muted"},"\u5DF2\u89E3\u51B3"):null),b.createElement("div",{className:"dshc-comment-card-body"},c.body),(c.replies??[]).map(d=>b.createElement("div",{key:d.id,className:"dshc-comment-card-reply"},b.createElement("b",null,d.author==="ai"?"AI":"\u4F60"),d.body)),r===c.id&&b.createElement("div",null,b.createElement("textarea",{className:"dshc-comment-input",rows:2,value:a,onChange:d=>s(d.target.value),placeholder:"\u56DE\u590D\u2026"}),b.createElement("div",{className:"dshc-row"},b.createElement(O,{small:!0,onClick:()=>{e.replyComment(c.id,a),s(""),l(null)}},"\u53D1\u9001"),b.createElement(O,{small:!0,onClick:()=>{l(null),s("")}},"\u53D6\u6D88"))),b.createElement("div",{className:"dshc-comment-card-actions"},b.createElement(O,{small:!0,onClick:()=>{if(c.nodeId){let d=e.findSceneNode(c.nodeId);d&&(e.setSelection([d.key]),e.zoomToSelection())}}},"\u5B9A\u4F4D"),b.createElement(O,{small:!0,onClick:()=>{l(r===c.id?null:c.id),s("")}},"\u56DE\u590D"),b.createElement(O,{small:!0,onClick:()=>e.resolveComment(c.id,!c.resolved)},c.resolved?"\u91CD\u5F00":"\u89E3\u51B3"),b.createElement(O,{small:!0,danger:!0,onClick:()=>e.deleteComment(c.id)},"\u5220\u9664")))))}var Nn=`/* dsh-canvas chrome. Host theme tokens only; the design content owns its colors. */

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
  --dshc-active: color-mix(in srgb, var(--dshc-accent) 14%, transparent);
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
  overflow-x: auto;
  scrollbar-width: none;
}

.dshc-topbar-tools::-webkit-scrollbar {
  display: none;
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
  animation: dshc-drawer-in-left 180ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* Drawer pulls: attached to the inner edge of a panel slot, so the open panel
   and the empty slot keep the same visible affordance. */
.dshc-drawer {
  position: absolute;
  top: 6px;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--dshc-line-strong);
  border-radius: 9px;
  background: var(--dshc-overlay);
  color: var(--dshc-muted);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.1);
  cursor: pointer;
  transition:
    left 180ms cubic-bezier(0.22, 0.61, 0.36, 1),
    right 180ms cubic-bezier(0.22, 0.61, 0.36, 1),
    color 120ms ease,
    background 120ms ease;
}

.dshc-drawer:hover {
  color: var(--dshc-accent);
  background: color-mix(in srgb, var(--dshc-accent) 8%, var(--dshc-overlay));
}

.dshc-drawer:focus-visible {
  outline: 2px solid var(--dshc-accent);
  outline-offset: 1px;
}

.dshc-drawer-left {
  left: min(var(--dshc-rail-w), calc(100% - 16px));
  border-left: none;
  border-radius: 0 9px 9px 0;
}

.dshc-drawer-left.is-open {
  left: min(calc(var(--dshc-rail-w) + var(--dshc-panel-w)), calc(100% - 16px));
}

.dshc-drawer-right {
  right: 0;
  border-right: none;
  border-radius: 9px 0 0 9px;
}

.dshc-drawer-right.is-open {
  right: min(var(--dshc-inspector-w), calc(100% - 16px));
}

@keyframes dshc-drawer-in-left {
  from {
    opacity: 0.4;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes dshc-drawer-in-right {
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
  .dshc-drawer {
    transition: none;
  }

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
  box-shadow: inset 2px 0 0 var(--dshc-accent);
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
  display: none;
  align-items: center;
  gap: 0;
}

.dshc-layer-row:hover .dshc-layer-actions,
.dshc-layer-row.is-selected .dshc-layer-actions {
  display: inline-flex;
}

.dshc-layer-name {
  font-size: 11.5px;
}

.dshc-layer-actions .dshc-icon-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
}

/* inspector */
.dshc-inspector {
  flex: none;
  width: var(--dshc-inspector-w);
  border-left: 1px solid var(--dshc-line);
  background: var(--dshc-raise);
  overflow: auto;
  z-index: 5;
  animation: dshc-drawer-in-right 180ms cubic-bezier(0.22, 0.61, 0.36, 1);
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

.dshc-world {
  will-change: transform;
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


`;var Dr=[["layers","layers","\u56FE\u5C42"],["components","component","\u7EC4\u4EF6"],["templates","template","\u6A21\u677F"],["styles","styles","\u6837\u5F0F"],["fonts","fonts","\u5B57\u4F53"],["comments","comment","\u8BC4\u8BBA"]],Lr={layers:"\u56FE\u5C42\u9762\u677F",components:"\u7EC4\u4EF6\u9762\u677F",templates:"\u6A21\u677F\u9762\u677F",styles:"\u6837\u5F0F\u9762\u677F",fonts:"\u5B57\u4F53\u9762\u677F",comments:"\u8BC4\u8BBA\u9762\u677F"},Bt=class extends M.Component{constructor(t){super(t),this.state={error:null}}static getDerivedStateFromError(t){return{error:t}}componentDidCatch(t,n){console.error("[dsh-canvas] panel crashed",t),De({phase:"panel-crash",message:String(t?.message??t),stack:String(t?.stack??""),componentStack:String(n?.componentStack??"")})}render(){return this.state.error?M.createElement("div",{className:"dshc-root dshc-crashed"},M.createElement("div",{className:"dshc-crash-title"},"\u753B\u5E03\u9762\u677F\u51FA\u9519\u4E86"),M.createElement("pre",{className:"dshc-crash-message"},String(this.state.error?.message??this.state.error)),M.createElement("button",{type:"button",className:"dshc-btn is-primary",onClick:()=>this.setState({error:null})},"\u91CD\u8BD5")):this.props.children}};function Cn({sessionId:e,inputActions:t}){let n=M.useRef(null);(!n.current||n.current.sessionId!==e)&&(n.current=new Ct({sessionId:e,inputActions:t}));let i=n.current;i.inputActions=t,M.useSyncExternalStore(i.subscribe,i.getVersion);let[a,s]=M.useState(null),[r,l]=M.useState(null),o=i.state;M.useEffect(()=>{De({phase:"panel-mount",sessionId:e,width:i.canvasSize?.width??null}),i.mount();let x=C=>{C&&(C.sessionId&&e&&C.sessionId!==e||i.focusNode(C).catch(q=>console.warn("[dsh-canvas] focus failed",q)))},P=vn(e);P&&x(P);let _=ta(C=>{C.sessionId&&e&&C.sessionId!==e||(vn(e),x(C))});return()=>{_(),De({phase:"panel-unmount",sessionId:e}),i.unmount()}},[i]),M.useEffect(()=>{if(!r)return;let x=_=>{_.type==="pointerdown"&&_.target?.closest?.(".dshc-context-menu")||l(null)},P=_=>{_.key==="Escape"&&(_.preventDefault(),_.stopPropagation(),l(null))};return window.addEventListener("pointerdown",x,!0),window.addEventListener("wheel",x,{capture:!0,passive:!0}),window.addEventListener("keydown",P,!0),()=>{window.removeEventListener("pointerdown",x,!0),window.removeEventListener("wheel",x,!0),window.removeEventListener("keydown",P,!0)}},[r]);let c=x=>s(x),d=(x,P)=>{i.state.selection.includes(P.key)||i.setSelection([P.key]),l({x:Math.min(Math.max(8,x.clientX),Math.max(8,(window.innerWidth??1200)-240)),y:Math.min(Math.max(8,x.clientY),Math.max(8,(window.innerHeight??800)-440)),node:P})},u=i.state.panel,p=M.useRef(u??"layers");u&&(p.current=u);let w=Lr[u??p.current]??"\u9762\u677F",v=()=>i.setPanel(u?null:p.current),k=()=>{o.inspectorOpen=!o.inspectorOpen,i.emit()},A=(o.doc?.comments??[]).filter(x=>!x.resolved&&x.pageId===o.pageId);if(o.loading||!o.ready)return M.createElement("div",{className:"dshc-root dshc-loading"},M.createElement("style",null,Nn),o.error?M.createElement(M.Fragment,null,M.createElement("div",{className:"dshc-crash-title"},"\u65E0\u6CD5\u6253\u5F00\u753B\u5E03"),M.createElement("pre",{className:"dshc-crash-message"},o.error),M.createElement("button",{type:"button",className:"dshc-btn is-primary",onClick:()=>i.bootstrap()},"\u91CD\u8BD5")):M.createElement(M.Fragment,null,M.createElement("div",{className:"dshc-spinner"}),M.createElement("div",{className:"dshc-muted"},"\u6B63\u5728\u6253\u5F00\u753B\u5E03\u2026")));let H=o.componentMode?o.doc.components.find(x=>x.id===o.componentMode.componentId):null;return M.createElement("div",{className:"dshc-root"},M.createElement("style",null,Nn),M.createElement(da,{store:i,onNewDoc:()=>c({title:"\u65B0\u5EFA\u753B\u5E03",label:"\u6587\u6863\u540D\uFF08\u5C0F\u5199 slug\uFF09",defaultValue:`canvas-${(o.docs?.length??0)+1}`,onSubmit:x=>i.createDoc(x)}),onNeedName:c,onRenameDoc:(x=i.state.name)=>c({title:"\u91CD\u547D\u540D\u753B\u5E03",label:"\u6587\u6863\u540D\uFF08\u5C0F\u5199 slug\uFF09",defaultValue:x,onSubmit:P=>i.renameDoc(P,x)}),onDeleteDoc:()=>{typeof window<"u"&&!window.confirm(`\u5220\u9664\u753B\u5E03\u300C${i.state.name}\u300D\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`)||i.deleteDoc()}}),H&&M.createElement("div",{className:"dshc-banner"},M.createElement(oe,{name:"component",size:14}),M.createElement("span",null,`\u6B63\u5728\u7F16\u8F91\u7EC4\u4EF6\uFF1A${H.name}`),M.createElement(O,{small:!0,onClick:()=>i.exitComponentMode()},"\u8FD4\u56DE\u753B\u5E03")),o.conflict&&M.createElement("div",{className:"dshc-conflict"},M.createElement("span",null,o.conflict.message??"\u753B\u5E03\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"),M.createElement(O,{small:!0,onClick:()=>i.resolveConflict(!0)},"\u52A0\u8F7D\u6700\u65B0"),M.createElement(O,{small:!0,onClick:()=>i.resolveConflict(!1)},"\u4FDD\u7559\u672C\u5730\u5E76\u8986\u76D6")),M.createElement("div",{className:"dshc-body"},M.createElement("div",{className:"dshc-rail"},Dr.map(([x,P,_])=>M.createElement("div",{key:x,className:"dshc-rail-item"},M.createElement(Y,{icon:P,title:_,size:22,active:u===x,onClick:()=>i.setPanel(u===x?null:x)}),x==="comments"&&A.length?M.createElement("span",{className:"dshc-badge"},A.length>9?"9+":A.length):null)),M.createElement("span",{className:"dshc-spacer"}),M.createElement(Y,{icon:"sliders",size:22,title:o.inspectorOpen?"\u6536\u8D77\u5C5E\u6027":"\u5C55\u5F00\u5C5E\u6027",active:o.inspectorOpen,onClick:k})),u&&M.createElement("div",{className:"dshc-panel-wrap"},u==="layers"&&M.createElement(pa,{store:i,onRename:x=>c({title:"\u91CD\u547D\u540D\u56FE\u5C42",label:"\u540D\u79F0",defaultValue:x.name,onSubmit:P=>i.renameNode(x.sourceId,P)}),onRowContextMenu:d}),u==="components"&&M.createElement(ba,{store:i,onNeedName:c}),u==="templates"&&M.createElement(ya,{store:i}),u==="styles"&&M.createElement(wa,{store:i,onNeedName:c}),u==="fonts"&&M.createElement(va,{store:i,onNeedName:c}),u==="comments"&&M.createElement(Ra,{store:i})),M.createElement("div",{className:"dshc-canvas-wrap"},M.createElement(la,{store:i})),o.inspectorOpen&&M.createElement(ga,{store:i,onNameDialog:c}),M.createElement("button",{type:"button",className:`dshc-drawer dshc-drawer-left${u?" is-open":""}`,title:u?`\u6536\u8D77${w}`:`\u5C55\u5F00${w}`,"aria-label":u?`\u6536\u8D77${w}`:`\u5C55\u5F00${w}`,"aria-expanded":!!u,onClick:v},M.createElement(oe,{name:"chevronRight",size:12,style:u?{transform:"rotate(180deg)"}:void 0})),M.createElement("button",{type:"button",className:`dshc-drawer dshc-drawer-right${o.inspectorOpen?" is-open":""}`,title:o.inspectorOpen?"\u6536\u8D77\u5C5E\u6027":"\u5C55\u5F00\u5C5E\u6027","aria-label":o.inspectorOpen?"\u6536\u8D77\u5C5E\u6027":"\u5C55\u5F00\u5C5E\u6027","aria-expanded":!!o.inspectorOpen,onClick:k},M.createElement(oe,{name:"chevronRight",size:12,style:o.inspectorOpen?void 0:{transform:"rotate(180deg)"}}))),M.createElement("div",{className:"dshc-statusbar"},M.createElement("span",{className:"dshc-status-selection"},o.selection.length?`\u5DF2\u9009 ${o.selection.length} \u4E2A \xB7 ${i.primaryNode()?.name??""}`:"\u672A\u9009\u62E9 \xB7 \u753B\u5E03"),M.createElement("span",{className:"dshc-spacer"}),o.sceneIssues?.length?M.createElement("span",{className:"dshc-status-warn",title:o.sceneIssues.join(`
`)},`${o.sceneIssues.length} \u4E2A\u8B66\u544A`):null,M.createElement("span",{className:"dshc-muted"},o.dirty?"\u672A\u4FDD\u5B58":o.saving?"\u4FDD\u5B58\u4E2D\u2026":"\u5DF2\u4FDD\u5B58"),M.createElement("span",{className:"dshc-muted"},`${Math.round(o.viewport.zoom*100)}%`),M.createElement(O,{small:!0,primary:o.selection.length>0,onClick:()=>i.insertSelectionToComposer(),disabled:!o.selection.length},"\u63D2\u5165\u5230\u5BF9\u8BDD"),M.createElement(O,{small:!0,icon:"sparkle",onClick:()=>i.insertPrompt()},"\u8BA9 AI \u751F\u6210")),o.notice&&M.createElement("div",{className:`dshc-toast ${o.notice.kind==="error"?"is-error":""}`},o.notice.text),r&&M.createElement(zt,{fixed:!0,x:r.x,y:r.y,items:[{label:"\u91CD\u547D\u540D",icon:"text",action:()=>{let x=r.node;x&&c({title:"\u91CD\u547D\u540D\u56FE\u5C42",label:"\u540D\u79F0",defaultValue:x.name,onSubmit:P=>i.renameNode(x.sourceId,P)})}},{label:"\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D",icon:"fit",action:()=>i.zoomToSelection()},{separator:!0},...Ft(i)],onClose:()=>l(null)}),a&&M.createElement(oa,{title:a.title,label:a.label,defaultValue:a.defaultValue,onCancel:()=>s(null),onSubmit:x=>{s(null),a.onSubmit?.(x)}}))}var Ea="@local/dsh-canvas",xt="dsh-canvas",Or={"tab.title":"\u753B\u5E03","guide.title":"\u753B\u5E03","guide.description":"Figma \u98CE\u683C\u65E0\u9650\u753B\u5E03\uFF1A\u53EF\u89C6\u5316\u8BBE\u8BA1 UI \u7A3F\uFF0C\u9009\u533A\u63D2\u5165\u5BF9\u8BDD\uFF0CAI \u53EF\u901A\u8FC7 canvas/*.canvas.json \u751F\u6210\u4E0E\u4FEE\u6539\u3002","dock.open":"\u6253\u5F00\u753B\u5E03","dock.close":"\u6536\u8D77\u753B\u5E03","composer.open":"\u6253\u5F00\u753B\u5E03"},Hr={"tab.title":"Canvas","guide.title":"Canvas","guide.description":"Figma-style infinite canvas: design UI mockups, send selections to the composer, and let the AI edit canvas/*.canvas.json.","dock.open":"Open canvas","dock.close":"Hide canvas","composer.open":"Open canvas"};function bt({size:e=18}){return K.createElement("svg",{viewBox:"0 0 24 24",width:e,height:e,fill:"none","aria-hidden":!0},K.createElement("path",{d:"M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z",stroke:"currentColor",strokeWidth:1.6}),K.createElement("path",{d:"M8.25 8.25h7.5v7.5h-7.5z",stroke:"currentColor",strokeWidth:1.4,strokeDasharray:"2.2 2.2"}),K.createElement("circle",{cx:8.25,cy:8.25,r:1.2,fill:"currentColor"}),K.createElement("circle",{cx:15.75,cy:8.25,r:1.2,fill:"currentColor"}),K.createElement("circle",{cx:8.25,cy:15.75,r:1.2,fill:"currentColor"}),K.createElement("circle",{cx:15.75,cy:15.75,r:1.2,fill:"currentColor"}))}function Br(e){return K.createElement(Bt,null,K.createElement(Cn,{sessionId:e.sessionId,inputActions:e.inputActions}))}function jr(e){let[t,n]=K.useState(!1);return K.createElement("div",{style:{border:"1px solid var(--dsw-alias-border-l1)",borderRadius:10,background:"var(--dsw-alias-bg-layer-1)",overflow:"hidden",margin:"4px 0"},"data-dsh-canvas":"dock"},K.createElement("button",{type:"button",onClick:()=>n(i=>!i),style:{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"7px 10px",border:"none",background:"transparent",color:"var(--dsw-alias-label-primary)",cursor:"pointer",font:"inherit"}},K.createElement(bt,{size:15}),K.createElement("span",{style:{fontWeight:600}},e.title??"\u753B\u5E03"),K.createElement("span",{style:{marginLeft:"auto",color:"var(--dsw-alias-label-secondary)",fontSize:11}},t?e.closeLabel:e.openLabel)),t&&K.createElement("div",{style:{height:"60vh",minHeight:320,borderTop:"1px solid var(--dsw-alias-border-l1)"}},K.createElement(Cn,{sessionId:e.sessionId,inputActions:e.inputActions})))}function Yr({node:e,raw:t,interactive:n,openCanvas:i}){let a=e?.data??{},s=()=>{!n||typeof i!="function"||i(a)};return K.createElement("span",{role:n?"button":void 0,tabIndex:n?0:void 0,title:t??a.label??"\u753B\u5E03",onClick:s,onKeyDown:r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),s())},style:{display:"inline-flex",alignItems:"center",gap:4,margin:"0 2px",padding:"1px 6px",borderRadius:5,border:"1px solid var(--dsw-alias-border-l1)",background:"color-mix(in srgb, #4D6BFE 10%, transparent)",color:"var(--dsw-alias-label-primary)",fontSize:"0.94em",lineHeight:1.5,verticalAlign:"baseline",cursor:n?"pointer":"default"}},K.createElement(bt,{size:13}),K.createElement("span",null,a.label??"\u753B\u5E03"))}function Wr(e,t){e.inject(["uiConversation"],n=>{n.effect(()=>n.uiConversation.userText.register(xi),"dsh-canvas: user text rule");try{n.effect(()=>n.slots.inject("conversation.user.text.node",()=>n.slots.register({name:"conversation.user.text.node",key:"dsh-canvas",priority:120,inject:i=>({openCanvas:a=>{try{t.openTab("canvas")}catch(s){console.warn("[dsh-canvas] openTab from reference failed",s)}wn({...a,sessionId:i})}})},Yr)),"dsh-canvas: user text chip")}catch(i){console.warn("[dsh-canvas] could not register the in-chat canvas link renderer",i),De({phase:"user-text-chip-failed",message:String(i?.message??i)})}})}function Vr({sessionId:e,nav:t}){let[n,i]=K.useState(()=>kt(e));return K.useEffect(()=>(i(kt(e)),vi(()=>i(kt(e)))),[e]),n?K.createElement("div",{style:{display:"inline-flex",alignSelf:"flex-start",marginLeft:16,alignItems:"center",gap:6,maxWidth:"100%",padding:"2px 8px",border:"1px solid color-mix(in srgb, #4D6BFE 16%, transparent)",borderRadius:999,background:"color-mix(in srgb, #4D6BFE 7%, transparent)",color:"var(--dsw-alias-label-primary)",font:"12px/1.5 var(--dsw-font-family, system-ui, sans-serif)"}},K.createElement("button",{type:"button",onClick:()=>{try{t.openTab("canvas")}catch(s){console.warn("[dsh-canvas] openTab from selection dock failed",s)}wn({...n,sessionId:e})},title:"\u6253\u5F00\u753B\u5E03\u5E76\u5B9A\u4F4D\u5230\u8BE5\u8282\u70B9",style:{display:"flex",alignItems:"center",gap:5,minWidth:0,padding:0,border:"none",background:"transparent",color:"#4D6BFE",cursor:"pointer",font:"inherit"}},K.createElement(bt,{size:14}),K.createElement("span",{style:{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},`\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D\uFF1A${n.label}`)),K.createElement("button",{type:"button",title:"\u5173\u95ED","aria-label":"\u5173\u95ED",onClick:()=>wi(e),style:{border:"none",background:"transparent",color:"var(--dsw-alias-label-secondary)",cursor:"pointer",font:"inherit"}},"\xD7")):null}function _r({nav:e,title:t}){return K.createElement("button",{type:"button",title:t,"aria-label":t,onClick:()=>{try{e.openTab("canvas"),De({phase:"open-tab",ok:!0})}catch(n){console.warn("[dsh-canvas] openTab failed",n),De({phase:"open-tab",ok:!1,message:String(n?.message??n)})}},style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,border:"none",borderRadius:6,background:"transparent",color:"var(--dsw-alias-label-secondary)",cursor:"pointer"}},K.createElement(bt,{size:16}))}var Xr="dsh-canvas",Gr=["slots","locale"];function Kr(e){De({phase:"client-apply",href:typeof location>"u"?null:location.href}),typeof window<"u"&&(window.addEventListener("error",r=>{De({phase:"window-error",message:String(r.message??""),stack:String(r.error?.stack??"")})}),window.addEventListener("unhandledrejection",r=>{De({phase:"unhandled-rejection",message:String(r.reason?.message??r.reason??"")})})),e.effect(()=>e.locale.register(xt,{zh:Or,en:Hr}),"dsh-canvas: locale");let t=e.locale.bind(xt),n=(r,l)=>{l.effect(()=>r.register({id:Ea,kind:"canvas",priority:"extension",title:()=>t("tab.title"),guide:[{id:"canvas",order:30,title:()=>t("guide.title"),description:()=>t("guide.description"),icon:bt}],keepMounted:!0}),"dsh-canvas: tab type"),l.effect(()=>l.slots.inject("sidebar.right.pane.tab",()=>l.slots.register({name:"sidebar.right.pane.tab",key:Ea,locale:xt},Br)),"dsh-canvas: tab body"),l.inject(["sidebarRight"],o=>{let c=o.sidebarRight;!c||typeof c.openTab!="function"||(Wr(o,c),o.effect(()=>o.slots.inject("conversation.input.right",()=>o.slots.register({name:"conversation.input.right",id:"dsh-canvas-open",order:23,label:()=>t("composer.open")},()=>K.createElement(_r,{nav:c,title:t("composer.open")}))),"dsh-canvas: composer button"),o.effect(()=>o.slots.inject("conversation.input.dock",()=>o.slots.register({name:"conversation.input.dock",id:"dsh-canvas-selection",order:55,locale:xt},d=>K.createElement(Vr,{sessionId:d.sessionId,nav:c}))),"dsh-canvas: selection dock"))})},i=()=>{let r=null;return e.effect(()=>(r=e.slots.inject("conversation.input.dock",()=>e.slots.register({name:"conversation.input.dock",id:"dsh-canvas-dock",order:45,locale:xt},l=>K.createElement(jr,{sessionId:l.sessionId,inputActions:l.inputActions,openLabel:t("dock.open"),closeLabel:t("dock.close"),title:t("tab.title")}))),()=>{r?.(),r=null}),"dsh-canvas: inline dock"),()=>{r?.(),r=null}},a=e.get("sidebarRightTabs");if(a&&typeof a.register=="function"){n(a,e);return}let s=i();e.inject(["sidebarRightTabs"],r=>{s();let l=r.sidebarRightTabs;!l||typeof l.register!="function"||n(l,r)})}

    return module.exports;
  },
});
