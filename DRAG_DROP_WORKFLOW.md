# 📋 Drag & Drop Task Workflow

## Overview
Visual, intuitive "Drop → Decide → Place" workflow for time-boxing tasks.

---

## New User Flow

### 1️⃣ **Drop Task onto Calendar**
- Drag any incomplete task from the sidebar
- Drop it on any date in the calendar

### 2️⃣ **Gateway Dialog Opens**
**Simple decision dialog with:**
- **Task preview** with color indicator
- **All Day toggle** with contextual description
- **Two paths:**
  - ✅ All Day ON → Event created immediately
  - ⏰ All Day OFF → Opens Day Command Station in "Placement Mode"

### 3️⃣ **Placement Mode (Day Command Station)**

**If user chooses specific time:**

**Visual Cues:**
- 🎯 **Banner**: "Click a time slot to schedule: [Task Name]"
- ✨ **Animated pulse** indicator with task color
- 📍 **Timeline slots** show "Place here" on hover (primary blue)
- 🎨 **Right panel** displays placement instructions

**Interaction:**
- Click any empty time slot (e.g., 14:00)
- ✅ Event created **immediately** (14:00-15:00)
- Dialog closes automatically
- Task appears on calendar with original priority color

**Normal Mode (No Pending Task):**
- Click empty slot → Opens create form
- Click existing event → Shows event details

---

## Components Updated

### `DropGatewayDialog`
**Replaces:** `DropConfirmDialog`

**UI:**
- Task preview card with color dot
- All Day toggle with descriptive text
- Dynamic button: "Schedule All Day" vs "Choose Time Slot"
- Helper text when time slot mode selected

### `DayCommandStation`
**New Props:**
- `pendingTask: PendingTask | null`

**States:**
1. **Placement Mode** (when pendingTask exists)
   - Banner with task name
   - Animated color indicator
   - All slots show "Place here"
   - Right panel: PendingTaskPanel

2. **Normal Mode** (default)
   - Standard event count
   - Slots show "Add" on hover
   - Right panel: ActionPanel (create form or event details)

### `TimelineSlot`
**New Prop:**
- `isPendingMode: boolean`

**Dynamic Styling:**
- Pending mode: Primary blue hover, "Place here" always visible
- Normal mode: Accent hover, "Add" on hover only

### `PendingTaskPanel` (New Component)
**Displays:**
- Pulsing color circle
- "Placement Mode" heading
- Task name in card
- Duration info (1 hour)
- "Start time: Your choice" hint

---

## Key Interactions

### Immediate Placement
When in pending mode, clicking a slot:
```typescript
// Creates event directly (no form)
await onAddEvent({
  title: pendingTask.title,
  start: hourStart.toISOString(),
  end: hourEnd.toISOString(), // +1 hour
  background_color: pendingTask.color,
  // ... other fields
});
onClose(); // Auto-close after placement
```

### State Management
```typescript
// Gateway confirms "All Day OFF"
setPendingTaskToSchedule({ title, color });
setDayOverview({ isOpen: true, date });

// Command Station closes
setPendingTaskToSchedule(null); // Clear pending state
```

---

## Visual Design

### Gateway Dialog
- Compact, decision-focused
- Color-coded task preview
- Clear toggle with consequences
- Smart button labels

### Placement Mode
- **Header**: Prominent banner with pulsing indicator
- **Timeline**: Blue "Place here" prompts
- **Panel**: Centered instructions with task details
- **Feedback**: Immediate creation + auto-close

### Color System
- **Primary Blue**: Placement mode indicators
- **Task Color**: From task priority (preserved in event)
- **Muted**: Normal mode elements

---

## User Benefits

1. **No Manual Time Entry**: Click to place, no typing
2. **Visual Feedback**: Clear prompts at every step
3. **Quick All-Day**: One click for all-day events
4. **Context Preserved**: Task color carries to event
5. **Fast Workflow**: Drop → Toggle → Click → Done

---

## Technical Details

### Files Modified
- `src/components/modules/calendar/CalendarView.tsx` (primary)

### New Interfaces
```typescript
interface PendingTask {
  title: string;
  color: string;
}
```

### State Variables
```typescript
const [pendingTaskToSchedule, setPendingTaskToSchedule] = useState<PendingTask | null>(null);
```

### Cleanup
- Removed `DropConfirmDialog` component
- Removed time input fields
- Simplified drop confirmation logic

---

## Testing Checklist

- [ ] Drop task → Gateway opens
- [ ] Toggle "All Day" → Button text changes
- [ ] All Day ON → Confirm → Event created
- [ ] All Day OFF → Confirm → Command Station opens
- [ ] Command Station shows banner with task name
- [ ] Timeline slots show "Place here"
- [ ] Click slot → Event created at correct time
- [ ] Event has correct color from task
- [ ] Dialog closes after placement
- [ ] Normal mode still works (no pending task)
- [ ] Can cancel at any step

---

*Generated for LifeOS - Personal Workspace Management System*
