'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {URL} = require('node:url');
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname,'data','db.json');
const SECRET = process.env.SESSION_SECRET || 'local-development-change-this-secret';
const now = () => new Date().toISOString();
const future = hours => new Date(Date.now()+hours*3600000).toISOString();
const seed = () => ({users:[],predictions:[],events:[
 {id:1,home:'Colombia',away:'Argentina',league:'Eliminatorias',startsAt:future(30),oddsHome:2.45,oddsDraw:3.1,oddsAway:2.8,status:'open',result:null},
 {id:2,home:'Brasil',away:'Uruguay',league:'Eliminatorias',startsAt:future(48),oddsHome:1.85,oddsDraw:3.5,oddsAway:4.1,status:'open',result:null},
 {id:3,home:'Bolivia',away:'Chile',league:'Eliminatorias',startsAt:future(72),oddsHome:2.2,oddsDraw:3.25,oddsAway:3.15,status:'open',result:null},
 {id:4,home:'Real Madrid',away:'Barcelona',league:'Liga española',startsAt:future(96),oddsHome:2.25,oddsDraw:3.35,oddsAway:2.95,status:'open',result:null}
 ],nextUserId:1,nextPredictionId:1,nextEventId:5});
function readDB(){if(!fs.existsSync(DATA_FILE)){fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});fs.writeFileSync(DATA_FILE,JSON.stringify(seed(),null,2))}return JSON.parse(fs.readFileSync(DATA_FILE,'utf8'))}
function saveDB(db){fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});const tmp=DATA_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2));fs.renameSync(tmp,DATA_FILE)}
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){return `${salt}:${crypto.scryptSync(password,salt,64).toString('hex')}`}
function checkPassword(password,stored){const [salt,hex]=stored.split(':');if(!salt||!hex)return false;const a=Buffer.from(hex,'hex'),b=crypto.scryptSync(password,salt,a.length);return crypto.timingSafeEqual(a,b)}
function sign(data){return crypto.createHmac('sha256',SECRET).update(data).digest('base64url')}
function token(user){const payload=Buffer.from(JSON.stringify({id:user.id,exp:Date.now()+86400000})).toString('base64url');return payload+'.'+sign(payload)}
function auth(req,db){const t=(req.headers.authorization||'').replace(/^Bearer /,'');const [p,s]=t.split('.');if(!p||!s||sign(p)!==s)return null;try{const v=JSON.parse(Buffer.from(p,'base64url').toString());return v.exp>Date.now()?db.users.find(u=>u.id===v.id)||null:null}catch{return null}}
function publicUser(u){return {id:u.id,name:u.name,email:u.email,role:u.role,balance:u.balance}}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
function fail(res,status,message){return send(res,status,{error:message})}
function parseBody(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>50000){reject(Error('Solicitud demasiado grande'));req.destroy()}});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(Error('JSON inválido'))}});req.on('error',reject)})}
async function api(req,res,url){const db=readDB(),route=url.pathname,method=req.method;let body={};if(['POST','PUT','PATCH'].includes(method)){try{body=await parseBody(req)}catch{return fail(res,400,'Cuerpo JSON inválido')}}
 if(route==='/api/register'&&method==='POST'){
 const name=String(body.name||'').trim(),email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
 if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||password.length<8)return fail(res,400,'Nombre, email válido y contraseña de mínimo 8 caracteres requeridos');
 if(db.users.some(u=>u.email===email))return fail(res,409,'El correo ya está registrado');
 const user={id:db.nextUserId++,name,email,passwordHash:hashPassword(password),role:db.users.length===0?'admin':'user',balance:1000,createdAt:now()};db.users.push(user);saveDB(db);return send(res,201,{user:publicUser(user),token:token(user)})}
 if(route==='/api/login'&&method==='POST'){const u=db.users.find(x=>x.email===String(body.email||'').trim().toLowerCase());if(!u||!checkPassword(String(body.password||''),u.passwordHash))return fail(res,401,'Credenciales incorrectas');return send(res,200,{user:publicUser(u),token:token(u)})}
 if(route==='/api/events'&&method==='GET')return send(res,200,{events:db.events.sort((a,b)=>a.startsAt.localeCompare(b.startsAt))});
 const user=auth(req,db);if(!user)return fail(res,401,'Iniciá sesión para continuar');
 if(route==='/api/me'&&method==='GET')return send(res,200,{user:publicUser(user)});
 if(route==='/api/predictions'&&method==='GET')return send(res,200,{predictions:db.predictions.filter(p=>p.userId===user.id).map(p=>({...p,event:db.events.find(e=>e.id===p.eventId)})).reverse()});
 if(route==='/api/predictions'&&method==='POST'){
 const event=db.events.find(e=>e.id===Number(body.eventId)),choice=String(body.choice||''),stake=Number(body.stake);
 if(!event||event.status!=='open'||new Date(event.startsAt)<=new Date())return fail(res,400,'Evento no disponible');
 if(!['home','draw','away'].includes(choice))return fail(res,400,'Selección inválida');
 if(!Number.isInteger(stake)||stake<1||stake>10000)return fail(res,400,'Ingresá un monto entero de 1 a 10000 créditos');
 if(stake>user.balance)return fail(res,400,'Saldo insuficiente');
 const odds=event[choice==='home'?'oddsHome':choice==='draw'?'oddsDraw':'oddsAway'];
 user.balance-=stake;const p={id:db.nextPredictionId++,userId:user.id,eventId:event.id,choice,stake,odds,potential:Math.round(stake*odds*100)/100,status:'pending',createdAt:now()};db.predictions.push(p);saveDB(db);return send(res,201,{prediction:p,user:publicUser(user)})}
 if(!route.startsWith('/api/admin/'))return fail(res,404,'Ruta inexistente');
 if(user.role!=='admin')return fail(res,403,'Acceso restringido a administradores');
 if(route==='/api/admin/stats'&&method==='GET')return send(res,200,{users:db.users.length,events:db.events.length,predictions:db.predictions.length});
 if(route==='/api/admin/events'&&method==='POST'){
 const home=String(body.home||'').trim(),away=String(body.away||'').trim(),league=String(body.league||'').trim(),startsAt=String(body.startsAt||'');
 const odds=[Number(body.oddsHome),Number(body.oddsDraw),Number(body.oddsAway)];
 if(!home||!away||!league||!Number.isFinite(Date.parse(startsAt))||new Date(startsAt)<=new Date()||odds.some(x=>!Number.isFinite(x)||x<1.01||x>100))return fail(res,400,'Datos de evento inválidos');
 const event={id:db.nextEventId++,home,away,league,startsAt:new Date(startsAt).toISOString(),oddsHome:odds[0],oddsDraw:odds[1],oddsAway:odds[2],status:'open',result:null};db.events.push(event);saveDB(db);return send(res,201,{event})}
 const m=route.match(/^\/api\/admin\/events\/(\d+)\/settle$/);
 if(m&&method==='POST'){
 const event=db.events.find(e=>e.id===Number(m[1])),result=String(body.result||'');if(!event||event.status!=='open')return fail(res,400,'Evento no disponible');if(!['home','draw','away'].includes(result))return fail(res,400,'Resultado inválido');
 event.status='settled';event.result=result;let winners=0;
 for(const p of db.predictions.filter(p=>p.eventId===event.id&&p.status==='pending')){if(p.choice===result){p.status='won';const owner=db.users.find(u=>u.id===p.userId);if(owner)owner.balance=Math.round((owner.balance+p.potential)*100)/100;winners++}else p.status='lost'}
 saveDB(db);return send(res,200,{event,winners})}
 return fail(res,404,'Ruta inexistente')}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/'))return await api(req,res,url);if(req.method!=='GET')return fail(res,405,'Método no permitido');let file=path.resolve(__dirname,'public',url.pathname==='/'?'index.html':'.'+decodeURIComponent(url.pathname));const root=path.resolve(__dirname,'public');if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html'))return fail(res,403,'Acceso denegado');if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'index.html');res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res)}catch(err){console.error(err);if(!res.headersSent)fail(res,500,'Error interno del servidor')}});
if(require.main===module)server.listen(PORT,'0.0.0.0',()=>console.log(`GolazoBet: http://localhost:${PORT}`));
module.exports={server,hashPassword,checkPassword,seed};
