"use client";

import { useState } from "react";

interface ApiKeyInputProps {
  currentKey: string;
  onSave: (key: string) => void;
}

export function ApiKeyInput({ currentKey, onSave }: ApiKeyInputProps) {
  const [key, setKey] = useState(currentKey);
  const [isEditing, setIsEditing] = useState(!currentKey);

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">OpenAI API Key</h3>
      
      {isEditing ? (
        <div className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Save Key
            </button>
            {currentKey && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setKey(currentKey);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <p className="text-green-600 font-medium">✓ API Key Configured</p>
            <p className="text-sm text-gray-600">Key: •••••••••••{currentKey.slice(-4)}</p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Change Key
          </button>
        </div>
      )}
    </div>
  );
}