"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import {
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
import { MdCheckBoxOutlineBlank, MdCheckBox } from "react-icons/md";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Tasks[]>();

  const [isOpenEditTask, setIsOpenEditTask] = useState<number | undefined>(
    undefined
  );
  const [taskContent, setTaskContent] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(
    TasksPriority.NORMAL
  );
  const [taskFinish, setTaskFinish] = useState(false);

  const [user, setUser] = useState<User | null>(null);

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

  const groupedTasks = tasks?.reduce((acc, task) => {
    const priority = task.priority;
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(task);
    return acc;
  }, {} as Record<TasksPriority, Tasks[]>);

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
    if (!task.isFinish) {
      const confirmDelete = window.confirm(
        `Tem certeza que deseja excluir essa tarefa?`
      );
      if (!confirmDelete) return;
    }

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

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchMe();
    fetchTasks();
  }, [isLoading, token, router, fetchMe, fetchTasks]);

  return (
    <main className={styles.main}>
      <div className={styles.title}>
        <h1>Bem vindo(a) {user?.name}</h1>
      </div>
      <div className={styles.contentSection}>
        <div className=""></div>
        <div className={styles.taskSection}>
          <h2>Tarefas</h2>

          <div className={styles.addTask}>
            {isOpenEditTask ? (
              <>
                <h3>Editando</h3>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Tarefa"
                  value={taskContent}
                  onChange={(e) => setTaskContent(e.target.value)}
                />

                <select
                  value={taskPriority}
                  onChange={(e) =>
                    setTaskPriority(e.target.value as TasksPriority)
                  }
                  required
                >
                  {Object.entries(TaskPriority).map(([key, value]) => (
                    <option key={key} value={value.dbValue}>
                      {value.label}
                    </option>
                  ))}
                </select>

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
                    priorityOrder[priorityB as TasksPriority]
                )
                .map(([priority, tasksInGroup]) => (
                  <div key={priority} className={styles.taskItens}>
                    <h2>{TaskPriority[priority as TaskPriority].label}</h2>
                    {tasksInGroup.map((task) => (
                      <div key={task.id} className={styles.taskItem}>
                        {isOpenEditTask === task.id ? (
                          <>
                            <input
                              type="text"
                              placeholder="Nota"
                              value={taskContent}
                              onChange={(e) => setTaskContent(e.target.value)}
                            />

                            <select
                              value={taskPriority}
                              onChange={(e) =>
                                setTaskPriority(e.target.value as TasksPriority)
                              }
                              required
                            >
                              {Object.entries(TaskPriority).map(
                                ([key, value]) => (
                                  <option key={key} value={value.dbValue}>
                                    {value.label}
                                  </option>
                                )
                              )}
                            </select>

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
                                {task.isFinish ? (
                                  <MdCheckBox />
                                ) : (
                                  <MdCheckBoxOutlineBlank />
                                )}
                                <h3>{task.content}</h3>
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
                                onClick={() => handleDeleteTask(task)}
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
      <div className={styles.calendar}>
        <ScheduleLayout />
      </div>
    </main>
  );
}
