import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
export default function SeoHeadSync({onStatus}:{onStatus?:(status:number,key:string)=>void}={}) {
    const { pathname, search } = useLocation();
    useEffect(() => {
        const controller = new AbortController();
        void fetch('/api/seo?path=' + encodeURIComponent(pathname.replace(/^\/prompt\//,'/prompts/') + search), { signal: controller.signal }).then(r => r.ok ? r.json() : Promise.reject()).then(data => {
            if (controller.signal.aborted)
                return;
            onStatus?.(data.status,pathname+search);
            const doc = new DOMParser().parseFromString(data.head, 'text/html');
            const selector = 'title,meta[name="description"],meta[name="robots"],link[rel="canonical"],meta[property^="og:"],script[type="application/ld+json"]';
            document.head.querySelectorAll(selector).forEach(x => x.remove());
            doc.head.querySelectorAll(selector).forEach(x => document.head.appendChild(document.importNode(x, true)));
        }).catch(() => { });
        return () => controller.abort();
    }, [pathname, search, onStatus]);
    return null;
}
