/**
 * StoreTaskItems Tool - Stores task items to CSV format
 * Handles both new items and updates to existing items
 */

import * as fs from "fs";
import * as path from "path";
import { TaskItem } from "../state";

const CSV_FILE_PATH = path.join("D://", "task_items.csv");
const CSV_HEADERS = "App_id,Task_Type,Task_SubType,Task,DueDate,Parent_JIRA,JIRA,Status,MoreDetails";

/**
 * Parse existing CSV file into TaskItem array
 */
function parseCSV(): TaskItem[] {
    if (!fs.existsSync(CSV_FILE_PATH)) {
        return [];
    }

    const content = fs.readFileSync(CSV_FILE_PATH, "utf-8");
    const lines = content.split("\n").filter(line => line.trim());

    if (lines.length <= 1) {
        return []; // Only headers or empty
    }

    const items: TaskItem[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 9) {
            items.push({
                App_id: values[0],
                Task_Type: values[1],
                Task_SubType: values[2],
                Task: values[3],
                DueDate: values[4],
                Parent_JIRA: values[5],
                JIRA: values[6],
                Status: values[7],
                MoreDetails: values[8],
            });
        }
    }
    return items;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

/**
 * Escape value for CSV (handle commas and quotes)
 */
function escapeCSV(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Convert TaskItem array to CSV string
 */
function toCSV(items: TaskItem[]): string {
    const lines = [CSV_HEADERS];
    for (const item of items) {
        const row = [
            escapeCSV(item.App_id),
            escapeCSV(item.Task_Type),
            escapeCSV(item.Task_SubType),
            escapeCSV(item.Task),
            escapeCSV(item.DueDate),
            escapeCSV(item.Parent_JIRA),
            escapeCSV(item.JIRA),
            escapeCSV(item.Status),
            escapeCSV(item.MoreDetails),
        ].join(",");
        lines.push(row);
    }
    return lines.join("\n");
}

/**
 * Store task items to CSV
 * - If task already exists (matched by App_id + Task), only update JIRA, Status, MoreDetails if they are missing
 * - Otherwise, add as new item
 */
export function storeTaskItems(newItems: TaskItem[]): { added: number; updated: number } {
    const existingItems = parseCSV();
    let added = 0;
    let updated = 0;

    for (const newItem of newItems) {
        // Find existing item by App_id + Task
        const existingIndex = existingItems.findIndex(
            (existing) => existing.App_id === newItem.App_id && existing.Task === newItem.Task
        );

        if (existingIndex >= 0) {
            // Update only missing fields: JIRA, Status, MoreDetails
            const existing = existingItems[existingIndex];
            let wasUpdated = false;

            if (!existing.JIRA && newItem.JIRA) {
                existing.JIRA = newItem.JIRA;
                wasUpdated = true;
            }
            if (!existing.Status && newItem.Status) {
                existing.Status = newItem.Status;
                wasUpdated = true;
            }
            if (!existing.MoreDetails && newItem.MoreDetails) {
                existing.MoreDetails = newItem.MoreDetails;
                wasUpdated = true;
            }

            if (wasUpdated) {
                updated++;
            }
        } else {
            // Add new item
            existingItems.push(newItem);
            added++;
        }
    }

    // Write back to CSV
    fs.writeFileSync(CSV_FILE_PATH, toCSV(existingItems), "utf-8");

    return { added, updated };
}

/**
 * Convert TaskItem array to CSV string (for display purposes)
 */
export function taskItemsToCSVString(items: TaskItem[]): string {
    return toCSV(items);
}
