export type LoanStatus = 'Active' | 'Overdue' | 'Repaid' | 'Defaulted'

export interface Loan {
  id: string
  customer: string
  phone: string
  principal: number
  interestRate: number
  outstanding: number
  status: LoanStatus
  disbursedDate: string
  dueDate: string
  officer: string
}

export const loans: Loan[] = [
  { id: 'LN-3001', customer: 'Asha Juma', phone: '+255 617 812 845', principal: 5000.0, interestRate: 12, outstanding: 2600.0, status: 'Active', disbursedDate: '2026-06-01', dueDate: '2026-12-01', officer: 'Grace Mahundi' },
  { id: 'LN-3002', customer: 'John Foxton', phone: '+255 712 003 221', principal: 2000.0, interestRate: 10, outstanding: 0.0, status: 'Repaid', disbursedDate: '2026-02-15', dueDate: '2026-08-15', officer: 'Victor Lema' },
  { id: 'LN-3003', customer: 'Grace Mwangi', phone: '+255 755 442 118', principal: 12000.0, interestRate: 14, outstanding: 9800.0, status: 'Overdue', disbursedDate: '2026-03-10', dueDate: '2026-09-10', officer: 'Hassan Bakari' },
  { id: 'LN-3004', customer: 'Peter Mushi', phone: '+255 688 990 004', principal: 1500.0, interestRate: 11, outstanding: 1500.0, status: 'Defaulted', disbursedDate: '2026-01-05', dueDate: '2026-07-05', officer: 'Joseph Mkude' },
  { id: 'LN-3005', customer: 'Fatma Said', phone: '+255 677 102 865', principal: 8000.0, interestRate: 13, outstanding: 4200.0, status: 'Active', disbursedDate: '2026-05-20', dueDate: '2026-11-20', officer: 'Neema Chuwa' },
  { id: 'LN-3006', customer: 'Daniel Kessy', phone: '+255 713 558 902', principal: 3000.0, interestRate: 10.5, outstanding: 3000.0, status: 'Active', disbursedDate: '2026-08-01', dueDate: '2027-02-01', officer: 'Grace Mahundi' },
  { id: 'LN-3007', customer: 'Neema Lyimo', phone: '+255 621 904 377', principal: 6500.0, interestRate: 12.5, outstanding: 5100.0, status: 'Overdue', disbursedDate: '2026-04-18', dueDate: '2026-10-18', officer: 'Victor Lema' },
  { id: 'LN-3008', customer: 'Imani Mbwana', phone: '+255 689 213 540', principal: 1000.0, interestRate: 9, outstanding: 0.0, status: 'Repaid', disbursedDate: '2026-01-25', dueDate: '2026-07-25', officer: 'Hassan Bakari' },
  { id: 'LN-3009', customer: 'Salma Rajab', phone: '+255 754 880 102', principal: 15000.0, interestRate: 15, outstanding: 15000.0, status: 'Active', disbursedDate: '2026-09-05', dueDate: '2027-03-05', officer: 'Neema Chuwa' },
  { id: 'LN-3010', customer: 'Hassan Kitwana', phone: '+255 713 902 448', principal: 4200.0, interestRate: 11.5, outstanding: 4200.0, status: 'Defaulted', disbursedDate: '2026-02-28', dueDate: '2026-08-28', officer: 'Joseph Mkude' },
  { id: 'LN-3011', customer: 'Asha Juma', phone: '+255 617 812 845', principal: 2500.0, interestRate: 10, outstanding: 1100.0, status: 'Active', disbursedDate: '2026-07-12', dueDate: '2027-01-12', officer: 'Grace Mahundi' },
  { id: 'LN-3012', customer: 'Grace Mwangi', phone: '+255 755 442 118', principal: 5000.0, interestRate: 12, outstanding: 0.0, status: 'Repaid', disbursedDate: '2026-03-30', dueDate: '2026-09-30', officer: 'Victor Lema' },
]
