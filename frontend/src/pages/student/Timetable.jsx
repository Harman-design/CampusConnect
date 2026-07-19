import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineUser, HiOutlineLocationMarker } from 'react-icons/hi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentTimetable() {
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday');

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get('/api/timetable', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(res.data.data);
      setIsLoading(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch timetable');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Loading schedule...</div>;
  }

  // Filter slots for active day
  const dailySlots = slots
    .filter((s) => s.dayOfWeek === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Academic Timetable</h1>
        <p className="text-sm text-slate-500">View your weekly class schedule, timings, and classrooms</p>
      </div>

      {/* Day Selectors */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-700 pb-4">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeDay === day
                ? 'bg-brand-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="mt-6 flex flex-col gap-4">
        {dailySlots.map((slot) => (
          <div
            key={slot._id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-900 border border-slate-800 p-5 rounded-xl gap-4 hover:border-brand-500/30 transition"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-500/10 text-brand-500 rounded-lg">
                <HiOutlineCalendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">{slot.subject}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <HiOutlineClock className="h-4 w-4" /> {slot.startTime} - {slot.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <HiOutlineLocationMarker className="h-4 w-4" /> {slot.classroom || 'TBD'}
                  </span>
                </div>
              </div>
            </div>
            {slot.faculty && (
              <div className="flex items-center gap-2 border-t border-slate-800 pt-3 sm:border-t-0 sm:pt-0">
                <div className="h-8 w-8 bg-slate-800 flex items-center justify-center rounded-full text-slate-400">
                  <HiOutlineUser className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-slate-300">{slot.faculty.name}</p>
                  <p className="text-[10px] text-slate-500">Instructor</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {dailySlots.length === 0 && (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/50">
            <HiOutlineCalendar className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-400 mt-3">No Classes Scheduled</h3>
            <p className="text-xs text-slate-500 mt-1">Enjoy your free day, or review notes and study materials!</p>
          </div>
        )}
      </div>
    </div>
  );
}
