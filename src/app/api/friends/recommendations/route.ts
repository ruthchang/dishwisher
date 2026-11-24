import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {db} from "@/lib/db";
export async function GET(){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const profiles=await db.friendProfile.findMany({where:{createdById:u.id},orderBy:{displayName:"asc"},select:{id:true,displayName:true,restaurantRecommendations:{where:{entry:{userId:u.id}},select:{id:true,rating:true,notes:true,entry:{select:{visited:true,restaurant:{select:{name:true,address:true}}}}}},ratings:{where:{dish:{createdById:u.id}},select:{id:true,value:true,dish:{select:{name:true,cuisine:true,restaurant:{select:{name:true}}}}}},cuisineWishes:{where:{ownerId:u.id},select:{id:true,name:true,cuisine:true,notes:true}},restaurantWishes:{where:{createdById:u.id},select:{id:true,name:true,restaurantName:true}}}});
 return NextResponse.json({profiles});
}
