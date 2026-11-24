import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
export async function GET(){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 return NextResponse.json({entries:await db.restaurantEntry.findMany({where:{userId:u.id},include:{restaurant:true,recommendations:{include:{friendProfile:{select:{displayName:true}}}}},orderBy:{updatedAt:"desc"}}),restaurants:await db.restaurant.findMany({select:{id:true,name:true,address:true},orderBy:{name:"asc"}})});
}
export async function POST(req:Request){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await req.json().catch(()=>null);if(!b)return NextResponse.json({error:"Invalid request"},{status:400});
 const str=(v:unknown,n:number)=>typeof v==="string"?v.trim().slice(0,n):"";
 const rate=(v:unknown)=>v==null||v===""?null:Number(v);
 const rating=rate(b.rating),friendRating=rate(b.friendRating),friendId=str(b.friendProfileId,200),friendName=str(b.friendName,200);
 if([rating,friendRating].some(v=>v!==null&&(!Number.isFinite(v)||v<1||v>5))||(!friendId&&!friendName&&friendRating!==null)||(!b.visited&&rating!==null))return NextResponse.json({error:"Invalid rating or friend."},{status:400});
 try{
 const entry=await db.$transaction(async tx=>{
 let restaurant=await tx.restaurant.findUnique({where:{id:str(b.restaurantId,500)}});
 if(!restaurant){const name=str(b.name,200),address=str(b.address,500);if(!name)throw Error("Restaurant name required.");
 restaurant=await tx.restaurant.findFirst({where:{name:{equals:name,mode:"insensitive"},address:{equals:address,mode:"insensitive"}}});
 if(!restaurant)restaurant=await tx.restaurant.create({data:{id:randomUUID(),name,address,cuisine:str(b.cuisine,100)||"Restaurant"}});}
 const previous=await tx.restaurantEntry.findUnique({where:{userId_restaurantId:{userId:u.id,restaurantId:restaurant.id}}});
 const visited=Boolean(b.visited)||Boolean(previous?.visited);
 const entry=await tx.restaurantEntry.upsert({where:{userId_restaurantId:{userId:u.id,restaurantId:restaurant.id}},create:{userId:u.id,restaurantId:restaurant.id,visited,rating,notes:str(b.notes,2000)},update:{visited,...(b.rating!==undefined?{rating}:{}),...(b.notes!==undefined?{notes:str(b.notes,2000)}:{})}});
 if(friendId||friendName){
 const profile=friendId?await tx.friendProfile.findFirst({where:{id:friendId,createdById:u.id,claimedUserId:null}}):await tx.friendProfile.create({data:{displayName:friendName,createdById:u.id}});
 if(!profile)throw Error("Friend unavailable.");
 await tx.restaurantRecommendation.upsert({where:{entryId_friendProfileId:{entryId:entry.id,friendProfileId:profile.id}},create:{entryId:entry.id,friendProfileId:profile.id,rating:friendRating,notes:str(b.friendNotes,2000)},update:{rating:friendRating,notes:str(b.friendNotes,2000)}});
 }
 return entry;
 });return NextResponse.json({ok:true,id:entry.id});
 }catch(e){return NextResponse.json({error:e instanceof Error&&["Restaurant name required.","Friend unavailable."].includes(e.message)?e.message:"Unable to save restaurant."},{status:400});}
}
