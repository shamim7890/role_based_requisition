// @/app/profile/page.tsx
"use client";

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserButton } from '@clerk/nextjs';

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  const role = user?.publicMetadata?.role as string || 'No role assigned';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    } else if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Profile Access</h1>
          <p className="text-gray-400 mb-6">Please sign in to view your profile.</p>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {getGreeting()}, {user?.firstName || user?.fullName || 'User'}!
              </h1>
              <p className="text-blue-100 text-lg">
                Your Profile in Chemical Requisition System
              </p>
              <p className="text-blue-200 text-sm mt-2 capitalize">
                Role: <span className="font-semibold">{role}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Current Time</p>
              <p className="text-white text-2xl font-bold">
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-blue-200 text-sm">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Profile Details</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={user?.primaryEmailAddress?.emailAddress || ''}
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 opacity-50 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">User ID</label>
              <p className="text-gray-200 font-mono bg-gray-700 px-3 py-2 rounded">
                {user?.id?.slice(0, 12)}...
              </p>
            </div>
            {isEditing && (
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                Save Changes
              </button>
            )}
          </form>
        </div>

        {/* Account Status */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Account Status</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🟢</div>
              <p className="text-gray-400 text-sm">Account</p>
              <p className="text-green-400 font-semibold">Active</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-gray-400 text-sm">2FA</p>
              <p className="text-green-400 font-semibold">Enabled</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-gray-400 text-sm">Joined</p>
              <p className="text-gray-200 font-semibold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">👤</div>
              <p className="text-gray-400 text-sm">Role Permissions</p>
              <p className={`font-semibold ${
                role === 'admin' ? 'text-green-400' : 'text-blue-400'
              }`}>
                {role === 'admin' ? 'Full Access' : 'Limited Access'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}