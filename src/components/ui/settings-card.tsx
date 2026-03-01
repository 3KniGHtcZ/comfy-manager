import * as React from "react";
import { cn } from "~/lib/utils";

interface SettingsRowProps {
	label: string;
	value?: React.ReactNode;
	onClick?: () => void;
}

interface SettingsCardProps {
	rows: SettingsRowProps[];
	className?: string;
}

function SettingsRow({ label, value, onClick }: SettingsRowProps) {
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: settings row, keyboard handled by parent
		// biome-ignore lint/a11y/noStaticElementInteractions: settings row with optional click
		<div
			onClick={onClick}
			className={cn(
				"flex items-center justify-between py-3.5",
				onClick && "cursor-pointer active:opacity-70 transition-opacity",
			)}
		>
			<span className="text-[14px] font-medium text-[#1A1918] font-[Outfit]">
				{label}
			</span>
			{value !== undefined && (
				<span className="text-[13px] text-[#9C9B99] font-[Outfit]">
					{value}
				</span>
			)}
		</div>
	);
}

export function SettingsCard({ rows, className }: SettingsCardProps) {
	return (
		<div
			className={cn(
				"flex flex-col rounded-2xl bg-white px-4",
				"[box-shadow:0_2px_12px_#1A191808]",
				className,
			)}
		>
			{rows.map((row, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: settings rows have no stable IDs
				<React.Fragment key={index}>
					<SettingsRow {...row} />
					{index < rows.length - 1 && (
						<div className="h-px bg-[#E5E4E1] mx-0" />
					)}
				</React.Fragment>
			))}
		</div>
	);
}

export type { SettingsCardProps, SettingsRowProps };
