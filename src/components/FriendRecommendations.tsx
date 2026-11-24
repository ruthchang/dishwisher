"use client";
import {useEffect,useState} from "react";
type Profile={id:string;displayName:string;restaurantRecommendations:{id:string;rating:number|null;notes:string;entry:{visited:boolean;restaurant:{name:string;address:string}}}[];ratings:{id:string;value:number|null;dish:{name:string;cuisine:string|null;restaurant:{name:string}|null}}[];cuisineWishes:{id:string;name:string;cuisine:string;notes:string}[];restaurantWishes:{id:string;name:string;restaurantName:string|null}[]};
export default function FriendRecommendations(){
 const [profiles,setProfiles]=useState<Profile[]>([]),[error,setError]=useState(""),[query,setQuery]=useState(""),[loading,setLoading]=useState(true);
 async function load(){setLoading(true);setError("");try{const r=await fetch("/api/friends/recommendations",{cache:"no-store"});if(!r.ok)throw Error("Could not load friends.");setProfiles((await r.json()).profiles);}catch(e){setError(String(e));}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 const rating=(v:number|null)=>v===null?"Not yet rated":v+"/5";
 return <section className="border rounded-xl p-3 mb-4 space-y-3"><div className="flex justify-between items-center"><h2 className="font-bold">Friends</h2><button className="text-sm underline" onClick={()=>void load()}>Refresh</button></div><input aria-label="Find friend" placeholder="Find a friend" className="w-full border rounded p-2" value={query} onChange={e=>setQuery(e.target.value)}/>{loading&&<p>Loading…</p>}{error&&<p role="alert">{error}</p>}{!loading&&!profiles.length&&<p className="text-sm">Friends appear here when you record their recommendations.</p>}
 {profiles.filter(p=>p.displayName.toLowerCase().includes(query.toLowerCase())).map(p=><details key={p.id} className="border rounded-lg p-3"><summary className="cursor-pointer font-semibold">{p.displayName} <span className="text-xs font-normal">({p.restaurantRecommendations.length+p.ratings.length+p.cuisineWishes.length+p.restaurantWishes.length})</span></summary><div className="space-y-3 pt-3 text-sm">
 {!!p.restaurantRecommendations.length&&<div><h3 className="font-semibold">Restaurants</h3>{p.restaurantRecommendations.map(r=><div key={r.id} className="border-t py-2">{r.entry.restaurant.name} · {rating(r.rating)}<p>{r.entry.visited?"Visited":"Want to visit"}{r.notes?" — "+r.notes:""}</p></div>)}</div>}
 {!!p.ratings.length&&<div><h3 className="font-semibold">Dishes</h3>{p.ratings.map(r=><div key={r.id} className="border-t py-2">{r.dish.name} · {rating(r.value)}<p>{r.dish.restaurant?.name||r.dish.cuisine||"General dish"}</p></div>)}</div>}
 {!!p.cuisineWishes.length&&<div><h3 className="font-semibold">Cuisine wishes</h3>{p.cuisineWishes.map(r=><p key={r.id}>{r.name} · {r.cuisine}{r.notes?" — "+r.notes:""}</p>)}</div>}
 {!!p.restaurantWishes.length&&<div><h3 className="font-semibold">Restaurant dish wishes</h3>{p.restaurantWishes.map(r=><p key={r.id}>{r.name}{r.restaurantName?" · "+r.restaurantName:""}</p>)}</div>}
 </div></details>)}</section>;
}
