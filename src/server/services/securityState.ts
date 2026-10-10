import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

type State = { revoked: Record<string,number>; budgets: Record<string,{count:number;reset:number}> };
export class SecurityState {
 constructor(private file = process.env.SECURITY_STATE_PATH || path.resolve('.private/security-state.json')) {}
 private transact<T>(fn:(state:State)=>T):T {
  fs.mkdirSync(path.dirname(this.file),{recursive:true,mode:0o700});
  const lock=this.file+'.lock';const handle=fs.openSync(lock,'wx',0o600);
  const temp=this.file+'.'+crypto.randomUUID()+'.tmp';
  try {
   const state:State=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{revoked:{},budgets:{}};
   for(const [key,value] of Object.entries(state.budgets))if(value.reset<=Date.now())delete state.budgets[key];
   const result=fn(state);
   const out=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(out,JSON.stringify(state));fs.fsyncSync(out);}finally{fs.closeSync(out);}
   fs.renameSync(temp,this.file);const dir=fs.openSync(path.dirname(this.file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}
   return result;
  }finally{if(fs.existsSync(temp))fs.unlinkSync(temp);fs.closeSync(handle);fs.unlinkSync(lock);}
 }
 revokedAfter(id:string):number {return this.transact(state=>state.revoked[id] || 0);}
 revoke(ids:string[]) {this.transact(state=>{for(const id of ids)state.revoked[id]=Math.floor(Date.now()/1000);});}
 consume(key:string,max:number,windowMs:number):boolean {
  const digest=crypto.createHash('sha256').update(key).digest('hex');
  return this.transact(state=>{const item=state.budgets[digest] ||= {count:0,reset:Date.now()+windowMs};return ++item.count<=max;});
 }
}
export const securityState = new SecurityState();
