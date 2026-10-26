import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {type HomepageChip} from '../lib/homepageChips';
import QuickChipLinks from './QuickChipLinks';
export default function HomepageQuickChips({chips}:{chips:HomepageChip[]}){
 const [counts,setCounts]=useState<Record<string,number>>({});const key=JSON.stringify(chips);
 useEffect(()=>{const controller=new AbortController();setCounts({});void fetch('/api/homepage/chips',{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(!controller.signal.aborted)setCounts(data.counts||{});}).catch(()=>{});return()=>controller.abort();},[key]);
 return <QuickChipLinks chips={chips} counts={counts} renderLink={(href,content,className,key)=><Link to={href} key={key} className={className}>{content}</Link>}/>;
}
