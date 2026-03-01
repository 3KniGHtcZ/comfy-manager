import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultNotFoundComponent: () => (
			<div className="flex h-64 items-center justify-center">
				<p className="text-text-muted">Page not found</p>
			</div>
		),
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
