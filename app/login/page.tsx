'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [fullName, setFullName] = useState('');
const [isSignUp, setIsSignUp] = useState(false);
const [message, setMessage] = useState('');

const handleAuth = async (e: React.FormEvent) => {
e.preventDefault();
setMessage('');

if (isSignUp) {
const { data, error } = await supabase.auth.signUp({
email,
password,
});

if (error) {
setMessage(error.message);
} else if (data.user) {
await supabase.from('profiles').insert([
{ id: data.user.id, full_name: fullName, total_debt: 0 }
]);
setMessage('Sign up successful! Check your email to confirm or try logging in.');
}
} else {
const { error } = await supabase.auth.signInWithPassword({
email,
password,
});

if (error) {
setMessage(error.message);
} else {
setMessage('Logged in successfully!');
router.push('/dashboard');
}
}
};

return (
<main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
<div className="w-full max-w-md text-black">
<div className="font-adequate mb-6 text-center text-5xl font-bold tracking-wide text-gray-900">
Icarus
</div>
<div className="bg-white p-8 rounded-lg shadow-md">
<h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
{isSignUp ? 'Create Account' : 'Study Tracker Login'}
</h1>

<form onSubmit={handleAuth} className="space-y-4">
{isSignUp && (
<div>
<label className="block text-sm font-medium text-gray-700">Full Name</label>
<input
type="text"
required
value={fullName}
onChange={(e) => setFullName(e.target.value)}
className="w-full mt-1 p-2 border rounded-md"
placeholder="Alex Smith"
/>
</div>
)}

<div>
<label className="block text-sm font-medium text-gray-700">Email</label>
<input
type="email"
required
value={email}
onChange={(e) => setEmail(e.target.value)}
className="w-full mt-1 p-2 border rounded-md"
placeholder="alex@example.com"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700">Password</label>
<input
type="password"
required
value={password}
onChange={(e) => setPassword(e.target.value)}
className="w-full mt-1 p-2 border rounded-md"
/>
</div>

<button
type="submit"
className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition font-semibold"
>
{isSignUp ? 'Sign Up' : 'Log In'}
</button>
</form>

{message && (
<p className="mt-4 text-center text-sm font-medium text-blue-600">{message}</p>
)}

<button
onClick={() => setIsSignUp(!isSignUp)}
className="w-full mt-4 text-sm text-gray-600 underline text-center block"
>
{isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
</button>
</div>
</div>
</main>
);
}