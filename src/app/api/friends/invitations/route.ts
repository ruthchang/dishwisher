import {NextResponse} from "next/server";
import {randomBytes,createHash} from "crypto";
import {getCurrentUser} from "@/lib/auth";
import {db} from "@/lib/db";
export async function POST(req:Request){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await req.json().catch(()=>null);
 if(typeof b?.friendProfileId!=="string")return NextResponse.json({error:"Friend required"},{status:400});
 const profile=await db.friendProfile.findFirst({where:{id:b.friendProfileId,createdById:user.id,claimedUserId:null}});
 if(!profile)return NextResponse.json({error:"Friend unavailable"},{status:404});
 if(b.action==="revoke"){await db.friendInvitation.updateMany({where:{friendProfileId:profile.id,acceptedAt:null,revokedAt:null},data:{revokedAt:new Date()}});return NextResponse.json({ok:true});}
 const email=typeof b.email==="string"?b.email.trim().toLowerCase():profile.email;
 if(!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Valid recipient email required"},{status:400});
 const token=randomBytes(32).toString("hex"),tokenHash=createHash("sha256").update(token).digest("hex"),expiresAt=new Date(Date.now()+7*86400000);
 await db.$transaction(async tx=>{
 await tx.friendInvitation.updateMany({where:{friendProfileId:profile.id,acceptedAt:null,revokedAt:null},data:{revokedAt:new Date()}});
 await tx.friendInvitation.create({data:{friendProfileId:profile.id,email,tokenHash,expiresAt}});
 });
 return NextResponse.json({token,email,expiresAt},{status:201,headers:{"Cache-Control":"no-store"}});
}
