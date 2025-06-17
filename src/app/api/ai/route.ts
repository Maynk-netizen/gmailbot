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
        console.log(`senderemail:${senderemail},snippet:${snippet},subject:${subject},toheader:${toHeader},fromheader:${fromHeader.match(/^(.*?)\s*</)[1]}`);
        
        // Extract email from toHeader
        const toEmailMatch = toHeader.match(/<([^>]+)>/);
        const toEmail = toEmailMatch ? toEmailMatch[1] : toHeader;
        
        const finthat = await GoogleUser.findOne({email:toEmail},{emailContexts:{$elemMatch:{targetEmail:senderemail}}},);
        if(!finthat){
            return NextResponse.json({
                message:"no user found"
            })
        }
            const usrcontext = finthat.emailContexts[0].context;
            console.log(usrcontext);
        
        try {
            const res = await chain.call({
          context:`you are a email reply generator who acts like the receiver and replies to the mails,${usrcontext},do not include subject or subject :Re in your responses`,
          question:`from:${fromHeader},subject:${subject},email:${snippet}`
      })
      await sendEmail({
        email:senderemail,
        subject:subject||'',
        reply:res.text,
        tomail:toEmail
      })
      console.log(res);
    
      const updateReply = await GoogleUser.updateOne(
        {
          email: toEmail,
        },
        {
          $push: {
            replies: {
              email: senderemail,
              subject: subject || '',
              snippet: snippet || '',
              reply: res.text,
              date: new Date(),
              isRead: false
            }
          }
        }
      );
      
      console.log("Updated:", updateReply);
      
    if(!updateReply){
        console.log("error in updating reply");

        return NextResponse.json({
            message:"error in updating reply"
        })
    }
      console.log(updateReply);
      return NextResponse.json({
        message:"success",
        data:res
      })
      } catch (error) {
          console.log("error in nested ai route" ,error);
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
