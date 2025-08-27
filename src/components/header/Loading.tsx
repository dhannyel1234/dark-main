'use client';

import {
    Avatar,
    AvatarImage
} from "@/components/ui/avatar";

import {
    ChevronDown
} from "lucide-react";

// css
import "./styles/Loading.css";

export default function NotLoggedComponent() {
    return (
        <div className="pl-[19px]">
            <div className="flex items-center cursor-pointer transition-colors duration-250 hover:bg-[#131518d8] px-2.5 py-1.5">
                <div className="h-[35px] w-[35px] relative rounded border-[1px] border-gray-800 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2f3342] to-transparent animate-loading"></div>
                </div>
                <ChevronDown className="ml-2 text-white/20" />
            </div>
        </div>
    );
};