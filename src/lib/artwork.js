import learningLiveClassArt from '../../assets/learning-live-class.svg'
import teacherSpotlightArt from '../../assets/teacher-spotlight.svg'
import knowledgeJourneyArt from '../../assets/knowledge-journey.svg'
import girlArt from '../../assets/girl.png'
import muslimBoyArt from '../../assets/muslemboy.png'
import girlsArt from '../../assets/2garls.png'
import happyHijabiArt from '../../assets/happyHijabi.png'
import happyManArt from '../../assets/happyman.png'
import happyMomArt from '../../assets/happymom.png'

export {
  learningLiveClassArt,
  teacherSpotlightArt,
  knowledgeJourneyArt,
  girlArt,
  muslimBoyArt,
  girlsArt,
  happyHijabiArt,
  happyManArt,
  happyMomArt,
}

export function pickLocalSubjectArt(input = '') {
  const text = String(input).toLowerCase()
  if (text.includes('tajweed') || text.includes('quran')) return learningLiveClassArt
  if (text.includes('teacher') || text.includes('arabic')) return teacherSpotlightArt
  if (text.includes('hifz') || text.includes('memor') || text.includes('islamic')) return knowledgeJourneyArt
  return learningLiveClassArt
}