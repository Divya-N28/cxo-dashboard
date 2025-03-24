import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testApiToken, refreshToken } from '@/utils/dataFetcher';
import { Loader2 } from 'lucide-react';

interface ApiTokenSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSaved: () => void;
}

export default function ApiTokenSettings({ isOpen, onClose, onTokenSaved }: ApiTokenSettingsProps) {
  const [apiToken, setApiToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Load token from localStorage when component mounts
    const savedToken = localStorage.getItem('turbohire_api_token');
    if (savedToken) {
      setApiToken(savedToken);
    }
  }, []);

  const handleSaveToken = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await testApiToken(apiToken);
      
      if (result.success) {
        // Save token to localStorage
        localStorage.setItem('turbohire_api_token', apiToken);
        setTestResult({ success: true, message: 'API token is valid!' });
        
        // Notify parent component
        setTimeout(() => {
          onTokenSaved();
          onClose();
        }, 1000);
      } else {
        // If token is invalid, try to refresh it
        const refreshedToken = await refreshToken(apiToken);
        
        if (refreshedToken) {
          // Save the refreshed token
          localStorage.setItem('turbohire_api_token', refreshedToken);
          setApiToken(refreshedToken);
          setTestResult({ success: true, message: 'Token refreshed successfully!' });
          
          // Notify parent component
          setTimeout(() => {
            onTokenSaved();
            onClose();
          }, 1000);
        } else {
          setTestResult({ success: false, message: result.message || 'Invalid API token' });
        }
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error testing API token' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Token Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-token">TurboHire API Token</Label>
            <Input
              id="api-token"
              type="password"
              placeholder="Enter your API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </div>
          
          {testResult && (
            <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.message}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveToken} disabled={testing || !apiToken.trim()}>
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Save & Test'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 