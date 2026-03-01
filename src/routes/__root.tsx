/// <reference types="vite/client" />
import { useEffect, type ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { TabBar } from '~/components/TabBar'
import { GenerationProvider } from '~/contexts/GenerationContext'
import { EditProvider } from '~/contexts/EditContext'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
      },
      { title: 'ComfyUI Studio' },
      { name: 'theme-color', content: '#FAF9F7' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'ComfyUI Studio' },
      { name: 'mobile-web-app-capable', content: 'yes' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss, precedence: 'default' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
        precedence: 'default',
      },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
    }
  }, [])

  return (
    <RootDocument>
      <GenerationProvider>
        <EditProvider>
          <div className="flex min-h-dvh flex-col bg-bg">
            <main className="flex-1 pb-20">
              <Outlet />
            </main>
            <TabBar />
          </div>
        </EditProvider>
      </GenerationProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
