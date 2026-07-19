import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  HiOutlineUser, 
  HiOutlineCreditCard, 
  HiOutlineSearch, 
  HiOutlineInformationCircle,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { lookupParentFees, createParentCheckoutOrder, verifyPayment } from '../services/feeService';

export default function ParentFees() {
  const [registerNumber, setRegisterNumber] = useState('');
  const [email, setEmail] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [payingType, setPayingType] = useState(null);

  // Search Mutation
  const searchMutation = useMutation({
    mutationFn: () => lookupParentFees(registerNumber, email),
    onSuccess: (res) => {
      setStudentData(res.data);
      toast.success('Student profile found successfully.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to locate student profile.');
      setStudentData(null);
    }
  });

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Checkout Mutation for parent checkout order
  const parentCheckoutMutation = useMutation({
    mutationFn: ({ studentId, feeType }) => createParentCheckoutOrder(studentId, feeType),
    onSuccess: async (res, variables) => {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Razorpay SDK failed to load. Reload the page.');
        setPayingType(null);
        return;
      }

      const options = {
        key: res.keyId,
        amount: res.amount,
        currency: 'INR',
        name: 'SRM CampusConnect',
        description: `Parent portal checkout: ${variables.feeType} Fee`,
        order_id: res.orderId,
        handler: async function (response) {
          toast.promise(
            verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }),
            {
              loading: 'Verifying checkout details...',
              success: 'Fee payment accepted!',
              error: 'Verification checks failed.'
            }
          );
          // Refresh lookup automatically
          searchMutation.mutate();
          setPayingType(null);
        },
        prefill: {
          name: res.student.name,
          email: res.student.email,
        },
        theme: { color: '#7C3AED' },
        modal: {
          onDismiss: function () {
            setPayingType(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Checkout initialization failed.');
      setPayingType(null);
    }
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!registerNumber.trim() || !email.trim()) {
      toast.error('Register Number and Email are required.');
      return;
    }
    searchMutation.mutate();
  };

  const handleParentPayment = (feeType) => {
    setPayingType(feeType);
    parentCheckoutMutation.mutate({ studentId: studentData.student._id, feeType });
  };

  return (
    <div className="p-6 min-h-screen text-slate-100 text-left space-y-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Institution Integration Notice */}
        <div className="rounded-2xl border border-slate-800 bg-[#7C3AED]/5 border-[#7C3AED]/10 p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-[#7C3AED] shrink-0 border border-slate-800 shadow-glass">
            <HiOutlineInformationCircle className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Institution Integration Required</h4>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">
              This feature will become available once academic data is integrated by the college administration. Below is the sandbox simulated checkout environment.
            </p>
          </div>
        </div>

        {/* Banner Welcome Block */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1E293B] to-[#0B1220] border border-slate-800 p-6 md:p-8 text-center space-y-3 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[#7C3AED]/2 blur-3xl pointer-events-none" />
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">Parent Payment Portal</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Query outstanding tuition balances, hostel bookings, or transportation due fees dynamically and complete checkout using secure Razorpay.
          </p>
        </div>

        {/* Query Input Section */}
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-glass">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Register Number</label>
                <input
                  type="text"
                  placeholder="e.g. RA2111003010111"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 px-3.5 text-xs text-slate-200 placeholder-slate-650 focus:border-[#7C3AED] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Student Email</label>
                <input
                  type="email"
                  placeholder="e.g. sk1234@srmist.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0B1220] py-2.5 px-3.5 text-xs text-slate-200 placeholder-slate-650 focus:border-[#7C3AED] focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searchMutation.isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F8CFF] py-3 text-xs font-black text-white hover:opacity-90 transition disabled:opacity-50"
            >
              <HiOutlineSearch className="h-4.5 w-4.5" />
              {searchMutation.isLoading ? 'Searching...' : 'Locate Student Profile'}
            </button>
          </form>
        </div>

        {/* Display Results */}
        {studentData && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="rounded-2xl border border-slate-850 bg-[#111827] p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest pb-1 border-b border-slate-800">Student Profile</h3>
                <div className="space-y-1 text-xs">
                  <p className="text-slate-350"><span className="text-slate-500">Name:</span> <strong>{studentData.student.name}</strong></p>
                  <p className="text-slate-350"><span className="text-slate-500">Register Number:</span> <strong>{studentData.student.registerNumber}</strong></p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest pb-1 border-b border-slate-800">Academic Particulars</h3>
                <div className="space-y-1 text-xs">
                  <p className="text-slate-350"><span className="text-slate-500">Department:</span> <strong>{studentData.student.department.toUpperCase()}</strong></p>
                  <p className="text-slate-350"><span className="text-slate-500">Semester:</span> <strong>Semester {studentData.student.semester}</strong></p>
                </div>
              </div>
            </div>

            {/* Total Balance Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#EF4444]/5 border-red-500/10 p-5 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-red-400 uppercase tracking-wide">Total Outstanding Balance</h4>
                <p className="text-2xl font-black text-white">INR {studentData.totalOutstanding.toLocaleString()}</p>
              </div>
              <HiOutlineInformationCircle className="h-8 w-8 text-red-500/40 shrink-0" />
            </div>

            {/* Fee categories table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studentData.feeDetails.map((fee) => {
                const isProcessing = payingType === fee.feeType;

                return (
                  <div key={fee.feeType} className="rounded-2xl border border-slate-800 bg-[#111827] p-5 flex flex-col justify-between hover-glow transition">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-slate-100 text-sm">{fee.feeType} Fees</h4>
                        <span className={`inline-flex rounded px-1.5 py-0.5 font-bold uppercase text-[8px] border ${
                          fee.status === 'Paid' ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/15' :
                          'bg-red-500/10 text-red-500 border-red-500/15'
                        }`}>
                          {fee.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-350">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Fee Amount:</span>
                          <span>INR {fee.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Late Fine:</span>
                          <span className={fee.lateFine > 0 ? 'text-red-500' : ''}>INR {fee.lateFine.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-slate-200">
                          <span className="text-slate-450">Due Total:</span>
                          <span className="text-[#7C3AED]">INR {fee.outstandingAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      {fee.status === 'Paid' ? (
                        <div className="flex items-center justify-center gap-1 text-xs text-green-500 font-bold border border-green-500/10 rounded-xl bg-green-500/5 p-2">
                          <HiOutlineCheckCircle className="h-4.5 w-4.5" />
                          Settled
                        </div>
                      ) : (
                        <button
                          onClick={() => handleParentPayment(fee.feeType)}
                          disabled={isProcessing}
                          className="w-full text-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F8CFF] py-2 text-xs font-black text-white hover:opacity-90 transition disabled:opacity-50"
                        >
                          {isProcessing ? 'Connecting...' : 'Pay Balance'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
