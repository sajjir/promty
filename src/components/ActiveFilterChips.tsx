import {useLayoutEffect,useRef,useState} from 'react';
import {X} from 'lucide-react';
import './active-filter-chips.css';
export type ActiveFilterItem={type:string;value:string;label:string};
export default function ActiveFilterChips({items,onRemove,onEdit}:{items:ActiveFilterItem[];onRemove:(item:ActiveFilterItem)=>void;onEdit:()=>void}){
 const root=useRef<HTMLDivElement>(null);
 const [visible,setVisible]=useState(items.length);
 const signature=JSON.stringify(items);
 useLayoutEffect(()=>{
  const node=root.current;if(!node)return;
  const measure=()=>{
   const widths=(Array.from(node.querySelectorAll('[data-chip-measure]')) as HTMLElement[]).map(x=>x.getBoundingClientRect().width);
   const extra=node.querySelector<HTMLElement>('[data-more-measure]')?.getBoundingClientRect().width||80;
   const edit=node.querySelector<HTMLElement>('[data-edit-measure]')?.getBoundingClientRect().width||56;
   const available=node.clientWidth;if(!available)return;
   const fits=(sizes:number[])=>{let rows=1,used=0;for(const width of sizes){const space=used?6:0;if(used+space+width>available){rows++;used=width;}else used+=space+width;}return rows<=2;};
   let count=widths.length;
   while(count>0&&!fits([...widths.slice(0,count),...(count<widths.length?[extra]:[]),edit]))count--;
   setVisible(count);
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(node);
  document.fonts.ready.then(()=>{if(node.isConnected)measure();});
  return()=>observer.disconnect();
 },[signature]);
 const shown=items.slice(0,visible),hidden=items.length-shown.length;
 return <div className="active-chips" ref={root}>
  {shown.map(item=><button type="button" className="active-chip" key={item.type+':'+item.value} title={item.label} aria-label={`حذف فیلتر ${item.label}`} onClick={()=>onRemove(item)}><span>{item.label}</span><X aria-hidden="true"/></button>)}
  {hidden>0&&<button type="button" className="active-chip-more" onClick={onEdit} aria-label="مشاهدهٔ همهٔ فیلترهای فعال">+{hidden.toLocaleString('fa-IR')} مورد</button>}
  <button type="button" className="active-chip-edit" onClick={onEdit}>ویرایش</button>
  <div className="active-chips-measure" aria-hidden="true">{items.map(item=><span data-chip-measure className="active-chip" key={item.type+':'+item.value}><span>{item.label}</span><X/></span>)}<span data-more-measure className="active-chip-more">+{items.length.toLocaleString('fa-IR')} مورد</span><span data-edit-measure className="active-chip-edit">ویرایش</span></div>
 </div>;
}
