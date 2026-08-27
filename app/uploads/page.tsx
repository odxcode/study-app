'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const BUCKET = 'study-videos';
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png']);

export default function UploadsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setMessage('');
  };

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
      setMessage(uploadError.message);
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
      setMessage(metadataError.message);
      return;
    }

    setFile(null);
    setIsUploading(false);
    setMessage('Upload submitted for admin review.');
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <a href="/dashboard" className="text-sm text-blue-600 underline">
          Back to dashboard
        </a>
        <h1 className="mt-4 text-3xl font-bold">Study Uploads</h1>
        <p className="mt-2 text-gray-600">
          Upload a short video or picture of yourself studying. Every upload stays pending until an admin reviews it.
        </p>

        <form onSubmit={handleUpload} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold" htmlFor="study-file">
            Study video or image
          </label>
          <input
            id="study-file"
            type="file"
            accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png"
            onChange={handleFileChange}
            className="block w-full rounded-md border border-gray-300 p-3"
          />
          <p className="text-sm text-gray-500">MP4, WebM, QuickTime, JPG, or PNG; maximum 100 MB.</p>
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-md bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Submit for Review'}
          </button>
        </form>

        {message && <p className="mt-5 font-medium text-blue-700">{message}</p>}
      </div>
    </main>
  );
}
