export const mockLawyers = [
  {
    id: 'lwy-001',
    name: 'Adv. M. A. Rahman',
    barId: 'BD-2012-4412',
    tier: 'gold',
    specialties: ['Property', 'Corporate', 'Civil Litigation'],
    locations: ['Dhaka'],
    languages: ['Bangla', 'English'],
    rating: 4.9,
    reviewCount: 156,
    experienceYrs: 12,
    rateBdt: 2500,
    bio: 'Advocate Rahman is a highly experienced practitioner at the Supreme Court of Bangladesh, specializing in high-stakes property disputes and corporate structuring. He has represented multinational companies and high-net-worth individuals.',
    education: ['LL.M., University of Dhaka', 'LL.B., University of London'],
    reviews: [
      { id: 1, author: 'Kamrul H.', rating: 5, date: 'October 2023', text: 'Brilliant lawyer. Handled my land dispute with exceptional professionalism and won the case.' },
      { id: 2, author: 'Syed A.', rating: 5, date: 'September 2023', text: 'Very clear communication and deep knowledge of corporate law.' }
    ],
    availability: [
      { day: 'Mon', time: '10:00', status: 'available' },
      { day: 'Mon', time: '11:00', status: 'booked' },
      { day: 'Tue', time: '14:00', status: 'available' },
      { day: 'Wed', time: '10:00', status: 'available' },
    ]
  },
  {
    id: 'lwy-002',
    name: 'Adv. Farhana Islam',
    barId: 'BD-2018-8832',
    tier: 'gold',
    specialties: ['Family', 'Consumer', 'Labour'],
    locations: ['Chattogram', 'Dhaka'],
    languages: ['Bangla', 'English'],
    rating: 4.8,
    reviewCount: 92,
    experienceYrs: 6,
    rateBdt: 1800,
    bio: 'Specializing in family law and consumer rights, Adv. Farhana Islam provides compassionate and highly effective legal counsel. She is known for her successful track record in complex divorce and child custody cases.',
    education: ['LL.B. (Hons), Chittagong University'],
    reviews: [
      { id: 1, author: 'Nusrat J.', rating: 5, date: 'November 2023', text: 'She was extremely supportive during my difficult divorce proceedings. Highly recommended.' }
    ],
    availability: [
      { day: 'Wed', time: '09:00', status: 'available' },
      { day: 'Wed', time: '10:00', status: 'available' },
      { day: 'Thu', time: '15:00', status: 'booked' },
      { day: 'Fri', time: '16:00', status: 'available' },
    ]
  },
  {
    id: 'lwy-003',
    name: 'Adv. Kazi Tariq',
    barId: 'BD-2015-1102',
    tier: 'standard',
    specialties: ['Criminal', 'Labour'],
    locations: ['Sylhet'],
    languages: ['Bangla', 'Sylheti'],
    rating: 4.6,
    reviewCount: 45,
    experienceYrs: 9,
    rateBdt: 1500,
    bio: 'A dedicated criminal defense lawyer operating primarily out of Sylhet. Adv. Tariq is aggressive in the courtroom and works tirelessly to ensure fair trials for his clients.',
    education: ['LL.B., Shahjalal University of Science and Technology'],
    reviews: [
      { id: 1, author: 'Raju M.', rating: 4, date: 'August 2023', text: 'Good lawyer, fought hard for my brother\'s bail.' },
      { id: 2, author: 'Anonymous', rating: 5, date: 'July 2023', text: 'Excellent defense strategy.' }
    ],
    availability: [
      { day: 'Mon', time: '16:00', status: 'available' },
      { day: 'Tue', time: '11:00', status: 'available' },
      { day: 'Thu', time: '12:00', status: 'booked' },
    ]
  },
  {
    id: 'lwy-004',
    name: 'Adv. Sadia Chowdhury',
    barId: 'BD-2020-5591',
    tier: 'standard',
    specialties: ['Corporate', 'Property'],
    locations: ['Dhaka'],
    languages: ['Bangla', 'English'],
    rating: 4.7,
    reviewCount: 31,
    experienceYrs: 4,
    rateBdt: 1200,
    bio: 'Adv. Sadia is a rising star in corporate litigation and property vetting. She assists startups with incorporation and helps clients verify land documents before purchase.',
    education: ['LL.M., BRAC University'],
    reviews: [
      { id: 1, author: 'TechBD CEO', rating: 5, date: 'December 2023', text: 'Helped us set up our RJSC company smoothly.' }
    ],
    availability: [
      { day: 'Mon', time: '09:00', status: 'available' },
      { day: 'Mon', time: '10:00', status: 'available' },
      { day: 'Tue', time: '14:00', status: 'available' },
    ]
  },
  {
    id: 'lwy-005',
    name: 'Adv. Mahfuzur Rahman',
    barId: 'BD-2010-9901',
    tier: 'standard',
    specialties: ['Criminal', 'Property'],
    locations: ['Chattogram'],
    languages: ['Bangla'],
    rating: 4.5,
    reviewCount: 112,
    experienceYrs: 14,
    rateBdt: 2000,
    bio: 'With over a decade of experience in the Chattogram Judges Court, Adv. Mahfuzur specializes in complex criminal matters and inherited property disputes.',
    education: ['LL.B., National University'],
    reviews: [
      { id: 1, author: 'Iqbal K.', rating: 4, date: 'March 2023', text: 'Very knowledgeable about local property laws.' }
    ],
    availability: [
      { day: 'Wed', time: '11:00', status: 'available' },
      { day: 'Thu', time: '10:00', status: 'available' },
      { day: 'Sun', time: '09:00', status: 'booked' },
    ]
  },
  {
    id: 'lwy-006',
    name: 'Adv. Nusrat Hasan',
    barId: 'BD-2019-3321',
    tier: 'standard',
    specialties: ['Family', 'Consumer'],
    locations: ['Dhaka'],
    languages: ['Bangla', 'English'],
    rating: 4.9,
    reviewCount: 67,
    experienceYrs: 5,
    rateBdt: 1500,
    bio: 'Passionate advocate for consumer rights and family law. Adv. Nusrat frequently represents clients in the Directorate of National Consumer Rights Protection.',
    education: ['LL.B. (Hons), North South University'],
    reviews: [
      { id: 1, author: 'Tamim', rating: 5, date: 'January 2024', text: 'Helped me get a full refund from a fraudulent e-commerce site.' },
      { id: 2, author: 'Sonia', rating: 5, date: 'February 2024', text: 'Very empathetic and professional.' }
    ],
    availability: [
      { day: 'Mon', time: '13:00', status: 'available' },
      { day: 'Tue', time: '15:00', status: 'available' },
      { day: 'Fri', time: '10:00', status: 'available' },
    ]
  }
];
