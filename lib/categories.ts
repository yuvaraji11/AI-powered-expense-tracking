import {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Receipt,
  Heart,
  GraduationCap,
  Plane,
  Leaf,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Groceries',
  'Subscriptions',
  'Investment',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Bills & Utilities': Receipt,
  'Healthcare': Heart,
  'Education': GraduationCap,
  'Travel': Plane,
  'Personal Care': Leaf,
  'Groceries': ShoppingCart,
  'Subscriptions': CreditCard,
  'Investment': TrendingUp,
  'Other': HelpCircle,
};

export const CATEGORY_COLORS: Record<Category, string> = {
  'Food & Dining': 'bg-orange-500',
  'Transportation': 'bg-blue-500',
  'Shopping': 'bg-pink-500',
  'Entertainment': 'bg-purple-500',
  'Bills & Utilities': 'bg-yellow-500',
  'Healthcare': 'bg-red-500',
  'Education': 'bg-teal-500',
  'Travel': 'bg-cyan-500',
  'Personal Care': 'bg-rose-500',
  'Groceries': 'bg-green-500',
  'Subscriptions': 'bg-emerald-500',
  'Investment': 'bg-emerald-500',
  'Other': 'bg-gray-500',
};

export const CATEGORY_HEX_COLORS: Record<Category, string> = {
  'Food & Dining': '#f97316',
  'Transportation': '#3b82f6',
  'Shopping': '#ec4899',
  'Entertainment': '#a855f7',
  'Bills & Utilities': '#eab308',
  'Healthcare': '#ef4444',
  'Education': '#14b8a6',
  'Travel': '#06b6d4',
  'Personal Care': '#f43f5e',
  'Groceries': '#22c55e',
  'Subscriptions': '#10b981',
  'Investment': '#10b981',
  'Other': '#6b7280',
};

export const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'UPI',
  'Bank Transfer',
  'Other',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
