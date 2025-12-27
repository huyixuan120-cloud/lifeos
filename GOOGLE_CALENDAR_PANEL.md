# 📅 Google Calendar-Style Action Panel

## Overview
The Right Action Panel in the Day Command Station has been completely redesigned to mimic Google Calendar's create event interface with a rich, professional UI.

---

## 🎨 New Features

### **1. Tabbed Interface**
- **Evento Tab** (Blue active state) - For creating calendar events
- **Attività Tab** (Green active state) - For creating tasks
- Icons: Calendar and CheckSquare
- Switch between event/task creation modes

### **2. Google-Style Form Fields**

#### **Title Input**
- Large, borderless input at the top
- Bottom border only (Google Calendar style)
- Placeholder: "Aggiungi titolo"
- Auto-focus on open
- Font size: lg, font-weight: medium

#### **Time Picker Row**
- Clock icon on the left
- Two time inputs: Start Time | End Time
- Separator dash between inputs
- Disabled when "All Day" is checked
- Smart logic: If end < start, assumes next day

#### **All Day Checkbox**
- Labeled: "Tutto il giorno"
- Indented (pl-8) for alignment
- Disables time inputs when checked

#### **Description Field**
- AlignLeft icon
- Textarea (min-height: 80px)
- Placeholder: "Aggiungi descrizione"
- Non-resizable
- Auto-grows with content

#### **Location Field**
- MapPin icon
- Single-line input
- Placeholder: "Aggiungi luogo"

