import { Hero } from './home/Hero'
import { Paths } from './home/Paths'
import { FeatureStrip } from './home/FeatureStrip'
import { Journey } from './home/Journey'
import { Notation } from './home/Notation'
import { Coming } from './home/Coming'
import { FinalCta } from './home/FinalCta'

export default function Home() {
  return (
    <>
      <Hero />
      <Paths />
      <FeatureStrip />
      <Journey />
      <Notation />
      <Coming />
      <FinalCta />
    </>
  )
}
