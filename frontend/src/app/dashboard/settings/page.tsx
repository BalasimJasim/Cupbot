'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Switch } from '@headlessui/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Settings {
  notifications: {
    email: boolean;
    telegram: boolean;
    bookings: boolean;
    orders: boolean;
    marketing: boolean;
  };
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    telegramId: string;
  };
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Settings | null>(null);

  const { isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      setSettings(data);
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Settings) => {
      const { data } = await api.patch('/settings', newSettings);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleNotificationChange = (key: keyof Settings['notifications']) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };

    setSettings(newSettings);
    updateSettings.mutate(newSettings);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;

    const { name, value } = e.target;
    const newSettings = {
      ...settings,
      profile: {
        ...settings.profile,
        [name]: value,
      },
    };

    setSettings(newSettings);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    updateSettings.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Settings</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your profile and notification preferences.
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Profile Information
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Update your personal information and contact details.
            </p>

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    First name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={settings?.profile.firstName ?? ''}
                    onChange={handleProfileChange}
                    className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Last name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={settings?.profile.lastName ?? ''}
                    onChange={handleProfileChange}
                    className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={settings?.profile.email ?? ''}
                    onChange={handleProfileChange}
                    className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="telegramId"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Telegram ID
                  </label>
                  <input
                    type="text"
                    name="telegramId"
                    id="telegramId"
                    value={settings?.profile.telegramId ?? ''}
                    onChange={handleProfileChange}
                    className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Chatbot Settings Link */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Chatbot Configuration
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Manage your chatbot commands and automated responses.</p>
            </div>
            <div className="mt-5">
              <Link
                href="/dashboard/settings/chatbot"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Configure Chatbot
              </Link>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Notification Settings
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Choose how you want to receive notifications.
            </p>

            <div className="mt-6 space-y-6 divide-y divide-gray-100">
              {/* Communication Channels */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium text-gray-900">Communication Channels</h3>
                <div className="space-y-4">
                  <SwitchItem
                    enabled={settings?.notifications.email ?? false}
                    onChange={() => handleNotificationChange('email')}
                    label="Email notifications"
                    description="Receive updates via email"
                  />
                  <SwitchItem
                    enabled={settings?.notifications.telegram ?? false}
                    onChange={() => handleNotificationChange('telegram')}
                    label="Telegram notifications"
                    description="Get instant updates via Telegram"
                  />
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium text-gray-900">Notification Types</h3>
                <div className="space-y-4">
                  <SwitchItem
                    enabled={settings?.notifications.bookings ?? false}
                    onChange={() => handleNotificationChange('bookings')}
                    label="Booking updates"
                    description="Changes to your bookings and appointments"
                  />
                  <SwitchItem
                    enabled={settings?.notifications.orders ?? false}
                    onChange={() => handleNotificationChange('orders')}
                    label="Order updates"
                    description="Status changes for your orders"
                  />
                  <SwitchItem
                    enabled={settings?.notifications.marketing ?? false}
                    onChange={() => handleNotificationChange('marketing')}
                    label="Marketing"
                    description="News, updates, and promotional offers"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SwitchItem({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start">
      <button
        aria-checked={enabled}
        aria-label={label}
        className={`${
          enabled ? 'bg-indigo-600' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
        data-checked={enabled || undefined}
        data-headlessui-state={enabled ? 'checked' : undefined}
        role="switch"
        tabIndex={0}
        onClick={onChange}
      >
        <span
          aria-hidden="true"
          className={cn(
            enabled ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        />
      </button>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
} 