import {getUseCase} from './archiveCatalog';
import {defaultTaxonomies} from './defaultTaxonomies';
export type FooterLink={label:string;href:string};
export function footerDiscoveryLinks(data:{archiveFacets?:{useCases?:Record<string,number>};facets?:{tools?:Record<string,number>}}):FooterLink[]{
 const ranked=(counts:Record<string,number>={})=>Object.entries(counts).filter(([,n])=>Number.isFinite(n)&&n>0).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 const cases=ranked(data.archiveFacets?.useCases).filter(([slug])=>!!getUseCase(slug)).slice(0,3).map(([slug])=>({label:getUseCase(slug)!.title,href:'/use-case/'+encodeURIComponent(slug)}));
 const tools=ranked(data.facets?.tools).filter(([slug])=>/^[a-z0-9-]+$/.test(slug)).slice(0,2).map(([slug])=>({label:defaultTaxonomies.find(t=>t.type==='tool'&&t.slug===slug)?.titleFa||slug,href:'/tool/'+encodeURIComponent(slug)}));
 return [{label:'همهٔ پرامپت‌ها و منابع',href:'/'},...cases,...tools];
}
