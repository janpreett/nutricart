import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserDetailsScreen() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-lg shadow p-6 space-y-6">

                {/* Icon and Title */}
                <div className="text-center">
                    <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-indigo-100">
                        <svg
                            className="h-7 w-7 text-indigo-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5.121 17.804A3 3 0 018 17h8a3 3 0 012.879.804M12 7a4 4 0 110 8 4 4 0 010-8z"
                            />
                        </svg>
                    </div>
                    <h1 className="mt-4 text-2xl font-extrabold text-gray-900">Your Details</h1>
                    <p className="mt-1 text-sm text-gray-600">View your account information below</p>
                </div>

                {/* User Info */}
                <div className="space-y-4">
                    <div className="flex gap-6">
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-700">First Name</p>
                            <p className="text-sm text-gray-900">{user?.first_name || 'N/A'}</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-700">Last Name</p>
                            <p className="text-sm text-gray-900">{user?.last_name || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{user?.email || 'N/A'}</p>
                    </div>
                </div>

                {/* Back Button */}
                <div className="pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-indigo-600 hover:underline text-sm"
                    >
                        ← Back to Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
