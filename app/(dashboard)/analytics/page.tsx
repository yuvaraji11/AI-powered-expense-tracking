'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { CATEGORY_COLORS, CATEGORY_HEX_COLORS, Category } from '@/lib/categories';
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

export default function AnalyticsPage() {
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
    setLoading(true);
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

  const periodLabel = period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Detailed spending insights</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total {periodLabel}</p>
            <p className="text-3xl font-bold text-foreground">
              {symbol}{analytics?.totalSpending.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Transactions</p>
            <p className="text-3xl font-bold text-foreground">
              {analytics?.categoryBreakdown.reduce((sum, c) => sum + c.count, 0) || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Categories Used</p>
            <p className="text-3xl font-bold text-foreground">
              {analytics?.categoryBreakdown.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Category Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.categoryBreakdown.length ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
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
                      formatter={(value: number, name: string) => [`${symbol}${value.toFixed(2)}`, name]}
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
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Category Comparison */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.categoryBreakdown.length ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.categoryBreakdown}
                    layout="vertical"
                    margin={{ left: 80 }}
                  >
                    <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8' }}
                      width={75}
                    />
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
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {analytics.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_HEX_COLORS[entry.category as Category] || '#8b5cf6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Chart - Monthly Trend */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.monthlyTrend.length ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlyTrend}>
                    <defs>
                      <linearGradient id="colorTotalAnal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
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
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorTotalAnal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.categoryBreakdown.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Amount</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Transactions</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.categoryBreakdown.map((cat, index) => (
                    <tr key={cat.category} className="border-b border-border">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="text-foreground">{cat.category}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-foreground font-medium">
                        {symbol}{cat.total.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">{cat.count}</td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-600/20 text-violet-400">
                          {cat.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No category data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
