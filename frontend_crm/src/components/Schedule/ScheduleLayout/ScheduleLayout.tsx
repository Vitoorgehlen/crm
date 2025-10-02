'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { AiOutlinePlus } from "react-icons/ai";

import styles from "./ScheduleLayout.module.css";
import { Schedule } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import ScheduleForm from "@/components/Schedule/ScheduleForm/Schedule";
import { formatDateForSchedules } from "@/utils/dateUtils";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function ScheduleLayout() {
  const { token, permissions, isLoading} = useAuth();
  
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[] | []>([]);
  const [isWeekOrMonth, setIsWeekOrMonth] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpenCard, setIsOpenCard] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const [loading, setLoading] = useState<'read' | 'create' | 'update' | null >(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push('/login'); return; }

    async function fetchSchedules(){
      setLoading('read');
      try {
        const res = await fetch(`${API}/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erro ao buscar compromissos');
        const data = await res.json();
        setSchedules(data);
      } catch (err) {
        setError('Erro ao carregar lista de compromissos');
      } finally {
        setLoading(null);
      }
    }

    if (selectedDay) {
      setIsOpenCard(true);
    }

    fetchSchedules();
    }, [selectedDay])

  function isPastDay(day: Date): boolean {
    const today = new Date();
    const dayWithoutTime = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return dayWithoutTime < todayWithoutTime;
  }

  function isToday(day: Date): boolean {
    const today = new Date();
    return day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear();
  }

  function titleSchedule(type: string) {
    if (type === 'week') {
      const now = currentDate;
      return now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    }

    if (type === 'month') {
      const now = currentDate;
      return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  }

  function navigateDate(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    
    if (isWeekOrMonth) {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  }

  function generateMonthDays(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: Date[] = [];
    let totalCells = firstDayOfWeek + daysInMonth;
    if (totalCells < 35) totalCells = 35;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = totalCells - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }

  function generateDynamicWeekDays(startDate: Date): Date[] {
    const days: Date[] = [];
    const start = new Date(startDate);
    start.setDate(start.getDate()); 
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  }
  
  const days = isWeekOrMonth 
  ? generateDynamicWeekDays(currentDate)
  : generateMonthDays(currentDate);
  
  function getScheduleForDay(day: Date) {
    return schedules.filter((schedule) => {
      if (!schedule.reminderAt) {
        setError('Compromisso sem data')
        return false;
      };
      const scheduleDate = new Date(schedule.reminderAt);
      return (
        scheduleDate.getDate() === day.getDate() &&
        scheduleDate.getMonth() === day.getMonth() &&
        scheduleDate.getFullYear() === day.getFullYear()
      );
    });
  }

  function formatTextWeek(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1, -1);
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <div className={styles.navigation}>
          <MdKeyboardArrowLeft 
            className={styles.icon} 
            onClick={() => navigateDate('prev')}
          />
          <h6>Agenda</h6>
          <MdKeyboardArrowRight 
            className={styles.icon} 
            onClick={() => navigateDate('next')}
          />
        </div>
        
        <div className={styles.title}>
          <h2>{isWeekOrMonth ? titleSchedule('week') : titleSchedule('month')}</h2>
        </div>
        
        <div className={styles.actions}>
          <button
            className={styles.toggleButton}
            onClick={() => {
              setIsWeekOrMonth(prev => {
                const next = !prev;
                if (next) {
                  setCurrentDate(new Date());
                } else {
                  const today = new Date();
                  setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
                }
                return next;
              })
            }}
          >
            <h4>{isWeekOrMonth ? 'Semana' : 'Mês'}</h4>
          </button>
          <button 
          type="button"
          className={styles.addButton}
          onClick={() => {
            setIsOpenCard(prev => !prev);
          }}
          >
            <AiOutlinePlus className={styles.icon}/>
            <h4>Adicionar</h4>
          </button>
        </div>
      </div>

      <div className={`${styles.grid} ${isWeekOrMonth ? styles.weekView : styles.monthView}`}>
        {isWeekOrMonth ?
          <div className={styles.gridHeader}>
            {days.map((day, index) => (
              <div key={index} className={styles.dayHeader}>
                <span>
                  {formatTextWeek(day.toLocaleDateString('pt-BR', { weekday: 'short'}))}
                </span>
                {isWeekOrMonth && (
                  <span className={styles.dayNumber}>
                    {days[index]?.getDate()}
                  </span>
                )}
              </div>
            ))}
          </div>
        :
          <div className={styles.gridHeaderMonth}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
              <div key={index} className={styles.gridHeaderMonthTxt}>
                <span>
                  {day}
                </span>
              </div>
            ))}
          </div>
        }

        <div className={styles.gridBody}>
          {isWeekOrMonth ? (
            // Visualização semanal
            Array.from({ length: 7 }).map((_, index) => {
              const day = days[index];
              const isPast = isPastDay(day);
              const isTodayDate = isToday(day);
              const isFutureOrToday = !isPast;
              
              return isFutureOrToday ? (
                <div 
                  key={index} 
                  onClick={() => {
                    setSelectedDay(day);
                    setIsOpenCard(prev => !prev);
                  }}
                  className={`${styles.dayColumn} 
                  ${isTodayDate ? styles.today : styles.future}
                  ${day.getDay() === 0 || day.getDay() === 6 ? styles.weekend : ''}
                  `}
                >
                  <div className={styles.events}>
                    {getScheduleForDay(day)
                    .slice()
                    .sort((a, b) => new Date(a.reminderAt ?? 0).getTime() - new Date(b.reminderAt ?? 0).getTime())
                    .map((schedule) => (
                    <button
                    key={schedule.id}
                    className={schedule.finish ? styles.scheduleItemFinish : styles.scheduleItem}
                    onClick={() => {
                      setSelectedDay(day)
                      setSelectedSchedule(schedule)
                      setIsOpenCard(prev => !prev)
                    }}
                    >
                      <h4>{schedule.client?.name}</h4>
                      <h5>{formatDateForSchedules(schedule.reminderAt)}</h5>
                      <p>{schedule.label}</p>
                    </button>

                    ))}
                  </div>
                </div>
              ) : (
                <div 
                  key={index} 
                  className={`${styles.dayColumn} 
                  ${isPast ? styles.pastDay : ''}`}
                >
                </div>
              );
            })
          ) : (
            // Visualização mensal
            days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isPast = isPastDay(day);
              const isTodayDate = isToday(day);
              const isFutureOrToday = !isPast;

              return isFutureOrToday ? (
                <button 
                  key={index} 
                  onClick={() => setSelectedDay(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`${styles.monthDay} ${
                    isCurrentMonth ? styles.currentMonth : styles.otherMonth
                  } ${isTodayDate ? styles.today : ''}`}
                >
                  {day.getDate()}
                  {getScheduleForDay(day).length > 0 &&
                    <div className={styles.eventsMonth}>
                      {getScheduleForDay(day).length === 1 &&
                      `${getScheduleForDay(day).length} evento`}
                      {getScheduleForDay(day).length >= 2 &&
                      `${getScheduleForDay(day).length} eventos`}
                    </div>
                  }
                </button>
              ) : (
                <div 
                  key={index} 
                  className={`${styles.monthDay} ${
                    isCurrentMonth ? styles.currentMonth : styles.otherMonth
                  } ${isPast ? styles.pastDay : ''}`}
                >
                  {day.getDate()}
                </div>
              );
            })
          )}
        </div>
      </div>
      {isOpenCard && (
        <ScheduleForm
          isOpen={isOpenCard}
          day={selectedDay}
          schedule={selectedSchedule}
          onClose={() => { 
            setSelectedDay(null); 
            setSelectedSchedule(null); 
            setIsOpenCard(false); 
          }}
          onSubmit={async (payload) => {
            console.log(payload)
          }}
        />
      )}
      {hoveredDay && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>
            <h3>
              {hoveredDay.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
              })}
            </h3>
          </div>
          {getScheduleForDay(hoveredDay).length > 0 ? (
            getScheduleForDay(hoveredDay).map((schedule) => (
              <div key={schedule.id} className={styles.tooltipItem}>
                <h4>{schedule.client?.name}</h4>
                <p>{schedule.label}</p>
                <small>{formatDateForSchedules(schedule.reminderAt)}</small>
              </div>
            ))
          ) : (
            <p>Sem compromisso</p>
          )}
        </div>
      )}
    </div>
  );
}