"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import {
  DeleteContext,
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
import { MdOpenInNew, MdOpenInNewOff } from "react-icons/md";

import ChartLayout from "@/components/chart/Chart";
import WarningDeal from "@/components/Warning/DefaultWarning";
import CustomSelect from "@/components/Tools/Select/CustomSelect";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Tasks[]>();

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
  const [isOpenSchedule, setIsOpenSchedule] = useState(true);

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

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    fetchMe();
    fetchTasks();
  }, [isLoading, token, router, fetchMe, fetchTasks]);

  useEffect(() => {
    const savedTask = localStorage.getItem("isOpenTask");
    if (savedTask !== null) {
      setIsOpenTask(JSON.parse(savedTask));
    }

    const savedChart = localStorage.getItem("isOpenChart");
    if (savedChart !== null) {
      setIsOpenChart(JSON.parse(savedChart));
    }

    const savedSchedule = localStorage.getItem("isOpenSchedule");
    if (savedSchedule !== null) {
      setIsOpenSchedule(JSON.parse(savedSchedule));
    }
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.title}>
        <h4>
          Bem vindo(a) <span>{user?.name}</span>
        </h4>
      </div>
      <div className={styles.contentSection}>
        <div className={styles.chartAndTask}>
          <div className={`glass ${styles.taskSection}`}>
            <div className={styles.titleCard}>
              <button className={styles.btnInvisible}>
                {isOpenTask ? <MdOpenInNewOff /> : <MdOpenInNew />}
              </button>
              <h5>Tarefas</h5>
              <button
                className={styles.btnOpen}
                onClick={() => handleToggleOpenCard("task")}
              >
                {isOpenTask ? <MdOpenInNewOff /> : <MdOpenInNew />}
              </button>
            </div>

            <div
              className={`${isOpenTask ? styles.taskOpen : styles.taskClose}`}
            >
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
                                    onClick={() =>
                                      setDeleteContext({
                                        message: "Deseja cancelar essa tarefa",
                                        name: task.content ?? "",
                                        onConfirm: () => handleDeleteTask(task),
                                      })
                                    }
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

          <div className={`glass ${styles.chart}`}>
            <div className={styles.titleCard}>
              <button className={styles.btnInvisible}>
                {isOpenTask ? <MdOpenInNewOff /> : <MdOpenInNew />}
              </button>
              <h5>Faturamento</h5>
              <button
                className={styles.btnOpen}
                onClick={() => handleToggleOpenCard("chart")}
              >
                {isOpenTask ? <MdOpenInNewOff /> : <MdOpenInNew />}
              </button>
            </div>
            {isOpenChart && <ChartLayout />}
          </div>
        </div>

        <div
          className={`glass ${styles.schedule} ${isOpenSchedule && styles.scheduleOpen}`}
        >
          <div className={styles.titleCard}>
            <button className={styles.btnInvisible}>
              {isOpenTask ? <MdOpenInNewOff /> : <MdOpenInNew />}
            </button>
            {!isOpenSchedule && <h5>Agenda</h5>}
            <button
              className={styles.btnOpen}
              onClick={() => handleToggleOpenCard("schedule")}
            >
              {isOpenTask ? <MdOpenInNewOff /> : <MdOpenInNew />}
            </button>
          </div>
          {isOpenSchedule && <ScheduleLayout />}
        </div>
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
