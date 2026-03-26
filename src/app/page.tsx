'use client';
import InputForm from '@/components/InputForm';
import Loader from '@/components/Loader';
import PasswordModal from '@/components/PasswordModal';
import ResultDisplay from '@/components/ResultDisplay';
import { getSessionRemainingHours, isSessionValid } from '@/lib/sessionManager';
import type { FormData, MaxMindResponse } from '@/types/minfraud';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [response, setResponse] = useState<MaxMindResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  // Check session validity on component mount
  useEffect(() => {
    if (isSessionValid()) {
      setIsAuthenticated(true);
      const remainingHours = getSessionRemainingHours();
      if (remainingHours !== null && remainingHours > 0) {
        toast.success(`Session active. Expires in ${remainingHours} hours.`);
      }
    }
  }, []);

  const handleFormSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(undefined);
    setFormError(undefined);
    setResponse(null);

    try {
      const res = await fetch('/api/minfraud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      setResponse(result);
      toast.success('Analysis completed successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (response) {
      const jsonString = JSON.stringify(response, null, 2);
      navigator.clipboard.writeText(jsonString);
      toast.success('JSON copied to clipboard');
    }
  };

  const handleAuthenticationSuccess = () => {
    setIsAuthenticated(true);
  };

  // Show password modal if not authenticated
  if (!isAuthenticated) {
    return <PasswordModal onSuccess={handleAuthenticationSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            FRIQ Fraud Analysis Tool
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Internal fraud risk analysis powered by MaxMind
          </p>
        </div>

        {/* Input Form */}
        <InputForm
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          error={formError}
        />

        {/* Loading State */}
        {isLoading && <Loader />}

        {/* Results Display */}
        {!isLoading && response && (
          <ResultDisplay response={response} onCopyJson={handleCopyJson} />
        )}
      </div>
    </div>
  );
}
