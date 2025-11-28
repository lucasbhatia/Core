"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PortalShell from "@/components/portal/portal-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Search,
  TrendingUp,
  Users,
  Code,
  Headphones,
  Megaphone,
  Settings,
  DollarSign,
  Scale,
  BookOpen,
  Palette,
  BarChart2,
  Wand2,
  ArrowLeft,
  Star,
  Sparkles,
  Check,
  Lock,
} from "lucide-react";
import { agentTemplates, agentCategories, type AgentTemplate } from "@/lib/ai-agents/templates";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  Headphones,
  Megaphone,
  Settings,
  Code,
  Users,
  DollarSign,
  Scale,
  Search: BookOpen,
  Palette,
  BarChart2,
  Wand2,
  Bot,
  UserCheck: Users,
  FileText: Settings,
  MessageSquare: Headphones,
  Mail: Megaphone,
  Repeat: Settings,
  BookOpen,
  Heart: Headphones,
  AlertTriangle: Headphones,
  PenTool: Palette,
  Share2: Megaphone,
  Eye: BookOpen,
  Briefcase: Users,
  FileSearch: Users,
  HelpCircle: Users,
  UserPlus: Users,
  Receipt: DollarSign,
  Activity: BarChart2,
  FileCheck: Scale,
  Shield: Scale,
  Globe: BookOpen,
  Building: BookOpen,
  Mic: Palette,
  Type: Palette,
  Zap: Wand2,
  Book: Palette,
  Database: BarChart2,
  PieChart: BarChart2,
  FileSpreadsheet: BarChart2,
  Lightbulb: Wand2,
  Bug: Code,
  CheckSquare: Code,
  Box: Code,
  FileCode: Code,
};

const tierColors: Record<string, string> = {
  free: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  starter: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pro: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  business: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  enterprise: "bg-red-500/10 text-red-500 border-red-500/20",
};

const categoryIcons: Record<string, React.ElementType> = {
  sales: TrendingUp,
  support: Headphones,
  marketing: Megaphone,
  operations: Settings,
  development: Code,
  hr: Users,
  finance: DollarSign,
  legal: Scale,
  research: BookOpen,
  creative: Palette,
  data: BarChart2,
  custom: Wand2,
};

export default function AgentTemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPlan] = useState("pro"); // This would come from the user's subscription

  const filteredTemplates = agentTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const tierOrder = ["free", "starter", "pro", "business", "enterprise"];
  const currentTierIndex = tierOrder.indexOf(currentPlan);

  const isTemplateAvailable = (template: AgentTemplate) => {
    const templateTierIndex = tierOrder.indexOf(template.tier);
    return templateTierIndex <= currentTierIndex;
  };

  const handleUseTemplate = (template: AgentTemplate) => {
    if (!isTemplateAvailable(template)) {
      // Show upgrade modal or redirect to billing
      router.push("/portal/billing?upgrade=true");
      return;
    }
    router.push(`/portal/agents/new?template=${template.id}`);
  };

  const popularTemplates = agentTemplates.filter((t) => t.popular);

  return (
    <PortalShell pageTitle="Agent Templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/portal/agents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Agent Templates</h1>
              <p className="text-muted-foreground">
                Choose from 50+ pre-built AI agents or create your own
              </p>
            </div>
          </div>
          <Link href="/portal/agents/new">
            <Button variant="outline">
              <Wand2 className="h-4 w-4 mr-2" />
              Create Custom Agent
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Popular Templates */}
        {selectedCategory === "all" && !searchQuery && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Popular Templates</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popularTemplates.slice(0, 6).map((template) => {
                const IconComponent = iconMap[template.icon] || Bot;
                const available = isTemplateAvailable(template);
                return (
                  <Card
                    key={template.id}
                    className={`group hover:border-primary/50 transition-colors ${!available ? "opacity-60" : ""}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {template.name}
                              {template.popular && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              )}
                            </CardTitle>
                            <Badge variant="outline" className={tierColors[template.tier]}>
                              {template.tier}
                            </Badge>
                          </div>
                        </div>
                        {!available && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {template.description}
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => handleUseTemplate(template)}
                        variant={available ? "default" : "outline"}
                      >
                        {available ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Use Template
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Upgrade to Use
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bot className="h-4 w-4 mr-1" />
              All ({agentTemplates.length})
            </TabsTrigger>
            {agentCategories.map((cat) => {
              const CategoryIcon = categoryIcons[cat.id] || Bot;
              const count = agentTemplates.filter((t) => t.category === cat.id).length;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <CategoryIcon className="h-4 w-4 mr-1" />
                  {cat.name} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {/* Category Description */}
            {selectedCategory !== "all" && (
              <div className="mb-6">
                {agentCategories
                  .filter((c) => c.id === selectedCategory)
                  .map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3">
                      {(() => {
                        const CategoryIcon = categoryIcons[cat.id] || Bot;
                        return (
                          <div className="p-3 rounded-lg bg-primary/10">
                            <CategoryIcon className="h-6 w-6 text-primary" />
                          </div>
                        );
                      })()}
                      <div>
                        <h2 className="text-xl font-semibold">{cat.name}</h2>
                        <p className="text-muted-foreground">{cat.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search or browse different categories
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => {
                  const IconComponent = iconMap[template.icon] || Bot;
                  const available = isTemplateAvailable(template);
                  return (
                    <Card
                      key={template.id}
                      className={`group hover:border-primary/50 transition-colors ${!available ? "opacity-60" : ""}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <IconComponent className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                {template.name}
                                {template.popular && (
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                )}
                                {template.new && (
                                  <Badge className="bg-green-500/10 text-green-500 text-xs">New</Badge>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={tierColors[template.tier]}>
                                  {template.tier}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {!available && <Lock className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {template.capabilities.slice(0, 3).map((cap) => (
                            <Badge key={cap} variant="secondary" className="text-xs">
                              {cap.replace("_", " ")}
                            </Badge>
                          ))}
                          {template.capabilities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.capabilities.length - 3}
                            </Badge>
                          )}
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => handleUseTemplate(template)}
                          variant={available ? "default" : "outline"}
                        >
                          {available ? (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Use Template
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Upgrade to Use
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PortalShell>
  );
}
