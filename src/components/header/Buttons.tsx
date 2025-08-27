'use client';

import Link from "next/link";
import { useEffect, useState } from 'react';
import { ExternalLink } from "lucide-react";
import { motion } from 'framer-motion';

// components
import LoggedComponent from "./Logged";
import NotLoggedComponent from "./NotLogged";
import LoadingComponent from "./Loading";

// saves
const DISCORD_GUILD_INVITE = "https://discord.gg/K8wraT7Jx2";

export default function ButtonsComponent() {

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };
    
    const itemVariants = {
        hidden: { y: -10, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="flex items-center gap-6">
            <motion.nav 
                className="hidden md:flex items-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Navegação moderna com animações */}
                <motion.ul className="flex items-center space-x-3">
                    {/* Home - Sempre o primeiro */}
                    <motion.li variants={itemVariants}>
                        <Link href="/" passHref>
                            <motion.div 
                                className="relative px-3 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200"
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                Início
                            </motion.div>
                        </Link>
                    </motion.li>

                    {/* Assinatura */}
                    <motion.li variants={itemVariants}>
                        <Link href="/order" passHref>
                            <motion.div 
                                className="relative px-3 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200"
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                Assinatura
                            </motion.div>
                        </Link>
                    </motion.li>

                    {/* Discord - mantém a funcionalidade original */}
                    <motion.li variants={itemVariants}>
                        <Link href={DISCORD_GUILD_INVITE} passHref target="_blank" rel="noopener noreferrer">
                            <motion.div 
                                className="relative px-3 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200 flex items-center gap-1.5"
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                Discord
                                <motion.div 
                                    initial={{ rotate: 0 }}
                                    whileHover={{ rotate: 45 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </motion.div>
                            </motion.div>
                        </Link>
                    </motion.li>
                    
                    {/* FAQ */}
                    <motion.li variants={itemVariants}>
                        <Link href="/faq" passHref>
                            <motion.div 
                                className="relative px-3 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200"
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                FAQ
                            </motion.div>
                        </Link>
                    </motion.li>
                </motion.ul>
            </motion.nav>
        </div>
    );
};