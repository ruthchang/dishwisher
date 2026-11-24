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
 if(!process.env.RESEND_API_KEY||!process.env.INVITATION_FROM_EMAIL)return NextResponse.json({error:"Invitation email delivery is not configured."},{status:503});
 const token=randomBytes(32).toString("hex"),tokenHash=createHash("sha256").update(token).digest("hex"),expiresAt=new Date(Date.now()+7*86400000);
 await db.$transaction(async tx=>{
 await tx.friendInvitation.updateMany({where:{friendProfileId:profile.id,acceptedAt:null,revokedAt:null},data:{revokedAt:new Date()}});
 await tx.friendInvitation.create({data:{friendProfileId:profile.id,email,tokenHash,expiresAt}});
 });
 const link="https://dishwisher.com/invite#token="+token;
 try{
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.INVITATION_FROM_EMAIL,to:[email],subject:"Your DishWisher invitation",text:"A friend invited you to review their food recommendations for you. Open "+link+" within seven days. Do not forward this private link."}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error("Delivery failed");
 }catch{
 await db.friendInvitation.updateMany({where:{tokenHash,acceptedAt:null},data:{revokedAt:new Date()}});
 return NextResponse.json({error:"Unable to send invitation."},{status:502});
 }
 return NextResponse.json({email,expiresAt},{status:201,headers:{"Cache-Control":"no-store"}});
}
