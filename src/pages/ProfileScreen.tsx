import React from 'react';
import { ArrowLeft, Edit2, Share2, Settings } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
interface ProfileScreenProps {
  onBack: () => void;
}
export function ProfileScreen({
  onBack
}: ProfileScreenProps) {
  return <div className="h-full flex flex-col bg-[#FFF8DC]">
      {/* Header Image */}
      <div className="h-40 bg-gradient-to-r from-[#8B0000] to-[#D4745E] relative">
        <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/20 rounded-full text-white">
          <ArrowLeft size={20} />
        </button>
        <button className="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-white">
          <Settings size={20} />
        </button>
      </div>

      {/* Profile Info */}
      <div className="px-6 relative -mt-12 flex-1 overflow-y-auto pb-20">
        <div className="flex justify-between items-end mb-4">
          <div className="w-24 h-24 rounded-full bg-stone-200 border-4 border-white shadow-lg relative">
            <div className="w-full h-full rounded-full bg-[#2C0E0E] flex items-center justify-center text-white text-3xl font-bold">
              R
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 bg-[#D4AF37] rounded-full text-[#8B0000] border-2 border-white">
              <Edit2 size={12} />
            </button>
          </div>
          <button className="mb-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm font-bold text-stone-600 flex items-center gap-2 shadow-sm">
            <Share2 size={14} /> Share ID
          </button>
        </div>

        <h1 className="text-2xl font-bold text-[#2C0E0E]">Rohan Kumar</h1>
        <p className="text-stone-500 text-sm mb-6">
          Playing since 2023 • Level 12
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
            <p className="text-xs text-stone-400 uppercase tracking-wider">
              Total Chips
            </p>
            <p className="text-xl font-bold text-[#D4AF37]">₹ 50,400</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
            <p className="text-xs text-stone-400 uppercase tracking-wider">
              Win Rate
            </p>
            <p className="text-xl font-bold text-[#8B0000]">42%</p>
          </div>
        </div>

        {/* Achievements */}
        <h3 className="font-bold text-[#2C0E0E] mb-3">Achievements</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-stone-100">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">
              🏆
            </div>
            <div>
              <h4 className="font-bold text-sm text-stone-800">
                Diwali Champion
              </h4>
              <p className="text-xs text-stone-500">Won 5 games in a row</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-stone-100 opacity-60">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-2xl">
              🦁
            </div>
            <div>
              <h4 className="font-bold text-sm text-stone-800">Lion Heart</h4>
              <p className="text-xs text-stone-500">Win a blind pot of 10k</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 w-full">
        <NavigationBar activeTab="profile" onTabChange={() => {}} />
      </div>
    </div>;
}