'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

// components
import ButtonsComponent from "./Buttons";
import LoggedComponent from "./Logged";
import NotLoggedComponent from "./NotLogged";
import LoadingComponent from "./Loading";
import ChatButton from "@/components/chat/ChatButton";

type Profile = {
    admin_level: 'user' | 'admin' | 'owner';
    discord_username: string | null;
};

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    
    // Get user and profile data
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('admin_level, discord_username')
                    .eq('id', user.id)
                    .single();
                setProfile(profileData);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // Detect scroll position
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleScroll = () => {
            const isScrolled = window.scrollY > 20;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolled]);

    return (
        <motion.header 
            className="fixed top-0 w-full z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div 
                className={`
                    container mx-auto px-2 transition-all duration-500 ease-in-out
                    ${scrolled ? 'py-1.5' : 'py-3'}
                `}
            >
                <motion.div 
                    className={`
                        relative rounded-xl flex items-center justify-between
                        backdrop-blur-md bg-transparent/70 border border-[#0e1a29]
                        px-4 ${scrolled ? 'h-30' : 'h-16'} max-w-4xl mx-auto
                    `}
                    initial={{ opacity: 0.9, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Logo */}
                    <Link
                        href="/"
                        className="z-10"
                    >
                        <div className="flex items-center justify-center">
                            <motion.div
                                whileHover={{ scale: 1.06 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="relative h-10 w-32"
                            >
                                <Image 
                                    src="/darkcloud.png"
                                    alt="Dark Logo"
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    priority
                                />
                            </motion.div>
                        </div>
                    </Link>

                    {/* Buttons */}
                    <div className="flex items-center gap-2 z-10">
                        <ButtonsComponent />
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center z-10">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                        >
                            {!loading ? 
                                user ?
                                    <LoggedComponent user={user} profile={profile} />
                                :
                                    <NotLoggedComponent />
                                : 
                                    <LoadingComponent />
                            }
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </motion.header>
    );
}
