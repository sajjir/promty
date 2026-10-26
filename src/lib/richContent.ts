import {parseDocument} from 'htmlparser2';
import {render as renderHtml} from 'dom-serializer';
import {decodeHTML} from 'entities';
import sanitizeHtml from 'sanitize-html';
import {parseSafeMarkdown,safeContentUrl} from './safeMarkdown';
export type ContentFormat='markdown'|'html';
export function videoEmbedUrl(value:string):string|null{
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;let id='';
 if(['youtube.com','www.youtube.com','www.youtube-nocookie.com','youtu.be'].includes(u.hostname)){
 id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname.startsWith('/embed/')?u.pathname.split('/')[2]:u.pathname==='/watch'?u.searchParams.get('v')||'':'';
 return /^[A-Za-z0-9_-]{11}$/.test(id)?'https://www.youtube-nocookie.com/embed/'+id:null;
 }
 if(['aparat.com','www.aparat.com'].includes(u.hostname)){
 id=u.pathname.match(/^\/v\/([A-Za-z0-9]+)\/?$/)?.[1]||u.pathname.match(/^\/video\/video\/embed\/videohash\/([A-Za-z0-9]+)\/vt\/frame\/?$/)?.[1]||'';
 return id?'https://www.aparat.com/video/video/embed/videohash/'+id+'/vt/frame':null;
 }}catch{}return null;
}
export function cleanRichHtml(source:string){return sanitizeHtml(source,{
 allowedTags:['p','br','h2','h3','h4','strong','b','em','i','u','s','blockquote','pre','code','ul','ol','li','hr','a','img','figure','figcaption','table','thead','tbody','tr','th','td','span','div','iframe'],
 allowedAttributes:{'*':['dir','style'],a:['href','title','target','rel'],img:['src','alt','width','height','loading'],iframe:['src','title','width','height','allowfullscreen','loading','sandbox','referrerpolicy'],ol:['start'],th:['colspan','rowspan'],td:['colspan','rowspan']},
 allowedStyles:{'*':{'text-align':[/^(left|right|center|justify)$/],color:[/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],'background-color':[/^#[0-9a-fA-F]{3,8}$/]}},
 allowedSchemes:['http','https','mailto'],allowProtocolRelative:false,allowedIframeHostnames:['www.youtube-nocookie.com','www.aparat.com'],allowIframeRelativeUrls:false,
 transformTags:{h1:'h2',a:(_tag,a)=>({tagName:'a',attribs:{...a,href:safeContentUrl(a.href||'')?a.href:'',rel:'noopener noreferrer',...(a.target==='_blank'?{target:'_blank'}:{target:'_self'})}}),img:(_tag,a)=>({tagName:'img',attribs:{...a,src:safeContentUrl(a.src||'',true)?a.src:'',loading:'lazy'}}),iframe:(_tag,a)=>({tagName:'iframe',attribs:{src:videoEmbedUrl(a.src||'')||'',title:a.title||'ویدیوی آموزشی',width:'640',height:'360',loading:'lazy',allowfullscreen:'',sandbox:'allow-scripts allow-same-origin allow-presentation',referrerpolicy:'strict-origin-when-cross-origin'}})},
 exclusiveFilter:frame=>['iframe','img'].includes(frame.tag)&&!frame.attribs.src,
 });}
export function parseArticleContent(source:string,format:ContentFormat='markdown'){
 if(format!=='html')return parseSafeMarkdown(source);
 const imageUrls:string[]=[],toc:{id:string;text:string;level:number}[]=[];let index=0;
 let html=cleanRichHtml(source).replace(/<(h[234])([^>]*)>([\s\S]*?)<\/\1>/g,(_all,tag,attrs,body)=>{const id='blog-heading-'+(++index);toc.push({id,text:decodeHTML(sanitizeHtml(body,{allowedTags:[],allowedAttributes:{}})),level:Number(tag[1])});return `<${tag}${attrs} id="${id}">${body}</${tag}>`;});
 for(const match of html.matchAll(/<img\b[^>]*src="([^"]+)"/g))imageUrls.push(match[1].replace(/&amp;/g,'&'));
 const blocks:({kind:'html';html:string}|{kind:'prompt';promptId:string})[]=[];
 let pending='';
 const flush=()=>{if(pending){blocks.push({kind:'html',html:pending});pending='';}};
 for(const node of parseDocument(html).children){
  const element=node as any;
  const match=element.type==='tag'&&element.name==='p'&&element.children.every((n:any)=>n.type==='text')?element.children.map((n:any)=>n.data).join('').trim().match(/^\[prompt:([a-zA-Z0-9_-]{1,100})\]$/):null;
  if(match){flush();blocks.push({kind:'prompt',promptId:match[1]});}else pending+=renderHtml(node);
 }
 flush();
 return {blocks,toc,imageUrls:[...new Set(imageUrls)],promptIds:[...new Set(blocks.flatMap(b=>b.kind==='prompt'?[b.promptId]:[]))]};
}
export function markdownToEditorHtml(source:string){return parseSafeMarkdown(source).blocks.map(b=>b.kind==='html'?b.html:`<p>[prompt:${b.promptId}]</p>`).join('');}
