"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Edit2, X, Save } from "lucide-react";

import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

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
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">OpenAI API Key</h3>
          <p className="text-sm text-gray-600">Manage your OpenAI API key for classifications.</p>
        </div>
      </div>

      <div className="mt-4">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="api-key" className="mb-1">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={key}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!key.trim()}
                className="inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Key
              </Button>

              {currentKey && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setKey(currentKey);
                  }}
                  className="inline-flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>

            <p className="text-sm text-gray-600">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-green-600"><Check className="h-4 w-4" /></span>
                <p className="text-sm font-medium text-gray-800">API Key Configured</p>
              </div>
              <p className="text-sm text-gray-600">Key: •••••••••••{currentKey?.slice(-4)}</p>
            </div>

            <Button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Change Key
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  );
}