import React from 'react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

const calculateStrength = (password: string): number => {
  if (!password) return 0;

  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
  };

  let points = 0;
  if (checks.lowercase) points++;
  if (checks.uppercase) points++;
  if (checks.number) points++;
  if (checks.specialChar) points++;

  if (checks.length) {
    if (points <= 1) return 1; // length ok, but low variety
    if (points === 2) return 2;
    if (points === 3) return 3;
    if (points >= 4) return 4;
  } else {
    return 1; // Too short is always weak
  }
  
  return 0; // Should not be reached if password has length
};


const strengthLevels = [
    { label: '', color: 'bg-gray-700' }, // score 0
    { label: 'Weak', color: 'bg-red-500' }, // score 1
    { label: 'Medium', color: 'bg-yellow-500' }, // score 2
    { label: 'Strong', color: 'bg-cyan-500' }, // score 3
    { label: 'Very Strong', color: 'bg-green-500' }, // score 4
];


export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = '' }) => {
  const score = calculateStrength(password);
  const strength = strengthLevels[score];

  return (
    <div className="mt-2 h-6">
      {password.length > 0 && (
        <>
        <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400">Password Strength</span>
            <span className={`text-xs font-bold ${
                score === 0 ? 'text-gray-400' :
                score === 1 ? 'text-red-400' :
                score === 2 ? 'text-yellow-400' :
                score === 3 ? 'text-cyan-400' : 'text-green-400'
            }`}>
            {strength.label}
            </span>
        </div>
        <div className="flex gap-1 mt-1">
            {Array.from({ length: 4 }).map((_, index) => (
            <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                score > index ? strength.color : 'bg-gray-600'
                }`}
            />
            ))}
        </div>
        </>
      )}
    </div>
  );
};
