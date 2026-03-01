import { Share } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DISMISSED_KEY = "pwa-install-dismissed";

type Platform = "android" | "ios" | null;

function detectPlatform(): Platform {
	if (typeof window === "undefined") return null;
	const ua = navigator.userAgent;
	const isIOS = /iphone|ipad|ipod/i.test(ua);
	const isStandalone = (navigator as Navigator & { standalone?: boolean })
		.standalone;
	if (isIOS && !isStandalone) return "ios";
	// Android / desktop Chrome — banner shown only after beforeinstallprompt fires
	return "android";
}

function isMobile(): boolean {
	if (typeof window === "undefined") return false;
	return "ontouchstart" in window || /mobi|android/i.test(navigator.userAgent);
}

export function InstallBanner() {
	const [platform, setPlatform] = useState<Platform>(null);
	const [visible, setVisible] = useState(false);
	const deferredPrompt = useRef<
		(Event & { prompt: () => Promise<void> }) | null
	>(null);

	useEffect(() => {
		if (!isMobile()) return;
		if (localStorage.getItem(DISMISSED_KEY)) return;

		const detected = detectPlatform();

		if (detected === "ios") {
			setPlatform("ios");
			setVisible(true);
		}

		const handleBeforeInstall = (e: Event) => {
			e.preventDefault();
			deferredPrompt.current = e as typeof deferredPrompt.current;
			setPlatform("android");
			setVisible(true);
		};

		const handleAppInstalled = () => {
			setVisible(false);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstall);
		window.addEventListener("appinstalled", handleAppInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	function dismiss() {
		localStorage.setItem(DISMISSED_KEY, "1");
		setVisible(false);
	}

	async function handleAdd() {
		if (platform === "android" && deferredPrompt.current) {
			await deferredPrompt.current.prompt();
			deferredPrompt.current = null;
		}
		dismiss();
	}

	if (!visible || !platform) return null;

	return (
		<div className="fixed bottom-20 left-4 right-4 z-40 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
			{platform === "ios" ? (
				<div className="flex items-start gap-3">
					<Share size={18} className="mt-0.5 shrink-0 text-primary" />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium text-text">
							Přidat ComfyUI Studio na plochu
						</p>
						<p className="mt-0.5 text-xs text-text-secondary">
							Klepni na{" "}
							<Share
								size={12}
								className="inline -translate-y-px text-text-secondary"
							/>{" "}
							a vyber „Přidat na plochu"
						</p>
					</div>
					<button
						type="button"
						onClick={dismiss}
						className="shrink-0 text-xs text-text-muted"
					>
						Zavřít
					</button>
				</div>
			) : (
				<div className="flex items-center gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium text-text">
							Přidat ComfyUI Studio na plochu
						</p>
					</div>
					<button
						type="button"
						onClick={dismiss}
						className="shrink-0 text-xs text-text-muted"
					>
						Zavřít
					</button>
					<button
						type="button"
						onClick={handleAdd}
						className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white"
					>
						Přidat
					</button>
				</div>
			)}
		</div>
	);
}
