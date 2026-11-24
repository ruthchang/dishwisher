import { NextResponse } from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {db} from "@/lib/db";
export async function GET(){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{return NextResponse.json({wishes:await db.cuisineWish.findMany({where:{ownerId:u.id},orderBy:{createdAt:"desc"}}),dishes:await db.dish.findMany({where:{createdById:u.id},select:{id:true,name:true,cuisine:true,description:true,restaurant:{select:{name:true}},ratings:{where:{userId:u.id},select:{value:true}},friendRatings:{where:{friendProfile:{createdById:u.id}},select:{value:true,friendProfile:{select:{displayName:true}}}}}})});}
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
 if(!data.name||!data.cuisine)return NextResponse.json({error:"Dish and cuisine are required."},{status:400});
 if(data.friendEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.friendEmail))return NextResponse.json({error:"Invalid email address."},{status:400});
 await db.$transaction(async tx=>{
 const existing=b.id?await tx.cuisineWish.findFirst({where:{id:str(b.id,200),ownerId:u.id}}):null;
 if(b.id&&!existing)throw Error("Wish not found");
 const requested=str(b.friendProfileId,200);
 let profile=requested?await tx.friendProfile.findFirst({where:{id:requested,createdById:u.id}}):null;
 if(requested&&!profile)throw Error("Friend unavailable");
 if(!profile&&existing?.friendProfileId&&existing.friendName===data.friendName&&existing.friendEmail===data.friendEmail)profile=await tx.friendProfile.findFirst({where:{id:existing.friendProfileId,createdById:u.id}});
 if(!profile&&data.friendName)profile=await tx.friendProfile.create({data:{displayName:data.friendName,email:data.friendEmail,createdById:u.id}});
 const values={...data,friendName:profile?.displayName??data.friendName,friendEmail:profile?.email??data.friendEmail,friendProfileId:profile?.id??null};
 if(existing)await tx.cuisineWish.update({where:{id:existing.id},data:values});else await tx.cuisineWish.create({data:{...values,ownerId:u.id}});
 });
 }
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Could not save cuisine wish. Check database setup."},{status:503});}
}
