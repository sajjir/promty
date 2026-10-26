export type BlogPrompt={id:string;title:string;description:string;useCase?:string|null;resourceType?:string;isActive:boolean};
export interface BlogPost {id:string;slug:string;title:string;excerpt:string;contentMd:string;contentFormat?:'markdown'|'html';authorName:string;category:string;coverImage:string|null;coverImageAlt:string|null;status:'DRAFT'|'PUBLISHED';deletedAt?:string|null;publishedAt:string|null;createdAt:string;updatedAt:string;prompts:BlogPrompt[];}
export type BlogSummary=Omit<BlogPost,'contentMd'|'prompts'>;
export interface BlogRepository {list(page?:number,admin?:boolean):Promise<{data:BlogSummary[];total:number;page:number;pageSize:number}>;get(slug:string,admin?:boolean):Promise<BlogPost|null>;forPrompt(id:string):Promise<BlogSummary[]>;}
export const blogHref=(slug:string)=>'/blog/'+encodeURIComponent(slug);
