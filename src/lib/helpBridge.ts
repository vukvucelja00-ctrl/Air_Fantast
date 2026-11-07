/** Lets other parts of the page open a tab of the "Already have a ticket?" section, such as the guide. */

export type HelpTopic = 'refund' | 'change' | 'contact'

const EVENT = 'air-fantast:help-topic'

export function openHelpTopic(topic: HelpTopic) {
  window.dispatchEvent(new CustomEvent<HelpTopic>(EVENT, { detail: topic }))
}

export function onHelpTopic(listener: (topic: HelpTopic) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<HelpTopic>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
