'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CATEGORY_COLORS, CATEGORY_HEX_COLORS, Category } from '@/lib/categories';
import Link from 'next/link';
import { useCurrency } from '@/lib/context/AuthContext';

interface Analytics {
  totalSpending: number;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    total: number;
    count: number;
  }>;
  recentExpenses: Array<{
    _id: string;
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
  budgetStatus: Array<{
    category: string;
    budgetAmount: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
}

const CHART_COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const symbol = useCurrency();

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Auto-refresh when the AI bot adds/updates/deletes an expense
  useEffect(() => {
    const handleExpenseChanged = () => fetchAnalytics();
    window.addEventListener('expense-changed', handleExpenseChanged);
    return () => window.removeEventListener('expense-changed', handleExpenseChanged);
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const avgPerDay = analytics
    ? analytics.totalSpending / (period === 'week' ? 7 : period === 'month' ? 30 : 365)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your expenses</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'year')}>
          <TabsList className="bg-muted">
            <TabsTrigger value="week" className="data-[state=active]:bg-violet-600">
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-violet-600">
              Month
            </TabsTrigger>
            <TabsTrigger value="year" className="data-[state=active]:bg-violet-600">
              Year
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spending</p>
                <p className="text-2xl font-bold text-foreground">
                  {symbol}{analytics?.totalSpending.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold text-foreground">
                  {symbol}{avgPerDay.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.categoryBreakdown.reduce((sum, c) => sum + c.count, 0) || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Category</p>
                <p className="text-lg font-bold text-foreground truncate">
                  {analytics?.categoryBreakdown[0]?.category || 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.categoryBreakdown.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={50}
                      stroke="#ffffff"
                      strokeWidth={1}
                    >
                      {analytics.categoryBreakdown.map((entry, index) => (
                        <Cell key={index} fill={CATEGORY_HEX_COLORS[entry.category as Category] || '#8b5cf6'} />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Amount']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.monthlyTrend.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlyTrend}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8' }}
                      tickFormatter={(value) => {
                        const [, month] = value.split('-');
                        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month) - 1];
                      }}
                    />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Spending']}
                    />
                    <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Budget Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-violet-400">
              <Link href="/transactions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.recentExpenses.length ? (
                analytics.recentExpenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${CATEGORY_COLORS[expense.category as Category] || 'bg-slate-600'} flex items-center justify-center`}
                      >
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.category} - {format(new Date(expense.date), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-red-400">
                      <ArrowDownRight className="w-4 h-4" />
                      <span className="font-semibold">{symbol}{expense.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No transactions yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Budget Status</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-violet-400">
              <Link href="/budgets">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.budgetStatus.length ? (
                analytics.budgetStatus.map((budget) => (
                  <div key={budget.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{budget.category}</span>
                      <span className="text-muted-foreground">
                        {symbol}{budget.spent.toFixed(2)} / {symbol}{budget.budgetAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${budget.percentage >= 100
                            ? 'bg-red-500'
                            : budget.percentage >= 80
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={
                          budget.percentage >= 100
                            ? 'text-red-400'
                            : budget.percentage >= 80
                              ? 'text-yellow-400'
                              : 'text-green-400'
                        }
                      >
                        {budget.percentage}% used
                      </span>
                      <span className="text-muted-foreground">
                        {budget.remaining >= 0
                          ? `${symbol}${budget.remaining.toFixed(2)} left`
                          : `${symbol}${Math.abs(budget.remaining).toFixed(2)} over`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p className="mb-2">No budgets set</p>
                  <Button asChild size="sm" variant="outline" className="border-border text-muted-foreground">
                    <Link href="/budgets">Create Budget</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
