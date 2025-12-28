"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dumbbell,
  Plus,
  Trash2,
  Calendar,
  Loader2,
  FileText,
  Palette,
  Highlighter,
  Minus,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  type Workout,
} from "@/lib/api/workouts";
import { supabase } from "@/lib/supabase";

interface Session {
  id: string;
  title: string;
  content: string;
}

interface Week {
  name: string;
  sessions: Session[];
}

export default function TrainingPage() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form states
  const [newWeekName, setNewWeekName] = useState("");
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [showWeekForm, setShowWeekForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [titleEditOpen, setTitleEditOpen] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isUpdatingContent = useRef(false);

  const sessionTypes = ["Push", "Pull", "Leg", "Upper", "Lower", "Total Body"];
  const textColors = ["#000000", "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];
  const highlightColors = ["transparent", "#FEF3C7", "#DBEAFE", "#D1FAE5", "#FED7AA", "#E9D5FF"];

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save to localStorage whenever weeks change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('training-weeks', JSON.stringify(weeks));
    }
  }, [weeks, isLoading]);

  // Update editor content when session changes
  useEffect(() => {
    if (editorRef.current && selectedWeekIndex !== null && selectedSessionId && !isUpdatingContent.current) {
      const session = weeks[selectedWeekIndex]?.sessions.find(s => s.id === selectedSessionId);
      if (session) {
        editorRef.current.innerHTML = session.content || '';
      }
    }
  }, [selectedWeekIndex, selectedSessionId, weeks]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        // Load from Supabase
        const workouts = await getWorkouts();

        // Group by week_name
        const weeksMap = new Map<string, Session[]>();
        workouts.forEach((w: Workout) => {
          if (!weeksMap.has(w.week_name)) {
            weeksMap.set(w.week_name, []);
          }
          weeksMap.get(w.week_name)!.push({
            id: w.id,
            title: w.note_content.split('\n')[0] || 'Sessione senza titolo',
            content: w.note_content,
          });
        });

        const loadedWeeks: Week[] = Array.from(weeksMap.entries()).map(([name, sessions]) => ({
          name,
          sessions,
        }));

        setWeeks(loadedWeeks);

        // Save to localStorage as backup
        localStorage.setItem('training-weeks', JSON.stringify(loadedWeeks));
      } else {
        // Load from localStorage
        const stored = localStorage.getItem('training-weeks');
        if (stored) {
          setWeeks(JSON.parse(stored));
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);

      // Fallback to localStorage
      const stored = localStorage.getItem('training-weeks');
      if (stored) {
        setWeeks(JSON.parse(stored));
      }
      setIsLoading(false);
    }
  };

  const handleAddWeek = async () => {
    if (!newWeekName.trim()) return;

    const newWeek: Week = {
      name: newWeekName,
      sessions: [],
    };

    // Add new week at the beginning (most recent first)
    setWeeks([newWeek, ...weeks]);
    setSelectedWeekIndex(0);
    setNewWeekName("");
    setShowWeekForm(false);

    // Sync to Supabase if logged in (create a placeholder)
    if (isLoggedIn) {
      await createWorkout(newWeekName, "Nuova settimana");
    }
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;

    // Calculate week range (Monday to Sunday)
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust if Sunday
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // Format week name: "15-21 Gennaio 2025"
    const monthNames = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];

    const weekName = `${monday.getDate()}-${sunday.getDate()} ${monthNames[monday.getMonth()]} ${monday.getFullYear()}`;

    // Check if week already exists
    if (weeks.some(w => w.name === weekName)) {
      // Select existing week
      const weekIndex = weeks.findIndex(w => w.name === weekName);
      setSelectedWeekIndex(weekIndex);
      setCalendarOpen(false);
      return;
    }

    // Create new week
    const newWeek: Week = {
      name: weekName,
      sessions: [],
    };

    setWeeks([newWeek, ...weeks]);
    setSelectedWeekIndex(0);
    setCalendarOpen(false);

    // Sync to Supabase if logged in
    if (isLoggedIn) {
      await createWorkout(weekName, "Nuova settimana");
    }
  };

  const handleAddSession = async () => {
    if (!newSessionTitle.trim() || selectedWeekIndex === null) return;

    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: newSessionTitle,
      content: newSessionTitle,
    };

    const updatedWeeks = [...weeks];
    updatedWeeks[selectedWeekIndex].sessions.push(newSession);
    setWeeks(updatedWeeks);
    setSelectedSessionId(newSession.id);
    setNewSessionTitle("");
    setShowSessionForm(false);

    // Sync to Supabase if logged in
    if (isLoggedIn) {
      const workout = await createWorkout(
        weeks[selectedWeekIndex].name,
        newSessionTitle
      );
      if (workout) {
        // Update the session ID with the real Supabase ID
        const sessionIndex = updatedWeeks[selectedWeekIndex].sessions.findIndex(
          s => s.id === newSession.id
        );
        if (sessionIndex !== -1) {
          updatedWeeks[selectedWeekIndex].sessions[sessionIndex].id = workout.id;
          setWeeks([...updatedWeeks]);
          setSelectedSessionId(workout.id);
        }
      }
    }
  };

  const handleQuickAddSession = async (sessionType: string) => {
    if (selectedWeekIndex === null) return;

    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: sessionType,
      content: sessionType,
    };

    const updatedWeeks = [...weeks];
    updatedWeeks[selectedWeekIndex].sessions.push(newSession);
    setWeeks(updatedWeeks);
    setSelectedSessionId(newSession.id);
    setSessionMenuOpen(false);

    // Sync to Supabase if logged in
    if (isLoggedIn) {
      const workout = await createWorkout(
        weeks[selectedWeekIndex].name,
        sessionType
      );
      if (workout) {
        // Update the session ID with the real Supabase ID
        const sessionIndex = updatedWeeks[selectedWeekIndex].sessions.findIndex(
          s => s.id === newSession.id
        );
        if (sessionIndex !== -1) {
          updatedWeeks[selectedWeekIndex].sessions[sessionIndex].id = workout.id;
          setWeeks([...updatedWeeks]);
          setSelectedSessionId(workout.id);
        }
      }
    }
  };

  const handleDeleteWeek = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Eliminare "${weeks[index].name}" e tutte le sue sessioni?`)) return;

    // Delete from Supabase if logged in
    if (isLoggedIn) {
      const weekName = weeks[index].name;
      const workouts = await getWorkouts();
      const weekWorkouts = workouts.filter((w: Workout) => w.week_name === weekName);
      for (const workout of weekWorkouts) {
        await deleteWorkout(workout.id);
      }
    }

    const updatedWeeks = weeks.filter((_, i) => i !== index);
    setWeeks(updatedWeeks);

    if (selectedWeekIndex === index) {
      setSelectedWeekIndex(null);
      setSelectedSessionId(null);
    } else if (selectedWeekIndex !== null && selectedWeekIndex > index) {
      setSelectedWeekIndex(selectedWeekIndex - 1);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Eliminare questa sessione?")) return;

    // Delete from Supabase if logged in and ID is from Supabase
    if (isLoggedIn && !sessionId.startsWith('session-')) {
      await deleteWorkout(sessionId);
    }

    if (selectedWeekIndex !== null) {
      const updatedWeeks = [...weeks];
      updatedWeeks[selectedWeekIndex].sessions = updatedWeeks[selectedWeekIndex].sessions.filter(
        s => s.id !== sessionId
      );
      setWeeks(updatedWeeks);

      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
      }
    }
  };

  const handleContentChange = (value: string) => {
    if (selectedWeekIndex === null || !selectedSessionId) return;

    isUpdatingContent.current = true;

    // Update local state immediately
    const updatedWeeks = [...weeks];
    const sessionIndex = updatedWeeks[selectedWeekIndex].sessions.findIndex(
      s => s.id === selectedSessionId
    );

    if (sessionIndex !== -1) {
      updatedWeeks[selectedWeekIndex].sessions[sessionIndex].content = value;
      setWeeks(updatedWeeks);

      // Debounced save to Supabase
      if (isLoggedIn && !selectedSessionId.startsWith('session-')) {
        debouncedSave(value, selectedSessionId, updatedWeeks[selectedWeekIndex].name);
      }
    }

    setTimeout(() => {
      isUpdatingContent.current = false;
    }, 0);
  };

  const applyTextColor = (color: string) => {
    document.execCommand('foreColor', false, color);
    editorRef.current?.focus();
  };

  const applyHighlight = (color: string) => {
    document.execCommand('backColor', false, color);
    editorRef.current?.focus();
  };

  const insertSeparator = () => {
    document.execCommand('insertHTML', false, '<hr style="border: none; border-top: 1px solid #d1d5db; margin: 1rem 0; width: 100%;" /><br>');
    editorRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (selectedWeekIndex === null || !selectedSessionId) return;

    const updatedWeeks = [...weeks];
    const sessionIndex = updatedWeeks[selectedWeekIndex].sessions.findIndex(
      s => s.id === selectedSessionId
    );

    if (sessionIndex !== -1) {
      updatedWeeks[selectedWeekIndex].sessions[sessionIndex].title = newTitle;
      setWeeks(updatedWeeks);
      setTitleEditOpen(false);

      // Update in Supabase if logged in
      if (isLoggedIn && !selectedSessionId.startsWith('session-')) {
        const currentContent = updatedWeeks[selectedWeekIndex].sessions[sessionIndex].content;
        await updateWorkout(selectedSessionId, updatedWeeks[selectedWeekIndex].name, currentContent);
      }
    }
  };

  const debouncedSave = useCallback(
    (content: string, sessionId: string, weekName: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      setIsSaving(true);

      saveTimerRef.current = setTimeout(async () => {
        await updateWorkout(sessionId, weekName, content);
        setIsSaving(false);
      }, 1500);
    },
    []
  );

  const getSelectedSession = (): Session | null => {
    if (selectedWeekIndex === null || !selectedSessionId) return null;
    return weeks[selectedWeekIndex].sessions.find(s => s.id === selectedSessionId) || null;
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  const selectedSession = getSelectedSession();

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Allenamento</h1>
            <p className="text-xs text-muted-foreground">
              {isSaving ? "Salvataggio..." : "Organizza le tue sessioni"}
            </p>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: WEEKS */}
        <div className="w-64 border-r bg-card flex flex-col">
          {/* Weeks Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between h-[60px]">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              Settimane
            </h2>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Weeks List */}
          <div className="flex-1 overflow-y-auto p-2">
            {weeks.map((week, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedWeekIndex(index);
                  setSelectedSessionId(null);
                }}
                className={`group flex items-center justify-between p-3 rounded-md mb-1 cursor-pointer transition-colors ${
                  selectedWeekIndex === index
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate">{week.name}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteWeek(index, e)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {weeks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nessuna settimana
              </div>
            )}
          </div>

          {/* Add Week Button */}
          <div className="p-3 border-t">
            {showWeekForm ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Settimana 1 - Gennaio"
                  value={newWeekName}
                  onChange={(e) => setNewWeekName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddWeek();
                    if (e.key === "Escape") {
                      setShowWeekForm(false);
                      setNewWeekName("");
                    }
                  }}
                  className="text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddWeek}
                    size="sm"
                    className="flex-1"
                    disabled={!newWeekName.trim()}
                  >
                    Aggiungi
                  </Button>
                  <Button
                    onClick={() => {
                      setShowWeekForm(false);
                      setNewWeekName("");
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowWeekForm(true)}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuova Settimana
              </Button>
            )}
          </div>
        </div>

        {/* Column 2: SESSIONS */}
        <div className="w-64 border-r bg-card flex flex-col">
          {/* Sessions Header */}
          <div className="px-4 py-3 border-b h-[60px] flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                Sessioni
              </h2>
              {selectedWeekIndex !== null && (
                <Popover open={sessionMenuOpen} onOpenChange={setSessionMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Dumbbell className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                      {sessionTypes.map((type) => (
                        <Button
                          key={type}
                          variant="ghost"
                          className="w-full justify-start text-sm"
                          onClick={() => handleQuickAddSession(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {selectedWeekIndex !== null && (
              <p className="text-xs text-muted-foreground truncate">
                {weeks[selectedWeekIndex].name}
              </p>
            )}
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2">
            {selectedWeekIndex !== null ? (
              <>
                {weeks[selectedWeekIndex].sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`group flex items-center justify-between p-3 rounded-md mb-1 cursor-pointer transition-colors ${
                      selectedSessionId === session.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{session.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {weeks[selectedWeekIndex].sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nessuna sessione
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Seleziona una settimana
              </div>
            )}
          </div>

          {/* Add Session Button */}
          <div className="p-3 border-t">
            {selectedWeekIndex !== null ? (
              showSessionForm ? (
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Lunedì: Petto/Dorso"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSession();
                      if (e.key === "Escape") {
                        setShowSessionForm(false);
                        setNewSessionTitle("");
                      }
                    }}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddSession}
                      size="sm"
                      className="flex-1"
                      disabled={!newSessionTitle.trim()}
                    >
                      Aggiungi
                    </Button>
                    <Button
                      onClick={() => {
                        setShowSessionForm(false);
                        setNewSessionTitle("");
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Annulla
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowSessionForm(true)}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Sessione
                </Button>
              )
            ) : (
              <Button size="sm" variant="outline" className="w-full" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Sessione
              </Button>
            )}
          </div>
        </div>

        {/* Column 3: EDITOR */}
        <div className="flex-1 bg-background flex flex-col">
          {selectedSession ? (
            <>
              {/* Editor Header with Title */}
              <div className="p-4 border-b bg-card">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{selectedSession.title}</h2>
                  <Popover open={titleEditOpen} onOpenChange={setTitleEditOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="end">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
                          Cambia tipo sessione
                        </p>
                        {sessionTypes.map((type) => (
                          <Button
                            key={type}
                            variant="ghost"
                            className="w-full justify-start text-sm"
                            onClick={() => handleTitleChange(type)}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isSaving ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Salvataggio automatico...
                    </span>
                  ) : (
                    "Auto-save attivo"
                  )}
                </p>
              </div>

              {/* Toolbar */}
              <div className="px-6 py-3 border-b bg-muted/30 flex items-center gap-2">
                {/* Text Color */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Palette className="h-4 w-4 mr-1" />
                      Colore
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex gap-1">
                      {textColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => applyTextColor(color)}
                          className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color === "#000000" ? "Nero (default)" : ""}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Highlight */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Highlighter className="h-4 w-4 mr-1" />
                      Evidenzia
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex gap-1">
                      {highlightColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => applyHighlight(color)}
                          className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color === "transparent" ? "Rimuovi evidenziazione" : ""}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Separator */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={insertSeparator}
                  title="Inserisci linea separatrice"
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Separatore
                </Button>
              </div>

              {/* Editor ContentEditable */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full p-4 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                  style={{
                    lineHeight: "1.75rem",
                    backgroundImage:
                      "repeating-linear-gradient(transparent, transparent calc(1.75rem - 1px), hsl(var(--border) / 0.3) calc(1.75rem - 1px), hsl(var(--border) / 0.3) 1.75rem)",
                    backgroundSize: "100% 1.75rem",
                    backgroundPosition: "0 0.25rem",
                    minHeight: "100%",
                  }}
                  data-placeholder="Scrivi i dettagli della sessione...

Esempio:
Riscaldamento
- 5 min bike
- Mobilità spalle

Panca Piana
- 3x10 @ 80kg
- Sentito bene, forma corretta

Squat
- 4x8 @ 100kg
- Profondità buona

Note: Aumentare carico prossima volta"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Seleziona un allenamento</p>
                <p className="text-sm mt-1">
                  Scegli una sessione dalla colonna centrale
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
