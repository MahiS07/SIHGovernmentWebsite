import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STORE = path.resolve(process.env.AICTE_DATA_FILE || path.join(ROOT, '.data', 'monitor.json'))
const BUREAUS = ['Regulation Bureau', 'PGRC', 'Approval Bureau', 'Vigilance Cell']
const ROLES = ['Super Admin', 'Admin / Competent Authority', 'Bureau Officer', 'Regional Officer']
const REMINDER_DAYS = Math.max(1,Math.min(90,Number(process.env.AICTE_REMINDER_DAYS)||7))
const sessions = new Map()
const loginAttempts = new Map()
const now = () => new Date().toISOString()
const id = (prefix) => `${prefix}-${crypto.randomUUID()}`
const shiftedDate = (days) => { const d=new Date();d.setDate(d.getDate()+days);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) }

function seed() {
  const cases = [
    ['AICTE/REG/2025/0148','Saraswati Institute of Technology','Regulation Bureau','18 Jun 2025','Under Process','Inspection response received','28 Jun 2025','High','Infrastructure and faculty compliance'],
    ['AICTE/PGRC/2025/0139','Saraswati Institute of Technology','PGRC','15 Jun 2025','Pending','Assigned to Dr. Meera Iyer','25 Jun 2025','High','Student grievance regarding facilities'],
    ['AICTE/APP/2025/0127','North Valley College of Engineering','Approval Bureau','12 Jun 2025','Escalated','Reminder sent to institution','21 Jun 2025','Critical','Intake approval discrepancy'],
    ['AICTE/REG/2025/0116','Aryavarta School of Management','Regulation Bureau','08 Jun 2025','Disposed','Final order communicated','20 Jun 2025','Normal','Mandatory disclosure non-compliance'],
    ['AICTE/PGRC/2025/0104','Deccan Technical University','PGRC','02 Jun 2025','Under Process','Hearing scheduled','02 Jul 2025','Normal','Fee refund grievance'],
    ['AICTE/VIG/2025/0098','Eastern Institute of Design','Vigilance Cell','29 May 2025','Pending','Preliminary review initiated','29 Jun 2025','High','Admission process irregularity'],
  ].map(([caseId,institution,bureau,_received,status,last,_deadline,priority,subject],index) => ({ caseId,institution,bureau,received:shiftedDate(-5-index*3),status,last,deadline:shiftedDate(status==='Disposed'?-8:index===2?-2:index===1?2:7+index),priority,subject,description:'Fictional demonstration record. Replace with verified complaint details.',region:'',category:'General',assignedTo:'',actions:[],createdAt:now(),updatedAt:now() }))
  const institutionMeta={"Saraswati Institute of Technology":["Rajasthan","Jaipur","Private · Engineering"],"North Valley College of Engineering":["Uttarakhand","Dehradun","Private · Engineering"],"Aryavarta School of Management":["Maharashtra","Pune","Private · Management"],"Deccan Technical University":["Telangana","Hyderabad","State University"],"Eastern Institute of Design":["West Bengal","Kolkata","Private · Design"]}
  const institutions = [...new Set(cases.map(c => c.institution))].map((name, i) => ({ institutionId:`INST-${String(i+1).padStart(4,'0')}`, aicteId:'', name, address:'', state:institutionMeta[name]?.[0]||'', region:institutionMeta[name]?.[1]||'', type:institutionMeta[name]?.[2]||'', createdAt:now() }))
  return { users:[], cases, institutions, overlaps:[], audit:[], notifications:[] }
}

