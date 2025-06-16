"use client";

import React, { useState, useEffect } from 'react';
import { Orbitron } from 'next/font/google';
import { FaEnvelope, FaQuestionCircle, FaExchangeAlt, FaInfoCircle, FaSignOutAlt, FaReply, FaClock } from 'react-icons/fa';
import './page.css';

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
  
  interface Reply {
    email: string;
    messageId: string;
    reply: string;
    subject: string;
    snippet: string;
    date: Date;
    isRead: boolean;
  }
  
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

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

  // Fetch user replies
  const fetchUserReplies = async () => {
    setRepliesLoading(true);
    try {
      const response = await fetch('/api/user/replies');
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies || []);
      } else {
        console.error("Failed to fetch replies");
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
    } finally {
      setRepliesLoading(false);
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
    fetchUserReplies();
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

        {/* Replies Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 font-orbitron flex items-center">
              <FaReply className="mr-2" />
              AI Replies ({replies.length})
            </h2>
            <button
              onClick={fetchUserReplies}
              disabled={repliesLoading}
              className="px-4 py-2 bg-black text-white rounded-lg font-orbitron hover:bg-gray-800 disabled:opacity-50"
            >
              {repliesLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {repliesLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaReply className="mx-auto mb-4 text-4xl" />
              <p className="text-lg">No replies found</p>
              <p className="text-sm">AI replies will appear here once they are generated</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {replies.map((reply, index) => (
                <div
                  key={reply.messageId || index}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    reply.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 font-orbitron">
                          {reply.subject || 'No Subject'}
                        </h3>
                        {!reply.isRead && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        To: {reply.email}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <FaClock className="mr-1" />
                        {formatDate(reply.date)}
                      </div>
                    </div>
                  </div>
                  
                  {reply.snippet && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 font-medium mb-1">Original Message:</p>
                      <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded italic">
                        {truncateText(reply.snippet, 150)}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">AI Reply:</p>
                    <p className="text-sm text-gray-800 bg-white p-3 rounded border-l-4 border-black">
                      {truncateText(reply.reply, 200)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}