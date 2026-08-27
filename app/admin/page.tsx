'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const BUCKET = 'study-videos';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();

type Upload = {
  id: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  previewUrl?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [message, setMessage] = useState('Loading uploads...');

  useEffect(() => {
    let active = true;

    const loadUploads = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.replace('/login');
        return;
      }

      if (!ADMIN_EMAIL || userData.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        router.replace('/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('study_uploads')
        .select('id, original_name, mime_type, file_size, storage_path, status, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        setMessage(error.message);
        return;
      }

      const uploadsWithUrls = await Promise.all(
        (data ?? []).map(async (upload) => {
          const { data: signedUrl } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(upload.storage_path, 3600);
          return { ...upload, previewUrl: signedUrl?.signedUrl };
        }),
      );

      if (active) {
        setUploads(uploadsWithUrls);
        setMessage(uploadsWithUrls.length ? '' : 'No uploads are waiting for review.');
      }
    };

    void loadUploads();
    return () => {
      active = false;
    };
  }, [router]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('study_uploads').update({ status }).eq('id', id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setUploads((current) => current.map((upload) => (upload.id === id ? { ...upload, status } : upload)));
  };

  return (
    <main className="min-h-screen bg-[#2f2f2f] p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <a href="/dashboard" className="text-sm text-blue-300 underline">Back to dashboard</a>
        <h1 className="mt-4 text-3xl font-bold">Admin video review</h1>
        {message && <p className="mt-4 text-gray-200">{message}</p>}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {uploads.map((upload) => (
            <article key={upload.id} className="rounded-lg bg-[#3a3a3a] p-5 shadow-md">
              {upload.previewUrl && (upload.mime_type.startsWith('video/') ? (
                <video controls className="mb-4 max-h-72 w-full rounded-md" src={upload.previewUrl} />
              ) : (
                <img alt={upload.original_name} className="mb-4 max-h-72 w-full rounded-md object-contain" src={upload.previewUrl} />
              ))}
              <h2 className="font-semibold">{upload.original_name}</h2>
              <p className="mt-1 text-sm text-gray-300">
                {(upload.file_size / 1024 / 1024).toFixed(1)} MB · {upload.status}
              </p>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => updateStatus(upload.id, 'approved')} className="rounded-md bg-green-600 px-4 py-2 font-semibold hover:bg-green-700">Approve</button>
                <button type="button" onClick={() => updateStatus(upload.id, 'rejected')} className="rounded-md bg-red-600 px-4 py-2 font-semibold hover:bg-red-700">Reject</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
