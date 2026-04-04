'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, Category } from '@/lib/categories';
import { useCurrency } from '@/lib/context/AuthContext';

interface Budget {
  _id: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
}

interface BudgetStatus {
  category: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const symbol = useCurrency();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetsRes, analyticsRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/analytics?period=month'),
      ]);

      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        setBudgets(budgetsData);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setBudgetStatus(analyticsData.budgetStatus || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId ? `/api/budgets/${editingId}` : '/api/budgets';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      if (res.ok) {
        toast({
          title: editingId ? 'Budget updated' : 'Budget created',
          description: `${form.category} budget has been saved.`,
        });
        setDialogOpen(false);
        setForm({ category: '', amount: '', period: 'monthly' });
        setEditingId(null);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to save budget.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingId(budget._id);
    setForm({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Budget deleted' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete budget.',
        variant: 'destructive',
      });
    }
  };

  const existingCategories = budgets.map((b) => b.category);
  const availableCategories = CATEGORIES.filter(
    (cat) => !existingCategories.includes(cat) || (editingId && form.category === cat)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground">Set and track spending limits</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setForm({ category: '', amount: '', period: 'monthly' });
              setEditingId(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingId ? 'Edit Budget' : 'Create Budget'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingId ? 'Update your budget settings below.' : 'Set a spending limit for a category.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                  disabled={!!editingId}
                >
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-foreground">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Budget Amount</Label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="bg-muted border-border text-foreground"
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Period</Label>
                <Select
                  value={form.period}
                  onValueChange={(v) => setForm({ ...form, period: v as 'weekly' | 'monthly' | 'yearly' })}
                >
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="weekly" className="text-foreground">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-foreground">Monthly</SelectItem>
                    <SelectItem value="yearly" className="text-foreground">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={submitting || !form.category || !form.amount}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Update Budget' : 'Create Budget'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Cards */}
      {budgets.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No budgets yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first budget to start tracking your spending limits
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const status = budgetStatus.find((s) => s.category === budget.category);
            const spent = status?.spent || 0;
            const percentage = status?.percentage || 0;
            const remaining = budget.amount - spent;
            const Icon = CATEGORY_ICONS[budget.category as Category] || CATEGORY_ICONS.Other;
            const isOverBudget = percentage >= 100;
            const isWarning = percentage >= 80 && percentage < 100;

            return (
              <Card key={budget._id} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${CATEGORY_COLORS[budget.category as Category] || 'bg-neutral-600'} flex items-center justify-center`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-foreground">{budget.category}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(budget)}
                        className="text-muted-foreground hover:text-foreground h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(budget._id)}
                        className="text-red-400 hover:text-red-300 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {symbol}{spent.toFixed(2)} of {symbol}{budget.amount.toFixed(2)}
                      </span>
                      <span
                        className={
                          isOverBudget
                            ? 'text-red-400'
                            : isWarning
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }
                      >
                        {percentage}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className="h-2 bg-muted"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        {isOverBudget ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                        <span
                          className={
                            isOverBudget
                              ? 'text-red-400'
                              : isWarning
                              ? 'text-yellow-400'
                              : 'text-green-400'
                          }
                        >
                          {isOverBudget
                            ? `${symbol}${Math.abs(remaining).toFixed(2)} over`
                            : `${symbol}${remaining.toFixed(2)} left`}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tips Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Budget Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-foreground mb-2">50/30/20 Rule</h4>
              <p className="text-sm text-muted-foreground">
                Allocate 50% to needs, 30% to wants, and 20% to savings and debt repayment.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-foreground mb-2">Track Everything</h4>
              <p className="text-sm text-muted-foreground">
                Use the AI chat to quickly log expenses. Just say what you spent!
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-foreground mb-2">Review Regularly</h4>
              <p className="text-sm text-muted-foreground">
                Check your budgets weekly to stay on track and adjust as needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
