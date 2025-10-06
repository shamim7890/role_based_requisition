// @/components/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useUser();
    const role = user?.publicMetadata?.role as string;

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    const toggleSidebar = () => setIsOpen(!isOpen);

    const navItems = [
                {
            title: 'Home',
            path: '/',
            icon: '📊',
            roles: ['analyst', 'technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager', 'admin']
        },
        {
            title: 'Dashboard',
            path: '/dashboard',
            icon: '📊',
            roles: ['analyst', 'technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager', 'admin']
        },
        {
            title: 'Chemical Requisitions',
            path: '/requisitions',
            icon: '🧪',
            roles: ['analyst', 'technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager', 'admin']
        },
        {
            title: 'Execories Requisitions',
            path: '/execories',
            icon: '📦',
            roles: ['analyst', 'technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager', 'admin']
        },
        {
            title: 'Approvals',
            path: '/approvals',
            icon: '✅',
            roles: ['technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager', 'admin']
        },
        {
            title: 'Admin Panel',
            path: '/admin',
            icon: '⚙️',
            roles: ['admin']
        },
        {
            title: 'Profile',
            path: '/profile',
            icon: '👤',
            roles: ['analyst', 'technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager', 'admin']
        }
    ];

    const visibleNavItems = navItems.filter(item => 
        !role || item.roles.includes(role)
    );

    const getRoleBadge = () => {
        const roleLabels: Record<string, { label: string; color: string }> = {
            analyst: { label: 'Analyst', color: 'bg-blue-600' },
            technical_manager_c: { label: 'TM (C)', color: 'bg-green-600' },
            technical_manager_m: { label: 'TM (M)', color: 'bg-green-700' },
            senior_assistant_director: { label: 'SAD', color: 'bg-yellow-600' },
            quality_assurance_manager: { label: 'QA Manager', color: 'bg-purple-600' },
            admin: { label: 'Admin', color: 'bg-red-600' }
        };

        const roleInfo = roleLabels[role];
        if (!roleInfo) return null;

        return (
            <div className={`${roleInfo.color} px-3 py-1 rounded-full text-xs font-semibold text-white`}>
                {roleInfo.label}
            </div>
        );
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-gray-100 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full bg-gray-800 text-gray-100 shadow-2xl z-40 transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    w-64 flex flex-col
                `}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">IMS Portal</h2>
                    <p className="text-gray-400 text-sm mt-1">Inventory Management</p>
                </div>

                {/* User Info */}
                <SignedIn>
                    <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <UserButton afterSignOutUrl="/" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-100 truncate">
                                    {user?.fullName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {user?.emailAddresses?.[0]?.emailAddress}
                                </p>
                            </div>
                        </div>
                        {getRoleBadge()}
                    </div>
                </SignedIn>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <SignedIn>
                        <ul className="space-y-2">
                            {visibleNavItems.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        href={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                            ${isActive(item.path)
                                                ? 'bg-blue-600 text-white font-semibold'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }
                                        `}
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        <span>{item.title}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </SignedIn>

                    <SignedOut>
                        <div className="space-y-3">
                            <p className="text-gray-400 text-sm px-4">Please sign in to access the portal</p>
                        </div>
                    </SignedOut>
                </nav>

                {/* Auth Buttons */}
                <div className="p-4 border-t border-gray-700">
                    <SignedOut>
                        <div className="space-y-3">
                            <SignInButton mode="modal">
                                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold">
                                    Sign Up
                                </button>
                            </SignUpButton>
                        </div>
                    </SignedOut>

                    <SignedIn>
                        <div className="text-xs text-gray-500 text-center">
                            <p>Logged in as</p>
                            <p className="font-semibold text-gray-400 truncate">
                                {user?.firstName || 'User'}
                            </p>
                        </div>
                    </SignedIn>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500 text-center">
                        © 2025 IMS Portal v1.0
                    </p>
                </div>
            </aside>
        </>
    );
}