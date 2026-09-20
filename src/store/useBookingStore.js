import { create } from 'zustand';

const MOCK_INITIAL_BOOKINGS = [
  {
    id: 'BK-1052',
    lawyerName: 'Adv. Sadia Chowdhury',
    start: '2023-10-12T10:00:00', // ISO string
    status: 'confirmed',
    caseBrief: 'Need advice on corporate restructuring and compliance for a private limited company.',
    meetLink: 'https://meet.google.com/abc-xyz-123'
  },
  {
    id: 'BK-0931',
    lawyerName: 'Adv. Farhana Islam',
    start: '2023-10-05T14:00:00', // ISO string
    status: 'completed',
    caseBrief: 'Appealing a decision in the consumer rights protection directorate.',
    meetLink: 'https://meet.google.com/def-uvw-456'
  }
];

const useBookingStore = create((set) => ({
  bookings: MOCK_INITIAL_BOOKINGS,
  
  addBooking: (booking) => set((state) => ({
    bookings: [{ ...booking, id: `BK-${Math.floor(1000 + Math.random() * 9000)}` }, ...state.bookings]
  })),

  cancelBooking: (id) => set((state) => ({
    bookings: state.bookings.map(b => 
      b.id === id ? { ...b, status: 'cancelled' } : b
    )
  })),
}));

export default useBookingStore;
