
"use client";
import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"; 
import {LoginFormDemo} from "@/components/Loginform"
import axios from "axios"
export default function Loginpage(){
    return(
<div>
    <LoginFormDemo/>
</div>
    )
}