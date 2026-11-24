import {NextResponse} from "next/server";
import {createHash} from "crypto";
import {getCurrentUser} from "@/lib/auth";
import {db} from "@/lib/db";
export async function POST(req:Request){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Sign in to review your invitation."},{status:401});
 const b=await req.json().catch(()=>null);
 if(typeof b?.token!=="string"||!/^[a-f0-9]{64}$/.test(b.token))return NextResponse.json({error:"Invalid invitation."},{status:400});
 const invitation=await db.friendInvitation.findFirst({where:{tokenHash:createHash("sha256").update(b.token).digest("hex"),email:user.email.toLowerCase(),acceptedAt:null,revokedAt:null,expiresAt:{gt:new Date()},friendProfile:{claimedUserId:null}},include:{friendProfile:{include:{ratings:{select:{id:true,value:true,dish:{select:{name:true,cuisine:true,restaurant:{select:{name:true}}}}}},restaurantRecommendations:{select:{id:true,rating:true,entry:{select:{restaurant:{select:{name:true,address:true}}}}}},cuisineWishes:{select:{id:true,name:true,cuisine:true}},restaurantWishes:{select:{id:true,name:true,restaurantName:true}}}}}});
 if(!invitation)return NextResponse.json({error:"Invitation unavailable for this account."},{status:404});
 const p=invitation.friendProfile;
 return NextResponse.json({displayName:p.displayName,ratings:p.ratings,restaurants:p.restaurantRecommendations,cuisineWishes:p.cuisineWishes,restaurantWishes:p.restaurantWishes},{headers:{"Cache-Control":"no-store"}});
}
