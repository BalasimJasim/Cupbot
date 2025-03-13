'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Command {
  command: string;
  description: string;
  enabled: boolean;
}

interface AutoResponse {
  trigger: string;
  response: string;
}

interface ChatbotSettings {
  commandList: Command[];
  autoResponses: AutoResponse[];
}

const defaultSettings: ChatbotSettings = {
  commandList: [],
  autoResponses: []
};

export default function ChatbotSettingsPage() {
  const queryClient = useQueryClient();
  const [newCommand, setNewCommand] = useState<Command>({
    command: '',
    description: '',
    enabled: true,
  });
  const [newAutoResponse, setNewAutoResponse] = useState<AutoResponse>({
    trigger: '',
    response: '',
  });

  const { data: settings = defaultSettings, isLoading } = useQuery<ChatbotSettings>({
    queryKey: ['chatbotSettings'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/chatbot/settings');
        return data || defaultSettings;
      } catch (error) {
        console.error('Error fetching settings:', error);
        return defaultSettings;
      }
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: ChatbotSettings) => {
      const { data } = await api.patch('/chatbot/settings', newSettings);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbotSettings'] });
    },
  });

  const handleAddCommand = () => {
    if (!newCommand.command || !newCommand.description) return;

    updateSettings.mutate({
      ...settings,
      commandList: [...(settings.commandList || []), newCommand],
    });

    setNewCommand({
      command: '',
      description: '',
      enabled: true,
    });
  };

  const handleRemoveCommand = (index: number) => {
    if (!settings.commandList) return;
    
    updateSettings.mutate({
      ...settings,
      commandList: settings.commandList.filter((_, i) => i !== index),
    });
  };

  const handleToggleCommand = (index: number) => {
    if (!settings.commandList) return;
    
    const updatedCommands = [...settings.commandList];
    updatedCommands[index].enabled = !updatedCommands[index].enabled;

    updateSettings.mutate({
      ...settings,
      commandList: updatedCommands,
    });
  };

  const handleAddAutoResponse = () => {
    if (!newAutoResponse.trigger || !newAutoResponse.response) return;

    updateSettings.mutate({
      ...settings,
      autoResponses: [...(settings.autoResponses || []), newAutoResponse],
    });

    setNewAutoResponse({
      trigger: '',
      response: '',
    });
  };

  const handleRemoveAutoResponse = (index: number) => {
    if (!settings.autoResponses) return;
    
    updateSettings.mutate({
      ...settings,
      autoResponses: settings.autoResponses.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Chatbot Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your chatbot commands and automated responses.
        </p>
      </div>

      {/* Commands Section */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Custom Commands
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Add custom commands that users can trigger with a / prefix.</p>
          </div>

          {/* Add New Command Form */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="command" className="sr-only">
                Command
              </label>
              <input
                type="text"
                name="command"
                id="command"
                value={newCommand.command}
                onChange={(e) =>
                  setNewCommand({ ...newCommand, command: e.target.value })
                }
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Command (e.g., menu)"
              />
            </div>
            <div>
              <label htmlFor="description" className="sr-only">
                Description
              </label>
              <input
                type="text"
                name="description"
                id="description"
                value={newCommand.description}
                onChange={(e) =>
                  setNewCommand({ ...newCommand, description: e.target.value })
                }
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Description"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCommand}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add Command
            </button>
          </div>

          {/* Commands List */}
          <div className="mt-6">
            <ul role="list" className="divide-y divide-gray-100">
              {settings?.commandList.map((command, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-x-6 py-5"
                >
                  <div className="flex min-w-0 gap-x-4">
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-gray-900">
                        /{command.command}
                      </p>
                      <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                        {command.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-x-4">
                    <button
                      type="button"
                      onClick={() => handleToggleCommand(index)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        command.enabled
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                      }`}
                    >
                      {command.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCommand(index)}
                      className="rounded-full bg-white p-1 text-gray-900 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Auto-Responses Section */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Auto-Responses
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Set up automatic responses for specific keywords or phrases.</p>
          </div>

          {/* Add New Auto-Response Form */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="trigger" className="sr-only">
                Trigger
              </label>
              <input
                type="text"
                name="trigger"
                id="trigger"
                value={newAutoResponse.trigger}
                onChange={(e) =>
                  setNewAutoResponse({
                    ...newAutoResponse,
                    trigger: e.target.value,
                  })
                }
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Trigger word/phrase"
              />
            </div>
            <div>
              <label htmlFor="response" className="sr-only">
                Response
              </label>
              <input
                type="text"
                name="response"
                id="response"
                value={newAutoResponse.response}
                onChange={(e) =>
                  setNewAutoResponse({
                    ...newAutoResponse,
                    response: e.target.value,
                  })
                }
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Automated response"
              />
            </div>
            <button
              type="button"
              onClick={handleAddAutoResponse}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add Response
            </button>
          </div>

          {/* Auto-Responses List */}
          <div className="mt-6">
            <ul role="list" className="divide-y divide-gray-100">
              {settings?.autoResponses.map((autoResponse, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-x-6 py-5"
                >
                  <div className="flex min-w-0 gap-x-4">
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-gray-900">
                        {autoResponse.trigger}
                      </p>
                      <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                        {autoResponse.response}
                      </p>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAutoResponse(index)}
                      className="rounded-full bg-white p-1 text-gray-900 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 