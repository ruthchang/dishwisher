import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const admin = !!process.env.RESTAURANT_ADMIN_EMAIL && user.email.toLowerCase() === process.env.RESTAURANT_ADMIN_EMAIL.trim().toLowerCase();
  const restaurants = await db.restaurant.findMany({orderBy:{name:"asc"},include:{dishes:{select:{createdById:true}}}});
  return NextResponse.json({restaurants:restaurants.map(({dishes,...r})=>({...r,count:dishes.length,manageable:admin || (dishes.length>0 && dishes.every(d=>d.createdById===user.id))}))});
}
export async function POST(req:Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const admin = !!process.env.RESTAURANT_ADMIN_EMAIL && user.email.toLowerCase() === process.env.RESTAURANT_ADMIN_EMAIL.trim().toLowerCase();
  const b = await req.json().catch(()=>null);
  if (!b || typeof b.id !== "string") return NextResponse.json({error:"Invalid request"},{status:400});
  try {
    await db.$transaction(async tx=>{
      const r=await tx.restaurant.findUnique({where:{id:b.id},include:{dishes:{select:{createdById:true}}}});
      if (!r || (!admin && (!r.dishes.length || r.dishes.some(d=>d.createdById!==user.id)))) throw new Error("Restaurant requires administrator access.");
      if (b.action==="delete") {
        if(r.dishes.length) throw new Error("Move dishes to another restaurant before deleting.");
        await tx.restaurant.delete({where:{id:r.id}});
      } else if (b.action==="edit") {
        const name=typeof b.name==="string"?b.name.trim():"";
        const address=typeof b.address==="string"?b.address.trim():"";
        if(!name || name.length>200 || address.length>500) throw new Error("Invalid name or address.");
        await tx.restaurant.update({where:{id:r.id},data:{name,address}});
        await tx.dish.updateMany({where:{restaurantId:r.id},data:{customRestaurantName:name,customRestaurantAddress:address}});
      } else if (b.action==="merge") {
        if(typeof b.targetId!=="string" || b.targetId===r.id) throw new Error("Choose a different restaurant.");
        const target=await tx.restaurant.findUnique({where:{id:b.targetId}});
        if(!target) throw new Error("Target not found.");
        await tx.dish.updateMany({where:{restaurantId:r.id},data:{restaurantId:target.id,customRestaurantName:target.name,customRestaurantAddress:target.address,yelpBusinessUrl:null}});
        await tx.restaurant.delete({where:{id:r.id}});
      } else throw new Error("Unknown action.");
    },{isolationLevel:"Serializable"});
    return NextResponse.json({ok:true});
  } catch(e) {return NextResponse.json({error:e instanceof Error && !e.message.includes("prisma") ? e.message : "Could not save changes."},{status:400});}
}
