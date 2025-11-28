"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  Shield,
  Mail,
  Key,
  Globe,
  Moon,
  Laptop,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Client } from "@/types/database";

interface SettingsPageProps {
  client: Client;
}

export default function SettingsPage({ client }: SettingsPageProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState(client.name || "");
  const [email, setEmail] = useState(client.email || "");
  const [company, setCompany] = useState(client.company || "");
  const [phone, setPhone] = useState(client.phone || "");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [automationAlerts, setAutomationAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  async function handleSaveProfile() {
    setIsSaving(true);
    // Simulate save - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Settings saved",
      description: "Your profile has been updated successfully.",
    });
    setIsSaving(false);
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-violet-600" />
            Profile Settings
          </CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important events
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automation Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when automations fail or complete
              </p>
            </div>
            <Switch
              checked={automationAlerts}
              onCheckedChange={setAutomationAlerts}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly summary of your automation activity
              </p>
            </div>
            <Switch
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new features and tips
              </p>
            </div>
            <Switch
              checked={marketingEmails}
              onCheckedChange={setMarketingEmails}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-600" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Magic Link Authentication</p>
                <p className="text-sm text-green-700">
                  Your account uses secure magic links for login
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">
                  Manage devices that are logged into your account
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Sessions
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">API Keys</p>
                <p className="text-sm text-muted-foreground">
                  Manage API keys for programmatic access
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4 mr-2" />
                Manage Keys
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-red-800">Delete Account</p>
              <p className="text-sm text-red-700">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
