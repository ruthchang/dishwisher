import {NextResponse} from "next/server";
import {createHash} from "crypto";
import {getCurrentUser} from "@/lib/auth";
import {db} from "@/lib/db";
export async function POST(req:Request){
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"Sign in first."},{status:401});
 // Do not enable until independently verified email delivery and legacy token invalidation are tested.
 if(process.env.ENABLE_VERIFIED_FRIEND_CLAIMS!=="true")return NextResponse.json({error:"Claiming is not enabled."},{status:503});
 const b=await req.json().catch(()=>null);
 if(typeof b?.token!=="string"||!/^[a-f0-9]{64}$/.test(b.token)||!Array.isArray(b.selected)||b.selected.length>1000||!b.selected.every((x:unknown)=>typeof x==="string"))return NextResponse.json({error:"Invalid selection."},{status:400});
 const selected=new Set<string>(b.selected);
 try{
 const imported=await db.$transaction(async tx=>{
 const now=new Date();
 const invitation=await tx.friendInvitation.findFirst({where:{tokenHash:createHash("sha256").update(b.token).digest("hex"),email:user.email.toLowerCase(),acceptedAt:null,revokedAt:null,expiresAt:{gt:now},friendProfile:{claimedUserId:null}},include:{friendProfile:{include:{ratings:{include:{dish:true}},restaurantRecommendations:{include:{entry:true}},cuisineWishes:true,restaurantWishes:true}}}});
 if(!invitation||invitation.friendProfile.createdById===user.id)throw Error("unavailable");
 const p=invitation.friendProfile;
 const allowed=new Set([...p.ratings,...p.restaurantRecommendations,...p.cuisineWishes,...p.restaurantWishes].map(x=>x.id));
 if([...selected].some(id=>!allowed.has(id)))throw Error("selection");
 const consumed=await tx.friendInvitation.updateMany({where:{id:invitation.id,acceptedAt:null,revokedAt:null,expiresAt:{gt:now}},data:{acceptedAt:now}});
 if(consumed.count!==1)throw Error("unavailable");
 const claimed=await tx.friendProfile.updateMany({where:{id:p.id,claimedUserId:null},data:{claimedUserId:user.id,claimedAt:now}});
 if(claimed.count!==1)throw Error("unavailable");
 let count=0;
 for(const r of p.ratings.filter(x=>selected.has(x.id))){
 let dishId=r.dishId;
 if(!r.dish.restaurantId&&!r.dish.customRestaurantName&&r.dish.cuisine){
 const existing=await tx.dish.findFirst({where:{createdById:user.id,name:r.dish.name,cuisine:r.dish.cuisine,restaurantId:null,customRestaurantName:null}});
 dishId=existing?.id||(await tx.dish.create({data:{name:r.dish.name,cuisine:r.dish.cuisine,description:"",category:r.dish.category,tags:[],createdById:user.id}})).id;
 }
 if(r.value!==null){
 await tx.rating.upsert({where:{dishId_userId:{dishId,userId:user.id}},create:{dishId,userId:user.id,value:r.value},update:{}});
 const a=await tx.rating.aggregate({where:{dishId},_avg:{value:true},_count:{value:true}});
 await tx.dish.update({where:{id:dishId},data:{rating:a._avg.value??0,reviewCount:a._count.value}});
 }
 await tx.userDishPreference.upsert({where:{userId_dishId:{userId:user.id,dishId}},create:{userId:user.id,dishId},update:{}});
 await tx.friendRating.update({where:{id:r.id},data:{confirmedAt:now}});count++;
 }
 for(const r of p.restaurantRecommendations.filter(x=>selected.has(x.id))){
 await tx.restaurantEntry.upsert({where:{userId_restaurantId:{userId:user.id,restaurantId:r.entry.restaurantId}},create:{userId:user.id,restaurantId:r.entry.restaurantId,visited:r.rating!==null,rating:r.rating},update:{}});
 await tx.restaurantRecommendation.update({where:{id:r.id},data:{confirmedAt:now}});count++;
 }
 for(const w of p.cuisineWishes.filter(x=>selected.has(x.id))){
 const existing=await tx.cuisineWish.findFirst({where:{ownerId:user.id,name:w.name,cuisine:w.cuisine}});
 if(!existing)await tx.cuisineWish.create({data:{ownerId:user.id,name:w.name,cuisine:w.cuisine,friendName:""}});
 count++;
 }
 for(const w of p.restaurantWishes.filter(x=>selected.has(x.id))){
 const existing=await tx.dishWish.findFirst({where:{createdById:user.id,name:w.name,restaurantName:w.restaurantName,restaurantAddress:w.restaurantAddress}});
 if(!existing)await tx.dishWish.create({data:{createdById:user.id,name:w.name,restaurantName:w.restaurantName,restaurantAddress:w.restaurantAddress}});
 count++;
 }
 await tx.friendInvitation.updateMany({where:{friendProfileId:p.id,acceptedAt:null,revokedAt:null},data:{revokedAt:now}});
 return count;
 },{isolationLevel:"Serializable"});
 return NextResponse.json({imported},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({error:e instanceof Error&&e.message==="selection"?"Invalid selection.":"Invitation could not be claimed. No changes were saved."},{status:409});}
}
