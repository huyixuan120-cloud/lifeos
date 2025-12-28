"use client";

import { useState, useEffect } from "react";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimerSettings } from "@/types";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: TimerSettings;
  onSave: (settings: TimerSettings) => void;
}

/**
 * SettingsModal Component - Pomofocus-style Settings
 *
 * Features:
 * - Timer duration inputs (Pomodoro, Short Break, Long Break)
 * - Auto-start toggles
 * - Volume slider
 * - Alarm sound selector
 */
export function SettingsModal({ open, onOpenChange, settings, onSave }: SettingsModalProps) {
  const [formSettings, setFormSettings] = useState<TimerSettings>(settings);

  // Sync form state when settings prop changes
  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(formSettings);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormSettings(settings); // Reset to original
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Timer Settings
          </DialogTitle>
          <DialogDescription>
            Customize your Pomodoro timer experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timer Durations Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Timer (minutes)</h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Pomodoro Duration */}
              <div className="space-y-2">
                <Label htmlFor="pomodoro-duration" className="text-xs text-muted-foreground">
                  Pomodoro
                </Label>
                <Input
                  id="pomodoro-duration"
                  type="number"
                  min={1}
                  max={90}
                  value={formSettings.pomodoroDuration}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      pomodoroDuration: parseInt(e.target.value) || 25,
                    })
                  }
                  className="text-center"
                />
              </div>

              {/* Short Break Duration */}
              <div className="space-y-2">
                <Label htmlFor="short-break-duration" className="text-xs text-muted-foreground">
                  Short Break
                </Label>
                <Input
                  id="short-break-duration"
                  type="number"
                  min={1}
                  max={30}
                  value={formSettings.shortBreakDuration}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      shortBreakDuration: parseInt(e.target.value) || 5,
                    })
                  }
                  className="text-center"
                />
              </div>

              {/* Long Break Duration */}
              <div className="space-y-2">
                <Label htmlFor="long-break-duration" className="text-xs text-muted-foreground">
                  Long Break
                </Label>
                <Input
                  id="long-break-duration"
                  type="number"
                  min={1}
                  max={60}
                  value={formSettings.longBreakDuration}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      longBreakDuration: parseInt(e.target.value) || 15,
                    })
                  }
                  className="text-center"
                />
              </div>
            </div>
          </div>

          {/* Auto-start Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Auto Start</h3>

            {/* Auto-start Breaks */}
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-start-breaks" className="text-sm cursor-pointer">
                Auto-start Breaks
              </Label>
              <Switch
                id="auto-start-breaks"
                checked={formSettings.autoStartBreaks}
                onCheckedChange={(checked) =>
                  setFormSettings({ ...formSettings, autoStartBreaks: checked })
                }
              />
            </div>

            {/* Auto-start Pomodoros */}
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-start-pomodoros" className="text-sm cursor-pointer">
                Auto-start Pomodoros
              </Label>
              <Switch
                id="auto-start-pomodoros"
                checked={formSettings.autoStartPomodoros}
                onCheckedChange={(checked) =>
                  setFormSettings({ ...formSettings, autoStartPomodoros: checked })
                }
              />
            </div>
          </div>

          {/* Sound Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Sound</h3>

            {/* Alarm Sound Selector */}
            <div className="space-y-2">
              <Label htmlFor="alarm-sound" className="text-xs text-muted-foreground">
                Alarm Sound
              </Label>
              <Select
                value={formSettings.alarmSound}
                onValueChange={(value) =>
                  setFormSettings({
                    ...formSettings,
                    alarmSound: value as TimerSettings["alarmSound"],
                  })
                }
              >
                <SelectTrigger id="alarm-sound">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bell">Bell</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Volume Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume" className="text-xs text-muted-foreground">
                  Volume
                </Label>
                <span className="text-xs text-muted-foreground">{formSettings.volume}%</span>
              </div>
              <Slider
                id="volume"
                min={0}
                max={100}
                step={5}
                value={[formSettings.volume]}
                onValueChange={(value) =>
                  setFormSettings({ ...formSettings, volume: value[0] })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#C97152] hover:bg-[#B8886B] text-white">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
