import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Zod schema matching PromptConfig interface
const PromptConfigEntrySchema = z.object({
  prompt: z.string(),
  mixins: z.array(z.string()).optional(),
  respondToSelf: z.boolean().optional(),
  triggerWords: z.array(z.string()).optional(),
  disableLengthConstraint: z.boolean().optional(),
  markAIMessages: z.string().optional(),
  responseProbability: z.number().min(1).max(100).optional(),
  memeProbability: z.number().min(1).max(100).optional(),
  names: z.record(z.string(), z.string()).optional(),
});

const ConfigSchema = z.object({
  promptConfig: z.record(z.string(), PromptConfigEntrySchema),
  keepConversationPrompts: z.array(z.string()),
});

export type PromptConfigEntry = z.infer<typeof PromptConfigEntrySchema>;
export type PromptConfig = z.infer<typeof ConfigSchema>;

export function loadAndValidateConfig(): PromptConfig {
  const configPath = path.resolve('./prompt-config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      'prompt-config.json file not found. Please create it based on the example.'
    );
  }

  try {
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const rawConfig = JSON.parse(fileContent);

    // Validate with Zod schema
    const validatedConfig = ConfigSchema.parse(rawConfig);

    console.log('Configuration loaded and validated successfully');
    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err: z.ZodIssue) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    } else if (error instanceof Error) {
      console.error('Error loading configuration:', error.message);
    } else {
      console.error('Unknown error loading configuration:', error);
    }
    throw new Error('Failed to load or validate configuration');
  }
}
