import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, AlertTriangle, Users, CheckCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Page18Plus() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="font-heading text-3xl font-bold mb-4">Age Restriction Notice</h1>
        
        <p className="text-muted-foreground mb-8">
          Field Forecasts provides sports data and insights for betting researchers and sports analysts who are <span className="font-bold text-foreground">18 years or older</span>.
        </p>

        <div className="bg-card rounded-xl border border-border p-6 mb-8 text-left">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Information Purpose</h3>
              <p className="text-sm text-muted-foreground">
                This platform provides sports data for research, analysis, and entertainment purposes only. 
                We do not encourage or facilitate gambling.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">For Researchers 18+</h3>
              <p className="text-sm text-muted-foreground">
                If you are 18 or older and using this site for sports research, analysis, or staying informed, 
                you are welcome to continue.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link to="/">
            <Button className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              I am 18 or older - Continue
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" className="w-full">
              Take me back to safety
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          By continuing, you confirm you are at least 18 years old and using this site for legitimate research purposes.
        </p>
      </div>
    </div>
  );
}