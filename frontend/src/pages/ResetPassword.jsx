import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { resetPassword } from '../services/authService';
import FormField, { TextInput } from '../components/FormField';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Reset link is invalid or missing a token.');
    if (password.length < 8) return toast.error('Password must be at least 8 characters.');
    if (password !== confirmPassword) return toast.error('Passwords do not match.');

    setIsSubmitting(true);
    try {
      const message = await resetPassword(token, password);
      toast.success(message);
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
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
        <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>

        {!token && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            This reset link is missing or invalid. Please request a new one.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <FormField label="New Password">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </FormField>
          <FormField label="Confirm New Password">
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </FormField>
          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Back to log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
