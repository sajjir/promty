import {useState,useEffect,useRef} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Plus,Pencil,ChevronDown,FileText,BookOpen,Layout} from 'lucide-react';
import {useAuth} from './AuthContext';
export default function AdminShortcuts(){const {isAdmin}=useAuth();const {pathname,search}=useLocation();const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{setOpen(false);},[pathname,search]);
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as globalThis.Node))setOpen(false);};document.addEventListener('pointerdown',outside,true);return()=>document.removeEventListener('pointerdown',outside,true);},[open]);
 if(!isAdmin)return null;
 const prompt=pathname.match(/^\/prompts?\/([^/]+)$/),blog=pathname.match(/^\/blog\/([^/]+)$/),page=pathname.match(/^\/(guide|about|contact|blog)$/)?.[1]||pathname.match(/^\/pages\/([^/]+)$/)?.[1];
 const edit=prompt?'/admin/prompts/'+prompt[1]+'/edit':blog?'/admin?tab=blog&editBlog='+encodeURIComponent(decodeURIComponent(blog[1])):page?'/admin?tab=pages&editPage='+encodeURIComponent(decodeURIComponent(page)):'';
 return <div className="admin-shortcuts"><div ref={root} className="admin-create" onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}><button type="button" aria-expanded={open} aria-controls="admin-create-links" onClick={()=>setOpen(true)}><Plus aria-hidden="true"/>بساز<ChevronDown aria-hidden="true"/></button>{open&&<nav id="admin-create-links" className="admin-create-menu" aria-label="ساخت محتوا"><Link to="/admin/prompts/new" onClick={()=>setOpen(false)}><FileText aria-hidden="true"/>پرامپت تازه</Link><Link to="/admin?tab=blog&newBlog=1" onClick={()=>setOpen(false)}><BookOpen aria-hidden="true"/>بلاگ آموزشی</Link><Link to="/admin?tab=pages&newPage=1" onClick={()=>setOpen(false)}><Layout aria-hidden="true"/>برگه</Link></nav>}</div>{edit&&<Link to={edit} aria-label="ویرایش همین محتوا"><Pencil aria-hidden="true"/>ویرایش</Link>}</div>;
}
