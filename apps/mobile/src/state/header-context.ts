import { createContext } from 'react';
export const CartCountContext = createContext(0);

export const DeliverySummaryContext = createContext<string>('Choose delivery location');
