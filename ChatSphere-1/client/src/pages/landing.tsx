import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-chat-dark">
      <Card className="w-full max-w-md mx-4 bg-chat-secondary border-chat-tertiary">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-app-title">Welcome to ChatFlow</h1>
            <p className="text-chat-muted" data-testid="text-app-description">Connect and chat in real-time</p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-chat-accent hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              data-testid="button-login"
            >
              Sign In with Replit
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-chat-muted text-sm" data-testid="text-auth-info">Secure authentication powered by Replit Auth</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
