'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  UsersIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Analytics {
  totalCustomers: number;
  totalBookings: number;
  totalOrders: number;
  interactions: number;
  revenueData: {
    labels: string[];
    data: number[];
  };
  bookingStatusData: {
    labels: string[];
    data: number[];
  };
  customerGrowth: {
    labels: string[];
    data: number[];
  };
}

// Client-side only component for date display
function LastUpdated() {
  return (
    <div className="text-sm text-gray-500">
      Last updated: {format(new Date(), 'MMM d, yyyy')}
    </div>
  );
}

// Client-side only component for stat value display
function StatValue({ value }: { value: number }) {
  return (
    <p className="text-lg sm:text-2xl font-semibold text-gray-900">
      {new Intl.NumberFormat('en-US').format(value)}
    </p>
  );
}

export default function AnalyticsPage() {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const revenueChartData = {
    labels: analytics?.revenueData.labels ?? [],
    datasets: [
      {
        label: 'Revenue',
        data: analytics?.revenueData.data ?? [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  const bookingStatusChartData = {
    labels: analytics?.bookingStatusData.labels ?? [],
    datasets: [
      {
        data: analytics?.bookingStatusData.data ?? [],
        backgroundColor: [
          'rgba(245, 158, 11, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(239, 68, 68, 0.5)',
        ],
        borderColor: [
          'rgb(245, 158, 11)',
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
        ],
      },
    ],
  };

  const customerGrowthData = {
    labels: analytics?.customerGrowth.labels ?? [],
    datasets: [
      {
        label: 'New Customers',
        data: analytics?.customerGrowth.data ?? [],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        bodyFont: {
          size: 11,
        },
        titleFont: {
          size: 11,
        },
        padding: 8,
        displayColors: true,
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
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Analytics</h1>
        <LastUpdated />
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6"
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
              <StatValue value={item.value} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 sm:text-lg">
              Revenue Over Time
            </h3>
            <p className="mt-1 text-sm text-gray-500">Monthly revenue trend</p>
          </div>
          <div className="relative h-[250px] sm:h-[300px]">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 sm:text-lg">
              Booking Status Distribution
            </h3>
            <p className="mt-1 text-sm text-gray-500">Current booking status breakdown</p>
          </div>
          <div className="relative h-[250px] sm:h-[300px]">
            <Doughnut
              data={bookingStatusChartData}
              options={{
                ...chartOptions,
                cutout: '60%',
              }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow sm:p-6 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 sm:text-lg">
              Customer Growth
            </h3>
            <p className="mt-1 text-sm text-gray-500">Monthly customer acquisition</p>
          </div>
          <div className="relative h-[250px] sm:h-[300px]">
            <Bar data={customerGrowthData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
} 