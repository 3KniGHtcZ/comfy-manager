interface StatusIndicatorProps {
	online: boolean;
}

export function StatusIndicator({ online }: StatusIndicatorProps) {
	return (
		<div className="flex items-center gap-2">
			<span className="relative flex h-2.5 w-2.5">
				{online && (
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
				)}
				<span
					className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
						online ? "bg-green-500" : "bg-red-500"
					}`}
				/>
			</span>
			<span className="text-sm text-text-secondary">
				{online ? "Online" : "Offline"}
			</span>
		</div>
	);
}
