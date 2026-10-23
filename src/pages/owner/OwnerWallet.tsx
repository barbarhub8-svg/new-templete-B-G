import { IndianRupee, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { mockWallet } from '../../lib/mockData';
import { useToast } from '../../hooks/use-toast';

export default function OwnerWallet() {
  const wallet = mockWallet;
  const { toast } = useToast();
  const minWithdrawal = 100;

  const handleWithdraw = () => {
    if (wallet.availableBalance < minWithdrawal) {
      toast({
        title: 'Cannot Withdraw',
        description: `Minimum withdrawal amount is ₹${minWithdrawal}`,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Withdrawal Initiated',
      description: 'Funds will be transferred to your bank account in 24-48 hours',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Wallet</h1>
        <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
      </div>

      {/* Wallet Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">₹{wallet.totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission Paid</p>
              <p className="text-2xl font-bold">₹{wallet.totalCommission.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Platform fee (10%)</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold">₹{wallet.availableBalance.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Withdrawal Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Withdraw Funds</h2>
        
        {wallet.availableBalance < minWithdrawal ? (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Minimum Withdrawal Not Met</p>
              <p className="text-sm text-muted-foreground mt-1">
                You need at least ₹{minWithdrawal} in your account to withdraw. Current balance: ₹{wallet.availableBalance}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg mb-4">
            <div>
              <p className="font-medium">Available for Withdrawal</p>
              <p className="text-2xl font-bold text-success">₹{wallet.availableBalance}</p>
            </div>
            <Button size="lg" onClick={handleWithdraw}>
              Withdraw Now
            </Button>
          </div>
        )}

        {wallet.pendingBalance > 0 && (
          <div className="p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Balance</p>
                <p className="font-semibold">₹{wallet.pendingBalance}</p>
              </div>
              <Badge variant="outline">
                Available in 24-48 hrs
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              From recently completed bookings
            </p>
          </div>
        )}
      </Card>

      {/* Transaction History */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        <div className="space-y-3">
          {wallet.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'credit'
                      ? 'bg-success/10'
                      : 'bg-warning/10'
                  }`}
                >
                  {transaction.type === 'credit' ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-warning" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    transaction.type === 'credit' ? 'text-success' : 'text-warning'
                  }`}
                >
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                </p>
                <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
