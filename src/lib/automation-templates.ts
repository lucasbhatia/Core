// Automation Templates - Pre-built automation types that can be configured and run

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: "data" | "communication" | "integration" | "ai";
  icon: string;
  // Configuration schema
  configFields: ConfigField[];
  // What the automation does
  handler: string; // Reference to handler function
}

export interface ConfigField {
  name: string;
  label: string;
  type: "text" | "email" | "url" | "select" | "number" | "boolean" | "json";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

export const automationTemplates: AutomationTemplate[] = [
  {
    id: "email-to-crm",
    name: "Email to CRM",
    description: "Parse incoming emails and add contacts/leads to your CRM",
    category: "integration",
    icon: "mail",
    configFields: [
      {
        name: "emailSource",
        label: "Email Source",
        type: "select",
        required: true,
        options: [
          { value: "gmail", label: "Gmail" },
          { value: "outlook", label: "Outlook" },
          { value: "imap", label: "Custom IMAP" },
        ],
      },
      {
        name: "crmDestination",
        label: "CRM Destination",
        type: "select",
        required: true,
        options: [
          { value: "hubspot", label: "HubSpot" },
          { value: "salesforce", label: "Salesforce" },
          { value: "pipedrive", label: "Pipedrive" },
          { value: "internal", label: "Internal Database" },
        ],
      },
      {
        name: "parseFields",
        label: "Fields to Extract",
        type: "json",
        placeholder: '["name", "email", "company", "phone"]',
        description: "JSON array of fields to extract from emails",
      },
    ],
    handler: "emailToCrm",
  },
  {
    id: "scheduled-report",
    name: "Scheduled Report",
    description: "Generate and send reports on a schedule",
    category: "data",
    icon: "file-text",
    configFields: [
      {
        name: "reportType",
        label: "Report Type",
        type: "select",
        required: true,
        options: [
          { value: "daily-summary", label: "Daily Summary" },
          { value: "weekly-metrics", label: "Weekly Metrics" },
          { value: "monthly-overview", label: "Monthly Overview" },
        ],
      },
      {
        name: "recipients",
        label: "Email Recipients",
        type: "text",
        required: true,
        placeholder: "email1@example.com, email2@example.com",
      },
      {
        name: "schedule",
        label: "Schedule",
        type: "select",
        required: true,
        options: [
          { value: "daily-9am", label: "Daily at 9 AM" },
          { value: "weekly-monday", label: "Weekly on Monday" },
          { value: "monthly-1st", label: "Monthly on 1st" },
        ],
      },
    ],
    handler: "scheduledReport",
  },
  {
    id: "data-sync",
    name: "Data Sync",
    description: "Sync data between two systems automatically",
    category: "integration",
    icon: "refresh-cw",
    configFields: [
      {
        name: "sourceSystem",
        label: "Source System",
        type: "select",
        required: true,
        options: [
          { value: "spreadsheet", label: "Google Sheets" },
          { value: "airtable", label: "Airtable" },
          { value: "notion", label: "Notion" },
          { value: "api", label: "Custom API" },
        ],
      },
      {
        name: "destinationSystem",
        label: "Destination System",
        type: "select",
        required: true,
        options: [
          { value: "database", label: "Internal Database" },
          { value: "spreadsheet", label: "Google Sheets" },
          { value: "api", label: "Custom API" },
        ],
      },
      {
        name: "syncInterval",
        label: "Sync Interval",
        type: "select",
        required: true,
        options: [
          { value: "realtime", label: "Real-time (webhook)" },
          { value: "hourly", label: "Every Hour" },
          { value: "daily", label: "Daily" },
        ],
      },
    ],
    handler: "dataSync",
  },
  {
    id: "ai-processor",
    name: "AI Data Processor",
    description: "Process data using AI (categorize, summarize, extract)",
    category: "ai",
    icon: "sparkles",
    configFields: [
      {
        name: "processingType",
        label: "Processing Type",
        type: "select",
        required: true,
        options: [
          { value: "categorize", label: "Categorize Items" },
          { value: "summarize", label: "Summarize Text" },
          { value: "extract", label: "Extract Information" },
          { value: "sentiment", label: "Sentiment Analysis" },
        ],
      },
      {
        name: "inputSource",
        label: "Input Source",
        type: "select",
        required: true,
        options: [
          { value: "form-submissions", label: "Form Submissions" },
          { value: "emails", label: "Emails" },
          { value: "api", label: "API Endpoint" },
        ],
      },
      {
        name: "customPrompt",
        label: "Custom AI Instructions",
        type: "text",
        placeholder: "Optional: Add specific instructions for the AI",
      },
    ],
    handler: "aiProcessor",
  },
  {
    id: "webhook-relay",
    name: "Webhook Relay",
    description: "Receive webhooks and forward/transform data",
    category: "integration",
    icon: "webhook",
    configFields: [
      {
        name: "destinationUrl",
        label: "Destination URL",
        type: "url",
        required: true,
        placeholder: "https://api.example.com/webhook",
      },
      {
        name: "transformData",
        label: "Transform Data",
        type: "boolean",
        description: "Apply transformation before forwarding",
      },
      {
        name: "transformation",
        label: "Transformation (JSON)",
        type: "json",
        placeholder: '{"newField": "{{originalField}}"}',
      },
    ],
    handler: "webhookRelay",
  },
  {
    id: "notification-sender",
    name: "Notification Sender",
    description: "Send notifications via email, SMS, or Slack",
    category: "communication",
    icon: "bell",
    configFields: [
      {
        name: "channel",
        label: "Notification Channel",
        type: "select",
        required: true,
        options: [
          { value: "email", label: "Email" },
          { value: "sms", label: "SMS" },
          { value: "slack", label: "Slack" },
        ],
      },
      {
        name: "trigger",
        label: "Trigger Condition",
        type: "select",
        required: true,
        options: [
          { value: "new-submission", label: "New Form Submission" },
          { value: "status-change", label: "Status Change" },
          { value: "scheduled", label: "Scheduled Time" },
        ],
      },
      {
        name: "messageTemplate",
        label: "Message Template",
        type: "text",
        required: true,
        placeholder: "New {{type}} received from {{name}}",
      },
    ],
    handler: "notificationSender",
  },
];

export function getTemplateById(id: string): AutomationTemplate | undefined {
  return automationTemplates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): AutomationTemplate[] {
  return automationTemplates.filter((t) => t.category === category);
}
