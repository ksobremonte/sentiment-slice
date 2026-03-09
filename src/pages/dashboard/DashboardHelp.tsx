import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Search, Rocket, Settings, Star, Wrench, MessageCircle,
  Mail,
} from "lucide-react";
import HelpAssistantChat from "@/components/dashboard/HelpAssistantChat";

const categories = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Learn the basics and set up your dashboard.",
    articles: [
      { title: "What is the Sentiment Dashboard?", body: "The Sentiment Dashboard helps you monitor customer feedback, analyze review sentiment, and respond to conversations — all in one place." },
      { title: "How do I navigate the dashboard?", body: "Use the sidebar on the left to switch between pages like Overview, Chats, Sentiment, Reviews, and Trends. You can collapse the sidebar for more space." },
      { title: "How are reviews collected?", body: "Customers submit reviews through the public website. Each review is automatically analyzed for sentiment and stored in your dashboard for review." },
      { title: "What do the overview stats mean?", body: "The Overview page shows key metrics like total reviews, average rating, sentiment breakdown, and recent activity to give you a quick snapshot." },
    ],
  },
  {
    icon: Settings,
    title: "Account & Settings",
    description: "Manage your profile, security, and preferences.",
    articles: [
      { title: "How do I change my password?", body: "Go to User Settings → Security and click 'Update' next to Change Password. You'll be guided through the process securely." },
      { title: "Can I change my email address?", body: "Your email is tied to your account login. To use a different email, please contact support for assistance." },
      { title: "How do I update my display name?", body: "Head to User Settings → Profile Settings. Enter your preferred name and click 'Save Profile'." },
      { title: "What appearance options are available?", body: "You can switch between light and dark themes, adjust font size, and change the dashboard language in User Settings → Appearance." },
    ],
  },
  {
    icon: Star,
    title: "Reviews & Sentiment",
    description: "Understand how reviews and sentiment analysis work.",
    articles: [
      { title: "How does sentiment analysis work?", body: "Each review is analyzed using AI to determine whether the sentiment is positive, neutral, or negative. Keywords and a reason are provided for transparency." },
      { title: "Can I respond to reviews?", body: "Yes! Open any review from the Reviews page and use the response dialog to write an admin reply. Customers may see your response on the public page." },
      { title: "What are sentiment keywords?", body: "Keywords are important words or phrases extracted from a review that helped determine its sentiment — for example, 'delicious', 'slow service', or 'friendly staff'." },
      { title: "How do I approve or reject reviews?", body: "In the Reviews page, each review can be approved or hidden. Only approved reviews appear on the public-facing reviews page." },
    ],
  },
  {
    icon: Wrench,
    title: "Troubleshooting",
    description: "Solutions for common issues you might encounter.",
    articles: [
      { title: "The dashboard isn't loading", body: "Try refreshing your browser or clearing your cache. If the issue persists, check your internet connection or try a different browser." },
      { title: "I can't see any reviews", body: "Make sure reviews have been submitted. If they have, check that you're logged in with the correct account and that your session hasn't expired." },
      { title: "Sentiment results seem incorrect", body: "AI analysis is generally accurate but may occasionally misinterpret sarcasm or ambiguous language. You can manually adjust sentiment if needed." },
      { title: "I'm getting logged out frequently", body: "This can happen if your session token expires. Make sure your browser allows cookies and that you're not using incognito mode." },
    ],
  },
  {
    icon: MessageCircle,
    title: "Contact Support",
    description: "Reach out if you need further help.",
    articles: [
      { title: "How do I contact support?", body: "You can reach us by emailing support@pizzavolante.com. We typically respond within 24 hours on business days." },
      { title: "Can I request a new feature?", body: "Absolutely! Send your feature ideas to our support email. We love hearing suggestions from our users." },
      { title: "Is there a community forum?", body: "Not yet, but we're working on it! For now, email is the best way to get help or share feedback." },
    ],
  },
];

const DashboardHelp = () => {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase().trim();

  const filtered = categories
    .map((cat) => ({
      ...cat,
      articles: cat.articles.filter(
        (a) =>
          !query ||
          a.title.toLowerCase().includes(query) ||
          a.body.toLowerCase().includes(query)
      ),
    }))
    .filter((cat) => cat.articles.length > 0);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
          <p className="text-sm text-muted-foreground">Find answers, tips, and guides to get the most out of your dashboard.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No articles found matching "{search}". Try a different search term.</p>
          </div>
        )}

        {filtered.map((cat) => (
          <Card key={cat.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <cat.icon className="h-5 w-5 text-primary" />
                {cat.title}
              </CardTitle>
              <CardDescription>{cat.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {cat.articles.map((article, i) => (
                  <AccordionItem key={i} value={`${cat.title}-${i}`}>
                    <AccordionTrigger className="text-sm text-left font-medium hover:no-underline">
                      {article.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {article.body}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {/* AI Help Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              Ask AI Assistant
            </CardTitle>
            <CardDescription>Get instant answers about the dashboard and its features.</CardDescription>
          </CardHeader>
          <CardContent>
            <HelpAssistantChat />
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Still need help?</p>
                <p className="text-xs text-muted-foreground">Reach out to our support team anytime.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.location.href = "mailto:support@pizzavolante.com"}>
              Email Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHelp;
