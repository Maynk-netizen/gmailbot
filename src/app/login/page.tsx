"use client";

import { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import './login.css';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/google';
  };

  return (
    <div id="login_cont"className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Gmail Bot
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your AI-powered Gmail assistant
          </p>
        </div>
        <div>
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <FaGoogle className="h-5 w-5 text-white" />
            </span>
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}