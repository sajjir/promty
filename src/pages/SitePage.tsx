import {useEffect,useState} from 'react';
import {useParams} from 'react-router-dom';
import type {SitePage as Page} from '../lib/sitePages';
import SitePageContent from '../components/SitePageContent';
import NotFoundPage from './NotFoundPage';
export default function SitePage({slug:fixed}:{slug?:string}){const params=useParams();const slug=fixed||params.slug||'';const [result,setResult]=useState<{page?:Page;error?:boolean;missing?:boolean}>({});const [retry,setRetry]=useState(0);
 useEffect(()=>{const c=new AbortController();setResult({});void fetch('/api/pages/'+encodeURIComponent(slug),{signal:c.signal}).then(async r=>{if(!r.ok)throw {missing:r.status===404};return r.json();}).then(data=>{if(!c.signal.aborted)setResult(data);}).catch(e=>{if(!c.signal.aborted)setResult({error:true,missing:e.missing});});return()=>c.abort();},[slug,retry]);
 if(result.missing)return <NotFoundPage/>;if(result.error)return <section><p role="alert">دریافت برگه انجام نشد.</p><button onClick={()=>setRetry(x=>x+1)}>تلاش دوباره</button></section>;return result.page?<SitePageContent page={result.page}/>:<p role="status">در حال دریافت برگه…</p>;
}
