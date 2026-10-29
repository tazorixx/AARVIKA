export const money=(amount:number)=>`₹${(amount/100).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
