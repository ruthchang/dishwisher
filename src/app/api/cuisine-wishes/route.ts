import { NextResponse } from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {db} from "@/lib/db";
export async function GET(){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{return NextResponse.json({wishes:await db.cuisineWish.findMany({where:{ownerId:u.id},orderBy:{createdAt:"desc"}}),dishes:await db.dish.findMany({where:{createdById:u.id},select:{id:true,name:true,restaurant:{select:{name:true}}}})});}
 catch{return NextResponse.json({error:"Cuisine wishes database is not ready."},{status:503});}
}
export async function POST(req:Request){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await req.json().catch(()=>null);if(!b)return NextResponse.json({error:"Invalid request"},{status:400});
 const str=(v:unknown,n:number)=>typeof v==="string"?v.trim().slice(0,n):"";
 try{
 if(b.action==="delete"){await db.cuisineWish.deleteMany({where:{id:str(b.id,200),ownerId:u.id}});}
 else if(b.action==="link"){
 const dish=await db.dish.findFirst({where:{id:str(b.dishId,200),createdById:u.id}});
 const wish=await db.cuisineWish.findFirst({where:{id:str(b.id,200),ownerId:u.id}});
 if(!dish||!wish)return NextResponse.json({error:"Not found"},{status:404});
 await db.cuisineWish.update({where:{id:wish.id},data:{triedDishIds:[...new Set([...(Array.isArray(wish.triedDishIds)?wish.triedDishIds.filter((x):x is string=>typeof x==="string"):[]),dish.id])]}});
 }else{
 const data={name:str(b.name,200),cuisine:str(b.cuisine,100),friendName:str(b.friendName,200),friendEmail:str(b.friendEmail,254)||null,notes:str(b.notes,2000)};
 if(!data.name||!data.cuisine||!data.friendName)return NextResponse.json({error:"Dish, cuisine and friend are required."},{status:400});
 if(data.friendEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.friendEmail))return NextResponse.json({error:"Invalid email address."},{status:400});
 if(b.id)await db.cuisineWish.updateMany({where:{id:str(b.id,200),ownerId:u.id},data});else await db.cuisineWish.create({data:{...data,ownerId:u.id}});
 }
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Could not save cuisine wish. Check database setup."},{status:503});}
}
