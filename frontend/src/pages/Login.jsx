import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormField, { TextInput } from '../components/FormField';
import { HiOutlineUser, HiOutlineAcademicCap, HiOutlineShieldCheck } from 'react-icons/hi';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activePortal, setActivePortal] = useState('student'); // student, faculty, admin
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const isEmailValid = form.email.trim().toLowerCase().endsWith('@srmist.edu.in');

  const validate = () => {
    const errors = {};
    if (!form.email) {
      errors.email = 'Email is required';
    } else if (!isEmailValid) {
      errors.email = 'Only SRM Institute email IDs are supported.';
    }
    if (!form.password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const user = await login(form);
      
      // Enforce portal matching
      if (user.role !== activePortal) {
        throw new Error(`This account is registered as a ${user.role.toUpperCase()}. Please use the correct login portal.`);
      }

      toast.success(`Welcome back to the ${activePortal.toUpperCase()} Portal, ${user.name.split(' ')[0]}!`);
      const redirectTo = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThemeClasses = () => {
    if (activePortal === 'admin') return 'border-red-500 text-red-500 bg-red-500/5';
    if (activePortal === 'faculty') return 'border-purple-500 text-purple-500 bg-purple-500/5';
    return 'border-brand-500 text-brand-500 bg-brand-50/50';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CampusConnect</h1>
          <p className="mt-1 text-sm text-slate-500">SRM Ramapuram College ERP</p>
        </div>

        {/* Portal selector tabs */}
        <div className="mt-6 grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActivePortal('student')}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-lg transition ${
              activePortal === 'student' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HiOutlineUser className="h-4 w-4" />
            <span>Student</span>
          </button>
          <button
            onClick={() => setActivePortal('faculty')}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-lg transition ${
              activePortal === 'faculty' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HiOutlineAcademicCap className="h-4 w-4" />
            <span>Faculty</span>
          </button>
          <button
            onClick={() => setActivePortal('admin')}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-lg transition ${
              activePortal === 'admin' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HiOutlineShieldCheck className="h-4 w-4" />
            <span>Admin</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className={`p-3 rounded-lg border text-xs text-center font-medium font-sans ${getThemeClasses()}`}>
            Sign in to your authorized <strong className="uppercase">{activePortal}</strong> space
          </div>

          <FormField label="Email" error={fieldErrors.email}>
            <div className="relative">
              <TextInput
                type="email"
                placeholder="username@srmist.edu.in"
                value={form.email}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, email: val });
                  if (val && !val.trim().toLowerCase().endsWith('@srmist.edu.in')) {
                    setFieldErrors(prev => ({ ...prev, email: 'Only SRM Institute email IDs are supported.' }));
                  } else {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
              />
              {isEmailValid && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 font-bold text-base pointer-events-none select-none">
                  ✓
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
              Only SRM Institute email IDs are supported.
            </p>
          </FormField>

          <FormField label="Password" error={fieldErrors.password}>
            <TextInput
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isEmailValid}
            className="rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Logging in...' : `Access ${activePortal.charAt(0).toUpperCase() + activePortal.slice(1)} Portal`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Register Here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
