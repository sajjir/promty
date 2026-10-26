import {useEffect,useState} from 'react';
import {useParams,useSearchParams} from 'react-router-dom';
import BlogArticle,{BlogIndexContent} from '../components/BlogContent';
import type {BlogPost,BlogSummary} from '../lib/blogTypes';
export default function BlogPages(){
 const {slug}=useParams();const [params]=useSearchParams();const page=params.get('page')||'1';
 const [result,setResult]=useState<{post?:BlogPost;data?:BlogSummary[];total?:number;page?:number;pageSize?:number;error?:string;missing?:boolean}>({});
 const [retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();setResult({});void fetch(slug?'/api/blog/'+encodeURIComponent(slug):'/api/blog?page='+encodeURIComponent(page),{signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw {missing:response.status===404,message:data.message||'دریافت آموزش انجام نشد.'};if(!controller.signal.aborted)setResult(data);}).catch(e=>{if(!controller.signal.aborted)setResult({error:e.message||'دریافت آموزش انجام نشد.',missing:e.missing});});return()=>controller.abort();},[slug,page,retry]);
 if(result.error)return <section className="trust-page"><h1>{result.missing?'آموزش پیدا نشد':'دریافت آموزش انجام نشد'}</h1><p>{result.missing?'این مقاله وجود ندارد یا منتشر نشده است.':result.error}</p><div className="trust-page-related"><a href="/blog">همهٔ آموزش‌ها</a>{!result.missing&&<button onClick={()=>setRetry(x=>x+1)}>تلاش دوباره</button>}</div></section>;
 if(result.post)return <BlogArticle post={result.post}/>;
 if(result.data)return <BlogIndexContent data={result.data} total={result.total||0} page={result.page||1} pageSize={result.pageSize||12}/>;
 return <p role="status" className="blog-empty">در حال دریافت آموزش…</p>;
}
