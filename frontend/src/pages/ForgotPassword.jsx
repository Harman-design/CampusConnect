import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { forgotPassword } from '../services/authService';
import FormField, { TextInput } from '../components/FormField';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200"
      >
        <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500">We'll email you a secure link to choose a new password.</p>

        {sent ? (
          <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <FormField label="Email">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@srmist.edu.in" />
            </FormField>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Back to log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
