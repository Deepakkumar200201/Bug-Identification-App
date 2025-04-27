import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import '@google-pay/button-element';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Check, Shield, Sparkles, Award, BookOpen, DatabaseIcon } from 'lucide-react';
import { type Subscription } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// Declare the Google Pay button type
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'google-pay-button': any;
    }
  }
}

interface PriceOption {
  planType: 'monthly' | 'yearly';
  price: number;
  originalPrice?: number;
  name: string;
  discount?: string;
  features: string[];
}

const PRICING_OPTIONS: Record<string, PriceOption> = {
  monthly: {
    planType: 'monthly',
    price: 4.99,
    name: 'Monthly',
    features: [
      'Unlimited identifications',
      'Premium bug information',
      'History sync across devices',
      'Location-based predictions',
      'Advanced AI insights'
    ]
  },
  yearly: {
    planType: 'yearly',
    price: 49.99,
    originalPrice: 59.88,
    name: 'Yearly',
    discount: 'Save 16%',
    features: [
      'All monthly features',
      'Priority support',
      'Offline mode',
      'Ad-free experience',
      'Early access to new features'
    ]
  }
};

// Format a date to human-readable format
function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function PremiumSubscription() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isGooglePayReady, setIsGooglePayReady] = useState<boolean>(false);

  // Create mock subscription data for display purposes
  const subscription = {
    id: 1,
    planType: 'monthly',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  } as Subscription;
  const hasActiveSubscription = false;

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const res = await apiRequest('POST', `/api/subscriptions/cancel/${subscriptionId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Cancel',
        description: error.message || 'There was an error cancelling your subscription.',
        variant: 'destructive',
      });
    }
  });

  // Google Pay payment processing mutation
  const processPaymentMutation = useMutation({
    mutationFn: async ({ paymentData, planType }: { paymentData: any, planType: 'monthly' | 'yearly' }) => {
      const res = await apiRequest('POST', '/api/google-pay/process-payment', {
        paymentData,
        planType
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({
        title: 'Payment Successful',
        description: 'Your premium subscription is now active.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment Failed',
        description: error.message || 'There was an error processing your payment.',
        variant: 'destructive',
      });
    }
  });

  // Handle Google Pay button click
  const handleGooglePayPayment = (paymentData: any) => {
    processPaymentMutation.mutate({
      paymentData,
      planType: selectedPlan
    });
  };

  // Handle subscription cancellation
  const handleCancelSubscription = () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      // In a real app, we would pass a subscription ID
      toast({
        title: 'Demo Mode',
        description: 'This is a demo. Subscription cancellation would work with a real subscription.',
      });
    }
  };

  const selectedPriceOption = PRICING_OPTIONS[selectedPlan];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Upgrade to BugIdentifier Premium
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Get unlimited identifications, premium features, and advanced AI insights for the ultimate insect identification experience.
        </p>
      </div>

      {hasActiveSubscription ? (
        <Card className="mb-8">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-500/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-primary" />
                  Your Premium Subscription
                </CardTitle>
                <CardDescription>
                  You're currently enjoying premium features
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="font-medium">{subscription?.planType.charAt(0).toUpperCase() + subscription?.planType.slice(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{subscription?.status.charAt(0).toUpperCase() + subscription?.status.slice(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(subscription?.startDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Renewal Date</p>
                  <p className="font-medium">{formatDate(subscription?.endDate)}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button variant="outline" onClick={handleCancelSubscription} disabled={cancelSubscriptionMutation.isPending}>
              {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <Tabs 
            defaultValue="monthly" 
            value={selectedPlan}
            onValueChange={(value) => setSelectedPlan(value as 'monthly' | 'yearly')}
            className="w-full mb-8"
          >
            <div className="flex justify-center mb-6">
              <TabsList className="grid grid-cols-2 w-80">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">
                  <span>Yearly</span>
                  {PRICING_OPTIONS.yearly.discount && (
                    <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                      {PRICING_OPTIONS.yearly.discount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="monthly" className="mt-0">
              <PlanCard 
                plan={PRICING_OPTIONS.monthly} 
                onCheckout={handleGooglePayPayment}
                isPending={processPaymentMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="yearly" className="mt-0">
              <PlanCard 
                plan={PRICING_OPTIONS.yearly} 
                onCheckout={handleGooglePayPayment}
                isPending={processPaymentMutation.isPending}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-12 space-y-8">
            <h2 className="text-2xl font-bold text-center">Premium Features</h2>
            
            <div className="grid gap-6 md:grid-cols-3">
              <FeatureCard 
                icon={<Shield className="h-6 w-6 text-primary" />}
                title="Unlimited Identifications"
                description="Identify as many insects as you want with no daily limits"
              />
              <FeatureCard 
                icon={<BookOpen className="h-6 w-6 text-primary" />}
                title="Enhanced Information"
                description="Get detailed information about every insect you identify"
              />
              <FeatureCard 
                icon={<Sparkles className="h-6 w-6 text-primary" />}
                title="Advanced AI"
                description="Access our most advanced AI models for superior accuracy"
              />
              <FeatureCard 
                icon={<DatabaseIcon className="h-6 w-6 text-primary" />}
                title="Sync Across Devices"
                description="Access your identifications and logbook on any device"
              />
              <FeatureCard 
                icon={<Award className="h-6 w-6 text-primary" />}
                title="Priority Updates"
                description="Get early access to new features and improvements"
              />
              <FeatureCard 
                icon={<CreditCard className="h-6 w-6 text-primary" />}
                title="Convenient Billing"
                description="Easy subscription management with Google Pay"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface PlanCardProps {
  plan: PriceOption;
  onCheckout: (paymentData: any) => void;
  isPending: boolean;
}

function PlanCard({ plan, onCheckout, isPending }: PlanCardProps) {
  return (
    <Card className="max-w-lg mx-auto border-primary/20 hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">{plan.name} Premium</CardTitle>
        <CardDescription>Perfect for enthusiasts and researchers</CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex items-baseline mb-6">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-gray-500 ml-2">/{plan.planType}</span>
          {plan.originalPrice && (
            <span className="text-gray-400 ml-2 line-through">${plan.originalPrice}</span>
          )}
        </div>

        <Separator className="mb-6" />

        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {!isPending ? (
          <google-pay-button
            environment="TEST"
            buttonType="subscribe"
            buttonColor="black"
            buttonLocale="en"
            buttonSizeMode="fill"
            paymentRequest={{
              apiVersion: 2,
              apiVersionMinor: 0,
              allowedPaymentMethods: [{
                type: "CARD",
                parameters: {
                  allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                  allowedCardNetworks: ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]
                },
                tokenizationSpecification: {
                  type: "PAYMENT_GATEWAY",
                  parameters: {
                    gateway: "example",
                    gatewayMerchantId: "exampleGatewayMerchantId"
                  }
                }
              }],
              merchantInfo: {
                merchantId: "BCR2DN6T56M7TBEA",
                merchantName: "BugIdentifier"
              },
              transactionInfo: {
                totalPriceStatus: "FINAL",
                totalPriceLabel: "Total",
                totalPrice: String(plan.price),
                currencyCode: "USD",
                countryCode: "US"
              }
            }}
            onLoadPaymentData={(event: CustomEvent) => onCheckout(event.detail)}
            style={{ width: '100%' }}
          ></google-pay-button>
        ) : (
          <Button disabled className="w-full">Processing...</Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-primary/10 hover:border-primary/30 transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 p-3 rounded-full bg-primary/10">
            {icon}
          </div>
          <h3 className="font-medium text-lg mb-2">{title}</h3>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}