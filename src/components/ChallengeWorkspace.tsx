"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  GripVertical,
  HelpCircle,
  ListChecks,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Timer,
  TimerOff,
  Upload,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import NextImage from "next/image";
import imgWorkspace from "@/src/images/messageImage_1778781856852.jpg";
import imgBamboostHelp from "@/src/images/messageImage_1778781812364.jpg";
import imgTestcase from "@/src/images/messageImage_1778781874816.jpg";
import { ChatBot, type Message } from "@/src/components/ChatBot";
import { CodeEditor } from "@/src/components/CodeEditor";
import { PandaMascot } from "@/src/components/PandaMascot";
import {
  runTestCaseOnBackend,
  submitProblemToBackend,
} from "@/src/services/problemsService";
import type { Problem } from "@/src/lib/problems";
import { getStoredAuthUser } from "@/src/services/authService";
import {
  getAgentChatHistory,
  getStuckReasons,
  type StuckReason,
  sendAgentChatMessage,
  submitProblemStuckReason,
  triggerAgentSystemIntervention,
} from "@/src/services/agentService";
import {
  getLatestEditorSession,
  type EditorSessionStatusId,
  upsertEditorSession,
  startProblem,
  saveTimeTaken,
} from "@/src/services/editorSessionService";
import { logTelemetry } from "@/src/services/telemetryService";
// @ts-ignore
import Sk from "skulpt";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AgentState =
  | "idle"
  | "thinking"
  | "happy"
  | "stuck"
  | "talking"
  | "confused"
  | "sad"
  | "mad"
  | "sleeping";

type ResizeMode = "console" | "problem" | "assistant" | null;

const TUTORIAL_STORAGE_PREFIX = "bamboost:challenge-tutorial:v1";

const TUTORIAL_SLIDES = [
  {
    title: "Selamat datang di Bamboost!",
    description:
      "Di sini kamu bisa membaca soal, menulis kode, mencoba test case, dan berdiskusi dengan Bamboost saat butuh arah.",
    image: null,
    mascotState: "happy" as AgentState,
  },
  {
    title: "Kenali workspace-mu",
    description:
      "Panel kiri berisi detail soal, area tengah adalah code editor, dan panel kanan adalah ruang Bamboost. Border antar panel bisa digeser sesuai kebutuhanmu.",
    image: imgWorkspace,
    mascotState: "idle" as AgentState,
  },
  {
    title: "Bamboost bisa bantu apa?",
    description:
      "Kamu bisa meminta hint, pendekatan alternatif, contoh snippet yang mirip, atau penjelasan singkat tanpa langsung diberi jawaban penuh.",
    image: imgBamboostHelp,
    mascotState: "talking" as AgentState,
  },
  {
    title: "Test case dan submit",
    description:
      "Gunakan Jalankan Test Case untuk mencoba input contoh. Jika hasilnya sudah yakin, gunakan Submit Kode untuk penilaian akhir dari semua test case.",
    image: imgTestcase,
    mascotState: "thinking" as AgentState,
  },
];

const SUBMIT_IDLE_PROMPT_SECONDS = 120;

const FALLBACK_IDLE_REASONS: StuckReason[] = [
  {
    id: "still-understanding",
    code: "still-understanding",
    stuck_type: "idle",
    description: "Tidak, saya lagi memahami soal",
    created_at: "",
  },
  {
    id: "still-thinking",
    code: "still-thinking",
    stuck_type: "idle",
    description: "Tidak, saya lagi memikirkan logika",
    created_at: "",
  },
  {
    id: "still-doing",
    code: "still-doing",
    stuck_type: "idle",
    description: "Tidak, saya sedang mengerjakan soal",
    created_at: "",
  },
  {
    id: "stuck-idle",
    code: "stuck-idle",
    stuck_type: "idle",
    description: "Ya, saya butuh bantuan",
    created_at: "",
  },
];

const FALLBACK_ERROR_REASONS: StuckReason[] = [
  {
    id: "error-understanding",
    code: "error-understanding",
    stuck_type: "error",
    description: "Tidak, saya sedang membetulkan error",
    created_at: "",
  },
  {
    id: "stuck-error",
    code: "stuck-error",
    stuck_type: "error",
    description: "Ya, saya bingung errornya",
    created_at: "",
  },
];

const FALLBACK_STUCK_REASONS: StuckReason[] = [
  ...FALLBACK_IDLE_REASONS,
  ...FALLBACK_ERROR_REASONS,
];

interface ChallengeWorkspaceProps {
  username: string;
  problem: Problem;
  onBack: () => void;
}

