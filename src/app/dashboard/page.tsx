"use client";

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Orbitron } from 'next/font/google';
import { FaEnvelope, FaQuestionCircle, FaExchangeAlt, FaInfoCircle, FaSignOutAlt } from 'react-icons/fa';
import './page.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-orbitron',
});

export default function Dashboard() {
  const [emailContext, setEmailContext] = useState('');
  const [selectedTargetEmail, setSelectedTargetEmail] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<{ 
    email: string; 
    username: string;
    profilePicture?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load email context for a selected target email
  const loadEmailContext = async (email: string) => {
    try {
      const response = await fetch(`/api/user/email-context?targetEmail=${email}`);
      if (response.ok) {
        const data = await response.json();
        setEmailContext(data.context || '');
      }
    } catch (error) {
      console.error('Error loading context:', error);
    }
  };

  // Save context to backend
  const saveEmailContext = async () => {
    if (!selectedTargetEmail || !emailContext) return;

    try {
      const response = await fetch('/api/user/email-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetEmail: selectedTargetEmail,
          context: emailContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save context');
      }

      alert('Context saved successfully!');
    } catch (error) {
      console.error('Error saving context:', error);
      alert('Failed to save context');
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchTargetEmails = async () => {
    try {
      const response = await fetch('/api/user/target-emails');
      if (response.ok) {
        const data = await response.json();
        setSelectedEmails(data.targetEmails || []);
      } else {
        console.error("Failed to fetch target emails");
      }
    } catch (error) {
      console.error("Error fetching target emails:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchTargetEmails();
  }, []);

  const handleAddEmail = async () => {
    if (newEmail && !selectedEmails.includes(newEmail)) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/target-emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: newEmail }),
        });

        if (response.ok) {
          const data = await response.json();
          setSelectedEmails(data.targetEmails);
          setNewEmail('');
        } else {
          const error = await response.json();
          console.error("Failed to add email:", error.error);
        }
      } catch (error) {
        console.error("Error adding email:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemoveEmail = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/target-emails', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedEmails(data.targetEmails);
      } else {
        const error = await response.json();
        console.error("Failed to remove email:", error.error);
      }
    } catch (error) {
      console.error("Error removing email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Auto-replied Emails',
        data: [12, 19, 15, 25, 22, 30, 28],
        borderColor: '#000000',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#000000',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'var(--font-orbitron)',
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Email Auto-reply Statistics',
        font: {
          family: 'var(--font-orbitron)',
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            family: 'var(--font-orbitron)',
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            family: 'var(--font-orbitron)',
          },
        },
      },
    },
  };

  return (
    <div className={`min-h-screen bg-white ${orbitron.variable}`}>
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900 font-orbitron">
                NIYOJAKA
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser?.profilePicture && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <img 
                    src={currentUser.profilePicture} 
                    alt={`${currentUser.username}'s profile`} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              <button onClick={() => setActiveTab('help')} className="text-gray-700 hover:text-black-600 flex items-center">
                <FaQuestionCircle className="mr-2" /> Help
              </button>
              <button onClick={() => setActiveTab('switch')} className="text-gray-700 hover:text-black-600 flex items-center">
                <FaExchangeAlt className="mr-2" /> Switch
              </button>
              <button onClick={() => setActiveTab('about')} className="text-gray-700 hover:text-black-600 flex items-center">
                <FaInfoCircle className="mr-2" /> About
              </button>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 flex items-center">
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI Context Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 font-orbitron">AI Context</h2>
              <select
                className="p-2 border border-gray-300 rounded-lg"
                value={selectedTargetEmail}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedTargetEmail(value);
                  loadEmailContext(value);
                }}
              >
                <option value="">Select Target Email</option>
                {selectedEmails.map((email) => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>
            </div>
            <textarea
              className="w-full h-40 p-4 border border-gray-300 rounded-lg"
              placeholder="Enter context for AI to consider when replying to emails..."
              value={emailContext}
              onChange={(e) => setEmailContext(e.target.value)}
            />
            <button
              onClick={saveEmailContext}
              disabled={!selectedTargetEmail || !emailContext}
              className={`w-full mt-4 px-4 py-2 bg-black text-white rounded-lg font-orbitron ${(!selectedTargetEmail || !emailContext) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
            >
              Save Context
            </button>
          </div>

          {/* Target Email Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 font-orbitron flex items-center">
              <FaEnvelope className="mr-2" />
              Target Gmail
            </h2>
            <div className="flex gap-2 my-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isLoading}
                placeholder="Enter email address"
                className="flex-1 p-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={handleAddEmail}
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white rounded-lg font-orbitron hover:bg-gray-800"
              >
                {isLoading ? 'Adding...' : 'Add'}
              </button>
            </div>
            <div className="space-y-2">
              {selectedEmails.map((email) => (
                <div key={email} className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                  <span>{email}</span>
                  <button onClick={() => handleRemoveEmail(email)} disabled={isLoading} className="text-red-500 hover:text-red-700">
                    {isLoading ? '...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Graph */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
