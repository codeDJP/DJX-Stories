export const checkOnlineStatus = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;
  
  try {
    const response = await fetch('/api/health-check');
    return response.ok;
  } catch {
    return false;
  }
};

export const getCachedStories = async (): Promise<Array<{prompt: string, response: string}>> => {
  if ('caches' in window) {
    try {
      const cache = await caches.open('djx-stories-v1');
      const requests = await cache.keys();
      const apiRequests = requests.filter(request => 
        request.url.includes('generativelanguage.googleapis.com')
      );
      
      const stories = await Promise.all(
        apiRequests.map(async (request) => {
          const response = await cache.match(request);
          const data = await response?.json();
          return {
            prompt: JSON.parse(request.url.split('contents=')[1])[0].parts[0].text,
            response: data.candidates[0].content.parts[0].text
          };
        })
      );
      
      return stories;
    } catch (error) {
      console.error('Error retrieving cached stories:', error);
      return [];
    }
  }
  return [];
};