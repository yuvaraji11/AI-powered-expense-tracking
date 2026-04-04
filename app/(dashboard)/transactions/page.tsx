'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { CATEGORIES, PAYMENT_METHODS, CATEGORY_COLORS, CATEGORY_ICONS, Category } from '@/lib/categories';
import { useCurrency } from '@/lib/context/AuthContext';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  notes?: string;
}

interface ExpenseForm {
  amount: string;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  notes: string;
}

const initialForm: ExpenseForm = {
  amount: '',
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: 'Cash',
  notes: '',
};

export default function TransactionsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const symbol = useCurrency();

  useEffect(() => {
    fetchExpenses();
  }, [page, categoryFilter]);

  // Auto-refresh when the AI bot adds/updates/deletes an expense
  useEffect(() => {
    const handleExpenseChanged = () => fetchExpenses();
    window.addEventListener('expense-changed', handleExpenseChanged);
    return () => window.removeEventListener('expense-changed', handleExpenseChanged);
  }, [page, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/expenses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses';
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
          title: editingId ? 'Expense updated' : 'Expense added',
          description: 'Your expense has been saved successfully.',
        });
        setDialogOpen(false);
        setForm(initialForm);
        setEditingId(null);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to save expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense._id);
    setForm({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      date: expense.date.split('T')[0],
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Expense deleted' });
        fetchExpenses();
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const res = await fetch(`/api/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Export successful' });
      }
    } catch (error) {
      console.error('Failed to export:', error);
      toast({
        title: 'Export failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Manage your expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-border text-muted-foreground hover:bg-muted"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setForm(initialForm);
              setEditingId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingId ? 'Edit Expense' : 'Add Expense'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingId ? 'Update the expense details below.' : 'Enter the details for your new expense.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      required
                      className="bg-muted border-border text-foreground"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                    required
                  >
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-foreground">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    className="bg-muted border-border text-foreground"
                    placeholder="What did you spend on?"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Payment Method</Label>
                  <Select
                    value={form.paymentMethod}
                    onValueChange={(v) => setForm({ ...form, paymentMethod: v })}
                  >
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method} className="text-foreground">
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Notes (optional)</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    placeholder="Additional notes"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Update Expense' : 'Add Expense'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search expenses..."
                  className="pl-10 bg-muted border-border text-foreground"
                />
              </div>
              <Button type="submit" variant="secondary" className="bg-muted hover:bg-neutral-700 text-foreground">
                Search
              </Button>
            </form>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-border text-muted-foreground"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-4">
                <div className="w-48">
                  <Label className="text-muted-foreground text-sm">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all" className="text-foreground">All Categories</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-foreground">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">No expenses found</p>
              <p className="text-sm">Add your first expense or try a different search</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {expenses.map((expense) => {
                  const Icon = CATEGORY_ICONS[expense.category as Category] || CATEGORY_ICONS.Other;
                  return (
                    <div
                      key={expense._id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl ${CATEGORY_COLORS[expense.category as Category] || 'bg-neutral-600'} flex items-center justify-center`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.category} - {expense.paymentMethod} - {format(new Date(expense.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-foreground">
                          {symbol}{expense.amount.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="border-border text-muted-foreground"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="border-border text-muted-foreground"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
