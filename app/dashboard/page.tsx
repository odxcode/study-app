'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const result = await supabase.auth.getUser();
      const { data, error } = result;
      if (error || !data.user) {
        router.replace('/login');
        return;
      }

      if (active) {
        setEmail(data.user.email ?? '');
      }
    };

    void loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return;
    }
    router.replace('/login');
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-md">
        <div className="font-adequate mb-8 text-center text-5xl font-bold tracking-wide text-gray-900">
          Icarus
        </div>
        <h1 className="text-3xl font-bold">Study Tracker</h1>
        <p className="mt-4">Welcome{email ? `, ${email}` : ''}.</p>
        <a
          href="/uploads"
          className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Upload Study Video
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          className="ml-3 rounded-md border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Log Out
        </button>
      </div>
      <div className="font-adequate mx-auto mt-16 max-w-3xl rounded-lg bg-white p-8 text-center text-4xl font-bold tracking-wide text-gray-900 shadow-md">
        Defly the Odds
      </div>
    </main>
  );
}
