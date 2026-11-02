import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const AvailabilityCalendar = ({ pickupDate, returnDate, onSelectDates, bookedDates = [] }) => {
  const { language = 'en' } = useAppContext();
  const [currentDate, setCurrentDate] = useState(() => {
    return pickupDate ? new Date(pickupDate) : new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNamesHi = [
    "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
  ];

  const monthNames = language === 'hi' ? monthNamesHi : monthNamesEn;

  const weekDaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDaysHi = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];
  const weekDays = language === 'hi' ? weekDaysHi : weekDaysEn;

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    if (year === today.getFullYear() && month <= today.getMonth()) return;
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const formatDateString = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = formatDateString(new Date());

  const handleDayClick = (dayNumber, isPast, isBooked) => {
    if (isPast || isBooked) return;

    const clickedDate = new Date(year, month, dayNumber);
    const dateStr = formatDateString(clickedDate);

    if (!pickupDate || (pickupDate && returnDate)) {
      onSelectDates(dateStr, "");
    } else if (pickupDate && !returnDate) {
      const start = new Date(pickupDate);
      if (clickedDate < start) {
        onSelectDates(dateStr, "");
      } else {
        onSelectDates(pickupDate, dateStr);
      }
    }
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 sm:p-5 border border-slate-200 antialiased">
      
      {/* Month Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-700" />
          <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button 
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mt-3 text-center">
        {weekDays.map((wd, i) => (
          <span key={i} className="text-[10px] font-bold uppercase text-slate-500 py-1">
            {wd}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 mt-1 text-center">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 sm:h-9" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const dayDate = new Date(year, month, dayNumber);
          const dateStr = formatDateString(dayDate);

          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          const isBooked = bookedDates.includes(dateStr);

          const isStart = pickupDate === dateStr;
          const isEnd = returnDate === dateStr;
          const isInRange = pickupDate && returnDate && dateStr > pickupDate && dateStr < returnDate;

          let dayClasses = "text-slate-800 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 cursor-pointer font-medium";

          if (isPast) {
            dayClasses = "text-slate-300 bg-slate-100/50 border-transparent cursor-not-allowed line-through";
          } else if (isBooked) {
            dayClasses = "bg-rose-50 text-rose-600 font-bold border border-rose-200 cursor-not-allowed";
          } else if (isStart || isEnd) {
            dayClasses = "bg-blue-700 text-white font-extrabold border border-blue-700 z-10";
          } else if (isInRange) {
            dayClasses = "bg-blue-100 text-blue-900 font-semibold border-y border-blue-200";
          } else if (isToday) {
            dayClasses = "border border-blue-600 text-blue-700 font-bold bg-blue-50/40";
          }

          return (
            <button
              type="button"
              key={dayNumber}
              disabled={isPast || isBooked}
              onClick={() => handleDayClick(dayNumber, isPast, isBooked)}
              className={`h-8 sm:h-9 rounded-md text-xs flex flex-col items-center justify-center relative transition-colors ${dayClasses}`}
              title={isBooked ? "Reserved" : dateStr}
            >
              <span>{dayNumber}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200 text-[11px] font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-700"></span>
          <span>{language === 'hi' ? 'चयनित दिन' : 'Selected Range'}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300"></span>
          <span>{language === 'hi' ? 'उपलब्ध' : 'Available'}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300"></span>
          <span>{language === 'hi' ? 'बुक है' : 'Reserved'}</span>
        </span>
      </div>

    </div>
  );
};

export default AvailabilityCalendar;
