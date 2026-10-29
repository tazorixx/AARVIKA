export type DepartmentId = 'wedding' | 'birthday' | 'personalized' | 'anniversary' | 'hampers' | 'clothing' | 'stationery' | 'furniture';
export interface Department { id: DepartmentId; title: string; symbol: string; description: string; active: boolean }
export const departments: Department[] = [
  { id: 'wedding', title: 'Wedding', symbol: '✧', description: 'Thoughtful details for every tradition', active: true },
  { id: 'birthday', title: 'Birthday', symbol: '✺', description: 'A little joy for their day', active: true },
  { id: 'personalized', title: 'Personalized Gifts', symbol: 'Aa', description: 'Make something uniquely theirs', active: true },
  { id: 'anniversary', title: 'Anniversary', symbol: '♡', description: 'Celebrate your shared story', active: true },
  { id: 'hampers', title: 'Hampers', symbol: '▧', description: 'Small things, beautifully brought together', active: true },
  { id: 'clothing', title: 'Clothing', symbol: '♧', description: 'Everyday favourites and occasion wear', active: true },
  { id: 'stationery', title: 'Stationery', symbol: '✎', description: 'For bright ideas and fresh pages', active: true },
  { id: 'furniture', title: 'Furniture', symbol: '⌂', description: 'Considered pieces for your space', active: true },
];
export const reservedDepartment = { id: 'reserved', active: false, title: null } as const;
