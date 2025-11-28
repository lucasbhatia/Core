import Airtable from "airtable";

// Initialize Airtable client lazily
function getAirtableBase(baseId: string) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    throw new Error("AIRTABLE_API_KEY not configured");
  }
  Airtable.configure({ apiKey });
  return Airtable.base(baseId);
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

export interface AirtableResult {
  success: boolean;
  records?: AirtableRecord[];
  record?: AirtableRecord;
  error?: string;
}

/**
 * Create a record in Airtable
 */
export async function createRecord(
  baseId: string,
  tableName: string,
  fields: Record<string, unknown>
): Promise<AirtableResult> {
  try {
    const base = getAirtableBase(baseId);
    // Airtable expects fields to be passed directly or as {fields: ...}
    const record = await base(tableName).create(fields as Airtable.FieldSet);

    return {
      success: true,
      record: {
        id: record.id,
        fields: record.fields as Record<string, unknown>,
        createdTime: record._rawJson.createdTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create record",
    };
  }
}

/**
 * Create multiple records in Airtable
 */
export async function createRecords(
  baseId: string,
  tableName: string,
  records: Array<{ fields: Record<string, unknown> }>
): Promise<AirtableResult> {
  try {
    const base = getAirtableBase(baseId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdRecords = await base(tableName).create(records as any);

    return {
      success: true,
      records: createdRecords.map((r: Airtable.Record<Airtable.FieldSet>) => ({
        id: r.id,
        fields: r.fields as Record<string, unknown>,
        createdTime: r._rawJson.createdTime,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create records",
    };
  }
}

/**
 * Find records in Airtable
 */
export async function findRecords(
  baseId: string,
  tableName: string,
  options?: {
    filterByFormula?: string;
    maxRecords?: number;
    sort?: Array<{ field: string; direction: "asc" | "desc" }>;
    view?: string;
  }
): Promise<AirtableResult> {
  try {
    const base = getAirtableBase(baseId);
    const records: AirtableRecord[] = [];

    await base(tableName)
      .select({
        filterByFormula: options?.filterByFormula,
        maxRecords: options?.maxRecords || 100,
        sort: options?.sort,
        view: options?.view,
      })
      .eachPage((pageRecords, fetchNextPage) => {
        pageRecords.forEach((record) => {
          records.push({
            id: record.id,
            fields: record.fields as Record<string, unknown>,
            createdTime: record._rawJson.createdTime,
          });
        });
        fetchNextPage();
      });

    return { success: true, records };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to find records",
    };
  }
}

/**
 * Update a record in Airtable
 */
export async function updateRecord(
  baseId: string,
  tableName: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<AirtableResult> {
  try {
    const base = getAirtableBase(baseId);
    const record = await base(tableName).update(recordId, fields as Airtable.FieldSet);

    return {
      success: true,
      record: {
        id: record.id,
        fields: record.fields as Record<string, unknown>,
        createdTime: record._rawJson.createdTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update record",
    };
  }
}

/**
 * Delete a record in Airtable
 */
export async function deleteRecord(
  baseId: string,
  tableName: string,
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = getAirtableBase(baseId);
    await base(tableName).destroy(recordId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete record",
    };
  }
}

/**
 * Add a lead to CRM (convenience function)
 */
export async function addLeadToCRM(
  baseId: string,
  tableName: string,
  lead: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    source?: string;
    notes?: string;
  }
): Promise<AirtableResult> {
  return createRecord(baseId, tableName, {
    Name: lead.name,
    Email: lead.email,
    Phone: lead.phone || "",
    Company: lead.company || "",
    Source: lead.source || "Automation",
    Notes: lead.notes || "",
    Status: "New Lead",
    "Created Date": new Date().toISOString().split("T")[0],
  });
}
