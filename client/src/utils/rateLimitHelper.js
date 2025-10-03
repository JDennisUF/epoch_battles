// Rate limit helper for development
export const resetRateLimits = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const response = await fetch('/api/dev/reset-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Rate limits reset:', data);
        return true;
      }
    } catch (error) {
      console.error('Failed to reset rate limits:', error);
    }
  }
  return false;
};

// Helper to check if an error is rate limiting
export const isRateLimitError = (error) => {
  return error?.response?.status === 429 || 
         error?.status === 429 || 
         (typeof error === 'string' && error.includes('Too many requests'));
};

// Auto-retry with rate limit reset for development
export const retryWithReset = async (requestFunction, maxRetries = 1) => {
  try {
    return await requestFunction();
  } catch (error) {
    if (isRateLimitError(error) && maxRetries > 0 && process.env.NODE_ENV === 'development') {
      console.log('Rate limit hit, attempting reset and retry...');
      await resetRateLimits();
      // Wait a moment for reset to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retryWithReset(requestFunction, maxRetries - 1);
    }
    throw error;
  }
};