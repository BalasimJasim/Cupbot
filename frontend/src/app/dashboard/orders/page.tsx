'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Order {
  _id: string;
  items: Array<{
    serviceId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date: string;
  customer: {
    id: string;
    name: string;
    telegramId: string;
  };
}

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  confirmed: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  completed: 'bg-green-50 text-green-800 ring-green-600/20',
  cancelled: 'bg-red-50 text-red-800 ring-red-600/20',
};

const statusIcons = {
  pending: ClockIcon,
  confirmed: CheckCircleIcon,
  completed: CurrencyDollarIcon,
  cancelled: XCircleIcon,
};

const buttonColors = {
  confirm: 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600',
  complete: 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600',
  cancel: 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600',
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      const status = statusFilter === 'all' ? '' : statusFilter;
      const { data } = await api.get('/orders' + (status ? `?status=${status}` : ''));
      return data;
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      const { data } = await api.patch('/orders/' + orderId, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: keyof typeof statusIcons }) => {
    const Icon = statusIcons[status];
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
          statusColors[status]
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const ActionButtons = ({ order }: { order: Order }) => {
    if (order.status === 'completed' || order.status === 'cancelled') return null;

    return (
      <div className="flex gap-2">
        {order.status === 'pending' && (
          <>
            <button
              onClick={() =>
                updateOrderStatus.mutate({
                  orderId: order._id,
                  status: 'confirmed',
                })
              }
              className={cn(
                'rounded px-2 py-1 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                buttonColors.confirm
              )}
            >
              Confirm
            </button>
            <button
              onClick={() =>
                updateOrderStatus.mutate({
                  orderId: order._id,
                  status: 'cancelled',
                })
              }
              className={cn(
                'rounded px-2 py-1 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                buttonColors.cancel
              )}
            >
              Cancel
            </button>
          </>
        )}
        {order.status === 'confirmed' && (
          <button
            onClick={() =>
              updateOrderStatus.mutate({
                orderId: order._id,
                status: 'completed',
              })
            }
            className={cn(
              'rounded px-2 py-1 text-xs font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              buttonColors.complete
            )}
          >
            Complete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all your customer orders and track their status.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full rounded-md border-0 pl-9 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Mobile view - Cards */}
      <div className="block sm:hidden space-y-4">
        {orders?.map((order) => (
          <div
            key={order._id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {order.customer.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {format(new Date(order.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
                  ${order.total.toFixed(2)}
                </div>
                <ActionButtons order={order} />
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
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Customer
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Total
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders?.map((order) => (
                <tr key={order._id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {order.customer.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {format(new Date(order.date), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <ActionButtons order={order} />
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