function loadStore() {
  fs.mkdirSync(path.dirname(STORE), { recursive:true })
  if (!fs.existsSync(STORE)) fs.writeFileSync(STORE, JSON.stringify(seed(), null, 2), { mode:0o600 })
  const data = JSON.parse(fs.readFileSync(STORE, 'utf8'))
  data.notifications ||= []; data.overlaps ||= []; data.audit ||= []; data.institutions ||= []; data.cases ||= []; data.users ||= []
  const previousOverlapCount=data.overlaps.length
  discoverOverlaps(data)
  const previousNotificationCount=data.notifications.length
  syncDeadlineNotifications(data)
  if(data.overlaps.length!==previousOverlapCount||data.notifications.length!==previousNotificationCount)saveStore(data)
  if (process.env.AICTE_BOOTSTRAP_EMAIL && process.env.AICTE_BOOTSTRAP_PASSWORD && !data.users.some(u => u.role === 'Super Admin')) {
    if(process.env.AICTE_BOOTSTRAP_PASSWORD.length<12||!/[0-9]/.test(process.env.AICTE_BOOTSTRAP_PASSWORD)||!/[^A-Za-z0-9]/.test(process.env.AICTE_BOOTSTRAP_PASSWORD))throw new Error('AICTE_BOOTSTRAP_PASSWORD must be 12+ characters and include a number and symbol.')
    data.users.push({ id:id('usr'), name:process.env.AICTE_BOOTSTRAP_NAME || 'System Administrator', email:process.env.AICTE_BOOTSTRAP_EMAIL.toLowerCase(), passwordHash:hash(process.env.AICTE_BOOTSTRAP_PASSWORD), role:'Super Admin', bureau:'', region:'', preferences:{}, active:true, approved:true, createdAt:now() })
    saveStore(data)
  }
  return data
}
function saveStore(data) {
  fs.mkdirSync(path.dirname(STORE), { recursive:true })
  const temp = `${STORE}.${process.pid}.tmp`
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), { mode:0o600 })
  fs.renameSync(temp, STORE)
}
function hash(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`
}
function passwordMatches(password, stored) {
  const [salt, hex] = (stored || '').split(':')
  if (!salt || !hex) return false
  const expected = Buffer.from(hex, 'hex')
  const actual = crypto.scryptSync(password, salt, expected.length)
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}
const publicUser = ({ passwordHash, ...user }) => user
function statusCodeError(status, message) { const e = new Error(message); e.status = status; return e }
function canSee(user, c) {
  if (user.role === 'Super Admin' || user.role === 'Admin / Competent Authority') return true
  if (user.role === 'Bureau Officer') return c.bureau === user.bureau || (c.sharedWith || []).includes(user.bureau)
  if (user.role === 'Regional Officer') return !!user.region && c.region === user.region
  return false
}
function requireRole(user, roles) { if (!user || !roles.includes(user.role)) throw statusCodeError(403, 'You are not authorised to perform this action.') }
function audit(data, user, action, c, detail = {}) {
  data.audit.unshift({ id:id('aud'), at:now(), userId:user.id, userName:user.name, role:user.role, bureau:user.bureau, action, caseId:c?.caseId || '', institution:c?.institution || '', detail })
}
function discoverOverlaps(data) {
  const groups = new Map()
  for (const c of data.cases) {
    if (c.status === 'Disposed') continue
    const list = groups.get(c.institution) || []
    list.push(c); groups.set(c.institution, list)
  }
  for (const [institution, group] of groups) {
    const offices = [...new Set(group.map(c => c.bureau))]
    if (group.length < 2 || offices.length < 2) continue
    const pair = group.map(c => c.caseId).sort()
    const key = pair.join('|')
    if (data.overlaps.some(o => o.key === key)) continue
    const record = { id:id('ovl'), key, institution, caseIds:pair, bureaus:offices, reason:'Same institution has active complaints in different Bureaus. Review the records to determine whether they are related.', status:'Review required', createdAt:now(), decision:null }
    data.overlaps.push(record)
    data.notifications.unshift({ id:id('ntf'), type:'Potential overlap', text:`Potentially related cases at ${institution} need human review.`, caseIds:pair, createdAt:now(), read:false })
  }
}
function deadlineTime(c) {
  if (!c.deadline) return NaN
  const value=String(c.deadline)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T23:59:59`).getTime()
  const parsed=new Date(value);if(Number.isNaN(parsed.getTime()))return NaN;parsed.setHours(23,59,59,999);return parsed.getTime()
}
function syncDeadlineNotifications(data) {
  const time=Date.now()
  for(const c of data.cases){if(c.status==='Disposed')continue;const deadline=deadlineTime(c);if(!Number.isFinite(deadline))continue
    const remaining=deadline-time;const type=remaining<0?'Overdue case':remaining<=REMINDER_DAYS*86400000?'Deadline approaching':'';if(!type)continue
    const key=`${c.caseId}:${type}:${c.deadline}`;if(data.notifications.some(n=>n.dedupeKey===key))continue
    data.notifications.unshift({id:id('ntf'),dedupeKey:key,type,text:`${c.caseId} at ${c.institution} ${type==='Overdue case'?'is past its deadline':`is due within ${REMINDER_DAYS} days`}.`,caseIds:[c.caseId],createdAt:now(),read:false})
  }
}
function matchesFilters(items, url, user) {
  const q = (url.searchParams.get('q') || '').toLowerCase()
  const bureau = url.searchParams.get('bureau') || ''
  const status = url.searchParams.get('status') || ''
  const region = url.searchParams.get('region') || ''
  const category=url.searchParams.get('category')||''
  const institution=url.searchParams.get('institution')||''
  const from=url.searchParams.get('from')||'';const to=url.searchParams.get('to')||''
  return items.filter(x => (!user || !x.caseId || canSee(user, x)) &&
    (!q || JSON.stringify(x).toLowerCase().includes(q)) && (!bureau || x.bureau === bureau) && (!status || (status==='Overdue'?isOverdue(x):x.status===status)) && (!region || x.region === region) && (!category||x.category===category) && (!institution||x.institution.toLowerCase().includes(institution.toLowerCase())) && (!from||new Date(x.received||x.createdAt)>=new Date(from)) && (!to||new Date(x.received||x.createdAt)<new Date(`${to}T23:59:59`)))
}
async function readBody(req) {
  let text = ''
  for await (const chunk of req) { text += chunk; if (text.length > 1_000_000) throw statusCodeError(413, 'Request is too large.') }
  try { return text ? JSON.parse(text) : {} } catch { throw statusCodeError(400, 'Invalid JSON request.') }
}
function reply(res, status, value, headers = {}) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...headers })
  res.end(JSON.stringify(value))
}

