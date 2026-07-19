import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  HiOutlineCreditCard, 
  HiOutlineCalendar, 
  HiOutlineReceiptTax, 
  HiOutlineDownload, 
  HiOutlineCheckCircle, 
  HiOutlineClock,
  HiOutlineInformationCircle
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { fetchStudentFees, createCheckoutOrder, verifyPayment } from '../services/feeService';

export default function StudentFees() {
  const queryClient = useQueryClient();
  const [payingType, setPayingType] = useState(null);

  // Load fee particulars
  const { data: feeData, isLoading } = useQuery({
    queryKey: ['student-fees'],
    queryFn: fetchStudentFees
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

  // Checkout order mutation
  const checkoutMutation = useMutation({
    mutationFn: createCheckoutOrder,
    onSuccess: async (res, feeType) => {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay SDK. Try reloading the page.');
        setPayingType(null);
        return;
      }

      const options = {
        key: res.keyId,
        amount: res.amount,
        currency: 'INR',
        name: 'CampusConnect ERP',
        description: `${feeType} Fee Settlement`,
        order_id: res.orderId,
        handler: async function (response) {
          toast.promise(
            verifyMutation.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }),
            {
              loading: 'Verifying checkout credentials...',
              success: 'Fee credited successfully!',
              error: 'Verification checks failed.'
            }
          );
          setPayingType(null);
        },
        prefill: {
          name: res.student.name,
          email: res.student.email,
        },
        theme: { color: '#4F8CFF' },
        modal: {
          onDismiss: function () {
            setPayingType(null);
            toast.warn('Payment window closed.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Checkout failed.');
      setPayingType(null);
    }
  });

  // Verify payment signature mutation
  const verifyMutation = useMutation({
    mutationFn: verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries(['student-fees']);
    }
  });

  const handlePayment = (feeType) => {
    setPayingType(feeType);
    checkoutMutation.mutate(feeType);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm animate-pulse">
        Retrieving fee balances and structures...
      </div>
    );
  }

  const { student, feeDetails, totalOutstanding, paymentHistory } = feeData?.data || {};

  return (
    <div className="p-6 min-h-screen text-slate-100 text-left space-y-6">
      <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
        
        {/* Institution Integration Notice */}
        <div className="rounded-2xl border border-slate-800 bg-[#7C3AED]/5 border-[#7C3AED]/10 p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-[#7C3AED] shrink-0 border border-slate-800 shadow-glass">
            <HiOutlineClock className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Institution Integration Required</h4>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              This feature will become available once academic data is integrated by the college administration. Below is the sandbox simulated checkout environment.
            </p>
          </div>
        </div>

        {/* Banner Block */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#111827] to-[#0B1220] border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-premium relative overflow-hidden">
          <div className="absolute right-0 top-0 h-40 w-40 bg-[#4F8CFF]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="inline-flex items-center rounded-full bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 px-3 py-0.5 text-[9px] font-extrabold tracking-wider text-[#4F8CFF] uppercase">
              Financial Registry
            </span>
            <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight">Fee Management Portal</h1>
            <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
              Verify outstanding balances, dynamic late fine charges, track payment history logs, and generate secure official payment receipts.
            </p>
          </div>

          <div className="bg-[#EF4444]/10 p-5 rounded-2xl border border-red-500/15 shrink-0 min-w-[200px] text-center shadow-glass relative z-10">
            <span className="text-[10px] text-[#FCA5A5] font-black uppercase block tracking-wider">Total Outstanding Due</span>
            <span className="text-3xl font-black text-[#EF4444] block mt-1">INR {totalOutstanding?.toLocaleString()}</span>
            <span className="text-[8px] text-[#FCA5A5] uppercase font-bold block mt-1">Late fines included</span>
          </div>
        </div>

        {/* Student card summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 space-y-4">
            <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest pb-1.5 border-b border-slate-800/80">Student Credentials</h4>
            <div className="space-y-2 text-xs font-semibold text-slate-350">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="text-slate-200">{student?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Register Number:</span>
                <span className="text-slate-200">{student?.registerNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-200 uppercase">{student?.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Semester:</span>
                <span className="text-slate-200">Semester {student?.semester}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Alerts */}
          <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-[#111827]/50 p-5 flex flex-col justify-center text-xs text-slate-400 space-y-3">
            <div className="flex items-center gap-2">
              <HiOutlineInformationCircle className="h-5 w-5 text-[#4F8CFF] shrink-0" />
              <p>Late fines are dynamically assessed on a per-day basis from the due date if the status is not marked paid.</p>
            </div>
            <div className="flex items-center gap-2">
              <HiOutlineCreditCard className="h-5 w-5 text-[#22C55E] shrink-0" />
              <p>Verify checkout details before initiating transactions. Keep the browser open during payment verification checks.</p>
            </div>
          </div>
        </div>

        {/* Fee Particular Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feeDetails?.map((fee) => {
            const payProgress = fee.amount > 0 ? (fee.paidAmount / fee.amount) * 100 : 0;
            const isProcessing = payingType === fee.feeType;

            return (
              <div key={fee.feeType} className="rounded-2xl border border-slate-800 bg-[#111827] p-5 flex flex-col justify-between hover-glow transition duration-200 group text-left relative overflow-hidden">
                <div className="absolute right-0 top-0 h-16 w-16 bg-[#4F8CFF]/2 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-slate-100 text-base">{fee.feeType} Fees</h3>
                    <span className={`inline-flex rounded px-2 py-0.5 font-bold uppercase text-[9px] border ${
                      fee.status === 'Paid' ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/15' :
                      fee.status === 'Partial' ? 'bg-amber-500/10 text-amber-500 border-amber-500/15' :
                      'bg-red-500/10 text-red-500 border-red-500/15'
                    }`}>
                      {fee.status}
                    </span>
                  </div>

                  {/* Pricing Fields */}
                  <div className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Scheduled Amount:</span>
                      <span className="text-slate-200">INR {fee.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Paid Balance:</span>
                      <span className="text-slate-200 text-green-500">INR {fee.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Late Fines:</span>
                      <span className={`text-slate-200 ${fee.lateFine > 0 ? 'text-red-500' : ''}`}>
                        INR {fee.lateFine.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-800/60 font-bold">
                      <span className="text-slate-400">Total Outstanding:</span>
                      <span className="text-[#4F8CFF]">INR {fee.outstandingAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-extrabold uppercase">
                      <span>Fund Clearance</span>
                      <span>{Math.round(payProgress)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED]" style={{ width: `${payProgress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <HiOutlineCalendar className="h-4 w-4 shrink-0 text-slate-600" />
                    <span>Due: <strong>{new Date(fee.dueDate).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <div className="mt-6">
                  {fee.status === 'Paid' ? (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-green-500 font-bold border border-green-500/10 rounded-xl bg-green-500/5 p-2 w-full">
                      <HiOutlineCheckCircle className="h-4 w-4" />
                      Paid in Full
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePayment(fee.feeType)}
                      disabled={isProcessing}
                      className="w-full text-center rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] px-4 py-2 text-xs font-black text-white hover:opacity-90 transition disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing order...' : `Pay INR ${fee.outstandingAmount.toLocaleString()}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transaction History Log */}
        <div className="rounded-2xl border border-slate-800 bg-[#111827] overflow-hidden text-left">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-black text-slate-100 text-sm">Payment Transaction History</h3>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Verified Records</span>
          </div>

          <div className="overflow-x-auto">
            {paymentHistory?.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">
                No past payment logs associated with this register number.
              </div>
            ) : (
              <table className="w-full text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0B1220]/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Payment ID</th>
                    <th className="px-6 py-3.5">Fee Category</th>
                    <th className="px-6 py-3.5">Settlement (Base + Fine)</th>
                    <th className="px-6 py-3.5">Method</th>
                    <th className="px-6 py-3.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {paymentHistory?.map((pay) => (
                    <tr key={pay._id} className="hover:bg-slate-900/35 transition">
                      <td className="px-6 py-3.5 font-medium">{new Date(pay.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-400">{pay.paymentId || 'Pending Verify'}</td>
                      <td className="px-6 py-3.5">{pay.feeType}</td>
                      <td className="px-6 py-3.5 font-bold">
                        INR {(pay.amount + pay.finePaid).toLocaleString()}
                        {pay.finePaid > 0 && <span className="text-[10px] font-normal text-red-500 ml-1">(+ fine)</span>}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">{pay.method}</td>
                      <td className="px-6 py-3.5 text-center">
                        {pay.status === 'Success' ? (
                          <a
                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/fees/receipt/${pay._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-850 bg-[#0B1220] hover:bg-[#4F8CFF]/10 hover:text-[#4F8CFF] px-2.5 py-1.5 font-bold transition"
                          >
                            <HiOutlineDownload className="h-3.5 w-3.5" />
                            Download
                          </a>
                        ) : (
                          <span className="text-slate-500 italic">Failed / Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
