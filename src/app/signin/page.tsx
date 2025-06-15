"use client";
import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"; 
import {SignupFormDemo} from "@/components/SignupForm"
import axios from "axios"
export default function Signinpage(){
 
    return(
<div>

        <SignupFormDemo/>
</div>
    )
}