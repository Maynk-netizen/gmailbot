import { NextRequest, NextResponse } from "next/server";
import { connectDB } from '@/helpers/db';
import GoogleUser from "@/models/googleuser";
export async function POST(request: NextRequest) {
    try {
        const reqbody = await request.json();
const {reply} = reqbody;
await connectDB();


    try {
        const updateResult = await GoogleUser.updateOne(
            {
              email: "mayank642work@gmail.com",
              "targetEmailMessages.snippet": "hmm"
            },
            {
              $set: { "targetEmailMessages.$.reply": reply }
            }
          );
          
          console.log(updateResult);
          
        return NextResponse.json(updateResult);
    } catch (error) {
        console.log("nested t rycatch in reply failed");
        return NextResponse.json({message:"nested trycatch in reply failed"},{status:500});
    }
    
}
     catch (error) {
        console.log("main trycatch in reply failed");
        return NextResponse.json({message:"main trycatch in reply failed"},{status:500});
    }

}