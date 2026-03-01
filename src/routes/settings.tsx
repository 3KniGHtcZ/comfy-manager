import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { AppSettings } from "~/lib/types";
import { checkStatus } from "~/server/comfyui";
import { getSettings, updateSettings } from "~/server/settings";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const [loading, setLoading] = useState(true);
	const [serverUrl, setServerUrl] = useState("http://127.0.0.1:8188");
	const [isOnline, setIsOnline] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
	const [apiKey, setApiKey] = useState("");
	const [editingField, setEditingField] = useState<string | null>(null);

	const [cfg, setCfg] = useState(7.5);
	const [defaultSteps, setDefaultSteps] = useState(30);
	const [defaultSeedMode, setDefaultSeedMode] = useState<"random" | "fixed">(
		"random",
	);
	const [comfyVersion, setComfyVersion] = useState("--");

	useEffect(() => {
		async function load() {
			try {
				const settings: AppSettings = await getSettings();
				setServerUrl(settings.serverUrl);
				setApiKey(settings.apiKey || "");
				setCfg(settings.defaults.cfg);
				setDefaultSteps(settings.defaults.steps);
				setDefaultSeedMode(settings.defaults.seedMode);
			} catch {
				// Use defaults on error
			}
			setLoading(false);
		}
		load();
	}, []);

	const saveSettings = async (partial: Partial<AppSettings>) => {
		try {
			await updateSettings({ data: partial });
		} catch {
			// Best effort
		}
	};

	const handleTestConnection = async () => {
		setIsTesting(true);
		try {
			const result = await checkStatus();
			setIsOnline(result.online);
			if (result.systemStats) {
				setComfyVersion(result.systemStats.system?.comfyui_version || "--");
			}
		} catch {
			setIsOnline(false);
		}
		setIsTesting(false);
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{/* Header */}
			<header className="flex items-center justify-center px-6 pt-14 pb-4">
				<h1 className="text-[15px] font-semibold text-text">Settings</h1>
			</header>

			{/* Content */}
			<div className="flex flex-col gap-5 px-6 pt-4 pb-5">
				{/* SERVER section */}
				<p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#9C9B99]">
					Server
				</p>
				<div className="rounded-2xl bg-white p-4 [box-shadow:0_2px_12px_#1A191808]">
					{/* Server URL */}
					<div className="flex items-center justify-between">
						<span className="text-[14px] font-medium text-text">
							Server URL
						</span>
						{editingField === "serverUrl" ? (
							<input
								type="url"
								value={serverUrl}
								onChange={(e) => setServerUrl(e.target.value)}
								onBlur={() => {
									saveSettings({ serverUrl });
									setEditingField(null);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										saveSettings({ serverUrl });
										setEditingField(null);
									}
								}}
								className="min-w-0 flex-1 ml-4 rounded-lg border border-border bg-bg px-2 py-1 text-right text-[13px] text-text outline-none focus:ring-2 focus:ring-primary"
							/>
						) : (
							<button
								type="button"
								onClick={() => setEditingField("serverUrl")}
								className="text-[13px] text-[#3D8A5A]"
							>
								{serverUrl}
							</button>
						)}
					</div>

					<div className="my-[14px] h-px bg-[#E5E4E1]" />

					{/* Status */}
					<div className="flex items-center justify-between">
						<span className="text-[14px] font-medium text-text">Status</span>
						<div className="flex items-center gap-[6px]">
							<div
								className={`h-2 w-2 rounded-full ${isOnline ? "bg-[#3D8A5A]" : "bg-[#9C9B99]"}`}
							/>
							<span
								className={`text-[13px] font-medium ${isOnline ? "text-[#3D8A5A]" : "text-[#9C9B99]"}`}
							>
								{isOnline ? "Connected" : "Offline"}
							</span>
							<button
								type="button"
								onClick={handleTestConnection}
								disabled={isTesting}
								className="ml-2 text-[12px] font-medium text-primary disabled:opacity-50"
							>
								{isTesting ? "…" : "Test"}
							</button>
						</div>
					</div>

					<div className="my-[14px] h-px bg-[#E5E4E1]" />

					{/* API Key */}
					<div className="flex items-center justify-between">
						<span className="text-[14px] font-medium text-text">API Key</span>
						{editingField === "apiKey" ? (
							<input
								type="text"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								onBlur={() => {
									saveSettings({ apiKey: apiKey || undefined });
									setEditingField(null);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										saveSettings({ apiKey: apiKey || undefined });
										setEditingField(null);
									}
								}}
								placeholder="Optional"
								className="min-w-0 flex-1 ml-4 rounded-lg border border-border bg-bg px-2 py-1 text-right text-[13px] text-text outline-none focus:ring-2 focus:ring-primary"
							/>
						) : (
							<button
								type="button"
								onClick={() => setEditingField("apiKey")}
								className="text-[13px] text-[#6D6C6A]"
							>
								{apiKey ? "••••••••" : "Not set"}
							</button>
						)}
					</div>
				</div>

				{/* DEFAULTS section */}
				<p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#9C9B99]">
					Defaults
				</p>
				<div className="rounded-2xl bg-white p-4 [box-shadow:0_2px_12px_#1A191808]">
					{/* Default CFG */}
					<div className="flex items-center justify-between">
						<span className="text-[14px] font-medium text-text">
							Default CFG
						</span>
						{editingField === "cfg" ? (
							<input
								type="number"
								value={cfg}
								onChange={(e) => setCfg(parseFloat(e.target.value) || 0)}
								onBlur={() => {
									saveSettings({
										defaults: {
											cfg,
											steps: defaultSteps,
											seedMode: defaultSeedMode,
										},
									});
									setEditingField(null);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										saveSettings({
											defaults: {
												cfg,
												steps: defaultSteps,
												seedMode: defaultSeedMode,
											},
										});
										setEditingField(null);
									}
								}}
								min={0}
								max={30}
								step={0.5}
								className="w-20 rounded-lg border border-border bg-bg px-2 py-1 text-right text-[13px] text-text outline-none focus:ring-2 focus:ring-primary"
							/>
						) : (
							<button
								type="button"
								onClick={() => setEditingField("cfg")}
								className="text-[13px] text-[#6D6C6A]"
							>
								{cfg}
							</button>
						)}
					</div>

					<div className="my-[14px] h-px bg-[#E5E4E1]" />

					{/* Default Steps */}
					<div className="flex items-center justify-between">
						<span className="text-[14px] font-medium text-text">
							Default Steps
						</span>
						{editingField === "steps" ? (
							<input
								type="number"
								value={defaultSteps}
								onChange={(e) =>
									setDefaultSteps(parseInt(e.target.value, 10) || 1)
								}
								onBlur={() => {
									saveSettings({
										defaults: {
											cfg,
											steps: defaultSteps,
											seedMode: defaultSeedMode,
										},
									});
									setEditingField(null);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										saveSettings({
											defaults: {
												cfg,
												steps: defaultSteps,
												seedMode: defaultSeedMode,
											},
										});
										setEditingField(null);
									}
								}}
								min={1}
								max={150}
								className="w-20 rounded-lg border border-border bg-bg px-2 py-1 text-right text-[13px] text-text outline-none focus:ring-2 focus:ring-primary"
							/>
						) : (
							<button
								type="button"
								onClick={() => setEditingField("steps")}
								className="text-[13px] text-[#6D6C6A]"
							>
								{defaultSteps}
							</button>
						)}
					</div>

					<div className="my-[14px] h-px bg-[#E5E4E1]" />

					{/* Default Seed Mode */}
					<div className="flex items-center justify-between">
						<span className="text-[14px] font-medium text-text">
							Default Seed Mode
						</span>
						<button
							type="button"
							onClick={() => {
								const next = defaultSeedMode === "random" ? "fixed" : "random";
								setDefaultSeedMode(next);
								saveSettings({
									defaults: { cfg, steps: defaultSteps, seedMode: next },
								});
							}}
							className="text-[13px] capitalize text-primary transition-opacity active:opacity-70"
						>
							{defaultSeedMode}
						</button>
					</div>
				</div>

				{/* ABOUT section */}
				<p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#9C9B99]">
					About
				</p>
				<div className="rounded-2xl bg-white p-4 [box-shadow:0_2px_12px_#1A191808]">
					<div className="flex items-center justify-between">
						<span className="text-[14px] font-medium text-text">Version</span>
						<span className="text-[13px] text-[#6D6C6A]">1.0.0</span>
					</div>
					<div className="my-[14px] h-px bg-[#E5E4E1]" />
					<div className="flex items-center justify-between">
						<span className="text-[14px] font-medium text-text">
							ComfyUI Version
						</span>
						<span className="text-[13px] text-[#6D6C6A]">{comfyVersion}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
