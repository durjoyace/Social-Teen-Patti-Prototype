import React from 'react';
import { motion } from 'framer-motion';
interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}
export function Layout({
  children,
  className = ''
}: LayoutProps) {
  return <div className="min-h-screen w-full bg-stone-900 flex justify-center items-center font-sans">
      {/* Mobile Container */}
      <div className="w-full max-w-md h-[100dvh] bg-[#FFF8DC] relative overflow-hidden shadow-2xl flex flex-col">
        {/* Background Texture/Pattern Overlay (Subtle) */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B0000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

        <main className={`flex-1 relative z-10 overflow-y-auto scrollbar-hide ${className}`}>
          {children}
        </main>
      </div>
    </div>;
}