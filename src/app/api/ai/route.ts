
import { ChatOpenAI } from "@langchain/openai";
import {PromptTemplate} from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import * as dotenv from "dotenv";
import { NextRequest,NextResponse } from "next/server";
import { connectDB } from '@/helpers/db';
import GoogleUser from "@/models/googleuser";
import { sendEmail } from "@/helpers/mailer";
dotenv.config();
await connectDB();

const Template = "{context}{question}?"
const promptTemplate=new PromptTemplate({
    template:Template,
    inputVariables:["question","context"],
})
const model =  new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.5,
   
  });
const chain = new LLMChain({
    llm:model,
    prompt:promptTemplate,
})
export async  function POST(request: NextRequest) {
    try {
       const reqbody = await request.json();
        const {senderemail,snippet,subject,toHeader,fromHeader} = reqbody;
        console.log(`senderemail:${senderemail},${snippet},${subject},${toHeader.match(/<([^>]+)>/)[1]},${fromHeader}`);
        const finaltoheader =toHeader.match(/<([^>]+)>/)[1]
        const finthat = await GoogleUser.findOne({email:finaltoheader},{emailContexts:{$elemMatch:{targetEmail:senderemail}}},);
        if(!finthat){
            return NextResponse.json({
                message:"no user found"
            })
        }
            const usrcontext = finthat.emailContexts[0].context;
            console.log(usrcontext);
        
        try {
            const res = await chain.call({
          context:`you are a email reply generator who acts like the receiver and replies to the mails,${usrcontext}`,
          question:`from:${fromHeader},subject:${subject},email:${snippet}`
      })
      await sendEmail({
        email:senderemail,
        subject:subject||'',
        reply:res.text
      })
      console.log(res);
      return NextResponse.json({
        message:"success",
        data:res
      })
      } catch (error) {
          console.log("error in nested ai route");
          return NextResponse.json({
            message:"error in nested ai route"
        })
      }
      
        

    } catch (error) {
        console.error(error);

        return NextResponse.json({
            message:"error in ai route"
        })
    }
}
