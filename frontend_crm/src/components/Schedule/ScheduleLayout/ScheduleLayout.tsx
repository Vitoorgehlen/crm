"use client";

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
  const { token, isLoading } = useAuth();

  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[] | []>([]);
  const [isWeekOrMonth, setIsWeekOrMonth] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpenCard, setIsOpenCard] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );

  function isPastDay(day: Date): boolean {
    const today = new Date();
    const dayWithoutTime = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
    );
    const todayWithoutTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    return dayWithoutTime < todayWithoutTime;
  }

  function isToday(day: Date): boolean {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  }

  function titleSchedule(type: string) {
    if (type === "week") {
      const now = currentDate;
      return now.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
    }

    if (type === "month") {
      const now = currentDate;
      return now.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
    }
  }

  function navigateDate(direction: "prev" | "next") {
    const newDate = new Date(currentDate);

    if (isWeekOrMonth) {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(
        currentDate.getMonth() + (direction === "next" ? 1 : -1),
      );
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
        return false;
      }
      const scheduleDate = new Date(schedule.reminderAt);
      return (
        scheduleDate.getDate() === day.getDate() &&
        scheduleDate.getMonth() === day.getMonth() &&
        scheduleDate.getFullYear() === day.getFullYear()
      );
    });
  }

  function hasPendingSchedules(day: Date) {
    return schedules.some((schedule) => {
      if (!schedule.reminderAt || schedule.finish) return false;

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

  const handleCreateSchedule = (newSchedule: Schedule) => {
    setSchedules((prev) => [...prev, newSchedule]);
  };

  const handleUpdateSchedule = (updatedSchedule: Schedule) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === updatedSchedule.id ? updatedSchedule : schedule,
      ),
    );
  };

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchSchedules() {
      try {
        const res = await fetch(`${API}/schedule`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar compromissos");
        const data = await res.json();
        setSchedules(data);
      } catch (err) {
        console.log(err);
      }
    }

    if (selectedDay) {
      setIsOpenCard(true);
    }

    fetchSchedules();
  }, [isLoading, token, router, selectedDay]);

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <div className={styles.navigation}>
          <MdKeyboardArrowLeft
            className={styles.icon}
            onClick={() => navigateDate("prev")}
          />
          <span>Agenda</span>
          <MdKeyboardArrowRight
            className={styles.icon}
            onClick={() => navigateDate("next")}
          />
        </div>

        <div className={styles.title}>
          <h5 className={styles.titleCrazy}>Agenda</h5>
          <p>
            {isWeekOrMonth ? titleSchedule("week") : titleSchedule("month")}
          </p>
        </div>

        <div className={styles.actions}>
          <button
            className={`btn-action glass ${styles.btnDeal} ${styles.toggleButton}`}
            onClick={() => {
              setIsWeekOrMonth((prev) => {
                const next = !prev;
                if (next) {
                  setCurrentDate(new Date());
                } else {
                  const today = new Date();
                  setCurrentDate(
                    new Date(today.getFullYear(), today.getMonth(), 1),
                  );
                }
                return next;
              });
            }}
          >
            <span>{isWeekOrMonth ? "Semana" : "Mês"}</span>
          </button>
          <button
            type="button"
            className={`btn-action glass ${styles.btnDeal} ${styles.addButton}`}
            onClick={() => {
              setIsOpenCard((prev) => !prev);
            }}
          >
            <AiOutlinePlus className={styles.icon} />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      <div className={`${styles.grid} ${isWeekOrMonth && styles.gridWeek}`}>
        {isWeekOrMonth ? (
          <>
            {days.map((day, index) => (
              <div key={`header-${index}`} className={styles.dayHeader}>
                <span>
                  {formatTextWeek(
                    day.toLocaleDateString("pt-BR", { weekday: "short" }),
                  )}
                </span>
                <h5>{days[index]?.getDate()}</h5>
              </div>
            ))}
          </>
        ) : (
          <>
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
              (day, index) => (
                <div
                  key={`header-${index}`}
                  className={styles.gridHeaderMonthTxt}
                >
                  <span>{day}</span>
                </div>
              ),
            )}
          </>
        )}

        {isWeekOrMonth
          ? Array.from({ length: 7 }).map((_, index) => {
              const day = days[index];
              const isPast = isPastDay(day);
              const isTodayDate = isToday(day);
              const hasPending = hasPendingSchedules(day);

              const shouldShow = !isPast || hasPending;

              return shouldShow ? (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedDay(day);
                    setIsOpenCard((prev) => !prev);
                  }}
                  className={`${isPast ? styles.pastDay : styles.dayColumn}
                  ${isTodayDate && styles.today}
                  ${
                    day.getDay() === 0 || day.getDay() === 6
                      ? styles.weekend
                      : ""
                  }
                  `}
                >
                  <div className={styles.events}>
                    {getScheduleForDay(day)
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(a.reminderAt ?? 0).getTime() -
                          new Date(b.reminderAt ?? 0).getTime(),
                      )
                      .map((schedule) => (
                        <button
                          key={schedule.id}
                          className={`glass ${
                            schedule.finish
                              ? styles.scheduleItemFinish
                              : styles.scheduleItem
                          }`}
                          onClick={() => {
                            setSelectedDay(day);
                            setSelectedSchedule(schedule);
                            setIsOpenCard((prev) => !prev);
                          }}
                        >
                          <p>{schedule.deal?.client.name ?? ""}</p>
                          <span>
                            {formatDateForSchedules(schedule.reminderAt)}
                          </span>
                          <p>{schedule.label}</p>
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <div
                  key={index}
                  className={`${styles.dayColumn} 
                  ${isPast ? styles.pastDay : ""}`}
                ></div>
              );
            })
          : days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isPast = isPastDay(day);
              const isTodayDate = isToday(day);
              const hasPending = hasPendingSchedules(day);

              const shouldShow = !isPast || hasPending;

              return shouldShow ? (
                <button
                  key={index}
                  onClick={() => setSelectedDay(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`${styles.monthDay} ${
                    isCurrentMonth ? styles.currentMonth : styles.otherMonth
                  } ${isTodayDate && styles.today} ${isPast && styles.pastDay}`}
                >
                  {day.getDate()}
                  {getScheduleForDay(day).length > 0 && (
                    <div className={styles.eventsMonth}>
                      <p>{getScheduleForDay(day).length}</p>
                      {getScheduleForDay(day).length === 1 ? (
                        <span>evento</span>
                      ) : (
                        <span>eventos</span>
                      )}
                    </div>
                  )}
                </button>
              ) : (
                <div
                  key={index}
                  className={`${styles.monthDay} ${
                    isCurrentMonth ? styles.currentMonth : styles.otherMonth
                  } ${isPast && styles.pastDay}`}
                >
                  {day.getDate()}
                </div>
              );
            })}
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
          onCreate={handleCreateSchedule}
          onUpdate={handleUpdateSchedule}
          onDelete={(deleteId) => {
            setSchedules((prev) => prev.filter((s) => s.id !== deleteId));
          }}
          onSubmit={async (payload) => {
            console.log(payload);
          }}
        />
      )}

      {hoveredDay && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>
            <h5>
              {hoveredDay.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
              })}
            </h5>
          </div>
          {getScheduleForDay(hoveredDay).length > 0 ? (
            getScheduleForDay(hoveredDay).map((schedule) => (
              <div
                key={schedule.id}
                className={`${styles.tooltipItem} ${!schedule.finish && styles.tooltipItemPending}`}
              >
                <span>{formatDateForSchedules(schedule.reminderAt)}</span>
                <p>{schedule.label}</p>
                <h5>{schedule.deal?.client.name ?? ""}</h5>
              </div>
            ))
          ) : (
            <span>Sem compromisso</span>
          )}
        </div>
      )}
    </div>
  );
}