export async function handleApi(req, res) {
  const url = new URL(req.url, 'http://localhost')
  if (!url.pathname.startsWith('/api/')) return false
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin':'null', 'Access-Control-Allow-Credentials':'true' }); res.end(); return true }
  try {
    // Strict same-origin guard for state-changing browser requests.
    if (!['GET','HEAD'].includes(req.method) && req.headers.origin && req.headers.host && new URL(req.headers.origin).host !== req.headers.host) throw statusCodeError(403, 'Cross-origin request rejected.')
    const data = loadStore()
    const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('aicte_session='))?.slice('aicte_session='.length)
    const session = cookie ? sessions.get(cookie) : null
    const user = session && session.expires > Date.now() ? data.users.find(u => u.id === session.userId && u.active && u.approved) : null
    const body = ['POST','PATCH','PUT','DELETE'].includes(req.method) ? await readBody(req) : {}
    if (url.pathname === '/api/session' && req.method === 'GET') return reply(res, 200, { user:user ? publicUser(user) : null }) || true
    if (url.pathname === '/api/auth/signup' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase(), name = String(body.name || '').trim(), password = String(body.password || '')
      if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || password.length < 12 || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) throw statusCodeError(400, 'Provide a valid email, full name, and a 12+ character password with a number and symbol.')
      if (data.users.some(u => u.email === email)) throw statusCodeError(409, 'An account request already exists for this email.')
      const requested = { id:id('usr'), name, email, passwordHash:hash(password), role:'Bureau Officer', bureau:BUREAUS.includes(body.bureau) ? body.bureau : '', region:'', preferences:{}, active:false, approved:false, createdAt:now() }
      data.users.push(requested); saveStore(data)
      return reply(res, 201, { message:'Account request submitted for administrator approval.' }) || true
    }
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase(), password = String(body.password || '')
      const attemptKey=`${req.socket?.remoteAddress||'local'}:${email}`;const current=loginAttempts.get(attemptKey)||{count:0,until:Date.now()+15*60*1000};if(current.until<Date.now()){current.count=0;current.until=Date.now()+15*60*1000}if(current.count>=10)throw statusCodeError(429,'Too many sign-in attempts. Try again in 15 minutes.')
      const found = data.users.find(u => u.email === email)
      if (!found || !passwordMatches(password, found.passwordHash)) {current.count++;loginAttempts.set(attemptKey,current);throw statusCodeError(401, 'Email or password is incorrect.')}
      if (!found.active || !found.approved) throw statusCodeError(403, 'This account is awaiting administrator approval or is inactive.')
      loginAttempts.delete(attemptKey)
      const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, { userId:found.id, expires:Date.now()+8*60*60*1000 })
      return reply(res, 200, { user:publicUser(found) }, { 'Set-Cookie':`aicte_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.AICTE_COOKIE_SECURE==='true'?'; Secure':''}` }) || true
    }
    if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
      if (cookie) sessions.delete(cookie)
      return reply(res, 200, { ok:true }, { 'Set-Cookie':'aicte_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' }) || true
    }
    if (!user) throw statusCodeError(401, 'Sign in to access this workspace.')
    if(url.pathname==='/api/profile'&&req.method==='PATCH'){
      const name=String(body.name||'').trim();if(name.length<2||name.length>120)throw statusCodeError(400,'Enter a valid full name.')
      user.name=name;user.designation=String(body.designation||'').trim().slice(0,120);user.officeLocation=String(body.officeLocation||'').trim().slice(0,160);audit(data,user,'Profile updated',null,{});saveStore(data);return reply(res,200,{user:publicUser(user)})||true
    }
    if(url.pathname==='/api/auth/change-password'&&req.method==='POST'){
      if(!passwordMatches(String(body.currentPassword||''),user.passwordHash))throw statusCodeError(401,'Current password is incorrect.')
      const password=String(body.newPassword||'');if(password.length<12||!/[0-9]/.test(password)||!/[^A-Za-z0-9]/.test(password))throw statusCodeError(400,'New password must be 12+ characters and include a number and symbol.')
      user.passwordHash=hash(password);audit(data,user,'Password changed',null,{});saveStore(data);for(const [token,session]of sessions)if(session.userId===user.id)sessions.delete(token)
      return reply(res,200,{ok:true},{'Set-Cookie':'aicte_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'})||true
    }
    if(url.pathname==='/api/preferences'&&req.method==='GET')return reply(res,200,user.preferences||{})||true
    if(url.pathname==='/api/preferences'&&req.method==='PUT'){
      const allowed=['Deadline approaching','Case becomes overdue','New case assigned','Potential overlap detected','Coordination decision recorded','Case status changed'];const preferences={...(user.preferences||{})}
      for(const key of allowed)if(typeof body[key]==='boolean')preferences[key]=body[key]
      user.preferences=preferences;audit(data,user,'Notification preferences changed',null,{preferences});saveStore(data);return reply(res,200,preferences)||true
    }
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (url.pathname === '/api/cases' && req.method === 'GET') {
      const records=matchesFilters(data.cases.filter(c=>canSee(user,c)),url,user)
      const sort=url.searchParams.get('sort');if(sort==='deadline')records.sort((a,b)=>deadlineTime(a)-deadlineTime(b));else if(sort==='priority')records.sort((a,b)=>['Critical','High','Normal'].indexOf(a.priority)-['Critical','High','Normal'].indexOf(b.priority));else records.sort((a,b)=>new Date(b.received)-new Date(a.received))
      if(url.searchParams.has('limit')){const limit=Math.max(1,Math.min(100,Number(url.searchParams.get('limit'))||10));const offset=Math.max(0,Number(url.searchParams.get('offset'))||0);const countUrl=new URL(url);countUrl.searchParams.delete('status');const countRows=matchesFilters(data.cases.filter(c=>canSee(user,c)),countUrl,user);return reply(res,200,{items:records.slice(offset,offset+limit),total:records.length,counts:{pending:countRows.filter(c=>c.status==='Pending').length,overdue:countRows.filter(isOverdue).length}})||true}
      return reply(res,200,records) || true
    }
    if (url.pathname === '/api/cases' && req.method === 'POST') {
      if (!['Super Admin','Admin / Competent Authority','Bureau Officer'].includes(user.role)) throw statusCodeError(403, 'Your role cannot create cases.')
      const institution = String(body.institution || '').trim(), subject = String(body.subject || '').trim()
      if (institution.length < 3 || subject.length < 3 || !BUREAUS.includes(body.bureau || user.bureau)) throw statusCodeError(400, 'Institution, subject and valid Bureau are required.')
      const aicteId=String(body.aicteId||'').trim();if(aicteId&&data.institutions.some(i=>i.aicteId===aicteId&&i.name.toLowerCase()!==institution.toLowerCase()))throw statusCodeError(409,'That AICTE Permanent ID is already associated with a different institution. Review the directory record first.')
      const bureau = user.role === 'Bureau Officer' ? user.bureau : body.bureau
      let caseId
      do { caseId=`AICTE/${bureau.slice(0,4).toUpperCase()}/${new Date().getFullYear()}/${String(crypto.randomInt(0,1000000)).padStart(6,'0')}` } while(data.cases.some(x=>x.caseId===caseId))
      const c = { caseId, institution, bureau, received:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), status:'Pending', last:'Case registered', deadline:body.deadline || '', priority:['Normal','High','Critical'].includes(body.priority) ? body.priority : 'Normal', subject, description:String(body.description || '').trim(), region:user.region || String(body.region || ''), category:String(body.category || 'General'), assignedTo:'', actions:[], createdAt:now(), updatedAt:now() }
      data.cases.unshift(c)
      if (!data.institutions.some(x => x.name.toLowerCase() === institution.toLowerCase())) data.institutions.push({ institutionId:id('inst'), aicteId, name:institution, address:String(body.address || ''), state:String(body.state || ''), region:c.region, type:String(body.institutionType || ''), createdAt:now() })
      audit(data,user,'Case created',c,{ status:c.status }); discoverOverlaps(data); saveStore(data)
      return reply(res, 201, c) || true
    }
    if (pathParts[1] === 'cases' && pathParts.length >= 3) {
      const c = data.cases.find(x => x.caseId === decodeURIComponent(pathParts[2]))
      if (!c || !canSee(user,c)) throw statusCodeError(404, 'Case not found.')
      if (pathParts[3] === 'actions' && req.method === 'POST') {
        const note = String(body.remark || '').trim(); if (!note) throw statusCodeError(400, 'An action remark is required.')
        c.actions.unshift({ id:id('act'), at:now(), userId:user.id, userName:user.name, bureau:user.bureau, type:String(body.type || 'Remark'), remark:note })
        c.last=note; c.updatedAt=now(); audit(data,user,'Action recorded',c,{ type:body.type || 'Remark', remark:note }); saveStore(data)
        return reply(res, 201, c.actions[0]) || true
      }
      if (req.method === 'PATCH') {
        if (!['Super Admin','Admin / Competent Authority','Bureau Officer','Regional Officer'].includes(user.role)) throw statusCodeError(403,'Not authorised.')
        const previous={ status:c.status, bureau:c.bureau, deadline:c.deadline, assignedTo:c.assignedTo }
        if (user.role === 'Regional Officer' && c.assignedTo !== user.id && c.assignedTo !== user.email) throw statusCodeError(403,'Regional officers may update only cases assigned to them.')
        if (body.status !== undefined) {
          const allowed={Pending:['Under Process','Transferred','Escalated'], 'Under Process':['Pending','Disposed','Transferred','Escalated'], Transferred:['Pending','Under Process'], Escalated:['Under Process','Disposed'], Disposed:[]}
          if (body.status !== c.status && !allowed[c.status]?.includes(body.status)) throw statusCodeError(409,`Invalid status transition: ${c.status} → ${body.status}.`)
          if(body.status==='Transferred'){requireRole(user,['Super Admin','Admin / Competent Authority']);if(!BUREAUS.includes(body.bureau)||body.bureau===c.bureau||String(body.reason||'').trim().length<4)throw statusCodeError(400,'A transfer requires a different destination Bureau and reason.')}
          if(body.status==='Escalated'&&(!BUREAUS.includes(body.escalationTo)||String(body.reason||'').trim().length<4))throw statusCodeError(400,'An escalation requires a destination Bureau and reason.')
          if (c.status === 'Disposed' && user.role !== 'Super Admin' && body.status !== c.status) throw statusCodeError(403,'Only a Super Admin can reopen a disposed case.')
          c.status=body.status
        }
        if (body.bureau && body.bureau !== c.bureau) {
          requireRole(user,['Super Admin','Admin / Competent Authority'])
          if (!BUREAUS.includes(body.bureau) || !String(body.reason || '').trim()) throw statusCodeError(400,'Transfer requires a valid destination Bureau and reason.')
          c.bureau=body.bureau; audit(data,user,'Case transferred',c,{ from:previous.bureau,to:c.bureau,reason:body.reason,authorisedBy:user.name });data.notifications.unshift({id:id('ntf'),type:'Case transfer',text:`${c.caseId} was transferred to ${c.bureau}.`,caseIds:[c.caseId],createdAt:now(),read:false})
        }
        if (body.deadline !== undefined) c.deadline=String(body.deadline)
        if(body.status==='Escalated')c.escalationTo=body.escalationTo
        if (body.assignedTo !== undefined) { requireRole(user,['Super Admin','Admin / Competent Authority']);const target=data.users.find(u=>(u.id===body.assignedTo||u.email===body.assignedTo)&&u.active&&u.approved);if(!target)throw statusCodeError(400,'Select an active, approved officer.');if(target.role==='Bureau Officer'&&target.bureau!==c.bureau)throw statusCodeError(400,'The officer must belong to the case Bureau.');if(target.role==='Regional Officer'&&(!c.region||target.region!==c.region))throw statusCodeError(400,'The officer must be authorised for this case region.');c.assignedTo=target.id;c.assignedToName=target.name;if(c.assignedTo!==previous.assignedTo)data.notifications.unshift({id:id('ntf'),type:'New assignment',text:`${c.caseId} was assigned to you.`,caseIds:[c.caseId],targetUserId:target.id,createdAt:now(),read:false}) }
        if (body.region !== undefined && ['Super Admin','Admin / Competent Authority'].includes(user.role)) c.region=String(body.region)
        c.updatedAt=now(); audit(data,user,body.status==='Escalated'?'Case escalated':previous.status!==c.status?'Status changed':'Case updated',c,{ previous, next:{status:c.status,bureau:c.bureau,deadline:c.deadline,assignedTo:c.assignedTo,escalationTo:c.escalationTo}, remark:String(body.remark || body.reason || '') })
        if (body.status === 'Escalated') data.notifications.unshift({id:id('ntf'),type:'Escalation',text:`${c.caseId} was escalated to ${c.escalationTo}.`,caseIds:[c.caseId],createdAt:now(),read:false})
        saveStore(data); return reply(res,200,c) || true
      }
      if (req.method === 'GET') return reply(res,200,{...c,history:data.audit.filter(a=>a.caseId===c.caseId),relatedCases:data.cases.filter(x=>x.caseId!==c.caseId&&x.institution===c.institution&&canSee(user,x))}) || true
    }
    if (url.pathname === '/api/institutions' && req.method === 'GET') {
      const cases=data.cases.filter(c=>canSee(user,c)); const q=(url.searchParams.get('q')||'').toLowerCase();const state=url.searchParams.get('state')||'';const type=url.searchParams.get('type')||''
      return reply(res,200,data.institutions.filter(i=>(user.role==='Super Admin'||user.role==='Admin / Competent Authority'||cases.some(c=>c.institution===i.name))&&(!q||JSON.stringify(i).toLowerCase().includes(q))&&(!state||i.state===state)&&(!type||i.type===type)).map(i=>{const related=cases.filter(c=>c.institution===i.name);return {...i,cases:related,total:related.length,pending:related.filter(c=>c.status==='Pending').length,underProcess:related.filter(c=>c.status==='Under Process').length,disposed:related.filter(c=>c.status==='Disposed').length,transferred:related.filter(c=>c.status==='Transferred').length,escalated:related.filter(c=>c.status==='Escalated').length,overdue:related.filter(isOverdue).length}})) || true
    }
    if (pathParts[1] === 'institutions' && pathParts.length === 3 && req.method === 'GET') {
      const inst=data.institutions.find(i=>i.institutionId===decodeURIComponent(pathParts[2]) || i.name===decodeURIComponent(pathParts[2]))
      const related=inst&&data.cases.filter(c=>c.institution===inst.name&&canSee(user,c))
      if (!inst || (!related?.length&&!['Super Admin','Admin / Competent Authority'].includes(user.role))) throw statusCodeError(404,'Institution not found.')
      return reply(res,200,{...inst,cases:related}) || true
    }
    if (url.pathname === '/api/overlaps' && req.method === 'GET') {const q=(url.searchParams.get('q')||'').toLowerCase();return reply(res,200,data.overlaps.filter(o=>o.caseIds.every(cid=>{const c=data.cases.find(x=>x.caseId===cid);return c&&canSee(user,c)})).filter(o=>!q||JSON.stringify(o).toLowerCase().includes(q))) || true}
    if (url.pathname === '/api/export/overlaps.csv' && req.method === 'GET') {
      const q=(url.searchParams.get('q')||'').toLowerCase();const rows=data.overlaps.filter(o=>o.caseIds.every(cid=>{const c=data.cases.find(x=>x.caseId===cid);return c&&canSee(user,c)})).filter(o=>!q||JSON.stringify(o).toLowerCase().includes(q));const quote=v=>`"${String(v??'').replaceAll('"','""')}"`
      res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="aicte-overlaps.csv"','Cache-Control':'no-store'});res.end(['Institution,Case IDs,Bureaus,Status,Reason,Decision',...rows.map(o=>[o.institution,o.caseIds.join(' | '),o.bureaus.join(' | '),o.status,o.reason,o.decision?.remark||''].map(quote).join(','))].join('\r\n'));return true
    }
    if (url.pathname === '/api/export/institutions.csv' && req.method === 'GET') {
      const cases=data.cases.filter(c=>canSee(user,c));const q=(url.searchParams.get('q')||'').toLowerCase();const rows=data.institutions.filter(i=>(user.role==='Super Admin'||user.role==='Admin / Competent Authority'||cases.some(c=>c.institution===i.name))&&(!q||JSON.stringify(i).toLowerCase().includes(q)));const quote=v=>`"${String(v??'').replaceAll('"','""')}"`
      res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="aicte-institutions.csv"','Cache-Control':'no-store'});res.end(['Institution ID,AICTE Permanent ID,Name,State,Region,Accessible cases',...rows.map(i=>[i.institutionId,i.aicteId,i.name,i.state,i.region,cases.filter(c=>c.institution===i.name).length].map(quote).join(','))].join('\r\n'));return true
    }
    if (pathParts[1] === 'overlaps' && pathParts[3] === 'decision' && req.method === 'POST') {
      requireRole(user,['Super Admin','Admin / Competent Authority'])
      const o=data.overlaps.find(x=>x.id===decodeURIComponent(pathParts[2])); const decision=String(body.decision||'')
      if (!o || !['Confirmed','Dismissed','Escalated','Under review'].includes(decision)) throw statusCodeError(400,'Select a valid review decision.')
      const remark=String(body.remark||'').trim();if(remark.length<4)throw statusCodeError(400,'Add a brief reason for this coordination decision.')
      o.status=decision; o.decision={decision,remark,userId:user.id,userName:user.name,at:now()}
      audit(data,user,'Overlap decision',null,{overlapId:o.id,institution:o.institution,decision,remark:o.decision.remark}); saveStore(data)
      return reply(res,200,o) || true
    }
    if (url.pathname === '/api/activity' && req.method === 'GET') {
      const q=(url.searchParams.get('q')||'').toLowerCase(); const rows=data.audit.filter(a=>user.role==='Super Admin'||user.role==='Admin / Competent Authority'?true:(a.bureau===user.bureau||data.cases.some(c=>c.caseId===a.caseId&&canSee(user,c))))
      return reply(res,200,rows.filter(a=>(!q||JSON.stringify(a).toLowerCase().includes(q))&&(!url.searchParams.get('action')||a.action===url.searchParams.get('action'))&&(!url.searchParams.get('bureau')||a.bureau===url.searchParams.get('bureau'))&&(!url.searchParams.get('from')||a.at>=url.searchParams.get('from'))&&(!url.searchParams.get('to')||a.at.slice(0,10)<=url.searchParams.get('to')))) || true
    }
    if (url.pathname === '/api/notifications' && req.method === 'GET') return reply(res,200,data.notifications.filter(n=>(!n.targetUserId||n.targetUserId===user.id)&&(!n.caseIds?.length||n.caseIds.some(cid=>{const c=data.cases.find(x=>x.caseId===cid);return c&&canSee(user,c)}))).filter(n=>{const type=n.type.toLowerCase();const key=type.includes('overdue')?'Case becomes overdue':type.includes('deadline')?'Deadline approaching':type.includes('assign')?'New case assigned':type.includes('overlap')?'Potential overlap detected':type.includes('coordination')?'Coordination decision recorded':type.includes('status')?'Case status changed':null;return !key||(user.preferences?.[key]??(key!=='Case status changed'))}).map(({readBy,...n})=>({...n,read:(readBy||[]).includes(user.id)}))) || true
    if (url.pathname === '/api/notifications/read-all' && req.method === 'POST') { for(const n of data.notifications){n.readBy||=[];if(!n.readBy.includes(user.id))n.readBy.push(user.id)}saveStore(data);return reply(res,200,{ok:true}) || true }
    if (pathParts[1] === 'notifications' && pathParts[3] === 'read' && req.method === 'POST') {
      const n=data.notifications.find(x=>x.id===decodeURIComponent(pathParts[2])); if(!n)throw statusCodeError(404,'Notification not found.')
      n.readBy||=[];if(!n.readBy.includes(user.id))n.readBy.push(user.id);saveStore(data);return reply(res,200,{...n,read:true}) || true
    }
    if (url.pathname === '/api/dashboard' && req.method === 'GET') {
      const visible=matchesFilters(data.cases.filter(c=>canSee(user,c)),url,user); const counts={total:visible.length,pending:0,underProcess:0,disposed:0,transferred:0,escalated:0,overdue:0}
      for(const c of visible){if(c.status==='Pending')counts.pending++;if(c.status==='Under Process')counts.underProcess++;if(c.status==='Disposed')counts.disposed++;if(c.status==='Transferred')counts.transferred++;if(c.status==='Escalated')counts.escalated++;if(isOverdue(c))counts.overdue++}
      const upcoming=visible.filter(c=>c.deadline&&c.status!=='Disposed'&&deadlineTime(c)>=Date.now()&&deadlineTime(c)<=Date.now()+7*86400000).sort((a,b)=>deadlineTime(a)-deadlineTime(b)).slice(0,10)
      const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(5-i));const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return {month:d.toLocaleString('en',{month:'short'}),received:0,disposed:0,key}})
      for(const c of visible){const d=new Date(c.received||c.createdAt);const m=months.find(x=>x.key===`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);if(m){m.received++;if(c.status==='Disposed')m.disposed++}}
      const reviewOverlaps=data.overlaps.filter(o=>o.status==='Review required'&&o.caseIds.every(cid=>visible.some(c=>c.caseId===cid)))
      return reply(res,200,{counts,bureauWorkload:BUREAUS.map(bureau=>({bureau,count:visible.filter(c=>c.bureau===bureau&&c.status!=='Disposed').length})),upcoming,monthly:months.map(({key,...m})=>m),overlaps:reviewOverlaps.length,overlapExample:reviewOverlaps[0]||null}) || true
    }
    if (url.pathname === '/api/reports' && req.method === 'GET') {
      const visible=matchesFilters(data.cases.filter(c=>canSee(user,c)),url,user)
      const monthly=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(5-i));const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return {month:d.toLocaleString('en',{month:'short'}),received:0,disposed:0,key}});for(const c of visible){const d=new Date(c.received||c.createdAt);const m=monthly.find(x=>x.key===`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);if(m){m.received++;if(c.status==='Disposed')m.disposed++}}
      return reply(res,200,{total:visible.length,byStatus:Object.fromEntries(['Pending','Under Process','Disposed','Transferred','Escalated'].map(s=>[s,visible.filter(c=>c.status===s).length])),byBureau:BUREAUS.map(bureau=>({bureau,total:visible.filter(c=>c.bureau===bureau).length,disposed:visible.filter(c=>c.bureau===bureau&&c.status==='Disposed').length})),overdue:visible.filter(isOverdue).length,overlaps:data.overlaps.filter(o=>o.caseIds.every(cid=>visible.some(c=>c.caseId===cid))).length,monthly:monthly.map(({key,...m})=>m)}) || true
    }
    if (url.pathname === '/api/export/cases.csv' && req.method === 'GET') {
      const rows=matchesFilters(data.cases.filter(c=>canSee(user,c)),url,user);const quote=v=>`"${String(v??'').replaceAll('"','""')}"`
      res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="aicte-cases.csv"','Cache-Control':'no-store'});res.end(['Case ID,Institution,Bureau,Status,Priority,Subject,Received,Deadline',...rows.map(c=>[c.caseId,c.institution,c.bureau,c.status,c.priority,c.subject,c.received,c.deadline].map(quote).join(','))].join('\r\n'));return true
    }
    if (url.pathname === '/api/export/activity.csv' && req.method === 'GET') {
      const rows=data.audit.filter(a=>user.role==='Super Admin'||user.role==='Admin / Competent Authority'?true:(a.bureau===user.bureau||data.cases.some(c=>c.caseId===a.caseId&&canSee(user,c))))
      const q=(url.searchParams.get('q')||'').toLowerCase();const selected=rows.filter(a=>(!q||JSON.stringify(a).toLowerCase().includes(q))&&(!url.searchParams.get('action')||a.action===url.searchParams.get('action'))&&(!url.searchParams.get('bureau')||a.bureau===url.searchParams.get('bureau'))&&(!url.searchParams.get('from')||a.at>=url.searchParams.get('from'))&&(!url.searchParams.get('to')||a.at.slice(0,10)<=url.searchParams.get('to')));const quote=v=>`"${String(v??'').replaceAll('"','""')}"`
      res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="aicte-audit.csv"','Cache-Control':'no-store'});res.end(['Timestamp,User,Bureau,Action,Case ID,Institution,Details',...selected.map(a=>[a.at,a.userName,a.bureau,a.action,a.caseId,a.institution,JSON.stringify(a.detail)].map(quote).join(','))].join('\r\n'));return true
    }
    if (url.pathname === '/api/users' && req.method === 'GET') { requireRole(user,['Super Admin']); return reply(res,200,data.users.map(publicUser)) || true }
    if(url.pathname==='/api/assignable-users'&&req.method==='GET'){
      requireRole(user,['Super Admin','Admin / Competent Authority']);const bureau=url.searchParams.get('bureau')||'';const region=url.searchParams.get('region')||''
      return reply(res,200,data.users.filter(u=>u.active&&u.approved&&(['Super Admin','Admin / Competent Authority'].includes(u.role)||(u.role==='Bureau Officer'&&u.bureau===bureau)||(u.role==='Regional Officer'&&!!region&&u.region===region))).map(({id,name,email,role,bureau,region})=>({id,name,email,role,bureau,region})))||true
    }
    if (pathParts[1] === 'users' && pathParts[3] === 'approval' && req.method === 'PATCH') {
      requireRole(user,['Super Admin']); const target=data.users.find(u=>u.id===decodeURIComponent(pathParts[2])); if(!target)throw statusCodeError(404,'User not found.')
      if (body.role && !ROLES.includes(body.role)) throw statusCodeError(400,'Invalid role.')
      if(target.id===user.id&&body.role&&body.role!==user.role)throw statusCodeError(403,'You cannot change your own role.')
      if(target.id===user.id&&(body.bureau!==undefined||body.region!==undefined||body.active===false))throw statusCodeError(403,'You cannot change your own access scope or deactivate your own account.')
      if(target.role==='Super Admin'&&(body.role&&body.role!=='Super Admin'||body.active===false||body.approved===false)&&!data.users.some(u=>u.id!==target.id&&u.role==='Super Admin'&&u.active&&u.approved))throw statusCodeError(409,'At least one active Super Admin must remain.')
      if(typeof body.approved==='boolean')target.approved=body.approved
      if(typeof body.active==='boolean')target.active=body.active
      if(body.approved===true)target.active=true
      if(body.role)target.role=body.role;if(body.bureau!==undefined)target.bureau=BUREAUS.includes(body.bureau)?body.bureau:'';if(body.region!==undefined)target.region=String(body.region);audit(data,user,'User access changed',null,{target:target.email,approved:target.approved,active:target.active,role:target.role});saveStore(data);return reply(res,200,publicUser(target)) || true
    }
    throw statusCodeError(404, 'API route not found.')
  } catch (error) {
    return reply(res,error.status||500,{error:error.status?error.message:'The request could not be completed.'}) || true
  }
}
function isOverdue(c) { return c.status!=='Disposed' && deadlineTime(c) < Date.now() }

export function localApiPlugin() {
  return { name:'aictE-local-api', configureServer(server) { server.middlewares.use(async (req,res,next)=>{if(!req.url?.startsWith('/api/'))return next();await handleApi(req,res)}) } }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { createServer } = await import('node:http')
  const port=Number(process.env.API_PORT||8787)
  const build=path.join(ROOT,'dist');const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'}
  createServer(async(req,res)=>{if(await handleApi(req,res))return;if(!['GET','HEAD'].includes(req.method||'')){res.writeHead(405);res.end('Method not allowed');return}let requested;try{requested=decodeURIComponent(new URL(req.url||'/',`http://${req.headers.host||'localhost'}`).pathname)}catch{res.writeHead(400);res.end('Bad request');return}let file=path.resolve(build,`.${requested}`);if(!file.startsWith(`${build}${path.sep}`))file=path.join(build,'index.html');try{if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(build,'index.html');const stat=fs.statSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res)}catch{res.writeHead(503);res.end('Build the frontend first with pnpm build.')}}).listen(port,'127.0.0.1',()=>console.log(`Local website and API listening at http://127.0.0.1:${port}`))
}
