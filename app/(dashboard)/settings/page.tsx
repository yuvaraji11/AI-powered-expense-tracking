'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Download, Trash2, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-expenses-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Export successful', description: 'Your data has been exported.' });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;

    try {
      const res = await fetch('/api/chat', { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Chat cleared', description: 'Your chat history has been deleted.' });
      }
    } catch (error) {
      console.error('Clear chat failed:', error);
      toast({ title: 'Failed to clear chat', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-foreground">Profile</CardTitle>
              <CardDescription className="text-muted-foreground">Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Name</Label>
            <Input
              value={user?.name || ''}
              disabled
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Currency</Label>
            <Input
              value={user?.currency || 'INR'}
              disabled
              className="bg-muted border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-foreground">Data Management</CardTitle>
              <CardDescription className="text-muted-foreground">Export and manage your data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Export All Expenses</p>
              <p className="text-sm text-muted-foreground">Download all your expenses as a CSV file</p>
            </div>
            <Button
              onClick={handleExportAll}
              disabled={exporting}
              variant="outline"
              className="border-border text-muted-foreground"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Clear Chat History</p>
              <p className="text-sm text-muted-foreground">Delete all AI chat messages</p>
            </div>
            <Button
              onClick={handleClearChat}
              variant="outline"
              className="border-red-900 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-foreground">Security</CardTitle>
              <CardDescription className="text-muted-foreground">Account security options</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Sign Out</p>
              <p className="text-sm text-muted-foreground">Sign out from your account on this device</p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="border-border text-muted-foreground"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground text-sm">
            <p>Nebula AI Expense Tracker v1.0.0</p>
            <p className="mt-1">Powered by Google Gemini AI</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
