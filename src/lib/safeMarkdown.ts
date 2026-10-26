import MarkdownIt from 'markdown-it';
export type MarkdownBlock={kind:'html';html:string}|{kind:'prompt';promptId:string};
export function safeContentUrl(value:string,image=false):boolean {
 if(!value||/[\\\u0000-\u0020\u007f]/.test(value)||value.startsWith('//'))return false;
 if(value.startsWith('/')||(!image&&value.startsWith('#')))return true;
 try{const url=new URL(value);return !url.username&&!url.password&&(['http:','https:'].includes(url.protocol)||!image&&url.protocol==='mailto:');}catch{return false;}
}
const md=new MarkdownIt({html:false,linkify:false,typographer:false,breaks:false});
md.validateLink=value=>safeContentUrl(value);
for(const kind of ['fence','code_block']){const previous=md.renderer.rules[kind]!;md.renderer.rules[kind]=(...args)=>previous(...args).replace('<pre>','<pre dir="auto">');}

md.block.ruler.before('paragraph','prompt_embed',(state,start,_end,silent)=>{
 if(state.level!==0||state.sCount[start]-state.blkIndent>=4)return false;
 const line=state.src.slice(state.bMarks[start]+state.tShift[start],state.eMarks[start]).trim();
 const match=line.match(/^\[prompt:([a-zA-Z0-9_-]{1,100})\]$/);if(!match)return false;
 if(!silent){const token=state.push('prompt_embed','',0);token.meta={promptId:match[1]};state.line=start+1;}return true;
});
export function parseSafeMarkdown(source:string){
 const tokens=md.parse(source,{}),toc:{id:string;text:string;level:number}[]=[],images:string[]=[];
 let heading=0;
 for(let i=0;i<tokens.length;i++){
  const token=tokens[i];
  if(token.type==='heading_open'){
   // Prefix generated anchors to avoid DOM clobbering; one h1 belongs to the article title.
   if(token.tag==='h1'){token.tag='h2';if(tokens[i+2]?.type==='heading_close')tokens[i+2].tag='h2';}
   const id='blog-heading-'+(++heading);token.attrSet('id',id);
   if(['h2','h3'].includes(token.tag))toc.push({id,text:tokens[i+1]?.children?.map(t=>t.type==='image'?t.content:t.type==='text'||t.type==='code_inline'?t.content:'').join('')||tokens[i+1]?.content||'',level:Number(token.tag.slice(1))});
  }
  for(const child of token.children||[])if(child.type==='image'){const src=String(child.attrGet('src')||'');if(safeContentUrl(src,true)){images.push(src);child.attrSet('loading','lazy');}else child.attrSet('src','');}
 }
 const blocks:MarkdownBlock[]=[];let pending:typeof tokens=[];
 const flush=()=>{if(pending.length){blocks.push({kind:'html',html:md.renderer.render(pending,md.options,{})});pending=[];}};
 for(const token of tokens){if(token.type==='prompt_embed'){flush();blocks.push({kind:'prompt',promptId:String(token.meta.promptId)});}else pending.push(token);}flush();
 return {blocks,toc,imageUrls:[...new Set(images)],promptIds:[...new Set(blocks.flatMap(x=>x.kind==='prompt'?[x.promptId]:[]))]};
}
export const safeMarkdown=(source:string)=>parseSafeMarkdown(source).blocks.filter(x=>x.kind==='html').map(x=>(x as {html:string}).html).join('');
