import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Gem, Check, CreditCard } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

interface GemPackage {
  id: string;
  name: string;
  description: string;
  gems: number;
  price: number;
  popular?: boolean;
  bonus?: number;
}

const gemPackages: GemPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    description: 'Perfect for trying out',
    gems: 100,
    price: 9.99,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    description: 'Most chosen option',
    gems: 500,
    price: 39.99,
    popular: true,
    bonus: 50,
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    description: 'For power users',
    gems: 1000,
    price: 69.99,
    bonus: 150,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    description: 'Best value deal',
    gems: 2500,
    price: 149.99,
    bonus: 500,
  },
];

export default function GemPurchase() {
  const [, setLocation] = useLocation();
  const [selectedPackage, setSelectedPackage] = useState<string>('popular');
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: async (packageData: GemPackage) => {
      const response = await fetch('/api/gems/purchase', {
        method: 'POST',
        headers: {
          ...authService.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: packageData.gems + (packageData.bonus || 0),
          packageType: packageData.name,
        }),
      });
      if (!response.ok) throw new Error('Failed to purchase gems');
      return response.json();
    },
    onSuccess: (_, packageData) => {
      const totalGems = packageData.gems + (packageData.bonus || 0);
      if (user) {
        updateUser({ gems: (user.gems || 0) + totalGems });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: "Purchase successful! 💎",
        description: `You received ${totalGems} gems. Enjoy chatting with your favorite models!`,
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    const packageData = gemPackages.find(pkg => pkg.id === selectedPackage);
    if (packageData) {
      purchaseMutation.mutate(packageData);
    }
  };

  const selectedPackageData = gemPackages.find(pkg => pkg.id === selectedPackage);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="mr-4"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground" data-testid="page-title">
              Buy Gems
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 gem-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <Gem className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Purchase Gems
          </h2>
          <p className="text-muted-foreground">
            Get gems to chat with models and unlock premium content
          </p>
          {user && (
            <div className="mt-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Current Balance: {user.gems} 💎
              </Badge>
            </div>
          )}
        </div>

        {/* Package Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {gemPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg relative",
                selectedPackage === pkg.id 
                  ? "ring-2 ring-primary border-primary" 
                  : "hover:border-primary/50",
                pkg.popular && "scale-105"
              )}
              onClick={() => setSelectedPackage(pkg.id)}
              data-testid={`package-${pkg.id}`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {pkg.gems} 💎
                  </div>
                  {pkg.bonus && (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      +{pkg.bonus} bonus gems!
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-foreground mb-2" data-testid="package-name">
                  {pkg.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4" data-testid="package-description">
                  {pkg.description}
                </p>
                
                <div className="text-3xl font-bold text-foreground mb-4">
                  ${pkg.price}
                </div>
                
                {selectedPackage === pkg.id && (
                  <div className="flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary" />
                    <span className="ml-2 text-primary font-medium">Selected</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Purchase Summary */}
        {selectedPackageData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Purchase Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Package:</span>
                  <span className="font-medium" data-testid="summary-package">
                    {selectedPackageData.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Base Gems:</span>
                  <span className="font-medium" data-testid="summary-base-gems">
                    {selectedPackageData.gems} 💎
                  </span>
                </div>
                {selectedPackageData.bonus && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bonus Gems:</span>
                    <span className="font-medium text-green-600 dark:text-green-400" data-testid="summary-bonus">
                      +{selectedPackageData.bonus} 💎
                    </span>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold">Total Gems:</span>
                    <span className="font-bold text-primary" data-testid="summary-total-gems">
                      {selectedPackageData.gems + (selectedPackageData.bonus || 0)} 💎
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg mt-2">
                    <span className="font-semibold">Price:</span>
                    <span className="font-bold text-foreground" data-testid="summary-price">
                      ${selectedPackageData.price}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase Button */}
        <div className="text-center">
          <Button
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending || !selectedPackageData}
            className="w-full sm:w-auto theme-gradient text-white font-semibold text-lg px-12 py-4 mb-4"
            data-testid="purchase-button"
          >
            {purchaseMutation.isPending ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <CreditCard className="w-5 h-5 mr-2" />
            )}
            Purchase Gems
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Secure payment via VXS Bill (Demo Mode)
          </p>
        </div>

        {/* Benefits Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What can you do with gems?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl mb-2">💬</div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Chat with Models
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Send messages to your favorite models (1 gem per message)
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl mb-2">🔓</div>
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  Unlock Premium Content
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Access exclusive premium posts and content
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl mb-2">⭐</div>
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Support Models
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Show appreciation and support your favorite creators
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
