'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation'; // Part 1: Import useRouter

export default function LoginPage() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [fullName, setFullName] = useState('');
const [isSignUp, setIsSignUp] = useState(false);
const [message, setMessage] = useState('');
const router = useRouter(); // Part 2: Initialize router

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
router.push('/dashboard'); // Part 3: Redirect after successful login
}
}
};

return (
<main className="min-h-screen flex items-center justify-center bg-[#2f2f2f] p-4">
<div className="bg-[#3a3a3a] p-8 rounded-lg shadow-md w-full max-w-md text-white">
<h1 className="text-2xl font-bold mb-6 text-center text-white">
{isSignUp ? 'Create Account' : 'Study Tracker Login'}
</h1>

<form onSubmit={handleAuth} className="space-y-4">
{isSignUp && (
<div>
<label className="block text-sm font-medium text-gray-200">Full Name</label>
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
<label className="block text-sm font-medium text-gray-200">Email</label>
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
<label className="block text-sm font-medium text-gray-200">Password</label>
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
<p className="mt-4 text-center text-sm font-medium text-blue-300">{message}</p>
)}

<button
onClick={() => setIsSignUp(!isSignUp)}
className="w-full mt-4 text-sm text-gray-200 underline text-center block"
>
{isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
</button>
</div>
</main>
);
}
