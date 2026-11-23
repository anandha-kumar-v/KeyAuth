import React from 'react';
import { User } from '../types';
import { ShieldExclamationIcon } from './common/Icons';

interface HoneypotDashboardProps {
  user: User;
  onLogout: () => void;
}

export const HoneypotDashboard: React.FC<HoneypotDashboardProps> = ({ user, onLogout }) => {
    
  const logAction = (action: string) => {
    console.log(`%c[HONEYPOT LOG] Attacker (${user.username}) action: ${action}`, 'color: #ffcc00; font-weight: bold;');
    alert("An unexpected error occurred. Please try again later. (Error: HP-403)");
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2">
            <ShieldExclamationIcon className="w-8 h-8 text-yellow-400 animate-pulse" />
            <h1 className="text-2xl font-bold">Key Auth Secure Dashboard</h1>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Logout
        </button>
      </header>
      
      <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-center mb-6">
        <h3 className="font-bold text-red-300">SECURITY ALERT</h3>
        <p className="text-red-400 text-sm">This session has been flagged due to anomalous activity. All actions are being logged.</p>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-6">
        <div className="flex items-center space-x-4">
            <img src={user.referencePhotoUrls[0]} alt="User" className="w-20 h-20 rounded-full object-cover border-4 border-yellow-500" />
            <div>
                <h2 className="text-3xl font-bold">Welcome, {user.username}!</h2>
                <p className="text-yellow-400 font-medium">System Status: WARNING - Session Monitored</p>
            </div>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fake Card 1 */}
        <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-yellow-300">Account Details</h3>
            <p className="text-gray-400">Manage your profile settings, security options, and personal information.</p>
            <button onClick={() => logAction('Attempted to access Account Details')} className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md w-full">Manage Account</button>
        </div>

        {/* Fake Card 2 */}
        <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-yellow-300">Project Files</h3>
            <p className="text-gray-400">Access and collaborate on your secure project files and documents.</p>
            <button onClick={() => logAction('Attempted to access Project Files')} className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md w-full">View Files</button>
        </div>
        
        {/* Fake Card 3 */}
        <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-yellow-300">Billing Information</h3>
            <p className="text-gray-400">View your subscription details and payment history.</p>
            <button onClick={() => logAction('Attempted to access Billing Information')} className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md w-full">Update Billing</button>
        </div>

        {/* Fake Admin Panel Card */}
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 md:col-span-2">
            <h3 className="text-xl font-semibold mb-3 text-red-300">Admin Panel</h3>
            <p className="text-gray-400">Access administrative functions and user management tools.</p>
            <button onClick={() => logAction('ATTEMPTED TO ACCESS ADMIN PANEL')} className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md w-full font-bold">Enter Admin Panel</button>
        </div>
      </div>
    </div>
  );
};
