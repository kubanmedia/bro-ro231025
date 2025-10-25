import { createRorkTool, useRorkAgent } from '@rork/toolkit-sdk';
import { z } from 'zod';

export const browserTools = {
  searchWeb: createRorkTool({
    description: 'Search the web for information using a search engine',
    zodSchema: z.object({
      query: z.string().describe('The search query'),
      numResults: z.number().optional().describe('Number of results to return (default 5)'),
    }),
  }),
  
  navigateToUrl: createRorkTool({
    description: 'Navigate to a specific URL',
    zodSchema: z.object({
      url: z.string().url().describe('The URL to navigate to'),
    }),
  }),
  
  fillForm: createRorkTool({
    description: 'Fill out a form on a webpage',
    zodSchema: z.object({
      formData: z.record(z.string(), z.string()).describe('Key-value pairs of form fields and their values'),
      submitForm: z.boolean().optional().describe('Whether to submit the form after filling'),
    }),
  }),
  
  clickElement: createRorkTool({
    description: 'Click on an element on the page',
    zodSchema: z.object({
      selector: z.string().describe('CSS selector or description of the element to click'),
    }),
  }),
  
  extractData: createRorkTool({
    description: 'Extract specific data from the current page',
    zodSchema: z.object({
      dataType: z.string().describe('Type of data to extract (e.g., "prices", "titles", "links")'),
      selector: z.string().optional().describe('Optional CSS selector to narrow down extraction'),
    }),
  }),
  
  takeScreenshot: createRorkTool({
    description: 'Take a screenshot of the current page or element',
    zodSchema: z.object({
      fullPage: z.boolean().optional().describe('Whether to capture the full page'),
      selector: z.string().optional().describe('Optional selector for specific element'),
    }),
  }),
  
  scrollPage: createRorkTool({
    description: 'Scroll the page',
    zodSchema: z.object({
      direction: z.enum(['up', 'down', 'top', 'bottom']).describe('Scroll direction'),
      amount: z.number().optional().describe('Amount to scroll in pixels'),
    }),
  }),
  
  waitForElement: createRorkTool({
    description: 'Wait for an element to appear on the page',
    zodSchema: z.object({
      selector: z.string().describe('CSS selector of the element to wait for'),
      timeout: z.number().optional().describe('Timeout in milliseconds (default 5000)'),
    }),
  }),
};

export type BrowserAgentMessage = {
  id: string;
  role: 'user' | 'assistant';
  parts: {
    type: 'text' | 'tool';
    text?: string;
    toolName?: string;
    state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
    input?: unknown;
    output?: unknown;
    errorText?: string;
  }[];
};

export function useBrowserAgent() {
  return useRorkAgent({
    tools: browserTools,
  });
}