export function ChallengeWorkspace({
  username,
  problem,
  onBack,
}: ChallengeWorkspaceProps) {
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<number>(1);
  const hasTestCases = problem.testCases.length > 0;
  const selectedTestCase = problem.testCases.find(
    (tc) => tc.id === selectedTestCaseId,
  ) ||
    problem.testCases[0] || {
      id: 0,
      input: "None",
      expectedOutput: "No test case available.",
    };

  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">(
    "testcase",
  );
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    output: string[];
    runtime: number;
    status: "Accepted" | "Wrong Answer" | "Error";
    judgeResults?: Array<{
      status: string;
      message: string;
      output: string;
      expected: string;
      error: string | null;
      time_used: number;
      memory_used: number;
      stdout: string;
      input: string;
      is_hidden: boolean;
      test_case_id: string;
    }>;
  } | null>(null);
  const [selectedResultTestCaseIndex, setSelectedResultTestCaseIndex] =
    useState(0);
  const [consoleHeight, setConsoleHeight] = useState(256);
  const [resizeMode, setResizeMode] = useState<ResizeMode>(null);
  const [isProblemPanelOpen, setIsProblemPanelOpen] = useState(true);
  const [problemPanelWidth, setProblemPanelWidth] = useState(420);
  const [assistantPanelWidth, setAssistantPanelWidth] = useState(420);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const [code, setCode] = useState(problem.starterCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("sleeping");
  const [agentMessage, setAgentMessage] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasClickedMascot, setHasClickedMascot] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [submitIdleTime, setSubmitIdleTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [showTimeTaken, setShowTimeTaken] = useState(true);
  const [isWorkStarted, setIsWorkStarted] = useState(false);
  const [stuckReasons, setStuckReasons] = useState<StuckReason[]>(
    FALLBACK_STUCK_REASONS,
  );
  const [helpCheckInType, setHelpCheckInType] = useState<
    "idle" | "error" | null
  >(null);
  const [isIdleHelpSubmitting, setIsIdleHelpSubmitting] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [deletionCount, setDeletionCount] = useState(0);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [isEditorSessionLoaded, setIsEditorSessionLoaded] = useState(false);
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);
  const lastCodeLength = useRef(code.length);
  const codeRef = useRef(code);
  const hasUserTypedRef = useRef(false);
  const latestStatusIdRef = useRef<EditorSessionStatusId>(1);
  const latestSessionIdRef = useRef<string | null>(null);
  const saveDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastSavedSignatureRef = useRef<string | null>(null);
  const lastIdleTriggerTimeRef = useRef(0);
  const lastErrorTriggerCountRef = useRef(0);
  const hasGreetedRef = useRef(false);
  const timeTakenRef = useRef(0);
  const isWorkStartedRef = useRef(false);
  const currentUserId = getStoredAuthUser()?.id ?? "anonymous";
  const tutorialStorageKey = `${TUTORIAL_STORAGE_PREFIX}:${currentUserId}:${problem.id}`;

  const isBackendProblem =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      problem.id,
    );

  const saveEditorSession = useCallback(
    async (
      codeToSave: string,
      options?: {
        statusIdOverride?: EditorSessionStatusId;
        keepalive?: boolean;
        force?: boolean;
      },
    ) => {
      if (!isBackendProblem) {
        return;
      }

      const authUser = getStoredAuthUser();
      if (!authUser?.id) {
        return;
      }

      const statusId = options?.statusIdOverride ?? latestStatusIdRef.current;
      const signature = `${statusId}:${codeToSave}`;

      if (!options?.force && signature === lastSavedSignatureRef.current) {
        return;
      }

      try {
        const saved = await upsertEditorSession(
          {
            user_id: authUser.id,
            problem_id: problem.id,
            code: codeToSave,
            status_id: statusId,
          },
          { keepalive: options?.keepalive },
        );

        latestSessionIdRef.current = saved.id;
        lastSavedSignatureRef.current = `${saved.status_id}:${saved.code}`;
      } catch (error) {
        console.error("Failed to save editor session:", error);
      }
    },
    [isBackendProblem, problem.id],
  );

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    setCode(problem.starterCode);
    setSelectedTestCaseId(problem.testCases[0]?.id ?? 0);
    setOutput([]);
    setLastResult(null);
    setSelectedResultTestCaseIndex(0);
    setConsoleTab("testcase");
    setAgentMessage(null);
    setAgentState("sleeping");
    setChatMessages([]);
    setSubmitIdleTime(0);
    setTimeTaken(0);
    setShowTimeTaken(true);
    setIsWorkStarted(false);
    setHelpCheckInType(null);
    setErrorCount(0);
    setDeletionCount(0);
    setIsHistoryLoaded(false);
    setIsEditorSessionLoaded(false);
    setIsInteractionLocked(false);
    lastIdleTriggerTimeRef.current = 0;
    lastErrorTriggerCountRef.current = 0;
    hasGreetedRef.current = false;
    timeTakenRef.current = 0;
    isWorkStartedRef.current = false;
    lastCodeLength.current = problem.starterCode.length;
    hasUserTypedRef.current = false;
    lastSavedSignatureRef.current = null;

    if (saveDebounceTimerRef.current) {
      clearTimeout(saveDebounceTimerRef.current);
      saveDebounceTimerRef.current = null;
    }
  }, [problem]);

  useEffect(() => {
    setTutorialStep(0);

    try {
      setIsTutorialOpen(
        window.localStorage.getItem(tutorialStorageKey) !== "seen",
      );
    } catch {
      setIsTutorialOpen(true);
    }
  }, [tutorialStorageKey]);

  useEffect(() => {
    let isCancelled = false;

    const loadEditorSession = async () => {
      if (!isBackendProblem) {
        setIsEditorSessionLoaded(true);
        return;
      }

      const authUser = getStoredAuthUser();
      if (!authUser?.id) {
        setIsEditorSessionLoaded(true);
        return;
      }

      try {
        const session = await getLatestEditorSession(problem.id, authUser.id);

        if (isCancelled || !session) {
          return;
        }

        latestSessionIdRef.current = session.id;
        lastSavedSignatureRef.current = `${session.status_id}:${session.code}`;
        latestStatusIdRef.current = session.status_id;
        setIsInteractionLocked(session.status_id === 2);

        const initialTimeTaken = Math.max(0, session.time_taken_seconds ?? 0);
        setTimeTaken(initialTimeTaken);
        timeTakenRef.current = initialTimeTaken;

        setIsWorkStarted(true);
        isWorkStartedRef.current = true;
        setAgentState("idle");

        if (!hasUserTypedRef.current && session.code) {
          setCode(session.code);
          lastCodeLength.current = session.code.length;
        }
      } catch (error) {
        console.error("Failed to load editor session:", error);
      } finally {
        if (!isCancelled) {
          setIsEditorSessionLoaded(true);
        }
      }
    };

    void loadEditorSession();

    return () => {
      isCancelled = true;
    };
  }, [isBackendProblem, problem.id]);

  useEffect(() => {
    let isCancelled = false;

    const loadStuckReasons = async () => {
      if (!isBackendProblem) {
        return;
      }

      try {
        const [idleReasonsVal, errorReasonsVal] = await Promise.all([
          getStuckReasons("idle").catch(() => []),
          getStuckReasons("error").catch(() => []),
        ]);

        if (
          isCancelled ||
          (idleReasonsVal.length === 0 && errorReasonsVal.length === 0)
        ) {
          return;
        }

        setStuckReasons([...idleReasonsVal, ...errorReasonsVal]);
      } catch (error) {
        console.error("Failed to load stuck reasons:", error);
      }
    };

    void loadStuckReasons();

    return () => {
      isCancelled = true;
    };
  }, [isBackendProblem]);

  useEffect(() => {
    if (
      !isEditorSessionLoaded ||
      !isBackendProblem ||
      isInteractionLocked ||
      !hasUserTypedRef.current
    ) {
      return;
    }

    if (saveDebounceTimerRef.current) {
      clearTimeout(saveDebounceTimerRef.current);
    }

    saveDebounceTimerRef.current = setTimeout(() => {
      void saveEditorSession(codeRef.current);
      saveDebounceTimerRef.current = null;
    }, 5000);

    return () => {
      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
        saveDebounceTimerRef.current = null;
      }
    };
  }, [
    code,
    isBackendProblem,
    isEditorSessionLoaded,
    isInteractionLocked,
    saveEditorSession,
  ]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isEditorSessionLoaded || !isBackendProblem) {
        return;
      }

      if (isInteractionLocked) {
        return;
      }

      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
        saveDebounceTimerRef.current = null;
      }

      void saveEditorSession(codeRef.current, {
        keepalive: true,
        force: true,
      });

      if (isWorkStartedRef.current) {
        void saveTimeTaken(problem.id, timeTakenRef.current, {
          keepalive: true,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    isBackendProblem,
    isEditorSessionLoaded,
    isInteractionLocked,
    problem.id,
    saveEditorSession,
  ]);

  useEffect(() => {
    let isCancelled = false;

    const loadHistory = async () => {
      if (!isBackendProblem) {
        setIsHistoryLoaded(true);
        return;
      }

      const authUser = getStoredAuthUser();
      if (!authUser?.id) {
        setIsHistoryLoaded(true);
        return;
      }

      try {
        const history = await getAgentChatHistory(problem.id, authUser.id);

        if (isCancelled) return;

        const mappedHistory: Message[] = history.map((item) => ({
          id: item.id,
          role: item.sender === "USER" ? "user" : "assistant",
          content: item.message,
          type: "observational",
          timestamp: new Date(item.created_at),
          proactive: item.trigger_source === "EVENT",
        }));

        setChatMessages(mappedHistory);

        if (mappedHistory.length > 0) {
          setHasClickedMascot(true);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        if (!isCancelled) {
          setIsHistoryLoaded(true);
        }
      }
    };

    void loadHistory();

    return () => {
      isCancelled = true;
    };
  }, [isBackendProblem, problem.id]);

  useEffect(() => {
    if (!isHistoryLoaded) {
      return;
    }

    // Gunakan ref untuk memastikan greeting hanya tereksekusi 1x
    if (isWorkStarted && chatMessages.length === 0 && !hasGreetedRef.current) {
      hasGreetedRef.current = true; // Tandai bahwa user sudah disapa

      const welcomes = [
        `Hei ${username}! Siap mengalahkan masalah ini? Saya panda-tutor Anda, Bamboost!`,
        `Selamat datang di editor, ${username}! Mari kita tulis kode yang bersih bersama-sama.`,
        `Halo ${username}! Saya Bamboost. Saya akan memantau kemajuan Anda dan membantu jika Anda macet!`,
      ];
      setAgentMessage(welcomes[Math.floor(Math.random() * welcomes.length)]);
      setAgentState("happy");

      const timer = setTimeout(() => {
        setAgentMessage(null);
        setAgentState("idle");
      }, 20000); // Tepat 20 detik lalu kembali idle

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [chatMessages.length, isHistoryLoaded, isWorkStarted, username]);

  useEffect(() => {
    if (!isWorkStarted) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (!isInteractionLocked) {
        setSubmitIdleTime((prev) => prev + 1);
        setTimeTaken((prev) => {
          const nextTimeTaken = prev + 1;
          timeTakenRef.current = nextTimeTaken;
          return nextTimeTaken;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isInteractionLocked, isWorkStarted]);

  // 1. Effect untuk memunculkan pesan saat idle mencapai 60 detik
  useEffect(() => {
    if (
      isWorkStarted &&
      submitIdleTime === 60 &&
      !agentMessage &&
      (!isChatOpen || isMinimized)
    ) {
      setAgentState("confused");
      setAgentMessage(
        "Butuh bantuan dengan logika? Saya bisa beri petunjuk di chat.",
      );
    }
  }, [agentMessage, isWorkStarted, submitIdleTime, isChatOpen, isMinimized]);

  // 2. Effect terpisah khusus untuk menghilangkan pesan setelah 15 detik
  useEffect(() => {
    if (
      agentMessage ===
      "Butuh bantuan dengan logika? Saya bisa beri petunjuk di chat."
    ) {
      const timer = setTimeout(() => {
        setAgentMessage(null);
        setAgentState("idle");
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [agentMessage]);

  useEffect(() => {
    if (!agentMessage || isChatOpen || helpCheckInType !== null) {
      return;
    }

    const timer = setTimeout(() => {
      setAgentMessage(null);
      setAgentState("idle");
    }, 30000);

    return () => clearTimeout(timer);
  }, [agentMessage, helpCheckInType, isChatOpen]);

  // Effect untuk error burst intervention
  useEffect(() => {
    if (
      !isWorkStarted ||
      isInteractionLocked ||
      !isBackendProblem ||
      helpCheckInType !== null
    ) {
      return;
    }

    const shouldTriggerOnError =
      errorCount > 0 &&
      errorCount >= 3 &&
      Math.floor(errorCount / 3) >
        Math.floor(lastErrorTriggerCountRef.current / 3);

    if (!shouldTriggerOnError) {
      return;
    }

    if (latestSessionIdRef.current) {
      void logTelemetry({
        problem: problem.id,
        action_type: "STUCK_ERROR_DETECTED",
        hint_type: "",
        code_snapshot: code,
        metadata: { error_count: errorCount },
      });
    }

    lastErrorTriggerCountRef.current = errorCount;
    setAgentMessage(null);
    setAgentState("idle");
    setHelpCheckInType("error");
  }, [
    errorCount,
    isBackendProblem,
    problem.id,
    code,
    isInteractionLocked,
    isWorkStarted,
    helpCheckInType,
  ]);

  useEffect(() => {
    if (
      !isWorkStarted ||
      isInteractionLocked ||
      !isBackendProblem ||
      helpCheckInType !== null
    ) {
      return;
    }

    const shouldPromptSubmitIdle =
      submitIdleTime > 0 &&
      submitIdleTime >= SUBMIT_IDLE_PROMPT_SECONDS &&
      Math.floor(submitIdleTime / SUBMIT_IDLE_PROMPT_SECONDS) >
        Math.floor(lastIdleTriggerTimeRef.current / SUBMIT_IDLE_PROMPT_SECONDS);

    if (!shouldPromptSubmitIdle) {
      return;
    }

    if (latestSessionIdRef.current) {
      void logTelemetry({
        problem: problem.id,
        action_type: "STUCK_IDLE_DETECTED",
        hint_type: "",
        code_snapshot: codeRef.current,
        metadata: { idle_seconds: submitIdleTime },
      });
    }

    lastIdleTriggerTimeRef.current = submitIdleTime;
    setAgentMessage(null);
    setAgentState("idle");
    setHelpCheckInType("idle");
  }, [
    submitIdleTime,
    isInteractionLocked,
    isWorkStarted,
    isBackendProblem,
    helpCheckInType,
    problem.id,
  ]);

  const handleStuckHelpChoiceNo = useCallback(
    async (reason: StuckReason) => {
      setIsIdleHelpSubmitting(true);

      try {
        if (isBackendProblem) {
          await submitProblemStuckReason({
            reason_id: reason.id,
            problem_id: problem.id,
          });

          if (latestSessionIdRef.current) {
            void logTelemetry({
              problem: problem.id,
              action_type: "IDLE_REASON_SELECTED",
              hint_type: "",
              code_snapshot: codeRef.current,
              metadata: {
                reason_id: reason.id,
                reason_code: reason.code,
                stuck_type: reason.stuck_type,
                reason_description: reason.description,
                choice_type: "no",
              },
            });
          }
        }
      } catch (error) {
        console.error("Failed to submit stuck reason:", error);
      } finally {
        setHelpCheckInType(null);
        setSubmitIdleTime(0);
        lastIdleTriggerTimeRef.current = 0;
        setAgentState("idle");
        setIsIdleHelpSubmitting(false);
      }
    },
    [isBackendProblem, problem.id],
  );

  const handleStuckHelpChoiceYes = useCallback(
    async (reason: StuckReason) => {
      if (!isBackendProblem || isInteractionLocked) {
        setHelpCheckInType(null);
        setSubmitIdleTime(0);
        lastIdleTriggerTimeRef.current = 0;
        return;
      }

      setIsIdleHelpSubmitting(true);
      const idleSnapshot = submitIdleTime;
      const isErrorCheckIn = reason.stuck_type === "error";

      try {
        const authUser = getStoredAuthUser();

        if (!authUser?.id) {
          throw new Error("Missing auth user");
        }

        await submitProblemStuckReason({
          reason_id: reason.id,
          problem_id: problem.id,
        });

        if (latestSessionIdRef.current) {
          void logTelemetry({
            problem: problem.id,
            action_type: "IDLE_REASON_SELECTED",
            hint_type: "",
            code_snapshot: codeRef.current,
            metadata: {
              reason_id: reason.id,
              reason_code: reason.code,
              stuck_type: reason.stuck_type,
              reason_description: reason.description,
              choice_type: "yes",
            },
          });
        }

        const response = await triggerAgentSystemIntervention({
          user_id: authUser.id,
          problem_id: problem.id,
          current_user_code: codeRef.current,
          trigger_type: isErrorCheckIn ? "error_burst" : "inactivity",
          trigger_payload: isErrorCheckIn
            ? { error_count: errorCount }
            : {
                idle_seconds: idleSnapshot,
                submit_idle_seconds: idleSnapshot,
              },
        });

        const newMessage: Message = {
          id: response.ai_message.id,
          role: "assistant",
          content: response.ai_message.message,
          type: "observational",
          timestamp: new Date(response.ai_message.created_at),
          proactive: true,
        };

        setHelpCheckInType(null);
        setSubmitIdleTime(0);
        lastIdleTriggerTimeRef.current = 0;
        setAgentState("stuck");
        setAgentMessage(
          `Hi ${username}, kamu kelihatan stuck. Aku kirim hint ke chat ya.`,
        );
        setChatMessages((prev) => [...prev, newMessage]);
        setIsChatOpen(true);
        setHasClickedMascot(true);
        setAgentState("talking");
      } catch {
        setAgentState("sad");
        setAgentMessage("Hint otomatis gagal dikirim. Coba tanya via chat.");
        setHelpCheckInType(null);
        setSubmitIdleTime(0);
        lastIdleTriggerTimeRef.current = 0;
      } finally {
        setIsIdleHelpSubmitting(false);
      }
    },
    [
      isBackendProblem,
      isInteractionLocked,
      problem.id,
      submitIdleTime,
      username,
      errorCount,
    ],
  );

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode === undefined || !isWorkStarted || isInteractionLocked) return;

    hasUserTypedRef.current = true;

    const diff = lastCodeLength.current - newCode.length;
    if (diff > 0) {
      setDeletionCount((prev) => prev + diff);
    }

    setCode(newCode);
    lastCodeLength.current = newCode.length;

    if (
      ["stuck", "talking", "sad", "confused", "mad"].includes(agentState) ||
      agentMessage
    ) {
      setAgentState("idle");
      setAgentMessage(null);
    }
  };

  const runCode = (
    testCaseInput?: string,
    runOptions?: { treatAsSubmission?: boolean },
  ) => {
    if (!isWorkStarted || isInteractionLocked) {
      return;
    }

    const isBackendProblem =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        problem.id,
      );

    if (isBackendProblem) {
      setIsRunning(true);
      // Remove mascot reaction when starting to run code
      // setAgentState("thinking");
      setOutput([]);

      void (async () => {
        try {
          const response = await runTestCaseOnBackend({
            problem_id: problem.id,
            source_code: code,
          });

          const judgeResults = response.judge_result.results.map((result) => ({
            status: result.status,
            message: result.message,
            output: result.output ?? "",
            expected: result.expected ?? "",
            error: result.error,
            time_used: result.time_used ?? 0,
            memory_used: result.memory_used ?? 0,
            stdout: result.stdout ?? "",
            input: result.input ?? "",
            is_hidden: result.is_hidden ?? false,
            test_case_id: result.test_case_id,
          }));
          const passedCount = judgeResults.filter(
            (result) => result.status === "AC",
          ).length;
          const isAccepted = response.judge_result.overall_status === "AC";
          const isExecutionError = ["CE", "RE", "ERROR"].includes(
            response.judge_result.overall_status,
          );

          const finalOutput =
            judgeResults.length > 0
              ? judgeResults
                  .map((result, index) => {
                    const lines = [
                      `Case ${index + 1}: ${result.message}`,
                      result.error
                        ? `Kesalahan: ${result.error}`
                        : `Output: ${result.output || "Tidak ada output"}`,
                    ];
                    return lines.join("\n");
                  })
                  .slice(0, 3)
              : [
                  response.judge_result.overall_message ||
                    "Run testcase selesai tanpa output detail.",
                ];

          setSelectedResultTestCaseIndex(0);
          setOutput(finalOutput);
          setLastResult({
            isCorrect: isAccepted,
            output: finalOutput,
            runtime: response.judge_result.max_time,
            status: isAccepted
              ? "Accepted"
              : isExecutionError
                ? "Error"
                : "Wrong Answer",
            judgeResults,
          });
          setConsoleTab("result");

          if (isAccepted) {
            // Remove mascot reaction for successful runs
            // setAgentState("happy");
            // setAgentMessage(
            //   `Nice ${username}! Semua ${passedCount} test case lulus saat run testcase.`,
            // );
          } else if (isExecutionError) {
            setAgentState("sad");
            setAgentMessage(
              "Masih ada error saat run testcase. Cek detail error di panel hasil.",
            );
            setErrorCount((prev) => prev + 1);
          } else {
            // Remove mascot reaction for wrong answers
            // setAgentState("talking");
            // setAgentMessage(
            //   `Baru ${passedCount}/${judgeResults.length} test case yang lulus. Yuk cek case yang gagal.`,
            // );
            setErrorCount((prev) => prev + 1);
          }
        } catch (err: unknown) {
          const errorMessage = String(err);
          const finalOutput = [`Run testcase error: ${errorMessage}`];
          setOutput(finalOutput);
          setLastResult({
            isCorrect: false,
            output: finalOutput,
            runtime: 0,
            status: "Error",
          });
          setConsoleTab("result");
          setAgentState("mad");
          setAgentMessage(
            "Gagal menjalankan run testcase ke backend. Coba lagi.",
          );
          setErrorCount((prev) => prev + 1);
        } finally {
          setIsRunning(false);
        }
      })();

      return;
    }

    setIsRunning(true);
    setAgentState("thinking");
    setOutput([]);

    const outputBuffer: string[] = [];
    let currentLine = "";

    // @ts-ignore
    Sk.configure({
      output: (text: string) => {
        currentLine += text;
        if (text.includes("\n")) {
          const lines = currentLine.split("\n");
          currentLine = lines.pop() || "";
          outputBuffer.push(...lines);
        }
      },
      read: (x: string) => {
        // @ts-ignore
        if (
          Sk.builtinFiles === undefined ||
          Sk.builtinFiles.files[x] === undefined
        ) {
          throw new Error(`File not found: '${x}'`);
        }
        // @ts-ignore
        return Sk.builtinFiles.files[x];
      },
      execLimit: 5000,
    });

    let codeToRun = code;

    if (testCaseInput && testCaseInput !== "None") {
      const functionName = problem.id.replace("-", "_");
      codeToRun += `\n\n# Auto-generated test case call\nprint(${functionName}(${testCaseInput}))`;
    }

    const startTime = performance.now();
    // @ts-ignore
    const runPromise = Sk.misceval.asyncToPromise(() => {
      // @ts-ignore
      return Sk.importMainWithBody("<stdin>", false, codeToRun, true);
    });

    runPromise
      .then(
        () => {
          const runtime = Math.round(performance.now() - startTime);
          if (currentLine) outputBuffer.push(currentLine);

          setIsRunning(false);
          const finalOutput = outputBuffer.filter((line) => line.trim() !== "");
          setOutput(finalOutput);

          if (finalOutput.length === 0) {
            // Remove mascot reaction for no output
            // setAgentState("confused");
            // setAgentMessage(
            //   "Saya tidak melihat output apapun. Apakah Anda lupa memanggil fungsi atau menggunakan print()?",
            // );
            setLastResult({
              isCorrect: false,
              output: ["Tidak ada output yang dihasilkan."],
              runtime,
              status: "Error",
            });
            setConsoleTab("result");
            return;
          }

          const lastOutput = finalOutput[finalOutput.length - 1]?.trim() ?? "";
          const expected = selectedTestCase.expectedOutput.trim();
          const isCorrect = hasTestCases
            ? problem.id === "fizzbuzz"
              ? problem.validator(finalOutput)
              : lastOutput === expected
            : finalOutput.length > 0;

          setLastResult({
            isCorrect,
            output: finalOutput,
            runtime,
            status: isCorrect ? "Accepted" : "Wrong Answer",
          });
          setConsoleTab("result");

          if (isCorrect) {
            // Remove mascot reaction for successful runs
            // setAgentState("happy");
            // setAgentMessage(
            //   `Excellent ${username}! Logic kamu sudah benar untuk test case ini.`,
            // );
          } else {
            // Remove mascot reaction for wrong answers
            // setAgentState("talking");
            // setAgentMessage(
            //   "Output kamu belum sesuai expected result. Kita cek step-by-step ya.",
            // );
          }
        },
        (err: unknown) => {
          setIsRunning(false);
          const errorMessage = String(err);
          const finalOutput = [`Error: ${errorMessage}`];
          setOutput(finalOutput);
          setLastResult({
            isCorrect: false,
            output: finalOutput,
            runtime: 0,
            status: "Error",
          });
          setConsoleTab("result");

          if (errorMessage.includes("IndentationError")) {
            setAgentState("sad");
            setAgentMessage(
              "Oops! Python sensitif soal indentasi. Cek lagi spasi di blok fungsi atau loop.",
            );
          } else {
            setAgentState("mad");
            setAgentMessage(
              "Eksekusi gagal. Lihat detail error di panel hasil.",
            );
          }
          setErrorCount((prev) => prev + 1);
        },
      )
      .finally(() => {
        if (runOptions?.treatAsSubmission) {
          setSubmitIdleTime(0);
        }
      });
  };

  const submitCode = async () => {
    if (!isWorkStarted || isInteractionLocked) {
      return;
    }

    const isBackendProblem =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        problem.id,
      );

    if (!isBackendProblem) {
      runCode(undefined, { treatAsSubmission: true });
      return;
    }

    setIsRunning(true);
    // Remove mascot reaction when starting to submit code
    // setAgentState("thinking");
    setOutput([]);

    try {
      const authUser = getStoredAuthUser();
      if (!authUser?.id) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      const submission = await submitProblemToBackend({
        user_id: authUser.id,
        problem_id: problem.id,
        source_code: code,
      });

      const firstJudgeResult = submission.judge_result.results[0];
      const isAccepted = submission.verdict === "AC";
      const isExecutionError =
        submission.verdict === "CE" || submission.verdict === "RE";

      const outputLines = [
        submission.output,
        submission.judge_result.overall_message,
        firstJudgeResult?.output,
        firstJudgeResult?.error,
      ].filter((line): line is string =>
        Boolean(line && line.trim().length > 0),
      );

      const finalOutput =
        outputLines.length > 0
          ? outputLines
          : [
              "Pengiriman diproses, tetapi tidak ada output yang dikembalikan oleh backend.",
            ];

      const judgeResults = submission.judge_result.results.map((result) => ({
        status: result.status,
        message: result.message,
        output: result.output ?? "",
        expected: result.expected ?? "",
        error: result.error,
        time_used: result.time_used ?? 0,
        memory_used: result.memory_used ?? 0,
        stdout: result.stdout ?? "",
        input: result.input ?? "",
        is_hidden: result.is_hidden ?? false,
        test_case_id: result.test_case_id,
      }));

      setSelectedResultTestCaseIndex(0);
      setOutput(finalOutput);
      setLastResult({
        isCorrect: isAccepted,
        output: finalOutput,
        runtime: submission.execution_time,
        status: isAccepted
          ? "Accepted"
          : isExecutionError
            ? "Error"
            : "Wrong Answer",
        judgeResults,
      });
      setConsoleTab("result");

      if (isAccepted) {
        // Remove mascot reaction for successful submissions
        // setAgentState("happy");
        // setAgentMessage(
        //   `Excellent ${username}! Solusi kamu lolos semua test case di backend.`,
        // );
      } else if (isExecutionError) {
        setAgentState("sad");
        setAgentMessage(
          "Masih ada error saat submit. Cek pesan error di panel hasil ya.",
        );
        setErrorCount((prev) => prev + 1);
      } else {
        // Remove mascot reaction for wrong answers
        // setAgentState("talking");
        // setAgentMessage(
        //   "Belum accepted. Bandingkan output dan expected lalu perbaiki pelan-pelan.",
        // );
        setErrorCount((prev) => prev + 1);
      }

      if (isAccepted) {
        void saveEditorSession(code, {
          statusIdOverride: isAccepted ? 2 : 1,
          force: true,
        });

        void saveTimeTaken(problem.id, timeTakenRef.current);

        setIsInteractionLocked(true);
        latestStatusIdRef.current = 2;
        setAgentState("happy");
        setAgentMessage(
          `Selamat ${username}! Semua test case lulus. Kamu berhasil menyelesaikan challenge ini!`,
        );
      }
    } catch (err: unknown) {
      const errorMessage = String(err);
      const finalOutput = [`Submit error: ${errorMessage}`];
      setOutput(finalOutput);
      setLastResult({
        isCorrect: false,
        output: finalOutput,
        runtime: 0,
        status: "Error",
      });
      setConsoleTab("result");
      setAgentState("mad");
      setAgentMessage("Gagal mengirim submit ke backend. Coba lagi sebentar.");
      setErrorCount((prev) => prev + 1);
    } finally {
      setIsRunning(false);
      setSubmitIdleTime(0);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!isWorkStarted) {
      setAgentState("sleeping");
      setAgentMessage("Tekan Mulai Mengerjakan dulu agar Bamboost ikut aktif.");
      return;
    }

    if (isInteractionLocked) {
      setAgentState("idle");
      setAgentMessage("Challenge sudah completed. Chat dinonaktifkan.");
      return;
    }

    const optimisticUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    const ignoredStuckType = helpCheckInType;

    if (ignoredStuckType !== null && latestSessionIdRef.current) {
      void logTelemetry({
        problem: problem.id,
        action_type: "STUCK_REASON_IGNORED",
        hint_type: "",
        code_snapshot: codeRef.current,
        metadata: {
          ignored_at: ignoredStuckType,
          stuck_type: ignoredStuckType,
          next_action: "continue_chat",
          user_message: content,
        },
      });
    }

    if (latestSessionIdRef.current) {
      void logTelemetry({
        problem: problem.id,
        action_type: "REACTIVE_CHAT_SENT",
        hint_type: "",
        code_snapshot: code,
        metadata: {
          user_message: content,
        },
      });
    }

    // Reset idle timer whenever user actively chats with the chatbot.
    setSubmitIdleTime(0);
    lastIdleTriggerTimeRef.current = 0;
    if (ignoredStuckType !== null) {
      setHelpCheckInType(null);
    }

    setChatMessages((prev) => [...prev, optimisticUserMessage]);
    setIsTyping(true);
    setAgentState("thinking");

    try {
      if (isBackendProblem) {
        const authUser = getStoredAuthUser();

        if (authUser?.id) {
          const response = await sendAgentChatMessage(problem.id, authUser.id, {
            sender: "USER",
            message: content,
            current_user_code: code,
          });

          const assistantMessage: Message = {
            id: response.ai_message.id,
            role: "assistant",
            content: response.ai_message.message,
            type: "observational",
            timestamp: new Date(response.ai_message.created_at),
          };

          if (latestSessionIdRef.current) {
            void logTelemetry({
              problem: problem.id,
              action_type: "REACTIVE_CHAT_REPLY",
              hint_type:
                response.ai_message.hint_type || response.hint_type || "",
              code_snapshot: code,
              metadata: {
                user_message: content,
                ai_response: response.ai_message.message,
              },
            });
          }

          setChatMessages((prev) => [...prev, assistantMessage]);
          setAgentState("talking");
          setAgentMessage(response.ai_message.message);
          return;
        }
      }

      throw new Error("Backend agent service not available for this problem");
    } catch {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Maaf, aku gagal menghubungi agent backend. Coba lagi ya.",
        type: "observational",
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
      setAgentState("sad");
      setAgentMessage(assistantMessage.content);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBackClick = useCallback(() => {
    if (saveDebounceTimerRef.current) {
      clearTimeout(saveDebounceTimerRef.current);
      saveDebounceTimerRef.current = null;
    }

    void (async () => {
      try {
        if (!isInteractionLocked) {
          await saveEditorSession(codeRef.current, { force: true });
        }

        if (isWorkStartedRef.current && isBackendProblem) {
          await saveTimeTaken(problem.id, timeTakenRef.current);
        }
      } finally {
        onBack();
      }
    })();
  }, [
    isBackendProblem,
    isInteractionLocked,
    onBack,
    problem.id,
    saveEditorSession,
  ]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizeMode("console");
  }, []);

  const startHorizontalResize = useCallback(
    (mode: Exclude<ResizeMode, "console" | null>) => (e: React.MouseEvent) => {
      e.preventDefault();
      setResizeMode(mode);
    },
    [],
  );

  const stopResizing = useCallback(() => {
    setResizeMode(null);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (resizeMode === "console") {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
          setConsoleHeight(newHeight);
        }
      }

      if (resizeMode === "problem") {
        const maxProblemWidth = Math.max(
          280,
          Math.min(
            window.innerWidth * 0.45,
            window.innerWidth - assistantPanelWidth - 420,
          ),
        );
        setProblemPanelWidth(
          Math.min(Math.max(e.clientX, 280), maxProblemWidth),
        );
      }

      if (resizeMode === "assistant") {
        const currentProblemWidth = isProblemPanelOpen ? problemPanelWidth : 48;
        const maxAssistantWidth = Math.max(
          320,
          Math.min(
            window.innerWidth * 0.45,
            window.innerWidth - currentProblemWidth - 420,
          ),
        );
        setAssistantPanelWidth(
          Math.min(
            Math.max(window.innerWidth - e.clientX, 320),
            maxAssistantWidth,
          ),
        );
      }
    },
    [assistantPanelWidth, isProblemPanelOpen, problemPanelWidth, resizeMode],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const activeStuckReasons =
    stuckReasons.filter((r) => r.stuck_type === helpCheckInType) || [];

  const yesCode = helpCheckInType === "error" ? "stuck-error" : "stuck-idle";

  const stuckHelpYesReason =
    activeStuckReasons.find((reason) => reason.code === yesCode) ??
    FALLBACK_STUCK_REASONS.find((reason) => reason.code === yesCode)!;

  const stuckHelpNoReasons = activeStuckReasons.filter(
    (reason) => reason.code !== yesCode,
  );

  const judgeResults = lastResult?.judgeResults ?? [];
  const publicJudgeResults = judgeResults
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => !result.is_hidden);
  const hiddenJudgeResults = judgeResults
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => result.is_hidden);
  const selectedJudgeResult = judgeResults[selectedResultTestCaseIndex];
  const formatUsageValue = (value: number) =>
    value.toFixed(4).replace(/\.?0+$/, "");

  const isConsoleResizing = resizeMode === "console";
  const currentTutorialSlide = TUTORIAL_SLIDES[tutorialStep];
  const isAgentMessageLong = (agentMessage?.length ?? 0) > 180;
  const formattedTimeTaken = `${Math.floor(timeTaken / 60)
    .toString()
    .padStart(2, "0")}:${(timeTaken % 60).toString().padStart(2, "0")}`;

  const startWorking = useCallback(() => {
    setIsWorkStarted(true);
    isWorkStartedRef.current = true;
    setAgentState("idle");
    setAgentMessage(null);
    setSubmitIdleTime(0);
    lastIdleTriggerTimeRef.current = 0;

    if (isBackendProblem && currentUserId !== "anonymous") {
      void startProblem(currentUserId, problem.id).catch((err) => {
        console.error("Failed to start problem:", err);
      });
    }
  }, [currentUserId, isBackendProblem, problem.id]);

  const closeTutorial = useCallback(() => {
    try {
      window.localStorage.setItem(tutorialStorageKey, "seen");
    } catch {
      // Tutorial can still close if localStorage is unavailable.
    }

    setIsTutorialOpen(false);
  }, [tutorialStorageKey]);

  // Guard: never show anything other than "sleeping" before work starts
  const displayAgentState = isWorkStarted ? agentState : "sleeping";

  return (
    <div className="h-screen bg-[#a8b4af] flex flex-col font-sans text-emerald-950 overflow-hidden">
      <header className="h-16 bg-[#f0f4f2] border-b border-emerald-500/30 px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="p-2 hover:bg-emerald-300/50 rounded-xl transition-colors mr-2 text-emerald-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/* <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center shadow-emerald-950/20 shadow-lg">
            <span className="text-white font-bold text-xl">
              {username.charAt(0).toUpperCase()}
            </span>
          </div> */}
          <h1 className="text-xl font-black tracking-tight text-emerald-950">
            Bamboost!
          </h1>
          <div className="ml-4 px-3 py-1 bg-emerald-300/60 rounded-full border border-emerald-400/50">
            <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
              Halo, {username}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isInteractionLocked && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 shadow-lg shadow-emerald-400/50 ring-2 ring-emerald-300 ring-offset-1">
              <CheckCircle2 className="h-4 w-4 text-white" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white">
                Selesai!
              </span>
            </div>
          )}
          {!isInteractionLocked && (
            <div
              className={
                showTimeTaken
                  ? "flex items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-300/60 px-2.5 py-1.5 text-xs font-black text-emerald-950 shadow-sm"
                  : "flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-400"
              }
            >
              <button
                type="button"
                onClick={() => setShowTimeTaken((shown) => !shown)}
                className={
                  showTimeTaken
                    ? "flex items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors hover:bg-emerald-200/70"
                    : "flex items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-200/70"
                }
                title={
                  showTimeTaken
                    ? "Sembunyikan time taken"
                    : "Tampilkan time taken"
                }
              >
                {showTimeTaken ? (
                  <Timer className="h-4 w-4 text-emerald-700" />
                ) : (
                  <TimerOff className="h-4 w-4 text-slate-400" />
                )}
                {showTimeTaken ? (
                  <span>Time Taken: {formattedTimeTaken}</span>
                ) : (
                  <span className="line-through">Timer Hidden</span>
                )}
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setTutorialStep(0);
              setIsTutorialOpen(true);
            }}
            className="p-2 hover:bg-emerald-300/50 rounded-full transition-colors"
            type="button"
            title="Buka tutorial"
          >
            <HelpCircle className="w-5 h-5 text-emerald-900" />
          </button>
        </div>
      </header>

      <main
        className={cn(
          "flex-1 flex overflow-hidden",
          resizeMode && "select-none",
          resizeMode === "problem" || resizeMode === "assistant"
            ? "cursor-col-resize"
            : "",
        )}
      >
        <AnimatePresence initial={false}>
          {isProblemPanelOpen ? (
            <motion.aside
              key="problem-panel"
              layout
              initial={{ width: 48, opacity: 0.85 }}
              animate={{ width: problemPanelWidth, opacity: 1 }}
              exit={{ width: 48, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col bg-[#e8edea] overflow-hidden shrink-0"
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">
                  <section className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-900 text-white rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h2 className="min-w-0 flex-1 text-xl font-black tracking-tight text-emerald-950">
                        {problem.title}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsProblemPanelOpen(false)}
                        className="shrink-0 rounded-lg border border-emerald-400/50 bg-white/80 p-1.5 text-emerald-900 transition-colors hover:bg-emerald-100"
                        title="Tutup panel soal"
                      >
                        <PanelLeftClose className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          problem.difficulty === "Easy"
                            ? "bg-emerald-300 text-emerald-950"
                            : problem.difficulty === "Medium"
                              ? "bg-amber-300 text-amber-950"
                              : "bg-red-300 text-red-950",
                        )}
                      >
                        {problem.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 text-[10px] font-black uppercase tracking-widest">
                        {problem.category}
                      </span>
                    </div>

                    <div className="prose prose-emerald max-w-none">
                      <p className="text-emerald-950 font-bold leading-relaxed whitespace-pre-wrap text-sm">
                        {problem.description}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-4 pt-8 border-t border-emerald-400/50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">
                      Contoh
                    </h3>
                    {hasTestCases ? (
                      problem.testCases.map((tc, index) => (
                        <div key={tc.id} className="space-y-2">
                          <p className="text-[11px] font-black text-emerald-900">
                            Contoh {index + 1}:
                          </p>
                          <div className="bg-white/90 rounded-xl p-3 space-y-2 border border-emerald-400/50 shadow-sm">
                            <p className="text-[10px] font-mono font-black">
                              <span className="text-emerald-700">Input:</span>{" "}
                              {tc.input}
                            </p>
                            <p className="text-[10px] font-mono font-black">
                              <span className="text-emerald-700">Output:</span>{" "}
                              {tc.expectedOutput}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white/90 rounded-xl p-3 border border-emerald-400/50 shadow-sm">
                        <p className="text-[11px] font-bold text-emerald-800">
                          Tidak ada contoh test case yang disediakan untuk
                          tantangan ini.
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </motion.aside>
          ) : (
            <motion.button
              key="problem-tab"
              layout
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 48, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              type="button"
              onClick={() => setIsProblemPanelOpen(true)}
              className="flex shrink-0 flex-col items-center gap-3 border-r border-emerald-500/30 bg-[#e8edea] px-2 py-4 text-emerald-950 transition-colors hover:bg-emerald-100"
              title="Buka panel soal"
            >
              <PanelLeftOpen className="h-5 w-5" />
              <span className="rotate-180 whitespace-nowrap text-[10px] font-black uppercase tracking-widest [writing-mode:vertical-rl]">
                Soal
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {isProblemPanelOpen && (
          <div
            onMouseDown={startHorizontalResize("problem")}
            className={cn(
              "group relative z-20 flex w-2 shrink-0 cursor-col-resize items-center justify-center border-x border-emerald-500/20 bg-[#dfe7e3] transition-colors hover:bg-emerald-300/70",
              resizeMode === "problem" && "bg-emerald-400/80",
            )}
            title="Geser untuk mengatur lebar panel soal"
          >
            <GripVertical className="h-4 w-4 text-emerald-900/50 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}

        <div className="flex-1 flex flex-col bg-[#1e1e1e] min-h-0 min-w-[360px] overflow-hidden">
          <div className="h-12 bg-[#252526] px-4 flex items-center justify-between border-b border-[#3d3d3d] shrink-0">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-emerald-500" />
              <span className="text-[#cccccc] text-xs font-bold tracking-wider">
                main.py
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => runCode(selectedTestCase.input)}
                disabled={!isWorkStarted || isRunning || isInteractionLocked}
                className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg text-[11px] font-bold hover:bg-emerald-600/30 transition-all disabled:opacity-50"
                type="button"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Jalankan Test Case
              </button>
              <button
                onClick={() => void submitCode()}
                disabled={!isWorkStarted || isRunning || isInteractionLocked}
                className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                type="button"
              >
                <Upload className="w-3.5 h-3.5" />
                Submit Kode
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <CodeEditor
              code={code}
              onChange={handleCodeChange}
              readOnly={!isWorkStarted || isInteractionLocked}
            />
            <AnimatePresence>
              {!isWorkStarted && (
                <motion.div
                  className="absolute inset-0 z-30 flex items-center justify-center bg-[#1e1e1e]/82 p-6 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-full max-w-md rounded-xl border border-emerald-500/30 bg-[#101916] p-6 text-center shadow-2xl shadow-black/35"
                    initial={{ y: 16, scale: 0.98 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 12, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-600/40 bg-emerald-500/10 text-emerald-300">
                      <Play className="h-7 w-7 fill-current" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-emerald-50">
                      Siap mulai mengerjakan?
                    </h2>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-emerald-100/70">
                      Editor dikunci sementara agar kamu bisa membaca soal dulu.
                      Tekan mulai untuk mengaktifkan editor, test case, submit,
                      timer, dan Bamboost.
                    </p>
                    <button
                      type="button"
                      onClick={startWorking}
                      className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white transition-colors hover:bg-emerald-500"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Mulai Mengerjakan
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            onMouseDown={startResizing}
            className={cn(
              "h-1.5 bg-[#3d3d3d] hover:bg-emerald-600 cursor-ns-resize transition-colors shrink-0 z-20",
              isConsoleResizing && "bg-emerald-600",
            )}
          />

          <div
            style={{ height: `${consoleHeight}px` }}
            className="bg-[#081410] border-t border-emerald-900/50 flex flex-col shrink-0 overflow-hidden"
          >
            <div className="h-10 bg-[#0a1a14] px-4 flex items-center gap-4 border-b border-emerald-900/30">
              <button
                onClick={() => setConsoleTab("testcase")}
                className={cn(
                  "h-full px-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                  consoleTab === "testcase"
                    ? "text-emerald-400 border-emerald-500"
                    : "text-emerald-700 border-transparent hover:text-emerald-500",
                )}
                type="button"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Testcase
              </button>
              <button
                onClick={() => setConsoleTab("result")}
                className={cn(
                  "h-full px-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                  consoleTab === "result"
                    ? "text-emerald-400 border-emerald-500"
                    : "text-emerald-700 border-transparent hover:text-emerald-500",
                )}
                type="button"
              >
                <ListChecks className="w-3.5 h-3.5" />
                Hasil Test
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {consoleTab === "testcase" ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {problem.testCases.map((tc) => (
                      <button
                        key={tc.id}
                        onClick={() => setSelectedTestCaseId(tc.id)}
                        disabled={!isWorkStarted || isInteractionLocked}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50",
                          selectedTestCaseId === tc.id
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                            : "bg-emerald-950/50 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900/30",
                        )}
                        type="button"
                      >
                        Case {tc.id}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1.5 block">
                        Input
                      </label>
                      <div className="bg-[#050d0a] border border-emerald-900/30 rounded-xl p-3 font-mono text-xs text-emerald-100">
                        {selectedTestCase.input === "None"
                          ? "Tidak diperlukan input"
                          : selectedTestCase.input}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1.5 block">
                        Output yang Diharapkan
                      </label>
                      <div className="bg-[#050d0a] border border-emerald-900/30 rounded-xl p-3 font-mono text-xs text-emerald-100 whitespace-pre-wrap">
                        {selectedTestCase.expectedOutput}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!lastResult ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <div className="w-12 h-12 bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-800">
                        <Play className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-emerald-700 italic">
                        Jalankan kode Anda untuk melihat hasilnya...
                      </p>
                    </div>
                  ) : lastResult.judgeResults ? (
                    <div className="space-y-4">
                      {/* Overall Summary */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "text-lg font-black uppercase tracking-tighter",
                                lastResult.status === "Accepted"
                                  ? "text-emerald-400"
                                  : "text-red-400",
                              )}
                            >
                              {lastResult.status}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                              {lastResult.judgeResults.length > 0 &&
                                `${lastResult.judgeResults.filter((r) => r.status === "AC").length}/${lastResult.judgeResults.length} Lulus`}
                            </span>
                          </div>
                          {lastResult.status === "Accepted" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                      </div>

                      {/* Test Cases List */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {publicJudgeResults.map(({ result, index }) => (
                            <button
                              key={result.test_case_id}
                              onClick={() =>
                                setSelectedResultTestCaseIndex(index)
                              }
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                                selectedResultTestCaseIndex === index
                                  ? result.status === "AC"
                                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40"
                                    : "bg-red-600 text-white border-red-500 shadow-md shadow-red-900/30"
                                  : result.status === "AC"
                                    ? "bg-emerald-950/50 text-emerald-500 hover:bg-emerald-900/50 border-emerald-900/30"
                                    : "bg-red-950/20 text-red-400 hover:bg-red-950/30 border-red-900/30",
                              )}
                              type="button"
                            >
                              Case {index + 1}
                            </button>
                          ))}

                          {hiddenJudgeResults.length > 0 && (
                            <div className="flex items-center gap-2">
                              {publicJudgeResults.length > 0 && (
                                <span className="text-emerald-800/70 font-bold">
                                  |
                                </span>
                              )}
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                                Hidden
                              </span>
                            </div>
                          )}

                          {hiddenJudgeResults.map(({ result, index }) => (
                            <button
                              key={result.test_case_id}
                              onClick={() =>
                                setSelectedResultTestCaseIndex(index)
                              }
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                                selectedResultTestCaseIndex === index
                                  ? result.status === "AC"
                                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40"
                                    : "bg-red-600 text-white border-red-500 shadow-md shadow-red-900/30"
                                  : result.status === "AC"
                                    ? "bg-emerald-950/50 text-emerald-500 hover:bg-emerald-900/50 border-emerald-900/30"
                                    : "bg-red-950/20 text-red-400 hover:bg-red-950/30 border-red-900/30",
                              )}
                              type="button"
                            >
                              Case {index + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Selected Test Case Details */}
                      {selectedJudgeResult && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                            <span
                              className={cn(
                                selectedJudgeResult.status === "AC"
                                  ? "text-emerald-400"
                                  : "text-red-400",
                              )}
                            >
                              {selectedJudgeResult.message}
                            </span>
                            <span className="text-emerald-800/70">|</span>
                            <span>
                              {formatUsageValue(selectedJudgeResult.time_used)}
                              ms
                            </span>
                            <span className="text-emerald-800/70">|</span>
                            <span>
                              {formatUsageValue(
                                selectedJudgeResult.memory_used * 1024,
                              )}
                              KB
                            </span>
                          </div>
                          {selectedJudgeResult.stdout && (
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block mb-1.5">
                                Stdout
                              </label>
                              <div className="bg-[#050d0a] border border-emerald-900 rounded-xl p-3 font-mono text-xs text-emerald-100 whitespace-pre-wrap min-h-12 max-h-37.5 overflow-y-auto custom-scrollbar">
                                {selectedJudgeResult.stdout}
                              </div>
                            </div>
                          )}
                          <div className="gap-3">
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block mb-1.5">
                                Input
                              </label>
                              <div className="bg-[#050d0a] border border-emerald-900 rounded-xl p-3 font-mono text-xs text-emerald-100 whitespace-pre-wrap min-h-12 max-h-37.5 overflow-y-auto custom-scrollbar">
                                {selectedJudgeResult.input || "Tidak ada input"}
                              </div>
                            </div>
                          </div>

                          {selectedJudgeResult.error ? (
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-red-600/70 block mb-1.5">
                                Kesalahan
                              </label>
                              <div className="bg-red-950/20 border border-red-900 rounded-xl p-3 font-mono text-xs text-red-100 whitespace-pre-wrap max-h-37.5 overflow-y-auto custom-scrollbar">
                                {selectedJudgeResult.error}
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block mb-1.5">
                                  Output Anda
                                </label>
                                <div
                                  className={cn(
                                    "bg-[#050d0a] border rounded-xl p-3 font-mono text-xs whitespace-pre-wrap min-h-20 max-h-37.5 overflow-y-auto custom-scrollbar",
                                    selectedJudgeResult.status === "AC"
                                      ? "border-emerald-900 text-emerald-100"
                                      : "border-red-900/50 text-red-100 bg-red-950/10",
                                  )}
                                >
                                  {selectedJudgeResult.output || "No output"}
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block mb-1.5">
                                  Output yang Diharapkan
                                </label>
                                <div className="bg-[#050d0a] border border-emerald-900 rounded-xl p-3 font-mono text-xs text-emerald-100 whitespace-pre-wrap min-h-20 max-h-37.5 overflow-y-auto custom-scrollbar">
                                  {selectedJudgeResult.expected ||
                                    "No expected output"}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-emerald-900/20 pb-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "text-lg font-black uppercase tracking-tighter",
                              lastResult.status === "Accepted"
                                ? "text-emerald-400"
                                : "text-red-400",
                            )}
                          >
                            {lastResult.status}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                            Runtime: {lastResult.runtime}ms
                          </span>
                        </div>
                        {lastResult.status === "Accepted" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block">
                            Output Anda
                          </label>
                          <div
                            className={cn(
                              "bg-[#050d0a] border rounded-xl p-3 font-mono text-xs whitespace-pre-wrap min-h-15",
                              lastResult.isCorrect
                                ? "border-emerald-900/30 text-emerald-100"
                                : "border-red-900/30 text-red-100 bg-red-950/10",
                            )}
                          >
                            {lastResult.output.length > 0
                              ? lastResult.output.join("\n")
                              : "No output"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 block">
                            Output yang Diharapkan
                          </label>
                          <div className="bg-[#050d0a] border border-emerald-900/30 rounded-xl p-3 font-mono text-xs text-emerald-100 whitespace-pre-wrap min-h-15">
                            {selectedTestCase.expectedOutput}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          onMouseDown={startHorizontalResize("assistant")}
          className={cn(
            "group relative z-20 flex w-2 shrink-0 cursor-col-resize items-center justify-center border-x border-emerald-500/20 bg-[#dfe7e3] transition-colors hover:bg-emerald-300/70",
            resizeMode === "assistant" && "bg-emerald-400/80",
          )}
          title="Geser untuk mengatur lebar panel Bamboost"
        >
          <GripVertical className="h-4 w-4 text-emerald-900/50 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <motion.div
          layout
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: assistantPanelWidth }}
          className="flex flex-col bg-white overflow-hidden shrink-0"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isChatOpen ? (
              <motion.div
                key="chat-panel"
                className="flex h-full min-h-0 flex-col"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChatBot
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  username={username}
                  isTyping={isTyping}
                  disabled={!isWorkStarted || isInteractionLocked}
                  isOpen={isChatOpen}
                  setIsOpen={setIsChatOpen}
                  isMinimized={isMinimized}
                  setIsMinimized={setIsMinimized}
                  isExpanded={isExpanded}
                  setIsExpanded={setIsExpanded}
                  agentState={displayAgentState}
                  helpCheckInType={helpCheckInType}
                  stuckHelpNoReasons={stuckHelpNoReasons}
                  stuckHelpYesReason={stuckHelpYesReason}
                  onStuckHelpChoiceNo={handleStuckHelpChoiceNo}
                  onStuckHelpChoiceYes={handleStuckHelpChoiceYes}
                  isStuckHelpSubmitting={isIdleHelpSubmitting}
                  embedded
                />
              </motion.div>
            ) : (
              <motion.div
                key="mascot-panel"
                className="flex-1 flex flex-col p-6 space-y-6"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex flex-col items-center py-8 space-y-6">
                  <button
                    onClick={() => {
                      if (!isWorkStarted) {
                        setAgentState("sleeping");
                        setAgentMessage(
                          "Bamboost masih tidur. Tekan Mulai Mengerjakan dulu ya.",
                        );
                        return;
                      }

                      if (isInteractionLocked) {
                        setIsChatOpen(true);
                        setHasClickedMascot(true);
                        return;
                      }

                      setIsChatOpen(true);
                      setHasClickedMascot(true);
                    }}
                    className={cn(
                      "group relative w-48 h-48 rounded-2xl flex items-center justify-center overflow-visible transition-all border",
                      isInteractionLocked
                        ? "border-emerald-400 bg-emerald-50/60 ring-4 ring-emerald-300/60 ring-offset-2 shadow-lg shadow-emerald-200"
                        : "bg-transparent border-transparent hover:border-emerald-200 hover:bg-emerald-50/70",
                    )}
                    type="button"
                  >
                    <div className="scale-150">
                      <PandaMascot state={displayAgentState} />
                    </div>
                    {!isChatOpen && !hasClickedMascot && (
                      <div className="absolute top-4 right-4 w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>

                  <AnimatePresence mode="wait">
                    {isInteractionLocked && (!isChatOpen || isMinimized) && (
                      <motion.div
                        key="completed-celebration"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="relative w-full max-w-[340px] bg-emerald-50 border-2 border-emerald-400 p-5 rounded-xl shadow-md text-center"
                      >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-emerald-50 border-t-2 border-l-2 border-emerald-400 rotate-45" />
                        <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500" />
                        <p className="text-sm font-black text-emerald-900 leading-snug">
                          Luar biasa! Semua test case lulus.
                        </p>
                        <p className="mt-1 text-xs font-semibold text-emerald-700/80">
                          Challenge ini sudah berhasil kamu selesaikan.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChatOpen(true);
                            setHasClickedMascot(true);
                          }}
                          className="mt-4 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-emerald-600"
                        >
                          Lihat Riwayat Chat
                        </button>
                      </motion.div>
                    )}
                    {!isInteractionLocked &&
                      helpCheckInType !== null &&
                      (!isChatOpen || isMinimized) && (
                        <motion.div
                          key="idle-help-check-in"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="relative bg-[#f8faf9] border border-emerald-400/30 p-5 rounded-lg shadow-sm max-w-[min(100vw-2rem,340px)] w-[min(100vw-2rem,340px)]"
                        >
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#f8faf9] border-t-2 border-l-2 border-emerald-400/30 rotate-45" />
                          <p className="text-sm font-black text-emerald-950 leading-snug text-center mb-3">
                            {helpCheckInType === "error"
                              ? "Kamu kelihatannya kesulitan memperbaiki error. Butuh bantuan?"
                              : "Sudah cukup lama tanpa submit. Butuh bantuan?"}
                          </p>
                          <div className="flex flex-col gap-2">
                            {stuckHelpNoReasons.map((reason) => (
                              <button
                                key={reason.id}
                                type="button"
                                disabled={isIdleHelpSubmitting}
                                onClick={() =>
                                  void handleStuckHelpChoiceNo(reason)
                                }
                                className="w-full text-left text-xs font-bold text-emerald-950 bg-white border border-emerald-300/80 rounded-xl px-3 py-2.5 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                              >
                                {reason.description}
                              </button>
                            ))}
                            {stuckHelpYesReason && (
                              <button
                                type="button"
                                disabled={isIdleHelpSubmitting}
                                onClick={() =>
                                  void handleStuckHelpChoiceYes(
                                    stuckHelpYesReason,
                                  )
                                }
                                className="w-full text-left text-xs font-black text-white bg-emerald-700 border border-emerald-800 rounded-xl px-3 py-2.5 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                              >
                                {isIdleHelpSubmitting
                                  ? "Memuat…"
                                  : stuckHelpYesReason.description}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    {!isInteractionLocked &&
                      helpCheckInType === null &&
                      agentMessage &&
                      (!isChatOpen || isMinimized) && (
                        <motion.div
                          key={agentMessage}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="relative w-full max-w-[340px] bg-[#f8faf9] border border-emerald-400/30 p-5 rounded-lg shadow-sm text-center"
                        >
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#f8faf9] border-t-2 border-l-2 border-emerald-400/30 rotate-45" />
                          <div
                            className={cn(
                              "relative",
                              isAgentMessageLong && "max-h-36 overflow-hidden",
                            )}
                          >
                            <p className="text-sm font-black text-emerald-950 leading-relaxed">
                              {agentMessage}
                            </p>
                            {isAgentMessageLong && (
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#f8faf9] to-transparent" />
                            )}
                          </div>
                          {isAgentMessageLong && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsChatOpen(true);
                                setHasClickedMascot(true);
                              }}
                              className="mt-4 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-emerald-600"
                            >
                              Buka chat room untuk lihat lengkap
                            </button>
                          )}
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <AnimatePresence>
        {isTutorialOpen && currentTutorialSlide && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-emerald-950/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="challenge-tutorial-title"
          >
            <motion.div
              // 1. Modal diperlebar ke max-w-4xl agar layout 50/50 tidak terlalu sempit
              className="w-full max-w-4xl overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl shadow-emerald-950/20"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/70 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-200 bg-white">
                    <div className="origin-center scale-[0.38]">
                      <PandaMascot state={currentTutorialSlide.mascotState} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
                      Tutorial Bamboost
                    </p>
                    <h2
                      id="challenge-tutorial-title"
                      className="truncate text-xl font-black tracking-tight text-emerald-950"
                    >
                      {currentTutorialSlide.title}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeTutorial}
                  className="rounded-lg p-2 text-emerald-800 transition-colors hover:bg-white hover:text-emerald-950"
                  title="Tutup tutorial"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* 2. Grid diubah ke 50/50 agar seimbang */}
              <div className="grid gap-0 md:grid-cols-2">
                {/* Padding kiri diperbesar jadi p-8 biar lebih 'breatheable' */}
                <div className="flex min-h-[360px] flex-col justify-between p-8 md:min-h-[420px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tutorialStep}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <div className="inline-flex rounded-full bg-emerald-100 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-800">
                        {tutorialStep + 1} dari {TUTORIAL_SLIDES.length}
                      </div>
                      {/* 3. Ukuran text diperbesar agar persis referensi SS */}
                      <p className="text-lg font-bold leading-relaxed text-slate-700 md:text-xl">
                        {currentTutorialSlide.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="space-y-6 pt-8">
                    <div className="flex gap-2.5">
                      {TUTORIAL_SLIDES.map((slide, index) => (
                        <button
                          key={slide.title}
                          type="button"
                          onClick={() => setTutorialStep(index)}
                          className={cn(
                            "h-2.5 rounded-full transition-all",
                            index === tutorialStep
                              ? "w-10 bg-emerald-700"
                              : "w-2.5 bg-emerald-200 hover:bg-emerald-300",
                          )}
                          title={`Buka slide ${index + 1}`}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={closeTutorial}
                        className="px-2 text-sm font-bold text-emerald-800 transition-colors hover:text-emerald-950"
                      >
                        Lewati
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setTutorialStep((step) => Math.max(step - 1, 0))
                          }
                          disabled={tutorialStep === 0}
                          className="flex h-11 items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-5 text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Kembali
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (tutorialStep === TUTORIAL_SLIDES.length - 1) {
                              closeTutorial();
                              return;
                            }
                            setTutorialStep((step) => step + 1);
                          }}
                          className="flex h-11 items-center gap-2.5 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white transition-colors hover:bg-emerald-600"
                        >
                          {tutorialStep === TUTORIAL_SLIDES.length - 1
                            ? "Mulai"
                            : "Lanjut"}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Panel background gambar diubah menjadi pale green yang lebih kalem */}
                <div className="flex items-center justify-center border-t border-emerald-100 bg-[#f4f9f6] p-8 md:border-l md:border-t-0">
                  {currentTutorialSlide.image ? (
                    <div className="relative flex min-h-[260px] w-full items-center justify-center">
                      {/* 5. FIX UTAMA: object-cover diganti object-contain agar screenshot tidak ter-crop */}
                      <NextImage
                        src={currentTutorialSlide.image}
                        alt={currentTutorialSlide.title}
                        className="max-h-[380px] w-full rounded-xl object-contain drop-shadow-md"
                        placeholder="blur"
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-white/80 p-5">
                      <div className="origin-center scale-[1.8]">
                        <PandaMascot state={currentTutorialSlide.mascotState} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="h-8 bg-emerald-950 text-emerald-100 px-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Sistem Online
          </div>
          <div className="text-emerald-500/60">|</div>
          <div>Python 3.10</div>
        </div>
        <div className="flex items-center gap-4">
          <div>UTF-8</div>
          <div className="text-emerald-500/60">|</div>
          <div>Baris 1, Kolom 1</div>
        </div>
      </footer>
    </div>
  );
}
