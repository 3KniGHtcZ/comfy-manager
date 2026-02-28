import { createFileRoute } from '@tanstack/react-router'
import { Layers } from 'lucide-react'

export const Route = createFileRoute('/flows')({
  component: FlowsPage,
})

function FlowsPage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 pt-24 pb-8">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Layers size={28} className="text-primary" />
      </div>
      <h1 className="mb-2 text-[15px] font-semibold text-text">Flows</h1>
      <p className="text-center text-sm text-text-muted">
        Workflow management coming soon.
      </p>
    </div>
  )
}
