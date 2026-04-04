export interface Event {
  id: number
  date: Date
  time: string
  period: 'AM' | 'PM'
  title: string
  icon: string
  location: string
  attendees: number
}
