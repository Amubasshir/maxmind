'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setAuthenticated, validatePassword } from '@/lib/sessionManager';
import { useState } from 'react';
import { toast } from 'sonner';

interface PasswordModalProps {
  onSuccess: () => void;
}

export default function PasswordModal({ onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate small delay for better UX
    setTimeout(() => {
      if (validatePassword(password)) {
        setAuthenticated();
        onSuccess();
        toast.success('Access granted');
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
        toast.error('Access denied');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            Please enter the password to access the FRIQ Fraud Analysis Tool.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter password"
                autoFocus
                disabled={isLoading}
                className={error ? 'border-red-500' : ''}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              className="cursor-pointer"
              type="submit"
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? 'Verifying...' : 'Access Tool'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
