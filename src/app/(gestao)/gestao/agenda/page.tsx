'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Barbeiro { id: string; nome: string; foto_url: string | null; ativo: boolean }
interface Servico { id: string; nome: string; duracao_min: number; preco: number; categoria: string; reofertavel: boolean; dias_urgencia: number | null }
interface Cliente { id: string; nome: string; email: string | null; telefone: string | null }
interface Agendamento {
  id: string; barbearia_id: string; cliente_id: string | null; barbeiro_id: string | null
  servico_id: string | null; servicos_ids: string[]; data_hora: string; duracao_min: number
  valor_total: number; valor_final: number | null; tem_desconto: boolean
  status: 'pendente'|'confirmado'|'em_atendimento'|'concluido'|'cancelado'|'faltou'
  observacoes: string | null; cliente?: Cliente; barbeiro?: Barbeiro; servico?: Servico
}
interface HistoricoExtra { servico_id: string; nome: string; ultima_data: string; dias_desde: number; dias_urgencia: number | null }
interface AlteracaoHistorico { id: string; campo_alterado: string; valor_anterior: string | null; valor_novo: string | null; motivo: string; alterado_em: string }
interface Desconto { id: string; tipo: 'servico'|'total'; modalidade: 'reais'|'percentual'; servico_id: string | null; valor: number; observacao: string | null }
type ViewMode = 'hoje'|'dois_dias'|'semana_barbeiro'|'custom'
type ModalAba = 'detalhes'|'editar'|'descontos'|'historico'

const STATUS_CONFIG = {
  pendente:       { label:'Pendente',       color:'var(--gold)',   bg:'var(--gold-soft)',   border:'color-mix(in srgb, var(--gold) 35%, transparent)' },
  confirmado:     { label:'Confirmado',     color:'var(--info)',   bg:'var(--info-bg)',     border:'color-mix(in srgb, var(--info) 35%, transparent)' },
  em_atendimento: { label:'Em atendimento', color:'var(--combo)',  bg:'var(--combo-bg)',    border:'color-mix(in srgb, var(--combo) 35%, transparent)' },
  concluido:      { label:'Concluído',      color:'var(--ok)',     bg:'var(--ok-bg)',       border:'color-mix(in srgb, var(--ok) 35%, transparent)' },
  cancelado:      { label:'Cancelado',      color:'var(--faint)',  bg:'var(--surface-2)',   border:'var(--border)' },
  faltou:         { label:'Faltou',         color:'var(--danger)', bg:'var(--danger-bg)',   border:'color-mix(in srgb, var(--danger) 35%, transparent)' },
}
const ZOOM_OPTIONS = [
  { label:'50%',  slotH:60,  interval:30 },
  { label:'100%', slotH:120, interval:10 },
  { label:'150%', slotH:180, interval:10 },
  { label:'200%', slotH:240, interval:5  },
]
const HOURS = Array.from({length:14},(_,i)=>i+7)
const COL_W = 170
const HOUR_COL = 52
const BARB_H = 48
const DAY_H = 32

function fmtDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function fmtHour(h: number) { return `${String(h).padStart(2,'0')}:00` }
function fmtSlot(h: number, m: number) { return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` }
function addDays(d: Date, n: number) { const r=new Date(d); r.setDate(r.getDate()+n); return r }
function topOffset(dh: string, slotH: number) { const d=new Date(dh); return (d.getHours()+d.getMinutes()/60-7)*slotH }
function heightPx(min: number, slotH: number) { return Math.max((min/60)*slotH,22) }
function urgCor(dias: number, urg: number|null) {
  if(!urg) return 'var(--faint)'
  if(dias>=urg*1.5) return 'var(--danger)'
  if(dias>=urg) return 'var(--gold)'
  return 'var(--ok)'
}
function agInicio(ag: Agendamento) { return new Date(ag.data_hora).getTime() }
function agFim(ag: Agendamento) { return agInicio(ag) + ag.duracao_min*60000 }
function sobrepoe(a: Agendamento, b: Agendamento) { return agInicio(a)<agFim(b) && agFim(a)>agInicio(b) }

// Calcula grupos de sobreposição — retorna mapa agId -> {col, total}
function calcLayout(ags: Agendamento[]): Record<string,{col:number;total:number}> {
  const sorted=[...ags].sort((a,b)=>agInicio(a)-agInicio(b))
  const result:Record<string,{col:number;total:number}>={}
  // grupos de cards que se sobrepõem
  const grupos: Agendamento[][]= []
  for(const ag of sorted){
    let placed=false
    for(const g of grupos){
      if(g.some(x=>sobrepoe(x,ag))){ g.push(ag); placed=true; break }
    }
    if(!placed) grupos.push([ag])
  }
  for(const g of grupos){
    if(g.length===1){ result[g[0].id]={col:0,total:1}; continue }
    // atribui colunas dentro do grupo
    const cols: Agendamento[][]=[]
    for(const ag of g){
      let placed=false
      for(let ci=0;ci<cols.length;ci++){
        if(!cols[ci].some(x=>sobrepoe(x,ag))){ cols[ci].push(ag); result[ag.id]={col:ci,total:0}; placed=true; break }
      }
      if(!placed){ cols.push([ag]); result[ag.id]={col:cols.length-1,total:0} }
    }
    const total=cols.length
    for(const ag of g) result[ag.id].total=total
  }
  return result
}

function Modal({onClose,children,wide}:{onClose:()=>void;children:React.ReactNode;wide?:boolean}) {
  return (
    <div style={{position:'fixed',inset:0,background:'var(--overlay)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,width:'100%',maxWidth:wide?680:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'var(--shadow-md)'}}>
        {children}
      </div>
    </div>
  )
}

function Toast({msg,type,actions}:{msg:string;type:'confirm'|'warn';actions:{label:string;onClick:()=>void;primary?:boolean}[]}) {
  return (
    <div style={{position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',zIndex:2000,background:type==='warn'?'var(--danger)':'var(--tooltip-bg)',color:'#fff',borderRadius:6,padding:'14px 22px',boxShadow:'var(--shadow-md)',display:'flex',alignItems:'center',gap:14,fontSize:13,maxWidth:540}}>
      {type==='warn'&&<span style={{fontSize:16}}>⚠️</span>}
      <span style={{flex:1}}>{msg}</span>
      <div style={{display:'flex',gap:8}}>
        {actions.map((a,i)=>(
          <button key={i} onClick={a.onClick} style={{padding:'6px 14px',background:a.primary?'var(--gold)':'transparent',color:a.primary?'var(--on-gold)':'var(--faint)',border:a.primary?'none':'1px solid var(--border-strong)',borderRadius:3,fontSize:11,fontWeight:700,cursor:'pointer'}}>{a.label}</button>
        ))}
      </div>
    </div>
  )
}

export default function AgendaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [anchor, setAnchor] = useState(new Date())
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [extrasMap, setExtrasMap] = useState<Record<string,HistoricoExtra[]>>({})
  const [zoomIdx, setZoomIdx] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('hoje')
  const [barbSemanaSel, setBarbSemanaSel] = useState('')
  const [customDias, setCustomDias] = useState(3)
  const [customBarbs, setCustomBarbs] = useState<string[]>([])
  const [showCustomPanel, setShowCustomPanel] = useState(false)

  const [dragging, setDragging] = useState<Agendamento|null>(null)
  const [dropTarget, setDropTarget] = useState<{date:string;hora:string;barbeiroId:string}|null>(null)
  const [pendingDrop, setPendingDrop] = useState<{ag:Agendamento;date:string;hora:string;barbeiroId:string;overlap:Agendamento|null}|null>(null)

  const [modalNovo, setModalNovo] = useState<{date:string;hora:string;barbeiroId:string}|null>(null)
  const [modalDetalhe, setModalDetalhe] = useState<Agendamento|null>(null)
  const [modalAba, setModalAba] = useState<ModalAba>('detalhes')
  const [historicoExtras, setHistoricoExtras] = useState<HistoricoExtra[]>([])
  const [alteracoes, setAlteracoes] = useState<AlteracaoHistorico[]>([])
  const [descontos, setDescontos] = useState<Desconto[]>([])
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({cliente_id:'',barbeiro_id:'',servicos_selecionados:[] as string[],data:'',hora:'',observacoes:''})
  const [editForm, setEditForm] = useState({barbeiro_id:'',servicos_selecionados:[] as string[],data:'',hora:'',motivo:''})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [descForm, setDescForm] = useState({tipo:'total' as 'servico'|'total',modalidade:'percentual' as 'reais'|'percentual',servico_id:'',valor:0,observacao:''})
  const [salvandoDesc, setSalvandoDesc] = useState(false)

  const zoom = ZOOM_OPTIONS[zoomIdx]
  const {slotH,interval} = zoom
  const slotsPerHour = 60/interval
  const hoje = fmtDate(new Date())
  const multiDays = viewMode!=='hoje'

  useEffect(()=>{
    async function init() {
      const [{data:barbs},{data:servs},{data:clis}] = await Promise.all([
        supabase.from('barbeiros').select('id,nome,foto_url,ativo').eq('ativo',true),
        supabase.from('servicos').select('id,nome,duracao_min,preco,categoria,reofertavel,dias_urgencia').eq('ativo',true),
        supabase.from('clientes').select('id,nome,email,telefone').order('nome'),
      ])
      setBarbeiros(barbs||[])
      setServicos(servs||[])
      setClientes(clis||[])
      if(barbs&&barbs.length>0) setBarbSemanaSel(barbs[0].id)
    }
    init()
    const z=localStorage.getItem('agenda_zoom'); if(z) setZoomIdx(Number(z))
  },[])

  useEffect(()=>{ localStorage.setItem('agenda_zoom',String(zoomIdx)) },[zoomIdx])

  function getColunas() {
    if(barbeiros.length===0) return []
    const cols:{barbeiroId:string;barb:Barbeiro;date:string;dateObj:Date}[]=[]
    if(viewMode==='hoje') {
      barbeiros.forEach(b=>cols.push({barbeiroId:b.id,barb:b,date:fmtDate(anchor),dateObj:new Date(anchor)}))
    } else if(viewMode==='dois_dias') {
      barbeiros.forEach(b=>[new Date(anchor),addDays(anchor,1)].forEach(d=>cols.push({barbeiroId:b.id,barb:b,date:fmtDate(d),dateObj:new Date(d)})))
    } else if(viewMode==='semana_barbeiro') {
      const barb=barbeiros.find(b=>b.id===barbSemanaSel)||barbeiros[0]
      if(barb) Array.from({length:7},(_,i)=>addDays(anchor,i)).forEach(d=>cols.push({barbeiroId:barb.id,barb,date:fmtDate(d),dateObj:new Date(d)}))
    } else {
      const barbsSel=customBarbs.length>0?barbeiros.filter(b=>customBarbs.includes(b.id)):barbeiros
      barbsSel.forEach(b=>Array.from({length:customDias},(_,i)=>addDays(anchor,i)).forEach(d=>cols.push({barbeiroId:b.id,barb:b,date:fmtDate(d),dateObj:new Date(d)})))
    }
    return cols
  }
  const colunas = getColunas()
  const grupos:{barb:Barbeiro;cols:typeof colunas}[]=[]
  colunas.forEach(col=>{
    const g=grupos.find(g=>g.barb.id===col.barbeiroId)
    if(g) g.cols.push(col)
    else grupos.push({barb:col.barb,cols:[col]})
  })
  const totalW = HOUR_COL + colunas.length * COL_W
  const headerH = BARB_H + (multiDays ? DAY_H : 0)

  useEffect(()=>{
    if(barbeiros.length===0||colunas.length===0) return
    const datas=[...new Set(colunas.map(c=>c.date))]
    const d0=new Date(datas[0]+'T00:00:00'); d0.setDate(d0.getDate()-1)
    const d1=new Date(datas[datas.length-1]+'T23:59:59'); d1.setDate(d1.getDate()+1)
    supabase.from('agendamentos').select('*,cliente:clientes(*),barbeiro:barbeiros(*),servico:servicos(*)')
      .gte('data_hora',d0.toISOString()).lte('data_hora',d1.toISOString()).order('data_hora')
      .then(({data})=>{ setAgendamentos(data||[]); carregarExtrasDia(data||[]) })
  },[anchor,viewMode,barbSemanaSel,customDias,customBarbs,barbeiros])

  async function carregarExtrasDia(ags: Agendamento[]) {
    const clienteIds=[...new Set(ags.map(a=>a.cliente_id).filter(Boolean))] as string[]
    if(clienteIds.length===0) return
    const {data:extras}=await supabase.from('servicos').select('id,nome,dias_urgencia').eq('reofertavel',true)
    if(!extras||extras.length===0) return
    const {data:hist}=await supabase.from('agendamentos').select('cliente_id,servicos_ids,servico_id,data_hora').in('cliente_id',clienteIds).eq('status','concluido').order('data_hora',{ascending:false})
    if(!hist) return
    const hoje2=new Date()
    const mapa:Record<string,HistoricoExtra[]>={}
    for(const cid of clienteIds){
      const agsCli=hist.filter(h=>h.cliente_id===cid); const map:Record<string,any>={}
      for(const ag of agsCli){
        const ids:string[]=ag.servicos_ids?.length>0?ag.servicos_ids:ag.servico_id?[ag.servico_id]:[]
        for(const sid of ids){
          const ex=extras.find(s=>s.id===sid); if(!ex||map[sid]) continue
          const dias=Math.floor((hoje2.getTime()-new Date(ag.data_hora).getTime())/86400000)
          map[sid]={servico_id:sid,nome:ex.nome,ultima_data:ag.data_hora,dias_desde:dias,dias_urgencia:ex.dias_urgencia}
        }
      }
      mapa[cid]=Object.values(map).sort((a:any,b:any)=>(b.dias_urgencia?b.dias_desde/b.dias_urgencia:0)-(a.dias_urgencia?a.dias_desde/a.dias_urgencia:0))
    }
    setExtrasMap(mapa)
  }

  function recarregar() {
    if(colunas.length===0) return
    const datas=[...new Set(colunas.map(c=>c.date))]
    const d0=new Date(datas[0]+'T00:00:00'); d0.setDate(d0.getDate()-1)
    const d1=new Date(datas[datas.length-1]+'T23:59:59'); d1.setDate(d1.getDate()+1)
    supabase.from('agendamentos').select('*,cliente:clientes(*),barbeiro:barbeiros(*),servico:servicos(*)')
      .gte('data_hora',d0.toISOString()).lte('data_hora',d1.toISOString()).order('data_hora')
      .then(({data})=>{ setAgendamentos(data||[]); carregarExtrasDia(data||[]) })
  }

  // ─── DRAG & DROP ──────────────────────────────────────────────────────────
  function onDragStart(ag:Agendamento){ setDragging(ag) }

  function onDragOverSlot(e:React.DragEvent,date:string,hora:string,barbeiroId:string){
    e.preventDefault(); e.stopPropagation()
    setDropTarget({date,hora,barbeiroId})
  }

  function onDropSlot(e:React.DragEvent,date:string,hora:string,barbeiroId:string){
    e.preventDefault(); e.stopPropagation()
    if(!dragging) return
    const d=new Date(dragging.data_hora)
    const same=fmtDate(d)===date&&fmtSlot(d.getHours(),d.getMinutes())===hora&&dragging.barbeiro_id===barbeiroId
    if(same){setDragging(null);setDropTarget(null);return}
    const novaInicio=new Date(`${date}T${hora}:00`)
    const novaFim=new Date(novaInicio.getTime()+dragging.duracao_min*60000)
    const overlap=agendamentos.find(a=>{
      if(a.id===dragging.id||a.barbeiro_id!==barbeiroId||fmtDate(new Date(a.data_hora))!==date) return false
      const ai=new Date(a.data_hora); const af=new Date(ai.getTime()+a.duracao_min*60000)
      return novaInicio<af&&novaFim>ai
    })||null
    setPendingDrop({ag:dragging,date,hora,barbeiroId,overlap})
    setDragging(null); setDropTarget(null)
  }

  // Drop sobre um card existente — usa posição Y do mouse relativa à coluna
  function onDropCard(e:React.DragEvent, targetAg:Agendamento){
    e.preventDefault(); e.stopPropagation()
    if(!dragging||dragging.id===targetAg.id) return
    // pega o elemento pai (coluna) do card
    const colEl = (e.currentTarget as HTMLElement).parentElement?.parentElement
    const date=fmtDate(new Date(targetAg.data_hora))
    const barbeiroId=targetAg.barbeiro_id||''
    let hora = fmtSlot(new Date(targetAg.data_hora).getHours(), new Date(targetAg.data_hora).getMinutes())
    if(colEl) {
      const rect=colEl.getBoundingClientRect()
      const relY=e.clientY-rect.top
      const totalMin=Math.max(0,Math.floor((relY/slotH)*60))
      const snapped=Math.floor(totalMin/interval)*interval
      const h=7+Math.floor(snapped/60); const m=snapped%60
      hora=fmtSlot(Math.min(h,20),m)
    }
    setPendingDrop({ag:dragging,date,hora,barbeiroId,overlap:targetAg})
    setDragging(null); setDropTarget(null)
  }

  async function confirmarDrop(force=false){
    if(!pendingDrop) return
    if(pendingDrop.overlap&&!force) return
    const {ag,date,hora,barbeiroId}=pendingDrop
    await supabase.from('agendamentos').update({data_hora:`${date}T${hora}:00-03:00`,barbeiro_id:barbeiroId||null}).eq('id',ag.id)
    setPendingDrop(null); recarregar()
  }

  async function carregarHistorico(clienteId:string){ setHistoricoExtras(extrasMap[clienteId]||[]) }
  async function carregarAlteracoes(agId:string){
    const {data}=await supabase.from('agendamento_historico').select('*').eq('agendamento_id',agId).order('alterado_em',{ascending:false})
    setAlteracoes(data||[])
  }
  async function carregarDescontos(agId:string){
    const {data}=await supabase.from('agendamento_descontos').select('*').eq('agendamento_id',agId).order('criado_em',{ascending:false})
    setDescontos(data||[])
  }

  function abrirDetalhe(ag:Agendamento){
    setModalDetalhe(ag); setModalAba('detalhes')
    if(ag.cliente_id) carregarHistorico(ag.cliente_id)
    carregarAlteracoes(ag.id); carregarDescontos(ag.id)
    const d=new Date(ag.data_hora)
    setEditForm({barbeiro_id:ag.barbeiro_id||'',servicos_selecionados:ag.servicos_ids?.length>0?ag.servicos_ids:ag.servico_id?[ag.servico_id]:[],data:fmtDate(d),hora:fmtSlot(d.getHours(),d.getMinutes()),motivo:''})
    setDescForm({tipo:'total',modalidade:'percentual',servico_id:'',valor:0,observacao:''})
  }

  async function salvarEdicao(){
    if(!modalDetalhe||!editForm.motivo.trim()) return
    setSalvandoEdicao(true)
    const ag=modalDetalhe; const d=new Date(ag.data_hora)
    const oldData=fmtDate(d); const oldHora=fmtSlot(d.getHours(),d.getMinutes())
    const oldBarbeiro=ag.barbeiro_id; const oldServicos=ag.servicos_ids?.length>0?ag.servicos_ids:ag.servico_id?[ag.servico_id]:[]
    const historicos:any[]=[]
    if(editForm.data!==oldData||editForm.hora!==oldHora)
      historicos.push({agendamento_id:ag.id,campo_alterado:'data_hora',valor_anterior:`${oldData} ${oldHora}`,valor_novo:`${editForm.data} ${editForm.hora}`,motivo:editForm.motivo})
    if(editForm.barbeiro_id!==oldBarbeiro)
      historicos.push({agendamento_id:ag.id,campo_alterado:'barbeiro',valor_anterior:barbeiros.find(b=>b.id===oldBarbeiro)?.nome||'—',valor_novo:barbeiros.find(b=>b.id===editForm.barbeiro_id)?.nome||'—',motivo:editForm.motivo})
    if([...editForm.servicos_selecionados].sort().join(',')!==[...oldServicos].sort().join(','))
      historicos.push({agendamento_id:ag.id,campo_alterado:'servicos',valor_anterior:servicos.filter(s=>oldServicos.includes(s.id)).map(s=>s.nome).join(', ')||'—',valor_novo:servicos.filter(s=>editForm.servicos_selecionados.includes(s.id)).map(s=>s.nome).join(', ')||'—',motivo:editForm.motivo})
    if(historicos.length===0){setSalvandoEdicao(false);return}
    const novosDuracoes=servicos.filter(s=>editForm.servicos_selecionados.includes(s.id))
    await supabase.from('agendamentos').update({data_hora:`${editForm.data}T${editForm.hora}:00-03:00`,barbeiro_id:editForm.barbeiro_id||null,servico_id:editForm.servicos_selecionados[0]||null,servicos_ids:editForm.servicos_selecionados,duracao_min:novosDuracoes.reduce((a,s)=>a+s.duracao_min,0)||ag.duracao_min,valor_total:novosDuracoes.reduce((a,s)=>a+(s.preco||0),0)||ag.valor_total}).eq('id',ag.id)
    if(historicos.length>0) await supabase.from('agendamento_historico').insert(historicos)
    setSalvandoEdicao(false); setEditForm(p=>({...p,motivo:''})); setModalAba('historico')
    carregarAlteracoes(ag.id); recarregar()
    const {data:agAt}=await supabase.from('agendamentos').select('*,cliente:clientes(*),barbeiro:barbeiros(*),servico:servicos(*)').eq('id',ag.id).single()
    if(agAt) setModalDetalhe(agAt)
  }

  function calcValorFinal(ag:Agendamento, todos:Desconto[]){
    let vf=ag.valor_total
    for(const d of todos){
      if(d.tipo==='total') vf-=d.modalidade==='percentual'?ag.valor_total*(d.valor/100):d.valor
      else if(d.tipo==='servico'&&d.servico_id){ const srv=servicos.find(s=>s.id===d.servico_id); if(srv) vf-=d.modalidade==='percentual'?srv.preco*(d.valor/100):d.valor }
    }
    return Math.max(0,vf)
  }

  async function salvarDesconto(){
    if(!modalDetalhe||descForm.valor<=0) return
    setSalvandoDesc(true)
    const ag=modalDetalhe
    await supabase.from('agendamento_descontos').insert({agendamento_id:ag.id,tipo:descForm.tipo,modalidade:descForm.modalidade,servico_id:descForm.tipo==='servico'&&descForm.servico_id?descForm.servico_id:null,valor:descForm.valor,observacao:descForm.observacao||null})
    const todos=[...descontos,{tipo:descForm.tipo,modalidade:descForm.modalidade,servico_id:descForm.servico_id||null,valor:descForm.valor} as Desconto]
    const vf=calcValorFinal(ag,todos)
    await supabase.from('agendamentos').update({valor_final:vf,tem_desconto:true}).eq('id',ag.id)
    await supabase.from('agendamento_historico').insert({agendamento_id:ag.id,campo_alterado:'desconto',valor_anterior:null,valor_novo:`${descForm.modalidade==='percentual'?descForm.valor+'%':'R$'+descForm.valor} ${descForm.tipo==='total'?'no total':'no serviço'}`,motivo:`Desconto aplicado${descForm.observacao?': '+descForm.observacao:''}`})
    setSalvandoDesc(false); setDescForm({tipo:'total',modalidade:'percentual',servico_id:'',valor:0,observacao:''})
    carregarDescontos(ag.id); carregarAlteracoes(ag.id)
    const {data:agAt}=await supabase.from('agendamentos').select('*,cliente:clientes(*),barbeiro:barbeiros(*),servico:servicos(*)').eq('id',ag.id).single()
    if(agAt) setModalDetalhe(agAt); recarregar()
  }

  async function removerDesconto(id:string, desconto:Desconto){
    if(!modalDetalhe) return
    await supabase.from('agendamento_descontos').delete().eq('id',id)
    await supabase.from('agendamento_historico').insert({agendamento_id:modalDetalhe.id,campo_alterado:'desconto_removido',valor_anterior:`${desconto.modalidade==='percentual'?desconto.valor+'%':'R$'+desconto.valor} ${desconto.tipo==='total'?'no total':'no serviço'}`,valor_novo:null,motivo:'Desconto removido manualmente'})
    const restantes=descontos.filter(d=>d.id!==id)
    const semDesconto=restantes.length===0
    await supabase.from('agendamentos').update({valor_final:semDesconto?null:calcValorFinal(modalDetalhe,restantes),tem_desconto:!semDesconto}).eq('id',modalDetalhe.id)
    carregarDescontos(modalDetalhe.id); carregarAlteracoes(modalDetalhe.id)
    const {data:agAt}=await supabase.from('agendamentos').select('*,cliente:clientes(*),barbeiro:barbeiros(*),servico:servicos(*)').eq('id',modalDetalhe.id).single()
    if(agAt) setModalDetalhe(agAt); recarregar()
  }

  async function mudarStatus(id:string,status:Agendamento['status']){
    await supabase.from('agendamentos').update({status}).eq('id',id)
    setModalDetalhe(prev=>prev?{...prev,status}:null); recarregar()
  }

  function abrirNovo(date:string,hora:string,barbeiroId:string){
    setForm({cliente_id:'',barbeiro_id:barbeiroId,servicos_selecionados:[],data:date,hora,observacoes:''})
    setModalNovo({date,hora,barbeiroId})
  }
  const servicosSel=servicos.filter(s=>form.servicos_selecionados.includes(s.id))
  const duracaoTotal=servicosSel.reduce((a,s)=>a+s.duracao_min,0)
  const valorTotal=servicosSel.reduce((a,s)=>a+(s.preco||0),0)
  function toggleServico(id:string){setForm(p=>({...p,servicos_selecionados:p.servicos_selecionados.includes(id)?p.servicos_selecionados.filter(s=>s!==id):[...p.servicos_selecionados,id]}))}
  function toggleEditServico(id:string){setEditForm(p=>({...p,servicos_selecionados:p.servicos_selecionados.includes(id)?p.servicos_selecionados.filter(s=>s!==id):[...p.servicos_selecionados,id]}))}

  async function salvarNovo(){
    if(!form.cliente_id||!form.data||!form.hora) return
    setSalvando(true)
    const {data:barb}=await supabase.from('barbearias').select('id').single()
    await supabase.from('agendamentos').insert({barbearia_id:barb?.id,cliente_id:form.cliente_id||null,barbeiro_id:form.barbeiro_id||null,servico_id:form.servicos_selecionados[0]||null,servicos_ids:form.servicos_selecionados,data_hora:`${form.data}T${form.hora}:00-03:00`,duracao_min:duracaoTotal||30,valor_total:valorTotal,observacoes:form.observacoes||null,status:'pendente'})
    setSalvando(false); setModalNovo(null); recarregar()
  }

  const inputS:React.CSSProperties={width:'100%',padding:'8px 12px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:3,color:'var(--text)',fontSize:13,outline:'none',boxSizing:'border-box'}
  const labelS:React.CSSProperties={fontVariantNumeric:'tabular-nums',fontSize:9,letterSpacing:'0.15em',color:'var(--faint)',textTransform:'uppercase',display:'block',marginBottom:4}

  const descTotal=descontos.reduce((acc,d)=>{
    if(d.tipo==='total') return acc+(d.modalidade==='percentual'?(modalDetalhe?.valor_total||0)*(d.valor/100):d.valor)
    if(d.tipo==='servico'&&d.servico_id){const srv=servicos.find(s=>s.id===d.servico_id);if(srv) return acc+(d.modalidade==='percentual'?srv.preco*(d.valor/100):d.valor)}
    return acc
  },0)

  // ─── RENDER COLUNA ────────────────────────────────────────────────────────
  function renderColuna(col:typeof colunas[0]) {
    const ags=agendamentos.filter(a=>fmtDate(new Date(a.data_hora))===col.date&&a.barbeiro_id===col.barbeiroId)
    const isHoje=col.date===hoje
    const isDrop=dropTarget?.date===col.date&&dropTarget?.barbeiroId===col.barbeiroId
    const layout=calcLayout(ags)
    return (
      <div key={`${col.barbeiroId}-${col.date}`}
        style={{width:COL_W,flexShrink:0,borderLeft:'1px solid var(--border)',position:'relative',background:isHoje?'color-mix(in srgb, var(--gold) 3%, transparent)':isDrop?'color-mix(in srgb, var(--gold) 6%, transparent)':'transparent'}}
      >
        {/* SLOTS CLICÁVEIS */}
        {HOURS.map(h=>(
          <div key={h} style={{height:slotH,borderBottom:'1px solid var(--border)',position:'relative'}}>
            {Array.from({length:slotsPerHour},(_,si)=>{
              const mo=si*interval; const st=(mo/60)*slotH; const sh=(interval/60)*slotH; const hora=fmtSlot(h,mo)
              const isDropSlot=isDrop&&dropTarget?.hora===hora
              return (
                <div key={si}
                  onClick={()=>abrirNovo(col.date,hora,col.barbeiroId)}
                  onDragOver={e=>onDragOverSlot(e,col.date,hora,col.barbeiroId)}
                  onDrop={e=>onDropSlot(e,col.date,hora,col.barbeiroId)}
                  style={{position:'absolute',left:0,right:0,top:st,height:sh,cursor:'pointer',background:isDropSlot?'var(--gold-soft)':'transparent',border:isDropSlot?'1px dashed var(--gold)':'none',boxSizing:'border-box',zIndex:1}}
                  onMouseEnter={e=>(e.currentTarget.style.background=isDropSlot?'var(--gold-soft)':'color-mix(in srgb, var(--gold) 6%, transparent)')}
                  onMouseLeave={e=>(e.currentTarget.style.background=isDropSlot?'var(--gold-soft)':'transparent')}
                />
              )
            })}
            {interval<30&&<div style={{position:'absolute',left:0,right:0,top:slotH/2,borderTop:'1px dashed var(--border)',pointerEvents:'none'}}/>}
          </div>
        ))}

        {/* CARDS */}
        <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
          {ags.map(ag=>{
            const cfg=STATUS_CONFIG[ag.status]
            const top=topOffset(ag.data_hora,slotH)
            const h=heightPx(ag.duracao_min,slotH)
            const isDrag=dragging?.id===ag.id
            const extras=ag.cliente_id?extrasMap[ag.cliente_id]||[]:[]
            const urgentes=extras.filter(e=>e.dias_urgencia&&e.dias_desde>=e.dias_urgencia)
            const temOportunidade=urgentes.length>0
            const lyt=layout[ag.id]||{col:0,total:1}
            // Se total>1 (sobreposição), divide a largura com margem de 4px
            const GAP=3
            const MARGIN=10
            const usableW=COL_W-MARGIN*2
            const cardW=lyt.total>1?Math.floor((usableW-(lyt.total-1)*GAP)/lyt.total):usableW
            const cardLeft=MARGIN+lyt.col*(cardW+GAP)
            const safeW=Math.min(cardW,COL_W-cardLeft-MARGIN)

            return (
              <div key={ag.id}
                draggable
                onDragStart={()=>onDragStart(ag)}
                onDragEnd={()=>{setDragging(null);setDropTarget(null)}}
                onDragOver={e=>{e.preventDefault();e.stopPropagation()}}
                onDrop={e=>onDropCard(e,ag)}
                onClick={()=>abrirDetalhe(ag)}
                style={{
                  position:'absolute',
                  left:cardLeft,
                  width:cardW,
                  top,height:h,
                  background:cfg.bg,border:`1px solid ${cfg.border}`,borderLeft:`3px solid ${cfg.color}`,
                  borderRadius:3,padding:'3px 5px',cursor:'grab',overflow:'hidden',zIndex:lyt.total>1?3:2,
                  opacity:isDrag?0.35:1,transition:'box-shadow 0.15s,opacity 0.15s',
                  pointerEvents:'all',boxShadow:'var(--shadow-sm)',
                }}
                onMouseEnter={e=>(e.currentTarget.style.boxShadow='var(--shadow-md)')}
                onMouseLeave={e=>(e.currentTarget.style.boxShadow='var(--shadow-sm)')}
              >
                <div style={{fontSize:10,fontWeight:700,color:cfg.color,lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',display:'flex',alignItems:'center',gap:3}}>
                  {new Date(ag.data_hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} {ag.cliente?.nome||'Cliente'}
                  {ag.tem_desconto&&<span style={{fontSize:8,color:'var(--ok)',marginLeft:2}}>%</span>}
                </div>
                {h>34&&<div style={{fontSize:9,color:'var(--muted)',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                  {ag.servicos_ids?.length>1?`${ag.servicos_ids.length} serv · ${ag.duracao_min}min`:ag.servico?.nome||'—'}
                </div>}
                {h>50&&<div style={{fontSize:9,color:cfg.color,marginTop:1,fontVariantNumeric:'tabular-nums',fontWeight:700}}>
                  {ag.tem_desconto&&ag.valor_final!=null?<><span style={{textDecoration:'line-through',opacity:0.5,marginRight:3}}>R${ag.valor_total.toFixed(0)}</span>R${ag.valor_final.toFixed(0)}</>:`R$ ${ag.valor_total.toFixed(0)}`}
                </div>}
                {h<=70&&temOportunidade&&(
                  <div style={{position:'absolute',bottom:2,right:3,fontSize:9,display:'flex',alignItems:'center',gap:2}}>
                    <span style={{fontSize:9}}>⚠️</span>
                    <span style={{fontVariantNumeric:'tabular-nums',fontWeight:700,color:'var(--combo)',fontSize:8,letterSpacing:'0.05em'}}>OPORTUNIDADE</span>
                  </div>
                )}
                {h>70&&extras.length>0&&(
                  <div style={{marginTop:3,borderTop:`1px solid ${cfg.border}`,paddingTop:2}}>
                    {extras.slice(0,3).map(e=>{
                      const cor=urgCor(e.dias_desde,e.dias_urgencia); const urg=e.dias_urgencia&&e.dias_desde>=e.dias_urgencia
                      return (
                        <div key={e.servico_id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:1}}>
                          <span style={{fontSize:8,color:'var(--combo)',fontWeight:urg?700:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'65%'}}>{urg?'⚠️ ':''}{e.nome}</span>
                          <span style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:cor,fontWeight:700}}>{e.dias_desde}d</span>
                        </div>
                      )
                    })}
                    {extras.length>3&&<div style={{fontSize:8,color:'var(--faint)',fontVariantNumeric:'tabular-nums'}}>+{extras.length-3} mais</div>}
                  </div>
                )}
                <div style={{position:'absolute',top:2,right:3,fontSize:7,color:cfg.color,opacity:0.4}}>⠿</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen" style={{background:'var(--bg)',display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* TOPBAR — fixo, não rola */}
      <div style={{padding:'10px 20px',borderBottom:'1px solid var(--border)',background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap',flexShrink:0}}>
        <div>
          <div style={{fontVariantNumeric:'tabular-nums',fontSize:10,letterSpacing:'0.2em',color:'var(--faint)',textTransform:'uppercase',marginBottom:1}}>Operação</div>
          <h1 style={{fontSize:18,fontWeight:700,letterSpacing:'-0.02em',color:'var(--text)'}}>Agenda</h1>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={()=>setAnchor(p=>addDays(p,-1))} style={{padding:'5px 9px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',fontSize:13,color:'var(--muted)'}}>‹</button>
          <button onClick={()=>setAnchor(new Date())} style={{padding:'5px 10px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',fontSize:10,color:'var(--muted)',fontVariantNumeric:'tabular-nums'}}>HOJE</button>
          <button onClick={()=>setAnchor(p=>addDays(p,1))} style={{padding:'5px 9px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,cursor:'pointer',fontSize:13,color:'var(--muted)'}}>›</button>
          <span style={{fontVariantNumeric:'tabular-nums',fontSize:11,color:'var(--muted)'}}>{anchor.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</span>
          <div style={{display:'flex',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,overflow:'hidden'}}>
            {([['hoje','Hoje'],['dois_dias','2 Dias'],['semana_barbeiro','Semana'],['custom','Custom']] as [ViewMode,string][]).map(([m,l])=>(
              <button key={m} onClick={()=>{setViewMode(m);if(m==='custom')setShowCustomPanel(true)}} style={{padding:'5px 10px',border:'none',cursor:'pointer',fontVariantNumeric:'tabular-nums',fontSize:10,fontWeight:viewMode===m?700:400,background:viewMode===m?'var(--gold)':'transparent',color:viewMode===m?'var(--on-gold)':'var(--muted)',transition:'all 0.15s',borderRight:'1px solid var(--border)'}}>{l}</button>
            ))}
          </div>
          {viewMode==='semana_barbeiro'&&barbeiros.length>0&&(
            <select value={barbSemanaSel} onChange={e=>setBarbSemanaSel(e.target.value)} style={{...inputS,width:'auto',padding:'4px 8px',fontSize:11}}>
              {barbeiros.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
          )}
          <div style={{display:'flex',alignItems:'center',gap:3,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,padding:'3px 5px'}}>
            <span style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',marginRight:3}}>ZOOM</span>
            {ZOOM_OPTIONS.map((z,i)=>(
              <button key={i} onClick={()=>setZoomIdx(i)} style={{padding:'3px 7px',borderRadius:2,border:'none',cursor:'pointer',fontVariantNumeric:'tabular-nums',fontSize:9,fontWeight:i===zoomIdx?700:400,background:i===zoomIdx?'var(--gold)':'transparent',color:i===zoomIdx?'var(--on-gold)':'var(--muted)'}}>{z.label}</button>
            ))}
          </div>
          <button onClick={()=>abrirNovo(hoje,'09:00',barbeiros[0]?.id||'')} style={{padding:'6px 14px',background:'var(--gold)',color:'var(--on-gold)',border:'none',borderRadius:3,fontSize:11,fontVariantNumeric:'tabular-nums',fontWeight:700,cursor:'pointer'}}>+ AGENDAR</button>
        </div>
      </div>

      {/* CUSTOM PANEL */}
      {showCustomPanel&&viewMode==='custom'&&(
        <div style={{padding:'8px 20px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',gap:16,alignItems:'flex-start',flexWrap:'wrap',flexShrink:0}}>
          <div>
            <div style={{fontVariantNumeric:'tabular-nums',fontSize:9,color:'var(--faint)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>Dias</div>
            <div style={{display:'flex',gap:3}}>{[1,2,3,4,5,7,14].map(n=>(
              <button key={n} onClick={()=>setCustomDias(n)} style={{padding:'3px 7px',borderRadius:2,border:`1px solid ${customDias===n?'var(--gold)':'var(--border)'}`,background:customDias===n?'var(--gold-soft)':'var(--surface-2)',color:customDias===n?'var(--gold)':'var(--muted)',fontVariantNumeric:'tabular-nums',fontSize:10,fontWeight:customDias===n?700:400,cursor:'pointer'}}>{n}d</button>
            ))}</div>
          </div>
          <div>
            <div style={{fontVariantNumeric:'tabular-nums',fontSize:9,color:'var(--faint)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>Barbeiros</div>
            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
              <button onClick={()=>setCustomBarbs([])} style={{padding:'3px 7px',borderRadius:2,border:`1px solid ${customBarbs.length===0?'var(--gold)':'var(--border)'}`,background:customBarbs.length===0?'var(--gold-soft)':'var(--surface-2)',color:customBarbs.length===0?'var(--gold)':'var(--muted)',fontVariantNumeric:'tabular-nums',fontSize:10,cursor:'pointer'}}>Todos</button>
              {barbeiros.map(b=>{const sel=customBarbs.includes(b.id);return(
                <button key={b.id} onClick={()=>setCustomBarbs(p=>sel?p.filter(x=>x!==b.id):[...p,b.id])} style={{padding:'3px 7px',borderRadius:2,border:`1px solid ${sel?'var(--gold)':'var(--border)'}`,background:sel?'var(--gold-soft)':'var(--surface-2)',color:sel?'var(--gold)':'var(--muted)',fontVariantNumeric:'tabular-nums',fontSize:10,fontWeight:sel?700:400,cursor:'pointer'}}>{b.nome}</button>
              )})}
            </div>
          </div>
          <button onClick={()=>setShowCustomPanel(false)} style={{padding:'3px 8px',background:'transparent',border:'1px solid var(--border)',borderRadius:3,color:'var(--muted)',fontSize:11,cursor:'pointer',alignSelf:'flex-end'}}>Fechar</button>
        </div>
      )}

      {/* LEGENDA */}
      <div style={{padding:'4px 20px',background:'var(--surface-2)',borderBottom:'1px solid var(--border)',display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',flexShrink:0}}>
        {Object.entries(STATUS_CONFIG).map(([k,v])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:3,fontSize:10,color:v.color}}>
            <div style={{width:6,height:6,borderRadius:2,background:v.color}}/>{v.label}
          </div>
        ))}
        <div style={{marginLeft:'auto',fontSize:10,color:'var(--faint)',fontVariantNumeric:'tabular-nums'}}>⠿ arraste para reagendar</div>
      </div>

      {barbeiros.length===0?(
        <div style={{textAlign:'center',padding:'80px 0',color:'var(--faint)',fontSize:13}}>Carregando...</div>
      ):(
        /* CONTAINER DE SCROLL */
        <div style={{flex:1,overflow:'auto',minHeight:0,position:'relative'}}>
          <div style={{width:totalW,minWidth:totalW}}>

            {/* HEADER sticky top — dentro do scroll para andar na horizontal */}
            <div style={{position:'sticky',top:0,zIndex:20,display:'flex',width:totalW,background:'var(--surface-2)',boxShadow:'var(--shadow-sm)'}}>
              {/* célula vazia das horas */}
              <div style={{width:HOUR_COL,flexShrink:0,borderRight:'1px solid var(--border)',height:headerH,position:'sticky',left:0,zIndex:30,background:'var(--surface-2)'}}/>
              {/* cabeçalhos dos grupos */}
              {grupos.map(g=>{
                const gW=g.cols.length*COL_W
                return (
                  <div key={g.barb.id} style={{width:gW,flexShrink:0,position:'relative',display:'flex',flexDirection:'column'}}>
                    <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:'var(--gold-dark)',zIndex:2,pointerEvents:'none'}}/>
                    <div style={{height:BARB_H,borderBottom:multiDays?'1px solid var(--border)':'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer'}}
                      onClick={()=>router.push(`/gestao/barbeiros/${g.barb.id}`)}>
                      {g.barb.foto_url
                        ?<img src={g.barb.foto_url} style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',border:'1px solid var(--gold)'}}/>
                        :<div style={{width:24,height:24,borderRadius:'50%',background:'var(--gold-soft)',border:'1px solid var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--gold)'}}>✂</div>
                      }
                      <div>
                        <div style={{fontVariantNumeric:'tabular-nums',fontSize:11,fontWeight:700,color:'var(--text)',letterSpacing:'0.05em',textDecoration:'underline',textDecorationColor:'var(--gold-dark)'}}>{g.barb.nome.toUpperCase()}</div>
                        {g.cols.length>1&&<div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.1em'}}>{g.cols.length} DIAS</div>}
                      </div>
                    </div>
                    {multiDays&&(
                      <div style={{display:'flex',height:DAY_H,borderBottom:'2px solid var(--border)'}}>
                        {g.cols.map(col=>{
                          const isH=col.date===hoje
                          return (
                            <div key={col.date} style={{width:COL_W,flexShrink:0,borderLeft:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',background:isH?'var(--gold-soft)':'transparent'}}>
                              <div style={{fontVariantNumeric:'tabular-nums',fontSize:9,color:isH?'var(--gold)':'var(--muted)',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:isH?700:400,display:'flex',alignItems:'center',gap:4}}>
                                {col.dateObj.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}
                                {isH&&<div style={{width:4,height:4,borderRadius:'50%',background:'var(--gold)'}}/>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* CORPO — horas + colunas */}
            <div style={{display:'flex',width:totalW}}>
              {/* COLUNA DE HORAS — sticky left */}
              <div style={{width:HOUR_COL,flexShrink:0,background:'var(--surface-2)',borderRight:'1px solid var(--border)',position:'sticky',left:0,zIndex:10}}>
                {HOURS.map(h=>(
                  <div key={h} style={{height:slotH,borderBottom:'1px solid var(--border)',position:'relative'}}>
                    <span style={{position:'absolute',top:3,right:6,fontVariantNumeric:'tabular-nums',fontSize:9,color:'var(--faint)'}}>{fmtHour(h)}</span>
                    {Array.from({length:slotsPerHour-1},(_,si)=>{
                      const mo=(si+1)*interval; const t=(mo/60)*slotH; const im=mo===30
                      return <div key={si} style={{position:'absolute',left:0,right:0,top:t,borderTop:`1px ${im?'dashed':'dotted'} ${im?'var(--border-strong)':'var(--border)'}`}}/>
                    })}
                  </div>
                ))}
              </div>

              {/* GRUPOS */}
              {grupos.map(g=>(
                <div key={g.barb.id} style={{display:'flex',flexShrink:0,position:'relative',width:g.cols.length*COL_W}}>
                  <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:'var(--gold-dark)',zIndex:6,pointerEvents:'none'}}/>
                  {g.cols.map(col=>renderColuna(col))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      {pendingDrop&&!pendingDrop.overlap&&(
        <Toast msg={`Mover para ${barbeiros.find(b=>b.id===pendingDrop.barbeiroId)?.nome||'?'} — ${new Date(pendingDrop.date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})} às ${pendingDrop.hora}`}
          type="confirm" actions={[{label:'CONFIRMAR',primary:true,onClick:()=>confirmarDrop()},{label:'Cancelar',onClick:()=>setPendingDrop(null)}]}/>
      )}
      {pendingDrop?.overlap&&(
        <Toast msg={`Encaixar sobre "${pendingDrop.overlap.cliente?.nome||'outro cliente'}" às ${pendingDrop.hora}. Confirmar sobreposição?`}
          type="warn" actions={[{label:'CONFIRMAR ENCAIXE',primary:true,onClick:()=>confirmarDrop(true)},{label:'Cancelar',onClick:()=>setPendingDrop(null)}]}/>
      )}

      {/* MODAL NOVO */}
      {modalNovo&&(
        <Modal onClose={()=>setModalNovo(null)}>
          <div style={{padding:'18px 22px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontVariantNumeric:'tabular-nums',fontSize:9,letterSpacing:'0.15em',color:'var(--faint)',textTransform:'uppercase',marginBottom:2}}>Novo Agendamento</div>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>{form.data?new Date(form.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}):''}</div>
            </div>
            <button onClick={()=>setModalNovo(null)} style={{background:'transparent',border:'none',fontSize:20,color:'var(--faint)',cursor:'pointer'}}>×</button>
          </div>
          <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:10}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><label style={labelS}>Data *</label><input style={inputS} type="date" value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))}/></div>
              <div><label style={labelS}>Horário *</label><input style={inputS} type="time" value={form.hora} onChange={e=>setForm(p=>({...p,hora:e.target.value}))}/></div>
            </div>
            <div><label style={labelS}>Cliente *</label>
              <select style={inputS} value={form.cliente_id} onChange={e=>setForm(p=>({...p,cliente_id:e.target.value}))}>
                <option value="">Selecionar...</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}{c.telefone?` · ${c.telefone}`:''}</option>)}
              </select>
            </div>
            <div><label style={labelS}>Barbeiro</label>
              <select style={inputS} value={form.barbeiro_id} onChange={e=>setForm(p=>({...p,barbeiro_id:e.target.value}))}>
                <option value="">Qualquer</option>{barbeiros.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>Serviços</label>
              <div style={{display:'flex',flexDirection:'column',gap:3,background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:3,padding:'7px',maxHeight:140,overflowY:'auto'}}>
                {servicos.map(s=>{const sel=form.servicos_selecionados.includes(s.id);return(
                  <div key={s.id} onClick={()=>toggleServico(s.id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:3,cursor:'pointer',background:sel?'var(--gold-soft)':'var(--surface)',border:`1px solid ${sel?'var(--gold)':'var(--border)'}`,transition:'all 0.15s'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:13,height:13,borderRadius:2,border:`2px solid ${sel?'var(--gold)':'var(--border-strong)'}`,background:sel?'var(--gold)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{sel&&<span style={{color:'var(--on-gold)',fontSize:8,lineHeight:1}}>✓</span>}</div>
                      <span style={{fontSize:12,color:'var(--text)',fontWeight:sel?600:400}}>{s.nome}</span>
                    </div>
                    <span style={{fontSize:10,color:'var(--muted)',fontVariantNumeric:'tabular-nums'}}>{s.duracao_min}min · R${s.preco?.toFixed(0)}</span>
                  </div>
                )})}
              </div>
              {form.servicos_selecionados.length>0&&(
                <div style={{marginTop:5,background:'var(--gold-soft)',border:'1px solid var(--gold-soft)',borderRadius:3,padding:'7px 11px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:11,color:'var(--muted)'}}>{form.servicos_selecionados.length} serv · <strong>{duracaoTotal}min</strong></span>
                  <span style={{fontVariantNumeric:'tabular-nums',fontSize:14,fontWeight:700,color:'var(--gold)'}}>R$ {valorTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div><label style={labelS}>Observações</label><textarea style={{...inputS,height:48,resize:'vertical'} as any} value={form.observacoes} onChange={e=>setForm(p=>({...p,observacoes:e.target.value}))}/></div>
          </div>
          <div style={{padding:'11px 22px',borderTop:'1px solid var(--border)',display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setModalNovo(null)} style={{padding:'7px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,color:'var(--muted)',fontSize:12,cursor:'pointer'}}>Cancelar</button>
            <button onClick={salvarNovo} disabled={salvando||!form.cliente_id||!form.data||!form.hora} style={{padding:'7px 18px',background:(!form.cliente_id||!form.data||!form.hora)?'var(--border-strong)':'var(--gold)',color:'var(--on-gold)',border:'none',borderRadius:3,fontSize:12,fontVariantNumeric:'tabular-nums',fontWeight:700,cursor:'pointer'}}>
              {salvando?'SALVANDO...':'CONFIRMAR'}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL DETALHE */}
      {modalDetalhe&&(
        <Modal onClose={()=>{setModalDetalhe(null);setHistoricoExtras([]);setAlteracoes([]);setDescontos([])}} wide>
          <div style={{padding:'18px 22px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{fontVariantNumeric:'tabular-nums',fontSize:9,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:3}}>Agendamento</div>
              <div style={{fontSize:17,fontWeight:700,color:'var(--text)'}}>{modalDetalhe.cliente?.nome||'Cliente'}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:1}}>
                {new Date(modalDetalhe.data_hora).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})} às {new Date(modalDetalhe.data_hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
                {modalDetalhe.barbeiro&&<span style={{marginLeft:8,color:'var(--faint)'}}>· ✂ {modalDetalhe.barbeiro.nome}</span>}
              </div>
            </div>
            <button onClick={()=>{setModalDetalhe(null);setHistoricoExtras([]);setAlteracoes([]);setDescontos([])}} style={{background:'transparent',border:'none',fontSize:20,color:'var(--faint)',cursor:'pointer'}}>×</button>
          </div>
          <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
            {([['detalhes','Detalhes'],['editar','✎ Editar'],['descontos','% Descontos'],['historico','↻ Histórico']] as [ModalAba,string][]).map(([a,l])=>(
              <button key={a} onClick={()=>setModalAba(a)} style={{padding:'10px 16px',border:'none',cursor:'pointer',fontVariantNumeric:'tabular-nums',fontSize:10,fontWeight:modalAba===a?700:400,background:'transparent',color:modalAba===a?'var(--gold)':'var(--muted)',borderBottom:`2px solid ${modalAba===a?'var(--gold)':'transparent'}`,transition:'all 0.15s'}}>
                {l}{a==='historico'&&alteracoes.length>0?` (${alteracoes.length})`:''}
              </button>
            ))}
          </div>

          {modalAba==='detalhes'&&(
            <div style={{padding:'16px 22px',display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:5,background:STATUS_CONFIG[modalDetalhe.status].bg,border:`1px solid ${STATUS_CONFIG[modalDetalhe.status].border}`,borderRadius:3,padding:'4px 9px',alignSelf:'flex-start'}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:STATUS_CONFIG[modalDetalhe.status].color}}/>
                <span style={{fontSize:10,fontVariantNumeric:'tabular-nums',fontWeight:700,color:STATUS_CONFIG[modalDetalhe.status].color,letterSpacing:'0.1em'}}>{STATUS_CONFIG[modalDetalhe.status].label.toUpperCase()}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:2}}>Duração</div><div style={{fontSize:12,color:'var(--text)',fontWeight:500}}>{modalDetalhe.duracao_min} min</div></div>
                <div><div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:2}}>Telefone</div><div style={{fontSize:12,color:'var(--text)',fontWeight:500}}>{modalDetalhe.cliente?.telefone||'—'}</div></div>
                <div>
                  <div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:2}}>Valor</div>
                  <div style={{fontVariantNumeric:'tabular-nums',fontSize:14,fontWeight:700}}>
                    {modalDetalhe.tem_desconto&&modalDetalhe.valor_final!=null?<><span style={{textDecoration:'line-through',color:'var(--faint)',fontSize:11,marginRight:5}}>R${modalDetalhe.valor_total.toFixed(2)}</span><span style={{color:'var(--ok)'}}>R${modalDetalhe.valor_final.toFixed(2)}</span></>:<span style={{color:'var(--gold)'}}>R${modalDetalhe.valor_total.toFixed(2)}</span>}
                  </div>
                </div>
                <div><div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:2}}>E-mail</div><div style={{fontSize:11,color:'var(--text)'}}>{modalDetalhe.cliente?.email||'—'}</div></div>
              </div>
              {(modalDetalhe.servicos_ids?.length>0||modalDetalhe.servico)&&(
                <div>
                  <div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:5}}>Serviços</div>
                  <div style={{display:'flex',flexDirection:'column',gap:3}}>
                    {modalDetalhe.servicos_ids?.length>0?servicos.filter(s=>modalDetalhe.servicos_ids.includes(s.id)).map(s=>(
                      <div key={s.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 8px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:3}}>
                        <span style={{fontSize:12,color:'var(--text)'}}>{s.nome}</span>
                        <span style={{fontSize:11,color:'var(--muted)',fontVariantNumeric:'tabular-nums'}}>{s.duracao_min}min · R${s.preco?.toFixed(2)}</span>
                      </div>
                    )):modalDetalhe.servico&&(
                      <div style={{display:'flex',justifyContent:'space-between',padding:'5px 8px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:3}}>
                        <span style={{fontSize:12,color:'var(--text)'}}>{modalDetalhe.servico.nome}</span>
                        <span style={{fontSize:11,color:'var(--muted)',fontVariantNumeric:'tabular-nums'}}>{modalDetalhe.servico.duracao_min}min · R${modalDetalhe.servico.preco?.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div style={{background:'var(--combo-bg)',border:'1px solid color-mix(in srgb, var(--combo) 25%, transparent)',borderRadius:4,padding:'11px 13px'}}>
                <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:7}}><span style={{fontSize:11}}>💈</span><div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--combo)',letterSpacing:'0.15em',textTransform:'uppercase',fontWeight:700}}>Extras — Oportunidades</div></div>
                {historicoExtras.length===0?<div style={{fontSize:11,color:'var(--faint)'}}>Nenhum extra registrado ainda.</div>
                  :historicoExtras.map(h=>{const cor=urgCor(h.dias_desde,h.dias_urgencia);const urg=h.dias_urgencia&&h.dias_desde>=h.dias_urgencia;return(
                    <div key={h.servico_id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',marginBottom:3,background:urg?(cor==='var(--danger)'?'var(--danger-bg)':'var(--gold-soft)'):'var(--surface)',border:`1px solid ${urg?`color-mix(in srgb, ${cor} 25%, transparent)`:'var(--border)'}`,borderRadius:3}}>
                      <div><div style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>{h.nome}</div><div style={{fontSize:10,color:'var(--faint)'}}>Última: {new Date(h.ultima_data).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}{h.dias_urgencia&&<span style={{marginLeft:4}}>· urg:{h.dias_urgencia}d</span>}</div></div>
                      <div style={{textAlign:'right'}}><div style={{fontVariantNumeric:'tabular-nums',fontSize:13,fontWeight:700,color:cor}}>{h.dias_desde}d{urg?' 🔴':''}</div>{urg&&<div style={{fontSize:8,color:cor,fontVariantNumeric:'tabular-nums'}}>OFERECER!</div>}</div>
                    </div>
                  )})
                }
              </div>
              {modalDetalhe.observacoes&&<div><div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:3}}>Observações</div><div style={{fontSize:12,color:'var(--muted)',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:3,padding:'8px 10px'}}>{modalDetalhe.observacoes}</div></div>}
              <div>
                <div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>Alterar Status</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {(['pendente','confirmado','em_atendimento','concluido','faltou','cancelado'] as const).filter(s=>s!==modalDetalhe.status).map(s=>(
                    <button key={s} onClick={()=>mudarStatus(modalDetalhe.id,s)} style={{padding:'5px 10px',background:STATUS_CONFIG[s].bg,border:`1px solid ${STATUS_CONFIG[s].border}`,borderRadius:3,cursor:'pointer',fontSize:10,fontVariantNumeric:'tabular-nums',fontWeight:700,color:STATUS_CONFIG[s].color}}>{STATUS_CONFIG[s].label.toUpperCase()}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {modalAba==='editar'&&(
            <div style={{padding:'16px 22px',display:'flex',flexDirection:'column',gap:12}}>
              <div style={{background:'var(--gold-soft)',border:'1px solid var(--gold-soft)',borderRadius:3,padding:'8px 12px',fontSize:11,color:'var(--gold-dark)'}}>Alterações ficam registradas no histórico. Motivo obrigatório.</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={labelS}>Data</label><input style={inputS} type="date" value={editForm.data} onChange={e=>setEditForm(p=>({...p,data:e.target.value}))}/></div>
                <div><label style={labelS}>Horário</label><input style={inputS} type="time" value={editForm.hora} onChange={e=>setEditForm(p=>({...p,hora:e.target.value}))}/></div>
              </div>
              <div><label style={labelS}>Barbeiro</label>
                <select style={inputS} value={editForm.barbeiro_id} onChange={e=>setEditForm(p=>({...p,barbeiro_id:e.target.value}))}>
                  <option value="">Sem barbeiro</option>{barbeiros.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Serviços</label>
                <div style={{display:'flex',flexDirection:'column',gap:3,background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:3,padding:'7px',maxHeight:130,overflowY:'auto'}}>
                  {servicos.map(s=>{const sel=editForm.servicos_selecionados.includes(s.id);return(
                    <div key={s.id} onClick={()=>toggleEditServico(s.id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:3,cursor:'pointer',background:sel?'var(--gold-soft)':'var(--surface)',border:`1px solid ${sel?'var(--gold)':'var(--border)'}`,transition:'all 0.15s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:13,height:13,borderRadius:2,border:`2px solid ${sel?'var(--gold)':'var(--border-strong)'}`,background:sel?'var(--gold)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{sel&&<span style={{color:'var(--on-gold)',fontSize:8,lineHeight:1}}>✓</span>}</div>
                        <span style={{fontSize:12,color:'var(--text)',fontWeight:sel?600:400}}>{s.nome}</span>
                      </div>
                      <span style={{fontSize:10,color:'var(--muted)',fontVariantNumeric:'tabular-nums'}}>{s.duracao_min}min · R${s.preco?.toFixed(0)}</span>
                    </div>
                  )})}
                </div>
              </div>
              <div>
                <label style={labelS}>Motivo *</label>
                <textarea style={{...inputS,height:60,resize:'vertical',border:!editForm.motivo.trim()?'1px solid var(--danger)':'1px solid var(--border)'} as any} value={editForm.motivo} onChange={e=>setEditForm(p=>({...p,motivo:e.target.value}))} placeholder="Descreva o motivo (obrigatório)..."/>
                {!editForm.motivo.trim()&&<div style={{fontSize:10,color:'var(--danger)',marginTop:3}}>Campo obrigatório</div>}
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setModalAba('detalhes')} style={{padding:'7px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,color:'var(--muted)',fontSize:12,cursor:'pointer'}}>Cancelar</button>
                <button onClick={salvarEdicao} disabled={salvandoEdicao||!editForm.motivo.trim()} style={{padding:'7px 18px',background:!editForm.motivo.trim()?'var(--border-strong)':'var(--gold)',color:'var(--on-gold)',border:'none',borderRadius:3,fontSize:12,fontVariantNumeric:'tabular-nums',fontWeight:700,cursor:'pointer'}}>
                  {salvandoEdicao?'SALVANDO...':'SALVAR ALTERAÇÕES'}
                </button>
              </div>
            </div>
          )}

          {modalAba==='descontos'&&(
            <div style={{padding:'16px 22px',display:'flex',flexDirection:'column',gap:12}}>
              <div style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:4,padding:'12px 14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:2}}>Valor original</div><div style={{fontVariantNumeric:'tabular-nums',fontSize:16,fontWeight:700,color:'var(--text)'}}>R$ {modalDetalhe.valor_total.toFixed(2)}</div></div>
                  {descTotal>0&&<><div style={{fontSize:18,color:'var(--faint)'}}>→</div><div style={{textAlign:'right'}}><div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:2}}>Com desconto</div><div style={{fontVariantNumeric:'tabular-nums',fontSize:16,fontWeight:700,color:'var(--ok)'}}>R$ {(modalDetalhe.valor_final??modalDetalhe.valor_total).toFixed(2)}</div><div style={{fontSize:10,color:'var(--danger)'}}>− R$ {descTotal.toFixed(2)}</div></div></>}
                </div>
              </div>
              {descontos.length>0&&(
                <div>
                  <div style={{fontVariantNumeric:'tabular-nums',fontSize:8,color:'var(--faint)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>Descontos aplicados</div>
                  {descontos.map(d=>{const srv=servicos.find(s=>s.id===d.servico_id);return(
                    <div key={d.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',marginBottom:4,background:'var(--ok-bg)',border:'1px solid color-mix(in srgb, var(--ok) 30%, transparent)',borderRadius:3}}>
                      <div><div style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>{d.modalidade==='percentual'?`${d.valor}%`:`R$ ${d.valor.toFixed(2)}`} {d.tipo==='total'?'no total':`em ${srv?.nome||'serviço'}`}</div>{d.observacao&&<div style={{fontSize:10,color:'var(--faint)',marginTop:1}}>{d.observacao}</div>}</div>
                      <button onClick={()=>removerDesconto(d.id,d)} style={{padding:'4px 8px',background:'var(--danger-bg)',border:'1px solid color-mix(in srgb, var(--danger) 30%, transparent)',borderRadius:2,color:'var(--danger)',fontSize:10,cursor:'pointer'}}>✕</button>
                    </div>
                  )})}
                </div>
              )}
              <div style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:4,padding:'14px'}}>
                <div style={{fontVariantNumeric:'tabular-nums',fontSize:9,color:'var(--faint)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Adicionar Desconto</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  <div><label style={labelS}>Aplicar em</label>
                    <div style={{display:'flex',gap:4}}>{(['total','servico'] as const).map(t=>(
                      <button key={t} onClick={()=>setDescForm(p=>({...p,tipo:t,servico_id:''}))} style={{flex:1,padding:'6px',border:`1px solid ${descForm.tipo===t?'var(--gold)':'var(--border)'}`,background:descForm.tipo===t?'var(--gold-soft)':'var(--surface)',color:descForm.tipo===t?'var(--gold)':'var(--muted)',borderRadius:3,fontSize:11,fontVariantNumeric:'tabular-nums',cursor:'pointer',fontWeight:descForm.tipo===t?700:400}}>{t==='total'?'Total':'Serviço'}</button>
                    ))}</div>
                  </div>
                  <div><label style={labelS}>Modalidade</label>
                    <div style={{display:'flex',gap:4}}>{(['percentual','reais'] as const).map(m=>(
                      <button key={m} onClick={()=>setDescForm(p=>({...p,modalidade:m}))} style={{flex:1,padding:'6px',border:`1px solid ${descForm.modalidade===m?'var(--gold)':'var(--border)'}`,background:descForm.modalidade===m?'var(--gold-soft)':'var(--surface)',color:descForm.modalidade===m?'var(--gold)':'var(--muted)',borderRadius:3,fontSize:11,fontVariantNumeric:'tabular-nums',cursor:'pointer',fontWeight:descForm.modalidade===m?700:400}}>{m==='percentual'?'%':'R$'}</button>
                    ))}</div>
                  </div>
                </div>
                {descForm.tipo==='servico'&&(
                  <div style={{marginBottom:8}}><label style={labelS}>Serviço</label>
                    <select style={inputS} value={descForm.servico_id} onChange={e=>setDescForm(p=>({...p,servico_id:e.target.value}))}>
                      <option value="">Selecionar...</option>
                      {servicos.filter(s=>modalDetalhe.servicos_ids?.includes(s.id)||modalDetalhe.servico_id===s.id).map(s=><option key={s.id} value={s.id}>{s.nome} (R${s.preco?.toFixed(2)})</option>)}
                    </select>
                  </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:'110px 1fr',gap:8,marginBottom:8}}>
                  <div><label style={labelS}>Valor</label><input style={inputS} type="number" min="0" step={descForm.modalidade==='percentual'?'1':'0.01'} max={descForm.modalidade==='percentual'?'100':undefined} value={descForm.valor||''} onChange={e=>setDescForm(p=>({...p,valor:Number(e.target.value)}))}/></div>
                  <div><label style={labelS}>Observação</label><input style={inputS} value={descForm.observacao} onChange={e=>setDescForm(p=>({...p,observacao:e.target.value}))} placeholder="Ex: cliente fidelidade"/></div>
                </div>
                {descForm.valor>0&&(
                  <div style={{background:'var(--ok-bg)',border:'1px solid color-mix(in srgb, var(--ok) 30%, transparent)',borderRadius:3,padding:'7px 10px',marginBottom:8,fontSize:11,color:'var(--ok)',fontVariantNumeric:'tabular-nums',fontWeight:600}}>
                    {descForm.modalidade==='percentual'?`${descForm.valor}% = − R$ ${(descForm.tipo==='total'?(modalDetalhe.valor_total*(descForm.valor/100)):(servicos.find(s=>s.id===descForm.servico_id)?.preco||0)*(descForm.valor/100)).toFixed(2)}`:`R$ ${descForm.valor.toFixed(2)} de desconto`}
                  </div>
                )}
                <button onClick={salvarDesconto} disabled={salvandoDesc||descForm.valor<=0||(descForm.tipo==='servico'&&!descForm.servico_id)} style={{padding:'7px 16px',background:descForm.valor<=0?'var(--border-strong)':'var(--gold)',color:'var(--on-gold)',border:'none',borderRadius:3,fontSize:11,fontVariantNumeric:'tabular-nums',fontWeight:700,cursor:'pointer'}}>
                  {salvandoDesc?'APLICANDO...':'APLICAR DESCONTO'}
                </button>
              </div>
            </div>
          )}

          {modalAba==='historico'&&(
            <div style={{padding:'16px 22px',display:'flex',flexDirection:'column',gap:8}}>
              {alteracoes.length===0?(
                <div style={{textAlign:'center',padding:'40px 0',color:'var(--faint)',fontSize:13}}>Nenhuma alteração registrada ainda.</div>
              ):alteracoes.map(a=>(
                <div key={a.id} style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:4,padding:'12px 14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                    <div style={{fontVariantNumeric:'tabular-nums',fontSize:9,color:a.campo_alterado.includes('removido')?'var(--danger)':'var(--faint)',letterSpacing:'0.1em',textTransform:'uppercase'}}>{a.campo_alterado}</div>
                    <div style={{fontVariantNumeric:'tabular-nums',fontSize:9,color:'var(--faint)'}}>{new Date(a.alterado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})} {new Date(a.alterado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  {a.valor_anterior&&a.valor_novo&&(<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,fontSize:12}}><span style={{color:'var(--danger)',background:'var(--danger-bg)',border:'1px solid color-mix(in srgb, var(--danger) 25%, transparent)',borderRadius:2,padding:'2px 7px',textDecoration:'line-through'}}>{a.valor_anterior}</span><span style={{color:'var(--faint)'}}>→</span><span style={{color:'var(--ok)',background:'var(--ok-bg)',border:'1px solid color-mix(in srgb, var(--ok) 25%, transparent)',borderRadius:2,padding:'2px 7px'}}>{a.valor_novo}</span></div>)}
                  {!a.valor_anterior&&a.valor_novo&&<div style={{marginBottom:6,fontSize:12,color:'var(--ok)',background:'var(--ok-bg)',border:'1px solid color-mix(in srgb, var(--ok) 25%, transparent)',borderRadius:2,padding:'3px 8px',display:'inline-block'}}>+ {a.valor_novo}</div>}
                  {a.valor_anterior&&!a.valor_novo&&<div style={{marginBottom:6,fontSize:12,color:'var(--danger)',background:'var(--danger-bg)',border:'1px solid color-mix(in srgb, var(--danger) 25%, transparent)',borderRadius:2,padding:'3px 8px',display:'inline-block'}}>− {a.valor_anterior}</div>}
                  <div style={{fontSize:11,color:'var(--muted)',fontStyle:'italic'}}>"{a.motivo}"</div>
                </div>
              ))}
            </div>
          )}

          <div style={{padding:'11px 22px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'flex-end'}}>
            <button onClick={()=>{setModalDetalhe(null);setHistoricoExtras([]);setAlteracoes([]);setDescontos([])}} style={{padding:'7px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,color:'var(--muted)',fontSize:12,cursor:'pointer'}}>Fechar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
