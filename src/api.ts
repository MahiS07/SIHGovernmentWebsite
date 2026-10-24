export type User = { id:string; name:string; email:string; role:string; bureau:string; region:string; designation?:string; officeLocation?:string; active:boolean; approved:boolean }
export type CaseRecord = { caseId:string; institution:string; bureau:string; received:string; status:string; last:string; deadline:string; priority:string; subject:string; description:string; region:string; category:string; assignedTo:string; assignedToName?:string; actions?:Array<{id:string;at:string;userName:string;type:string;remark:string}> }
export type InstitutionRecord = { institutionId:string; aicteId:string; name:string; address:string; state:string; region:string; type:string; cases:CaseRecord[]; total:number; pending:number; underProcess:number; disposed:number; transferred:number; escalated:number; overdue:number }

export async function api<T>(path:string, init:RequestInit = {}):Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type','application/json')
  const response = await fetch(path.startsWith('/api/') ? path : `/api/${path}`, { ...init, headers, credentials:'same-origin' })
  const type = response.headers.get('content-type') || ''
  const result = type.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) throw new Error(typeof result === 'object' ? result.error || 'Request failed.' : 'Request failed.')
  return result as T
}
