"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import {
  DeleteContext,
  NotePad,
  priorityOrder,
  TaskPriority,
  Tasks,
  TasksPriority,
  User,
} from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import ScheduleLayout from "@/components/Schedule/ScheduleLayout/ScheduleLayout";
import { RiSave3Fill, RiPencilFill, RiEraserFill } from "react-icons/ri";
import { FaTimes, FaCheck } from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

import ChartLayout from "@/components/chart/Chart";
import WarningDeal from "@/components/Warning/DefaultWarning";
import CustomSelect from "@/components/Tools/Select/CustomSelect";
import Tooltip from "@/components/Tools/Tooltip/Tooltip";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Tasks[]>();
  const [notes, setNotes] = useState<NotePad[]>([]);
  const [originalNote, setOriginalNote] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentNote = notes[currentIndex];

  const [isOpenEditTask, setIsOpenEditTask] = useState<number | undefined>(
    undefined,
  );
  const [taskContent, setTaskContent] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(
    TasksPriority.NORMAL,
  );
  const [taskFinish, setTaskFinish] = useState(false);

  const [deleteContext, setDeleteContext] = useState<DeleteContext>(null);

  const [user, setUser] = useState<User | null>(null);

  const [isOpenTask, setIsOpenTask] = useState(true);
  const [isOpenChart, setIsOpenChart] = useState(true);
  const [isOpenNote, setIsOpenNote] = useState(true);
  const [isOpenSchedule, setIsOpenSchedule] = useState(true);
  const [error, setError] = useState("");

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar Usuário");
      setUser(data);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token]);

  const groupedTasks = tasks?.reduce(
    (acc, task) => {
      const priority = task.priority;
      if (!acc[priority]) {
        acc[priority] = [];
      }
      acc[priority].push(task);
      return acc;
    },
    {} as Record<TasksPriority, Tasks[]>,
  );

  const priorityOptions = Object.entries(TaskPriority).map(([key, value]) => ({
    label: value.label,
    value: value.dbValue,
  }));

  const selectedPriority =
    priorityOptions.find((opt) => opt.value === taskPriority) || null;

  function handleNote(next: boolean) {
    setCurrentIndex((prev) => {
      if (next) {
        return (prev + 1) % notes.length;
      } else {
        return (prev - 1 + notes.length) % notes.length;
      }
    });
  }

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar as tarefas");
      setTasks(data);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token]);

  function handleToggleOpenCard(card: string) {
    if (card === "task") {
      setIsOpenTask((prev) => {
        const updated = !prev;
        localStorage.setItem("isOpenTask", JSON.stringify(updated));
        return updated;
      });
    }

    if (card === "chart") {
      setIsOpenChart((prev) => {
        const updated = !prev;
        localStorage.setItem("isOpenChart", JSON.stringify(updated));
        return updated;
      });
    }

    if (card === "note-pad") {
      setIsOpenNote((prev) => {
        const updated = !prev;
        localStorage.setItem("isOpenNote", JSON.stringify(updated));
        return updated;
      });
    }

    if (card === "schedule") {
      setIsOpenSchedule((prev) => {
        const updated = !prev;
        localStorage.setItem("isOpenSchedule", JSON.stringify(updated));
        return updated;
      });
    }
  }

  async function resetTask() {
    setIsOpenEditTask(undefined);
    setTaskContent("");
    setTaskPriority(TasksPriority.NORMAL);
    setTaskFinish(false);
  }

  async function handleAddTask() {
    if (!taskContent.trim()) return;

    try {
      const payload: Partial<Tasks> = {
        priority: TasksPriority[taskPriority],
        content: taskContent,
        isFinish: taskFinish ?? false,
      };

      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: payload }),
      });

      if (!res.ok) throw new Error("Erro ao criar tarefa");
      await res.json();
      resetTask();
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEditTask(taskId: number) {
    if (!taskContent.trim()) return;
    if (!taskId) return;

    try {
      const payload: Partial<Tasks> = {
        priority: TasksPriority[taskPriority],
        content: taskContent,
        isFinish: taskFinish ?? false,
      };

      const res = await fetch(`${API}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: payload }),
      });

      if (!res.ok) throw new Error("Erro ao editar tarefa");
      await res.json();
      fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      resetTask();
    }
  }

  async function handleDeleteTask(task: Tasks) {
    if (!task) return;

    try {
      const res = await fetch(`${API}/tasks/${task.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Erro ao apagar tarefa");
      await res.json();
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleTaskFinish(task: Tasks) {
    if (!task) return;

    const payload = { ...task, isFinish: !task.isFinish };

    try {
      const res = await fetch(`${API}/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: payload }),
      });

      if (!res.ok) throw new Error("Erro ao finalizar tarefa");
      await res.json();
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAutoSave() {
    if (isLoading) return;
    setError("");

    if (!currentNote) return;
    if (currentNote.content === originalNote) return;

    try {
      const response = await fetch(`${API}/notepad`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: currentNote?.content }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar nota");

      setNotes((prev) => [...prev, data]);
      setOriginalNote(data.content);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado");
      }
    }
  }

  const fetchNotes = useCallback(async () => {
    if (isLoading) return;

    try {
      const res = await fetch(`${API}/notepad/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar a notas");

      setNotes(data);
      setOriginalNote(data[0].content);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [token, isLoading]);

  useEffect(() => {
    if (notes.length > 0) {
      setCurrentIndex(0);
    }
  }, [notes]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchMe();
    fetchTasks();
    fetchNotes();
  }, [isLoading, token]);

  useEffect(() => {
    const savedTask = localStorage.getItem("isOpenTask");
    if (savedTask !== null) {
      setIsOpenTask(JSON.parse(savedTask));
    }

    const savedChart = localStorage.getItem("isOpenChart");
    if (savedChart !== null) {
      setIsOpenChart(JSON.parse(savedChart));
    }

    const savedNote = localStorage.getItem("isOpenNote");
    if (savedNote !== null) {
      setIsOpenNote(JSON.parse(savedNote));
    }

    const savedSchedule = localStorage.getItem("isOpenSchedule");
    if (savedSchedule !== null) {
      setIsOpenSchedule(JSON.parse(savedSchedule));
    }
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.btnsWindows}>
          <Tooltip label={"Notas"}>
            <button
              className={styles.btnWindows}
              onClick={() => handleToggleOpenCard("note-pad")}
            >
              <div
                className={`glass ${styles.btnSlide} ${isOpenNote && styles.btnSlideActive}`}
              >
                <div className={styles.slide} />
              </div>
              <span>Notas</span>
            </button>
          </Tooltip>

          <Tooltip label={"Faturamento"}>
            <button
              className={styles.btnWindows}
              onClick={() => handleToggleOpenCard("chart")}
            >
              <div
                className={`glass ${styles.btnSlide} ${isOpenChart && styles.btnSlideActive}`}
              >
                <div className={styles.slide} />
              </div>
              <span>Faturamento</span>
            </button>
          </Tooltip>

          <Tooltip label={"Tarefas"}>
            <button
              className={styles.btnWindows}
              onClick={() => handleToggleOpenCard("task")}
            >
              <div
                className={`glass ${styles.btnSlide} ${isOpenTask && styles.btnSlideActive}`}
              >
                <div className={styles.slide} />
              </div>
              <span>Tarefas</span>
            </button>
          </Tooltip>

          <Tooltip label={"Agenda"}>
            <button
              className={styles.btnWindows}
              onClick={() => handleToggleOpenCard("schedule")}
            >
              <div
                className={`glass ${styles.btnSlide} ${isOpenSchedule && styles.btnSlideActive}`}
              >
                <div className={styles.slide} />
              </div>
              <span>Agenda</span>
            </button>
          </Tooltip>
        </div>

        <div className={styles.title}>
          <h4>
            Bem vindo(a) <span>{user?.name}</span>
          </h4>
        </div>
      </div>

      <div className={styles.contentSection}>
        {isOpenNote && (
          <div className={`glass ${styles.noteSection}`}>
            <div className={styles.titleCard}>
              <h5 className={styles.titleCenter}>Notas</h5>

              <Tooltip label={"Fechar"}>
                <button
                  className={styles.btnOpen}
                  onClick={() => handleToggleOpenCard("note-pad")}
                >
                  <div className={styles.slide} />
                </button>
              </Tooltip>
            </div>

            <div className={styles.card}>
              {error && <p className="error">{error}</p>}

              {notes.length >= 2 ? (
                <div className={styles.btnsNote}>
                  <button
                    className={styles.btnNote}
                    onClick={() => handleNote(false)}
                  >
                    <IoIosArrowBack />
                  </button>

                  <button
                    className={styles.btnNote}
                    onClick={() => handleNote(true)}
                  >
                    <IoIosArrowForward />
                  </button>
                </div>
              ) : (
                <div className={styles.gapNoArrows} />
              )}

              <div className={styles.noteInput}>
                {currentNote?.id === notes[0]?.id ? (
                  <textarea
                    className={`form-base ${styles.formNote}`}
                    placeholder="Nota"
                    value={currentNote?.content || ""}
                    onChange={(e) => {
                      const updated = [...notes];
                      updated[currentIndex] = {
                        ...updated[currentIndex],
                        content: e.target.value,
                      };
                      setNotes(updated);
                    }}
                    onBlur={handleAutoSave}
                  />
                ) : (
                  <span className={styles.formNote}>
                    {currentNote?.content || ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {isOpenChart && (
          <div className={`glass ${styles.chartSection}`}>
            <div className={styles.titleCard}>
              <h5 className={styles.titleCenter}>Faturamento</h5>

              <Tooltip label={"Fechar"}>
                <button
                  className={styles.btnOpen}
                  onClick={() => handleToggleOpenCard("chart")}
                >
                  <div className={styles.slide} />
                </button>
              </Tooltip>
            </div>
            {isOpenChart && <ChartLayout />}
          </div>
        )}

        {isOpenTask && (
          <div className={`glass ${styles.taskSection}`}>
            <div className={styles.titleCard}>
              <h5 className={styles.titleCenter}>Tarefas</h5>

              <Tooltip label={"Fechar"}>
                <button
                  className={styles.btnOpen}
                  onClick={() => handleToggleOpenCard("task")}
                >
                  <div className={styles.slide} />
                </button>
              </Tooltip>
            </div>

            <div className={styles.card}>
              <div className={styles.addTask}>
                {isOpenEditTask ? (
                  <>
                    <span>Editando...</span>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Tarefa"
                      value={taskContent}
                      className={`form-base ${styles.inputForm}`}
                      onChange={(e) => setTaskContent(e.target.value)}
                    />

                    <CustomSelect
                      options={priorityOptions}
                      value={selectedPriority}
                      onChange={(option) => {
                        if (option) {
                          setTaskPriority(option.value as TasksPriority);
                        }
                      }}
                    />

                    <button
                      type="button"
                      className={styles.btnSave}
                      onClick={handleAddTask}
                    >
                      <RiSave3Fill />
                    </button>
                  </>
                )}
              </div>

              <div className={styles.tasksList}>
                {tasks !== undefined && tasks.length === 0 && (
                  <p>Você não possui nenhuma tarefa.</p>
                )}
                {groupedTasks &&
                  Object.entries(groupedTasks)
                    .sort(
                      ([priorityA], [priorityB]) =>
                        priorityOrder[priorityA as TasksPriority] -
                        priorityOrder[priorityB as TasksPriority],
                    )
                    .map(([priority, tasksInGroup]) => (
                      <div key={priority} className={styles.taskItens}>
                        <p>{TaskPriority[priority as TaskPriority].label}</p>
                        {tasksInGroup.map((task) => (
                          <div key={task.id} className={styles.taskItem}>
                            {isOpenEditTask === task.id ? (
                              <>
                                <input
                                  type="text"
                                  placeholder="Nota"
                                  className={`form-base ${styles.inputForm}`}
                                  value={taskContent}
                                  onChange={(e) =>
                                    setTaskContent(e.target.value)
                                  }
                                />

                                <CustomSelect
                                  options={priorityOptions}
                                  value={selectedPriority}
                                  onChange={(option) => {
                                    if (option) {
                                      setTaskPriority(
                                        option.value as TasksPriority,
                                      );
                                    }
                                  }}
                                />

                                <button
                                  className={styles.btnEditTask}
                                  type="button"
                                  onClick={() => handleEditTask(task.id)}
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  className={styles.btnDelTask}
                                  type="button"
                                  onClick={() => {
                                    setIsOpenEditTask(undefined);
                                  }}
                                >
                                  <FaTimes />
                                </button>
                              </>
                            ) : (
                              <>
                                <div className={styles.divTask}>
                                  <button
                                    type="button"
                                    className={
                                      task.isFinish
                                        ? styles.divButtonFinish
                                        : styles.divButton
                                    }
                                    onClick={() => toggleTaskFinish(task)}
                                  >
                                    <span>{task.content}</span>
                                  </button>
                                </div>

                                <div className={styles.divTask}>
                                  <button
                                    className={styles.btnEditTask}
                                    type="button"
                                    onClick={() => {
                                      setIsOpenEditTask(task.id);
                                      setTaskContent(task.content);
                                    }}
                                  >
                                    <RiPencilFill />
                                  </button>
                                  <button
                                    className={styles.btnDelTask}
                                    type="button"
                                    onClick={() => {
                                      if (task.isFinish) handleDeleteTask(task);
                                      else
                                        setDeleteContext({
                                          message:
                                            "Deseja cancelar essa tarefa",
                                          name: task.content ?? "",
                                          onConfirm: () =>
                                            handleDeleteTask(task),
                                        });
                                    }}
                                  >
                                    <RiEraserFill />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
              </div>
            </div>
          </div>
        )}

        {isOpenSchedule && (
          <div className={`glass ${styles.scheduleSection}`}>
            <div className={styles.titleCard}>
              <Tooltip label={"Fechar"}>
                <button
                  className={styles.btnOpen}
                  onClick={() => handleToggleOpenCard("schedule")}
                >
                  <div className={styles.slide} />
                </button>
              </Tooltip>
            </div>
            {isOpenSchedule && <ScheduleLayout />}
          </div>
        )}
      </div>

      {deleteContext && (
        <WarningDeal
          message={deleteContext.message}
          name={deleteContext.name}
          onClose={() => setDeleteContext(null)}
          onConfirm={async () => {
            await deleteContext.onConfirm();
            setDeleteContext(null);
          }}
        />
      )}
    </main>
  );
}
