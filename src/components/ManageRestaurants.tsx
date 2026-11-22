"use client";
import {useEffect,useState} from "react";
type Place={id:string;name:string;address:string;count:number;manageable:boolean};
export default function ManageRestaurants({onClose,onChange}:{onClose:()=>void;onChange:()=>Promise<void>}) {
 const [places,setPlaces]=useState<Place[]>([]),[query,setQuery]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[selected,setSelected]=useState<Place|null>(null),[target,setTarget]=useState("");
 const load=async()=>{try{const r=await fetch("/api/restaurants/manage");const p=await r.json();if(!r.ok)throw Error(p.error);setPlaces(p.restaurants);}catch(e){setError(String(e));}};
 useEffect(()=>{void load();},[]);
 useEffect(()=>{
   const y=window.scrollY;
   const body=document.body;
   const previous= {position:body.style.position,top:body.style.top,width:body.style.width,overflow:body.style.overflow};
   body.style.position="fixed";
   body.style.top=`-${y}px`;
   body.style.width="100%";
   body.style.overflow="hidden";
   return ()=>{
     Object.assign(body.style,previous);
     const scrollBehavior=document.documentElement.style.scrollBehavior;
     document.documentElement.style.scrollBehavior="auto";
     window.scrollTo(0,y);
     document.documentElement.style.scrollBehavior=scrollBehavior;
   };
 },[]);
 const save=async(action:string)=>{if(!selected||busy)return;if(action!=="edit"&&!window.confirm(action==="merge"?"Move all dishes to the selected restaurant and remove this duplicate?":"Delete this unused restaurant?"))return;setBusy(true);setError("");try{const r=await fetch("/api/restaurants/manage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...selected,action,targetId:target})});const p=await r.json();if(!r.ok)throw Error(p.error);setSelected(null);setTarget("");await load();await onChange();}catch(e){setError(String(e));}finally{setBusy(false);}};
 return <div className="fixed inset-0 z-50 bg-black/30 flex items-start sm:items-center justify-center p-3 overflow-hidden overscroll-none" role="dialog" aria-modal="true" aria-label="Manage restaurants"><div className="bg-white rounded-xl w-full max-w-xl max-h-[calc(100dvh-2rem)] min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 space-y-3">
 <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Manage restaurants</h2><button onClick={onClose} className="min-h-11 px-3">Close</button></div>
 <input aria-label="Search saved restaurants" placeholder="Search saved restaurants" value={query} onChange={e=>setQuery(e.target.value)} className="w-full border rounded-lg p-3"/>
 {error&&<p role="alert" className="text-red-700 text-sm">{error}</p>}
 {selected?<div className="space-y-3 border rounded-lg p-3"><label className="block text-sm">Name<input className="block w-full border rounded p-2" value={selected.name} onChange={e=>setSelected({...selected,name:e.target.value})}/></label><label className="block text-sm">Address<input className="block w-full border rounded p-2" value={selected.address} onChange={e=>setSelected({...selected,address:e.target.value})}/></label><button disabled={busy} onClick={()=>save("edit")} className="bg-[#0f766e] text-white rounded p-3">Save changes</button><label className="block text-sm">Merge into<select className="block w-full border rounded p-2" value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose restaurant</option>{places.filter(p=>p.id!==selected.id).map(p=><option key={p.id} value={p.id}>{p.name} — {p.address}</option>)}</select></label><div className="flex flex-wrap gap-3"><button disabled={busy||!target} onClick={()=>save("merge")} className="border rounded p-3 disabled:opacity-40">Merge</button><button disabled={busy||selected.count>0} onClick={()=>save("delete")} className="text-red-700 border rounded p-3 disabled:opacity-40">Delete</button><button onClick={()=>setSelected(null)} className="p-3">Cancel</button></div>{selected.count>0&&<p className="text-xs">Merge or move associated dishes before deleting.</p>}</div>:places.filter(p=>(p.name+" "+p.address).toLowerCase().includes(query.toLowerCase())).map(p=><div key={p.id} className="border-b py-2 flex gap-3 items-center justify-between"><div className="min-w-0 flex-1"><p className="font-semibold break-words">{p.name}</p><p className="text-xs break-words">{p.address} · {p.count} {p.count===1?"dish":"dishes"}</p></div>{p.manageable?<button className="min-h-11 shrink-0 whitespace-nowrap px-2 sm:px-3 text-[#0f766e]" onClick={()=>{setSelected(p);setTarget("");}}>Manage</button>:<span className="text-xs">Admin only</span>}</div>)}
 </div></div>;
}
