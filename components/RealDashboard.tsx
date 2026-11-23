import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheckIcon, UsersIcon } from './common/Icons';
import { UserManagementModal } from './UserManagementModal';
import { SuspiciousActivityLog } from './SuspiciousActivityLog';

interface RealDashboardProps {
  user: User;
  onLogout: () => void;
}

export const RealDashboard: React.FC<RealDashboardProps> = ({ user, onLogout }) => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  return (
    <>
      <UserManagementModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-bold">Admin Security Dashboard</h1>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Logout
          </button>
        </header>

        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex items-center space-x-4">
              <img src={user.referencePhotoUrls[0]} alt="User" className="w-20 h-20 rounded-full object-cover border-4 border-cyan-500" />
              <div>
                  <h2 className="text-3xl font-bold">Welcome, {user.username}!</h2>
                  <p className="text-green-400 font-medium">System Status: SECURE - Authenticated</p>
              </div>
          </div>
        </div>
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side column for actions */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-3 text-cyan-300">Account Details</h3>
                    <p className="text-gray-400">Manage your profile settings, security options, and personal information.</p>
                    <button className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md w-full">Manage Account</button>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6 flex flex-col">
                    <div className="flex-grow">
                        <div className="flex items-center space-x-3 mb-3">
                        <UsersIcon className="w-6 h-6 text-cyan-300" />
                        <h3 className="text-xl font-semibold text-cyan-300">User Management</h3>
                        </div>
                        <p className="text-gray-400">View and manage all registered user accounts in the system.</p>
                    </div>
                    <button onClick={() => setIsUserModalOpen(true)} className="mt-4 bg-cyan-800 hover:bg-cyan-700 text-white py-2 px-4 rounded-md w-full">View Users</button>
                </div>
            </div>

            {/* Right side for the activity log */}
            <div className="lg:col-span-2">
               <SuspiciousActivityLog />
            </div>
        </div>

      </div>
    </>
  );
};