#### **Color Picker**
- 8 Google Calendar-style colors:
  - Lavanda (#7986cb)
  - Salvia (#33b679)
  - Uva (#8e24aa)
  - Fiamma (#e67c73)
  - Banana (#f6c026)
  - Mandarino (#f5511d)
  - Pavone (#039be5)
  - Grafite (#616161)
- Circular color buttons (32px diameter)
- Selected state: Ring + scale animation
- Hover state: Scale up
- Tooltips with color names

---

## 📐 Layout Structure

```
┌─────────────────────────────────┐
│  [Evento Tab] [Attività Tab]   │ ← Tabs Header
├─────────────────────────────────┤
│  Aggiungi titolo____________    │ ← Borderless Title
├─────────────────────────────────┤
│  🕐 [09:00] - [10:00]          │ ← Time Row
│     □ Tutto il giorno           │ ← All Day
│  📝 [Descrizione textarea]      │ ← Description
│  📍 [Luogo input]               │ ← Location
│  ○ ○ ○ ○ ○ ○ ○ ○              │ ← Color Picker
│                                 │
│  [Scrollable content area]      │
├─────────────────────────────────┤
│            [Annulla]  [Salva]   │ ← Action Buttons
└─────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### **New State Variables**
```typescript
const [tabType, setTabType] = useState<"event" | "task">("event");
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [location, setLocation] = useState("");
const [allDay, setAllDay] = useState(false);
const [startTime, setStartTime] = useState("");
const [endTime, setEndTime] = useState("");
const [selectedColor, setSelectedColor] = useState(EVENT_COLORS[0].value);
```

### **Color Palette Constant**
```typescript
const EVENT_COLORS = [
  { name: "Lavanda", value: "#7986cb" },
  { name: "Salvia", value: "#33b679" },
  // ... 6 more colors
];
```

### **Updated Function Signatures**

**handleCreateEvent** now accepts:
```typescript
{
  title: string;
  description?: string;
  location?: string;
  startTime: string;   // "HH:mm" format
  endTime: string;     // "HH:mm" format
  allDay: boolean;
  color: string;       // Hex color
}
```

### **Smart Time Handling**
- Parses `HH:mm` format to hours/minutes
- Creates proper Date objects with timezone
- If end time < start time → assumes next day
- All day events: Full day span (00:00 to 00:00+1)

---

## 🎨 Styling Details

### **Tabs**
- Grid layout (2 columns)
- Custom active states with color backgrounds
- Evento: Blue (bg-blue-100, text-blue-700)
- Attività: Green (bg-green-100, text-green-700)

### **Title Input**
- `border-0 border-b` - Only bottom border
- `rounded-none` - No border radius
- `px-0` - No horizontal padding
- `focus-visible:ring-0` - No focus ring
- `focus-visible:border-primary` - Primary color on focus

### **Form Layout**
- Clean spacing: `gap-3` between rows
- Icon alignment: All icons have `h-5 w-5`
- Consistent left padding for aligned fields
- Icons use `text-muted-foreground`

### **Action Buttons**
- Right-aligned with `justify-end`
- Border-top separator
- Ghost cancel button
- Primary save button
- Disabled states for validation

---

## 📱 Responsive Behavior

### **Form Container**
- `h-full flex flex-col` - Full height layout
- `overflow-y-auto` - Scrollable content area
- Fixed header (tabs) at top
- Fixed footer (buttons) at bottom
- Content scrolls in between

### **View Mode (Event Details)**
- Maintains same structure
- Shows event data in read-only format
- Delete button at bottom
- Italian labels: "Titolo", "Orario", "Descrizione", "Luogo"

---

## 🌍 Internationalization

All text is in **Italian**:
- Evento / Attività (Event / Task)
- Aggiungi titolo (Add title)
- Tutto il giorno (All day)
- Aggiungi descrizione (Add description)
- Aggiungi luogo (Add location)
- Salva / Annulla (Save / Cancel)
- Salvataggio... (Saving...)
- Seleziona uno slot per iniziare (Select a slot to start)
- Dettagli Evento (Event Details)
- Elimina (Delete)

---

## 🔄 User Workflow

### **Creating an Event:**
1. Click empty time slot in Day Command Station
2. Google Calendar-style form opens in right panel
3. Default tab: "Evento" (blue)
4. Pre-filled: Start/end time based on clicked slot
5. User enters: Title (required)
6. Optional: Description, Location, Color
7. Toggle "All day" if needed
8. Click "Salva" → Event created
9. Panel closes, calendar refreshes

### **Switching to Task:**
1. Click "Attività" tab (turns green)
2. Same form fields available
3. TODO: Wire up to task creation hook
4. Currently saves as event with task indicator

### **Viewing Event:**
1. Click existing event in timeline
2. Read-only view with all details
3. Delete button available
4. Clean, organized layout

---

## 🎯 Design Philosophy

**Matches Google Calendar:**
- ✅ Tabbed interface (Event/Task)
- ✅ Large borderless title
- ✅ Icon-labeled fields
- ✅ Color picker with circles
- ✅ All day checkbox
- ✅ Time range inputs
- ✅ Description & location fields
- ✅ Bottom-right action buttons
- ✅ Clean, airy spacing (gap-4)

**Improvements over simple form:**
- Rich text input (description textarea)
- Location tracking
- Visual color selection
- Tab-based type switching
- Professional, polished UI
- Better UX with smart defaults
- Proper validation states

---

## 📦 New Dependencies Used

- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from Shadcn
- `Textarea` from Shadcn
- `Checkbox` from Shadcn
- Icons: `AlignLeft`, `MapPin`, `CheckSquare`

---

## 🚀 Future Enhancements

1. **Task Creation**: Wire up "Attività" tab to `useTasks` hook
2. **Recurring Events**: Add repeat options
3. **Guests**: Add attendees field with email inputs
4. **Notifications**: Add reminder settings
5. **Attachments**: File upload support
6. **Custom Colors**: Allow hex input for custom colors
7. **Duration Presets**: Quick buttons (15min, 30min, 1hr, 2hr)
8. **Smart Suggestions**: Auto-suggest locations, titles
9. **Keyboard Shortcuts**: Cmd+Enter to save, Esc to cancel

---

## 🎨 Screenshots Reference

The design closely mimics:
- Google Calendar's "Create Event" dialog
- Clean, modern aesthetic
- Professional color palette
- Intuitive icon usage
- Consistent spacing and alignment

---

*Generated for LifeOS - Built with Next.js, Shadcn/ui, and FullCalendar*
