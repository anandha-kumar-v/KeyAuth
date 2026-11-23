import { User } from '../types';

const DB_KEY = 'aegis_auth_users';

const getUsers = (): Record<string, User> => {
  const usersJson = localStorage.getItem(DB_KEY);
  return usersJson ? JSON.parse(usersJson) : {};
};

const saveUsers = (users: Record<string, User>): void => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

export const authService = {
  register: (user: User): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getUsers();
        if (users[user.username]) {
          resolve({ success: false, message: 'Username already exists.' });
        } else {
          users[user.username] = user;
          saveUsers(users);
          resolve({ success: true, message: 'Registration successful!' });
        }
      }, 500);
    });
  },

  getUser: (username: string): Promise<User | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getUsers();
        resolve(users[username] || null);
      }, 300);
    });
  },
  
  getAllUsers: (): Promise<User[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const users = getUsers();
            resolve(Object.values(users));
        }, 300);
    });
  }
};
