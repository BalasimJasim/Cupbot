'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import {
  UsersIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Analytics {
  totalCustomers: number;
  totalBookings: number;
  totalOrders: number;
  interactions: number;
}

export default function DashboardPage() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics');
      return data;
    },
  });

  const stats = [
    {
      name: 'Total Customers',
      value: analytics?.totalCustomers ?? 0,
      icon: UsersIcon,
    },
    {
      name: 'Total Bookings',
      value: analytics?.totalBookings ?? 0,
      icon: CalendarIcon,
    },
    {
      name: 'Total Orders',
      value: analytics?.totalOrders ?? 0,
      icon: ShoppingBagIcon,
    },
    {
      name: 'Total Interactions',
      value: analytics?.interactions ?? 0,
      icon: ChatBubbleLeftRightIcon,
    },
  ];

  const chartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Customer Growth',
        data: [0, 10, 25, 40, 60, 85, 100],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
      },
    ],
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white p-4 shadow"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-2 sm:p-3">
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-14 sm:ml-16 truncate text-sm font-medium text-gray-500">
                {item.name}
              </p>
            </dt>
            <dd className="ml-14 sm:ml-16 flex items-baseline">
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {item.value.toLocaleString()}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
            Customer Growth
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Monthly customer acquisition trend
          </p>
        </div>
        <div className="relative h-[300px] sm:h-[400px]">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index' as const,
                intersect: false,
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    boxWidth: 10,
                    padding: 10,
                    font: {
                      size: 12,
                    },
                  },
                },
                tooltip: {
                  bodyFont: {
                    size: 12,
                  },
                  titleFont: {
                    size: 12,
                  },
                },
              },
              scales: {
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                      size: 10,
                    },
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    font: {
                      size: 10,
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 