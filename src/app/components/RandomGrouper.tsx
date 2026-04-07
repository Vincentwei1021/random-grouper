"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const GROUP_NAMES = [
  "第一组", "第二组", "第三组", "第四组", "第五组", "第六组",
  "第七组", "第八组", "第九组", "第十组", "第十一组", "第十二组",
];

interface SavedList {
  name: string;
  names: string;
}

type GroupMode = "byGroups" | "bySize";

function parseNames(input: string): string[] {
  return input
    .split(/[\n,，\s]+/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function distributeIntoGroups(
  names: string[],
  groupCount: number,
  leaders: Set<string>
): string[][] {
  const leaderList = names.filter((n) => leaders.has(n));
  const nonLeaders = shuffle(names.filter((n) => !leaders.has(n)));

  const actualGroupCount = Math.min(groupCount, names.length);
  const groups: string[][] = Array.from({ length: actualGroupCount }, () => []);

  // Place leaders first, one per group
  const shuffledLeaders = shuffle(leaderList);
  for (let i = 0; i < Math.min(shuffledLeaders.length, actualGroupCount); i++) {
    groups[i].push(shuffledLeaders[i]);
  }

  // Distribute remaining names evenly
  let idx = 0;
  for (const name of nonLeaders) {
    groups[idx % actualGroupCount].push(name);
    idx++;
  }
  // Any extra leaders beyond group count
  for (let i = actualGroupCount; i < shuffledLeaders.length; i++) {
    groups[i % actualGroupCount].push(shuffledLeaders[i]);
  }

  return groups;
}

export default function RandomGrouper() {
  const [nameInput, setNameInput] = useState("");
  const [mode, setMode] = useState<GroupMode>("byGroups");
  const [groupCount, setGroupCount] = useState(4);
  const [groupSize, setGroupSize] = useState(4);
  const [groups, setGroups] = useState<string[][]>([]);
  const [leaders, setLeaders] = useState<Set<string>>(new Set());
  const [isShuffling, setIsShuffling] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [saveListName, setSaveListName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showLeaderPicker, setShowLeaderPicker] = useState(false);
  const [customGroupNames, setCustomGroupNames] = useState<string[]>([]);
  const [editingGroupName, setEditingGroupName] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [imageFeedback, setImageFeedback] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const names = parseNames(nameInput);

  // Load saved lists from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("randomGrouper_savedLists");
      if (saved) setSavedLists(JSON.parse(saved));
      const lastInput = localStorage.getItem("randomGrouper_lastInput");
      if (lastInput) setNameInput(lastInput);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist saved lists
  useEffect(() => {
    try {
      localStorage.setItem(
        "randomGrouper_savedLists",
        JSON.stringify(savedLists)
      );
    } catch {
      // Ignore storage errors
    }
  }, [savedLists]);

  // Persist current input
  useEffect(() => {
    try {
      localStorage.setItem("randomGrouper_lastInput", nameInput);
    } catch {
      // Ignore storage errors
    }
  }, [nameInput]);

  const actualGroupCount =
    mode === "byGroups"
      ? groupCount
      : Math.ceil(names.length / groupSize);

  const handleGroup = useCallback(() => {
    if (names.length < 2) return;

    setIsShuffling(true);
    setShowResults(false);

    setTimeout(() => {
      const result = distributeIntoGroups(names, actualGroupCount, leaders);
      setGroups(result);
      setIsShuffling(false);
      setShowResults(true);
    }, 800);
  }, [names, actualGroupCount, leaders]);

  const handleRegroup = useCallback(() => {
    handleGroup();
  }, [handleGroup]);

  const handleSaveList = () => {
    if (!saveListName.trim()) return;
    const newList: SavedList = { name: saveListName.trim(), names: nameInput };
    setSavedLists((prev) => {
      const existing = prev.findIndex((l) => l.name === newList.name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newList;
        return updated;
      }
      return [...prev, newList];
    });
    setSaveListName("");
    setShowSaveDialog(false);
  };

  const handleLoadList = (list: SavedList) => {
    setNameInput(list.names);
    setShowLoadDialog(false);
    setGroups([]);
    setShowResults(false);
    setLeaders(new Set());
  };

  const handleDeleteList = (name: string) => {
    setSavedLists((prev) => prev.filter((l) => l.name !== name));
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setNameInput(text);
    } catch {
      // Fallback: user manually pastes
    }
  };

  const toggleLeader = (name: string) => {
    setLeaders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCopyResults = async () => {
    const text = groups
      .map((group, i) => {
        const gName = customGroupNames[i] || GROUP_NAMES[i] || `第${i + 1}组`;
        const leaderTag = (n: string) => (leaders.has(n) ? "（组长）" : "");
        return `${gName}：${group.map((n) => n + leaderTag(n)).join("、")}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleExportImage = async () => {
    if (!resultsRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: "#faf7ff",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `分组结果_${new Date().toLocaleDateString("zh-CN")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setImageFeedback(true);
      setTimeout(() => setImageFeedback(false), 2000);
    } catch {
      // Ignore export errors
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getGroupName = (index: number) =>
    customGroupNames[index] || GROUP_NAMES[index] || `第${index + 1}组`;

  const handleGroupNameEdit = (index: number, newName: string) => {
    setCustomGroupNames((prev) => {
      const next = [...prev];
      next[index] = newName;
      return next;
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Header */}
      <header className="text-center mb-8 sm:mb-12 no-print">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-violet-primary flex items-center justify-center shadow-lg shadow-violet-primary/25">
            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            随机分组器
          </h1>
        </div>
        <p className="text-base sm:text-lg text-foreground/55 font-medium">
          课堂教学分组 · 团队活动分队 · 一键随机分配
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Input & Options */}
        <div className="lg:col-span-5 space-y-5 no-print">
          {/* Name Input Card */}
          <section className="bg-white rounded-2xl shadow-sm border border-violet-primary/10 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-violet-primary" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                学生名单
              </h2>
              {names.length > 0 && (
                <span className="text-sm font-bold bg-violet-primary/10 text-violet-primary px-3 py-1 rounded-full">
                  共 {names.length} 人
                </span>
              )}
            </div>

            <textarea
              className="w-full h-40 sm:h-48 p-4 border-2 border-violet-primary/15 rounded-xl text-base sm:text-lg focus:outline-none focus:border-violet-primary/40 focus:ring-4 focus:ring-violet-primary/10 resize-none bg-violet-primary/[0.02] placeholder:text-foreground/30 transition-all"
              placeholder={"输入学生姓名\n支持每行一个、逗号分隔或空格分隔\n例如：张三 李四 王五"}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={handlePasteFromClipboard}
                className="btn-press flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-violet-primary bg-violet-primary/8 hover:bg-violet-primary/15 rounded-lg transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                </svg>
                从剪贴板粘贴
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={names.length === 0}
                className="btn-press flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-violet-primary bg-violet-primary/8 hover:bg-violet-primary/15 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                保存名单
              </button>
              <button
                onClick={() => setShowLoadDialog(true)}
                disabled={savedLists.length === 0}
                className="btn-press flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-violet-primary bg-violet-primary/8 hover:bg-violet-primary/15 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                加载名单
                {savedLists.length > 0 && (
                  <span className="bg-violet-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {savedLists.length}
                  </span>
                )}
              </button>
            </div>
          </section>

          {/* Grouping Options Card */}
          <section className="bg-white rounded-2xl shadow-sm border border-violet-primary/10 p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 mb-4">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-violet-primary" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.36-5.64l-4.24 4.24m-2.24-2.24L5.64 5.64m12.72 12.72l-4.24-4.24m-2.24 2.24l-4.24 4.24" />
              </svg>
              分组设置
            </h2>

            {/* Mode selector */}
            <div className="flex rounded-xl bg-violet-primary/5 p-1 mb-5">
              <button
                onClick={() => setMode("byGroups")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  mode === "byGroups"
                    ? "bg-violet-primary text-white shadow-md shadow-violet-primary/25"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                按组数分
              </button>
              <button
                onClick={() => setMode("bySize")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  mode === "bySize"
                    ? "bg-violet-primary text-white shadow-md shadow-violet-primary/25"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                按每组人数
              </button>
            </div>

            {mode === "byGroups" ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-foreground/70">
                    分组数量
                  </label>
                  <span className="text-2xl font-black text-violet-primary">
                    {groupCount}
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-foreground/40 mt-1 px-0.5">
                  <span>2</span>
                  <span>12</span>
                </div>
                {names.length > 0 && (
                  <p className="text-sm text-foreground/50 mt-2">
                    每组约{" "}
                    <span className="font-bold text-violet-primary">
                      {Math.floor(names.length / groupCount)}
                      {names.length % groupCount > 0
                        ? `~${Math.ceil(names.length / groupCount)}`
                        : ""}
                    </span>{" "}
                    人
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-foreground/70">
                    每组人数
                  </label>
                  <span className="text-2xl font-black text-violet-primary">
                    {groupSize}
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-foreground/40 mt-1 px-0.5">
                  <span>2</span>
                  <span>10</span>
                </div>
                {names.length > 0 && (
                  <p className="text-sm text-foreground/50 mt-2">
                    将分为{" "}
                    <span className="font-bold text-violet-primary">
                      {Math.ceil(names.length / groupSize)}
                    </span>{" "}
                    组
                  </p>
                )}
              </div>
            )}

            {/* Leader picker toggle */}
            {names.length >= 2 && (
              <div className="mt-5 pt-4 border-t border-foreground/8">
                <button
                  onClick={() => setShowLeaderPicker(!showLeaderPicker)}
                  className="btn-press flex items-center gap-2 text-sm font-semibold text-foreground/70 hover:text-violet-primary transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  保留组长
                  {leaders.size > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">
                      已选 {leaders.size} 人
                    </span>
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-4 h-4 transition-transform ${showLeaderPicker ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showLeaderPicker && (
                  <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/50">
                    <p className="text-xs text-foreground/50 mb-2">
                      点击选择组长，组长在重新分组时保持不变
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {names.map((name) => (
                        <button
                          key={name}
                          onClick={() => toggleLeader(name)}
                          className={`btn-press px-2.5 py-1 rounded-lg text-sm font-medium transition-all ${
                            leaders.has(name)
                              ? "bg-amber-400 text-white shadow-sm"
                              : "bg-white text-foreground/70 border border-foreground/10 hover:border-amber-300"
                          }`}
                        >
                          {leaders.has(name) && "★ "}
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Action Button */}
          <button
            onClick={showResults ? handleRegroup : handleGroup}
            disabled={names.length < 2 || isShuffling}
            className={`btn-press w-full py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-black text-white transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
              isShuffling
                ? "bg-violet-primary/70"
                : showResults
                  ? "bg-gradient-to-r from-violet-primary to-purple-500 hover:from-violet-dark hover:to-purple-600 shadow-violet-primary/30 hover:shadow-violet-primary/40"
                  : "bg-violet-primary hover:bg-violet-dark shadow-violet-primary/30 hover:shadow-violet-primary/40 animate-pulse-glow"
            }`}
          >
            {isShuffling ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                正在分组...
              </span>
            ) : showResults ? (
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                一键重新分组
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                开始分组
              </span>
            )}
          </button>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-7">
          {/* Shuffle animation overlay */}
          {isShuffling && (
            <div className="rounded-2xl p-10 sm:p-16 flex flex-col items-center justify-center shuffle-overlay">
              <div className="flex gap-2 mb-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-14 sm:w-12 sm:h-16 bg-white/90 rounded-lg shadow-lg animate-card-shuffle"
                    style={{ animationDelay: `${i * 0.08}s`, animationIterationCount: "infinite" }}
                  />
                ))}
              </div>
              <p className="text-white font-bold text-lg sm:text-xl">
                随机分配中...
              </p>
            </div>
          )}

          {/* Results */}
          {showResults && !isShuffling && (
            <div>
              {/* Export toolbar */}
              <div className="flex flex-wrap items-center gap-2 mb-4 no-print">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mr-auto">
                  分组结果
                </h2>
                <button
                  onClick={handleCopyResults}
                  className="btn-press flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-foreground/70 bg-white border border-foreground/10 hover:border-violet-primary/30 hover:text-violet-primary rounded-lg transition-all shadow-sm"
                >
                  {copyFeedback ? (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      已复制
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      复制文本
                    </>
                  )}
                </button>
                <button
                  onClick={handleExportImage}
                  className="btn-press flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-foreground/70 bg-white border border-foreground/10 hover:border-violet-primary/30 hover:text-violet-primary rounded-lg transition-all shadow-sm"
                >
                  {imageFeedback ? (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      已保存
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      保存图片
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="btn-press flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-foreground/70 bg-white border border-foreground/10 hover:border-violet-primary/30 hover:text-violet-primary rounded-lg transition-all shadow-sm"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  打印
                </button>
              </div>

              {/* Group cards */}
              <div
                ref={resultsRef}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {groups.map((group, i) => (
                  <div
                    key={i}
                    className={`group-card-${i % 12} rounded-2xl border-2 overflow-hidden shadow-sm animate-card-deal`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {/* Group header */}
                    <div
                      className={`group-header-${i % 12} px-4 py-2.5 flex items-center justify-between`}
                    >
                      {editingGroupName === i ? (
                        <input
                          autoFocus
                          className="bg-white/20 text-white placeholder:text-white/50 font-bold text-base px-2 py-0.5 rounded outline-none"
                          value={customGroupNames[i] || ""}
                          placeholder={GROUP_NAMES[i]}
                          onChange={(e) =>
                            handleGroupNameEdit(i, e.target.value)
                          }
                          onBlur={() => setEditingGroupName(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingGroupName(null);
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingGroupName(i)}
                          className="text-white font-bold text-base sm:text-lg hover:underline decoration-white/50 underline-offset-2 no-print-btn"
                          title="点击自定义组名"
                        >
                          {getGroupName(i)}
                        </button>
                      )}
                      <span className="text-white/80 text-sm font-semibold">
                        {group.length}人
                      </span>
                    </div>

                    {/* Group members */}
                    <div className="p-4 flex flex-wrap gap-2">
                      {group.map((name, j) => (
                        <span
                          key={name}
                          className={`animate-name-pop inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm sm:text-base font-semibold ${
                            leaders.has(name)
                              ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300"
                              : "bg-white/80 text-foreground/80"
                          }`}
                          style={{
                            animationDelay: `${i * 0.1 + j * 0.04 + 0.2}s`,
                          }}
                        >
                          {leaders.has(name) && (
                            <span className="text-amber-500 text-xs">★</span>
                          )}
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!showResults && !isShuffling && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-violet-primary/5 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" className="w-10 h-10 sm:w-12 sm:h-12 text-violet-primary/25" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <p className="text-foreground/30 font-semibold text-lg sm:text-xl mb-1">
                分组结果将在这里显示
              </p>
              <p className="text-foreground/20 text-sm sm:text-base">
                {names.length < 2
                  ? "请先输入至少2个学生姓名"
                  : "点击「开始分组」按钮"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground mb-4">
              保存名单
            </h3>
            <input
              autoFocus
              className="w-full px-4 py-3 border-2 border-foreground/10 rounded-xl text-base focus:outline-none focus:border-violet-primary/40 focus:ring-4 focus:ring-violet-primary/10"
              placeholder="输入名单名称，如：三年一班"
              value={saveListName}
              onChange={(e) => setSaveListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveList();
              }}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="btn-press flex-1 py-2.5 rounded-xl text-sm font-bold text-foreground/60 bg-foreground/5 hover:bg-foreground/10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveList}
                disabled={!saveListName.trim()}
                className="btn-press flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-primary hover:bg-violet-dark transition-colors disabled:opacity-40"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load dialog */}
      {showLoadDialog && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLoadDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground mb-4">
              加载名单
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedLists.map((list) => {
                const count = parseNames(list.names).length;
                return (
                  <div
                    key={list.name}
                    className="flex items-center gap-3 p-3 bg-foreground/[0.02] rounded-xl border border-foreground/5 hover:border-violet-primary/20 transition-colors"
                  >
                    <button
                      onClick={() => handleLoadList(list)}
                      className="flex-1 text-left"
                    >
                      <span className="font-bold text-foreground text-base block">
                        {list.name}
                      </span>
                      <span className="text-xs text-foreground/40">
                        {count} 人
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.name)}
                      className="btn-press p-1.5 text-foreground/30 hover:text-red-500 transition-colors"
                      title="删除"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setShowLoadDialog(false)}
              className="btn-press w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-foreground/60 bg-foreground/5 hover:bg-foreground/10 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
