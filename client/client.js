/* @local/dsh-canvas v0.2.0 */
window.__ModuleLoader__.load({
  id: "@local/dsh-canvas",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
var Ya=Object.create;var $t=Object.defineProperty;var Xa=Object.getOwnPropertyDescriptor;var Va=Object.getOwnPropertyNames;var _a=Object.getPrototypeOf,Wa=Object.prototype.hasOwnProperty;var Ln=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(i){throw n=[i],i}};var Wt=(e,t)=>{for(var n in t)$t(e,n,{get:t[n],enumerable:!0})},Hn=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of Va(t))!Wa.call(e,a)&&a!==n&&$t(e,a,{get:()=>t[a],enumerable:!(i=Xa(t,a))||i.enumerable});return e};var Be=(e,t,n)=>(n=e!=null?Ya(_a(e)):{},Hn(t||!e||!e.__esModule?$t(n,"default",{value:e,enumerable:!0}):n,e)),Ga=e=>Hn($t({},"__esModule",{value:!0}),e);var ta={};Wt(ta,{buildSvg:()=>Er});function Ji(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ot(e){return Ji(e).replace(/'/g,"&#39;")}function qi(e){return!e||e.type!=="solid"?"none":e.color??"#000000"}function vr(e,t){if(e.type==="linear-gradient"){let i=(e.stops??[]).map(c=>`<stop offset="${c.position}" stop-color="${c.color}"/>`).join(""),a=(Number(e.angle)||0)*Math.PI/180,s=.5-Math.cos(a)/2,r=.5-Math.sin(a)/2,l=.5+Math.cos(a)/2,o=.5+Math.sin(a)/2;return`<linearGradient id="${t}" x1="${s}" y1="${r}" x2="${l}" y2="${o}">${i}</linearGradient>`}let n=(e.stops??[]).map(i=>`<stop offset="${i.position}" stop-color="${i.color}"/>`).join("");return`<radialGradient id="${t}" cx="${e.center?.x??.5}" cy="${e.center?.y??.5}" r="${e.radius??.7}">${n}</radialGradient>`}function Ki(e,t,n){if(!e)return"none";if(e.type==="solid")return qi(e);if(e.type==="linear-gradient"||e.type==="radial-gradient"){let i=`grad-${n}`;return t.push(vr(e,i)),`url(#${i})`}return"none"}function Ui(e){return e?` stroke="${e.color??"#000000"}" stroke-width="${e.width??1}"`:""}function Rr(e,t,n){let i=(e??[]).filter(l=>l.visible!==!1);if(!i.length)return"";let a=`fx-${n}`,s=[],r=0;for(let l of i)l.type==="layer-blur"&&(r+=Number(l.radius)||0),l.type==="drop-shadow"&&s.push(`<feDropShadow dx="${l.x??0}" dy="${l.y??0}" stdDeviation="${(Number(l.blur)||0)/2}" flood-color="${l.color??"#00000040"}"/>`);return r>0&&s.unshift(`<feGaussianBlur stdDeviation="${r/2}"/>`),s.length?(t.push(`<filter id="${a}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">${s.join("")}</filter>`),` filter="url(#${a})"`):""}function Zi(e){return`<rect ${e}/>`}function bn(e,t,n){if(!e||e.visible===!1)return"";let{defs:i,assets:a,keyPrefix:s,clip:r}=t,l=e.absX-(n?.x??0),o=e.absY-(n?.y??0),c=`translate(${l} ${o})${e.rotation?` rotate(${e.rotation} ${e.width/2} ${e.height/2})`:""}`,d=`${s}-${e.key}`,h=Rr(e.effects,i,d),p=e.opacity==null?1:e.opacity;if(e.type==="group")return`<g transform="${c}" opacity="${p}">${(e.children??[]).map(v=>bn(v,t,{x:e.absX,y:e.absY})).join("")}</g>`;let b=`clip-${d}`,x="";if(e.clip&&e.children?.length){let v=e.type==="ellipse"?Math.min(e.width,e.height)/2:e.cornerRadius??0;i.push(`<clipPath id="${b}"><rect width="${e.width}" height="${e.height}" rx="${v}" ry="${v}"/></clipPath>`),x=` clip-path="url(#${b})"`}let E=[],S=e.type==="ellipse"?Math.min(e.width,e.height)/2:e.cornerRadius??0;if(e.type==="path"){let v=[];for(let z of e.fills??[]){let G=Ki(z,i,`${d}-${v.length}`),Z=e.fillRule==="evenodd"?"evenodd":"nonzero";v.push(`<path d="${ot(e.d??"")}" fill="${G}" fill-rule="${Z}"/>`)}for(let z of e.strokes??[])v.push(`<path d="${ot(e.d??"")}" fill="none"${Ui(z)} stroke-linejoin="round"/>`);return`<g transform="${c}" opacity="${p}"${h}>${v.join("")}</g>`}if(e.type==="text"){let v=e.font??{},z=(v.size??14)*(v.lineHeight??1.4),G=e.lines??[],Z=qi(e.fills?.[0]),J=e.align??"left",se=J==="center"?"middle":J==="right"?"end":"start",A=J==="center"?e.width/2:J==="right"?e.width:0,V=G.length*z,ne=e.verticalAlign==="center"?(e.height-V)/2:e.verticalAlign==="bottom"?e.height-V:0,de=G.length?G.map((pe,F)=>`<text x="${A}" y="${ne+z*(F+.8)}" font-family="${ot(`'${v.family??"system-ui"}'`)}" font-size="${v.size??14}" font-weight="${v.weight??400}" font-style="${v.style??"normal"}" letter-spacing="${v.letterSpacing??0}" fill="${Z==="none"?"transparent":Z}" text-anchor="${se}" xml:space="preserve">${Ji(pe.text||" ")}</text>`).join(""):"";return E.push(`<g transform="${c}" opacity="${p}"${h}>${de}</g>`),E.join("")}let k=`x="0" y="0" width="${e.width}" height="${e.height}"`;for(let v of e.fills??[]){if(v.type==="image"){let G=a.get(v.asset);if(!G)continue;let Z=v.crop;if(Z){let J=`crop-${d}`;i.push(`<clipPath id="${J}"><rect width="${e.width}" height="${e.height}" rx="${S}" ry="${S}"/></clipPath>`),E.push(`<image href="${ot(G)}" x="${-Z.x*e.width/Z.width}" y="${-Z.y*e.height/Z.height}" width="${e.width/Z.width}" height="${e.height/Z.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${J})"/>`)}else E.push(`<image href="${ot(G)}" ${k} preserveAspectRatio="xMidYMid slice"${S?` rx="${S}"`:""}/>`);continue}let z=Ki(v,i,`${d}-${E.length}`);e.type==="ellipse"?E.push(`<ellipse cx="${e.width/2}" cy="${e.height/2}" rx="${e.width/2}" ry="${e.height/2}" fill="${z}"/>`):e.type==="line"?E.push(`<line x1="0" y1="0" x2="${e.width}" y2="0"${Ui(e.strokes?.[0])}/>`):E.push(Zi(`width="${e.width}" height="${e.height}" rx="${S}" ry="${S}" fill="${z}"`))}if(e.type==="line"){let v=e.strokes?.[0];E.push(`<line x1="0" y1="0" x2="${e.width}" y2="0" stroke="${v?.color??"#111111"}" stroke-width="${v?.width??1}"/>`)}if((e.strokes??[]).length&&e.type!=="line")for(let v of e.strokes){let z=v.color??"#000000";e.type==="ellipse"?E.push(`<ellipse cx="${e.width/2}" cy="${e.height/2}" rx="${Math.max(0,e.width/2-(v.width??1)/2)}" ry="${Math.max(0,e.height/2-(v.width??1)/2)}" fill="none" stroke="${z}" stroke-width="${v.width??1}"/>`):E.push(Zi(`width="${e.width}" height="${e.height}" rx="${S}" ry="${S}" fill="none" stroke="${z}" stroke-width="${v.width??1}"`))}if((e.children??[]).length){let v=e.children.map(z=>bn(z,t,{x:e.absX,y:e.absY})).join("");E.push(`<g${x}>${v}</g>`)}return`<g transform="${c}" opacity="${p}"${h} data-node="${ot(e.key)}">${E.join("")}</g>`}function Qi(e,t){for(let n of e.fills??[])n.type==="image"&&n.asset&&t.add(n.asset);for(let n of e.children??[])Qi(n,t)}function ea(e,t){e.type==="text"&&e.font?.family&&t.add(`${e.font.family}::${e.font.weight??400}::${e.font.style??"normal"}`);for(let n of e.children??[])ea(n,t)}async function Er(e,t={}){let n=(e?.roots??[]).filter(v=>t.nodeKeys?t.nodeKeys.includes(v.key):!0),i=t.nodeKeys?.length&&e?.byKey?t.nodeKeys.map(v=>e.byKey.get(v)).filter(Boolean):n,a=i.length?i:n,s=new Map,r=new Set,l=new Set;for(let v of a)Qi(v,r),ea(v,l);if(t.resolveAsset)for(let v of r)try{s.set(v,await t.resolveAsset(v))}catch{}let o=[],c=[];for(let v of l){let[z,G,Z]=v.split("::"),J=(t.fonts??[]).find(se=>se.family===z&&String(se.weight)===G&&(se.style??"normal")===Z);if(!(!J||!t.resolveFont))try{let se=await t.resolveFont(J),A=J.asset.split(".").pop().toLowerCase();c.push(`@font-face{font-family:'${z.replace(/'/g,"\\'")}';src:url('${se}') format('${wr[A]??"truetype"}');font-weight:${G};font-style:${Z};}`)}catch{}}let d=Math.min(...a.map(v=>v.absX)),h=Math.min(...a.map(v=>v.absY)),p=Math.max(...a.map(v=>v.absX+v.width)),b=Math.max(...a.map(v=>v.absY+v.height)),x=Math.max(1,p-d),E=Math.max(1,b-h),S={defs:o,assets:s,keyPrefix:"n",clip:!0},k=a.map(v=>{let z={...v,absX:v.absX-d,absY:v.absY-h};return bn(z,S,{x:0,y:0})}).join("");return`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${x}" height="${E}" viewBox="0 0 ${x} ${E}">
<defs>${o.join("")}</defs>
${c.length?`<style>${c.join("")}</style>`:""}
${t.background?`<rect width="${x}" height="${E}" fill="${t.background}"/>`:""}
${k}
</svg>`}var wr,na=Ln(()=>{wr={woff2:"woff2",woff:"woff",ttf:"truetype",otf:"opentype"}});var ia={};Wt(ia,{svgToPng:()=>$r});function $r(e,t=2){return new Promise((n,i)=>{let a=new Blob([e],{type:"image/svg+xml;charset=utf-8"}),s=URL.createObjectURL(a),r=new Image;r.onload=()=>{try{let l=Math.max(1,Math.round((r.naturalWidth||1)*t)),o=Math.max(1,Math.round((r.naturalHeight||1)*t));if(l*o>64e6)throw new Error("\u5BFC\u51FA\u5C3A\u5BF8\u8FC7\u5927");let c=document.createElement("canvas");c.width=l,c.height=o;let d=c.getContext("2d");d.scale(t,t),d.drawImage(r,0,0),n(c.toDataURL("image/png"))}catch(l){i(l)}finally{URL.revokeObjectURL(s)}},r.onerror=()=>{URL.revokeObjectURL(s),i(new Error("SVG \u6805\u683C\u5316\u5931\u8D25"))},r.src=s})}var aa=Ln(()=>{});var ho={};Wt(ho,{apply:()=>lo,inject:()=>co,name:()=>oo});module.exports=Ga(ho);var q=Be(require("react"),1);var D=Be(require("react"),1);var xe=class extends Error{constructor(t){super(t),this.name="PathDataError"}};var Ka=/[MmZzLlHhVvCcSsQqTtAa]/,Ua=/^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/,Za=/^[MmZzLlHhVvCcSsQqTtAa0-9eE+.,\-\s]*$/,Ja={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};function qa(e){if(!Za.test(e))throw new xe("path data contains unsupported characters");let t=[],n=0;for(;n<e.length;){let i=e[n];if(i===" "||i===`
`||i==="\r"||i==="	"||i===","){n+=1;continue}if(Ka.test(i)){t.push({command:i}),n+=1;continue}let a=e.slice(n),s=Ua.exec(a);if(!s)throw new xe(`invalid path data near "${a.slice(0,12)}"`);let r=Number(s[0]);if(!Number.isFinite(r))throw new xe("path data contains a non-finite number");t.push({value:r}),n+=s[0].length}return t}function et(e){if(typeof e!="string"||e.trim()==="")throw new xe("path d must be a non-empty string");if(e.length>1e5)throw new xe("path d exceeds 100000 characters");let t=qa(e);if(!t.length)throw new xe("path d is empty");let n=0,i="",a=0,s=0,r=0,l=0,o=null,c=null,d=1/0,h=1/0,p=-1/0,b=-1/0,x=0,E=(k,v)=>{d=Math.min(d,k),h=Math.min(h,v),p=Math.max(p,k),b=Math.max(b,v)};E(0,0);let S=()=>{let k=t[n];if(!k||k.value===void 0)throw new xe(`path command ${i} is missing parameters`);return n+=1,k.value};for(;n<t.length;){let k=t[n];if(k.command)i=k.command,n+=1;else if(!i)throw new xe("path data must begin with a command");let v=i.toUpperCase(),z=i!==v,G=Ja[v];if(G===void 0)throw new xe(`unsupported path command ${i}`);if(G===0){a=r,s=l,o=null,c=null,x+=1;continue}if(t[n]?.command)throw new xe(`path command ${i} is missing parameters`);x+=1;let Z=S(),J=z?a+Z:Z;if(v==="H"){a=J,E(a,s),o=null,c=null;continue}if(v==="V"){s=z?s+Z:Z,E(a,s),o=null,c=null;continue}let se=z?s+S():S();switch(v){case"M":a=J,s=se,r=J,l=se,E(J,se),o=null,c=null,i=z?"l":"L";break;case"L":a=J,s=se,E(J,se),o=null,c=null;break;case"C":{let A=J,V=se,ne=z?a+S():S(),de=z?s+S():S(),pe=z?a+S():S(),F=z?s+S():S();E(A,V),E(ne,de),E(pe,F),a=pe,s=F,o=ne,c=de;break}case"S":{let A=J,V=se,ne=z?a+S():S(),de=z?s+S():S();E(A,V),E(ne,de),a=ne,s=de,o=A,c=V;break}case"Q":{let A=J,V=se,ne=z?a+S():S(),de=z?s+S():S();E(A,V),E(ne,de),a=ne,s=de,o=A,c=V;break}case"T":{let A=J,V=se;E(A,V),a=A,s=V,o=A,c=V;break}case"A":{let A=J,V=se,ne=S(),de=S(),pe=S(),F=z?a+S():S(),Y=z?s+S():S();if(A<0||V<0)throw new xe("path arc radius must be non-negative");if(de!==0&&de!==1)throw new xe("path arc large-arc flag must be 0 or 1");if(pe!==0&&pe!==1)throw new xe("path arc sweep flag must be 0 or 1");E(F,Y),a=F,s=Y,o=null,c=null;break}default:throw new xe(`unsupported path command ${i}`)}}if(x===0)throw new xe("path d has no commands");if(!Number.isFinite(d))throw new xe("path d has no finite bounds");return{bounds:{minX:d,minY:h,maxX:p,maxY:b},commands:x}}var Xn="dsh.canvas",Vn=1,Pe={nodes:2e3,components:200,styles:500,comments:1e3,fonts:50,depth:32,textLength:1e4,docBytes:8*1024*1024,imageBytes:20*1024*1024,fontBytes:10*1024*1024},Qa=["frame","group","rect","ellipse","line","text","path","instance"],es=["solid","linear-gradient","radial-gradient","image"],ts=["drop-shadow","inner-shadow","layer-blur","background-blur"],ns=["fill","text","effect"],is=["left","center","right","justify"],as=["top","center","bottom"],ss=["horizontal","vertical"],rs=["start","center","end","space-between"],os=["start","center","end","stretch"],On=["fixed","hug","fill"],cs=["cover","contain","fill"],ls=["nonzero","evenodd"],_n=["normal","italic"],Bn=["user","ai"],ds=/^[A-Za-z0-9_-]{1,64}$/;var hs=/^assets\/[A-Za-z0-9._-]{1,120}$/,us=/^fonts\/[A-Za-z0-9._-]{1,120}$/,ps=/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,M=class extends Error{constructor(t,n,i="invalid-document"){super(`${t}: ${n}`),this.name="CanvasError",this.path=t,this.code=i}};function he(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function ms(e){if(typeof structuredClone=="function")try{return structuredClone(e)}catch{}return JSON.parse(JSON.stringify(e))}function ie(e,t,n={}){let{min:i=-1e6,max:a=1e6,int:s=!1}=n;if(typeof e!="number"||!Number.isFinite(e))throw new M(t,"expected a finite number");if(s&&Math.round(e)!==e)throw new M(t,"expected an integer");if(e<i||e>a)throw new M(t,`expected a number in [${i}, ${a}]`);return e}function Fe(e,t){return ie(e,t,{min:0,max:1,int:!1})}function pt(e,t){if(typeof e!="string"||!ps.test(e))throw new M(t,"expected a color like #RRGGBB or #RRGGBBAA");return e.toUpperCase()}function ve(e,t){if(typeof e!="string"||!ds.test(e))throw new M(t,"expected an id matching ^[A-Za-z0-9_-]{1,64}$");return e}function Re(e,t,n){if(typeof e!="string"||!n.includes(e))throw new M(t,`expected one of ${n.map(i=>JSON.stringify(i)).join(", ")}`);return e}var Gt=0;function le(e="n"){Gt=(Gt+1)%16777215;let t=Math.floor(Math.random()*16777215).toString(36);return`${e}_${Date.now().toString(36)}${Gt.toString(36)}${t}`.slice(0,64)}function fs(e){return typeof e=="string"&&hs.test(e)&&!e.includes("..")}function gs(e){return typeof e=="string"&&us.test(e)&&!e.includes("..")}var Ue=()=>new Date().toISOString();function Wn(e="\u4E3B\u753B\u5E03",t=le("doc")){return{format:Xn,version:Vn,id:t,title:e,pages:[{id:le("page"),name:"Page 1",background:null,children:[]}],components:[],variantSets:[],styles:[],fonts:[],comments:[],meta:{createdAt:Ue(),updatedAt:Ue()}}}function Ut(e,t){if(!he(e))throw new M(t,"expected an object");let n=Re(e.type,`${t}.type`,es),i={...e,type:n};if(n==="solid")return i.color=pt(e.color,`${t}.color`),i.opacity=e.opacity==null?1:Fe(e.opacity,`${t}.opacity`),i;if(n==="linear-gradient")return i.angle=e.angle==null?180:ie(e.angle,`${t}.angle`,{min:-3600,max:3600}),i.stops=jn(e.stops,`${t}.stops`),i;if(n==="radial-gradient")return i.center={x:e.center?.x==null?.5:Fe(e.center.x,`${t}.center.x`),y:e.center?.y==null?.5:Fe(e.center.y,`${t}.center.y`)},i.radius=e.radius==null?.7:Fe(e.radius,`${t}.radius`),i.stops=jn(e.stops,`${t}.stops`),i;if(!fs(e.asset))throw new M(`${t}.asset`,"expected assets/<file>");if(i.asset=e.asset,i.fit=e.fit==null?"cover":Re(e.fit,`${t}.fit`,cs),e.crop!=null){if(!he(e.crop))throw new M(`${t}.crop`,"expected an object");let a={x:Fe(e.crop.x??0,`${t}.crop.x`),y:Fe(e.crop.y??0,`${t}.crop.y`),width:Fe(e.crop.width??1,`${t}.crop.width`),height:Fe(e.crop.height??1,`${t}.crop.height`)};if(a.width<=0||a.height<=0)throw new M(`${t}.crop`,"crop size must be positive");if(a.x+a.width>1.000001||a.y+a.height>1.000001)throw new M(`${t}.crop`,"crop must stay inside the image");i.crop=a}return i}function jn(e,t){if(!Array.isArray(e)||e.length<2||e.length>32)throw new M(t,"expected 2-32 gradient stops");return e.map((n,i)=>{if(!he(n))throw new M(`${t}[${i}]`,"expected an object");return{position:Fe(n.position,`${t}[${i}].position`),color:pt(n.color,`${t}[${i}].color`)}})}function ys(e,t){if(!he(e))throw new M(t,"expected an object");let n=Re(e.type,`${t}.type`,ts),i={...e,type:n,visible:e.visible!==!1};return n==="layer-blur"||n==="background-blur"?(i.radius=ie(e.radius??4,`${t}.radius`,{min:0,max:200}),i):(i.x=ie(e.x??0,`${t}.x`,{min:-1e3,max:1e3}),i.y=ie(e.y??0,`${t}.y`,{min:-1e3,max:1e3}),i.blur=ie(e.blur??0,`${t}.blur`,{min:0,max:500}),i.spread=ie(e.spread??0,`${t}.spread`,{min:-500,max:500}),i.color=pt(e.color??"#00000040",`${t}.color`),i)}function Yn(e,t){if(typeof e!="string"||!e.trim()||e.length>64)throw new M(t,"expected a non-empty label of at most 64 characters");return e.trim()}function Kt(e,t){if(e==null)return[];if(!Array.isArray(e)||e.length>8)throw new M(t,"expected at most 8 strokes");return e.map((n,i)=>{if(!he(n))throw new M(`${t}[${i}]`,"expected an object");return{...n,color:pt(n.color??"#000000",`${t}[${i}].color`),width:ie(n.width??1,`${t}[${i}].width`,{min:0,max:200}),align:n.align==null?"center":Re(n.align,`${t}[${i}].align`,["center","inside","outside"])}})}function xs(e,t){if(e!=null){if(!he(e))throw new M(t,"expected an object");return{h:Re(e.h??"fixed",`${t}.h`,On),v:Re(e.v??"fixed",`${t}.v`,On)}}}function bs(e,t){if(e==null)return;if(!he(e))throw new M(t,"expected an object");let n=e.padding??{};return{...e,direction:Re(e.direction??"vertical",`${t}.direction`,ss),gap:ie(e.gap??0,`${t}.gap`,{min:0,max:1e4}),padding:{top:ie(n.top??0,`${t}.padding.top`,{min:0,max:1e4}),right:ie(n.right??0,`${t}.padding.right`,{min:0,max:1e4}),bottom:ie(n.bottom??0,`${t}.padding.bottom`,{min:0,max:1e4}),left:ie(n.left??0,`${t}.padding.left`,{min:0,max:1e4})},alignPrimary:Re(e.alignPrimary??"start",`${t}.alignPrimary`,rs),alignCounter:Re(e.alignCounter??"start",`${t}.alignCounter`,os)}}function Gn(e,t){let n=he(e)?e:{};return{...n,family:typeof n.family=="string"&&n.family.trim()?n.family.trim().slice(0,120):"system-ui",weight:Math.round(ie(n.weight??400,`${t}.weight`,{min:100,max:900})/100)*100,style:Re(n.style??"normal",`${t}.style`,_n),size:ie(n.size??14,`${t}.size`,{min:1,max:1e3}),lineHeight:ie(n.lineHeight??1.4,`${t}.lineHeight`,{min:.5,max:10}),letterSpacing:ie(n.letterSpacing??0,`${t}.letterSpacing`,{min:-50,max:200})}}function ws(e,t){if(!he(e))throw new M(t,"expected an object");let n={...e};if("text"in n&&(typeof n.text!="string"||n.text.length>Pe.textLength))throw new M(`${t}.text`,"expected a short string");if("visible"in n&&typeof n.visible!="boolean")throw new M(`${t}.visible`,"expected a boolean");if("fills"in n){if(!Array.isArray(n.fills)||n.fills.length>8)throw new M(`${t}.fills`,"expected an array");n.fills=n.fills.map((i,a)=>Ut(i,`${t}.fills[${a}]`))}return n}function Zt(e,t,n,i){if(n>Pe.depth)throw new M(t,`node nesting exceeds ${Pe.depth}`);if(!he(e))throw new M(t,"expected a node object");if(i.count+=1,i.count>Pe.nodes)throw new M(t,`document exceeds ${Pe.nodes} nodes`);let a=Re(e.type,`${t}.type`,Qa),s={...e,type:a};if(s.id=ve(e.id,`${t}.id`),i.ids.has(s.id))throw new M(`${t}.id`,`duplicate id "${s.id}"`);if(i.ids.add(s.id),s.name=typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):vs(a),s.x=ie(e.x??0,`${t}.x`),s.y=ie(e.y??0,`${t}.y`),s.width=ie(e.width??Rs(a),`${t}.width`,{min:0,max:1e6}),s.height=ie(e.height??Es(a),`${t}.height`,{min:0,max:1e6}),s.rotation=ie(e.rotation??0,`${t}.rotation`,{min:-36e3,max:36e3}),s.opacity=Fe(e.opacity??1,`${t}.opacity`),s.visible=e.visible!==!1,s.locked=e.locked===!0,s.layoutSizing=xs(e.layoutSizing,`${t}.layoutSizing`),a==="frame"||a==="group"){if(s.children=[],Array.isArray(e.children))for(let r=0;r<e.children.length;r+=1)s.children.push(Zt(e.children[r],`${t}.children[${r}]`,n+1,i))}else s.children=void 0;if((a==="frame"||a==="rect"||a==="ellipse")&&(s.fills=ut(e.fills,`${t}.fills`),!s.fills.length&&e.fills==null&&e.fillStyleId==null&&(s.fills=[{type:"solid",color:a==="frame"?"#FFFFFF":"#D9D9D9"}]),s.strokes=Kt(e.strokes,`${t}.strokes`),s.effects=St(e.effects,`${t}.effects`),s.cornerRadius=ie(e.cornerRadius??0,`${t}.cornerRadius`,{min:0,max:1e6})),a==="instance"&&(s.fills=void 0,s.strokes=void 0,s.effects=void 0,s.cornerRadius=e.cornerRadius==null?void 0:ie(e.cornerRadius,`${t}.cornerRadius`,{min:0,max:1e6})),(a==="group"||a==="line")&&(s.fills=void 0,s.strokes=void 0,s.effects=void 0,s.cornerRadius=void 0),a==="line"&&(s.strokes=Kt(e.strokes,`${t}.strokes`),s.strokes.length||(s.strokes=[{color:"#111111",width:1,align:"center"}]),s.fills=void 0,s.effects=void 0,s.height=0),a==="text"&&(s.text=typeof e.text=="string"?e.text.slice(0,Pe.textLength):"",s.font=Gn(e.font,`${t}.font`),s.align=Re(e.align??"left",`${t}.align`,is),s.verticalAlign=Re(e.verticalAlign??"top",`${t}.verticalAlign`,as),s.fills=ut(e.fills,`${t}.fills`),!s.fills.length&&e.fills==null&&e.fillStyleId==null&&(s.fills=[{type:"solid",color:"#111111"}]),s.effects=St(e.effects,`${t}.effects`),s.autoHeight=e.autoHeight!==!1),a==="path"){s.d=$s(e.d,t);let r=et(s.d);if(s.viewBox=Ss(e.viewBox,r.bounds,`${t}.viewBox`),s.fillRule=Re(e.fillRule??"nonzero",`${t}.fillRule`,ls),s.fills=ut(e.fills,`${t}.fills`),s.strokes=Kt(e.strokes,`${t}.strokes`),s.effects=St(e.effects,`${t}.effects`),s.cornerRadius=void 0,s.fills.some(l=>l.type==="image"))throw new M(`${t}.fills`,"path nodes do not support image fills")}if(a==="frame"&&(s.clip=e.clip!==!1,s.layout=bs(e.layout,`${t}.layout`),e.backgroundColor!=null&&(s.fills=ut(e.fills??[{type:"solid",color:e.backgroundColor}],`${t}.fills`))),a==="instance"&&(s.componentId=ve(e.componentId,`${t}.componentId`),s.variantProps=Kn(e.variantProps,`${t}.variantProps`),s.overrides={},e.overrides!=null)){if(!he(e.overrides))throw new M(`${t}.overrides`,"expected an object");for(let[r,l]of Object.entries(e.overrides))s.overrides[ve(r,`${t}.overrides key`)]=ws(l,`${t}.overrides.${r}`)}return e.fillStyleId!=null&&(s.fillStyleId=ve(e.fillStyleId,`${t}.fillStyleId`)),e.textStyleId!=null&&(s.textStyleId=ve(e.textStyleId,`${t}.textStyleId`)),e.effectStyleId!=null&&(s.effectStyleId=ve(e.effectStyleId,`${t}.effectStyleId`)),s}function ut(e,t){if(e==null)return[];if(!Array.isArray(e)||e.length>8)throw new M(t,"expected at most 8 fills");return e.map((n,i)=>Ut(n,`${t}[${i}]`))}function St(e,t){if(e==null)return[];if(!Array.isArray(e)||e.length>8)throw new M(t,"expected at most 8 effects");return e.map((n,i)=>ys(n,`${t}[${i}]`))}function Kn(e,t){if(e==null)return{};if(!he(e))throw new M(t,"expected an object");let n={};for(let[i,a]of Object.entries(e)){if(typeof a!="string"||a.length>120)throw new M(`${t}.${i}`,"expected a short string");n[i]=a}return n}function vs(e){return{frame:"Frame",group:"Group",rect:"Rectangle",ellipse:"Ellipse",line:"Line",text:"Text",path:"Path",instance:"Instance"}[e]??"Node"}function Rs(e){return e==="line"?100:e==="text"?160:e==="path"?120:e==="frame"?375:120}function Es(e){return e==="line"?0:e==="text"?24:e==="path"?120:e==="frame"?667:120}function $s(e,t){if(typeof e!="string"||!e.trim())throw new M(`${t}.d`,"expected a non-empty SVG path string");if(e.length>1e5)throw new M(`${t}.d`,"path d exceeds 100000 characters");try{et(e)}catch(n){throw new M(`${t}.d`,n instanceof Error?n.message:"invalid path data")}return e}function Ss(e,t,n){let i={x:Number.isFinite(t?.minX)?t.minX:0,y:Number.isFinite(t?.minY)?t.minY:0,width:Number.isFinite(t?.maxX-t?.minX)&&t.maxX>t.minX?t.maxX-t.minX:1,height:Number.isFinite(t?.maxY-t?.minY)&&t.maxY>t.minY?t.maxY-t.minY:1};if(e==null)return i;if(!he(e))throw new M(n,"expected a viewBox object");return{x:ie(e.x??i.x,`${n}.x`),y:ie(e.y??i.y,`${n}.y`),width:ie(e.width??i.width,`${n}.width`,{min:1e-4,max:1e6}),height:ie(e.height??i.height,`${n}.height`,{min:1e-4,max:1e6})}}function ks(e,t){if(!he(e))throw new M(t,"expected a style object");let n={...e};return n.id=ve(e.id,`${t}.id`),n.type=Re(e.type,`${t}.type`,ns),n.name=typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):n.type,n.type==="fill"?n.value=Ut(e.value,`${t}.value`):n.type==="text"?n.value={font:Gn(e.value?.font,`${t}.value.font`),fills:ut(e.value?.fills,`${t}.value.fills`)}:n.value=St(e.value,`${t}.value`),n}function Is(e,t,n){if(!he(e))throw new M(t,"expected a component object");let i={...e};return i.id=ve(e.id,`${t}.id`),i.name=typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):"Component",i.root=Zt(e.root,`${t}.root`,1,n),i.root.x=0,i.root.y=0,e.variantSetId!=null&&(i.variantSetId=ve(e.variantSetId,`${t}.variantSetId`)),i.variantProps=Kn(e.variantProps,`${t}.variantProps`),i}function Ns(e,t){if(!he(e))throw new M(t,"expected a variant set object");if(!Array.isArray(e.properties)||e.properties.length===0)throw new M(`${t}.properties`,"expected at least one variant property");return{...e,id:ve(e.id,`${t}.id`),name:typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,120):"Variant set",properties:e.properties.map((n,i)=>({name:Yn(n?.name,`${t}.properties[${i}].name`),values:Array.isArray(n?.values)?n.values.map((a,s)=>Yn(a,`${t}.properties[${i}].values[${s}]`)):[]})),componentIds:Array.isArray(e.componentIds)?e.componentIds.map((n,i)=>ve(n,`${t}.componentIds[${i}]`)):[]}}function Cs(e,t){if(!he(e))throw new M(t,"expected a font asset object");return{...e,id:ve(e.id,`${t}.id`),family:typeof e.family=="string"&&e.family.trim()?e.family.trim().slice(0,120):"Custom",weight:Math.round(ie(e.weight??400,`${t}.weight`,{min:100,max:900})/100)*100,style:Re(e.style??"normal",`${t}.style`,_n),asset:gs(e.asset)?e.asset:(()=>{throw new M(`${t}.asset`,"expected fonts/<file>")})(),sourceName:typeof e.sourceName=="string"?e.sourceName.slice(0,200):void 0}}function Ms(e,t){if(!he(e))throw new M(t,"expected a comment object");let n={...e,id:ve(e.id,`${t}.id`),pageId:ve(e.pageId,`${t}.pageId`),body:typeof e.body=="string"?e.body.slice(0,4e3):"",author:Re(e.author??"user",`${t}.author`,Bn),createdAt:typeof e.createdAt=="string"?e.createdAt:Ue(),resolved:e.resolved===!0,replies:[]};return e.nodeId!=null&&(n.nodeId=ve(e.nodeId,`${t}.nodeId`)),e.x!=null&&(n.x=Fe(e.x,`${t}.x`)),e.y!=null&&(n.y=Fe(e.y,`${t}.y`)),Array.isArray(e.replies)&&(n.replies=e.replies.slice(0,100).map((i,a)=>{if(!he(i))throw new M(`${t}.replies[${a}]`,"expected an object");return{id:ve(i.id??le("r"),`${t}.replies[${a}].id`),body:typeof i.body=="string"?i.body.slice(0,4e3):"",author:Re(i.author??"user",`${t}.replies[${a}].author`,Bn),createdAt:typeof i.createdAt=="string"?i.createdAt:Ue()}})),n}function Xe(e,t={}){if(!he(e))throw new M("$","expected a document object");let n=ms(e);if(n.format=Xn,n.version=Vn,n.id=ve(n.id??le("doc"),"$.id"),n.title=typeof n.title=="string"&&n.title.trim()?n.title.trim().slice(0,200):"\u672A\u547D\u540D\u753B\u5E03",!Array.isArray(n.pages)||n.pages.length===0)throw new M("$.pages","expected at least one page");if(n.pages.length>50)throw new M("$.pages","expected at most 50 pages");let a={count:0,ids:new Set};n.pages=n.pages.map((o,c)=>{if(!he(o))throw new M(`$.pages[${c}]`,"expected an object");let d={...o,id:ve(o.id??le("page"),`$.pages[${c}].id`),name:typeof o.name=="string"&&o.name.trim()?o.name.trim().slice(0,120):`Page ${c+1}`,children:[]};if(o.background!=null&&(d.background=pt(o.background,`$.pages[${c}].background`)),Array.isArray(o.children))for(let h=0;h<o.children.length;h+=1)d.children.push(Zt(o.children[h],`$.pages[${c}].children[${h}]`,1,a));return d});let s=new Set(n.pages.map(o=>o.id));if(s.size!==n.pages.length)throw new M("$.pages","duplicate page id");if(n.components=Array.isArray(n.components)?n.components.map((o,c)=>Is(o,`$.components[${c}]`,a)):[],n.components.length>Pe.components)throw new M("$.components","too many components");let r=new Set(n.components.map(o=>o.id));if(r.size!==n.components.length)throw new M("$.components","duplicate component id");for(let o of n.components)if(o.variantSetId!=null&&!Array.isArray(n.variantSets))throw new M("$.variantSets","missing variant sets");n.variantSets=Array.isArray(n.variantSets)?n.variantSets.map((o,c)=>Ns(o,`$.variantSets[${c}]`)):[];for(let[o,c]of n.variantSets.entries())for(let d of c.componentIds)if(!r.has(d))throw new M(`$.variantSets[${o}].componentIds`,`unknown component "${d}"`);if(n.styles=Array.isArray(n.styles)?n.styles.map((o,c)=>ks(o,`$.styles[${c}]`)):[],n.styles.length>Pe.styles)throw new M("$.styles","too many styles");if(new Set(n.styles.map(o=>o.id)).size!==n.styles.length)throw new M("$.styles","duplicate style id");if(n.fonts=Array.isArray(n.fonts)?n.fonts.map((o,c)=>Cs(o,`$.fonts[${c}]`)):[],n.fonts.length>Pe.fonts)throw new M("$.fonts","too many fonts");if(n.comments=Array.isArray(n.comments)?n.comments.map((o,c)=>Ms(o,`$.comments[${c}]`)):[],n.comments.length>Pe.comments)throw new M("$.comments","too many comments");for(let[o,c]of n.comments.entries()){if(!s.has(c.pageId))throw new M(`$.comments[${o}].pageId`,`unknown page "${c.pageId}"`);if(c.nodeId!=null&&!Jt(n,c.nodeId))throw new M(`$.comments[${o}].nodeId`,`unknown node "${c.nodeId}"`)}return n.meta=he(n.meta)?{...n.meta}:{},n.meta.createdAt=typeof n.meta.createdAt=="string"?n.meta.createdAt:Ue(),n.meta.updatedAt=t.touch===!1?n.meta.updatedAt??Ue():Ue(),zs(n),n}function zs(e){let t=new Map(e.components.map(c=>[c.id,c])),n=new Map(e.variantSets.map(c=>[c.id,c])),i=new Map(e.styles.map(c=>[c.id,c])),a=new Set;for(let[c,d]of e.fonts.entries()){if(a.has(d.id))throw new M(`$.fonts[${c}].id`,`duplicate font id "${d.id}"`);a.add(d.id)}for(let[c,d]of e.variantSets.entries())for(let h of d.componentIds){let p=t.get(h);if(!p)throw new M(`$.variantSets[${c}].componentIds`,`unknown component "${h}"`);if(p.variantSetId!==d.id)throw new M("$.components",`component "${h}" must set variantSetId "${d.id}"`);for(let b of d.properties){if(!(b.name in p.variantProps))throw new M("$.components",`component "${h}" is missing variant property "${b.name}"`);if(!b.values.includes(p.variantProps[b.name]))throw new M("$.components",`component "${h}" has variant value not declared by "${b.name}"`)}}for(let c of e.components)if(c.variantSetId!=null&&!n.has(c.variantSetId))throw new M("$.components",`component "${c.id}" references unknown variant set`);let s=(c,d,h)=>{if(c==null)return;let p=i.get(c);if(!p)throw new M(h,`unknown ${d} style "${c}"`);if(p.type!==d)throw new M(h,`style "${c}" is a ${p.type} style, expected ${d}`)};for(let c of e.components)for(let d of Un(c.root))s(d.fillStyleId,"fill",`$.components.${c.id}.${d.id}.fillStyleId`),s(d.textStyleId,"text",`$.components.${c.id}.${d.id}.textStyleId`),s(d.effectStyleId,"effect",`$.components.${c.id}.${d.id}.effectStyleId`);let r=(c,d)=>{let h=t.get(c.componentId);if(!h)throw new M(`${d}.componentId`,`unknown component "${c.componentId}"`);if(h.variantSetId!=null){let p=n.get(h.variantSetId);if(p)for(let[b,x]of Object.entries(c.variantProps??{})){let E=p.properties.find(S=>S.name===b);if(!E)throw new M(`${d}.variantProps.${b}`,`variant set has no property "${b}"`);if(!E.values.includes(x))throw new M(`${d}.variantProps.${b}`,`unknown variant value "${x}"`)}}for(let[p,b]of Object.entries(c.overrides??{})){let x=Zn(h.root,p);if(!x)throw new M(`${d}.overrides.${p}`,"override targets an unknown node");if("text"in b&&x.node.type!=="text")throw new M(`${d}.overrides.${p}.text`,"text override on a non-text node");if("fills"in b&&!["frame","rect","ellipse","path","text"].includes(x.node.type))throw new M(`${d}.overrides.${p}.fills`,"fill override on an unsupported node")}},l=(c,d,h)=>{h>Pe.depth||(s(c.fillStyleId,"fill",`${d}.fillStyleId`),s(c.textStyleId,"text",`${d}.textStyleId`),s(c.effectStyleId,"effect",`${d}.effectStyleId`),c.type==="instance"&&r(c,d),Array.isArray(c.children)&&c.children.forEach((p,b)=>l(p,`${d}.children[${b}]`,h+1)))};e.pages.forEach((c,d)=>{c.children.forEach((h,p)=>l(h,`$.pages[${d}].children[${p}]`,1))});let o=new Set;for(let[c,d]of e.comments.entries()){if(o.has(d.id))throw new M(`$.comments[${c}].id`,"duplicate comment id");o.add(d.id)}}function*Un(e){if(yield e,Array.isArray(e.children))for(let t of e.children)yield*Un(t)}function As(e,t){for(let n of e.pages??[]){let i=(a,s,r)=>{t(a,s,{page:n,component:null,index:r}),Array.isArray(a.children)&&a.children.forEach((l,o)=>i(l,a,o))};(n.children??[]).forEach((a,s)=>i(a,null,s))}for(let n of e.components??[]){let i=(a,s,r)=>{t(a,s,{page:null,component:n,index:r}),Array.isArray(a.children)&&a.children.forEach((l,o)=>i(l,a,o))};i(n.root,null,0)}}function Jt(e,t){let n=null;return As(e,(i,a,s)=>{!n&&i.id===t&&(n={node:i,parent:a,...s})}),n}function Zn(e,t){let n=(i,a,s)=>{if(i.id===t)return{node:i,parent:a,index:s};if(!Array.isArray(i.children))return null;for(let r=0;r<i.children.length;r+=1){let l=n(i.children[r],i,r);if(l)return l}return null};return n(e,null,0)}function Jn(e,t){return(e.pages??[]).find(n=>n.id===t)??null}function qn(e){return e.pages?.[0]??null}function Fs(e,t){return(e.pages??[]).find(n=>n.id===t)??null}function Qn(e,t){let n=t.pageId?Fs(e,t.pageId):qn(e);if(!n)throw new M("$.comments","document has no pages");if(typeof t.body!="string"||!t.body.trim())throw new M("$.comments.body","comment body is required");if(t.nodeId!=null&&!Jt(e,t.nodeId))throw new M("$.comments.nodeId",`unknown node "${t.nodeId}"`);let i={id:le("c"),pageId:n.id,body:t.body,author:t.author==="ai"?"ai":"user",createdAt:new Date().toISOString(),resolved:!1,replies:[]};return t.nodeId!=null&&(i.nodeId=t.nodeId),t.x!=null&&(i.x=t.x),t.y!=null&&(i.y=t.y),e.comments=Array.isArray(e.comments)?e.comments:[],e.comments.push(i),i}function ei(e,t,n,i){let a=(e.comments??[]).find(r=>r.id===t);if(!a)throw new M("$.comments",`unknown comment "${t}"`);if(typeof n!="string"||!n.trim())throw new M("$.comments.body","reply body is required");let s={id:le("r"),body:n,author:i==="ai"?"ai":"user",createdAt:new Date().toISOString()};return a.replies.push(s),s}function ti(e,t,n=!0){let i=(e.comments??[]).find(a=>a.id===t);if(!i)throw new M("$.comments",`unknown comment "${t}"`);return i.resolved=n,i}function ni(e,t){let n=(e.comments??[]).findIndex(i=>i.id===t);if(n===-1)throw new M("$.comments",`unknown comment "${t}"`);e.comments.splice(n,1)}var mt=Object.freeze({family:"system-ui",weight:400,style:"normal",size:14,lineHeight:1.4,letterSpacing:0}),Ps=4e3,ii=1e-6,Ts="\u2060",oi=/[\u2E80-\u2FFF\u3000-\u303F\u3040-\u30FF\u3100-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u{1F300}-\u{1FAFF}]/u,Ds=new Set(["system-ui","ui-sans-serif","ui-serif","ui-monospace","ui-rounded","sans-serif","serif","monospace","cursive","fantasy","math","emoji","fangsong","-apple-system","BlinkMacSystemFont","Segoe UI"]);function tt(){let e=new Map,t=0,n=null,i=!1,a=ri(),s=a&&a.fonts?a.fonts:null,r=s&&typeof s.status=="string"?s.status:"loaded",l=()=>{e.clear(),t+=1};if(s)try{typeof s.addEventListener=="function"?(s.addEventListener("loadingdone",l),s.addEventListener("loadingerror",l)):s.ready&&typeof s.ready.then=="function"&&s.ready.then(l,()=>{})}catch{}function o(){!s||typeof s.status!="string"||s.status!==r&&(r=s.status,r==="loaded"&&l())}function c(){if(i)return n;i=!0;let h=ri();if(!h)return null;try{let p=h.createElement("canvas"),b=p&&typeof p.getContext=="function"?p.getContext("2d"):null;b&&typeof b.measureText=="function"&&(n=b)}catch{n=null}return n}function d(h){o();let p=h&&typeof h.text=="string"?h.text:"",b=Ls(h&&h.font),x=h?h.maxWidth:1/0,E=typeof x=="number"&&x>0?x:1/0,S=`${b.family}|${b.weight}|${b.style}|${b.size}|${b.lineHeight}|${b.letterSpacing}|${E===1/0?"inf":E}|${p.length}|${p}`,k=e.get(S);if(k)return k;let v=c(),z=v?Hs(v,p,b,E):Os(p,b,E);return(!s||s.status!=="loading")&&(e.size>=Ps&&e.clear(),e.set(S,z)),z}return d.clearCache=l,d.fontEpoch=()=>t,d.fontsReady=()=>s&&s.ready?s.ready:Promise.resolve(),d.isCanvasBacked=()=>!!c(),d}function Ls(e){let t=e&&typeof e=="object"?e:{};return{family:typeof t.family=="string"&&t.family.trim()?t.family.trim():mt.family,weight:ai(t.weight,mt.weight),style:t.style==="italic"?"italic":"normal",size:si(t.size,mt.size),lineHeight:si(t.lineHeight,mt.lineHeight),letterSpacing:ai(t.letterSpacing,mt.letterSpacing)}}function ai(e,t){return typeof e=="number"&&Number.isFinite(e)?e:t}function si(e,t){return typeof e=="number"&&Number.isFinite(e)&&e>0?e:t}function ri(){try{let e=typeof globalThis<"u"?globalThis:void 0,t=e?e.document:null;return t&&typeof t.createElement=="function"?t:null}catch{return null}}function Hs(e,t,n,i){try{e.font=Bs(n)}catch{}return ci(t,n,i,s=>{try{let r=e.measureText(s);return r&&Number.isFinite(r.width)?r.width:0}catch{return 0}})}function Os(e,t,n){return ci(e,t,n,a=>{let s=0;for(let r of a)s+=oi.test(r)?t.size:t.size*.55;return s})}function Bs(e){let t=e.style==="italic"?"italic ":"",n=js(e.family);return`${t}${e.weight} ${e.size}px ${n}`}function js(e){return e.includes(",")||Ds.has(e)||/^[A-Za-z][A-Za-z0-9_-]*$/.test(e)?e:JSON.stringify(e)}function ci(e,t,n,i){let a=t.letterSpacing,s=t.size*t.lineHeight,r=Number.isFinite(n)&&n>0,l=p=>i(p)+a*Xs(p),o=[],c=p=>{let b=p.replace(/[ \t\u00A0]+$/u,"");o.push({text:b,width:Math.max(0,l(b))})},d=String(e).replace(/\r\n?/g,`
`).replace(/\t/g,"    ").split(`
`);for(let p of d){let b=[],x=0,E=()=>{c(b.join("")),b=[],x=0},S=k=>{let v=l(k);if(!r){b.push(k),x+=v;return}if(x+v<=n+ii){b.push(k),x+=v;return}if(b.length>0){E(),S(k);return}let z="",G=0;for(let Z of k){let J=l(Z);z&&G+J>n+ii?(c(z),z=Z,G=J):(z+=Z,G+=J)}z&&(b.push(z),x=G)};for(let k of Ys(p))b.length===0&&/^[ \t\u00A0]+$/u.test(k)||S(k);E()}let h=0;for(let p of o)h=Math.max(h,p.width);return{lines:o,width:h,height:o.length*s}}function Ys(e){let t=[],n="";for(let i of e)i!==Ts&&(oi.test(i)||i===" "||i==="\xA0"?(n&&(t.push(n),n=""),t.push(i)):n+=i);return n&&t.push(n),t}function Xs(e){let t=0;for(let n of e)t+=1;return t}var nt=Object.freeze({family:"system-ui",weight:400,style:"normal",size:14,lineHeight:1.4,letterSpacing:0}),li=1e-6;function It(e){if(!e||!Array.isArray(e.roots))return e;let t=Array.isArray(e.issues)?e.issues:e.issues=[],n=e.measureText;typeof n!="function"&&e.options&&typeof e.options.measureText=="function"&&(n=e.options.measureText),typeof n!="function"&&(n=tt()),e.measureText=n;let i={issues:t,measure:n};for(let d of e.roots)a(d);for(let d of e.roots)o(d,0,0);return e;function a(d){if(!d||typeof d!="object")return;if(d.type==="text"){s(d);return}let h=Array.isArray(d.children)?d.children:[];for(let x of h)a(x);let p=it(d.layout)?d.layout:null,b=kt(d);p?r(d,p,b,h):l(d,b,h)}function s(d){let h=kt(d),p=it(d.font)?{...nt,...d.font}:nt,b=h.h==="hug"?1/0:Math.max(0,re(d.width,0)),x=Vs(i,{text:typeof d.text=="string"?d.text:"",font:p,maxWidth:b,autoHeight:d.autoHeight!==!1},d);d.lines=x.lines,h.h==="hug"&&(d.width=Math.max(0,x.width)),h.v==="hug"&&(d.height=Math.max(0,x.height))}function r(d,h,p,b){let E=(h.direction==="horizontal"?"horizontal":"vertical")==="horizontal",S=di(h.padding),k=Math.max(0,re(h.gap,0)),v=h.alignCounter??"start",z=S.left+S.right,G=S.top+S.bottom,Z=p.h==="hug"?null:Math.max(0,re(d.width,0)-z),J=p.v==="hug"?null:Math.max(0,re(d.height,0)-G),se=E?Z:J,A=E?J:Z,V=E?"width":"height",ne=E?"height":"width";if(A!=null)for(let F of b){let Y=kt(F),Ie=E?Y.v:Y.h;(Ie==="fill"||v==="stretch"&&Ie==="fixed")&&Math.abs(re(F[ne],0)-A)>li&&(F[ne]=A,a(F))}if(se!=null){let F=b.filter(Y=>{let Ie=kt(Y);return(E?Ie.h:Ie.v)==="fill"});if(F.length){let Y=0;for(let Ce of b)F.includes(Ce)||(Y+=Math.max(0,re(Ce[V],0)));let Ie=k*Math.max(0,b.length-1),ze=Math.max(0,(se-Y-Ie)/F.length);for(let Ce of F)Math.abs(re(Ce[V],0)-ze)>li&&(Ce[V]=ze,a(Ce))}}let de=k*Math.max(0,b.length-1),pe=0;for(let F of b)de+=Math.max(0,re(F[V],0)),pe=Math.max(pe,Math.max(0,re(F[ne],0)));p.h==="hug"&&(d.width=Math.max(0,E?de+z:pe+z)),p.v==="hug"&&(d.height=Math.max(0,E?pe+G:de+G))}function l(d,h,p){let b=0,x=0;for(let E of p)b=Math.max(b,re(E.x,0)+Math.max(0,re(E.width,0))),x=Math.max(x,re(E.y,0)+Math.max(0,re(E.height,0)));h.h==="hug"&&(d.width=Math.max(0,b)),h.v==="hug"&&(d.height=Math.max(0,x))}function o(d,h,p){if(!d||typeof d!="object")return;d.absX=h+re(d.x,0),d.absY=p+re(d.y,0);let b=Array.isArray(d.children)?d.children:[];if(!b.length)return;let x=it(d.layout)?d.layout:null;x&&c(d,x,b);for(let E of b)o(E,d.absX,d.absY)}function c(d,h,p){let b=h.direction==="horizontal",x=di(h.padding),E=Math.max(0,re(h.gap,0)),S=h.alignPrimary??"start",k=h.alignCounter??"start",v=b?"width":"height",z=b?"height":"width",G=b?x.left:x.top,Z=b?x.top:x.left,J=Math.max(0,re(d[v],0)-(b?x.left+x.right:x.top+x.bottom)),se=Math.max(0,re(d[z],0)-(b?x.top+x.bottom:x.left+x.right)),A=E*Math.max(0,p.length-1);for(let F of p)A+=Math.max(0,re(F[v],0));let V=J-A,ne=0,de=E;S==="center"?ne=V/2:S==="end"?ne=V:S==="space-between"&&p.length>1&&(de=E+Math.max(0,V)/(p.length-1));let pe=G+ne;for(let F of p){let Y=Math.max(0,re(F[v],0)),Ie=Math.max(0,re(F[z],0)),ze=Z;k==="center"?ze=Z+(se-Ie)/2:k==="end"&&(ze=Z+se-Ie),b?(F.x=pe,F.y=ze):(F.x=ze,F.y=pe),pe+=Y+de}}}function kt(e){let t=it(e.layoutSizing)?e.layoutSizing:{},n=t.h==="hug"||t.h==="fill"?t.h:"fixed",i;return t.v==="hug"||t.v==="fill"?i=t.v:t.v==="fixed"?i="fixed":i=e.type==="text"&&e.autoHeight!==!1?"hug":"fixed",{h:n,v:i}}function di(e){let t=it(e)?e:{};return{top:re(t.top,0),right:re(t.right,0),bottom:re(t.bottom,0),left:re(t.left,0)}}function Vs(e,t,n){try{let i=e.measure(t);if(i&&Array.isArray(i.lines)&&Number.isFinite(i.width)&&Number.isFinite(i.height))return{lines:i.lines.map(a=>({text:typeof a?.text=="string"?a.text:"",width:re(a?.width,0)})),width:i.width,height:i.height};throw new Error("measureText returned an invalid result")}catch(i){return e.issues.push(`text measurement failed for "${n.key??n.id??"text"}": ${String(i instanceof Error?i.message:i)}`),_s(t)}}function _s(e){let t=it(e.font)?{...nt,...e.font}:nt,n=re(t.size,nt.size),i=re(t.lineHeight,nt.lineHeight),a=String(e.text??"").replace(/\r\n?/g,`
`).split(`
`).map(r=>({text:r,width:[...r].length*n*.55})),s=0;for(let r of a)s=Math.max(s,r.width);return{lines:a,width:s,height:a.length*n*i}}function it(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function re(e,t){return typeof e=="number"&&Number.isFinite(e)?e:t}var hi=24,ui=2e4,mi=Object.freeze({family:"system-ui",weight:400,style:"normal",size:14,lineHeight:1.4,letterSpacing:0}),Ws=new Set(["left","center","right","justify"]),Gs=new Set(["top","center","bottom"]),pi=new Set(["fixed","hug","fill"]);function tn(e,t={}){let n=ae(e)?e:{},i=ae(t)?{...t}:{},a=[];ae(e)||a.push("document is missing or malformed");let s=i.mode==="component"?"component":"design",r=typeof i.measureText=="function"?i.measureText:tt(),l=new Map;for(let S of Array.isArray(n.components)?n.components:[])ae(S)&&typeof S.id=="string"&&l.set(S.id,S);let o=new Map;for(let S of Array.isArray(n.styles)?n.styles:[])ae(S)&&typeof S.id=="string"&&o.set(S.id,S);let c=new Map;for(let S of Array.isArray(n.variantSets)?n.variantSets:[])ae(S)&&typeof S.id=="string"&&c.set(S.id,S);let d=new Map,h=new Map,p={issues:a,componentById:l,styleById:o,variantSetById:c,byKey:d,bySourceId:h,nodeCount:0,budgetIssued:!1,componentStack:[]},b=[],x=s==="design"?Qs(n,i.pageId,a):null;if(s==="design"){if(x){let S=Array.isArray(x.children)?x.children:[];for(let k of S){if(!ae(k)){a.push("skipped a malformed page child");continue}let v=qt(k,{key:typeof k.id=="string"?k.id:`node-${b.length}`,keyPrefix:null,instanceId:null,editable:!0,overrides:null,parent:null},p);v&&b.push(v)}}}else{let S=typeof i.componentId=="string"?i.componentId:null,k=S?l.get(S):null;if(!k||!ae(k.root))a.push(`component mode: unknown component "${String(S)}"`);else{let v=k.root,z=qt(v,{key:typeof v.id=="string"?v.id:"component-root",keyPrefix:null,instanceId:null,editable:!0,overrides:null,parent:null},p);z&&b.push(z)}}let E={pageId:x&&typeof x.id=="string"?x.id:null,title:typeof n.title=="string"?n.title:"",mode:s,roots:b,byKey:d,bySourceId:h,componentById:l,styleById:o,issues:a,componentId:s==="component"&&typeof i.componentId=="string"?i.componentId:null,viewportWidth:Ye(i.viewportWidth,null),page:x,background:x&&typeof x.background=="string"?x.background:null,doc:n,measureText:r,options:i};return er(E,e,i),E}function qt(e,t,n){return ae(e)?(n.nodeCount+=1,n.nodeCount>ui?(n.budgetIssued||(n.issues.push(`scene exceeds ${ui} nodes; remaining children were skipped`),n.budgetIssued=!0),null):e.type==="instance"?Us(e,t,n):Ks(e,t,n)):(n.issues.push(`skipped a malformed node at "${t.key}"`),null)}function Ks(e,t,n){let i=gi(e,t),a=i.type,s=en(t.overrides,e.id);if(a==="frame"||a==="rect"||a==="ellipse"||a==="path")Qt(i,e,n,s),a==="frame"&&(i.layout=ae(e.layout)?e.layout:void 0),a==="path"&&(i.d=e.d,i.viewBox=e.viewBox,i.fillRule=e.fillRule??"nonzero");else if(a==="text"){let r=Qt(i,e,n,s);yi(i,e,r,s)}else a==="line"&&(i.strokes=Array.isArray(e.strokes)?e.strokes:[]);return s&&typeof s.visible=="boolean"&&(i.visible=s.visible),a==="frame"||a==="group"?i.children=fi(e,i,{prefix:t.keyPrefix??null,instanceId:t.instanceId??null,editable:i.editable,overrides:t.overrides??null},n):i.children=[],xi(i,n),i}function Us(e,t,n){let i=gi(e,t);i.type="instance",i.isInstanceRoot=!0;let a=t.instanceId!=null?t.instanceId:t.key;i.instanceId=a;let s=ae(e.overrides)?e.overrides:{};i.overrides=s,i.variantProps=ae(e.variantProps)?{...e.variantProps}:{},i.componentId=e.componentId;let r=en(t.overrides,e.id),l=Js(e,n),o=l&&ae(l.root)?l.root:null;if(l&&(i.componentId=l.id,i.variantProps={...ae(l.variantProps)?l.variantProps:{},...ae(e.variantProps)?e.variantProps:{}}),o){let c=en(s,o.id),d=Qt(i,o,n,c);e.cornerRadius!=null&&(i.cornerRadius=Math.max(0,Ye(e.cornerRadius,0))),i.visible=i.visible&&o.visible!==!1,o.type==="text"&&(yi(i,o,d,c),i.lines=[]),o.type==="path"&&(i.d=o.d,i.viewBox=o.viewBox,i.fillRule=o.fillRule??"nonzero"),i.layout=ae(o.layout)?o.layout:void 0,i.layoutSizing=bi(e.layoutSizing),c&&typeof c.visible=="boolean"&&(i.visible=c.visible)}if(r&&typeof r.visible=="boolean"&&(i.visible=r.visible),l&&o)if(n.componentStack.includes(l.id))n.issues.push(`component cycle: ${[...n.componentStack,l.id].join(" -> ")}; instance "${String(e.id)}" rendered empty`);else if(n.componentStack.length>=hi)n.issues.push(`component nesting exceeds ${hi} at instance "${String(e.id)}"; rendered empty`);else{n.componentStack.push(l.id);try{i.children=fi(o,i,{prefix:i.key,instanceId:a,editable:!1,overrides:s},n)}finally{n.componentStack.pop()}}return xi(i,n),i}function fi(e,t,n,i){let a=Array.isArray(e.children)?e.children:[],s=[];for(let r of a){if(!ae(r)){i.issues.push(`skipped a malformed child of "${String(t.id)}"`);continue}let l=typeof r.id=="string"?r.id:`node-${n.prefix??""}-${s.length}`,o=n.prefix?`${n.prefix}::${l}`:l,c=qt(r,{key:o,keyPrefix:n.prefix??null,instanceId:n.instanceId??null,editable:n.editable!==!1,overrides:n.overrides??null,parent:t},i);c&&s.push(c)}return s}function gi(e,t){let n=typeof e.type=="string"?e.type:"rect",i=typeof e.id=="string"?e.id:String(t.key),a={key:t.key,id:i,sourceId:i,type:n,name:typeof e.name=="string"?e.name:n,x:Ye(e.x,0),y:Ye(e.y,0),width:Math.max(0,Ye(e.width,0)),height:Math.max(0,Ye(e.height,0)),rotation:Ye(e.rotation,0),opacity:tr(Ye(e.opacity,1)),visible:e.visible!==!1,locked:e.locked===!0,fill:[],fills:[],strokes:[],effects:[],cornerRadius:0,clip:!1,children:[],sourceNode:e,editable:t.editable!==!1,isInstanceRoot:!1,parent:t.parent??null};t.instanceId!=null&&(a.instanceId=t.instanceId);let s=bi(e.layoutSizing);return s&&(a.layoutSizing=s),a}function Qt(e,t,n,i){let a=Zs(t,e,n),s=a.fills,r=a.effects;return i&&Array.isArray(i.fills)&&(s=i.fills),e.fill=s,e.fills=s,e.effects=r,e.strokes=Array.isArray(t.strokes)?t.strokes:[],e.cornerRadius=Math.max(0,Ye(t.cornerRadius,0)),e.clip=t.type==="frame"?t.clip!==!1:!1,a.font}function yi(e,t,n,i){e.text=typeof t.text=="string"?t.text:"",e.font=ae(n)?n:mi,e.align=Ws.has(t.align)?t.align:"left",e.verticalAlign=Gs.has(t.verticalAlign)?t.verticalAlign:"top",e.autoHeight=t.autoHeight!==!1,i&&typeof i.text=="string"&&(e.text=i.text)}function Zs(e,t,n){let i=Array.isArray(e.fills)?e.fills:[],a=Array.isArray(e.effects)?e.effects:[],s=ae(e.font)?e.font:mi,r=`node "${String(t.id)}"`;if(e.textStyleId!=null){let l=n.styleById.get(e.textStyleId);l?l.type!=="text"?n.issues.push(`${r}: style "${String(e.textStyleId)}" is a ${String(l.type)} style, expected text`):ae(l.value)&&(ae(l.value.font)&&(s=l.value.font),Array.isArray(l.value.fills)&&(i=l.value.fills)):n.issues.push(`${r}: unknown text style "${String(e.textStyleId)}"`)}if(e.fillStyleId!=null){let l=n.styleById.get(e.fillStyleId);l?l.type!=="fill"?n.issues.push(`${r}: style "${String(e.fillStyleId)}" is a ${String(l.type)} style, expected fill`):ae(l.value)&&(i=[l.value]):n.issues.push(`${r}: unknown fill style "${String(e.fillStyleId)}"`)}if(e.effectStyleId!=null){let l=n.styleById.get(e.effectStyleId);l?l.type!=="effect"?n.issues.push(`${r}: style "${String(e.effectStyleId)}" is a ${String(l.type)} style, expected effect`):Array.isArray(l.value)&&(a=l.value):n.issues.push(`${r}: unknown effect style "${String(e.effectStyleId)}"`)}return{fills:i,effects:a,font:s}}function Js(e,t){let n=t.componentById.get(e.componentId);if(!n)return t.issues.push(`instance "${String(e.id)}" references unknown component "${String(e.componentId)}"`),null;let i=ae(e.variantProps)?e.variantProps:{};if(!n.variantSetId||Object.keys(i).length===0)return n;let a=t.variantSetById.get(n.variantSetId);if(!a)return t.issues.push(`component "${String(n.id)}" references unknown variant set "${String(n.variantSetId)}"`),n;let s={...ae(n.variantProps)?n.variantProps:{},...i},r=Array.isArray(a.properties)?a.properties:[];for(let l of Array.isArray(a.componentIds)?a.componentIds:[]){let o=t.componentById.get(l);if(!o)continue;let c=ae(o.variantProps)?o.variantProps:{};if(r.every(d=>c[d?.name]===s[d?.name]))return o}return t.issues.push(`instance "${String(e.id)}" has no variant match (${qs(i)}); using "${String(n.id)}"`),n}function qs(e){return Object.entries(e).map(([t,n])=>`${t}=${String(n)}`).join(", ")}function Qs(e,t,n){let i=Array.isArray(e.pages)?e.pages.filter(ae):[];if(!i.length)return n.push("document has no pages"),null;if(t==null)return i[0];let a=i.find(s=>s.id===t);return a||(n.push(`unknown page "${String(t)}"`),null)}function xi(e,t){t.byKey.has(e.key)?t.issues.push(`duplicate render key "${e.key}"`):t.byKey.set(e.key,e);let n=t.bySourceId.get(e.sourceId);n?n.push(e):t.bySourceId.set(e.sourceId,[e])}function er(e,t,n){e.rebuild=()=>{e.measureText&&typeof e.measureText.clearCache=="function"&&e.measureText.clearCache();let i=tn(t,{...n,measureText:e.measureText});return e.pageId=i.pageId,e.title=i.title,e.mode=i.mode,e.componentId=i.componentId,e.roots=i.roots,e.byKey=i.byKey,e.bySourceId=i.bySourceId,e.componentById=i.componentById,e.styleById=i.styleById,e.page=i.page,e.background=i.background,e.doc=i.doc,Array.isArray(e.issues)?(e.issues.length=0,e.issues.push(...i.issues)):e.issues=i.issues,It(e),e}}function en(e,t){if(!ae(e)||typeof t!="string")return;let n=e[t];return ae(n)?n:void 0}function bi(e){if(!ae(e))return;let t={};return pi.has(e.h)&&(t.h=e.h),pi.has(e.v)&&(t.v=e.v),Object.keys(t).length?t:void 0}function ae(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function Ye(e,t){return typeof e=="number"&&Number.isFinite(e)?e:t}function tr(e){return Math.min(1,Math.max(0,e))}var Nt=class{constructor(t=100){this.limit=t,this.entries=[],this.index=-1}reset(t){this.entries=[JSON.stringify(t)],this.index=0}commit(t){let n=JSON.stringify(t);return this.index>=0&&this.entries[this.index]===n?!1:(this.entries=this.entries.slice(0,this.index+1),this.entries.push(n),this.entries.length>this.limit&&this.entries.shift(),this.index=this.entries.length-1,!0)}canUndo(){return this.index>0}canRedo(){return this.index>=0&&this.index<this.entries.length-1}undo(){return this.canUndo()?(this.index-=1,JSON.parse(this.entries[this.index])):null}redo(){return this.canRedo()?(this.index+=1,JSON.parse(this.entries[this.index])):null}replaceCurrent(t){if(this.index<0){this.reset(t);return}this.entries[this.index]=JSON.stringify(t)}};var wi=/\[([^\][\n]{1,140})\]\(dsh-canvas:\/\/([a-z0-9][a-z0-9-_]{0,63})(?:\?([^)\n]*))?\)/g;function vi(e){let t=(String(e.label??"\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D").replace(/[\[\]\n]/g," ").replace(/\s+/g," ").trim()||"\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D").slice(0,70),n=new URLSearchParams({node:e.node});return e.page&&n.set("page",e.page),`[${t}](dsh-canvas://${e.doc}?${n})`}function nr(e,t){wi.lastIndex=t;let n=wi.exec(e);if(!n)return;let i=new URLSearchParams(n[3]??"");return{id:"dsh-canvas",start:n.index,end:n.index+n[0].length,data:{label:n[1].trim()||"\u753B\u5E03",doc:n[2],node:i.get("node")??void 0,page:i.get("page")??void 0}}}var Ri={id:"dsh-canvas",order:20,match:nr};var Ct="dsh-canvas:selection",nn=new Map,ir=0;function Ei(e){e?.sessionId&&(nn.set(e.sessionId,{...e,at:Date.now(),seq:++ir}),typeof window<"u"&&window.dispatchEvent(new CustomEvent(Ct,{detail:{...e}})))}function Mt(e){return nn.get(e)??null}function $i(e){nn.delete(e),typeof window<"u"&&window.dispatchEvent(new CustomEvent(Ct,{detail:{sessionId:e,dismissed:!0}}))}function Si(e){if(typeof window>"u")return()=>{};let t=()=>e();return window.addEventListener(Ct,t),()=>window.removeEventListener(Ct,t)}var sn="material3",at={material3:{id:"material3",name:"Material Design 3",source:"Google",platform:"cross-platform",description:"Google \u7684\u8DE8\u5E73\u53F0\u8BBE\u8BA1\u89C4\u8303\uFF0C\u7EC4\u4EF6\u4E0E token \u8986\u76D6\u6700\u5E7F\uFF0C\u662F\u6700\u901A\u7528\u7684\u4E00\u5957\u3002",colors:{primary:"#6750A4",onPrimary:"#FFFFFF",primaryContainer:"#EADDFF",onPrimaryContainer:"#21005D",secondary:"#625B71",onSecondary:"#FFFFFF",secondaryContainer:"#E8DEF8",onSecondaryContainer:"#1D192B",surface:"#FEF7FF",onSurface:"#1D1B20",surfaceVariant:"#E7E0EC",onSurfaceVariant:"#49454F",background:"#FEF7FF",outline:"#79747E",outlineVariant:"#CAC4D0",error:"#B3261E",onError:"#FFFFFF",success:"#146C2E",warning:"#7D5260"},type:{displayLarge:{size:57,lineHeight:64,weight:400,letterSpacing:-.25},displayMedium:{size:45,lineHeight:52,weight:400,letterSpacing:0},displaySmall:{size:36,lineHeight:44,weight:400,letterSpacing:0},headlineLarge:{size:32,lineHeight:40,weight:400,letterSpacing:0},headlineMedium:{size:28,lineHeight:36,weight:400,letterSpacing:0},headlineSmall:{size:24,lineHeight:32,weight:400,letterSpacing:0},titleLarge:{size:22,lineHeight:28,weight:400,letterSpacing:0},titleMedium:{size:16,lineHeight:24,weight:500,letterSpacing:.15},titleSmall:{size:14,lineHeight:20,weight:500,letterSpacing:.1},bodyLarge:{size:16,lineHeight:24,weight:400,letterSpacing:.5},bodyMedium:{size:14,lineHeight:20,weight:400,letterSpacing:.25},bodySmall:{size:12,lineHeight:16,weight:400,letterSpacing:.4},labelLarge:{size:14,lineHeight:20,weight:500,letterSpacing:.1},labelMedium:{size:12,lineHeight:16,weight:500,letterSpacing:.5},labelSmall:{size:11,lineHeight:16,weight:500,letterSpacing:.5}},spacing:{xs:4,sm:8,md:12,lg:16,xl:24,xxl:32,xxxl:48},radius:{xs:4,sm:8,md:12,lg:16,xl:24,full:999},elevation:{level1:[{type:"drop-shadow",x:0,y:1,blur:3,spread:0,color:"#0000001A"}],level2:[{type:"drop-shadow",x:0,y:2,blur:6,spread:0,color:"#0000001F"}],level3:[{type:"drop-shadow",x:0,y:4,blur:12,spread:0,color:"#00000024"}]},components:{button:{height:40,radius:20,paddingX:24,label:"labelLarge"},card:{radius:12,padding:16,elevation:"level1"},textField:{height:56,radius:4,paddingX:16}}},ios:{id:"ios",name:"Apple Human Interface Guidelines",source:"Apple",platform:"iOS",description:"Apple \u7684 iOS \u5E73\u53F0\u89C4\u8303\uFF0C\u72B6\u6001\u680F\u3001\u5BFC\u822A\u680F\u3001\u6807\u7B7E\u680F\u3001\u5B89\u5168\u533A\u5C3A\u5BF8\u90FD\u6309 iPhone \u57FA\u51C6\u3002",colors:{blue:"#007AFF",green:"#34C759",red:"#FF3B30",orange:"#FF9500",yellow:"#FFCC00",purple:"#AF52DE",teal:"#5AC8FA",gray:"#8E8E93",background:"#F2F2F7",surface:"#FFFFFF",surfaceElevated:"#FFFFFFF2",label:"#000000",secondaryLabel:"#3C3C4399",tertiaryLabel:"#3C3C434D",separator:"#3C3C432E",fill:"#7878801F",onBlue:"#FFFFFF"},type:{largeTitle:{size:34,lineHeight:41,weight:700,letterSpacing:.37},title1:{size:28,lineHeight:34,weight:700,letterSpacing:.36},title2:{size:22,lineHeight:28,weight:600,letterSpacing:.35},title3:{size:20,lineHeight:25,weight:600,letterSpacing:.38},headline:{size:17,lineHeight:22,weight:600,letterSpacing:-.41},body:{size:17,lineHeight:22,weight:400,letterSpacing:-.41},callout:{size:16,lineHeight:21,weight:400,letterSpacing:-.32},subheadline:{size:15,lineHeight:20,weight:400,letterSpacing:-.24},footnote:{size:13,lineHeight:18,weight:400,letterSpacing:-.08},caption1:{size:12,lineHeight:16,weight:400,letterSpacing:0},caption2:{size:11,lineHeight:13,weight:400,letterSpacing:.07}},metrics:{screenWidth:393,screenHeight:852,statusBarHeight:54,navBarHeight:44,tabBarHeight:49,homeIndicatorWidth:134,homeIndicatorHeight:5,safeAreaBottom:34,margin:16,cardRadius:12,controlHeight:44},spacing:{xs:4,sm:8,md:12,lg:16,xl:20,xxl:32},radius:{sm:8,md:10,card:12,large:16,full:999},elevation:{card:[{type:"drop-shadow",x:0,y:1,blur:4,spread:0,color:"#0000000F"}]},components:{statusBar:{height:54},navBar:{height:44},tabBar:{height:49,totalWithHomeIndicator:83},button:{height:50,radius:12,paddingX:20}}}},Fo=Object.keys(at);function rn(e=sn){return at[e]??at[sn]}var Po=["If the user does not name a design system, use the built-in design system documented in canvas/DESIGN.md:","Material Design 3 tokens for general UI, and Apple Human Interface Guidelines for iOS screens.","For a mobile/iOS screen, start from the foundation (iPhone 16 393\xD7852 by default; iPhone 15 optional) and a page template, then customize it."].join(" ");function ar(e){return String(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function an(e,t,n){return`ds_${e}_${t}_${ar(n)}`.slice(0,64)}function ki(e=sn){let t=rn(e),n=[],i=t.id==="material3"?{primary:"Primary",onPrimary:"On Primary",primaryContainer:"Primary Container",surface:"Surface",onSurface:"On Surface",surfaceVariant:"Surface Variant",onSurfaceVariant:"On Surface Variant",outline:"Outline",error:"Error",success:"Success"}:{blue:"Blue",green:"Green",red:"Red",orange:"Orange",gray:"Gray",background:"Background",surface:"Surface",label:"Label",secondaryLabel:"Secondary Label",separator:"Separator"};for(let[s,r]of Object.entries(i)){let l=t.colors[s];l&&n.push({id:an(t.id,"fill",r),type:"fill",name:`${t.id==="material3"?"M3":"iOS"}/Color/${r}`,value:{type:"solid",color:l}})}let a=t.id==="material3"?t.colors.onSurface:t.colors.label;for(let[s,r]of Object.entries(t.type)){let l=s.replace(/([A-Z])/g," $1").replace(/^./,o=>o.toUpperCase()).trim();n.push({id:an(t.id,"text",l),type:"text",name:`${t.id==="material3"?"M3":"iOS"}/Type/${l}`,value:{font:{family:"system-ui",weight:r.weight,style:"normal",size:r.size,lineHeight:Math.round(r.lineHeight/r.size*1e3)/1e3,letterSpacing:r.letterSpacing},fills:[{type:"solid",color:a}]}})}for(let[s,r]of Object.entries(t.elevation))n.push({id:an(t.id,"effect",s),type:"effect",name:`${t.id==="material3"?"M3":"iOS"}/Elevation/${s}`,value:structuredClone(r)});return n}var on={iphone16:{id:"iphone16",name:"iPhone 16",width:393,height:852,statusBarHeight:54,navBarHeight:44,tabBarHeight:49,tabBarTotalHeight:83,homeIndicatorWidth:134,homeIndicatorHeight:5,safeAreaBottom:34,margin:16},iphone15:{id:"iphone15",name:"iPhone 15",width:390,height:844,statusBarHeight:54,navBarHeight:44,tabBarHeight:49,tabBarTotalHeight:83,homeIndicatorWidth:134,homeIndicatorHeight:5,safeAreaBottom:34,margin:16}},cn={neutral:{id:"neutral",name:"Neutral",pageHorizontal:16,sectionGap:16,cardPadding:16,cardRadius:12,buttonRadius:12,elevation:"soft",description:"\u9ED8\u8BA4\uFF1A\u514B\u5236\u7559\u767D\u3001\u8F7B\u9634\u5F71\u300112 \u5706\u89D2"},minimal:{id:"minimal",name:"Minimal",pageHorizontal:20,sectionGap:24,cardPadding:16,cardRadius:8,buttonRadius:8,elevation:"none",description:"\u66F4\u5927\u7559\u767D\u3001\u65E0\u9634\u5F71\u30018 \u5706\u89D2"},soft:{id:"soft",name:"Soft",pageHorizontal:20,sectionGap:20,cardPadding:20,cardRadius:20,buttonRadius:16,elevation:"soft",description:"\u67D4\u548C\u7559\u767D\u300120/16 \u5706\u89D2\u3001\u67D4\u548C\u9634\u5F71"},compact:{id:"compact",name:"Compact",pageHorizontal:12,sectionGap:12,cardPadding:12,cardRadius:8,buttonRadius:8,elevation:"none",description:"\u7D27\u51D1\u95F4\u8DDD\u30018 \u5706\u89D2\u3001\u65E0\u9634\u5F71"}},Lo=Object.keys(on),Ho=Object.keys(cn),Ve="iphone16",ft="neutral";function _e(e=Ve){return on[e]??on[Ve]}function ln(e=ft){return cn[e]??cn[ft]}var Oo=["Foundation: for new mobile screens default to iPhone 16 393\xD7852 and the Neutral preset;","iPhone 15 390\xD7844 is available for legacy documents. Presets are Neutral/Minimal/Soft/Compact and","control page margins, section gaps, card padding, radii and shadow density only; keep the existing",'Material 3 / iOS HIG colors and typography. Get resolved tokens from canvas_template action "foundation".'].join(" ");var st=at.ios,L=st.colors;function sr(e){let t=st.type[e];return{family:"system-ui",weight:t.weight,style:"normal",size:t.size,lineHeight:Math.round(t.lineHeight/t.size*1e3)/1e3,letterSpacing:t.letterSpacing}}function Q(e,t,n,i,a,s,r="body",l=L.label,o={}){let c=sr(r);return{id:e,type:"text",name:t,x:n,y:i,width:a,height:Math.ceil(c.size*c.lineHeight),rotation:0,opacity:1,visible:!0,locked:!1,text:s,font:c,align:o.align??"left",verticalAlign:o.verticalAlign??"top",fills:[{type:"solid",color:l}],effects:[],autoHeight:!0}}function ke(e,t,n,i,a,s,r={}){return{id:e,type:"rect",name:t,x:n,y:i,width:a,height:s,rotation:r.rotation??0,opacity:1,visible:!0,locked:!1,cornerRadius:r.cornerRadius??0,fills:r.fill?[{type:"solid",color:r.fill}]:[],strokes:r.stroke?[{color:r.stroke,width:r.strokeWidth??1,align:"center"}]:[],effects:r.effects??[]}}function hn(e,t,n,i,a,s,r={}){return{id:e,type:"ellipse",name:t,x:n,y:i,width:a,height:s,rotation:0,opacity:1,visible:!0,locked:!1,fills:r.fill?[{type:"solid",color:r.fill}]:[],strokes:r.stroke?[{color:r.stroke,width:r.strokeWidth??1,align:"center"}]:[],effects:[]}}function zt(e,t,n,i,a,s={}){return{id:e,type:"line",name:t,x:n,y:i,width:a,height:0,rotation:s.rotation??0,opacity:1,visible:!0,locked:!1,strokes:[{color:s.color??L.label,width:s.width??1,align:"center"}]}}function Ne(e,t,n,i,a,s,r,l={}){return{id:e,type:"frame",name:t,x:n,y:i,width:a,height:s,rotation:0,opacity:1,visible:!0,locked:!1,clip:l.clip??!0,cornerRadius:l.cornerRadius??0,fills:l.fill?[{type:"solid",color:l.fill}]:[],strokes:l.stroke?[{color:l.stroke,width:l.strokeWidth??1,align:"center"}]:[],effects:l.effects??[],children:r}}function rt(e,t,n){let i=t==="light"?"#FFFFFF":L.label,a=t==="light"?"#FFFFFFCC":L.secondaryLabel,s=n.width,r=[Q(`${e}-time`,"Time",27,16,56,"9:41","subheadline",i),ke(`${e}-island`,"Dynamic Island",(s-126)/2,11,126,37,{fill:L.label,cornerRadius:19}),Q(`${e}-5g`,"Network",s-87,17,25,"5G","caption2",i),ke(`${e}-battery`,"Battery",s-56,19,25,12,{stroke:a,strokeWidth:1,cornerRadius:3}),ke(`${e}-battery-fill`,"Battery level",s-54,21,20,8,{fill:i,cornerRadius:2}),ke(`${e}-battery-tip`,"Battery tip",s-30,22,2,6,{fill:a,cornerRadius:1})];for(let l=0;l<4;l+=1){let o=4+l*2;r.push(ke(`${e}-signal-${l}`,`Signal ${l+1}`,s-108+l*4,33-o,3,o,{fill:i,cornerRadius:1}))}return Ne(`${e}-root`,"Status Bar",0,0,s,n.statusBarHeight,r,{clip:!1})}function Ii(e,t="Title"){return Ne("nav-root","Navigation Bar",0,0,e.width,e.navBarHeight,[Q("nav-back","Back",10,4,26,"\u2039","title1",L.blue),Q("nav-title","Title",(e.width-120)/2,10,120,t,"headline",L.label,{align:"center"}),Q("nav-action","Action",e.width-80,10,64,"Done","body",L.blue,{align:"right"})],{fill:L.surfaceElevated})}function un(e){let t=["Home","Search","Favorites","Inbox","Profile"],n=e.tabBarTotalHeight,i=[zt("tab-top-line","Top separator",0,0,e.width,{color:L.separator,width:1})];return t.forEach((a,s)=>{let r=(s+.5)*e.width/t.length,o=s===0?L.blue:L.gray;i.push(ke(`tab-icon-${s}`,`${a} icon`,r-12,10,24,24,{fill:o,cornerRadius:6}),Q(`tab-label-${s}`,a,r-32,38,64,a,"caption2",o,{align:"center"}))}),i.push(ke("home-indicator","Home Indicator",(e.width-e.homeIndicatorWidth)/2,n-11,e.homeIndicatorWidth,e.homeIndicatorHeight,{fill:L.label,cornerRadius:3})),Ne("tab-root","Tab Bar",0,0,e.width,n,i,{fill:L.surfaceElevated,clip:!0})}function rr(e){let t=[{icon:L.blue,label:"Wi-Fi",value:"Home"},{icon:L.green,label:"Bluetooth",value:"On"},{icon:L.orange,label:"Cellular",value:"5G"},{icon:L.gray,label:"Personal Hotspot",value:"Off"}],n=e.width-32,i=[];return t.forEach((a,s)=>{let r=12+s*44,l=n-48;i.push(ke(`row-${s}-icon`,`${a.label} icon`,16,r,32,32,{fill:a.icon,cornerRadius:8}),ke(`row-${s}-glyph`,`${a.label} glyph`,25,r+9,14,14,{fill:"#FFFFFF",cornerRadius:4}),Q(`row-${s}-label`,a.label,60,r+5,l-60,a.label,"body",L.label),Q(`row-${s}-value`,`${a.label} value`,l-62,r+7,62,a.value,"subheadline",L.secondaryLabel,{align:"right"}),Q(`row-${s}-chevron`,"Chevron",n-26,r+3,16,"\u203A","title3",L.tertiaryLabel,{align:"center"})),s<t.length-1&&i.push(zt(`row-${s}-separator`,"Separator",60,r+43,n-76,{color:L.separator,width:1}))}),Ne("settings-card","General Settings Card",16,238,n,200,i,{fill:L.surface,cornerRadius:st.metrics.cardRadius,effects:st.elevation.card})}function or(e){let t=[{icon:L.blue,label:"Apple ID",value:"name@icloud.com"},{icon:L.gray,label:"Password & Security",value:""}],n=e.width-32,i=[];return t.forEach((a,s)=>{let r=12+s*44;i.push(ke(`account-${s}-icon`,`${a.label} icon`,16,r,32,32,{fill:a.icon,cornerRadius:8}),Q(`account-${s}-label`,a.label,60,r+5,n-160,a.label,"body",L.label),Q(`account-${s}-value`,a.value,n-138,r+7,92,a.value,"footnote",L.secondaryLabel,{align:"right"}),Q(`account-${s}-chevron`,"Chevron",n-26,r+3,16,"\u203A","title3",L.tertiaryLabel,{align:"center"})),s===0&&i.push(zt(`account-${s}-separator`,"Separator",60,r+43,n-76,{color:L.separator,width:1}))}),Ne("account-card","Account Card",16,480,n,100,i,{fill:L.surface,cornerRadius:st.metrics.cardRadius,effects:st.elevation.card})}function cr(e){let t=e.width,n=rt("screen-status","dark",e),i=un(e);i.y=e.height-e.tabBarTotalHeight;let a=Ne("search-field","Search Field",16,154,t-32,36,[hn("search-icon","Search glyph",12,11,13,13,{stroke:L.secondaryLabel,strokeWidth:1.5}),zt("search-icon-handle","Search handle",22,23,6,{color:L.secondaryLabel,width:1.5,rotation:45}),Q("search-placeholder","Placeholder",32,8,220,"Search settings","subheadline",L.secondaryLabel)],{fill:L.fill,cornerRadius:10});return Ne("screen-root","iOS Screen",0,0,t,e.height,[n,Q("screen-title","Large Title",16,72,t-50,"Settings","largeTitle",L.label),Q("screen-subtitle","Subtitle",16,124,t-50,"Manage your account and app preferences","subheadline",L.secondaryLabel),a,Q("section-general","Section Label",16,212,200,"GENERAL","caption1",L.secondaryLabel),rr(e),Q("section-account","Section Label",16,454,200,"ACCOUNT","caption1",L.secondaryLabel),or(e),i],{fill:L.background,clip:!0})}function dn(e,t,n,i,a,s){let r=e.width-32;return Ne(t,n,16,i,r,68,[Q(`${t}-label`,`${n} label`,0,0,r,a,"caption1",L.secondaryLabel),ke(`${t}-box`,`${n} box`,0,20,r,48,{fill:L.fill,cornerRadius:10}),Q(`${t}-placeholder`,`${n} placeholder`,14,34,r-28,s,"body",L.secondaryLabel)],{clip:!1})}function Ni(e,t,n,i){let a=e.width-32;return Ne(t,"Primary Button",16,n,a,52,[ke(`${t}-bg`,"Button background",0,0,a,52,{fill:L.blue,cornerRadius:12}),Q(`${t}-label`,"Button label",0,16,a,i,"body",L.onBlue,{align:"center"})],{clip:!1})}function lr(e){let t=e.width,n=e.height;return Ne("form-root","iOS Form Screen",0,0,t,n,[rt("form-status","dark",e),Q("form-title","Title",16,80,t-32,"Create account","largeTitle",L.label),Q("form-subtitle","Subtitle",16,130,t-32,"Start by adding your details.","subheadline",L.secondaryLabel),dn(e,"form-name","Name",180,"NAME","Your name"),dn(e,"form-email","Email",260,"EMAIL","you@example.com"),dn(e,"form-password","Password",340,"PASSWORD","At least 8 characters"),Ni(e,"form-cta",n-158,"Continue"),Q("form-footnote","Footnote",16,n-94,t-32,"By continuing you agree to the terms.","caption1",L.secondaryLabel,{align:"center"}),ke("form-home","Home Indicator",(t-e.homeIndicatorWidth)/2,n-18,e.homeIndicatorWidth,e.homeIndicatorHeight,{fill:L.label,cornerRadius:3})],{fill:L.background,clip:!0})}function dr(e){let t=e.width,n=e.height,i=un(e);i.y=n-e.tabBarTotalHeight;let s=[["A","Alex Morgan","Design review \xB7 2m"],["M","Mia Chen","Shared a file \xB7 18m"],["S","Sam Rivera","Lunch tomorrow? \xB7 1h"],["J","Jordan Lee","Quarterly plan \xB7 3h"],["T","Taylor Kim","Voice note \xB7 Yesterday"],["N","Noah Patel","Deployment complete \xB7 Yesterday"]].map(([r,l,o],c)=>{let d=226+c*72;return Ne(`list-row-${c}`,`List Row ${c+1}`,16,d,t-32,64,[hn(`list-avatar-${c}`,"Avatar",0,8,48,48,{fill:L.fill}),Q(`list-initial-${c}`,"Avatar initial",0,18,48,r,"title2",L.secondaryLabel,{align:"center"}),Q(`list-name-${c}`,"Name",64,8,t-140,l,"headline",L.label),Q(`list-preview-${c}`,"Preview",64,32,t-140,o,"subheadline",L.secondaryLabel),Q(`list-chevron-${c}`,"Chevron",t-80,20,16,"\u203A","title3",L.tertiaryLabel,{align:"center"})],{clip:!1})});return Ne("list-root","iOS List Screen",0,0,t,n,[rt("list-status","dark",e),Q("list-title","Title",16,72,t-32,"Inbox","largeTitle",L.label),Q("list-subtitle","Subtitle",16,120,t-32,"6 conversations","subheadline",L.secondaryLabel),Ne("list-search","Search Field",16,154,t-32,36,[hn("list-search-icon","Search glyph",12,11,13,13,{stroke:L.secondaryLabel,strokeWidth:1.5}),Q("list-search-placeholder","Placeholder",32,8,220,"Search","subheadline",L.secondaryLabel)],{fill:L.fill,cornerRadius:10}),...s,i],{fill:L.background,clip:!0})}function hr(e){let t=e.width,n=e.height,i=Ii(e,"Details");return Ne("detail-root","iOS Detail Screen",0,0,t,n,[rt("detail-status","dark",e),i,ke("detail-hero","Cover image",0,98,t,240,{fill:L.fill}),Q("detail-hero-label","Cover label",16,200,t-32,"Cover image","headline",L.secondaryLabel,{align:"center"}),Q("detail-title","Title",16,360,t-32,"A calmer way to start the day","title1",L.label),Q("detail-body","Body",16,404,t-32,"A short description of the story, collection or product. Replace this copy with real content.","body",L.secondaryLabel),Q("detail-meta","Meta",16,478,t-32,"5 min read \xB7 Today","caption1",L.secondaryLabel),Ni(e,"detail-cta",n-158,"Read story"),ke("detail-home","Home Indicator",(t-e.homeIndicatorWidth)/2,n-18,e.homeIndicatorWidth,e.homeIndicatorHeight,{fill:L.label,cornerRadius:3})],{fill:L.background,clip:!0})}function ur(e){return rt("tpl-status","dark",e)}function pr(e){return rt("tpl-status-light","light",e)}function mr(e){return Ii(e)}function fr(e){return un(e)}var gr={"ios-screen":cr,"ios-form-screen":lr,"ios-list-screen":dr,"ios-detail-screen":hr,"ios-status-bar":ur,"ios-status-bar-light":pr,"ios-nav-bar":mr,"ios-tab-bar":fr},Se=_e(Ve),gt=[{id:"ios-screen",name:"iOS \u5C4F\u5E55",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F + \u7075\u52A8\u5C9B\u3001\u5927\u6807\u9898\u3001\u641C\u7D22\u3001\u8BBE\u7F6E\u5361\u7247\u3001\u6807\u7B7E\u680F\u3001Home Indicator",system:"iOS HIG",category:"page",width:Se.width,height:Se.height,deviceAware:!0},{id:"ios-form-screen",name:"iOS \u8868\u5355\u9875",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5927\u6807\u9898\u3001\u8F93\u5165\u5B57\u6BB5\u3001\u4E3B\u6309\u94AE\u3001Home Indicator",system:"iOS HIG",category:"page",width:Se.width,height:Se.height,deviceAware:!0},{id:"ios-list-screen",name:"iOS \u5217\u8868\u9875",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5927\u6807\u9898\u3001\u641C\u7D22\u3001\u5217\u8868\u884C\u3001\u6807\u7B7E\u680F",system:"iOS HIG",category:"page",width:Se.width,height:Se.height,deviceAware:!0},{id:"ios-detail-screen",name:"iOS \u8BE6\u60C5\u9875",description:"iPhone 16 393\xD7852\uFF1A\u72B6\u6001\u680F\u3001\u5BFC\u822A\u680F\u3001\u5C01\u9762\u533A\u3001\u6807\u9898\u6B63\u6587\u3001\u5E95\u90E8\u6309\u94AE",system:"iOS HIG",category:"page",width:Se.width,height:Se.height,deviceAware:!0},{id:"ios-status-bar",name:"iOS \u72B6\u6001\u680F",description:"\u6807\u51C6 390/393\xD754 \u72B6\u6001\u680F\uFF1A\u65F6\u95F4\u3001\u7075\u52A8\u5C9B\u3001\u4FE1\u53F7\u30015G\u3001\u7535\u91CF\uFF08\u900F\u660E\u80CC\u666F\uFF0C\u6DF1\u8272\u56FE\u6807\uFF09",system:"iOS HIG",category:"system",width:Se.width,height:Se.statusBarHeight,deviceAware:!0},{id:"ios-status-bar-light",name:"iOS \u72B6\u6001\u680F\uFF08\u6DF1\u8272\u9875\u9762\uFF09",description:"\u6807\u51C6\u72B6\u6001\u680F\u7684\u6D45\u8272\u56FE\u6807\u7248\u672C\uFF0C\u7528\u4E8E\u6DF1\u8272\u80CC\u666F\uFF08\u900F\u660E\u80CC\u666F\uFF09",system:"iOS HIG",category:"system",width:Se.width,height:Se.statusBarHeight,deviceAware:!0},{id:"ios-nav-bar",name:"iOS \u5BFC\u822A\u680F",description:"iOS \u5BFC\u822A\u680F\uFF1A\u8FD4\u56DE\u3001\u6807\u9898\u3001\u53F3\u4FA7\u52A8\u4F5C",system:"iOS HIG",category:"system",width:Se.width,height:Se.navBarHeight,deviceAware:!0},{id:"ios-tab-bar",name:"iOS \u6807\u7B7E\u680F",description:"iOS \u6807\u7B7E\u680F\uFF1A5 \u4E2A Tab + Home Indicator",system:"iOS HIG",category:"system",width:Se.width,height:Se.tabBarTotalHeight,deviceAware:!0}];function Ci(e,t={}){let n=gt.find(c=>c.id===e),i=gr[e];if(!n||!i)throw new Error(`unknown canvas template "${e}"`);let a=_e(t.device),s=i(a),r=`tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,l=0,o=c=>(c.id=`${r}_${(++l).toString(36)}`,Array.isArray(c.children)&&c.children.forEach(o),c);return o(s),s.name=n.name,s.rotation=0,{node:s,template:{...n,width:s.width,height:s.height,device:a.id}}}function Mi(e){let t={};for(let n of e.matchAll(/([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g))t[n[1]]=n[3]??n[4]??"";return t}function zi(e){let t=(e.viewBox??"").trim().split(/[\s,]+/).map(Number);return t.length!==4||t.some(n=>!Number.isFinite(n))||t[2]<=0||t[3]<=0?null:{x:t[0],y:t[1],width:t[2],height:t[3]}}function yr(e,t){let n=(i,a=0)=>{let s=Number(t[i]);return Number.isFinite(s)?s:a};if(e==="rect"){let i=n("x"),a=n("y"),s=n("width"),r=n("height");return s<=0||r<=0?null:`M${i} ${a}h${s}v${r}h${-s}z`}if(e==="circle"||e==="ellipse"){let i=n("cx"),a=n("cy"),s=n(e==="circle"?"r":"rx"),r=n(e==="circle"?"r":"ry");return s<=0||r<=0?null:`M${i-s} ${a}a${s} ${r} 0 1 0 ${s*2} 0a${s} ${r} 0 1 0 ${-s*2} 0z`}if(e==="line")return`M${n("x1")} ${n("y1")}L${n("x2")} ${n("y2")}`;if(e==="polyline"||e==="polygon"){let i=(t.points??"").trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);if(i.length<4)return null;let a=[];for(let s=0;s+1<i.length;s+=2)a.push(`${i[s]} ${i[s+1]}`);return`M${a.join("L")}${e==="polygon"?"Z":""}`}return null}function Ai(e){let t=[],n=[],i=/<svg\b([^>]*)>/i.exec(e),a=i?Mi(i[1]??""):{},s=zi(a);/<text\b|<image\b|<filter\b|<mask\b|<clipPath\b/i.test(e)&&t.push("\u5DF2\u8DF3\u8FC7 text/image/filter/mask/clipPath"),(/<g\b[^>]*\btransform\s*=/i.test(e)||/<path\b[^>]*\btransform\s*=/i.test(e))&&t.push("\u5DF2\u8DF3\u8FC7 transform\uFF08\u57FA\u7840\u5BFC\u5165\u6682\u4E0D\u5C55\u5F00\u5206\u7EC4\u53D8\u6362\uFF09");let r=0;for(let l of e.matchAll(/<(path|rect|circle|ellipse|line|polyline|polygon)\b([^>]*)\/?>/gi)){r+=1;let o=l[1].toLowerCase(),c=Mi(l[2]??""),d=o==="path"?c.d:yr(o,c);if(!d){t.push(`\u7B2C ${r} \u4E2A ${o} \u65E0\u6CD5\u8F6C\u6362\u4E3A path\uFF0C\u5DF2\u8DF3\u8FC7`);continue}let h;try{h=et(d)}catch(S){t.push(`\u7B2C ${r} \u4E2A path \u65E0\u6CD5\u89E3\u6790\uFF0C\u5DF2\u8DF3\u8FC7\uFF1A${S instanceof Error?S.message:String(S)}`);continue}let p=zi(c)??{x:h.bounds.minX,y:h.bounds.minY,width:Math.max(1,h.bounds.maxX-h.bounds.minX),height:Math.max(1,h.bounds.maxY-h.bounds.minY)},b=c.fill&&c.fill!=="none"&&/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(c.fill)?c.fill:null,x=c.stroke&&c.stroke!=="none"&&/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(c.stroke)?c.stroke:null,E=Number(c["stroke-width"]);n.push({name:c.id||`Path ${r}`,d,viewBox:p,width:s?.width??p.width,height:s?.height??p.height,fills:b?[{type:"solid",color:b}]:[],strokes:x?[{color:x,width:Number.isFinite(E)&&E>0?E:1,align:"center"}]:[],fillRule:c["fill-rule"]==="evenodd"?"evenodd":"nonzero"})}return n.length||t.push("\u6CA1\u6709\u627E\u5230\u53EF\u5BFC\u5165\u7684 <path>"),{paths:n,warnings:t}}function Fi(e){return e*Math.PI/180}function Ze(e){return{x:e.absX+e.width/2,y:e.absY+e.height/2}}function pn(e,t){let n=Ze(e),i=-Fi(e.rotation||0),a=t.x-n.x,s=t.y-n.y;return{x:a*Math.cos(i)-s*Math.sin(i)+e.width/2,y:a*Math.sin(i)+s*Math.cos(i)+e.height/2}}function me(e,t){let n=Ze(e),i=Fi(e.rotation||0),a=t.x-e.width/2,s=t.y-e.height/2;return{x:a*Math.cos(i)-s*Math.sin(i)+n.x,y:a*Math.sin(i)+s*Math.cos(i)+n.y}}function yt(e,t){if(!e||e.visible===!1)return!1;if(e.type==="group")return(e.children??[]).some(i=>yt(i,t));let n=pn(e,t);return n.x>=0&&n.y>=0&&n.x<=e.width&&n.y<=e.height}function xr(e){return{x:e.absX,y:e.absY,width:e.width,height:e.height}}function Pi(e,t){return!(e.x+e.width<t.x||t.x+t.width<e.x||e.y+e.height<t.y||t.y+t.height<e.y)}function We(e){if(!e.length)return null;let t=1/0,n=1/0,i=-1/0,a=-1/0;for(let s of e)t=Math.min(t,s.x),n=Math.min(n,s.y),i=Math.max(i,s.x+s.width),a=Math.max(a,s.y+s.height);return{x:t,y:n,width:i-t,height:a-n}}function mn(e){return[me(e,{x:0,y:0}),me(e,{x:e.width,y:0}),me(e,{x:e.width,y:e.height}),me(e,{x:0,y:e.height})]}function ue(e,t){return{x:t.x*e.zoom+e.x,y:t.y*e.zoom+e.y}}function Te(e,t){return{x:(t.x-e.x)/e.zoom,y:(t.y-e.y)/e.zoom}}function Ti(e,t){let n={nw:{x:0,y:0},n:{x:.5,y:0},ne:{x:1,y:0},e:{x:1,y:.5},se:{x:1,y:1},s:{x:.5,y:1},sw:{x:0,y:1},w:{x:0,y:.5}},i={};for(let[a,s]of Object.entries(n)){let r=me(e,{x:s.x*e.width,y:s.y*e.height});i[a]=ue(t,r)}return i}function Di(e,t){let n=me(e,{x:e.width/2,y:-22/t.zoom});return ue(t,n)}function xt(e,t,n){return Math.min(n,Math.max(t,e))}function Li(e){return e?.roots?.length?We(e.roots.filter(t=>t.visible!==!1).map(xr))??{x:0,y:0,width:1,height:1}:{x:0,y:0,width:1,height:1}}var Me=class extends Error{constructor(t,n,i,a,s,r){super(t),this.name="ApiError",this.status=n,this.code=i,this.details=a,this.doc=s,this.revision=r}};function br(e){let t=typeof document<"u"?document.baseURI:void 0;try{let n=new URL(e,t??"http://127.0.0.1/");return n.origin==="null"?e:n.pathname+n.search}catch{return e}}function bt(e){return br(`dsh-canvas/api/${e}`)}async function De(e,t={}){let n=await fetch(bt(e),{method:t.method??"GET",headers:t.body===void 0?{accept:"application/json"}:{accept:"application/json","content-type":"application/json"},body:t.body===void 0?void 0:JSON.stringify(t.body),signal:t.signal,credentials:"same-origin"}),i=null,a=await n.text();try{i=a?JSON.parse(a):null}catch{throw new Me(`unexpected response from canvas host (${n.status})`,n.status,"bad-response")}if(!n.ok||i?.ok===!1)throw new Me(i?.message??i?.error??`canvas request failed (${n.status})`,n.status,i?.error??"request-failed",i?.details,i?.doc,i?.revision);return i}function wt(e,t,n){let i=new URLSearchParams({sessionId:e});return t&&i.set("name",t),De(`state?${i}`,{signal:n})}function fn(e,t,n,i,a){return De("doc",{method:"PUT",body:{sessionId:e,name:t,baseRevision:n,doc:i},signal:a})}function Hi(e,t,n){return De("doc/rename",{method:"POST",body:{sessionId:e,from:t,to:n}})}function Oi(e,t){return De("doc/delete",{method:"POST",body:{sessionId:e,name:t}})}function Bi(e,t,n={}){return De("audit",{method:"POST",body:{sessionId:e,name:t,...n}})}function ji(e){let t=new URLSearchParams({sessionId:e});return De(`image/capabilities?${t}`)}function Yi(e,t,n){return De("image/generate",{method:"POST",body:{sessionId:e,name:t,prompt:n}})}function Xi(e,t,n,i){return De("selection",{method:"POST",body:{sessionId:e,name:t,ids:n,pageId:i}}).catch(()=>{})}function gn(e,t,n,i){return De("export",{method:"POST",body:{sessionId:e,name:t,kind:n,data:i}})}function Ge(e,t,n){let i=new URLSearchParams({sessionId:e,name:t,asset:n});return bt(`asset?${i}`)}function yn(e,t){let n=new URLSearchParams({sessionId:e,asset:t});return bt(`font?${n}`)}function Vi(e){return new Promise((t,n)=>{let i=new FileReader;i.onload=()=>{let a=String(i.result??""),s=a.indexOf(",");t(s===-1?"":a.slice(s+1))},i.onerror=()=>n(i.error??new Error("read failed")),i.readAsDataURL(e)})}function _i(e){let t=e.lastIndexOf(".");return t===-1?"":e.slice(t).toLowerCase()}async function xn(e,t){let n=_i(t.name);if(![".png",".jpg",".jpeg",".webp",".gif"].includes(n))throw new Error("\u53EA\u652F\u6301 png/jpeg/webp/gif \u56FE\u7247");let a=await Vi(t);return De("asset",{method:"POST",body:{sessionId:e,ext:n,data:a}})}async function Wi(e,t,n){let i=_i(t.name);if(![".woff2",".woff",".ttf",".otf"].includes(i))throw new Error("\u53EA\u652F\u6301 woff2/woff/ttf/otf \u5B57\u4F53");let s=await Vi(t);return De("font",{method:"POST",body:{sessionId:e,ext:i,data:s,...n}})}async function Gi(e,t,n,i){let a=500;for(;!i.aborted;){try{let s=new URLSearchParams({sessionId:e,name:t}),r=await fetch(bt(`events?${s}`),{headers:{accept:"text/event-stream"},credentials:"same-origin",signal:i});if(!r.ok||!r.body)throw new Error(`event stream failed (${r.status})`);a=500;let l=r.body.getReader(),o=new TextDecoder,c="";for(;!i.aborted;){let{done:d,value:h}=await l.read();if(d)break;c+=o.decode(h,{stream:!0});let p=c.indexOf(`

`);for(;p!==-1;){let b=c.slice(0,p);c=c.slice(p+2);for(let x of b.split(`
`))if(x.startsWith("data: "))try{n(JSON.parse(x.slice(6)))}catch{}p=c.indexOf(`

`)}}}catch{if(i.aborted)return}await new Promise(s=>setTimeout(s,a)),a=Math.min(a*2,5e3)}}function Le(e){try{return fetch(bt("diag"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(e),credentials:"same-origin",keepalive:!0}).catch(()=>{})}catch{return Promise.resolve(void 0)}}var sa="main";function je(e){return structuredClone(e)}function be(e,t){for(let n of e??[]){if(n.id===t)return n;let i=be(n.children,t);if(i)return i}return null}function wn(e,t,n=null){for(let i of e??[]){if(i.id===t)return n;let a=wn(i.children,t,i);if(a!==void 0)return a}}function la(e,t){let n=e.findIndex(i=>i.id===t);if(n!==-1)return e.splice(n,1)[0];for(let i of e){let a=la(i.children??[],t);if(a)return a}return null}function ra(e,t){let n=je(e),i=a=>{let s=t(a.id);a.id=s,Array.isArray(a.children)&&a.children.forEach(i)};if(i(n),n.type==="instance"&&n.overrides){let a={};for(let[s,r]of Object.entries(n.overrides))a[t(s)]=r;n.overrides=a}return n}var At=class{constructor({sessionId:t,inputActions:n,onToast:i}){this.sessionId=t,this.inputActions=n,this.onToast=i??(()=>{}),this.listeners=new Set,this.version=0,this.measure=tt(),this.history=new Nt(100),this.saveTimer=null,this.selectionTimer=null,this.eventsAbort=null,this.pollTimer=null,this.mounted=!1,this.loadingAbort=null,this.readyPromise=new Promise(a=>{this.resolveReady=a}),this.fontAssets=new Map,this.state={ready:!1,error:null,loading:!0,docs:[],name:sa,doc:null,revision:null,path:"",pageId:null,selection:[],primaryKey:null,viewport:{x:40,y:40,zoom:1},tool:"pointer",panel:"layers",inspectorOpen:!0,dirty:!1,saving:!1,savedAt:null,conflict:null,notice:null,editingText:null,commentDraft:null,enteredInstance:null,componentMode:null,crop:null,scene:null,sceneIssues:[],showComments:!0,fontVersion:0,zoomLabel:"100%",historyVersion:0,foundation:{device:Ve,preset:ft},audit:null,imageCapabilities:null,imageGenerating:!1}}subscribe=t=>(this.listeners.add(t),()=>this.listeners.delete(t));getVersion=()=>this.version;emit(){this.version+=1;for(let t of this.listeners)t()}set(t,n=!0){Object.assign(this.state,t),n&&this.emit()}toast(t,n="info"){this.state.notice={text:t,kind:n,at:Date.now()},this.emit(),this.onToast?.({text:t,kind:n}),clearTimeout(this.noticeTimer),this.noticeTimer=setTimeout(()=>{this.state.notice=null,this.emit()},3200)}async mount(){this.mounted||(this.mounted=!0,await this.bootstrap())}unmount(){this.mounted=!1,clearTimeout(this.saveTimer),clearTimeout(this.selectionTimer),this.eventsAbort?.abort(),clearInterval(this.pollTimer),this.loadingAbort?.abort(),this.flush().catch(()=>{})}async bootstrap(){this.state.loading=!0,this.emit();try{let t=await wt(this.sessionId,void 0);this.applyState(t,{resetHistory:!0}),this.state.ready=!0,this.state.loading=!1,this.emit(),await this.ensureFonts(),this.connectEvents(),this.startPolling()}catch(t){this.state.loading=!1,this.state.ready=!1,this.state.error=t instanceof Me?t.message:String(t?.message??t),this.emit()}finally{this.resolveReady?.()}}async focusNode(t={}){if(await this.readyPromise,!this.state.ready)return!1;t.doc&&t.doc!==this.state.name&&await this.loadDoc(t.doc),t.page&&Jn(this.state.doc,t.page)&&(this.state.pageId=t.page,this.rebuild());let n=t.node?this.findSceneNode(t.node):null;return t.node&&!n?(this.toast("\u753B\u5E03\u4E2D\u627E\u4E0D\u5230\u8FD9\u4E2A\u5143\u7D20\uFF0C\u53EF\u80FD\u5DF2\u88AB\u5220\u9664"),!1):(n&&(n.instanceId&&(this.state.enteredInstance=n.instanceId),this.state.inspectorOpen=!0,this.setSelection([n.key]),this.zoomToSelection()),this.emit(),!0)}applyState(t,{resetHistory:n=!1}={}){let i=Xe(t.doc);this.state.doc=i,this.state.name=t.name??sa,this.state.revision=t.revision??null,this.state.path=t.path??"",this.state.docs=t.docs??[],this.state.pageId=i.pages[0]?.id??null,this.state.selection=[...new Set(t.selection?.ids??[])],this.state.primaryKey=this.state.selection[0]??null,this.state.conflict=null,this.state.dirty=!1,this.state.error=null,n&&this.history.reset(i),this.rebuild()}rebuild(){if(this.state.doc){try{let t=tn(this.state.doc,{pageId:this.state.pageId,mode:this.state.componentMode?"component":"design",componentId:this.state.componentMode?.componentId,measureText:this.measure});It(t),this.state.scene=t,this.state.sceneIssues=t.issues??[];let n=new Set(this.state.selection.filter(i=>t.byKey.has(i)));n.size!==this.state.selection.length&&(this.state.selection=[...n],this.state.primaryKey=this.state.selection[0]??null)}catch(t){this.state.scene=null,this.state.error=`\u753B\u5E03\u6E32\u67D3\u5931\u8D25\uFF1A${String(t?.message??t)}`}this.state.historyVersion+=1}}findSceneNode(t){return this.state.scene?.byKey.get(t)??null}selectedNodes(){return this.state.selection.map(t=>this.findSceneNode(t)).filter(Boolean)}primaryNode(){return this.state.primaryKey?this.findSceneNode(this.state.primaryKey):null}setSelection(t,n){this.state.selection=[...new Set(t)],this.state.primaryKey=n??this.state.selection[0]??null,this.state.editingText=null,this.emit(),this.queueSelectionPost()}toggleSelection(t){let n=this.state.selection.includes(t);this.setSelection(n?this.state.selection.filter(i=>i!==t):[...this.state.selection,t],t)}clearSelection(){this.setSelection([],null)}queueSelectionPost(){clearTimeout(this.selectionTimer),this.selectionTimer=setTimeout(()=>{let t=new Set;for(let n of this.state.selection){let i=this.findSceneNode(n);t.add(i?.instanceId??i?.id??n)}Xi(this.sessionId,this.state.name,[...t],this.state.pageId)},120)}setTool(t){this.state.tool=t,t!=="comment"&&(this.state.commentDraft=null),this.emit()}setPanel(t){this.state.panel=t,this.emit()}setViewport(t){this.state.viewport=t,this.emit()}zoomAt(t,n){let i=this.state.viewport,a=Te(i,t),s=xt(i.zoom*n,.02,32);this.state.viewport={zoom:s,x:t.x-a.x*s,y:t.y-a.y*s},this.emit()}zoomToFit(t=48){let n=this.state.scene?Li(this.state.scene):null;n&&this.zoomToRect(n,t)}zoomToSelection(t=64){let n=this.selectedNodes();if(!n.length){this.zoomToFit(t);return}let i=We(n.map(a=>({x:a.absX,y:a.absY,width:a.width,height:a.height})));i&&this.zoomToRect(i,t)}zoomToRect(t,n=48){let i=this.viewportSize(),a=Math.max(1,t.width),s=Math.max(1,t.height),r=xt(Math.min((i.width-n*2)/a,(i.height-n*2)/s),.02,8);this.state.viewport={zoom:r,x:i.width/2-(t.x+a/2)*r,y:i.height/2-(t.y+s/2)*r},this.emit()}viewportSize(){return this.canvasSize??{width:900,height:600}}async loadDoc(t,{resetHistory:n=!0}={}){await this.flush();try{let i=await wt(this.sessionId,t);this.applyState(i,{resetHistory:n}),this.emit(),await this.ensureFonts(),this.connectEvents(),this.startPolling()}catch(i){this.toast(i instanceof Me?i.message:String(i),"error")}}async createDoc(t){if(!/^[a-z0-9][a-z0-9-_]{0,63}$/.test(t)){this.toast("\u6587\u6863\u540D\u53EA\u80FD\u662F\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001- \u548C _","error");return}try{await this.flush();let n=Wn("\u65B0\u753B\u5E03");n.pages[0].name="Page 1";let i=await fn(this.sessionId,t,null,n);this.state.revision=i.revision,await this.loadDoc(t),this.toast("\u5DF2\u521B\u5EFA\u753B\u5E03")}catch(n){this.toast(n instanceof Me?n.message:String(n),"error")}}async renameDoc(t,n=this.state.name){if(!/^[a-z0-9][a-z0-9-_]{0,63}$/.test(t)){this.toast("\u6587\u6863\u540D\u53EA\u80FD\u662F\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001- \u548C _","error");return}if(t===n){this.toast("\u540D\u79F0\u6CA1\u6709\u53D8\u5316");return}try{if(await this.flush(),this.state.dirty||this.state.saving){this.toast("\u8BF7\u5148\u89E3\u51B3\u753B\u5E03\u4FDD\u5B58\u51B2\u7A81\uFF0C\u518D\u91CD\u547D\u540D","error");return}let i=this.state.name,a=await Hi(this.sessionId,n,t),s=a.name??t;if(this.state.docs=a.docs??this.state.docs,n!==i){this.emit(),this.toast("\u5DF2\u91CD\u547D\u540D\u753B\u5E03");return}await this.loadDoc(s);let r=this.state.doc;r&&(!r.title||r.title==="\u4E3B\u753B\u5E03"||r.title==="\u65B0\u753B\u5E03"||r.title===i)&&r.title!==s&&(r.title=s,this.state.dirty=!0,this.state.docs=(this.state.docs??[]).map(o=>o.name===s?{...o,title:s}:o),this.scheduleSave()),this.toast("\u5DF2\u91CD\u547D\u540D\u753B\u5E03")}catch(i){this.toast(i instanceof Me?i.message:String(i),"error")}}async deleteDoc(){try{if(await this.flush(),this.state.dirty||this.state.saving){this.toast("\u8BF7\u5148\u89E3\u51B3\u753B\u5E03\u4FDD\u5B58\u51B2\u7A81\uFF0C\u518D\u5220\u9664","error");return}let t=await Oi(this.sessionId,this.state.name),n=t.name??"main";this.state.docs=t.docs??[],await this.loadDoc(n),this.toast("\u5DF2\u5220\u9664\u753B\u5E03")}catch(t){this.toast(t instanceof Me?t.message:String(t),"error")}}async flush(){if(clearTimeout(this.saveTimer),!this.state.doc||!this.state.dirty||this.state.saving)return;let t=this.state.revision,n=je(this.state.doc);this.state.saving=!0,this.emit();let i=JSON.stringify(n);try{let a=await fn(this.sessionId,this.state.name,t,n);this.state.revision=a.revision,this.state.path=a.path,this.state.savedAt=Date.now(),JSON.stringify(this.state.doc)===i?this.state.dirty=!1:(this.state.dirty=!0,clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.flush(),250))}catch(a){a instanceof Me&&a.status===409?this.state.conflict={revision:a.revision,doc:a.doc?Xe(a.doc):null,message:"\u753B\u5E03\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"}:this.toast(a instanceof Me?a.message:String(a),"error")}finally{this.state.saving=!1,this.emit()}}scheduleSave(){this.state.dirty=!0,clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.flush(),400),this.emit()}startPolling(){clearInterval(this.pollTimer),this.pollTimer=setInterval(()=>{!this.mounted||!this.state.ready||this.state.saving||this.pollRemote().catch(()=>{})},3e3)}async pollRemote(){let t=await wt(this.sessionId,this.state.name);if(!(!t||t.revision===this.state.revision)){if(this.state.dirty){this.state.conflict={revision:t.revision,doc:t.doc?Xe(t.doc):null,message:"\u753B\u5E03\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"},this.emit();return}this.applyState(t,{resetHistory:!1}),this.emit()}}connectEvents(){this.eventsAbort?.abort();let t=new AbortController;this.eventsAbort=t,Gi(this.sessionId,this.state.name,n=>{if(n.type==="doc-changed"&&n.revision!==this.state.revision&&n.source!=="client"){if(this.state.dirty||this.state.saving){this.state.conflict={revision:n.revision,message:"\u753B\u5E03\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"},this.emit();return}this.reloadFromServer(!1)}},t.signal)}async reloadFromServer(t=!0){try{let n=await wt(this.sessionId,this.state.name),i=this.history;this.applyState(n,{resetHistory:!1}),t||i.reset(n.doc),this.emit()}catch(n){this.toast(n instanceof Me?n.message:String(n),"error")}}resolveConflict(t){let n=this.state.conflict;if(n){if(t&&!n.doc){this.state.conflict=null,this.reloadFromServer(!1);return}if(t&&n.doc){this.state.doc=Xe(n.doc),this.state.revision=n.revision,this.state.conflict=null,this.state.dirty=!1,this.history.reset(this.state.doc),this.rebuild(),this.emit(),this.toast("\u5DF2\u52A0\u8F7D\u6700\u65B0\u753B\u5E03");return}this.state.revision=n.revision,this.state.conflict=null,this.state.dirty=!0,this.flush()}}mutate(t,{commit:n=!0,select:i,label:a}={}){if(this.state.doc){try{t(this.state.doc)}catch(s){this.toast(String(s?.message??s),"error");return}i&&(this.state.selection=[...new Set(i)],this.state.primaryKey=this.state.selection[0]??null),this.rebuild(),this.emit(),n&&(this.commit(a),this.scheduleSave(),this.queueSelectionPost())}}commit(){this.state.doc&&this.history.commit(this.state.doc),this.state.historyVersion+=1,this.emit()}updateNode(t,n,i={}){this.mutate(a=>{let s=be([...a.pages.flatMap(r=>r.children),...a.components.map(r=>r.root)],t);if(!s)throw new Error(`\u627E\u4E0D\u5230\u8282\u70B9 ${t}`);Object.assign(s,n)},i)}updateSelected(t,n={}){let i=this.selectedNodes().filter(a=>a.editable);i.length&&this.mutate(a=>{for(let s of i){let r=be([...a.pages.flatMap(l=>l.children),...a.components.map(l=>l.root)],s.sourceId);r&&Object.assign(r,t)}},n)}updateNodeBySource(t,n,i={}){this.updateNode(t,n,i)}addNode(t,n,i){let a=t.id??le(t.type==="instance"?"i":"n"),s={name:t.name??Sr(t.type),x:0,y:0,width:120,height:120,rotation:0,opacity:1,visible:!0,locked:!1,...t,id:a};return s.type!=="frame"&&s.type!=="group"&&s.type!=="instance"&&delete s.children,this.mutate(r=>{let l=r.pages,o=l.find(d=>d.id===this.state.pageId)??l[0],c=null;n&&(c=be(l.flatMap(d=>d.children),n),c&&(o=c)),c?(c.children=c.children??[],c.children.splice(i??c.children.length,0,s)):(o.children=o.children??[],o.children.push(s))},{select:[a]}),s}createShapeAt(t,n){let i={frame:{name:"Frame",width:320,height:480,fills:[{type:"solid",color:"#FFFFFF"}],strokes:[],effects:[],cornerRadius:0,clip:!0,children:[]},rect:{name:"Rectangle",width:120,height:120,fills:[{type:"solid",color:"#D9D9D9"}],strokes:[],effects:[],cornerRadius:0},ellipse:{name:"Ellipse",width:120,height:120,fills:[{type:"solid",color:"#D9D9D9"}],strokes:[],effects:[],cornerRadius:0},text:{name:"Text",width:200,height:28,text:"Text",font:{family:"system-ui",weight:400,style:"normal",size:16,lineHeight:1.4,letterSpacing:0},align:"left",verticalAlign:"top",fills:[{type:"solid",color:"#111111"}],effects:[],autoHeight:!0},line:{name:"Line",width:160,height:0,strokes:[{color:"#111111",width:1,align:"center"}]}}[t];if(!i)return;let a=this.addNode({type:t,...i,x:n.x,y:n.y,rotation:0,opacity:1,visible:!0,locked:!1},null);return a&&(this.setTool("pointer"),a.type==="text"&&this.beginTextEdit(a.id)),a}deleteSelection(){let t=this.selectedNodes().filter(a=>a.editable&&!a.isInstanceRoot).map(a=>a.sourceId),n=this.selectedNodes().filter(a=>a.isInstanceRoot).map(a=>a.sourceId),i=[...new Set([...t,...n])];i.length&&this.mutate(a=>{for(let s of i)for(let r of a.pages)la(r.children,s)},{select:[]})}duplicateSelection(){let t=this.selectedNodes().filter(i=>i.editable&&!i.isInstanceRoot);if(!t.length)return;let n=[];this.mutate(i=>{for(let a of t){let s=this.findDocParent(i,a.sourceId),r=s?s.children:i.pages.find(c=>c.id===this.state.pageId)?.children;if(!r)continue;let l=be(r,a.sourceId);if(!l)continue;let o=ra(l,c=>le("n"));o.x+=10,o.y+=10,r.push(o),n.push(o.id)}},{select:n})}findDocParent(t,n){for(let i of t.pages){let a=wn(i.children,n,null);if(a!==void 0)return a}}copySelection(){let t=this.selectedNodes().filter(n=>n.editable);t.length&&(this.clipboard=t.map(n=>je(n.sourceNode)),this.toast(`\u5DF2\u590D\u5236 ${t.length} \u4E2A\u56FE\u5C42`))}paste(){if(!this.clipboard?.length)return;let t=[];this.mutate(n=>{let i=n.pages.find(a=>a.id===this.state.pageId)??n.pages[0];for(let a of this.clipboard){let s=ra(a,()=>le("n"));s.x+=20,s.y+=20,i.children.push(s),t.push(s.id)}},{select:t})}groupSelection(){let t=this.selectedNodes().filter(s=>s.editable&&!s.isInstanceRoot);if(t.length<2)return;let n=t[0].parent?.id??null;if(!t.every(s=>(s.parent?.id??null)===n)){this.toast("\u53EA\u6709\u540C\u4E00\u7236\u7EA7\u7684\u56FE\u5C42\u53EF\u4EE5\u6210\u7EC4");return}let i=We(t.map(s=>({x:s.absX,y:s.absY,width:s.width,height:s.height}))),a=le("g");this.mutate(s=>{let r=n?be(s.pages.flatMap(x=>x.children),n):s.pages.find(x=>x.id===this.state.pageId);if(!r)return;let l=r.children,o=new Set(t.map(x=>x.sourceId)),c=0,d=[];for(let x=l.length-1;x>=0;x-=1)o.has(l[x].id)&&d.unshift(l.splice(x,1)[0]);let h=t[0].parent?{x:t[0].parent.absX,y:t[0].parent.absY}:{x:0,y:0},p=i.x-h.x,b=i.y-h.y;for(let x of d)x.x-=p-c,x.y-=b-originY;l.push({id:a,type:"group",name:"Group",x:p,y:b,width:i.width,height:i.height,rotation:0,opacity:1,visible:!0,locked:!1,children:d})},{select:[a]})}ungroupSelection(){let t=this.selectedNodes().filter(i=>i.sourceNode?.type==="group"&&i.editable);if(!t.length)return;let n=[];this.mutate(i=>{for(let a of t){let s=this.findDocParent(i,a.sourceId),r=s?s.children:i.pages.find(d=>d.id===this.state.pageId)?.children;if(!r)continue;let l=r.findIndex(d=>d.id===a.sourceId);if(l===-1)continue;let[o]=r.splice(l,1),c=l;for(let d of o.children??[])d.x+=o.x,d.y+=o.y,r.splice(c,0,d),c+=1,n.push(d.id)}},{select:n})}reorder(t){let n=this.selectedNodes().filter(i=>i.editable);n.length&&this.mutate(i=>{for(let a of n){let s=this.findDocParent(i,a.sourceId),r=s?s.children:i.pages.find(c=>c.id===this.state.pageId)?.children;if(!r)continue;let l=r.findIndex(c=>c.id===a.sourceId);if(l===-1)continue;let[o]=r.splice(l,1);t==="front"?r.push(o):t==="back"?r.unshift(o):t==="forward"?r.splice(Math.min(r.length,l+1),0,o):r.splice(Math.max(0,l-1),0,o)}},{select:this.state.selection})}align(t){let n=this.selectedNodes().filter(a=>a.editable&&!a.isInstanceRoot);if(n.length<2)return;let i=We(n.map(a=>({x:a.absX,y:a.absY,width:a.width,height:a.height})));this.mutate(a=>{for(let s of n){let r=be(a.pages.flatMap(l=>l.children),s.sourceId);r&&(t==="left"?r.x+=i.x-s.absX:t==="right"?r.x+=i.x+i.width-(s.absX+s.width):t==="centerX"?r.x+=i.x+i.width/2-(s.absX+s.width/2):t==="top"?r.y+=i.y-s.absY:t==="bottom"?r.y+=i.y+i.height-(s.absY+s.height):t==="centerY"&&(r.y+=i.y+i.height/2-(s.absY+s.height/2)))}},{select:this.state.selection})}distribute(t){let n=this.selectedNodes().filter(i=>i.editable&&!i.isInstanceRoot);n.length<3||this.mutate(i=>{let a=[...n].sort((h,p)=>t==="x"?h.absX-p.absX:h.absY-p.absY),s=a[0],r=a[a.length-1],l=t==="x"?r.absX+r.width-s.absX:r.absY+r.height-s.absY,o=a.reduce((h,p)=>h+(t==="x"?p.width:p.height),0),c=(l-o)/(a.length-1),d=t==="x"?s.absX:s.absY;for(let h of a){let p=be(i.pages.flatMap(b=>b.children),h.sourceId);p&&(t==="x"?p.x+=d-h.absX:p.y+=d-h.absY,d+=(t==="x"?h.width:h.height)+c)}},{select:this.state.selection})}renameNode(t,n){this.updateNode(t,{name:n},{commit:!0})}setVisibility(t,n){this.updateNode(t,{visible:n},{commit:!0})}setLocked(t,n){this.updateNode(t,{locked:n},{commit:!0})}setText(t,n){this.updateNode(t,{text:n},{commit:!0})}beginTextEdit(t){let n=this.findSceneNode(t);!n||n.type!=="text"||(this.state.editingText={key:t,sourceId:n.sourceId,value:n.text??""},this.state.selection=[t],this.state.primaryKey=t,this.emit())}commitTextEdit(t){let n=this.state.editingText;n&&(this.state.editingText=null,t!==n.value?this.setText(n.sourceId,t):this.emit())}cancelTextEdit(){this.state.editingText=null,this.emit()}undo(){let t=this.history.undo();t&&(this.state.doc=Xe(t,{touch:!1}),this.rebuild(),this.state.dirty=!0,this.emit(),this.scheduleSave())}redo(){let t=this.history.redo();t&&(this.state.doc=Xe(t,{touch:!1}),this.rebuild(),this.state.dirty=!0,this.emit(),this.scheduleSave())}enterInstance(t){let n=this.findSceneNode(t);!n||n.type!=="instance"&&!n.isInstanceRoot||(this.state.enteredInstance=n.key,this.state.selection=[],this.state.primaryKey=null,this.toast("\u5DF2\u8FDB\u5165\u5B9E\u4F8B\uFF0C\u53CC\u51FB\u6587\u672C/\u5F62\u72B6\u53EF\u8986\u76D6\uFF0CEsc \u9000\u51FA"),this.emit())}exitInstance(){this.state.enteredInstance=null,this.state.selection=[],this.state.primaryKey=null,this.emit()}setOverride(t,n,i){this.mutate(a=>{let s=be(a.pages.flatMap(r=>r.children),t);!s||s.type!=="instance"||(s.overrides=s.overrides??{},s.overrides[n]={...s.overrides[n]??{},...i})})}detachInstance(t){this.mutate(n=>{for(let i of n.pages){let a=be(i.children,t);if(!a)continue;let s=n.components.find(d=>d.id===a.componentId);if(!s)throw new Error("\u4E3B\u7EC4\u4EF6\u4E0D\u5B58\u5728");let r=wn(i.children,t,null),l=r?r.children:i.children,o=l.findIndex(d=>d.id===t),c=this.materializeInstance(n,s,a);l.splice(o,1,c);return}},{select:[t]})}materializeInstance(t,n,i){let a=je(n.root),s=new Map,r=d=>{let h=le("n");s.set(d.id,h),d.id=h;let p=i.overrides?.[d.id];p&&Object.assign(d,p),Array.isArray(d.children)&&d.children.forEach(r)},l=i.overrides??{},o=new Map(Object.entries(l)),c=d=>{let h=d.id,p=le("n");s.set(h,p),d.id=p;let b=o.get(h);b&&(b.text!=null&&(d.text=b.text),b.fills!=null&&(d.fills=b.fills),b.visible!=null&&(d.visible=b.visible)),Array.isArray(d.children)&&d.children.forEach(c)};return a.x=i.x,a.y=i.y,i.width&&(a.width=i.width),i.height&&(a.height=i.height),c(a),a}createComponentFromSelection(t="Component"){let n=this.primaryNode();if(!n||!n.editable)return;let i=le("cmp"),a=le("n"),s=le("i");this.mutate(r=>{let l=this.findDocParent(r,n.sourceId),o=l?l.children:r.pages.find(x=>x.id===this.state.pageId)?.children;if(!o)return;let c=o.findIndex(x=>x.id===n.sourceId);if(c===-1)return;let[d]=o.splice(c,1),h={x:n.absX,y:n.absY},p=je(d);p.x=0,p.y=0,p.id=a,r.components.push({id:i,name:t||d.name||"Component",variantProps:{},root:p});let b={id:s,type:"instance",name:d.name,x:h.x-(l?this.findSceneNode(n.parent?.key)?.absX??0:0),y:h.y-(l?this.findSceneNode(n.parent?.key)?.absY??0:0),width:d.width,height:d.height,rotation:0,opacity:1,visible:!0,locked:!1,componentId:i,variantProps:{},overrides:{}};b.x=n.absX-(n.parent?.absX??0),b.y=n.absY-(n.parent?.absY??0),o.splice(c,0,b)},{select:[s]}),this.toast("\u5DF2\u521B\u5EFA\u7EC4\u4EF6")}insertInstance(t){let i=this.state.doc?.components.find(o=>o.id===t);if(!i)return;let a=this.viewportSize(),s=this.state.viewport,r=Te(s,{x:a.width/2,y:a.height/2}),l={id:le("i"),type:"instance",name:i.name,x:r.x-(i.root.width??120)/2,y:r.y-(i.root.height??40)/2,width:i.root.width??120,height:i.root.height??40,rotation:0,opacity:1,visible:!0,locked:!1,componentId:t,variantProps:{...i.variantProps??{}},overrides:{}};this.mutate(o=>{(o.pages.find(d=>d.id===this.state.pageId)??o.pages[0]).children.push(l)},{select:[l.id]})}setVariant(t,n,i){this.mutate(a=>{let s=be(a.pages.flatMap(r=>r.children),t);s&&(s.variantProps={...s.variantProps??{},[n]:i})})}swapComponent(t,n){this.state.doc.components.some(i=>i.id===n)&&this.mutate(i=>{let a=be(i.pages.flatMap(s=>s.children),t);a&&(a.componentId=n,a.variantProps={},a.overrides={})})}createVariantSet(t){if(t.length<2){this.toast("\u81F3\u5C11\u9009\u62E9\u4E24\u4E2A\u7EC4\u4EF6\u624D\u80FD\u521B\u5EFA\u53D8\u4F53\u96C6");return}this.mutate(n=>{let i=le("vs"),a=t.map(r=>(n.components.find(o=>o.id===r)?.name??"Variant").split("/").pop().replace(/\s+/g,"-")),s=[...new Set(a)];for(let r of t){let l=n.components.find(o=>o.id===r);l&&(l.variantSetId=i,l.variantProps={State:(l.name??"Variant").split("/").pop().replace(/\s+/g,"-")})}n.variantSets.push({id:i,name:"Variant set",properties:[{name:"State",values:s}],componentIds:t})})}editComponent(t){this.state.componentMode={componentId:t},this.state.selection=[],this.state.primaryKey=null,this.rebuild(),this.emit()}exitComponentMode(){this.state.componentMode=null,this.state.selection=[],this.state.primaryKey=null,this.rebuild(),this.emit()}createStyle(t,n){let i=this.primaryNode();if(!i)return;let a=t==="fill"?i.fills?.[0]:t==="text"?{font:i.font,fills:i.fills}:i.effects;if(!a){this.toast("\u8BE5\u56FE\u5C42\u6CA1\u6709\u53EF\u521B\u5EFA\u7684\u6837\u5F0F");return}let s=le("style");this.mutate(r=>{r.styles.push({id:s,type:t,name:n||`${t} style`,value:je(a)});let l=be(r.pages.flatMap(o=>o.children),i.sourceId);l&&(t==="fill"&&(l.fillStyleId=s),t==="text"&&(l.textStyleId=s),t==="effect"&&(l.effectStyleId=s))}),this.toast("\u5DF2\u521B\u5EFA\u6837\u5F0F")}applyStyle(t){let n=this.state.doc.styles.find(a=>a.id===t);if(!n)return;let i=this.selectedNodes().filter(a=>a.editable);i.length&&this.mutate(a=>{for(let s of i){let r=be(a.pages.flatMap(l=>l.children),s.sourceId);r&&(n.type==="fill"&&["frame","rect","ellipse","path","text"].includes(r.type)&&(r.fillStyleId=t),n.type==="text"&&r.type==="text"&&(r.textStyleId=t),n.type==="effect"&&(r.effectStyleId=t))}})}detachStyle(t){let n=this.state.doc.styles.find(i=>i.id===t);n&&this.mutate(i=>{let a=s=>{s.fillStyleId===t&&n.type==="fill"&&(s.fills=[je(n.value)],delete s.fillStyleId),s.textStyleId===t&&n.type==="text"&&(s.font=je(n.value.font),s.fills=je(n.value.fills),delete s.textStyleId),s.effectStyleId===t&&n.type==="effect"&&(s.effects=je(n.value),delete s.effectStyleId);for(let r of s.children??[])a(r)};for(let s of i.pages)s.children.forEach(a);for(let s of i.components)a(s.root)})}updateStyle(t,n){this.mutate(i=>{let a=i.styles.find(s=>s.id===t);a&&Object.assign(a,n)})}deleteStyle(t){this.mutate(n=>{n.styles=n.styles.filter(a=>a.id!==t);let i=a=>{a.fillStyleId===t&&delete a.fillStyleId,a.textStyleId===t&&delete a.textStyleId,a.effectStyleId===t&&delete a.effectStyleId;for(let s of a.children??[])i(s)};for(let a of n.pages)a.children.forEach(i);for(let a of n.components)i(a.root)})}pageBounds(){let t=this.state.scene;if(!t)return{x:0,y:0,width:1,height:1};let n=t.roots.filter(i=>i.visible!==!1);return We(n.map(i=>({x:i.absX,y:i.absY,width:i.width,height:i.height})))??{x:0,y:0,width:1,height:1}}commentPosition(t){if(t.nodeId){let i=this.findSceneNode(t.nodeId);if(i)return ue(this.state.viewport,Ze(i))}let n=this.pageBounds();return ue(this.state.viewport,{x:n.x+(t.x??.5)*n.width,y:n.y+(t.y??.5)*n.height})}addComment(t,{nodeId:n,x:i,y:a}){if(!this.state.doc||!t.trim())return;let s=this.pageBounds(),r={x:i==null?.5:xt((i-s.x)/Math.max(1,s.width),0,1),y:a==null?.5:xt((a-s.y)/Math.max(1,s.height),0,1)};this.mutate(l=>{Qn(l,{pageId:this.state.pageId??l.pages[0].id,nodeId:n??void 0,x:r.x,y:r.y,body:t,author:"user"})}),this.state.commentDraft=null,this.emit()}replyComment(t,n){n.trim()&&this.mutate(i=>ei(i,t,n,"user"))}resolveComment(t,n=!0){this.mutate(i=>ti(i,t,n))}deleteComment(t){this.mutate(n=>ni(n,t))}fontFaceStyle(){let t=[];for(let n of this.state.doc?.fonts??[]){if(!n?.asset)continue;let i=yn(this.sessionId,n.asset);t.push(`@font-face{font-family:"${n.family}";font-style:${n.style??"normal"};font-weight:${n.weight??400};src:url("${i}") format("${n.asset.endsWith(".woff2")?"woff2":n.asset.endsWith(".woff")?"woff":n.asset.endsWith(".otf")?"opentype":"truetype"}");font-display:block}`)}return t.join(`
`)}async ensureFonts(){let t=this.state.doc?.fonts??[];if(!t.length||typeof document>"u")return;let n=document.getElementById("dsh-canvas-fonts");n||(n=document.createElement("style"),n.id="dsh-canvas-fonts",document.head.appendChild(n)),n.textContent=this.fontFaceStyle();try{await Promise.all(t.map(i=>document.fonts?.load?.(`${i.style??"normal"} ${i.weight??400} 16px "${i.family}"`).catch(()=>{})))}catch{}this.state.fontVersion+=1,this.rebuild(),this.emit()}async uploadFontFile(t,n,i,a){try{let s=await Wi(this.sessionId,t,{family:n,weight:Number(i)||400,style:a||"normal"});this.mutate(r=>{r.fonts=r.fonts??[],r.fonts.some(l=>l.asset===s.asset)||r.fonts.push({id:le("font"),family:n,weight:Number(i)||400,style:a||"normal",asset:s.asset,sourceName:t.name})}),await this.ensureFonts(),this.toast("\u5B57\u4F53\u5DF2\u4E0A\u4F20")}catch(s){this.toast(s?.message??String(s),"error")}}removeFont(t){let n=this.state.doc.fonts.find(s=>s.id===t);if(!n)return;let i=!1,a=s=>{s.type==="text"&&s.font?.family===n.family&&(s.font?.weight??400)===n.weight&&(i=!0);for(let r of s.children??[])a(r)};for(let s of this.state.doc.pages)s.children.forEach(a);for(let s of this.state.doc.components)a(s.root);if(i){this.toast("\u8BE5\u5B57\u4F53\u4ECD\u88AB\u6587\u672C\u4F7F\u7528\uFF0C\u5148\u66FF\u6362\u540E\u518D\u5220\u9664");return}this.mutate(s=>{s.fonts=s.fonts.filter(r=>r.id!==t)})}async uploadFillImage(t,n,i){try{let a=await xn(this.sessionId,i);this.mutate(s=>{let r=be([...s.pages.flatMap(l=>l.children),...s.components.map(l=>l.root)],t);r?.fills?.[n]&&(r.fills[n]={type:"image",asset:a.asset,fit:"cover"})})}catch(a){this.toast(a?.message??String(a),"error")}}importSvg(t){let{paths:n,warnings:i}=Ai(t);if(!n.length)return this.toast(i[0]??"\u6CA1\u6709\u53EF\u5BFC\u5165\u7684 SVG path","error"),0;let a=this.viewportCenterWorld(),s=[];for(let[r,l]of n.entries()){let o=Math.min(1,240/Math.max(1,l.viewBox.width),240/Math.max(1,l.viewBox.height)),c=Math.max(1,l.viewBox.width*o),d=Math.max(1,l.viewBox.height*o),h={id:le("n"),type:"path",name:l.name,x:a.x-c/2+r*8,y:a.y-d/2+r*8,width:c,height:d,rotation:0,opacity:1,visible:!0,locked:!1,d:l.d,viewBox:l.viewBox,fillRule:l.fillRule,fills:l.fills,strokes:l.strokes,effects:[]},p=this.addNode(h,null);p&&s.push(p.id)}return s.length&&this.setSelection(s),this.toast(i.length?`\u5DF2\u5BFC\u5165 ${s.length} \u6761 path\uFF1B${i[0]}`:`\u5DF2\u5BFC\u5165 ${s.length} \u6761 path`),s.length}requestImagePick(){return this.imagePicker?(this.imagePicker.click(),!0):(this.toast("\u56FE\u7247\u9009\u62E9\u5668\u5C1A\u672A\u51C6\u5907\u597D","error"),!1)}async uploadImageFile(t,n){try{let i=await xn(this.sessionId,t),a=await ca(Ge(this.sessionId,this.state.name,i.asset)).catch(()=>({width:320,height:200})),s=Math.min(480,a.width||320),r=(a.height||200)*(s/(a.width||320)),l=n??this.viewportCenterWorld(),o={id:le("n"),type:"rect",name:t.name.replace(/\.[^.]+$/,"")||"Image",x:l.x-s/2,y:l.y-r/2,width:s,height:r,rotation:0,opacity:1,visible:!0,locked:!1,cornerRadius:0,fills:[{type:"image",asset:i.asset,fit:"cover"}],strokes:[],effects:[]};this.addNode(o,null)}catch(i){this.toast(i?.message??String(i),"error")}}viewportCenterWorld(){let t=this.viewportSize();return Te(this.state.viewport,{x:t.width/2,y:t.height/2})}selectionText(){let t=this.selectedNodes();if(!t.length)return"";let n=t[0],i=t.length>1?`\u753B\u5E03\u9009\u533A\uFF08${t.length} \u4E2A\u56FE\u5C42\uFF09\uFF1A${n.name}`:`\u753B\u5E03\u9009\u533A\uFF1A${n.name}`;return vi({doc:this.state.name,node:n.key,page:this.state.pageId??void 0,label:i})}async insertSelectionToComposer(){let t=this.selectionText(),n=this.selectedNodes();if(!t||!n.length){this.toast("\u5148\u9009\u4E2D\u753B\u5E03\u5143\u7D20");return}Ei({sessionId:this.sessionId,doc:this.state.name,node:n[0].key,page:this.state.pageId??void 0,label:n[0].name||n[0].type});let i=this.inputActions,a=!1;try{if(i&&typeof i.captureInsertion=="function"){let s=i.captureInsertion();a=i.insertText(t,s)}}catch{a=!1}if(a)this.toast("\u5DF2\u63D2\u5165\u753B\u5E03\u94FE\u63A5\uFF1B\u53D1\u9001\u540E\u70B9\u6D88\u606F\u91CC\u7684\u753B\u5E03 chip \u53EF\u8DF3\u8F6C");else try{await navigator.clipboard.writeText(t),this.toast("\u8F93\u5165\u6846\u4E0D\u53EF\u7528\uFF0C\u9009\u533A\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F")}catch{this.toast("\u65E0\u6CD5\u5199\u5165\u8F93\u5165\u6846\u6216\u526A\u8D34\u677F","error")}}insertTemplate(t){try{let{node:n,template:i}=Ci(t,{device:this.state.foundation?.device??Ve}),a=this.viewportCenterWorld();if(n.x=Math.round(a.x-n.width/2),n.y=Math.round(a.y-n.height/2),!this.addNode(n,null))return;this.setTool("pointer"),this.zoomToSelection(),this.toast(`\u5DF2\u63D2\u5165\u6A21\u677F\uFF1A${i.name}`)}catch(n){this.toast(n?.message??String(n),"error")}}setFoundation(t={}){let n=_e(t.device??this.state.foundation?.device??Ve),i=ln(t.preset??this.state.foundation?.preset??ft);this.state.foundation={device:n.id,preset:i.id},this.emit()}async loadImageCapabilities(){try{let t=await ji(this.sessionId);return this.state.imageCapabilities=t.capabilities??null,this.emit(),this.state.imageCapabilities}catch{return this.state.imageCapabilities=null,this.emit(),null}}async insertImageAsset(t,n="AI image"){if(!t)return null;let i=await ca(Ge(this.sessionId,this.state.name,t)).catch(()=>({width:320,height:200})),a=Math.min(480,i.width||320),s=(i.height||200)*(a/(i.width||320)),r=this.viewportCenterWorld(),l={id:le("n"),type:"rect",name:n,x:r.x-a/2,y:r.y-s/2,width:a,height:s,rotation:0,opacity:1,visible:!0,locked:!1,cornerRadius:0,fills:[{type:"image",asset:t,fit:"cover"}],strokes:[],effects:[]};return this.addNode(l,null)}async generateImage(t){if(this.state.imageGenerating)return{ok:!1,code:"busy",message:"\u56FE\u7247\u751F\u6210\u8FDB\u884C\u4E2D"};let n=String(t??"").trim();if(!n)return this.toast("\u8BF7\u8F93\u5165\u56FE\u7247\u63CF\u8FF0"),{ok:!1,code:"prompt-required"};this.state.imageGenerating=!0,this.emit();try{let i=await Yi(this.sessionId,this.state.name,n);return i?.ok?(await this.insertImageAsset(i.asset,"AI image"),this.toast("\u56FE\u7247\u5DF2\u751F\u6210\u5E76\u63D2\u5165\u753B\u5E03"),i):(this.toast(i?.message??"\u56FE\u7247\u751F\u6210\u5931\u8D25","error"),i)}catch(i){return this.toast(i?.message??String(i),"error"),{ok:!1,code:i?.code??"image-failed",message:i?.message}}finally{this.state.imageGenerating=!1,this.emit()}}async runAudit(t="page"){let n=t==="selection"?this.selectedNodes()[0]?.sourceId:void 0;if(t==="selection"&&!n)return this.toast("\u5148\u9009\u4E2D\u4E00\u4E2A\u8282\u70B9"),null;try{let i=await Bi(this.sessionId,this.state.name,{...n?{nodeId:n}:{},...this.state.pageId?{pageId:this.state.pageId}:{},system:"ios"});this.state.audit=i,this.emit();let a=(i.findings??[]).filter(s=>s.severity==="high").length;return this.toast(a?`\u68C0\u67E5\u5B8C\u6210\uFF1A${a} \u4E2A\u9AD8\u4F18\u5148\u7EA7\u95EE\u9898`:"\u68C0\u67E5\u5B8C\u6210"),i}catch(i){return this.toast(i?.message??String(i),"error"),null}}loadDesignSystem(t="material3"){let n=rn(t),i=ki(t);this.mutate(a=>{let s=new Set(a.styles.map(r=>r.name));for(let r of i)s.has(r.name)||(a.styles.push(structuredClone(r)),s.add(r.name))},{select:[]}),this.toast(`\u5DF2\u52A0\u8F7D ${n.name} \u6837\u5F0F\uFF08${i.length} \u6761\uFF09\uFF0C\u53EF\u5728\u300C\u6837\u5F0F\u300D\u9762\u677F\u5E94\u7528`)}insertPrompt(t=""){let n=_e(this.state.foundation?.device),i=ln(this.state.foundation?.preset),a=["\u4F7F\u7528 canvas-ui-design \u6280\u80FD\uFF0C\u76F4\u63A5\u5728\u753B\u5E03\u4E2D\u751F\u6210 UI\u3002",`\u8BBE\u5907\uFF1A${n.name} ${n.width}\xD7${n.height}\uFF1B\u98CE\u683C\u9884\u8BBE\uFF1A${i.name}\u3002`,"\u5148 canvas_read \u8BFB\u53D6\u5F53\u524D\u6587\u6863\u548C\u9009\u533A\uFF0C\u518D\u7528 canvas_template \u7684 foundation/\u9875\u9762\u9AA8\u67B6\u4E0E canvas_write/canvas_edit \u751F\u6210\u771F\u5B9E\u5185\u5BB9\u3002","\u5B8C\u6210\u540E\u8FD0\u884C canvas_audit\uFF0C\u5E76\u6309 findings \u4FEE\u6B63\uFF1B\u4E0D\u8981\u53EA\u7ED9\u8BBE\u8BA1\u5EFA\u8BAE\u3002",`\u9700\u6C42\uFF1A${String(t||"").trim()||"\u751F\u6210\u4E00\u4E2A\u79FB\u52A8\u7AEF\u9875\u9762\uFF0C\u5305\u542B\u6807\u9898\u3001\u4E3B\u5185\u5BB9\u548C\u4E3B\u6309\u94AE\u3002"}`].join(`
`),s=this.inputActions;try{if(s&&typeof s.captureInsertion=="function"){let r=s.captureInsertion();if(s.insertText(a,r)){this.toast("\u5DF2\u5199\u5165 AI \u751F\u6210\u8BF7\u6C42");return}}navigator.clipboard?.writeText(a),this.toast("\u5DF2\u590D\u5236 AI \u751F\u6210\u8BF7\u6C42")}catch{this.toast("\u65E0\u6CD5\u5199\u5165\u8F93\u5165\u6846","error")}}insertImagePrompt(t=""){let n=["\u8BF7\u4F7F\u7528\u5F53\u524D\u6A21\u578B\u7684\u539F\u751F\u56FE\u7247\u751F\u6210\u80FD\u529B\u751F\u6210\u4E00\u5F20\u56FE\u7247\u3002",`\u56FE\u7247\u63CF\u8FF0\uFF1A${String(t||"").trim()||"\u900F\u660E\u80CC\u666F\u7684\u79FB\u52A8 App \u63D2\u753B\u7D20\u6750\u3002"}`,"\u751F\u6210\u540E\u628A\u56FE\u7247\u6587\u4EF6\u901A\u8FC7 canvas_image import \u5BFC\u5165 canvas/assets/\uFF0C\u518D\u7528 canvas_edit \u653E\u5230\u5F53\u524D\u8BBE\u8BA1\u91CC\u3002","\u5982\u679C\u5F53\u524D\u6CA1\u6709\u539F\u751F\u56FE\u7247\u5DE5\u5177\uFF0C\u8BF7\u6539\u7528 canvas_image probe \u68C0\u67E5 Codex \u8DEF\u7EBF\uFF0C\u6216\u8981\u6C42\u7528\u6237\u5BFC\u5165\u56FE\u7247\u3002"].join(`
`),i=this.inputActions;try{if(i&&typeof i.captureInsertion=="function"){let a=i.captureInsertion();if(i.insertText(n,a)){this.toast("\u5DF2\u5199\u5165\u751F\u56FE\u8BF7\u6C42");return}}navigator.clipboard?.writeText(n),this.toast("\u5DF2\u590D\u5236\u751F\u56FE\u8BF7\u6C42")}catch{this.toast("\u65E0\u6CD5\u5199\u5165\u8F93\u5165\u6846","error")}}async exportSelection(t){let n=this.selectedNodes(),i=n.length?n.map(a=>a.key):this.state.scene?.roots.map(a=>a.key)??[];try{let{buildSvg:a}=await Promise.resolve().then(()=>(na(),ta)),s=await a(this.state.scene,{nodeKeys:i,background:this.state.doc.pages.find(c=>c.id===this.state.pageId)?.background??null,resolveAsset:async c=>{let d=await fetch(Ge(this.sessionId,this.state.name,c),{credentials:"same-origin"});if(!d.ok)throw new Error(`asset ${c} unavailable`);let h=await d.blob();return await oa(h)},resolveFont:async c=>{let d=await fetch(yn(this.sessionId,c.asset),{credentials:"same-origin"});if(!d.ok)throw new Error(`font ${c.asset} unavailable`);let h=await d.blob();return await oa(h)},fonts:this.state.doc.fonts??[]});if(t==="svg"){let c=await gn(this.sessionId,this.state.name,"svg",kr(s));this.toast(`\u5DF2\u5BFC\u51FA ${c.path}`),this.insertExportPath(c.path);return}let{svgToPng:r}=await Promise.resolve().then(()=>(aa(),ia)),l=await r(s,2),o=await gn(this.sessionId,this.state.name,"png",l.split(",")[1]);this.toast(`\u5DF2\u5BFC\u51FA ${o.path}`),this.insertExportPath(o.path)}catch(a){this.toast(`\u5BFC\u51FA\u5931\u8D25\uFF1A${String(a?.message??a)}`,"error")}}insertExportPath(t){let n=this.inputActions;if(n?.captureInsertion)try{n.insertText(`

\u753B\u5E03\u9884\u89C8\u56FE\uFF1A${t}
`,n.captureInsertion())}catch{}}beginCrop(t,n=0){let i=this.findSceneNode(t);if(!i||!i.fills?.[n]||i.fills[n].type!=="image"){this.toast("\u8BE5\u56FE\u5C42\u6CA1\u6709\u56FE\u7247\u586B\u5145");return}this.state.crop={key:t,sourceId:i.sourceId,fillIndex:n,crop:{...i.fills[n].crop??{x:0,y:0,width:1,height:1}}},this.state.selection=[t],this.state.primaryKey=t,this.emit()}updateCrop(t){let n=this.state.crop;n&&(n.crop=t,this.emit())}commitCrop(){let t=this.state.crop;t&&(this.mutate(n=>{let i=be(n.pages.flatMap(a=>a.children),t.sourceId);i?.fills?.[t.fillIndex]&&(i.fills[t.fillIndex].crop=t.crop)}),this.state.crop=null,this.emit())}cancelCrop(){this.state.crop=null,this.emit()}};function Sr(e){return{frame:"Frame",group:"Group",rect:"Rectangle",ellipse:"Ellipse",line:"Line",text:"Text",instance:"Instance"}[e]??"Node"}function oa(e){return new Promise((t,n)=>{let i=new FileReader;i.onload=()=>t(String(i.result??"")),i.onerror=()=>n(i.error),i.readAsDataURL(e)})}function kr(e){return btoa(unescape(encodeURIComponent(e)))}function ca(e){return new Promise((t,n)=>{let i=new Image;i.onload=()=>t({width:i.naturalWidth,height:i.naturalHeight}),i.onerror=n,i.src=e})}var vn="dsh-canvas:focus",Rn="__dshCanvasPendingFocus";function En(e){typeof window>"u"||(window[Rn]={...e,at:Date.now()},window.dispatchEvent(new CustomEvent(vn,{detail:{...e}})))}function $n(e){if(typeof window>"u")return null;let t=window[Rn];return!t||t.sessionId&&e&&t.sessionId!==e?null:(window[Rn]=null,t)}function da(e){if(typeof window>"u")return()=>{};let t=n=>e(n.detail??{});return window.addEventListener(vn,t),()=>window.removeEventListener(vn,t)}var N=Be(require("react"),1);var te=Be(require("react"),1);var He="dshc";function vt(e){return Math.min(1,Math.max(0,Number(e)||0))}function Sn(e){let t=e.color??"#000000";if(e.opacity==null||e.opacity>=1)return t;let n=Math.round(vt(e.opacity)*255).toString(16).padStart(2,"0");return t.length===7?`${t}${n}`:t}function ua(e){if(!e)return"transparent";if(e.type==="solid")return Sn(e);let t=(e.stops??[]).map(n=>`${n.color} ${(vt(n.position)*100).toFixed(2)}%`).join(", ");if(e.type==="linear-gradient")return`linear-gradient(${Number(e.angle)||0}deg, ${t})`;if(e.type==="radial-gradient"){let n=vt(e.center?.x??.5)*100,i=vt(e.center?.y??.5)*100;return`radial-gradient(circle ${Math.max(.01,vt(e.radius??.7))*100}% at ${n}% ${i}%, ${t})`}return"transparent"}function Ft(e){let t=e.fills?.find(n=>n.type==="solid")??e.fills?.[0];return t?t.type==="solid"?{color:Sn(t),gradient:null}:{color:"transparent",gradient:ua(t)}:{color:"transparent",gradient:null}}function Ir(e){let t=[],n="",i="";for(let a of e.effects??[])a.visible!==!1&&(a.type==="drop-shadow"?t.push(`${a.x??0}px ${a.y??0}px ${a.blur??0}px ${a.spread??0}px ${a.color??"#00000040"}`):a.type==="inner-shadow"?t.push(`inset ${a.x??0}px ${a.y??0}px ${a.blur??0}px ${a.spread??0}px ${a.color??"#00000040"}`):a.type==="layer-blur"?n+=` blur(${a.radius??0}px)`:a.type==="background-blur"&&(i+=` blur(${a.radius??0}px)`));for(let a of e.strokes??[]){let s=Number(a.width)||1,r=a.color??"#000000";t.push(`${a.align==="outside"?"":"inset "}0 0 0 ${s}px ${r}`)}return{boxShadow:t.length?t.join(", "):void 0,filter:n.trim()?n.trim():void 0,backdropFilter:i.trim()?i.trim():void 0,WebkitBackdropFilter:i.trim()?i.trim():void 0}}function Nr(e){let t=e.cornerRadius??0;return e.type==="ellipse"?"50%":t?`${t}px`:void 0}function Cr({fill:e,sessionId:t,docName:n}){let i=e.crop??{x:0,y:0,width:1,height:1},a=Ge(t,n,e.asset),s=100/Math.max(.01,i.width),r=100/Math.max(.01,i.height);return te.createElement("div",{className:`${He}-fill`,style:{position:"absolute",inset:0,overflow:"hidden",borderRadius:"inherit"}},te.createElement("img",{src:a,alt:"",draggable:!1,style:{position:"absolute",left:`${-i.x/Math.max(.01,i.width)*100}%`,top:`${-i.y/Math.max(.01,i.height)*100}%`,width:`${s}%`,height:`${r}%`,maxWidth:"none",objectFit:e.fit==="contain"?"contain":e.fit==="fill"?"fill":"cover",borderRadius:"inherit"}}))}function ha({node:e,store:t}){return e.fills?.length?e.fills.map((n,i)=>n.type==="image"?te.createElement(Cr,{key:`fill-${i}`,fill:n,sessionId:t.sessionId,docName:t.state.name}):te.createElement("div",{key:`fill-${i}`,className:`${He}-fill`,style:{position:"absolute",inset:0,background:ua(n),borderRadius:"inherit",pointerEvents:"none"}})):null}function Mr({node:e,baseStyle:t}){let n=[],i=[];for(let[s,r]of(e.fills??[]).entries())if(r.type==="solid")i.push(te.createElement("path",{key:`fill-${s}`,d:e.d,fill:Sn(r),fillRule:e.fillRule==="evenodd"?"evenodd":"nonzero"}));else if(r.type==="linear-gradient"||r.type==="radial-gradient"){let l=`path-grad-${String(e.key).replace(/[^A-Za-z0-9_-]/g,"_")}-${s}`,o=(r.stops??[]).map((c,d)=>te.createElement("stop",{key:`stop-${d}`,offset:c.position,stopColor:c.color}));if(r.type==="linear-gradient"){let c=(Number(r.angle)||0)*Math.PI/180;n.push(te.createElement("linearGradient",{key:l,id:l,x1:.5-Math.cos(c)/2,y1:.5-Math.sin(c)/2,x2:.5+Math.cos(c)/2,y2:.5+Math.sin(c)/2},o))}else n.push(te.createElement("radialGradient",{key:l,id:l,cx:r.center?.x??.5,cy:r.center?.y??.5,r:r.radius??.7},o));i.push(te.createElement("path",{key:`fill-${s}`,d:e.d,fill:`url(#${l})`,fillRule:e.fillRule==="evenodd"?"evenodd":"nonzero"}))}for(let[s,r]of(e.strokes??[]).entries())i.push(te.createElement("path",{key:`stroke-${s}`,d:e.d,fill:"none",stroke:r.color??"#000000",strokeWidth:r.width??1,strokeLinejoin:"round"}));let a=e.viewBox??{x:0,y:0,width:e.width,height:e.height};return te.createElement("div",{className:`${He}-node ${He}-path`,"data-node-key":e.key,style:{...t,overflow:"visible"}},te.createElement("svg",{width:"100%",height:"100%",viewBox:`${a.x} ${a.y} ${a.width} ${a.height}`,preserveAspectRatio:"none",style:{display:"block",overflow:"visible"}},n.length?te.createElement("defs",null,n):null,i))}var zr=te.memo(function e({node:t,store:n,parentAbs:i}){if(!t||t.visible===!1)return null;let a=t.absX-(i?.x??0),s=t.absY-(i?.y??0),r=Ir(t),l=n.state.editingText?.key===t.key,o={position:"absolute",left:`${a}px`,top:`${s}px`,width:`${t.width}px`,height:`${t.height}px`,transform:t.rotation?`rotate(${t.rotation}deg)`:void 0,transformOrigin:"center",opacity:t.opacity==null?1:t.opacity,borderRadius:Nr(t),boxSizing:"border-box",...r};if(t.type==="group")return te.createElement("div",{className:`${He}-node ${He}-group`,"data-node-key":t.key,style:{...o,pointerEvents:"none"}},(t.children??[]).map(d=>te.createElement(e,{key:d.key,node:d,store:n,parentAbs:{x:t.absX,y:t.absY}})));if(t.type==="path")return te.createElement(Mr,{node:t,baseStyle:o});if(t.type==="text"){let d=Ft(t),h=t.lines??[],p=(t.font?.size??14)*(t.font?.lineHeight??1.4),b=h.length*p,x=t.verticalAlign??"top",E=x==="center"?(t.height-b)/2:x==="bottom"?t.height-b:0,S={fontFamily:`"${t.font?.family??"system-ui"}", system-ui, sans-serif`,fontWeight:t.font?.weight??400,fontStyle:t.font?.style??"normal",fontSize:`${t.font?.size??14}px`,lineHeight:`${p}px`,letterSpacing:`${t.font?.letterSpacing??0}px`,textAlign:t.align??"left",color:d.color,backgroundImage:d.gradient??void 0,WebkitBackgroundClip:d.gradient?"text":void 0,backgroundClip:d.gradient?"text":void 0};return te.createElement("div",{className:`${He}-node ${He}-text`,"data-node-key":t.key,style:{...o,overflow:t.effects?.length?"visible":"hidden"}},te.createElement(ha,{node:{...t,fills:t.fills?.filter(k=>k.type!=="solid")??[]},store:n}),!l&&te.createElement("div",{className:`${He}-text-lines`,style:{position:"absolute",left:0,top:`${E}px`,width:"100%",height:`${b}px`,pointerEvents:"none",...S}},h.length?h.map((k,v)=>te.createElement("div",{key:v,style:{whiteSpace:"pre",height:`${p}px`,overflow:"hidden"}},k.text||" ")):te.createElement("div",{style:{whiteSpace:"pre"}},t.text?String(t.text).split(`
`)[0]:" ")),l&&te.createElement("div",{style:{position:"absolute",inset:0,border:"1px solid var(--dshc-accent)",borderRadius:2,pointerEvents:"none"}}))}let c=(t.children??[]).map(d=>te.createElement(e,{key:d.key,node:d,store:n,parentAbs:{x:t.absX,y:t.absY}}));return te.createElement("div",{className:`${He}-node ${He}-${t.type}`,"data-node-key":t.key,style:{...o,overflow:t.clip?"hidden":void 0}},te.createElement(ha,{node:t,store:n}),c)});function pa({scene:e,store:t}){return e?te.createElement(te.Fragment,null,(e.roots??[]).map(n=>te.createElement(zr,{key:n.key,node:n,store:t,parentAbs:{x:0,y:0}}))):null}function kn(e,t){if(!e||e.visible===!1||e.locked)return null;if(e.type==="group"){for(let n of[...e.children??[]].reverse()){let i=kn(n,t);if(i)return i}return null}if(!yt(e,t))return null;for(let n of[...e.children??[]].reverse()){let i=kn(n,t);if(i)return i}return e}function Je(e,t,n={}){if(!e)return null;let i=null;for(let r of[...e.roots??[]].reverse())if(i=kn(r,t),i)break;if(!i)return null;if(n.deep)return i;let a=n.enteredInstance??null,s=i;for(;s.parent;){let r=s.parent;if(r.type==="group"){s=r;continue}if(r.type==="instance"&&r.key!==a){s=r;continue}break}return s}var H=Be(require("react"),1);var In=Be(require("react"),1),ma={pointer:"M4 4l7.07 17 2.51-7.39L21 11.07 4 4z",hand:"M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0 1V4.5a1.5 1.5 0 0 1 3 0V11m0 0V6.5a1.5 1.5 0 0 1 3 0V12m0 0V8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-2.2a6 6 0 0 1-4.8-2.4L5 15.5a1.6 1.6 0 0 1 2.4-2.1L9 15",frame:"M7 3v18M17 3v18M3 7h18M3 17h18",rect:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",ellipse:"M12 4c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z",line:"M4 20L20 4",path:"M4 18C8 4 14 4 20 16M4 18l3 2M20 16l-2 3",text:"M5 5h14M12 5v13M8 18h8",image:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 15l4.5-4.5L13 15l3-3 4 4M15.5 8.5h.01",comment:"M6 5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3V6a1 1 0 0 1 1-1z",layers:"M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5",panelLeft:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 5v14",panelRight:"M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM15 5v14",component:"M12 3l9 9-9 9-9-9 9-9zM12 8l4 4-4 4-4-4 4-4z",styles:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",fonts:"M5 20L12 4l7 16M8 14h8",undo:"M9 7H5V3M5 7a8 8 0 1 1-1 9",redo:"M15 7h4V3M19 7a8 8 0 1 0 1 9",plus:"M12 5v14M5 12h14",minus:"M5 12h14",trash:"M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",eye:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",eyeOff:"M3 3l18 18M10.6 6.3A10 10 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3 4M6.2 6.2C3.5 8.2 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4-.8",lock:"M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3",unlock:"M6 11h12v10H6zM8 11V8a4 4 0 0 1 7.3-2.2",chevronDown:"M6 9l6 6 6-6",chevronRight:"M9 6l6 6-6 6",alignLeft:"M4 4v16M8 7h11v4H8zM8 15h7v4H8z",alignCenterX:"M12 3v18M6 7h12v4H6zM8 15h8v4H8z",alignRight:"M20 4v16M5 7h11v4H5zM9 15h7v4H9z",alignTop:"M4 4h16M7 8h4v11H7zM15 8h4v7h-4z",alignCenterY:"M3 12h18M7 6h4v12H7zM15 8h4v8h-4z",alignBottom:"M4 20h16M7 5h4v11H7zM15 9h4v7h-4z",distributeX:"M3 4v16M21 4v16M9 7h6v10H9z",distributeY:"M4 3h16M4 21h16M7 9h10v6H7z",group:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",ungroup:"M4 4h6v6H4zM14 14h6v6h-6zM15 4h5v5M4 15v5h5",front:"M4 8h10v10H4zM10 4h10v10",back:"M10 10h10v10H10zM4 4h10v10",close:"M6 6l12 12M18 6L6 18",check:"M4 12l5 5L20 6",upload:"M12 16V4M7 9l5-5 5 5M4 17v3h16v-3",download:"M12 4v12M7 11l5 5 5-5M4 20h16",copy:"M9 8h11v11H9zM6 5h11v3M6 5v11h3",send:"M4 12l16-8-6 16-2.5-6.5L4 12z",pencil:"M4 20h4L20 8l-4-4L4 16v4zM14 6l4 4",zoomIn:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5M8 11h6M11 8v6",zoomOut:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5M8 11h6",fit:"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",reset:"M4 10a8 8 0 1 1 2.3 6.3M4 4v6h6",more:"M5 12h.01M12 12h.01M19 12h.01",sliders:"M4 7h16M4 12h16M4 17h16M9 5v4M15 10v4M7 15v4",template:"M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 9h16M9 9v10",play:"M7 4l13 8-13 8V4z",sparkle:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z",eyeSmall:"M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"};function ye({name:e,size:t=16,style:n,className:i}){let a=ma[e];if(!a)return null;let s=e==="pointer";return In.createElement("svg",{viewBox:"0 0 24 24",width:t,height:t,fill:s?"currentColor":"none",stroke:s?"none":"currentColor",strokeWidth:s?0:1.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,style:n,className:i},In.createElement("path",{d:a}))}var fc=Object.keys(ma);function O({icon:e,children:t,active:n,primary:i,danger:a,small:s,title:r,onClick:l,disabled:o,className:c=""}){return H.createElement("button",{type:"button",title:r,disabled:o,onClick:l,className:`dshc-btn ${n?"is-active":""} ${i?"is-primary":""} ${a?"is-danger":""} ${s?"is-small":""} ${c}`},e?H.createElement(ye,{name:e,size:s?14:15}):null,t?H.createElement("span",null,t):null)}function X({icon:e,title:t,active:n,onClick:i,size:a=20,danger:s}){return H.createElement("button",{type:"button",title:t,"aria-label":t,onClick:i,className:`dshc-icon-btn ${n?"is-active":""} ${s?"is-danger":""}`},H.createElement(ye,{name:e,size:a}))}function Pt({x:e,y:t,items:n,onClose:i,fixed:a=!1}){let s=H.useRef(null);return H.useEffect(()=>{s.current?.querySelector("button:not(:disabled)")?.focus?.({preventScroll:!0})},[e,t]),H.createElement("div",{ref:s,role:"menu",className:"dshc-context-menu",style:{left:e,top:t,position:a?"fixed":"absolute"},onPointerDown:r=>r.stopPropagation(),onContextMenu:r=>r.preventDefault()},n.map((r,l)=>r.separator?H.createElement("div",{key:`sep-${l}`,className:"dshc-context-sep"}):r.heading?H.createElement("div",{key:`head-${l}`,className:"dshc-context-heading"},r.heading):H.createElement("button",{key:`${r.label}-${l}`,type:"button",role:"menuitem",disabled:r.disabled,className:`dshc-context-item ${r.danger?"is-danger":""}`,onClick:()=>{r.action?.(),i?.()}},r.icon?H.createElement(ye,{name:r.icon,size:14}):null,H.createElement("span",{className:"dshc-context-label"},r.label),r.shortcut?H.createElement("span",{className:"dshc-context-shortcut"},r.shortcut):null)))}function Ee({title:e,children:t,right:n,defaultOpen:i=!0}){let[a,s]=H.useState(i);return H.createElement("div",{className:"dshc-section"},H.createElement("button",{type:"button",className:"dshc-section-head",onClick:()=>s(!a)},H.createElement(ye,{name:a?"chevronDown":"chevronRight",size:12}),H.createElement("span",null,e),n?H.createElement("span",{className:"dshc-section-right"},n):null),a?H.createElement("div",{className:"dshc-section-body"},t):null)}function _({label:e,children:t,wide:n}){return H.createElement("label",{className:`dshc-field ${n?"is-wide":""}`},H.createElement("span",{className:"dshc-field-label"},e),t)}function oe({value:e,onChange:t,min:n,max:i,step:a=1,disabled:s,suffix:r}){let[l,o]=H.useState(String(e??0));H.useEffect(()=>o(String(e??0)),[e]);let c=()=>{let d=Number(l);if(Number.isFinite(d)){let h=Math.min(i??1/0,Math.max(n??-1/0,d));t(h),o(String(h))}else o(String(e??0))};return H.createElement("span",{className:"dshc-number"},H.createElement("input",{type:"number",value:l,step:a,min:n,max:i,disabled:s,onChange:d=>o(d.target.value),onBlur:c,onKeyDown:d=>{d.key==="Enter"&&(d.preventDefault(),c(),d.currentTarget.blur())}}),r?H.createElement("span",{className:"dshc-number-suffix"},r):null)}function ct({value:e,onChange:t,allowAlpha:n=!0}){let i=Ar(e);return H.createElement("span",{className:"dshc-color"},H.createElement("input",{type:"color",value:i.slice(0,7),onChange:a=>{let s=i.length===9?i.slice(7):"";t(`${a.target.value.toUpperCase()}${s}`)}}),H.createElement("input",{className:"dshc-color-text",value:i,spellCheck:!1,onChange:a=>{let s=a.target.value.trim().toUpperCase();/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(s)&&t(s)},onBlur:a=>{/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(a.target.value.trim().toUpperCase())||(a.target.value=i)}}))}function Ar(e){return typeof e=="string"&&/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(e)?e.toUpperCase():"#000000"}function fe({value:e,onChange:t,options:n,disabled:i,title:a}){return H.createElement("select",{className:"dshc-select",value:e,disabled:i,title:a,onChange:s=>t(s.target.value)},n.map(s=>H.createElement("option",{key:s.value,value:s.value},s.label)))}function Tt({value:e,onChange:t,label:n}){return H.createElement("button",{type:"button",role:"switch","aria-checked":!!e,className:`dshc-toggle ${e?"is-on":""}`,onClick:()=>t(!e),title:n},H.createElement("span",{className:"dshc-toggle-dot"}))}function Fr({title:e,children:t,onClose:n,footer:i,width:a=360}){return H.createElement("div",{className:"dshc-modal-backdrop",onPointerDown:s=>s.stopPropagation()},H.createElement("div",{className:"dshc-modal",style:{width:a}},H.createElement("div",{className:"dshc-modal-head"},H.createElement("span",null,e),H.createElement(X,{icon:"close",title:"\u5173\u95ED",onClick:n})),H.createElement("div",{className:"dshc-modal-body"},t),i?H.createElement("div",{className:"dshc-modal-foot"},i):null))}function fa({title:e,label:t,defaultValue:n,onCancel:i,onSubmit:a}){let[s,r]=H.useState(n??""),l=()=>{s.trim()&&a(s.trim())};return H.createElement(Fr,{title:e,onClose:i,footer:H.createElement(H.Fragment,null,H.createElement(O,{onClick:i},"\u53D6\u6D88"),H.createElement(O,{primary:!0,onClick:l,disabled:!s.trim()},"\u786E\u5B9A"))},H.createElement("label",{className:"dshc-dialog-field"},H.createElement("span",null,t??"\u540D\u79F0"),H.createElement("input",{autoFocus:!0,value:s,onChange:o=>r(o.target.value),onKeyDown:o=>{o.key==="Enter"&&l(),o.key==="Escape"&&i()}})))}function Nn({icon:e,title:t,text:n,action:i}){return H.createElement("div",{className:"dshc-empty-panel"},H.createElement(ye,{name:e,size:26}),H.createElement("div",{className:"dshc-empty-panel-title"},t),n?H.createElement("div",{className:"dshc-empty-panel-text"},n):null,i??null)}function Dt(e){let t=e.selectedNodes(),n=e.primaryNode(),i=t.length>0&&t.every(o=>o.sourceNode?.locked),a=t.length>0&&t.every(o=>o.sourceNode?.visible===!1),s=t.some(o=>o.sourceNode?.type==="group"),r=(e.clipboard?.length??0)>0;return[{label:"\u590D\u5236",shortcut:"\u2318C",icon:"front",disabled:!t.length,action:()=>e.copySelection()},{label:"\u526A\u5207",shortcut:"\u2318X",icon:"trash",disabled:!t.length,action:()=>{e.copySelection(),e.deleteSelection()}},{label:"\u7C98\u8D34",shortcut:"\u2318V",icon:"back",disabled:!r,action:()=>e.paste()},{label:"\u521B\u5EFA\u526F\u672C",shortcut:"\u2318D",icon:"group",disabled:!t.length,action:()=>e.duplicateSelection()},{label:"\u5220\u9664",shortcut:"\u232B",icon:"trash",danger:!0,disabled:!t.length,action:()=>e.deleteSelection()},{separator:!0},{label:"\u63D2\u5165\u5230\u5BF9\u8BDD",icon:"send",disabled:!t.length,action:()=>e.insertSelectionToComposer()},{separator:!0},{label:"\u7F16\u7EC4",shortcut:"\u2318G",icon:"group",disabled:t.length<2,action:()=>e.groupSelection()},{label:"\u53D6\u6D88\u7F16\u7EC4",shortcut:"\u21E7\u2318G",icon:"ungroup",disabled:!s,action:()=>e.ungroupSelection()},{label:"\u7F6E\u9876",shortcut:"]",icon:"front",disabled:!t.length,action:()=>e.reorder("front")},{label:"\u7F6E\u5E95",shortcut:"[",icon:"back",disabled:!t.length,action:()=>e.reorder("back")},{label:"\u4E0A\u79FB\u4E00\u5C42",icon:"front",disabled:!t.length,action:()=>e.reorder("forward")},{label:"\u4E0B\u79FB\u4E00\u5C42",icon:"back",disabled:!t.length,action:()=>e.reorder("backward")},{separator:!0},{label:i?"\u89E3\u9501":"\u9501\u5B9A",shortcut:"\u21E7\u2318L",icon:i?"unlock":"lock",disabled:!t.length,action:()=>t.forEach(o=>e.setLocked(o.sourceId,!i))},{label:a?"\u663E\u793A":"\u9690\u85CF",shortcut:"\u21E7\u2318H",icon:a?"eye":"eyeOff",disabled:!t.length,action:()=>t.forEach(o=>e.setVisibility(o.sourceId,a))},{separator:!0},{label:"\u521B\u5EFA\u7EC4\u4EF6",shortcut:"\u2325\u2318K",icon:"component",disabled:!n||!n.editable||n.isInstanceRoot,action:()=>e.createComponentFromSelection()},{separator:!0},{label:"\u9002\u5408\u9009\u533A",shortcut:"2",icon:"fit",disabled:!t.length,action:()=>e.zoomToSelection()},{label:"\u9002\u5408\u753B\u5E03",shortcut:"1",icon:"fit",action:()=>e.zoomToFit()},{label:"\u5168\u9009",shortcut:"\u2318A",disabled:!e.state.scene?.roots?.length,action:()=>e.setSelection((e.state.scene?.roots??[]).map(o=>o.key))},{label:"\u53D6\u6D88\u9009\u62E9",action:()=>e.clearSelection()}]}var ee="dshc",Lt=8;function Ht(e){if(!e||!(e instanceof HTMLElement))return!1;let t=e.tagName;return t==="INPUT"||t==="TEXTAREA"||t==="SELECT"||e.isContentEditable}function jt(e,t){let n=e.state.doc;if(!n)return null;for(let i of n.pages){let a=be(i.children,t);if(a)return a}for(let i of n.components){if(i.root.id===t)return i.root;let a=be(i.root.children??[],t);if(a)return a}return null}function ga(e,t,n,i){e.mutate(a=>{for(let s of t){let r=jt(e,s.sourceId);r&&(r.x=s.x+n,r.y=s.y+i)}},{commit:!1})}function Pr(e,t,n,i,a){if(a)return{dx:n,dy:i,guides:[]};let s=new Set(t.map(x=>x.sourceId)),r=t.map(x=>({x:x.absX+n,y:x.absY+i,width:x.width,height:x.height})),l=We(r);if(!l)return{dx:n,dy:i,guides:[]};let o=[],c=new Set;for(let x of t){let E=x.parent;c.add(E?.key??"root");let S=E?E.children:e.state.scene.roots;for(let k of S??[])!s.has(k.sourceId)&&k.visible!==!1&&o.push({x:k.absX,y:k.absY,width:k.width,height:k.height});E&&o.push({x:E.absX,y:E.absY,width:E.width,height:E.height})}let d=6/Math.max(.02,e.state.viewport.zoom),h={x:[l.x,l.x+l.width/2,l.x+l.width],y:[l.y,l.y+l.height/2,l.y+l.height]},p={x:{diff:0,position:null},y:{diff:0,position:null}};for(let x of o){let E={x:[x.x,x.x+x.width/2,x.x+x.width],y:[x.y,x.y+x.height/2,x.y+x.height]};for(let S of["x","y"])for(let k of h[S])for(let v of E[S]){let z=v-k;Math.abs(z)>d||(p[S].position===null||Math.abs(z)<Math.abs(p[S].diff))&&(p[S]={diff:z,position:v})}}let b=[];return p.x.position!==null&&b.push({axis:"x",value:p.x.position}),p.y.position!==null&&b.push({axis:"y",value:p.y.position}),{dx:n+p.x.diff,dy:i+p.y.diff,guides:b}}function Tr(e,t,n){let i=e.state.scene?.byKey.get(t.layoutParent.key);if(!i)return;let a=i.layout?.direction==="horizontal",s=(i.children??[]).filter(l=>l.sourceId!==t.sourceId),r=s.length;for(let l=0;l<s.length;l+=1){let o=s[l],c=a?o.absX+o.width/2:o.absY+o.height/2;if((a?n.x:n.y)<c){r=l;break}}e.mutate(l=>{let o=jt(e,i.sourceId);if(!o?.children)return;let c=o.children.findIndex(p=>p.id===t.sourceId);if(c===-1)return;let[d]=o.children.splice(c,1),h=Math.min(r,o.children.length);o.children.splice(h,0,d)},{commit:!1})}function Dr(e,t){return t.parent?{x:t.parent.absX,y:t.parent.absY}:{x:0,y:0}}function ya({store:e,version:t}){let n=N.useRef(null),i=N.useRef(null),a=N.useRef(!1),s=N.useRef(0),r=N.useRef(null),[l,o]=N.useState(""),[c,d]=N.useState(""),[h,p]=N.useState(null),[b,x]=N.useState(""),[E,S]=N.useState(null),[k,v]=N.useState(null),[z,G]=N.useState(null),[Z,J]=N.useState([]),[se,A]=N.useState(!1),[V,ne]=N.useState(null),[de,pe]=N.useState([]),F=e.state,Y=F.viewport,Ie=N.useRef({});Ie.current={store:e,version:t},N.useEffect(()=>{let f=n.current;if(!f)return;let y=new ResizeObserver(m=>{let g=m[0]?.contentRect;g&&(e.canvasSize={width:g.width,height:g.height},e.emit())});return y.observe(f),e.canvasSize={width:f.clientWidth,height:f.clientHeight},()=>y.disconnect()},[e]),N.useEffect(()=>{let f=n.current;if(!f)return;let y=g=>{g.preventDefault();let R=f.getBoundingClientRect(),C={x:g.clientX-R.left,y:g.clientY-R.top};if(g.ctrlKey||g.metaKey)e.zoomAt(C,Math.exp(-g.deltaY*.0015));else{let $=g.shiftKey?g.deltaY:g.deltaX,I=g.shiftKey?0:g.deltaY;e.setViewport({...e.state.viewport,x:e.state.viewport.x-$,y:e.state.viewport.y-I})}};f.addEventListener("wheel",y,{passive:!1});let m=g=>{let R=n.current?.closest?.(".dshc-root"),C=g.target;if(!R||!(C instanceof Node)||!R.contains(C))return;let $=document.activeElement;if(!($===n.current||n.current?.contains($))||Ht(C))return;let I=[...g.clipboardData?.files??[]];if(I.length){g.preventDefault();for(let U of I)U.type.startsWith("image/")&&e.uploadImageFile(U)}};return window.addEventListener("paste",m),()=>{f.removeEventListener("wheel",y),window.removeEventListener("paste",m)}},[e]),N.useEffect(()=>{F.editingText&&o(F.editingText.value??"")},[F.editingText?.key]),N.useEffect(()=>{let f=m=>{let g=n.current;if(!(g&&(document.activeElement===g||g.contains(document.activeElement)))&&!Ht(m.target))return;if(m.key===" "&&!Ht(m.target)){a.current=!0,A(!0),m.preventDefault();return}if(Ht(m.target))return;let C=m.key.toLowerCase(),$=m.metaKey||m.ctrlKey,I=Ie.current.store;if(m.key==="Escape"){I.state.crop?I.cancelCrop():I.state.editingText?I.cancelTextEdit():I.state.commentDraft?(I.state.commentDraft=null,I.emit()):I.state.enteredInstance?I.exitInstance():I.clearSelection();return}if(m.shiftKey&&!$&&m.code==="KeyA"){m.preventDefault();let P=I.selectedNodes().filter(T=>T.editable&&(T.type==="frame"||T.type==="group"));for(let T of P)I.updateNode(T.sourceId,{layout:{direction:"vertical",gap:8,padding:{top:12,right:12,bottom:12,left:12},alignPrimary:"start",alignCounter:"start"}});return}if($&&m.altKey&&C==="k"){m.preventDefault(),I.createComponentFromSelection();return}if($&&(m.code==="BracketRight"||m.code==="BracketLeft")){m.preventDefault();let T=m.code==="BracketRight"?m.shiftKey?"front":"forward":m.shiftKey?"back":"backward";I.reorder(T);return}if($&&m.shiftKey&&C==="l"){m.preventDefault();let P=I.selectedNodes(),T=!(P.length>0&&P.every(we=>we.sourceNode?.locked));for(let we of P)I.setLocked(we.sourceId,T);return}if($&&m.shiftKey&&C==="h"){m.preventDefault();let P=I.selectedNodes(),T=!(P.length>0&&P.every(we=>we.sourceNode?.visible===!1));for(let we of P)I.setVisibility(we.sourceId,T);return}if(!$&&m.shiftKey&&(m.code==="Digit1"||m.code==="Digit2")){m.preventDefault(),m.code==="Digit1"?I.zoomToFit():I.zoomToSelection();return}if(!$&&m.shiftKey&&m.code==="Digit0"){m.preventDefault(),I.setViewport({...I.state.viewport,zoom:1});return}if($&&C==="z"){m.preventDefault(),m.shiftKey?I.redo():I.undo();return}if($&&C==="a"){m.preventDefault();let P=I.state.scene?.roots??[];I.setSelection(P.map(T=>T.key));return}if($&&C==="c"){m.preventDefault(),I.copySelection();return}if($&&C==="x"){m.preventDefault(),I.copySelection(),I.deleteSelection();return}if($&&C==="v"){m.preventDefault(),I.paste();return}if($&&C==="d"){m.preventDefault(),I.duplicateSelection();return}if($&&C==="g"){m.preventDefault(),m.shiftKey?I.ungroupSelection():I.groupSelection();return}if($&&C==="0"){m.preventDefault(),I.setViewport({...I.state.viewport,zoom:1});return}if($&&(C==="="||C==="+")){m.preventDefault();let P=I.viewportSize();I.zoomAt({x:P.width/2,y:P.height/2},1.2);return}if($&&C==="-"){m.preventDefault();let P=I.viewportSize();I.zoomAt({x:P.width/2,y:P.height/2},.8333333333333334);return}if(C==="1"&&!$){I.zoomToFit();return}if(C==="2"&&!$){I.zoomToSelection();return}if(C==="delete"||C==="backspace"){m.preventDefault(),I.deleteSelection();return}if(C==="enter"){let P=I.primaryNode();P&&(P.type==="frame"||P.type==="group")&&P.children?.length&&I.setSelection([P.children[0].key]);return}let U={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1]}[C];if(U){m.preventDefault();let P=m.shiftKey?10:1,T=I.selectedNodes().filter(ge=>ge.editable);if(!T.length)return;let we=T.map(ge=>({sourceId:ge.sourceId,x:ge.sourceNode.x,y:ge.sourceNode.y,absX:ge.absX,absY:ge.absY,width:ge.width,height:ge.height,parent:ge.parent}));ga(I,we,U[0]*P,U[1]*P),I.commit(),I.scheduleSave();return}let B={v:"pointer",f:"frame",r:"rect",o:"ellipse",l:"line",t:"text",h:"hand",c:"comment",i:"image"};!$&&B[C]&&(I.setTool(B[C]),C==="i"&&Ie.current.store.requestImagePick?.())},y=m=>{m.key===" "&&(a.current=!1,A(!1)),m.key==="Alt"&&pe([])};return window.addEventListener("keydown",f),window.addEventListener("keyup",y),()=>{window.removeEventListener("keydown",f),window.removeEventListener("keyup",y)}},[]);let ze=f=>{r.current=f,!s.current&&(s.current=requestAnimationFrame(()=>{s.current=0;let y=r.current;r.current=null,y?.()}))},Ce=f=>{let y=n.current.getBoundingClientRect();return{x:f.clientX-y.left,y:f.clientY-y.top}};N.useEffect(()=>{if(!V)return;let f=m=>{m.type==="pointerdown"&&m.target?.closest?.(".dshc-context-menu")||ne(null)},y=m=>{m.key==="Escape"&&(m.preventDefault(),m.stopPropagation(),ne(null))};return window.addEventListener("pointerdown",f,!0),window.addEventListener("wheel",f,{capture:!0,passive:!0}),window.addEventListener("keydown",y,!0),()=>{window.removeEventListener("pointerdown",f,!0),window.removeEventListener("wheel",f,!0),window.removeEventListener("keydown",y,!0)}},[V]);let Aa=f=>{if(f.preventDefault(),!n.current)return;let y=Ce(f),m=Te(Y,y),g=Je(e.state.scene,m,{enteredInstance:e.state.enteredInstance});g&&!e.state.selection.includes(g.key)&&e.setSelection([g.key]);let R=n.current?.getBoundingClientRect?.(),C=typeof window<"u"?window.innerWidth:1200,$=typeof window<"u"?window.innerHeight:800,I=Math.max(8,(R?.bottom??$)-460);ne({x:Math.min(Math.max(8,f.clientX),Math.max(8,C-224)),y:Math.min(Math.max(8,f.clientY),I),fixed:!0,world:m,hit:g?.key??null})},Fa=f=>{if(!f)return[];let y=4,m={l:f.absX,t:f.absY,r:f.absX+f.width,b:f.absY+f.height},g=(f.parent?.children??e.state.scene?.roots??[]).filter(P=>P&&P!==f&&P.visible!==!1),R=null,C=null,$=null,I=null;for(let P of g){let T={l:P.absX,t:P.absY,r:P.absX+P.width,b:P.absY+P.height};if(Math.min(m.b,T.b)-Math.max(m.t,T.t)>0){let Ae=m.l-T.r,$e=T.l-m.r;Ae>=y&&(!R||T.r>R.node.r)&&(R={node:T,gap:Ae,cross:(Math.max(m.t,T.t)+Math.min(m.b,T.b))/2}),$e>=y&&(!C||T.l<C.node.l)&&(C={node:T,gap:$e,cross:(Math.max(m.t,T.t)+Math.min(m.b,T.b))/2})}if(Math.min(m.r,T.r)-Math.max(m.l,T.l)>0){let Ae=m.t-T.b,$e=T.t-m.b;Ae>=y&&(!$||T.b>$.node.b)&&($={node:T,gap:Ae,cross:(Math.max(m.l,T.l)+Math.min(m.r,T.r))/2}),$e>=y&&(!I||T.t<I.node.t)&&(I={node:T,gap:$e,cross:(Math.max(m.l,T.l)+Math.min(m.r,T.r))/2})}}let U=[],B=(P,T,we,ge,Ae)=>{if(!(T>0))return;let $e=ue(Y,{x:ge,y:we}),Oe=ue(Y,{x:Ae,y:we});U.push({axis:P,x1:$e.x,y1:$e.y,x2:Oe.x,y2:Oe.y,label:String(Math.round(T))})};if(R&&B("h",R.gap,R.cross,R.node.r,m.l),C&&B("h",C.gap,C.cross,m.r,C.node.l),$){let P=ue(Y,{x:$.cross,y:$.node.b}),T=ue(Y,{x:$.cross,y:m.t});U.push({axis:"v",x1:P.x,y1:P.y,x2:T.x,y2:T.y,label:String(Math.round($.gap))})}if(I){let P=ue(Y,{x:I.cross,y:m.b}),T=ue(Y,{x:I.cross,y:I.node.t});U.push({axis:"v",x1:P.x,y1:P.y,x2:T.x,y2:T.y,label:String(Math.round(I.gap))})}return U},Pa=f=>{if(f.button===2)return;pe([]),n.current?.focus?.({preventScroll:!0});let y=f.target,m=Ce(f),g=Te(Y,m);if(e.canvasSize={width:n.current.clientWidth,height:n.current.clientHeight},y.closest?.("[data-comment-pin]")||F.editingText)return;let R=y.closest?.("[data-handle]")?.getAttribute("data-handle");if(R){f.preventDefault(),Ta(R,m,f.pointerId);return}if(f.button===1||a.current||F.tool==="hand"){f.preventDefault(),i.current={mode:"pan",startScreen:m,startViewport:{...Y}},n.current.setPointerCapture?.(f.pointerId);return}if(F.crop){let B=e.findSceneNode(F.crop.key);if(B&&yt(B,g)){i.current={mode:"crop",start:g,startCrop:{...F.crop.crop},node:B},n.current.setPointerCapture?.(f.pointerId);return}}if(F.tool==="comment"){let B=Je(e.state.scene,g,{enteredInstance:e.state.enteredInstance});e.state.commentDraft={x:g.x,y:g.y,nodeId:B?.sourceId,screenX:m.x,screenY:m.y},e.emit();return}if(["frame","rect","ellipse","line","text"].includes(F.tool)){let B=Pn(e,g),P=B?.type==="instance"?null:B;i.current={mode:"draw",tool:F.tool,start:g,parent:P,startScreen:m},G({x:m.x,y:m.y,width:0,height:0}),n.current.setPointerCapture?.(f.pointerId);return}let $=Je(e.state.scene,g,{enteredInstance:e.state.enteredInstance});if(!$){i.current={mode:"marquee",start:g,startScreen:m,container:Pn(e,g)},v({x:m.x,y:m.y,width:0,height:0}),f.shiftKey||e.clearSelection(),n.current.setPointerCapture?.(f.pointerId);return}if(f.shiftKey){e.toggleSelection($.key);return}e.state.selection.includes($.key)||e.setSelection([$.key]);let I=e.selectedNodes().filter(B=>B.editable);if(!I.length)return;let U=I.map(B=>({key:B.key,sourceId:B.sourceId,x:B.sourceNode.x,y:B.sourceNode.y,absX:B.absX,absY:B.absY,width:B.width,height:B.height,parent:B.parent,layoutParent:B.parent?.layout&&B.parent.type!=="instance"?B.parent:null,node:B}));i.current={mode:"move",start:g,startScreen:m,entries:U,moved:!1,alt:f.altKey,duplicated:!1},n.current.setPointerCapture?.(f.pointerId)},Pn=(f,y)=>{let m=Je(f.state.scene,y,{enteredInstance:f.state.enteredInstance});if(!m)return null;let g=m;for(;g;){if(g.type==="frame"||g.type==="instance")return g;g=g.parent}return null},Ta=(f,y,m)=>{let g=e.primaryNode();if(!(!g||!g.editable)){if(f==="rotate"){let R=ue(Y,Ze(g));i.current={mode:"rotate",node:g,startAngle:Math.atan2(y.y-R.y,y.x-R.x),startRotation:g.rotation??0},n.current.setPointerCapture?.(m);return}i.current={mode:"resize",handle:f,node:g,startWidth:g.width,startHeight:g.height,startAbsX:g.absX,startAbsY:g.absY,startX:g.sourceNode.x,startY:g.sourceNode.y,startRotation:g.rotation??0,parentAbs:Dr(e,g)},n.current.setPointerCapture?.(m)}},Da=f=>{let y=i.current,m=Ce(f),g=Te(Y,m);if(!y){let R=Je(e.state.scene,g,{enteredInstance:e.state.enteredInstance});(R?.key??null)!==E&&S(R?.key??null),f.altKey&&!F.editingText?pe(Fa(e.primaryNode()??R)):de.length&&pe([]);return}if(y.mode==="pan"){e.setViewport({...y.startViewport,x:y.startViewport.x+(m.x-y.startScreen.x),y:y.startViewport.y+(m.y-y.startScreen.y)});return}if(y.mode==="crop"){let R=(g.x-y.start.x)/y.node.width,C=(g.y-y.start.y)/y.node.height,$={...y.startCrop};$.x=Math.min(1-$.width,Math.max(0,y.startCrop.x-R*$.width)),$.y=Math.min(1-$.height,Math.max(0,y.startCrop.y-C*$.height)),e.updateCrop($);return}if(y.mode==="marquee"){let R=Math.min(y.startScreen.x,m.x),C=Math.min(y.startScreen.y,m.y);v({x:R,y:C,width:Math.abs(m.x-y.startScreen.x),height:Math.abs(m.y-y.startScreen.y)});return}if(y.mode==="draw"){let R=Math.min(y.startScreen.x,m.x),C=Math.min(y.startScreen.y,m.y);G({x:R,y:C,width:Math.abs(m.x-y.startScreen.x),height:Math.abs(m.y-y.startScreen.y)});return}if(y.mode==="move"){let R=g.x-y.start.x,C=g.y-y.start.y;if(!y.moved&&Math.abs(R)+Math.abs(C)>.5&&(y.moved=!0,y.alt&&(e.duplicateSelection(),y.entries=e.selectedNodes().filter($=>$.editable).map($=>({key:$.key,sourceId:$.sourceId,x:$.sourceNode.x,y:$.sourceNode.y,absX:$.absX,absY:$.absY,width:$.width,height:$.height,parent:$.parent,node:$})),y.duplicated=!0)),y.entries.length===1&&y.entries[0].layoutParent){ze(()=>Tr(e,y.entries[0],g));return}ze(()=>{let $=Pr(e,y.entries,R,C,y.duplicated||f.altKey);ga(e,y.entries,$.dx,$.dy),J($.guides)});return}if(y.mode==="resize"){ze(()=>La(y,g,f.shiftKey));return}if(y.mode==="rotate"){let R=ue(e.state.viewport,Ze(y.node)),$=(Math.atan2(m.y-R.y,m.x-R.x)-y.startAngle)*180/Math.PI;e.mutate(I=>{let U=jt(e,y.node.sourceId);U&&(U.rotation=Math.round((y.startRotation+$)*10)/10)},{commit:!1});return}},La=(f,y,m)=>{let R={...f.node,absX:f.startAbsX,absY:f.startAbsY,width:f.startWidth,height:f.startHeight,rotation:f.startRotation},C=pn(R,y),$=f.handle,I=f.startWidth,U=f.startHeight,B,P,T=f.startAbsX+f.startWidth,we=f.startAbsY+f.startHeight;if($.includes("w")&&(I=Math.max(1,f.startWidth-C.x)),$.includes("e")&&(I=Math.max(1,C.x)),$.includes("n")&&(U=Math.max(1,f.startHeight-C.y)),$.includes("s")&&(U=Math.max(1,C.y)),m&&$.length===2&&f.startWidth>0&&f.startHeight>0){let Qe=f.startWidth/f.startHeight;I/U>Qe?I=U*Qe:U=I/Qe}$==="nw"?(B={x:I,y:U},P=me(R,{x:f.startWidth,y:f.startHeight})):$==="ne"?(B={x:0,y:U},P=me(R,{x:0,y:f.startHeight})):$==="sw"?(B={x:I,y:0},P=me(R,{x:f.startWidth,y:0})):$==="se"?(B={x:0,y:0},P=me(R,{x:0,y:0})):$==="n"?(B={x:I/2,y:U},P=me(R,{x:f.startWidth/2,y:f.startHeight})):$==="s"?(B={x:I/2,y:0},P=me(R,{x:f.startWidth/2,y:0})):$==="w"?(B={x:I,y:U/2},P=me(R,{x:f.startWidth,y:f.startHeight/2})):(B={x:0,y:U/2},P=me(R,{x:0,y:f.startHeight/2}));let ge=(f.startRotation??0)*Math.PI/180,Ae={x:I/2,y:U/2},$e=Ae.x-B.x,Oe=Ae.y-B.y,lt={x:P.x+$e*Math.cos(ge)-Oe*Math.sin(ge),y:P.y+$e*Math.sin(ge)+Oe*Math.cos(ge)},Ke=lt.x-I/2,dt=lt.y-U/2;e.mutate(Qe=>{let ht=jt(e,f.node.sourceId);ht&&(ht.width=Math.round(I),ht.height=Math.round(U),ht.x=Math.round(Ke-f.parentAbs.x),ht.y=Math.round(dt-f.parentAbs.y))},{commit:!1})},Tn=f=>{let y=i.current;if(i.current=null,J([]),!!y){if(y.mode==="marquee"){let m=Ce(f),g=Math.min(y.startScreen.x,m.x),R=Math.min(y.startScreen.y,m.y),C=Math.abs(m.x-y.startScreen.x),$=Math.abs(m.y-y.startScreen.y);if(v(null),C>3||$>3){let I=Te(Y,{x:g,y:R}),U={x:I.x,y:I.y,width:C/Y.zoom,height:$/Y.zoom},P=(y.container?y.container.children??[]:e.state.scene?.roots??[]).filter(T=>T.visible!==!1&&Pi(U,{x:T.absX,y:T.absY,width:T.width,height:T.height})).map(T=>T.key);e.setSelection(P)}return}if(y.mode==="draw"){G(null);let m=Ce(f),g=y.start,R=Te(Y,m),C=R.x-g.x,$=R.y-g.y,I=Math.abs(C),U=Math.abs($),B=y.parent,P=B?{x:B.absX,y:B.absY}:{x:0,y:0},T=I<4&&U<4,we={frame:{width:320,height:480},rect:{width:120,height:120},ellipse:{width:120,height:120},text:{width:200,height:28},line:{width:160,height:0}}[y.tool],ge=T?we.width:Math.max(2,I),Ae=T?we.height:Math.max(y.tool==="line"?0:2,U),$e=T?g.x:Math.min(g.x,R.x),Oe=T?g.y:Math.min(g.y,R.y),lt=0;if(y.tool==="line"&&!T){let Qe=Math.max(2,Math.hypot(C,$));$e=(g.x+R.x)/2-Qe/2,Oe=(g.y+R.y)/2,lt=Math.atan2($,C)*180/Math.PI}let Ke={type:y.tool,name:y.tool==="text"?"Text":y.tool==="frame"?"Frame":y.tool==="rect"?"Rectangle":y.tool==="ellipse"?"Ellipse":"Line",x:$e-P.x,y:Oe-P.y,width:y.tool==="line"&&!T?Math.max(2,Math.hypot(C,$)):ge,height:y.tool==="line"?0:Ae,rotation:lt,opacity:1,visible:!0,locked:!1};y.tool==="frame"?Object.assign(Ke,{fills:[{type:"solid",color:"#FFFFFF"}],strokes:[],effects:[],cornerRadius:0,clip:!0,children:[]}):y.tool==="rect"||y.tool==="ellipse"?Object.assign(Ke,{fills:[{type:"solid",color:"#D9D9D9"}],strokes:[],effects:[],cornerRadius:0}):y.tool==="text"?Object.assign(Ke,{text:"Text",font:{family:"system-ui",weight:400,style:"normal",size:16,lineHeight:1.4,letterSpacing:0},align:"left",verticalAlign:"top",fills:[{type:"solid",color:"#111111"}],effects:[],autoHeight:!0}):y.tool==="line"&&Object.assign(Ke,{strokes:[{color:"#111111",width:1,align:"center"}]});let dt=e.addNode(Ke,B?.sourceId??null);dt&&(e.setTool("pointer"),dt.type==="text"&&e.beginTextEdit(dt.id));return}if(y.mode==="crop"){e.commitCrop();return}if(y.mode==="move"||y.mode==="resize"||y.mode==="rotate"){if(s.current){cancelAnimationFrame(s.current),s.current=0;let m=r.current;r.current=null,m?.()}e.commit(),e.scheduleSave(),e.queueSelectionPost()}}},Ha=f=>{let y=Ce(f),m=Te(Y,y),g=Je(e.state.scene,m,{enteredInstance:e.state.enteredInstance,deep:!0});if(g){if(g.type==="text"){e.beginTextEdit(g.key);return}if(g.type==="instance"){e.enterInstance(g.key);return}if(g.type==="frame"||g.type==="group"){g.children?.length&&e.setSelection([g.children[0].key]);return}if(g.instanceId&&e.state.enteredInstance===g.instanceId){e.setSelection([g.key]);return}}},Oa=()=>{let f=e.selectedNodes(),y=e.primaryNode(),m=[];for(let g of f){let R=mn(g).map(C=>ue(Y,C));m.push(N.createElement("polygon",{key:`outline-${g.key}`,points:R.map(C=>`${C.x},${C.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:1}))}if(E&&!F.selection.includes(E)){let g=e.findSceneNode(E);if(g){let R=mn(g).map(C=>ue(Y,C));m.push(N.createElement("polygon",{key:"hover",points:R.map(C=>`${C.x},${C.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:1,opacity:.55}))}}if(y&&f.length===1&&y.editable&&!F.crop){let g=Ti(y,Y);for(let[$,I]of Object.entries(g))m.push(N.createElement("rect",{key:`handle-${$}`,x:I.x-Lt/2,y:I.y-Lt/2,width:Lt,height:Lt,fill:"var(--dsw-alias-bg-base)",stroke:"var(--dshc-accent)",strokeWidth:1,style:{cursor:$==="n"||$==="s"?"ns-resize":$==="e"||$==="w"?"ew-resize":$==="nw"||$==="se"?"nwse-resize":"nesw-resize"},"data-handle":$}));let R=Di(y,Y),C=ue(Y,me(y,{x:y.width/2,y:0}));m.push(N.createElement("line",{key:"rotate-line",x1:C.x,y1:C.y,x2:R.x,y2:R.y,stroke:"var(--dshc-accent)",strokeWidth:1}),N.createElement("circle",{key:"rotate",cx:R.x,cy:R.y,r:5,fill:"var(--dsw-alias-bg-base)",stroke:"var(--dshc-accent)",strokeWidth:1,"data-handle":"rotate",style:{cursor:"grab"}}))}for(let g of Z)if(g.axis==="x"){let R=g.value*Y.zoom+Y.x;m.push(N.createElement("line",{key:`guide-${g.value}`,x1:R,y1:0,x2:R,y2:"100%",stroke:"var(--dsw-alias-state-error-primary)",strokeWidth:1,strokeDasharray:"4 4"}))}else{let R=g.value*Y.zoom+Y.y;m.push(N.createElement("line",{key:`guide-${g.value}`,x1:0,y1:R,x2:"100%",y2:R,stroke:"var(--dsw-alias-state-error-primary)",strokeWidth:1,strokeDasharray:"4 4"}))}if(k&&m.push(N.createElement("rect",{key:"marquee",x:k.x,y:k.y,width:k.width,height:k.height,fill:"color-mix(in srgb, var(--dshc-accent) 10%, transparent)",stroke:"var(--dshc-accent)",strokeWidth:1,strokeDasharray:"4 3"})),z&&m.push(N.createElement("rect",{key:"draw",x:z.x,y:z.y,width:z.width,height:z.height,fill:"none",stroke:"var(--dshc-accent)",strokeWidth:1,strokeDasharray:"4 3"})),F.crop){let g=e.findSceneNode(F.crop.key);if(g){let R=F.crop.crop,C=[ue(Y,me(g,{x:R.x*g.width,y:R.y*g.height})),ue(Y,me(g,{x:(R.x+R.width)*g.width,y:R.y*g.height})),ue(Y,me(g,{x:(R.x+R.width)*g.width,y:(R.y+R.height)*g.height})),ue(Y,me(g,{x:R.x*g.width,y:(R.y+R.height)*g.height}))];m.push(N.createElement("polygon",{key:"crop",points:C.map($=>`${$.x},${$.y}`).join(" "),fill:"none",stroke:"var(--dshc-accent)",strokeWidth:2}))}}for(let[g,R]of de.entries()){let C="#FF4D6D";m.push(N.createElement("line",{key:`measure-line-${g}`,x1:R.x1,y1:R.y1,x2:R.x2,y2:R.y2,stroke:C,strokeWidth:1}));let $=4;R.axis==="h"?m.push(N.createElement("line",{key:`measure-t1-${g}`,x1:R.x1,y1:R.y1-$,x2:R.x1,y2:R.y1+$,stroke:C,strokeWidth:1}),N.createElement("line",{key:`measure-t2-${g}`,x1:R.x2,y1:R.y2-$,x2:R.x2,y2:R.y2+$,stroke:C,strokeWidth:1})):m.push(N.createElement("line",{key:`measure-t1-${g}`,x1:R.x1-$,y1:R.y1,x2:R.x1+$,y2:R.y1,stroke:C,strokeWidth:1}),N.createElement("line",{key:`measure-t2-${g}`,x1:R.x2-$,y1:R.y2,x2:R.x2+$,y2:R.y2,stroke:C,strokeWidth:1}));let I=(R.x1+R.x2)/2,U=(R.y1+R.y2)/2,B=Math.max(20,R.label.length*6+8),P=R.axis==="h"?I-B/2:I+6,T=R.axis==="h"?U-13:U-7;m.push(N.createElement("rect",{key:`measure-bg-${g}`,x:P,y:T,width:B,height:14,rx:3,fill:C}),N.createElement("text",{key:`measure-text-${g}`,x:P+B/2,y:T+10,fill:"#FFFFFF",fontSize:9,fontFamily:"system-ui",textAnchor:"middle"},R.label))}return m},Vt=F.editingText?e.findSceneNode(F.editingText.key):null,Dn=(F.doc?.comments??[]).filter(f=>f.pageId===F.pageId),Ba=F.showComments?Dn.filter(f=>!f.resolved):[],_t=e.primaryNode(),uo=_t&&_t.type==="text"?Ft(_t):{color:"var(--dsw-alias-label-primary)"},ja=V?Dt(e):[];return N.createElement("div",{ref:n,className:`${ee}-viewport`,"data-tool":F.tool,tabIndex:-1,onPointerDown:Pa,onPointerMove:Da,onPointerUp:Tn,onPointerCancel:Tn,onPointerLeave:()=>pe([]),onDoubleClick:Ha,onContextMenu:Aa,onDragOver:f=>{f.dataTransfer?.types?.includes("Files")&&f.preventDefault()},onDrop:f=>{let y=[...f.dataTransfer?.files??[]];if(y.length){f.preventDefault();for(let m of y)m.type.startsWith("image/")&&e.uploadImageFile(m)}},style:{position:"absolute",inset:0,overflow:"hidden",cursor:F.tool==="hand"||se?"grab":F.tool==="comment"?"crosshair":F.tool==="pointer"?"default":"crosshair",background:"var(--dsw-alias-bg-base)",backgroundImage:"radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent) 1px, transparent 0)",backgroundSize:"16px 16px",userSelect:"none"}},N.createElement("div",{className:`${ee}-world`,style:{position:"absolute",left:0,top:0,transform:`translate(${Y.x}px, ${Y.y}px) scale(${Y.zoom})`,transformOrigin:"0 0"}},N.createElement(pa,{scene:F.scene,store:e})),N.createElement("svg",{className:`${ee}-overlay`,style:{position:"absolute",inset:0,pointerEvents:"none",overflow:"visible"}},Oa()),(F.scene?.roots??[]).filter(f=>f.type==="frame"&&f.visible!==!1).map(f=>N.createElement(Lr,{key:`frame-label-${f.key}`,node:f,viewport:Y,selected:F.selection.includes(f.key),onSelect:()=>{e.setSelection([f.key]),e.emit()}})),E&&!(F.scene?.roots??[]).some(f=>f.key===E&&f.type==="frame")&&N.createElement(Hr,{node:e.findSceneNode(E),viewport:Y,key:`hover-label-${E}`}),F.editingText&&Vt&&N.createElement(Or,{key:`edit-${Vt.key}`,node:Vt,viewport:Y,value:l,onChange:o,onCommit:()=>e.commitTextEdit(l),onCancel:()=>e.cancelTextEdit()}),F.commentDraft&&N.createElement(Br,{draft:F.commentDraft,value:c,onChange:d,onCancel:()=>{F.commentDraft=null,d(""),e.emit()},onSave:()=>{e.addComment(c,{nodeId:F.commentDraft.nodeId,x:F.commentDraft.x,y:F.commentDraft.y}),d("")}}),Ba.map(f=>N.createElement("button",{key:f.id,type:"button","data-comment-pin":f.id,className:`${ee}-comment-pin ${f.author==="ai"?`${ee}-comment-pin-ai`:""}`,style:(()=>{let y=e.commentPosition(f);return{left:y.x,top:y.y}})(),onClick:y=>{y.stopPropagation(),p(h===f.id?null:f.id);let m=f.nodeId?e.findSceneNode(f.nodeId):null;m&&e.setSelection([m.key])},title:f.body},f.replies?.length?String(f.replies.length+1):"1")),h&&(()=>{let f=Dn.find(m=>m.id===h);if(!f)return null;let y=e.commentPosition(f);return N.createElement(jr,{comment:f,position:y,replyText:b,onReplyChange:x,onReply:()=>{e.replyComment(f.id,b),x("")},onResolve:()=>{e.resolveComment(f.id,!0),p(null)},onDelete:()=>{e.deleteComment(f.id),p(null)},onClose:()=>p(null)})})(),F.crop&&N.createElement(Yr,{crop:F.crop.crop,onChange:f=>e.updateCrop(f),onCommit:()=>e.commitCrop(),onCancel:()=>e.cancelCrop()}),V&&N.createElement(Pt,{x:V.x,y:V.y,fixed:V.fixed,items:ja,onClose:()=>ne(null)}),!F.scene?.roots?.length&&N.createElement("div",{className:`${ee}-empty`,style:{pointerEvents:"none"}},N.createElement("div",{className:`${ee}-empty-title`},"\u753B\u5E03\u662F\u7A7A\u7684"),N.createElement("div",{className:`${ee}-empty-text`},"\u7528\u5DE5\u5177\u680F\u753B\u4E00\u4E2A Frame\uFF0C\u6216\u70B9\u300C\u8BA9 AI \u751F\u6210\u300D")))}function Lr({node:e,viewport:t,selected:n,onSelect:i}){let a=me(e,{x:0,y:0}),s=ue(t,a);return N.createElement("div",{className:`${ee}-frame-label ${n?"is-selected":""}`,style:{position:"absolute",left:s.x,top:s.y-6,transform:"translateY(-100%)",maxWidth:220,padding:"1px 6px",borderRadius:4,font:"500 11px/1.5 var(--dsw-font-family, system-ui, sans-serif)",background:n?"var(--dshc-accent)":"var(--dsw-alias-label-primary)",color:n?"#FFFFFF":"var(--dsw-alias-bg-base)",opacity:n?1:.78,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",cursor:"pointer",pointerEvents:"auto",userSelect:"none",zIndex:9},title:e.name,onPointerDown:r=>{r.preventDefault(),r.stopPropagation(),i?.()}},e.name||"Frame")}function Hr({node:e,viewport:t}){if(!e)return null;let n=ue(t,{x:e.absX,y:e.absY-18/t.zoom});return N.createElement("div",{className:`${ee}-hover-label`,style:{position:"absolute",left:n.x,top:n.y,pointerEvents:"none"}},e.name)}function Or({node:e,viewport:t,value:n,onChange:i,onCommit:a,onCancel:s}){let r=N.useRef(null);N.useEffect(()=>{r.current?.focus(),r.current?.select()},[]);let l=e.absX*t.zoom+t.x,o=e.absY*t.zoom+t.y,c=Math.max(24,e.width*t.zoom),d=Math.max(20,e.height*t.zoom),h=Ft(e);return N.createElement("textarea",{ref:r,className:`${ee}-text-editor`,value:n,onChange:p=>i(p.target.value),onPointerDown:p=>p.stopPropagation(),onBlur:a,onKeyDown:p=>{p.stopPropagation(),p.key==="Escape"?(p.preventDefault(),s()):p.key==="Enter"&&(p.metaKey||p.ctrlKey)&&(p.preventDefault(),a())},style:{position:"absolute",left:l,top:o,width:c,height:d,padding:0,margin:0,border:"1px solid var(--dshc-accent)",outline:"none",resize:"none",overflow:"hidden",background:"color-mix(in srgb, var(--dsw-alias-bg-overlay) 88%, transparent)",color:h.color==="transparent"?"var(--dsw-alias-label-primary)":h.color,fontFamily:`"${e.font?.family??"system-ui"}", system-ui, sans-serif`,fontWeight:e.font?.weight??400,fontStyle:e.font?.style??"normal",fontSize:`${(e.font?.size??14)*t.zoom}px`,lineHeight:String(e.font?.lineHeight??1.4),letterSpacing:`${(e.font?.letterSpacing??0)*t.zoom}px`,textAlign:e.align??"left",zIndex:20,borderRadius:2}})}function Br({draft:e,value:t,onChange:n,onCancel:i,onSave:a}){return N.createElement("div",{className:`${ee}-comment-popover`,style:{left:Math.max(8,e.screenX),top:Math.max(8,e.screenY)},onPointerDown:s=>s.stopPropagation()},N.createElement("div",{className:`${ee}-comment-title`},"\u6DFB\u52A0\u8BC4\u8BBA"),N.createElement("textarea",{autoFocus:!0,value:t,onChange:s=>n(s.target.value),placeholder:"\u5199\u4E0B\u8BBE\u8BA1\u53CD\u9988\u2026",className:`${ee}-comment-input`,rows:3}),N.createElement("div",{className:`${ee}-comment-actions`},N.createElement("button",{type:"button",onClick:i,className:`${ee}-btn`},"\u53D6\u6D88"),N.createElement("button",{type:"button",onClick:a,className:`${ee}-btn ${ee}-btn-primary`,disabled:!t.trim()},"\u8BC4\u8BBA")))}function jr({comment:e,position:t,replyText:n,onReplyChange:i,onReply:a,onResolve:s,onDelete:r,onClose:l}){return N.createElement("div",{className:`${ee}-comment-popover`,style:{left:Math.max(8,t.x+14),top:Math.max(8,t.y-8)},onPointerDown:o=>o.stopPropagation()},N.createElement("div",{className:`${ee}-comment-title`},e.resolved?"\u5DF2\u89E3\u51B3\u8BC4\u8BBA":"\u8BC4\u8BBA"),N.createElement("div",{className:`${ee}-comment-author`},e.author==="ai"?"AI":"\u4F60"),N.createElement("div",{className:`${ee}-comment-body`},e.body),(e.replies??[]).map(o=>N.createElement("div",{key:o.id,className:`${ee}-comment-reply`},N.createElement("b",null,o.author==="ai"?"AI":"\u4F60"),N.createElement("span",null,o.body))),!e.resolved&&N.createElement("div",null,N.createElement("textarea",{value:n,onChange:o=>i(o.target.value),placeholder:"\u56DE\u590D\u2026",className:`${ee}-comment-input`,rows:2}),N.createElement("div",{className:`${ee}-comment-actions`},N.createElement("button",{type:"button",className:`${ee}-btn`,onClick:l},"\u5173\u95ED"),N.createElement("button",{type:"button",className:`${ee}-btn`,onClick:r},"\u5220\u9664"),N.createElement("button",{type:"button",className:`${ee}-btn`,onClick:s},"\u89E3\u51B3"),N.createElement("button",{type:"button",className:`${ee}-btn ${ee}-btn-primary`,onClick:a,disabled:!n.trim()},"\u56DE\u590D"))))}function Yr({crop:e,onChange:t,onCommit:n,onCancel:i}){return N.createElement("div",{className:`${ee}-crop-bar`,onPointerDown:a=>a.stopPropagation()},N.createElement("span",null,"\u88C1\u526A"),N.createElement("label",null,"X",N.createElement("input",{type:"number",step:.01,min:0,max:1,value:Ot(e.x),onChange:a=>t({...e,x:Bt(a.target.value)})})),N.createElement("label",null,"Y",N.createElement("input",{type:"number",step:.01,min:0,max:1,value:Ot(e.y),onChange:a=>t({...e,y:Bt(a.target.value)})})),N.createElement("label",null,"\u5BBD",N.createElement("input",{type:"number",step:.01,min:.05,max:1,value:Ot(e.width),onChange:a=>t({...e,width:Bt(a.target.value,.05,1)})})),N.createElement("label",null,"\u9AD8",N.createElement("input",{type:"number",step:.01,min:.05,max:1,value:Ot(e.height),onChange:a=>t({...e,height:Bt(a.target.value,.05,1)})})),N.createElement("button",{type:"button",className:`${ee}-btn`,onClick:i},"\u53D6\u6D88"),N.createElement("button",{type:"button",className:`${ee}-btn ${ee}-btn-primary`,onClick:n},"\u5B8C\u6210"))}function Ot(e){return Math.round((Number(e)||0)*100)/100}function Bt(e,t=0,n=1){return Math.min(n,Math.max(t,Number(e)||0))}var j=Be(require("react"),1);var Xr=[["pointer","v","\u79FB\u52A8/\u9009\u62E9 (V)"],["frame","f","Frame (F)"],["rect","r","\u77E9\u5F62 (R)"],["ellipse","o","\u692D\u5706 (O)"],["line","l","\u76F4\u7EBF (L)"],["text","t","\u6587\u672C (T)"],["image","i","\u56FE\u7247 (I)"],["hand","h","\u6293\u624B (H)"],["comment","c","\u8BC4\u8BBA (C)"]];function xa({store:e,onNewDoc:t,onRenameDoc:n,onDeleteDoc:i,onNeedName:a,inspectorOpen:s,onToggleInspector:r}){let l=e.state,[o,c]=j.useState(!1),[d,h]=j.useState(!1),p=j.useRef(null),b=j.useRef(null),x=j.useRef(null);j.useEffect(()=>{if(!d)return;let A=ne=>{p.current?.contains(ne.target)||h(!1)},V=ne=>{ne.key==="Escape"&&h(!1)};return window.addEventListener("pointerdown",A,!0),window.addEventListener("keydown",V,!0),()=>{window.removeEventListener("pointerdown",A,!0),window.removeEventListener("keydown",V,!0)}},[d]);let E=A=>A.title&&A.title!==A.name?`${A.title} \xB7 ${A.name}`:A.name,S=l.docs.some(A=>A.name===l.name)?l.docs:[{name:l.name,title:l.name},...l.docs],k=S.find(A=>A.name===l.name)??S[0],v=k?E(k):l.name,G=l.scene?.roots??[],Z=l.selection.length,J=()=>{e.imageInsertPoint=null,e.requestImagePick?.()},se=A=>{if(A==="image"){J();return}e.setTool(A)};return j.createElement("div",{className:"dshc-topbar"},j.createElement("div",{className:"dshc-topbar-row dshc-topbar-docs"},j.createElement("div",{className:"dshc-doc-picker",ref:p},j.createElement("button",{type:"button",className:"dshc-doc-trigger",title:"\u5207\u6362 / \u91CD\u547D\u540D\u753B\u5E03\u6587\u6863",onClick:()=>h(A=>!A)},j.createElement("span",{className:"dshc-doc-trigger-label"},v),j.createElement(ye,{name:"chevronDown",size:12})),d&&j.createElement("div",{className:"dshc-doc-menu"},S.map(A=>j.createElement("div",{key:A.name,className:`dshc-doc-row ${A.name===l.name?"is-active":""}`},j.createElement("button",{type:"button",className:"dshc-doc-open",onClick:()=>{h(!1),e.loadDoc(A.name)}},j.createElement(ye,{name:"check",size:12,className:A.name===l.name?"":"dshc-doc-check-hidden"}),j.createElement("span",{className:"dshc-doc-label"},E(A))),j.createElement(X,{icon:"pencil",size:12,title:`\u91CD\u547D\u540D ${A.name}`,onClick:()=>{h(!1),n?.(A.name)}}))),S.length===0&&j.createElement("div",{className:"dshc-doc-empty"},"\u8FD8\u6CA1\u6709\u753B\u5E03"))),j.createElement(X,{icon:"plus",title:"\u65B0\u5EFA\u753B\u5E03",onClick:t}),j.createElement(X,{icon:"path",title:"\u5BFC\u5165 SVG path",onClick:()=>x.current?.click()}),j.createElement(X,{icon:"pencil",title:"\u91CD\u547D\u540D\u753B\u5E03",onClick:()=>n?.(l.name)}),j.createElement(X,{icon:"trash",title:"\u5220\u9664\u753B\u5E03",onClick:()=>i?.()}),j.createElement(X,{icon:"download",title:"\u5BFC\u51FA SVG / PNG",onClick:()=>c(!o)}),j.createElement("span",{className:"dshc-spacer"}),j.createElement(X,{icon:"undo",title:"\u64A4\u9500 (\u2318Z)",onClick:()=>e.undo(),disabled:!e.history.canUndo()}),j.createElement(X,{icon:"redo",title:"\u91CD\u505A (\u21E7\u2318Z)",onClick:()=>e.redo(),disabled:!e.history.canRedo()})),j.createElement("div",{className:"dshc-topbar-row dshc-topbar-tools"},...Xr.map(([A,V,ne])=>j.createElement(X,{key:A,icon:A,title:ne,active:l.tool===A,onClick:()=>se(A)})),j.createElement("span",{className:"dshc-divider"}),j.createElement(X,{icon:"comment",title:"\u663E\u793A/\u9690\u85CF\u8BC4\u8BBA",active:l.showComments,onClick:()=>{l.showComments=!l.showComments,e.emit()}}),j.createElement(X,{icon:"zoomOut",title:"\u7F29\u5C0F",onClick:()=>{let A=e.viewportSize();e.zoomAt({x:A.width/2,y:A.height/2},1/1.2)}}),j.createElement("button",{type:"button",className:"dshc-zoom-label",title:"\u91CD\u7F6E\u5230 100%",onClick:()=>e.setViewport({...e.viewport,zoom:1})},`${Math.round(l.viewport.zoom*100)}%`),j.createElement(X,{icon:"zoomIn",title:"\u653E\u5927",onClick:()=>{let A=e.viewportSize();e.zoomAt({x:A.width/2,y:A.height/2},1.2)}}),j.createElement(X,{icon:"fit",title:"\u9002\u5E94\u753B\u5E03 (1)",onClick:()=>e.zoomToFit()}),j.createElement(X,{icon:"reset",title:"\u9002\u5E94\u9009\u533A (2)",onClick:()=>e.zoomToSelection()}),j.createElement("span",{className:"dshc-divider"}),j.createElement(X,{icon:"panelRight",title:s?"\u6536\u8D77\u5C5E\u6027\u9762\u677F":"\u5C55\u5F00\u5C5E\u6027\u9762\u677F",active:!!s,onClick:r})),o&&j.createElement("div",{className:"dshc-export-menu"},j.createElement("div",{className:"dshc-export-title"},Z?"\u5BFC\u51FA\u9009\u533A":"\u5BFC\u51FA\u6574\u9875"),j.createElement(O,{icon:"download",onClick:()=>{c(!1),e.exportSelection("svg")}},"SVG"),j.createElement(O,{icon:"download",onClick:()=>{c(!1),e.exportSelection("png")}},"PNG (2x)"),j.createElement("div",{className:"dshc-export-hint"},"\u4FDD\u5B58\u5230 canvas/exports/\uFF0C\u5E76\u628A\u8DEF\u5F84\u63D2\u5165\u8F93\u5165\u6846")),j.createElement("input",{ref:A=>{b.current=A,e.imagePicker=A},type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",style:{display:"none"},onChange:A=>{let V=A.target.files?.[0];V&&e.uploadImageFile(V,e.imageInsertPoint??void 0),e.imageInsertPoint=null,A.target.value=""}}),j.createElement("input",{ref:x,type:"file",accept:".svg,image/svg+xml",style:{display:"none"},onChange:async A=>{let V=A.target.files?.[0];V&&e.importSvg(await V.text()),A.target.value=""}}))}var ce=Be(require("react"),1);function ba(e,t){return(e.children??[]).some(n=>t.has(n.key)||ba(n,t))}function wa({node:e,depth:t,store:n,onRename:i,onRowContextMenu:a}){let s=n.state.selection.includes(e.key),r=n.state.primaryKey===e.key,[l,o]=ce.useState(!1),c=e.children?.length>0;ce.useEffect(()=>{let h=new Set(n.state.selection);(h.has(e.key)||ba(e,h))&&o(!0)},[n.state.selection,e]);let d=e.type==="frame"?"frame":e.type==="group"?"group":e.type==="text"?"text":e.type==="instance"?"component":e.type==="ellipse"?"ellipse":e.type==="line"?"line":e.type==="path"?"path":"rect";return ce.createElement(ce.Fragment,null,ce.createElement("div",{className:`dshc-layer-row ${s?"is-selected":""} ${r?"is-primary":""}`,style:{paddingLeft:6+t*14},onClick:h=>{h.shiftKey?n.toggleSelection(e.key):n.setSelection([e.key])},onDoubleClick:()=>i?.(e),onContextMenu:h=>{h.preventDefault(),h.stopPropagation(),s||n.setSelection([e.key]),a?.(h,e)},title:`${e.name} \xB7 ${e.type}`},c?ce.createElement("button",{type:"button",className:"dshc-layer-caret",onClick:h=>{h.stopPropagation(),o(!l)}},ce.createElement(ye,{name:l?"chevronDown":"chevronRight",size:11})):ce.createElement("span",{className:"dshc-layer-caret"}),ce.createElement(ye,{name:d,size:14}),ce.createElement("span",{className:"dshc-layer-name"},e.name||e.type),e.editable&&ce.createElement("span",{className:"dshc-layer-actions"},ce.createElement(X,{icon:e.visible===!1?"eyeOff":"eye",title:e.visible===!1?"\u663E\u793A":"\u9690\u85CF",size:14,onClick:h=>{h.stopPropagation(),n.setVisibility(e.sourceId,e.visible===!1)}}),ce.createElement(X,{icon:e.locked?"lock":"unlock",title:e.locked?"\u89E3\u9501":"\u9501\u5B9A",size:14,onClick:h=>{h.stopPropagation(),n.setLocked(e.sourceId,!e.locked)}}),ce.createElement(X,{icon:"front",title:"\u4E0A\u79FB",size:14,onClick:h=>{h.stopPropagation(),n.setSelection([e.key]),n.reorder("forward")}}),ce.createElement(X,{icon:"back",title:"\u4E0B\u79FB",size:14,onClick:h=>{h.stopPropagation(),n.setSelection([e.key]),n.reorder("backward")}}))),c&&l?e.children.map(h=>ce.createElement(wa,{key:h.key,node:h,depth:t+1,store:n,onRename:i,onRowContextMenu:a})):null)}function va({store:e,onRename:t,onRowContextMenu:n}){let a=e.state.scene?.roots??[];return ce.createElement("div",{className:"dshc-layer-panel"},ce.createElement("div",{className:"dshc-panel-title"},ce.createElement("span",null,"\u56FE\u5C42"),ce.createElement("span",{className:"dshc-panel-count"},a.length?`${Ra(a)}`:"")),a.length?a.slice().reverse().map(s=>ce.createElement(wa,{key:s.key,node:s,depth:0,store:e,onRename:t,onRowContextMenu:n})):ce.createElement("div",{className:"dshc-panel-empty"},"\u753B\u5E03\u4E3A\u7A7A"))}function Ra(e){let t=0;for(let n of e)t+=1,n.children&&(t+=Ra(n.children));return t}var u=Be(require("react"),1);var Vr=["system-ui","Inter","Helvetica Neue","Arial","Georgia","Times New Roman","Menlo","PingFang SC","Microsoft YaHei"];function _r(e){return e.primaryNode()}function K(e,t,n){if(t){if(t.instanceId&&t.instanceId!==t.key){let i={};"text"in n&&(i.text=n.text),"fills"in n&&(i.fills=n.fills),"visible"in n&&(i.visible=n.visible),Object.keys(i).length&&e.setOverride(t.instanceId,t.sourceId,i);return}e.updateNode(t.sourceId,n)}}function Yt({children:e,className:t=""}){return u.createElement("div",{className:`dshc-row ${t}`},e)}function $a({store:e,onNameDialog:t}){let n=_r(e),i=e.state,a=i.doc;if(!n)return u.createElement("div",{className:"dshc-inspector"},u.createElement(Ee,{title:"\u753B\u5E03"},u.createElement(O,{icon:"sparkle",onClick:()=>e.insertPrompt()},"\u8BA9 AI \u751F\u6210 UI"),u.createElement(O,{icon:"upload",onClick:()=>e.zoomToFit()},"\u9002\u5E94\u753B\u5E03")));let s=n.instanceId&&n.instanceId!==n.key,r=s,l=n.editable&&!r;return s?u.createElement(Wr,{store:e,node:n}):u.createElement("div",{className:"dshc-inspector","data-node":n.sourceId},u.createElement("div",{className:"dshc-inspector-head"},u.createElement(ye,{name:n.type==="frame"?"frame":n.type==="text"?"text":n.type==="group"?"group":n.type==="instance"?"component":n.type==="ellipse"?"ellipse":n.type==="path"?"path":"rect",size:14}),u.createElement("input",{className:"dshc-name-input",defaultValue:n.name??"",key:`${n.sourceId}-name-${n.name}`,disabled:!l,onBlur:o=>{let c=o.target.value.trim();c&&c!==n.name&&e.renameNode(n.sourceId,c)},onKeyDown:o=>{o.key==="Enter"&&o.currentTarget.blur()}}),u.createElement("span",{className:"dshc-type-chip"},n.type)),i.selection.length>1&&u.createElement(Ee,{title:`\u5BF9\u9F50 \xB7 ${i.selection.length} \u4E2A\u56FE\u5C42`},u.createElement("div",{className:"dshc-align-grid"},...[["alignLeft","left","\u5DE6\u5BF9\u9F50"],["alignCenterX","centerX","\u6C34\u5E73\u5C45\u4E2D"],["alignRight","right","\u53F3\u5BF9\u9F50"],["alignTop","top","\u9876\u5BF9\u9F50"],["alignCenterY","centerY","\u5782\u76F4\u5C45\u4E2D"],["alignBottom","bottom","\u5E95\u5BF9\u9F50"]].map(([o,c,d])=>u.createElement(X,{key:c,icon:o,title:d,onClick:()=>e.align(c)})),u.createElement(X,{icon:"distributeX",title:"\u6C34\u5E73\u5206\u5E03",onClick:()=>e.distribute("x")}),u.createElement(X,{icon:"distributeY",title:"\u5782\u76F4\u5206\u5E03",onClick:()=>e.distribute("y")}),u.createElement(X,{icon:"group",title:"\u6210\u7EC4 (\u2318G)",onClick:()=>e.groupSelection()}),u.createElement(X,{icon:"ungroup",title:"\u89E3\u7EC4 (\u21E7\u2318G)",onClick:()=>e.ungroupSelection()}))),u.createElement(Ee,{title:"\u4F4D\u7F6E\u4E0E\u5C3A\u5BF8"},u.createElement("div",{className:"dshc-grid-2"},u.createElement(_,{label:"X"},u.createElement(oe,{value:W(n.sourceNode.x),disabled:!l,onChange:o=>K(e,n,{x:o})})),u.createElement(_,{label:"Y"},u.createElement(oe,{value:W(n.sourceNode.y),disabled:!l,onChange:o=>K(e,n,{y:o})})),u.createElement(_,{label:"\u5BBD"},u.createElement(oe,{value:W(n.sourceNode.width),min:0,disabled:!l,onChange:o=>K(e,n,{width:o})})),u.createElement(_,{label:"\u9AD8"},u.createElement(oe,{value:W(n.sourceNode.height),min:0,disabled:!l,onChange:o=>K(e,n,{height:o})})),u.createElement(_,{label:"\u65CB\u8F6C"},u.createElement(oe,{value:W(n.sourceNode.rotation),disabled:!l,onChange:o=>K(e,n,{rotation:o})})),u.createElement(_,{label:"\u900F\u660E\u5EA6"},u.createElement(oe,{value:W(n.sourceNode.opacity??1),min:0,max:1,step:.05,disabled:!l,onChange:o=>K(e,n,{opacity:o})}))),u.createElement(Yt,null,u.createElement(X,{icon:"front",title:"\u7F6E\u9876",onClick:()=>e.reorder("front")}),u.createElement(X,{icon:"back",title:"\u7F6E\u5E95",onClick:()=>e.reorder("back")}),u.createElement(X,{icon:"trash",title:"\u5220\u9664",danger:!0,onClick:()=>e.deleteSelection()}))),(n.type==="frame"||n.type==="instance")&&u.createElement(Ee,{title:"\u81EA\u52A8\u5E03\u5C40",right:n.sourceNode.layout?"\u5DF2\u542F\u7528":null},n.sourceNode.layout?u.createElement(u.Fragment,null,u.createElement("div",{className:"dshc-seg"},u.createElement(O,{small:!0,active:n.sourceNode.layout.direction==="horizontal",onClick:()=>qe(e,n,{direction:"horizontal"})},"\u6A2A\u5411"),u.createElement(O,{small:!0,active:n.sourceNode.layout.direction==="vertical",onClick:()=>qe(e,n,{direction:"vertical"})},"\u7EB5\u5411")),u.createElement("div",{className:"dshc-grid-2"},u.createElement(_,{label:"\u95F4\u8DDD"},u.createElement(oe,{value:n.sourceNode.layout.gap??0,min:0,onChange:o=>qe(e,n,{gap:o})})),u.createElement(_,{label:"\u5185\u8FB9\u8DDD"},u.createElement(oe,{value:n.sourceNode.layout.padding?.top??0,min:0,onChange:o=>qe(e,n,{padding:{...n.sourceNode.layout.padding,top:o,right:o,bottom:o,left:o}})})),u.createElement(_,{label:"\u4E3B\u8F74\u5BF9\u9F50"},u.createElement(fe,{value:n.sourceNode.layout.alignPrimary??"start",options:[{value:"start",label:"\u8D77\u59CB"},{value:"center",label:"\u5C45\u4E2D"},{value:"end",label:"\u672B\u5C3E"},{value:"space-between",label:"\u4E24\u7AEF"}],onChange:o=>qe(e,n,{alignPrimary:o})})),u.createElement(_,{label:"\u4EA4\u53C9\u8F74"},u.createElement(fe,{value:n.sourceNode.layout.alignCounter??"start",options:[{value:"start",label:"\u8D77\u59CB"},{value:"center",label:"\u5C45\u4E2D"},{value:"end",label:"\u672B\u5C3E"},{value:"stretch",label:"\u62C9\u4F38"}],onChange:o=>qe(e,n,{alignCounter:o})}))),u.createElement(_,{label:"\u81EA\u8EAB\u5C3A\u5BF8"},u.createElement(fe,{value:n.sourceNode.layoutSizing?.v??"fixed",options:[{value:"fixed",label:"\u56FA\u5B9A"},{value:"hug",label:"\u9002\u5E94\u5185\u5BB9"},{value:"fill",label:"\u586B\u5145"}],onChange:o=>K(e,n,{layoutSizing:{...n.sourceNode.layoutSizing??{h:"fixed"},v:o}})})),u.createElement(O,{small:!0,icon:"close",onClick:()=>K(e,n,{layout:null})},"\u79FB\u9664\u81EA\u52A8\u5E03\u5C40")):u.createElement(O,{small:!0,icon:"plus",onClick:()=>qe(e,n,{direction:"vertical",gap:8,padding:{top:12,right:12,bottom:12,left:12},alignPrimary:"start",alignCounter:"start"})},"\u6DFB\u52A0\u81EA\u52A8\u5E03\u5C40")),n.parent?.layout&&u.createElement(Ee,{title:"\u5E03\u5C40\u5B50\u9879"},u.createElement("div",{className:"dshc-grid-2"},u.createElement(_,{label:"\u6C34\u5E73"},u.createElement(fe,{value:n.sourceNode.layoutSizing?.h??"fixed",options:[{value:"fixed",label:"\u56FA\u5B9A"},{value:"hug",label:"\u9002\u5E94"},{value:"fill",label:"\u586B\u5145"}],onChange:o=>K(e,n,{layoutSizing:{...n.sourceNode.layoutSizing??{v:"fixed"},h:o}})})),u.createElement(_,{label:"\u5782\u76F4"},u.createElement(fe,{value:n.sourceNode.layoutSizing?.v??"fixed",options:[{value:"fixed",label:"\u56FA\u5B9A"},{value:"hug",label:"\u9002\u5E94"},{value:"fill",label:"\u586B\u5145"}],onChange:o=>K(e,n,{layoutSizing:{...n.sourceNode.layoutSizing??{h:"fixed"},v:o}})})))),n.type==="text"&&u.createElement(Ee,{title:"\u6587\u672C"},u.createElement("textarea",{className:"dshc-textarea",value:n.sourceNode.text??"",onChange:o=>K(e,n,{text:o.target.value}),rows:3,disabled:!l}),u.createElement("div",{className:"dshc-grid-2"},u.createElement(_,{label:"\u5B57\u4F53"},u.createElement(fe,{value:n.sourceNode.font?.family??"system-ui",options:[...new Set([...Vr,...(a.fonts??[]).map(o=>o.family),n.sourceNode.font?.family].filter(Boolean))].map(o=>({value:o,label:o})),onChange:o=>K(e,n,{font:{...n.sourceNode.font??{},family:o}})})),u.createElement(_,{label:"\u5B57\u91CD"},u.createElement(fe,{value:String(n.sourceNode.font?.weight??400),options:[100,200,300,400,500,600,700,800,900].map(o=>({value:String(o),label:String(o)})),onChange:o=>K(e,n,{font:{...n.sourceNode.font??{},weight:Number(o)}})})),u.createElement(_,{label:"\u5B57\u53F7"},u.createElement(oe,{value:W(n.sourceNode.font?.size??14),min:1,onChange:o=>K(e,n,{font:{...n.sourceNode.font??{},size:o}})})),u.createElement(_,{label:"\u884C\u9AD8"},u.createElement(oe,{value:W(n.sourceNode.font?.lineHeight??1.4),min:.5,step:.1,onChange:o=>K(e,n,{font:{...n.sourceNode.font??{},lineHeight:o}})})),u.createElement(_,{label:"\u5B57\u8DDD"},u.createElement(oe,{value:W(n.sourceNode.font?.letterSpacing??0),step:.1,onChange:o=>K(e,n,{font:{...n.sourceNode.font??{},letterSpacing:o}})})),u.createElement(_,{label:"\u5BF9\u9F50"},u.createElement(fe,{value:n.sourceNode.align??"left",options:[{value:"left",label:"\u5DE6"},{value:"center",label:"\u4E2D"},{value:"right",label:"\u53F3"},{value:"justify",label:"\u4E24\u7AEF"}],onChange:o=>K(e,n,{align:o})}))),u.createElement(Yt,null,u.createElement("span",{className:"dshc-field-label"},"\u81EA\u52A8\u9AD8\u5EA6"),u.createElement(Tt,{value:n.sourceNode.autoHeight!==!1,onChange:o=>K(e,n,{autoHeight:o})}))),!r&&["frame","rect","ellipse","text"].includes(n.type)&&u.createElement(Ee,{title:"\u586B\u5145"},(n.sourceNode.fills??[]).map((o,c)=>u.createElement(Gr,{key:c,fill:o,index:c,store:e,node:n,onChange:d=>{let h=(n.sourceNode.fills??[]).slice();h[c]=d,K(e,n,{fills:h})},onRemove:()=>{let d=(n.sourceNode.fills??[]).filter((h,p)=>p!==c);K(e,n,{fills:d})},onCrop:()=>e.beginCrop(n.key,c)})),u.createElement("div",{className:"dshc-row"},u.createElement(O,{small:!0,icon:"plus",onClick:()=>K(e,n,{fills:[...n.sourceNode.fills??[],{type:"solid",color:"#D9D9D9"}]})},"\u7EAF\u8272"),u.createElement(O,{small:!0,icon:"plus",onClick:()=>K(e,n,{fills:[...n.sourceNode.fills??[],{type:"linear-gradient",angle:180,stops:[{position:0,color:"#4D6BFE"},{position:1,color:"#8B9DFF"}]}]})},"\u6E10\u53D8"))),!r&&["frame","rect","ellipse","line"].includes(n.type)&&u.createElement(Ee,{title:"\u63CF\u8FB9"},(n.sourceNode.strokes??[]).map((o,c)=>u.createElement("div",{key:c,className:"dshc-fill-row"},u.createElement(ct,{value:o.color,onChange:d=>{let h=(n.sourceNode.strokes??[]).slice();h[c]={...o,color:d},K(e,n,{strokes:h})}}),u.createElement(oe,{value:o.width,min:0,onChange:d=>{let h=(n.sourceNode.strokes??[]).slice();h[c]={...o,width:d},K(e,n,{strokes:h})}}),u.createElement(X,{icon:"trash",title:"\u5220\u9664\u63CF\u8FB9",size:13,onClick:()=>{let d=(n.sourceNode.strokes??[]).filter((h,p)=>p!==c);K(e,n,{strokes:d})}}))),u.createElement(O,{small:!0,icon:"plus",onClick:()=>K(e,n,{strokes:[...n.sourceNode.strokes??[],{color:"#94A3B8",width:1,align:"center"}]})},"\u6DFB\u52A0\u63CF\u8FB9")),!r&&u.createElement(Ee,{title:"\u6548\u679C"},(n.sourceNode.effects??[]).map((o,c)=>u.createElement(Kr,{key:c,effect:o,onChange:d=>{let h=(n.sourceNode.effects??[]).slice();h[c]=d,K(e,n,{effects:h})},onRemove:()=>K(e,n,{effects:(n.sourceNode.effects??[]).filter((d,h)=>h!==c)})})),u.createElement("div",{className:"dshc-row"},u.createElement(O,{small:!0,icon:"plus",onClick:()=>K(e,n,{effects:[...n.sourceNode.effects??[],{type:"drop-shadow",x:0,y:8,blur:24,spread:0,color:"#00000040"}]})},"\u6295\u5F71"),u.createElement(O,{small:!0,icon:"plus",onClick:()=>K(e,n,{effects:[...n.sourceNode.effects??[],{type:"inner-shadow",x:0,y:2,blur:8,spread:0,color:"#00000033"}]})},"\u5185\u9634\u5F71"),u.createElement(O,{small:!0,icon:"plus",onClick:()=>K(e,n,{effects:[...n.sourceNode.effects??[],{type:"layer-blur",radius:4}]})},"\u6A21\u7CCA"),u.createElement(O,{small:!0,icon:"plus",onClick:()=>K(e,n,{effects:[...n.sourceNode.effects??[],{type:"background-blur",radius:10}]})},"\u80CC\u666F\u6A21\u7CCA"))),!r&&(n.type==="frame"||n.type==="rect"||n.type==="ellipse"||n.type==="instance")&&u.createElement(Ee,{title:"\u5916\u89C2"},u.createElement(_,{label:"\u5706\u89D2"},u.createElement(oe,{value:W(n.type==="instance"?n.cornerRadius??n.sourceNode.cornerRadius??0:n.sourceNode.cornerRadius??0),min:0,onChange:o=>K(e,n,{cornerRadius:o})})),n.type==="frame"&&u.createElement(Yt,null,u.createElement("span",{className:"dshc-field-label"},"\u88C1\u526A\u5185\u5BB9"),u.createElement(Tt,{value:n.sourceNode.clip!==!1,onChange:o=>K(e,n,{clip:o})}))),n.type==="instance"&&u.createElement(Ur,{store:e,node:n,doc:a}),n.type==="path"&&u.createElement(Ee,{title:"Path"},u.createElement(_,{label:"d",wide:!0},u.createElement("textarea",{defaultValue:n.sourceNode.d??"",className:"dshc-path-input",onBlur:o=>K(e,n,{d:o.target.value})})),u.createElement("div",{className:"dshc-grid-2"},u.createElement(_,{label:"ViewBox X"},u.createElement(oe,{value:W(n.sourceNode.viewBox?.x??0),onChange:o=>K(e,n,{viewBox:{...n.sourceNode.viewBox??{x:0,y:0,width:n.width,height:n.height},x:o}})})),u.createElement(_,{label:"Y"},u.createElement(oe,{value:W(n.sourceNode.viewBox?.y??0),onChange:o=>K(e,n,{viewBox:{...n.sourceNode.viewBox??{x:0,y:0,width:n.width,height:n.height},y:o}})})),u.createElement(_,{label:"\u5BBD"},u.createElement(oe,{value:W(n.sourceNode.viewBox?.width??n.width),min:.01,onChange:o=>K(e,n,{viewBox:{...n.sourceNode.viewBox??{x:0,y:0,width:n.width,height:n.height},width:o}})})),u.createElement(_,{label:"\u9AD8"},u.createElement(oe,{value:W(n.sourceNode.viewBox?.height??n.height),min:.01,onChange:o=>K(e,n,{viewBox:{...n.sourceNode.viewBox??{x:0,y:0,width:n.width,height:n.height},height:o}})}))),u.createElement(_,{label:"\u586B\u5145\u89C4\u5219",wide:!0},u.createElement(fe,{value:n.sourceNode.fillRule??"nonzero",options:[{value:"nonzero",label:"nonzero"},{value:"evenodd",label:"evenodd"}],onChange:o=>K(e,n,{fillRule:o})}))),!s&&u.createElement(Ee,{title:"\u6837\u5F0F"},u.createElement(Cn,{store:e,node:n,type:"fill",label:"\u586B\u5145\u6837\u5F0F"}),n.type==="text"&&u.createElement(Cn,{store:e,node:n,type:"text",label:"\u6587\u672C\u6837\u5F0F"}),u.createElement(Cn,{store:e,node:n,type:"effect",label:"\u6548\u679C\u6837\u5F0F"}),u.createElement("div",{className:"dshc-row"},u.createElement(O,{small:!0,onClick:()=>t?.({title:"\u521B\u5EFA\u586B\u5145\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:n.name+" fill",onSubmit:o=>e.createStyle("fill",o)})},"\u4ECE\u586B\u5145\u521B\u5EFA\u6837\u5F0F"),n.type==="text"&&u.createElement(O,{small:!0,onClick:()=>t?.({title:"\u521B\u5EFA\u6587\u672C\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:n.name+" text",onSubmit:o=>e.createStyle("text",o)})},"\u521B\u5EFA\u6587\u672C\u6837\u5F0F"))),n.type==="frame"||n.type==="group"?u.createElement(Ee,{title:"\u7EC4\u4EF6"},u.createElement(O,{small:!0,icon:"component",onClick:()=>t?.({title:"\u521B\u5EFA\u7EC4\u4EF6",label:"\u7EC4\u4EF6\u540D\u79F0",defaultValue:n.name,onSubmit:o=>e.createComponentFromSelection(o)})},"\u4ECE\u9009\u533A\u521B\u5EFA\u7EC4\u4EF6"),n.type==="group"&&u.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.ungroupSelection()},"\u89E3\u7EC4")):null,n.type==="instance"&&u.createElement(Zr,{store:e,node:n,doc:a}),u.createElement(Ee,{title:"\u4EE3\u7801",defaultOpen:!1},u.createElement("div",{className:"dshc-row"},u.createElement(O,{small:!0,icon:"copy",onClick:()=>{let o=Ea(e,n);navigator.clipboard?.writeText(o),e.toast("\u5DF2\u590D\u5236 CSS")}},"\u590D\u5236 CSS")),u.createElement("pre",{className:"dshc-code"},Ea(e,n))))}function Ea(e,t){if(!t)return"";let n=[],i=(c,d)=>{d==null||d===""||d==="none"||n.push(`  ${c}: ${d};`)};t.type!=="group"&&(i("width",`${W(t.width)}px`),i("height",`${W(t.height)}px`));let a=(t.fills??[])[0];if(t.type!=="text"){if(a?.type==="solid"&&a.color&&i("background",a.color),a?.type==="linear-gradient"&&Array.isArray(a.stops)){let c=a.stops.map(d=>`${d.color} ${Math.round(d.position*100)}%`).join(", ");i("background",`linear-gradient(${W(a.angle??180)}deg, ${c})`)}if(a?.type==="radial-gradient"&&Array.isArray(a.stops)){let c=a.stops.map(d=>`${d.color} ${Math.round(d.position*100)}%`).join(", ");i("background",`radial-gradient(circle, ${c})`)}a?.type==="image"&&a.asset&&i("background-image",`url("${Ge(e.sessionId,e.state.name,a.asset)}")`)}t.cornerRadius&&i("border-radius",`${W(t.cornerRadius)}px`);let s=(t.strokes??[])[0];s&&i("border",`${W(s.width??1)}px solid ${s.color??"#000000"}`);let r=[],l=[];for(let c of t.effects??[])c.type==="drop-shadow"&&r.push(`${W(c.x??0)}px ${W(c.y??0)}px ${W(c.blur??0)}px ${W(c.spread??0)}px ${c.color??"#00000033"}`),c.type==="inner-shadow"&&r.push(`inset ${W(c.x??0)}px ${W(c.y??0)}px ${W(c.blur??0)}px ${W(c.spread??0)}px ${c.color??"#00000033"}`),c.type==="layer-blur"&&l.push(`blur(${W(c.radius??0)}px)`);if(r.length&&i("box-shadow",r.join(", ")),l.length&&i("filter",l.join(" ")),t.type==="text"){let c=t.font??{};i("font-family",`'${c.family??"system-ui"}'`),i("font-size",`${W(c.size??14)}px`),i("font-weight",`${c.weight??400}`),i("line-height",`${Math.round((c.lineHeight??1.4)*100)}%`),i("letter-spacing",`${W(c.letterSpacing??0)}px`);let d=a?.type==="solid"?a.color:null;d&&i("color",d),i("text-align",t.align==="center"?"center":t.align==="right"?"right":"left")}let o=t.layout;if(o&&t.type==="frame"){i("display","flex"),i("flex-direction",o.direction==="horizontal"?"row":"column"),o.gap&&i("gap",`${W(o.gap)}px`);let c=o.padding;c&&i("padding",`${W(c.top??0)}px ${W(c.right??0)}px ${W(c.bottom??0)}px ${W(c.left??0)}px`)}return t.opacity!=null&&t.opacity<1&&i("opacity",String(t.opacity)),n.length?`/* ${t.type} \xB7 ${t.name??""} */
.${String(t.name||t.type).replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").toLowerCase()||"node"} {
${n.join(`
`)}
}`:"/* \u6682\u65E0\u53EF\u5BFC\u51FA\u7684 CSS \u5C5E\u6027 */"}function Wr({store:e,node:t}){let n=s=>e.setOverride(t.instanceId,t.sourceId,s),i=()=>e.mutate(s=>{let r=Mn(s,t.instanceId);r?.overrides&&delete r.overrides[t.sourceId]}),a=(t.fills??[]).find(s=>s.type==="solid");return u.createElement("div",{className:"dshc-inspector"},u.createElement("div",{className:"dshc-inspector-head"},u.createElement(ye,{name:"component",size:14}),u.createElement("span",{className:"dshc-instance-title"},t.name),u.createElement("span",{className:"dshc-type-chip"},"\u8986\u76D6")),u.createElement(Ee,{title:"\u5B9E\u4F8B\u8986\u76D6"},u.createElement("div",{className:"dshc-help"},`\u5B9E\u4F8B ${t.instanceId} \xB7 \u6E90\u8282\u70B9 ${t.sourceId}`),t.type==="text"&&u.createElement("textarea",{className:"dshc-textarea",value:t.sourceNode.text??"",rows:3,onChange:s=>n({text:s.target.value})}),a&&u.createElement(_,{label:"\u586B\u5145\u989C\u8272",wide:!0},u.createElement(ct,{value:a.color,onChange:s=>{let r=(t.fills??[]).map((l,o)=>o===0?{...l,color:s}:l);n({fills:r})}})),u.createElement(Yt,null,u.createElement("span",{className:"dshc-field-label"},"\u53EF\u89C1"),u.createElement(Tt,{value:t.visible!==!1,onChange:s=>n({visible:s})})),u.createElement("div",{className:"dshc-row"},u.createElement(O,{small:!0,icon:"reset",onClick:i},"\u91CD\u7F6E\u6B64\u8282\u70B9\u8986\u76D6"),u.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.exitInstance()},"\u9000\u51FA\u5B9E\u4F8B"),u.createElement(O,{small:!0,icon:"trash",onClick:()=>e.detachInstance(t.instanceId)},"\u5206\u79BB"))))}function qe(e,t,n){let i=t.sourceNode.layout??{direction:"vertical",gap:0,padding:{top:0,right:0,bottom:0,left:0},alignPrimary:"start",alignCounter:"start"},a={...i,...n,padding:{...i.padding??{},...n.padding??{}}};e.updateNode(t.sourceId,{layout:a})}function W(e){return Math.round((Number(e)||0)*100)/100}function Gr({fill:e,onChange:t,onRemove:n,onCrop:i,store:a,node:s,index:r}){let l=e.type,o=u.useRef(null);return u.createElement("div",{className:"dshc-fill-editor"},u.createElement("div",{className:"dshc-fill-row"},u.createElement(fe,{value:l,options:[{value:"solid",label:"\u7EAF\u8272"},{value:"linear-gradient",label:"\u7EBF\u6027\u6E10\u53D8"},{value:"radial-gradient",label:"\u5F84\u5411\u6E10\u53D8"},{value:"image",label:"\u56FE\u7247"}],onChange:c=>{t(c==="solid"?{type:"solid",color:"#D9D9D9",opacity:1}:c==="linear-gradient"?{type:"linear-gradient",angle:180,stops:[{position:0,color:"#4D6BFE"},{position:1,color:"#8B9DFF"}]}:c==="radial-gradient"?{type:"radial-gradient",center:{x:.5,y:.5},radius:.7,stops:[{position:0,color:"#FFFFFF"},{position:1,color:"#00000000"}]}:{type:"image",asset:e.asset??"assets/missing.png",fit:"cover"})}}),u.createElement(X,{icon:"trash",title:"\u5220\u9664\u586B\u5145",size:13,onClick:n})),l==="solid"&&u.createElement("div",{className:"dshc-fill-row"},u.createElement(ct,{value:e.color,onChange:c=>t({...e,color:c})}),u.createElement(oe,{value:W(e.opacity??1),min:0,max:1,step:.05,onChange:c=>t({...e,opacity:c})})),(l==="linear-gradient"||l==="radial-gradient")&&u.createElement(u.Fragment,null,l==="linear-gradient"?u.createElement(_,{label:"\u89D2\u5EA6"},u.createElement(oe,{value:W(e.angle??180),onChange:c=>t({...e,angle:c})})):null,(e.stops??[]).map((c,d)=>u.createElement("div",{key:d,className:"dshc-stop-row"},u.createElement(ct,{value:c.color,onChange:h=>{let p=e.stops.slice();p[d]={...c,color:h},t({...e,stops:p})}}),u.createElement(oe,{value:W(c.position),min:0,max:1,step:.05,onChange:h=>{let p=e.stops.slice();p[d]={...c,position:h},t({...e,stops:p})}}),u.createElement(X,{icon:"close",title:"\u5220\u9664\u505C\u6B62\u70B9",size:12,onClick:()=>{(e.stops??[]).length<=2||t({...e,stops:e.stops.filter((h,p)=>p!==d)})}}))),u.createElement(O,{small:!0,icon:"plus",onClick:()=>t({...e,stops:[...e.stops??[],{position:.5,color:"#FFFFFF"}]})},"\u6DFB\u52A0\u505C\u6B62\u70B9")),l==="image"&&u.createElement(u.Fragment,null,u.createElement("div",{className:"dshc-fill-row"},u.createElement("span",{className:"dshc-muted"},e.asset??"\u65E0\u56FE\u7247"),u.createElement(fe,{value:e.fit??"cover",options:[{value:"cover",label:"\u8986\u76D6"},{value:"contain",label:"\u5305\u542B"},{value:"fill",label:"\u62C9\u4F38"}],onChange:c=>t({...e,fit:c})}),u.createElement(O,{small:!0,onClick:i},"\u88C1\u526A")),u.createElement("div",{className:"dshc-fill-row"},u.createElement("input",{ref:o,type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",style:{display:"none"},onChange:c=>{let d=c.target.files?.[0];d&&a&&s&&a.uploadFillImage(s.sourceId,r,d),c.target.value=""}}),u.createElement(O,{small:!0,icon:"upload",onClick:()=>o.current?.click()},"\u4E0A\u4F20\u56FE\u7247\u586B\u5145"))))}function Kr({effect:e,onChange:t,onRemove:n}){return u.createElement("div",{className:"dshc-effect-editor"},u.createElement("div",{className:"dshc-fill-row"},u.createElement(fe,{value:e.type,options:[{value:"drop-shadow",label:"\u6295\u5F71"},{value:"inner-shadow",label:"\u5185\u9634\u5F71"},{value:"layer-blur",label:"\u56FE\u5C42\u6A21\u7CCA"},{value:"background-blur",label:"\u80CC\u666F\u6A21\u7CCA"}],onChange:i=>{t(i==="layer-blur"||i==="background-blur"?{type:i,radius:e.radius??6}:{type:i,x:e.x??0,y:e.y??8,blur:e.blur??24,spread:e.spread??0,color:e.color??"#00000040"})}}),u.createElement(X,{icon:"trash",title:"\u5220\u9664\u6548\u679C",size:13,onClick:n})),e.type==="layer-blur"||e.type==="background-blur"?u.createElement(_,{label:"\u534A\u5F84"},u.createElement(oe,{value:W(e.radius??0),min:0,onChange:i=>t({...e,radius:i})})):u.createElement("div",{className:"dshc-grid-2"},u.createElement(_,{label:"X"},u.createElement(oe,{value:W(e.x??0),onChange:i=>t({...e,x:i})})),u.createElement(_,{label:"Y"},u.createElement(oe,{value:W(e.y??0),onChange:i=>t({...e,y:i})})),u.createElement(_,{label:"\u6A21\u7CCA"},u.createElement(oe,{value:W(e.blur??0),min:0,onChange:i=>t({...e,blur:i})})),u.createElement(_,{label:"\u6269\u6563"},u.createElement(oe,{value:W(e.spread??0),onChange:i=>t({...e,spread:i})})),u.createElement(_,{label:"\u989C\u8272",wide:!0},u.createElement(ct,{value:e.color??"#00000040",onChange:i=>t({...e,color:i})}))))}function Cn({store:e,node:t,type:n,label:i}){let a=(e.state.doc.styles??[]).filter(c=>c.type===n),s=n==="fill"?"fillStyleId":n==="text"?"textStyleId":"effectStyleId",r=t.sourceNode?.[s]??"",l=r?a.find(c=>c.id===r)??(e.state.doc.styles??[]).find(c=>c.id===r):null,o=[{value:"",label:r?"\u79FB\u9664\u6837\u5F0F":a.length?"\u5E94\u7528\u6837\u5F0F\u2026":"\u6682\u65E0\u6837\u5F0F"},...a.map(c=>({value:c.id,label:c.name}))];return r&&!o.some(c=>c.value===r)&&l&&o.push({value:r,label:l.name}),u.createElement(_,{label:i,wide:!0},u.createElement(fe,{value:r,disabled:!a.length&&!r,options:o,onChange:c=>{if(!c){e.updateNode(t.sourceId,{[s]:null});return}e.setSelection([t.key]),e.applyStyle(c)}}))}function Ur({store:e,node:t,doc:n}){let i=n.components.find(s=>s.id===t.sourceNode.componentId),a=i?.variantSetId?n.variantSets.find(s=>s.id===i.variantSetId):null;return u.createElement(Ee,{title:"\u5B9E\u4F8B"},u.createElement("div",{className:"dshc-stat-line"},`\u4E3B\u7EC4\u4EF6\uFF1A${i?.name??t.sourceNode.componentId}`),a&&a.properties.map(s=>u.createElement(_,{key:s.name,label:s.name,wide:!0},u.createElement(fe,{value:t.sourceNode.variantProps?.[s.name]??s.values[0],options:s.values.map(r=>({value:r,label:r})),onChange:r=>e.setVariant(t.sourceId,s.name,r)}))),u.createElement(_,{label:"\u6362\u7EC4\u4EF6",wide:!0},u.createElement(fe,{value:t.sourceNode.componentId,options:n.components.map(s=>({value:s.id,label:s.name})),onChange:s=>e.swapComponent(t.sourceId,s)})),u.createElement("div",{className:"dshc-row"},u.createElement(O,{small:!0,icon:"component",onClick:()=>i&&e.editComponent(i.id)},"\u7F16\u8F91\u4E3B\u7EC4\u4EF6"),u.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.enterInstance(t.key)},"\u8FDB\u5165\u5B9E\u4F8B"),u.createElement(O,{small:!0,icon:"ungroup",onClick:()=>e.detachInstance(t.sourceId)},"\u5206\u79BB")))}function Zr({store:e,node:t,doc:n}){let i=t.sourceNode.overrides??{},a=Object.keys(i).length;return u.createElement(Ee,{title:"\u5B9E\u4F8B\u8986\u76D6",right:a?`${a}`:null},a?u.createElement("div",null,Object.entries(i).map(([s,r])=>u.createElement("div",{key:s,className:"dshc-override-row"},u.createElement("span",{className:"dshc-muted"},s),u.createElement(O,{small:!0,onClick:()=>{e.mutate(l=>{let o=Mn(l,t.sourceId);o?.overrides&&delete o.overrides[s]})}},"\u91CD\u7F6E")))):u.createElement("div",{className:"dshc-help"},"\u53CC\u51FB\u8FDB\u5165\u5B9E\u4F8B\uFF0C\u4FEE\u6539\u6587\u672C/\u586B\u5145/\u663E\u9690\u540E\u751F\u6210\u8986\u76D6\u3002"),u.createElement(O,{small:!0,icon:"reset",onClick:()=>e.mutate(s=>{let r=Mn(s,t.sourceId);r&&(r.overrides={})})},"\u91CD\u7F6E\u5168\u90E8\u8986\u76D6"))}function Mn(e,t){for(let n of e.pages??[]){let i=zn(n.children,t);if(i)return i}for(let n of e.components??[]){if(n.root.id===t)return n.root;let i=zn(n.root.children??[],t);if(i)return i}return null}function zn(e,t){for(let n of e??[]){if(n.id===t)return n;let i=zn(n.children,t);if(i)return i}return null}var w=Be(require("react"),1);function Sa({store:e}){let t=_e(e.state.foundation?.device),n=[["\u9875\u9762",gt.filter(i=>i.category==="page")],["\u7CFB\u7EDF\u680F",gt.filter(i=>i.category!=="page")]];return w.createElement("div",{className:"dshc-panel"},w.createElement("div",{className:"dshc-panel-title"},"\u6A21\u677F",w.createElement("span",{className:"dshc-panel-count"},gt.length)),w.createElement("div",{className:"dshc-row dshc-template-device"},w.createElement("span",{className:"dshc-field-label"},"\u8BBE\u5907"),w.createElement(fe,{value:t.id,options:[{value:"iphone16",label:"iPhone 16 \xB7 393\xD7852"},{value:"iphone15",label:"iPhone 15 \xB7 390\xD7844"}],onChange:i=>e.setFoundation({device:i})})),n.map(([i,a])=>w.createElement("div",{key:i,className:"dshc-panel-group"},w.createElement("div",{className:"dshc-panel-subtitle"},i),w.createElement("div",{className:"dshc-template-list"},a.map(s=>w.createElement("div",{key:s.id,className:"dshc-template-row",title:s.description},w.createElement("div",{className:"dshc-template-info"},w.createElement("div",{className:"dshc-template-name"},s.name),w.createElement("div",{className:"dshc-template-meta"},`${s.system} \xB7 ${t.width}\xD7${s.category==="page"?t.height:s.height}`)),w.createElement(X,{icon:"plus",title:`\u63D2\u5165${s.name}`,size:16,onClick:()=>e.insertTemplate(s.id)})))))))}function ka(e,t){let n=0,i=a=>{t(a)&&(n+=1);for(let s of a.children??[])i(s)};for(let a of e.state.doc?.pages??[])a.children.forEach(i);for(let a of e.state.doc?.components??[])i(a.root);return n}function Ia({store:e,onNeedName:t}){let n=e.state.doc,[i,a]=w.useState([]);if(!n)return null;let s=n.components??[],r=n.variantSets??[],l=e.primaryNode(),o=l&&(l.type==="frame"||l.type==="group")&&l.editable;return w.createElement("div",{className:"dshc-panel"},w.createElement("div",{className:"dshc-panel-title"},"\u7EC4\u4EF6",w.createElement("span",{className:"dshc-panel-count"},s.length)),w.createElement("div",{className:"dshc-panel-actions"},w.createElement(O,{small:!0,icon:"component",disabled:!o,onClick:()=>t?.({title:"\u521B\u5EFA\u7EC4\u4EF6",label:"\u7EC4\u4EF6\u540D\u79F0",defaultValue:l?.name??"Component",onSubmit:c=>e.createComponentFromSelection(c)})},"\u4ECE\u9009\u533A\u521B\u5EFA"),w.createElement(O,{small:!0,icon:"layers",disabled:i.length<2,onClick:()=>e.createVariantSet(i)},"\u5408\u5E76\u4E3A\u53D8\u4F53")),r.length>0&&w.createElement("div",{className:"dshc-panel-group"},w.createElement("div",{className:"dshc-panel-subtitle"},"\u53D8\u4F53\u96C6"),r.map(c=>w.createElement("div",{key:c.id,className:"dshc-set-card"},w.createElement("div",{className:"dshc-set-name"},c.name),c.properties.map(d=>w.createElement("div",{key:d.name,className:"dshc-muted"},`${d.name}: ${d.values.join(" / ")}`)),w.createElement("div",{className:"dshc-set-variants"},c.componentIds.map(d=>{let h=s.find(p=>p.id===d);return h?w.createElement("button",{key:d,type:"button",className:"dshc-variant-chip",onClick:()=>e.insertInstance(d)},h.variantProps?.State??h.name):null}))))),w.createElement("div",{className:"dshc-panel-group"},w.createElement("div",{className:"dshc-panel-subtitle"},"\u7EC4\u4EF6"),s.length===0?w.createElement(Nn,{icon:"component",title:"\u8FD8\u6CA1\u6709\u7EC4\u4EF6",text:"\u9009\u4E2D\u4E00\u4E2A Frame\uFF0C\u70B9\u201C\u4ECE\u9009\u533A\u521B\u5EFA\u201D\u3002"}):s.map(c=>w.createElement("div",{key:c.id,className:"dshc-list-row"},w.createElement("input",{type:"checkbox",checked:i.includes(c.id),onChange:d=>a(d.target.checked?[...i,c.id]:i.filter(h=>h!==c.id))}),w.createElement(ye,{name:"component",size:13}),w.createElement("span",{className:"dshc-list-name"},c.name),w.createElement(X,{icon:"plus",title:"\u63D2\u5165\u5B9E\u4F8B",size:13,onClick:()=>e.insertInstance(c.id)}),w.createElement(X,{icon:"text",title:"\u7F16\u8F91\u4E3B\u7EC4\u4EF6",size:13,onClick:()=>e.editComponent(c.id)}),w.createElement(X,{icon:"trash",title:"\u5220\u9664\u7EC4\u4EF6",size:13,danger:!0,onClick:()=>{let d=e.state.scene?ka(e,h=>h.type==="instance"&&h.sourceNode?.componentId===c.id):0;if(d){e.toast(`\u6709 ${d} \u4E2A\u5B9E\u4F8B\u5728\u4F7F\u7528\uFF0C\u65E0\u6CD5\u5220\u9664`);return}e.mutate(h=>{h.components=h.components.filter(p=>p.id!==c.id),h.variantSets=h.variantSets.filter(p=>!p.componentIds.includes(c.id))})}})))))}function Na({store:e,onNeedName:t}){let n=e.state.doc;if(!n)return null;let i=[["fill","\u586B\u5145"],["text","\u6587\u672C"],["effect","\u6548\u679C"]];return w.createElement("div",{className:"dshc-panel"},w.createElement("div",{className:"dshc-panel-title"},"\u6837\u5F0F\u5E93",w.createElement("span",{className:"dshc-panel-count"},n.styles?.length??0)),w.createElement("div",{className:"dshc-panel-group"},w.createElement("div",{className:"dshc-panel-subtitle"},"\u5185\u7F6E\u89C4\u8303"),w.createElement("div",{className:"dshc-panel-actions"},w.createElement(O,{small:!0,icon:"styles",title:"\u52A0\u8F7D Material 3 \u7684\u586B\u5145/\u6587\u672C/\u6548\u679C\u6837\u5F0F\u5230\u5F53\u524D\u6587\u6863",onClick:()=>e.loadDesignSystem("material3")},"Material 3"),w.createElement(O,{small:!0,icon:"styles",title:"\u52A0\u8F7D iOS HIG \u7684\u586B\u5145/\u6587\u672C/\u6548\u679C\u6837\u5F0F\u5230\u5F53\u524D\u6587\u6863",onClick:()=>e.loadDesignSystem("ios")},"iOS HIG")),w.createElement("div",{className:"dshc-help"},"\u52A0\u5165\u4E0B\u65B9\u6837\u5F0F\u5E93\uFF0C\u53EF\u5E94\u7528\u5230\u56FE\u5C42\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u4FEE\u6539\u73B0\u6709\u56FE\u5C42\u3002")),w.createElement("div",{className:"dshc-panel-actions"},w.createElement(O,{small:!0,icon:"plus",onClick:()=>t?.({title:"\u521B\u5EFA\u586B\u5145\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:"Brand/Primary",onSubmit:a=>e.createStyle("fill",a)})},"\u586B\u5145"),w.createElement(O,{small:!0,icon:"plus",onClick:()=>t?.({title:"\u521B\u5EFA\u6587\u672C\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:"Text/Body",onSubmit:a=>e.createStyle("text",a)})},"\u6587\u672C"),w.createElement(O,{small:!0,icon:"plus",onClick:()=>t?.({title:"\u521B\u5EFA\u6548\u679C\u6837\u5F0F",label:"\u6837\u5F0F\u540D\u79F0",defaultValue:"Shadow/Card",onSubmit:a=>e.createStyle("effect",a)})},"\u6548\u679C")),i.map(([a,s])=>w.createElement("div",{key:a,className:"dshc-panel-group"},w.createElement("div",{className:"dshc-panel-subtitle"},s),(n.styles??[]).filter(r=>r.type===a).length===0?w.createElement("div",{className:"dshc-muted dshc-pad"},"\u6682\u65E0\u6837\u5F0F"):(n.styles??[]).filter(r=>r.type===a).map(r=>{let l=ka(e,o=>a==="fill"&&o.fillStyleId===r.id||a==="text"&&o.textStyleId===r.id||a==="effect"&&o.effectStyleId===r.id);return w.createElement("div",{key:r.id,className:"dshc-list-row"},w.createElement("span",{className:`dshc-style-dot dshc-style-${a}`}),w.createElement("span",{className:"dshc-list-name"},r.name),w.createElement("span",{className:"dshc-muted"},`${l}`),w.createElement(X,{icon:"check",title:"\u5E94\u7528\u5230\u9009\u533A",size:13,onClick:()=>e.applyStyle(r.id)}),w.createElement(X,{icon:"ungroup",title:"\u89E3\u7ED1\u5F15\u7528",size:13,onClick:()=>e.detachStyle(r.id)}),w.createElement(X,{icon:"trash",title:"\u5220\u9664\u6837\u5F0F",size:13,danger:!0,onClick:()=>e.deleteStyle(r.id)}))}))))}function Ca({store:e,onNeedName:t}){let n=e.state.doc,[i,a]=w.useState(""),[s,r]=w.useState("400"),[l,o]=w.useState("normal"),[c,d]=w.useState(null),[h,p]=w.useState(!1),b=w.useRef(null);if(!n)return null;let x=async()=>{if(!c||!i.trim()){e.toast("\u9009\u62E9\u5B57\u4F53\u6587\u4EF6\u5E76\u586B\u5199\u5BB6\u65CF\u540D");return}p(!0),await e.uploadFontFile(c,i.trim(),Number(s),l),p(!1),a(""),d(null),b.current&&(b.current.value="")};return w.createElement("div",{className:"dshc-panel"},w.createElement("div",{className:"dshc-panel-title"},"\u5B57\u4F53",w.createElement("span",{className:"dshc-panel-count"},n.fonts?.length??0)),w.createElement("div",{className:"dshc-panel-group"},w.createElement("div",{className:"dshc-panel-subtitle"},"\u4E0A\u4F20\u5B57\u4F53"),w.createElement(_,{label:"\u5B57\u4F53\u6587\u4EF6",wide:!0},w.createElement("input",{ref:b,type:"file",accept:".woff2,.woff,.ttf,.otf",onChange:E=>{let S=E.target.files?.[0]??null;d(S),S&&!i&&a(S.name.replace(/\.[^.]+$/,"").replace(/[-_](Regular|Medium|SemiBold|Bold|Light|Italic)$/i,""))}})),w.createElement(_,{label:"\u5BB6\u65CF\u540D",wide:!0},w.createElement("input",{className:"dshc-text-input",value:i,onChange:E=>a(E.target.value)})),w.createElement("div",{className:"dshc-grid-2"},w.createElement(_,{label:"\u5B57\u91CD"},w.createElement(fe,{value:s,options:[100,200,300,400,500,600,700,800,900].map(E=>({value:String(E),label:String(E)})),onChange:r})),w.createElement(_,{label:"\u6837\u5F0F"},w.createElement(fe,{value:l,options:[{value:"normal",label:"\u5E38\u89C4"},{value:"italic",label:"\u659C\u4F53"}],onChange:o}))),w.createElement(O,{small:!0,primary:!0,icon:"upload",disabled:h||!c||!i.trim(),onClick:x},h?"\u4E0A\u4F20\u4E2D\u2026":"\u4E0A\u4F20\u5E76\u767B\u8BB0"),w.createElement("div",{className:"dshc-help"},"\u6587\u4EF6\u4FDD\u5B58\u5230 canvas/fonts/\uFF0C\u5BA2\u6237\u7AEF @font-face \u52A0\u8F7D\uFF1B\u4E0D\u505A\u670D\u52A1\u7AEF\u8F6C\u6362\u6216\u5B50\u96C6\u5316\u3002")),w.createElement("div",{className:"dshc-panel-group"},w.createElement("div",{className:"dshc-panel-subtitle"},"\u5DF2\u4E0A\u4F20"),(n.fonts??[]).length===0?w.createElement("div",{className:"dshc-muted dshc-pad"},"\u8FD8\u6CA1\u6709\u81EA\u5B9A\u4E49\u5B57\u4F53\uFF1B\u7CFB\u7EDF\u5B57\u4F53\u53EF\u76F4\u63A5\u4F7F\u7528\u3002"):(n.fonts??[]).map(E=>w.createElement("div",{key:E.id,className:"dshc-list-row"},w.createElement(ye,{name:"fonts",size:13}),w.createElement("span",{className:"dshc-list-name"},E.family),w.createElement("span",{className:"dshc-muted"},`${E.weight} ${E.style}`),w.createElement(X,{icon:"trash",title:"\u5220\u9664\u5B57\u4F53",size:13,danger:!0,onClick:()=>e.removeFont(E.id)})))))}function Ma({store:e}){let t=e.state.doc,[n,i]=w.useState(!1),[a,s]=w.useState(""),[r,l]=w.useState(null);if(!t)return null;let o=(t.comments??[]).filter(c=>c.pageId===e.state.pageId&&(n||!c.resolved));return w.createElement("div",{className:"dshc-panel"},w.createElement("div",{className:"dshc-panel-title"},"\u8BC4\u8BBA",w.createElement("span",{className:"dshc-panel-count"},o.length)),w.createElement("div",{className:"dshc-panel-actions"},w.createElement(O,{small:!0,icon:"comment",onClick:()=>e.setTool("comment")},"\u6DFB\u52A0\u8BC4\u8BBA"),w.createElement(O,{small:!0,active:n,onClick:()=>i(!n)},"\u5DF2\u89E3\u51B3")),o.length===0?w.createElement(Nn,{icon:"comment",title:"\u6CA1\u6709\u8BC4\u8BBA",text:"\u7528\u8BC4\u8BBA\u5DE5\u5177\u70B9\u753B\u5E03\uFF0C\u6216\u9009\u4E2D\u5143\u7D20\u540E\u6DFB\u52A0\u3002"}):o.map(c=>w.createElement("div",{key:c.id,className:`dshc-comment-card ${c.resolved?"is-resolved":""}`},w.createElement("div",{className:"dshc-comment-card-head"},w.createElement("span",{className:"dshc-comment-author"},c.author==="ai"?"AI":"\u4F60"),w.createElement("span",{className:"dshc-muted"},c.nodeId?`@${c.nodeId}`:"\u9875\u9762"),c.resolved?w.createElement("span",{className:"dshc-muted"},"\u5DF2\u89E3\u51B3"):null),w.createElement("div",{className:"dshc-comment-card-body"},c.body),(c.replies??[]).map(d=>w.createElement("div",{key:d.id,className:"dshc-comment-card-reply"},w.createElement("b",null,d.author==="ai"?"AI":"\u4F60"),d.body)),r===c.id&&w.createElement("div",null,w.createElement("textarea",{className:"dshc-comment-input",rows:2,value:a,onChange:d=>s(d.target.value),placeholder:"\u56DE\u590D\u2026"}),w.createElement("div",{className:"dshc-row"},w.createElement(O,{small:!0,onClick:()=>{e.replyComment(c.id,a),s(""),l(null)}},"\u53D1\u9001"),w.createElement(O,{small:!0,onClick:()=>{l(null),s("")}},"\u53D6\u6D88"))),w.createElement("div",{className:"dshc-comment-card-actions"},w.createElement(O,{small:!0,onClick:()=>{if(c.nodeId){let d=e.findSceneNode(c.nodeId);d&&(e.setSelection([d.key]),e.zoomToSelection())}}},"\u5B9A\u4F4D"),w.createElement(O,{small:!0,onClick:()=>{l(r===c.id?null:c.id),s("")}},"\u56DE\u590D"),w.createElement(O,{small:!0,onClick:()=>e.resolveComment(c.id,!c.resolved)},c.resolved?"\u91CD\u5F00":"\u89E3\u51B3"),w.createElement(O,{small:!0,danger:!0,onClick:()=>e.deleteComment(c.id)},"\u5220\u9664")))))}var An=`/* dsh-canvas chrome. Host theme tokens only; the design content owns its colors. */

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


`;var qr=[["layers","layers","\u56FE\u5C42"],["components","component","\u7EC4\u4EF6"],["templates","template","\u6A21\u677F"],["styles","styles","\u6837\u5F0F"],["fonts","fonts","\u5B57\u4F53"],["comments","comment","\u8BC4\u8BBA"]],Xt=class extends D.Component{constructor(t){super(t),this.state={error:null}}static getDerivedStateFromError(t){return{error:t}}componentDidCatch(t,n){console.error("[dsh-canvas] panel crashed",t),Le({phase:"panel-crash",message:String(t?.message??t),stack:String(t?.stack??""),componentStack:String(n?.componentStack??"")})}render(){return this.state.error?D.createElement("div",{className:"dshc-root dshc-crashed"},D.createElement("div",{className:"dshc-crash-title"},"\u753B\u5E03\u9762\u677F\u51FA\u9519\u4E86"),D.createElement("pre",{className:"dshc-crash-message"},String(this.state.error?.message??this.state.error)),D.createElement("button",{type:"button",className:"dshc-btn is-primary",onClick:()=>this.setState({error:null})},"\u91CD\u8BD5")):this.props.children}};function Fn({sessionId:e,inputActions:t}){let n=D.useRef(null);(!n.current||n.current.sessionId!==e)&&(n.current=new At({sessionId:e,inputActions:t}));let i=n.current;i.inputActions=t,D.useSyncExternalStore(i.subscribe,i.getVersion);let[a,s]=D.useState(null),[r,l]=D.useState(null),o=i.state;D.useEffect(()=>{Le({phase:"panel-mount",sessionId:e,width:i.canvasSize?.width??null}),i.mount();let k=G=>{G&&(G.sessionId&&e&&G.sessionId!==e||i.focusNode(G).catch(Z=>console.warn("[dsh-canvas] focus failed",Z)))},v=$n(e);v&&k(v);let z=da(G=>{G.sessionId&&e&&G.sessionId!==e||($n(e),k(G))});return()=>{z(),Le({phase:"panel-unmount",sessionId:e}),i.unmount()}},[i]),D.useEffect(()=>{if(!r)return;let k=z=>{z.type==="pointerdown"&&z.target?.closest?.(".dshc-context-menu")||l(null)},v=z=>{z.key==="Escape"&&(z.preventDefault(),z.stopPropagation(),l(null))};return window.addEventListener("pointerdown",k,!0),window.addEventListener("wheel",k,{capture:!0,passive:!0}),window.addEventListener("keydown",v,!0),()=>{window.removeEventListener("pointerdown",k,!0),window.removeEventListener("wheel",k,!0),window.removeEventListener("keydown",v,!0)}},[r]);let c=k=>s(k),d=(k,v)=>{i.state.selection.includes(v.key)||i.setSelection([v.key]),l({x:Math.min(Math.max(8,k.clientX),Math.max(8,(window.innerWidth??1200)-240)),y:Math.min(Math.max(8,k.clientY),Math.max(8,(window.innerHeight??800)-440)),node:v})},h=i.state.panel,p=D.useRef(h??"layers");h&&(p.current=h);let b=()=>i.setPanel(h?null:p.current),x=()=>{o.inspectorOpen=!o.inspectorOpen,i.emit()},E=(o.doc?.comments??[]).filter(k=>!k.resolved&&k.pageId===o.pageId);if(o.loading||!o.ready)return D.createElement("div",{className:"dshc-root dshc-loading"},D.createElement("style",null,An),o.error?D.createElement(D.Fragment,null,D.createElement("div",{className:"dshc-crash-title"},"\u65E0\u6CD5\u6253\u5F00\u753B\u5E03"),D.createElement("pre",{className:"dshc-crash-message"},o.error),D.createElement("button",{type:"button",className:"dshc-btn is-primary",onClick:()=>i.bootstrap()},"\u91CD\u8BD5")):D.createElement(D.Fragment,null,D.createElement("div",{className:"dshc-spinner"}),D.createElement("div",{className:"dshc-muted"},"\u6B63\u5728\u6253\u5F00\u753B\u5E03\u2026")));let S=o.componentMode?o.doc.components.find(k=>k.id===o.componentMode.componentId):null;return D.createElement("div",{className:"dshc-root"},D.createElement("style",null,An),D.createElement(xa,{store:i,inspectorOpen:o.inspectorOpen,onToggleInspector:x,onNewDoc:()=>c({title:"\u65B0\u5EFA\u753B\u5E03",label:"\u6587\u6863\u540D\uFF08\u5C0F\u5199 slug\uFF09",defaultValue:`canvas-${(o.docs?.length??0)+1}`,onSubmit:k=>i.createDoc(k)}),onNeedName:c,onRenameDoc:(k=i.state.name)=>c({title:"\u91CD\u547D\u540D\u753B\u5E03",label:"\u6587\u6863\u540D\uFF08\u5C0F\u5199 slug\uFF09",defaultValue:k,onSubmit:v=>i.renameDoc(v,k)}),onDeleteDoc:()=>{typeof window<"u"&&!window.confirm(`\u5220\u9664\u753B\u5E03\u300C${i.state.name}\u300D\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`)||i.deleteDoc()}}),S&&D.createElement("div",{className:"dshc-banner"},D.createElement(ye,{name:"component",size:14}),D.createElement("span",null,`\u6B63\u5728\u7F16\u8F91\u7EC4\u4EF6\uFF1A${S.name}`),D.createElement(O,{small:!0,onClick:()=>i.exitComponentMode()},"\u8FD4\u56DE\u753B\u5E03")),o.conflict&&D.createElement("div",{className:"dshc-conflict"},D.createElement("span",null,o.conflict.message??"\u753B\u5E03\u5728\u522B\u5904\u88AB\u4FEE\u6539\u4E86"),D.createElement(O,{small:!0,onClick:()=>i.resolveConflict(!0)},"\u52A0\u8F7D\u6700\u65B0"),D.createElement(O,{small:!0,onClick:()=>i.resolveConflict(!1)},"\u4FDD\u7559\u672C\u5730\u5E76\u8986\u76D6")),D.createElement("div",{className:"dshc-body"},D.createElement("div",{className:"dshc-rail"},D.createElement(X,{icon:"panelLeft",size:22,title:h?"\u6536\u8D77\u62BD\u5C49":"\u5C55\u5F00\u62BD\u5C49",active:!!h,onClick:b}),D.createElement("span",{className:"dshc-rail-divider"}),qr.map(([k,v,z])=>D.createElement("div",{key:k,className:"dshc-rail-item"},D.createElement(X,{icon:v,title:z,size:22,active:h===k,onClick:()=>i.setPanel(h===k?null:k)}),k==="comments"&&E.length?D.createElement("span",{className:"dshc-badge"},E.length>9?"9+":E.length):null))),h&&D.createElement("div",{className:"dshc-panel-wrap"},h==="layers"&&D.createElement(va,{store:i,onRename:k=>c({title:"\u91CD\u547D\u540D\u56FE\u5C42",label:"\u540D\u79F0",defaultValue:k.name,onSubmit:v=>i.renameNode(k.sourceId,v)}),onRowContextMenu:d}),h==="components"&&D.createElement(Ia,{store:i,onNeedName:c}),h==="templates"&&D.createElement(Sa,{store:i}),h==="styles"&&D.createElement(Na,{store:i,onNeedName:c}),h==="fonts"&&D.createElement(Ca,{store:i,onNeedName:c}),h==="comments"&&D.createElement(Ma,{store:i})),D.createElement("div",{className:"dshc-canvas-wrap"},D.createElement(ya,{store:i})),o.inspectorOpen&&D.createElement($a,{store:i,onNameDialog:c})),D.createElement("div",{className:"dshc-statusbar"},D.createElement("span",{className:"dshc-status-selection"},o.selection.length?`\u5DF2\u9009 ${o.selection.length} \u4E2A \xB7 ${i.primaryNode()?.name??""}`:"\u672A\u9009\u62E9 \xB7 \u753B\u5E03"),D.createElement("span",{className:"dshc-spacer"}),o.sceneIssues?.length?D.createElement("span",{className:"dshc-status-warn",title:o.sceneIssues.join(`
`)},`${o.sceneIssues.length} \u4E2A\u8B66\u544A`):null,D.createElement("span",{className:"dshc-muted"},o.dirty?"\u672A\u4FDD\u5B58":o.saving?"\u4FDD\u5B58\u4E2D\u2026":"\u5DF2\u4FDD\u5B58"),D.createElement("span",{className:"dshc-muted"},`${Math.round(o.viewport.zoom*100)}%`),D.createElement(O,{small:!0,primary:o.selection.length>0,onClick:()=>i.insertSelectionToComposer(),disabled:!o.selection.length},"\u63D2\u5165\u5230\u5BF9\u8BDD"),D.createElement(O,{small:!0,icon:"sparkle",onClick:()=>i.insertPrompt()},"\u8BA9 AI \u751F\u6210")),o.notice&&D.createElement("div",{className:`dshc-toast ${o.notice.kind==="error"?"is-error":""}`},o.notice.text),r&&D.createElement(Pt,{fixed:!0,x:r.x,y:r.y,items:[{label:"\u91CD\u547D\u540D",icon:"text",action:()=>{let k=r.node;k&&c({title:"\u91CD\u547D\u540D\u56FE\u5C42",label:"\u540D\u79F0",defaultValue:k.name,onSubmit:v=>i.renameNode(k.sourceId,v)})}},{label:"\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D",icon:"fit",action:()=>i.zoomToSelection()},{separator:!0},...Dt(i)],onClose:()=>l(null)}),a&&D.createElement(fa,{title:a.title,label:a.label,defaultValue:a.defaultValue,onCancel:()=>s(null),onSubmit:k=>{s(null),a.onSubmit?.(k)}}))}var za="@local/dsh-canvas",Rt="dsh-canvas",Qr={"tab.title":"\u753B\u5E03","guide.title":"\u753B\u5E03","guide.description":"Figma \u98CE\u683C\u65E0\u9650\u753B\u5E03\uFF1A\u53EF\u89C6\u5316\u8BBE\u8BA1 UI \u7A3F\uFF0C\u9009\u533A\u63D2\u5165\u5BF9\u8BDD\uFF0CAI \u53EF\u901A\u8FC7 canvas/*.canvas.json \u751F\u6210\u4E0E\u4FEE\u6539\u3002","dock.open":"\u6253\u5F00\u753B\u5E03","dock.close":"\u6536\u8D77\u753B\u5E03","composer.open":"\u6253\u5F00\u753B\u5E03"},eo={"tab.title":"Canvas","guide.title":"Canvas","guide.description":"Figma-style infinite canvas: design UI mockups, send selections to the composer, and let the AI edit canvas/*.canvas.json.","dock.open":"Open canvas","dock.close":"Hide canvas","composer.open":"Open canvas"};function Et({size:e=18}){return q.createElement("svg",{viewBox:"0 0 24 24",width:e,height:e,fill:"none","aria-hidden":!0},q.createElement("path",{d:"M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z",stroke:"currentColor",strokeWidth:1.6}),q.createElement("path",{d:"M8.25 8.25h7.5v7.5h-7.5z",stroke:"currentColor",strokeWidth:1.4,strokeDasharray:"2.2 2.2"}),q.createElement("circle",{cx:8.25,cy:8.25,r:1.2,fill:"currentColor"}),q.createElement("circle",{cx:15.75,cy:8.25,r:1.2,fill:"currentColor"}),q.createElement("circle",{cx:8.25,cy:15.75,r:1.2,fill:"currentColor"}),q.createElement("circle",{cx:15.75,cy:15.75,r:1.2,fill:"currentColor"}))}function to(e){return q.createElement(Xt,null,q.createElement(Fn,{sessionId:e.sessionId,inputActions:e.inputActions}))}function no(e){let[t,n]=q.useState(!1);return q.createElement("div",{style:{border:"1px solid var(--dsw-alias-border-l1)",borderRadius:10,background:"var(--dsw-alias-bg-layer-1)",overflow:"hidden",margin:"4px 0"},"data-dsh-canvas":"dock"},q.createElement("button",{type:"button",onClick:()=>n(i=>!i),style:{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"7px 10px",border:"none",background:"transparent",color:"var(--dsw-alias-label-primary)",cursor:"pointer",font:"inherit"}},q.createElement(Et,{size:15}),q.createElement("span",{style:{fontWeight:600}},e.title??"\u753B\u5E03"),q.createElement("span",{style:{marginLeft:"auto",color:"var(--dsw-alias-label-secondary)",fontSize:11}},t?e.closeLabel:e.openLabel)),t&&q.createElement("div",{style:{height:"60vh",minHeight:320,borderTop:"1px solid var(--dsw-alias-border-l1)"}},q.createElement(Fn,{sessionId:e.sessionId,inputActions:e.inputActions})))}function io({node:e,raw:t,interactive:n,openCanvas:i}){let a=e?.data??{},s=()=>{!n||typeof i!="function"||i(a)};return q.createElement("span",{role:n?"button":void 0,tabIndex:n?0:void 0,title:t??a.label??"\u753B\u5E03",onClick:s,onKeyDown:r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),s())},style:{display:"inline-flex",alignItems:"center",gap:4,margin:"0 2px",padding:"1px 6px",borderRadius:5,border:"1px solid var(--dsw-alias-border-l1)",background:"color-mix(in srgb, #4D6BFE 10%, transparent)",color:"var(--dsw-alias-label-primary)",fontSize:"0.94em",lineHeight:1.5,verticalAlign:"baseline",cursor:n?"pointer":"default"}},q.createElement(Et,{size:13}),q.createElement("span",null,a.label??"\u753B\u5E03"))}function ao(e,t){e.inject(["uiConversation"],n=>{n.effect(()=>n.uiConversation.userText.register(Ri),"dsh-canvas: user text rule");try{n.effect(()=>n.slots.inject("conversation.user.text.node",()=>n.slots.register({name:"conversation.user.text.node",key:"dsh-canvas",priority:120,inject:i=>({openCanvas:a=>{try{t.openTab("canvas")}catch(s){console.warn("[dsh-canvas] openTab from reference failed",s)}En({...a,sessionId:i})}})},io)),"dsh-canvas: user text chip")}catch(i){console.warn("[dsh-canvas] could not register the in-chat canvas link renderer",i),Le({phase:"user-text-chip-failed",message:String(i instanceof Error?i.message:i)})}})}function so({sessionId:e,nav:t}){let[n,i]=q.useState(()=>Mt(e));return q.useEffect(()=>(i(Mt(e)),Si(()=>i(Mt(e)))),[e]),n?q.createElement("div",{style:{display:"inline-flex",alignSelf:"flex-start",marginLeft:16,alignItems:"center",gap:6,maxWidth:"100%",padding:"2px 8px",border:"1px solid color-mix(in srgb, #4D6BFE 16%, transparent)",borderRadius:999,background:"color-mix(in srgb, #4D6BFE 7%, transparent)",color:"var(--dsw-alias-label-primary)",font:"12px/1.5 var(--dsw-font-family, system-ui, sans-serif)"}},q.createElement("button",{type:"button",onClick:()=>{try{t.openTab("canvas")}catch(s){console.warn("[dsh-canvas] openTab from selection dock failed",s)}En({...n,sessionId:e})},title:"\u6253\u5F00\u753B\u5E03\u5E76\u5B9A\u4F4D\u5230\u8BE5\u8282\u70B9",style:{display:"flex",alignItems:"center",gap:5,minWidth:0,padding:0,border:"none",background:"transparent",color:"#4D6BFE",cursor:"pointer",font:"inherit"}},q.createElement(Et,{size:14}),q.createElement("span",{style:{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},`\u5728\u753B\u5E03\u4E2D\u5B9A\u4F4D\uFF1A${n.label}`)),q.createElement("button",{type:"button",title:"\u5173\u95ED","aria-label":"\u5173\u95ED",onClick:()=>$i(e),style:{border:"none",background:"transparent",color:"var(--dsw-alias-label-secondary)",cursor:"pointer",font:"inherit"}},"\xD7")):null}function ro({nav:e,title:t}){return q.createElement("button",{type:"button",title:t,"aria-label":t,onClick:()=>{try{e.openTab("canvas"),Le({phase:"open-tab",ok:!0})}catch(n){console.warn("[dsh-canvas] openTab failed",n),Le({phase:"open-tab",ok:!1,message:String(n instanceof Error?n.message:n)})}},style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,border:"none",borderRadius:6,background:"transparent",color:"var(--dsw-alias-label-secondary)",cursor:"pointer"}},q.createElement(Et,{size:16}))}var oo="dsh-canvas",co=["slots","locale"];function lo(e){Le({phase:"client-apply",href:typeof location>"u"?null:location.href}),typeof window<"u"&&(window.addEventListener("error",r=>{Le({phase:"window-error",message:String(r.message??""),stack:String(r.error?.stack??"")})}),window.addEventListener("unhandledrejection",r=>{Le({phase:"unhandled-rejection",message:String(r.reason?.message??r.reason??"")})})),e.effect(()=>e.locale.register(Rt,{zh:Qr,en:eo}),"dsh-canvas: locale");let t=e.locale.bind(Rt),n=(r,l)=>{l.effect(()=>r.register({id:za,kind:"canvas",priority:"extension",title:()=>t("tab.title"),guide:[{id:"canvas",order:30,title:()=>t("guide.title"),description:()=>t("guide.description"),icon:Et}],keepMounted:!0}),"dsh-canvas: tab type"),l.effect(()=>l.slots.inject("sidebar.right.pane.tab",()=>l.slots.register({name:"sidebar.right.pane.tab",key:za,locale:Rt},to)),"dsh-canvas: tab body"),l.inject(["sidebarRight"],o=>{let c=o.sidebarRight;!c||typeof c.openTab!="function"||(ao(o,c),o.effect(()=>o.slots.inject("conversation.input.right",()=>o.slots.register({name:"conversation.input.right",id:"dsh-canvas-open",order:23,label:()=>t("composer.open")},()=>q.createElement(ro,{nav:c,title:t("composer.open")}))),"dsh-canvas: composer button"),o.effect(()=>o.slots.inject("conversation.input.dock",()=>o.slots.register({name:"conversation.input.dock",id:"dsh-canvas-selection",order:55,locale:Rt},d=>q.createElement(so,{sessionId:d.sessionId,nav:c}))),"dsh-canvas: selection dock"))})},i=()=>{let r=null;return e.effect(()=>(r=e.slots.inject("conversation.input.dock",()=>e.slots.register({name:"conversation.input.dock",id:"dsh-canvas-dock",order:45,locale:Rt},l=>q.createElement(no,{sessionId:l.sessionId,inputActions:l.inputActions,openLabel:t("dock.open"),closeLabel:t("dock.close"),title:t("tab.title")}))),()=>{r?.(),r=null}),"dsh-canvas: inline dock"),()=>{r?.(),r=null}},a=e.get("sidebarRightTabs");if(a&&typeof a.register=="function"){n(a,e);return}let s=i();e.inject(["sidebarRightTabs"],r=>{s();let l=r.sidebarRightTabs;!l||typeof l.register!="function"||n(l,r)})}

    return module.exports;
  },
});
