/** Agency contact details, from the Air Fantast brand book. */
export const contact = {
  email: 'office@airfantast.com',
  street: 'Jevrejska 10',
  city: '21000 Novi Sad',
  /** Fill these in to show them on the site; while null they stay hidden. */
  phone: null as string | null,
  whatsapp: null as string | null,
  /** Shown in the footer, for example { label: 'Instagram', href: 'https://…' }. */
  socials: [] as { label: string; href: string }[],
}

export function mailtoLink(subject: string, body: string): string {
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
