import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { Spinner, UsersIcon, XIcon } from './common/Icons';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsLoading(true);
        const allUsers = await authService.getAllUsers();
        setUsers(allUsers);
        setIsLoading(false);
      };
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
            <div className="flex items-center space-x-2">
                <UsersIcon className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Registered Users</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner className="w-12 h-12 text-cyan-400" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No users have registered yet.</p>
          ) : (
            <ul className="space-y-3">
              {users.map((user) => (
                <li key={user.username} className="bg-gray-700 p-3 rounded-md flex items-center space-x-4">
                  <img src={user.referencePhotoUrls[0]} alt={`${user.username}'s photo`} className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"/>
                  <div>
                    <p className="text-white font-semibold">{user.username}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 border-t border-gray-700 pt-4 text-right">
            <button onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};
