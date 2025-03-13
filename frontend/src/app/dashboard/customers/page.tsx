'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useState } from 'react';
import { format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  telegramId: string;
  username?: string;
  interactions: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  bookings: Array<{
    serviceId: string;
    date: string;
    status: string;
  }>;
  orders: Array<{
    total: number;
    status: string;
    date: string;
  }>;
  createdAt: string;
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Customer>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers');
      return data;
    },
  });

  const filteredCustomers = customers?.filter((customer) => {
    const searchString = `${customer.firstName} ${customer.lastName} ${customer.username || ''} ${customer.telegramId}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const sortedCustomers = [...(filteredCustomers || [])].sort((a, b) => {
    if (sortField === 'createdAt') {
      return sortDirection === 'asc'
        ? new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
        : new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
    }
    return sortDirection === 'asc'
      ? String(a[sortField]).localeCompare(String(b[sortField]))
      : String(b[sortField]).localeCompare(String(a[sortField]));
  });

  const handleSort = (field: keyof Customer) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Customers</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all customers who have interacted with your bot.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="search"
              name="search"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search customers"
            />
          </div>
        </div>
      </div>

      {/* Mobile view - Cards */}
      <div className="block sm:hidden space-y-4">
        {sortedCustomers.map((customer) => (
          <div
            key={customer._id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  {customer.username ? (
                    <a
                      href={`https://t.me/${customer.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      @{customer.username}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">{customer.telegramId}</p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span>{customer.interactions.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{customer.bookings.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingBagIcon className="h-4 w-4" />
                  <span>{customer.orders.length}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view - Table */}
      <div className="hidden sm:block">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                >
                  <button
                    className="group inline-flex items-center gap-x-1"
                    onClick={() => handleSort('firstName')}
                  >
                    Name
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Telegram
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Activity
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  <button
                    className="group inline-flex items-center gap-x-1"
                    onClick={() => handleSort('createdAt')}
                  >
                    Joined
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedCustomers.map((customer) => (
                <tr key={customer._id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {customer.username ? (
                      <a
                        href={`https://t.me/${customer.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        @{customer.username}
                      </a>
                    ) : (
                      customer.telegramId
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>{customer.interactions.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{customer.bookings.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShoppingBagIcon className="h-4 w-4" />
                        <span>{customer.orders.length}</span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 