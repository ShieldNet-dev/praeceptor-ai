import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Bot,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Instagram,
  AlertTriangle,
  Key,
  Link2,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';

const BotSetupGuide = () => {
  const navigate = useNavigate();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const webhookUrl = 'https://hnmfaovpcaaqelwuzzhz.supabase.co/functions/v1/praeceptor-api';

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-8 h-8" />
          <span className="text-lg font-bold text-foreground">Bot Setup Guide</span>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Bot className="w-4 h-4" />
            Integration Guide
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Connect <span className="text-gradient">Praeceptor AI</span> to Messaging Platforms
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow these step-by-step instructions to integrate the AI tutor with Telegram and Instagram.
          </p>
        </div>

        {/* Webhook URL Card */}
        <Card className="glass cyber-border mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Your Webhook URL</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Use this URL when configuring webhooks for both Telegram and Instagram:
            </p>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <code className="flex-1 text-sm text-foreground break-all font-mono">
                {webhookUrl}
              </code>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Setup */}
        <Card className="glass cyber-border mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0088cc]/20">
                <MessageCircle className="w-5 h-5 text-[#0088cc]" />
              </div>
              <CardTitle>Telegram Bot Setup</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Create a Bot with BotFather
              </h3>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <p>1. Open Telegram and search for <code className="bg-muted px-1 rounded">@BotFather</code></p>
                <p>2. Send <code className="bg-muted px-1 rounded">/newbot</code> and follow the prompts</p>
                <p>3. Choose a name and username for your bot</p>
                <p>4. BotFather will give you an <strong>API Token</strong> - save this securely!</p>
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-amber-200 text-xs">
                    Never share your bot token publicly. It provides full access to your bot.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                Configure Backend Secrets
              </h3>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <p>Add these secrets to your Lovable Cloud backend:</p>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Key className="w-4 h-4 text-primary" />
                    <code className="font-mono text-xs">TELEGRAM_BOT_TOKEN</code>
                    <span className="text-xs">- The token from BotFather</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Shield className="w-4 h-4 text-primary" />
                    <code className="font-mono text-xs">TELEGRAM_WEBHOOK_SECRET</code>
                    <span className="text-xs">- A random string you create (32+ chars recommended)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                Register the Webhook
              </h3>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <p>Open this URL in your browser (replace the placeholders):</p>
                <div className="p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  <code className="text-xs font-mono break-all">
                    https://api.telegram.org/bot<span className="text-primary">&lt;YOUR_BOT_TOKEN&gt;</span>/setWebhook?url=<span className="text-primary">&lt;WEBHOOK_URL&gt;</span>&secret_token=<span className="text-primary">&lt;YOUR_SECRET&gt;</span>
                  </code>
                </div>
                <p className="mt-2">Example with values:</p>
                <div className="p-3 bg-muted/50 rounded-lg overflow-x-auto">
                  <code className="text-xs font-mono break-all text-muted-foreground">
                    {`https://api.telegram.org/bot123456:ABC-DEF/setWebhook?url=${webhookUrl}&secret_token=my_secret_token_123`}
                  </code>
                </div>
                <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-green-200 text-xs">
                    You should see a response: <code>{`{"ok":true,"description":"Webhook was set"}`}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                Test Your Bot
              </h3>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <p>Open your bot in Telegram and send a message like "Hello"</p>
                <p>The bot should respond with cybersecurity guidance!</p>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('https://core.telegram.org/bots/tutorial', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Official Telegram Bot Documentation
            </Button>
          </CardContent>
        </Card>

        {/* Instagram Setup */}
        <Card className="glass cyber-border mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Instagram className="w-5 h-5 text-pink-400" />
              </div>
              <CardTitle>Instagram Bot Setup</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-200 text-sm">
                Instagram messaging integration requires a Meta Business Account and approved app. This is more complex than Telegram setup.
              </p>
            </div>

            {/* Step 1 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Prerequisites
              </h3>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>A Facebook Page linked to your Instagram Business Account</li>
                  <li>A Meta Developer Account</li>
                  <li>An app created in Meta Developer Console</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                Create a Meta App
              </h3>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <p>1. Go to <strong>developers.facebook.com</strong> and create a new app</p>
                <p>2. Select "Business" as the app type</p>
                <p>3. Add the "Instagram" product to your app</p>
                <p>4. Add the "Webhooks" product to your app</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                Configure Backend Secrets
              </h3>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <p>Add these secrets to your Lovable Cloud backend:</p>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Key className="w-4 h-4 text-primary" />
                    <code className="font-mono text-xs">META_APP_SECRET</code>
                    <span className="text-xs">- From App Settings → Basic</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Shield className="w-4 h-4 text-primary" />
                    <code className="font-mono text-xs">META_VERIFY_TOKEN</code>
                    <span className="text-xs">- A random string you create for webhook verification</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Key className="w-4 h-4 text-primary" />
                    <code className="font-mono text-xs">INSTAGRAM_PAGE_ACCESS_TOKEN</code>
                    <span className="text-xs">- Long-lived token from Graph API Explorer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                Configure Webhooks
              </h3>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <p>1. In your Meta App, go to Webhooks settings</p>
                <p>2. Add a new subscription for "Instagram"</p>
                <p>3. Enter your webhook URL:</p>
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded mt-1">
                  <code className="font-mono text-xs flex-1 break-all">{webhookUrl}</code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="mt-2">4. Enter your <code className="bg-muted px-1 rounded">META_VERIFY_TOKEN</code></p>
                <p>5. Subscribe to <strong>messages</strong> field</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span>
                Generate Access Token
              </h3>
              <div className="pl-8 space-y-2 text-sm text-muted-foreground">
                <p>1. Go to Graph API Explorer</p>
                <p>2. Select your app and get a User Access Token</p>
                <p>3. Add permissions: <code className="bg-muted px-1 rounded">instagram_basic</code>, <code className="bg-muted px-1 rounded">instagram_manage_messages</code>, <code className="bg-muted px-1 rounded">pages_messaging</code></p>
                <p>4. Exchange for a long-lived token (valid for 60 days)</p>
                <p>5. Save this as <code className="bg-muted px-1 rounded">INSTAGRAM_PAGE_ACCESS_TOKEN</code></p>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging/', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Official Instagram Messaging API Documentation
            </Button>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="glass cyber-border mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <CardTitle>Troubleshooting</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Bot not responding to messages?</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Verify the webhook URL is correct and accessible</li>
                <li>Check that all secrets are properly configured</li>
                <li>For Telegram: Ensure the <code className="bg-muted px-1 rounded">secret_token</code> in setWebhook matches <code className="bg-muted px-1 rounded">TELEGRAM_WEBHOOK_SECRET</code></li>
                <li>For Instagram: Make sure your app has been approved for messaging permissions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Getting "Invalid signature" errors?</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>The webhook secret/verify token doesn't match what's configured in the platform</li>
                <li>Re-register the webhook with the correct token</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Instagram webhook verification failing?</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Ensure <code className="bg-muted px-1 rounded">META_VERIFY_TOKEN</code> exactly matches what you enter in Meta Developer Console</li>
                <li>The webhook endpoint must respond within 5 seconds</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Help CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Need help with setup?
          </p>
          <Button variant="outline" onClick={() => navigate('/support')}>
            Contact Support
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BotSetupGuide;
