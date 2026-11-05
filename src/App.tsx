import { MotionConfig } from 'motion/react'
import { useEffect } from 'react'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { RouteMap } from './components/routes/RouteMap'
import { FlightSearch } from './components/search/FlightSearch'
import { TicketHelp } from './components/TicketHelp'
import { WhyUs } from './components/WhyUs'
import { startSmoothScroll } from './lib/scroll'

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
    </MotionConfig>
  )
}

export default App
