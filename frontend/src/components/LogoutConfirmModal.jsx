import React from 'react';

export default function LogoutConfirmModal({ onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-60 backdrop-blur-sm z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Confirm Logout</h2>
                    <p className="mt-1 text-sm text-gray-600">Are you sure you want to log out?</p>
                </div>
                <div className="flex justify-center space-x-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}