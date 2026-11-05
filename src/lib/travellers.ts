export type Passengers = { adults: number; children: number; infants: number }

export const CABINS = ['Economy', 'Premium Economy', 'Business', 'First'] as const
export type Cabin = (typeof CABINS)[number]
