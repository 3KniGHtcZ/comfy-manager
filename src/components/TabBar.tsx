import { Link, useRouterState } from "@tanstack/react-router";
import { Clock3, House, Layers, User } from "lucide-react";

const tabs = [
	{ to: "/", label: "Home", Icon: House },
	{ to: "/flows", label: "Flows", Icon: Layers },
	{ to: "/history", label: "History", Icon: Clock3 },
	{ to: "/settings", label: "Profile", Icon: User },
] as const;

export function TabBar() {
	const { location } = useRouterState();

	const hideOn = ["/generating", "/results/", "/image/", "/dev", "/edit"];
	if (hideOn.some((path) => location.pathname.startsWith(path))) {
		return null;
	}

	return (
		<nav className="bg-white [box-shadow:0_-2px_12px_#1A191808] safe-area-pb">
			<div className="mx-auto flex max-w-lg items-center justify-around px-4 pt-3 pb-5">
				{tabs.map((tab) => {
					const isActive =
						tab.to === "/"
							? location.pathname === "/"
							: location.pathname.startsWith(tab.to);

					return (
						<Link
							key={tab.to}
							to={tab.to}
							className="flex flex-col items-center gap-1"
						>
							<tab.Icon
								size={22}
								strokeWidth={isActive ? 2 : 1.5}
								color={isActive ? "#3D8A5A" : "#A8A7A5"}
							/>
							<span
								className="text-[10px] font-[600] font-[Outfit]"
								style={{ color: isActive ? "#3D8A5A" : "#A8A7A5" }}
							>
								{tab.label}
							</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
