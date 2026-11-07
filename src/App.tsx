import { MotionConfig } from 'motion/react'
import { lazy, useEffect } from 'react'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { OptionalChunk } from './components/OptionalChunk'
import { RouteMap } from './components/routes/RouteMap'
import { FlightSearch } from './components/search/FlightSearch'
import { TicketHelp } from './components/TicketHelp'
import { WhyUs } from './components/WhyUs'
import { startSmoothScroll } from './lib/scroll'

// The guide only shows up once the visitor is past the hero, so it loads on its own.
const Guide = lazy(() => import('./components/guide/Guide'))

function App() {
  useEffect(() => startSmoothScroll(), [])

  return (
    <MotionConfig reducedMotion="user">
      <Header />
      <main>
        <Hero />
        <FlightSearch />
        <RouteMap />
        <WhyUs />
        <TicketHelp />
      </main>
      <Footer />
      <OptionalChunk>
        <Guide />
      </OptionalChunk>
    </MotionConfig>
  )
}

export default App
