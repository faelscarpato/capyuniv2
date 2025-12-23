import React from 'react';
import { Icon } from '../ui/Icon';

export const PricingView: React.FC = () => {
  return (
    <div className="p-4 flex flex-col h-full bg-ide-sidebar text-ide-text overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon name="CreditCard" className="text-green-400" />
            Pro Plans
        </h2>
        
        <div className="bg-gradient-to-br from-ide-accent to-purple-900 p-4 rounded-lg text-white mb-4">
            <h3 className="font-bold text-lg">Capy Pro</h3>
            <p className="text-2xl font-bold my-2">$12<span className="text-sm font-normal opacity-70">/mo</span></p>
            <ul className="text-sm space-y-2 mb-4">
                <li className="flex items-center gap-2"><Icon name="Check" size={14} /> Unlimited AI Chat</li>
                <li className="flex items-center gap-2"><Icon name="Check" size={14} /> Cloud Sync</li>
                <li className="flex items-center gap-2"><Icon name="Check" size={14} /> Team Collab</li>
            </ul>
            <button className="w-full bg-white text-ide-accent font-bold py-2 rounded text-sm hover:bg-gray-100">
                Upgrade Now
            </button>
        </div>

        <div className="bg-ide-activity p-4 rounded-lg border border-ide-border">
            <h3 className="font-bold text-gray-300">Free Tier</h3>
            <p className="text-xl font-bold my-2 text-gray-400">$0</p>
            <ul className="text-sm text-gray-500 space-y-2">
                <li>Local Workspace</li>
                <li>Basic Syntax</li>
                <li>Community Templates</li>
            </ul>
        </div>
    </div>
  );
};