type ClerkTokenGetter = (options?: { template?: string }) => Promise<string | null>;

let hasWarnedTemplateFailure = false;
let isTemplateUnavailable = false;

export async function getAdminAuthToken(getToken: ClerkTokenGetter): Promise<string | null> {
  const configuredTemplate = import.meta.env.VITE_CLERK_JWT_TEMPLATE?.trim();
  if (configuredTemplate && !isTemplateUnavailable) {
    try {
      const templated = await getToken({ template: configuredTemplate });
      if (templated) return templated;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const missingTemplate = message.includes('No JWT template exists');
      if (missingTemplate) {
        // Stop retrying a missing template on every request.
        isTemplateUnavailable = true;
      }

      // Avoid noisy console spam if a template was configured locally but doesn't exist.
      if (!missingTemplate && !hasWarnedTemplateFailure) {
        hasWarnedTemplateFailure = true;
        console.warn(`Failed to get Clerk token with template "${configuredTemplate}". Falling back to default token.`, error);
      }
    }
  }

  // Fallback so auth can still work when template config is missing or invalid.
  try {
    return await getToken();
  } catch (error) {
    console.error('Failed to get fallback Clerk token', error);
    return null;
  }
}
