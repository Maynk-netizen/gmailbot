"use client";
import React from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "./lib/utils";
import {sendEmail} from '@/helpers/mailer'
import { NextResponse } from "next/server";
import { useState,useEffect } from "react";
import axios from "axios";
export function SignupFormDemo() {

  const [user,setUser] = React.useState( {
email:"",
password:""
  })
  const execution = async()=>{
    try {
      await axios.post('/api/changepass',user)
    } catch (error) {
      return NextResponse.json(error)
    }
  }

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black" style={{marginTop:"8rem"}}>
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
       Enter your email and fresh password
      </h2>
    

      <form className="my-8" onSubmit = {(e)=>{e.preventDefault()}}>
   
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" placeholder="projectmayhem@fc.com" type="email" value={user.email} onChange={(e)=>setUser({...user,email:e.target.value})} />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input id="password" placeholder="••••••••" type="password" value ={user.password} onChange={(e)=>setUser({...user,password:e.target.value})}/>
        </LabelInputContainer>
       

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
          type="submit" onClick={execution}
        >
          Reset &rarr;
          <BottomGradient />
        </button>

    
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
