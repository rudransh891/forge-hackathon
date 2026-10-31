import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const FEATURES = [
  {
    title: 'ShadCN UI',
    body: 'Tailwind v4 with CSS variables. Components live in src/components/ui and are yours to edit.',
  },
  {
    title: 'GSAP',
    body: 'Timelines, easing and ScrollTrigger, wired into React through the useGSAP hook.',
  },
  {
    title: 'Vite 8',
    body: 'Instant HMR in dev and a build that stays fast in production.',
  },
]

function App() {
  const [replay, setReplay] = useState(0)
  const hero = useRef<HTMLDivElement>(null)
  const scroll = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('.hero-badge', { y: 10, opacity: 0, duration: 0.35 })
        .from('.hero-title', { y: 28, opacity: 0, duration: 0.6 }, '-=0.15')
        .from('.hero-copy', { y: 20, opacity: 0, duration: 0.5 }, '-=0.35')
        .from('.hero-actions', { y: 16, opacity: 0, duration: 0.45 }, '-=0.3')
        .from(
          '.feature-card',
          { y: 32, opacity: 0, duration: 0.5, stagger: 0.1 },
          '-=0.2',
        )
    },
    { scope: hero, dependencies: [replay], revertOnUpdate: true },
  )

  useGSAP(
    () => {
      gsap.fromTo(
        '.scroll-line',
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: scroll.current,
            start: 'top 85%',
            end: 'top 30%',
            scrub: true,
          },
        },
      )
    },
    { scope: scroll },
  )

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div
        ref={hero}
        className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 px-6 pt-24 pb-16"
      >
        <Badge variant="secondary" className="hero-badge w-fit">
          FORGE HACKATHON
        </Badge>

        <h1 className="hero-title text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          ShadCN and GSAP, wired together
        </h1>

        <p className="hero-copy max-w-xl text-muted-foreground">
          Tailwind v4, the ShadCN registry and GSAP&apos;s React hook are already
          configured. Edit <code className="text-foreground">src/App.tsx</code>{' '}
          and replace this page with the real thing.
        </p>

        <div className="hero-actions flex flex-wrap gap-2">
          <Button onClick={() => setReplay((n) => n + 1)}>
            Replay animation
          </Button>
          <Button variant="outline" asChild>
            <a href="https://ui.shadcn.com/docs" target="_blank" rel="noreferrer">
              ShadCN docs
            </a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="https://gsap.com/docs/v3/React/" target="_blank" rel="noreferrer">
              GSAP docs
            </a>
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="feature-card">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.body}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">ready</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div
        ref={scroll}
        className="scroll-section mx-auto min-h-[50svh] max-w-3xl px-6 pt-24"
      >
        <p className="text-sm text-muted-foreground">
          Scrolling into view fires a ScrollTrigger animation:
        </p>
        <div className="scroll-line mt-4 h-px w-full bg-foreground" />
      </div>
    </main>
  )
}

export default App
