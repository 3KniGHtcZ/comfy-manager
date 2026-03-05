import { type FC, useEffect, useState } from "react";
import type { Persona } from "~/lib/types";

interface PersonaFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Persona, "id">) => void;
  initialData?: Persona;
}

export const PersonaForm: FC<PersonaFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loraName, setLoraName] = useState("");
  const [loraStrength, setLoraStrength] = useState(1.0);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setAvatar(initialData.avatar);
      setLoraName(initialData.loraName);
      setLoraStrength(initialData.loraStrength ?? 1.0);
    } else {
      setName("");
      setDescription("");
      setAvatar("");
      setLoraName("");
      setLoraStrength(1.0);
    }
  }, [initialData]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name, description, avatar, loraName, loraStrength });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop overlay closes on click */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface p-6 sm:rounded-2xl [box-shadow:0_-4px_24px_#1A191812]">
        <h2 className="mb-6 text-lg font-bold text-text">
          {initialData ? "Edit Character" : "New Character"}
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="persona-name"
              className="mb-1 block text-sm text-text-secondary"
            >
              Name *
            </label>
            <input
              id="persona-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character name"
              className="w-full rounded-xl bg-bg border border-border px-4 py-3 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="persona-description"
              className="mb-1 block text-sm text-text-secondary"
            >
              Description
            </label>
            <input
              id="persona-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full rounded-xl bg-bg border border-border px-4 py-3 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="persona-avatar"
              className="mb-1 block text-sm text-text-secondary"
            >
              Avatar URL
            </label>
            <input
              id="persona-avatar"
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full rounded-xl bg-bg border border-border px-4 py-3 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="persona-lora-name"
              className="mb-1 block text-sm text-text-secondary"
            >
              LORA Name *
            </label>
            <input
              id="persona-lora-name"
              type="text"
              value={loraName}
              onChange={(e) => setLoraName(e.target.value)}
              placeholder="lora_model_name"
              className="w-full rounded-xl bg-bg border border-border px-4 py-3 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="persona-lora-strength"
              className="mb-1 block text-sm text-text-secondary"
            >
              LORA Strength
            </label>
            <input
              id="persona-lora-strength"
              type="number"
              value={loraStrength}
              onChange={(e) => setLoraStrength(parseFloat(e.target.value) || 0)}
              min={0}
              max={2}
              step={0.1}
              className="w-full rounded-xl bg-bg border border-border px-4 py-3 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-surface-muted py-3 font-medium text-text-secondary transition-colors hover:bg-surface-muted/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
