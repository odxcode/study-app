'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const BUCKET = 'study-videos';
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png']);

type Upload = {
  id: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  previewUrl?: string | null;
};

export default function UploadsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setMessage('');
  };

  const fetchUserUploads = useCallback(async () => {
    setMessage('Loading uploads...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('study_uploads')
      .select('id, original_name, mime_type, file_size, storage_path, status, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const withUrls = await Promise.all(
      ((data ?? []) as Upload[]).map(async (u) => {
        try {
          const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(u.storage_path, 3600);
          return { ...u, previewUrl: signed?.signedUrl ?? null };
        } catch {
          return { ...u, previewUrl: null };
        }
      }),
    );

    setUploads(withUrls);
    setMessage('');
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchUserUploads();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUserUploads]);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!file) {
      setMessage('Choose a video or image first.');
      return;
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      setMessage('Use an MP4, WebM, QuickTime video, JPG, or PNG file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage('Files must be smaller than 100 MB.');
      return;
    }

    setIsUploading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setIsUploading(false);
      router.replace('/login');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const storagePath = `${userData.user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setIsUploading(false);
      setMessage(`Storage upload failed: ${uploadError.message}`);
      return;
    }

    const { error: metadataError } = await supabase.from('study_uploads').insert({
      user_id: userData.user.id,
      storage_path: storagePath,
      original_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      status: 'pending',
    });

    if (metadataError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      setIsUploading(false);
      setMessage(`Upload record failed: ${metadataError.message}`);
      return;
    }

    setFile(null);
    setIsUploading(false);
    setMessage('Upload submitted for admin review.');
    void fetchUserUploads();
  };

  const filtered = uploads.filter((u) => u.status === activeTab);

  return (
    <main className="min-h-screen bg-[#2f2f2f] p-8 text-white">
      <div className="mx-auto max-w-3xl rounded-lg bg-[#3a3a3a] p-8 shadow-md">
        <a href="/dashboard" className="text-sm text-blue-300 underline">
          Back to dashboard
        </a>
        <h1 className="mt-4 text-3xl font-bold">Study Uploads</h1>
        <p className="mt-2 text-gray-200">Upload a short video or picture of yourself studying.</p>

        <form onSubmit={handleUpload} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold" htmlFor="study-file">
            Study video or image
          </label>
          <input
            id="study-file"
            type="file"
            accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png"
            onChange={handleFileChange}
            className="block w-full rounded-md border border-gray-300 p-3 bg-[#2f2f2f]"
          />
          <p className="text-sm text-gray-300">MP4, WebM, QuickTime, JPG, or PNG; maximum 100 MB.</p>
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-md bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Submit for Review'}
          </button>
        </form>

        {message && <p className="mt-5 font-medium text-blue-300">{message}</p>}

        <div className="mt-8">
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded ${activeTab === 'pending' ? 'bg-orange-600' : 'bg-transparent border border-gray-600'}`} onClick={() => setActiveTab('pending')}>Pending</button>
            <button className={`px-3 py-1 rounded ${activeTab === 'approved' ? 'bg-green-600' : 'bg-transparent border border-gray-600'}`} onClick={() => setActiveTab('approved')}>Approved</button>
            <button className={`px-3 py-1 rounded ${activeTab === 'rejected' ? 'bg-red-600' : 'bg-transparent border border-gray-600'}`} onClick={() => setActiveTab('rejected')}>Rejected</button>
          </div>

          <div className="mt-4 grid gap-4">
            {filtered.length === 0 && <p className="text-gray-300">No uploads in this category.</p>}
            {filtered.map((u) => (
              <div key={u.id} className="rounded-md bg-[#2a2a2a] p-4">
                {u.previewUrl && (u.mime_type.startsWith('video/') ? (
                  <video controls className="mb-3 max-h-64 w-full rounded-md" src={u.previewUrl} />
                ) : (
                  <img alt={u.original_name} className="mb-3 max-h-64 w-full rounded-md object-contain" src={u.previewUrl ?? undefined} />
                ))}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{u.original_name}</div>
                    <div className="text-sm text-gray-300">{(u.file_size / 1024 / 1024).toFixed(2)} MB · {new Date(u.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-sm ${u.status === 'approved' ? 'bg-green-600' : u.status === 'rejected' ? 'bg-red-600' : 'bg-orange-600'}`}>{u.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
