"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { AiOutlinePlus } from "react-icons/ai";

import styles from "./ScheduleLayout.module.css";
import { Client, Schedule } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import ScheduleForm from "@/components/Schedule/ScheduleForm/Schedule";
import { formatDateForSchedules } from "@/utils/dateUtils";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function ScheduleLayout() {
  const { token, isLoading } = useAuth();

  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[] | []>([]);
  const [clientBirth, setClientBirth] = useState<Client[] | []>([]);
  const [isWeekOrMonth, setIsWeekOrMonth] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
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

  async function fetchSchedules() {
    const res = await fetch(`${API}/schedule`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setSchedules(data);
  }

  function getTooltipStyle() {
    const tooltipWidth = 250;
    const tooltipHeight = 220;

    let top = tooltipPosition.y + 15;
    let left = tooltipPosition.x;

    if (top + tooltipHeight > window.innerHeight) {
      top = tooltipPosition.y - tooltipHeight - 15;
    }

    if (left + tooltipWidth > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }

    return {
      top,
      left,
    };
  }

  function getBirthdaysForDay(day: Date) {
    return clientBirth.filter((client) => {
      const birthDate = client.dateOfBirth;
      if (!birthDate) return false;

      const birth = new Date(birthDate);

      return (
        birth.getDate() === day.getDate() && birth.getMonth() === day.getMonth()
      );
    });
  }

  useEffect(() => {
    if (!token) return;

    const month = currentDate.getMonth() + 1;

    async function fetchBirthDay() {
      try {
        const res = await fetch(`${API}/clients-birthday/${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Erro ao buscar aniversariantes");

        const data = await res.json();
        setClientBirth(data);
        console.log(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchBirthDay();
  }, [currentDate, token]);

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
        console.error(err);
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
                    {getBirthdaysForDay(day).length > 0 && (
                      <div
                        className={`glass ${styles.birthdayItem}`}
                        onMouseEnter={(e) => {
                          setHoveredDay(day);
                          setTooltipPosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <span>🎉 {getBirthdaysForDay(day).length}</span>
                      </div>
                    )}

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
                <div key={index} className={styles.dayColumn}>
                  <div className={styles.events}>
                    {getBirthdaysForDay(day).length > 0 && (
                      <div
                        className={`glass ${styles.birthdayItem}`}
                        onMouseEnter={(e) => {
                          setHoveredDay(day);
                          setTooltipPosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <span>🎉 {getBirthdaysForDay(day).length} </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          : days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isPast = isPastDay(day);
              const isTodayDate = isToday(day);
              const hasPending = hasPendingSchedules(day);

              const schedules = getScheduleForDay(day);
              const birthdays = getBirthdaysForDay(day);
              const events = [...birthdays, ...schedules];

              const shouldShow = !isPast || hasPending;

              return shouldShow ? (
                <button
                  key={index}
                  onClick={() => setSelectedDay(day)}
                  onMouseEnter={(e) => {
                    setHoveredDay(day);
                    setTooltipPosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`${styles.monthDay} ${
                    isCurrentMonth ? styles.currentMonth : styles.otherMonth
                  } ${isTodayDate && styles.today} ${isPast && styles.pastDay}`}
                >
                  {day.getDate()}
                  {events.length > 0 && (
                    <div className={styles.eventsMonth}>
                      <p>{events.length}</p>

                      <span>evento{events.length > 1 && "s"}</span>
                    </div>
                  )}
                </button>
              ) : (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`${styles.monthDay} ${
                    isCurrentMonth ? styles.currentMonth : styles.otherMonth
                  } ${isPast && styles.pastDay}`}
                >
                  {day.getDate()}
                  {birthdays.length > 0 && (
                    <div className={styles.eventsMonth}>
                      <p>{birthdays.length}</p>

                      <span>evento{birthdays.length > 1 && "s"}</span>
                    </div>
                  )}
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
            setHoveredDay(null);
          }}
          onSuccess={fetchSchedules}
        />
      )}

      {hoveredDay && (
        <div className={styles.tooltip} style={{ ...getTooltipStyle() }}>
          <div className={styles.tooltipTitle}>
            <h5>
              {hoveredDay.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
              })}
            </h5>
          </div>
          {getBirthdaysForDay(hoveredDay).length > 0 && (
            <div className={styles.tooltipBirthdays}>
              <p>
                Aniversariante
                {getBirthdaysForDay(hoveredDay).length > 1 && "s"} do dia
              </p>
              {getBirthdaysForDay(hoveredDay).length > 0 &&
                getBirthdaysForDay(hoveredDay).map((client) => (
                  <span key={client.id}>🎉 {client.name}</span>
                ))}
            </div>
          )}

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
