import type { GiveawaySettings } from '../logic/types';

interface SettingsModalProps {
  settings: GiveawaySettings;
  onChange: (settings: GiveawaySettings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onChange, onClose }: SettingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm mx-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoAddWinnerToExclusions}
              onChange={(e) =>
                onChange({ ...settings, autoAddWinnerToExclusions: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 rounded accent-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-slate-200">Auto-exclude winners</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Automatically add the drawn person to the exclusions list after each draw.
              </div>
            </div>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
