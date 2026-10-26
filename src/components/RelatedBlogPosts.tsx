import {useEffect,useState} from 'react';
import {RelatedArticles} from './BlogCards';
import type {BlogSummary} from '../lib/blogTypes';
export default function RelatedBlogPosts({promptId}:{promptId:string}){const [posts,setPosts]=useState<BlogSummary[]>([]);useEffect(()=>{const controller=new AbortController();setPosts([]);void fetch('/api/blog-related/'+encodeURIComponent(promptId),{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(!controller.signal.aborted)setPosts(data.data||[]);}).catch(()=>{});return()=>controller.abort();},[promptId]);return <RelatedArticles posts={posts}/>;}
