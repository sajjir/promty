import {useState} from 'react';
import type {Prompt} from '../types';
import {getToolIcon,getDomainGradient} from '../lib/toolIcons';
/** The same cover priority as archive cards, with a visible fallback for unillustrated prompts. */
export default function AdminPromptThumbnail({prompt}:{prompt:Prompt}){
 const source=prompt.coverImage||prompt.mediaGallery?.[0]||prompt.sampleImage||'';
 const [failed,setFailed]=useState('');const Icon=getToolIcon(prompt.tools?.[0]);
 return <span aria-hidden="true" className={`w-12 h-12 shrink-0 overflow-hidden rounded-lg border border-line flex items-center justify-center bg-gradient-to-tr ${getDomainGradient(prompt.domains?.[0])}`}>
 {source&&failed!==source?<img src={source} alt="" width={48} height={48} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(source)} className="w-full h-full object-cover"/>:<Icon className="w-6 h-6 text-white/70"/>}
 </span>;
}
