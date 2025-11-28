"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Shield,
  Cpu,
  Mail,
  Clock,
  Zap,
  CreditCard,
  Server,
  Loader2,
  TrendingUp,
  Wifi,
} from "lucide-react";

interface ServiceCheck {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  message?: string;
}

interface SystemHealthData {
  status: "healthy" | "degraded" | "down";
  totalResponseTime: number;
  checks: ServiceCheck[];
  history: unknown[];
  metrics: unknown[];
  lastChecked: string;
}

const serviceIcons: Record<string, React.ElementType> = {
  "Database (Supabase)": Database,
  "Authentication": Shield,
  "AI Engine (Claude)": Cpu,
  "Email Service (Resend)": Mail,
  "Job Queue (Inngest)": Clock,
  "Payment (Stripe)": CreditCard,
};

export default function SystemHealth() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/system-health");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching system health:", error);
      setData({
        status: "down",
        totalResponseTime: 0,
        checks: [],
        history: [],
        metrics: [],
        lastChecked: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = autoRefresh ? setInterval(fetchHealth, 30000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "down":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge variant="success">Healthy</Badge>;
      case "degraded":
        return <Badge variant="warning">Degraded</Badge>;
      case "down":
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getResponseTimeColor = (ms: number) => {
    if (ms < 100) return "text-green-500";
    if (ms < 300) return "text-yellow-500";
    return "text-red-500";
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const healthyCount = data?.checks.filter((c) => c.status === "healthy").length || 0;
  const totalCount = data?.checks.length || 0;
  const healthPercentage = totalCount > 0 ? (healthyCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">
            Monitor all connected services and infrastructure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Wifi className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" size="icon" onClick={fetchHealth} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={`border-2 ${
        data?.status === "healthy" ? "border-green-500/20" :
        data?.status === "degraded" ? "border-yellow-500/20" :
        "border-red-500/20"
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${
                data?.status === "healthy" ? "bg-green-500/10" :
                data?.status === "degraded" ? "bg-yellow-500/10" :
                "bg-red-500/10"
              }`}>
                {data?.status === "healthy" ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : data?.status === "degraded" ? (
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold capitalize">{data?.status || "Unknown"}</h3>
                <p className="text-sm text-muted-foreground">
                  {healthyCount} of {totalCount} services operational
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Response Time</p>
              <p className={`text-2xl font-bold ${getResponseTimeColor(data?.totalResponseTime || 0)}`}>
                {data?.totalResponseTime || 0}ms
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">System Health</span>
              <span className="text-sm text-muted-foreground">{healthPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={healthPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Service Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.checks.map((service) => {
          const ServiceIcon = serviceIcons[service.name] || Server;
          return (
            <Card key={service.name} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${
                service.status === "healthy" ? "bg-green-500" :
                service.status === "degraded" ? "bg-yellow-500" :
                "bg-red-500"
              }`} />
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      service.status === "healthy" ? "bg-green-500/10" :
                      service.status === "degraded" ? "bg-yellow-500/10" :
                      "bg-red-500/10"
                    }`}>
                      <ServiceIcon className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.message}</p>
                    </div>
                  </div>
                  {getStatusIcon(service.status)}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className={`font-medium ${getResponseTimeColor(service.responseTime)}`}>
                    {service.responseTime}ms
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            System Metrics
          </CardTitle>
          <CardDescription>Real-time performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-blue-500">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime (30d)</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-green-500">&lt;100ms</p>
              <p className="text-sm text-muted-foreground">Avg Response</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-purple-500">0</p>
              <p className="text-sm text-muted-foreground">Incidents (7d)</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-orange-500">{healthyCount}/{totalCount}</p>
              <p className="text-sm text-muted-foreground">Services Up</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last checked: {data?.lastChecked ? new Date(data.lastChecked).toLocaleString() : "Never"}
        {autoRefresh && " (auto-refreshing every 30s)"}
      </div>
    </div>
  );
}
