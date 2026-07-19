import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormField, { TextInput } from '../components/FormField';
import { HiOutlineUser, HiOutlineAcademicCap } from 'react-icons/hi';

const initialForm = {
  name: '',
  email: '',
  password: '',
  department: '',
  semester: '',
  registerNumber: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('student'); // student, faculty
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const isEmailValid = form.email.trim().toLowerCase().endsWith('@srmist.edu.in');

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email) {
      errors.email = 'Email is required';
    } else if (!isEmailValid) {
      errors.email = 'Only official SRM Institute email addresses (@srmist.edu.in) are allowed to register.';
    }
    if (!form.password || form.password.length < 8) errors.password = 'Minimum 8 characters required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        role: activeRole,
        semester: activeRole === 'student' && form.semester ? Number(form.semester) : undefined,
        registerNumber: form.registerNumber || undefined,
      };
      
      const user = await register(payload);
      toast.success(`Welcome to CampusConnect, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl shadow-slate-200"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="mt-1 text-sm text-slate-500">Join SRM CampusConnect ERP Network</p>
        </div>

        {/* Role toggle */}
        <div className="mt-6 grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveRole('student'); setForm(initialForm); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
              activeRole === 'student' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HiOutlineUser className="h-4 w-4" />
            <span>Student Registration</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveRole('faculty'); setForm(initialForm); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
              activeRole === 'faculty' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HiOutlineAcademicCap className="h-4 w-4" />
            <span>Faculty Registration</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" error={fieldErrors.name}>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
          </FormField>

          <FormField label="Email Address" error={fieldErrors.email}>
            <div className="relative">
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, email: val });
                  if (val && !val.trim().toLowerCase().endsWith('@srmist.edu.in')) {
                    setFieldErrors(prev => ({ ...prev, email: 'Only official SRM Institute email addresses (@srmist.edu.in) are allowed to register.' }));
                  } else {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="username@srmist.edu.in"
              />
              {isEmailValid && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 font-bold text-base pointer-events-none select-none">
                  ✓
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 font-medium col-span-full">
              Use your official SRM email (username@srmist.edu.in)
            </p>
          </FormField>

          <FormField label="Password" error={fieldErrors.password}>
            <TextInput
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </FormField>

          <FormField label={activeRole === 'student' ? 'Register Number' : 'Faculty ID / Employee ID'}>
            <TextInput
              value={form.registerNumber}
              onChange={(e) => setForm({ ...form, registerNumber: e.target.value })}
              placeholder={activeRole === 'student' ? 'RA2111003010123' : 'EMP3012'}
            />
          </FormField>

          <FormField label="Department">
            <TextInput value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="CSE" />
          </FormField>

          {activeRole === 'student' && (
            <FormField label="Semester">
              <TextInput
                type="number"
                min={1}
                max={10}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                placeholder="5"
              />
            </FormField>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isEmailValid}
            className="col-span-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Registering details...' : `Complete ${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Sign Up`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
