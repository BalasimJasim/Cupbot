'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img
          className="mx-auto h-12 w-auto"
          src="/logo.svg"
          alt="Your Company"
        />
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Welcome to Business Bot
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Automate your business interactions with Telegram
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-6">
          <Link
            href="/login"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Sign in to your account
          </Link>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <Link
            href="/register"
            className="flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-600 hover:bg-indigo-50"
          >
            Register your business
          </Link>
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Why choose us?</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-4 shadow">
              <h4 className="font-medium text-gray-900">Automated Support</h4>
              <p className="mt-1 text-sm text-gray-500">24/7 customer service through Telegram</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <h4 className="font-medium text-gray-900">Easy Booking</h4>
              <p className="mt-1 text-sm text-gray-500">Manage appointments effortlessly</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <h4 className="font-medium text-gray-900">Order Management</h4>
              <p className="mt-1 text-sm text-gray-500">Handle orders seamlessly</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <h4 className="font-medium text-gray-900">Analytics</h4>
              <p className="mt-1 text-sm text-gray-500">Track your business growth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
