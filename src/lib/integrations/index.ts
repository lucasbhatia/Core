// Email integrations (Resend)
export {
  sendEmail,
  sendClientNotification,
  sendAutomationStatusEmail,
  type SendEmailParams,
  type EmailResult,
} from "./email";

// CRM/Database integrations (Airtable)
export {
  createRecord,
  createRecords,
  findRecords,
  updateRecord,
  deleteRecord,
  addLeadToCRM,
  type AirtableRecord,
  type AirtableResult,
} from "./airtable";

// AI integrations (Claude)
export {
  processWithAI,
  extractStructuredData,
  extractContactInfo,
  summarizeText,
  classifyText,
  generateResponse,
  analyzeSentiment,
  type AIResult,
} from "./ai";

// Webhook integrations
export {
  sendWebhook,
  sendToZapier,
  sendToMake,
  sendSlackNotification,
  sendDiscordNotification,
  callAPI,
  type WebhookResult,
  type WebhookOptions,
} from "./webhook";
