import { useState, useEffect, useRef } from 'react';
import { APIError, handleAPIError, rateLimiter } from '../utils/api';
import { checkOnlineStatus } from '../utils/network';

interface StorySegment {
  text: string;
  choice: string | null;
}

interface APIResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface StoredState {
  prompt: string;
  story: string;
  choices: string[];
  previousChoices: string[];
  storyHistory: StorySegment[];
}

const API_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const STORAGE_KEY = 'djx-story-state';

export const useStory = () => {
  // Initialize state from localStorage if available
  const getInitialState = (): StoredState => {
    if (typeof window === 'undefined') return {
      prompt: '',
      story: '',
      choices: [],
      previousChoices: [],
      storyHistory: []
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored state:', error);
      }
    }

    return {
      prompt: '',
      story: '',
      choices: [],
      previousChoices: [],
      storyHistory: []
    };
  };

  const [prompt, setPrompt] = useState<string>(getInitialState().prompt);
  const [story, setStory] = useState<string>(getInitialState().story);
  const [choices, setChoices] = useState<string[]>(getInitialState().choices);
  const [previousChoices, setPreviousChoices] = useState<string[]>(getInitialState().previousChoices);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [storyHistory, setStoryHistory] = useState<StorySegment[]>(getInitialState().storyHistory);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Cache for story responses
  const storyCache = new Map<string, { text: string; choices: string[] }>();
  const rateLimit = useRef(rateLimiter());

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state: StoredState = {
        prompt,
        story,
        choices,
        previousChoices,
        storyHistory
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [prompt, story, choices, previousChoices, storyHistory]);

  // Check online status and update accordingly
  useEffect(() => {
    const checkConnection = async () => {
      const online = await checkOnlineStatus();
      setIsOffline(!online);
    };

    checkConnection();
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithTimeout = async (url: string, options: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  };

  const fetchWithRetry = async (url: string, options: RequestInit): Promise<Response> => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fetchWithTimeout(url, options);
      } catch (error) {
        if (attempt === MAX_RETRIES) throw error;
        await delay(RETRY_DELAY * attempt);
      }
    }
    throw new Error('Max retries exceeded');
  };

  const updateStoryHistory = (storyContent: string) => {
    if (previousChoices.length > 0) {
      setStoryHistory(prev => [...prev, { 
        text: storyContent, 
        choice: previousChoices[previousChoices.length - 1] 
      }]);
    } else {
      setStoryHistory([{ text: storyContent, choice: null }]);
    }
  };

  const fetchStory = async (storyPrompt: string) => {
    if (isOffline) {
      setError('You are currently offline. Please check your internet connection.');
      setIsLoading(false);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError('API key is not configured');
      setIsLoading(false);
      return;
    }

    try {
      rateLimit.current.checkRateLimit();

      // Check cache first
      const cacheKey = JSON.stringify({ storyPrompt, previousChoices });
      const cached = storyCache.get(cacheKey);
      if (cached) {
        setStory(cached.text);
        setChoices(cached.choices);
        updateStoryHistory(cached.text);
        setIsLoading(false);
        return;
      }
      
      const formattedPrompt = previousChoices.length > 0
        ? `Continue the story based on the following choices: ${previousChoices.join(', ')}. ${storyPrompt} 
           Keep it brief (max 3-4 sentences) and exciting. 
           At the end, provide 3 distinct action-oriented choices for the reader to continue the story, formatted as: [Choice 1], [Choice 2], [Choice 3].`
        : `Start a new short story (max 3-4 sentences): ${storyPrompt}. 
           Make it exciting and engaging. 
           At the end, provide 3 distinct action-oriented choices for the reader to continue the story, formatted as: [Choice 1], [Choice 2], [Choice 3].`;

      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: formattedPrompt }] }],
          }),
        }
      );

      const data: APIResponse = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response format');
      }
      
      const storyText = data.candidates[0].content.parts[0].text;
      const choiceRegex = /\[(.*?)\]/g;
      const extractedChoices = [...storyText.matchAll(choiceRegex)].map(match => match[1]);
      
      if (extractedChoices.length === 0) {
        throw new Error('No choices found in the story response');
      }
      
      const storyContent = storyText.replace(choiceRegex, '').trim();

      // Cache the result
      storyCache.set(cacheKey, {
        text: storyContent,
        choices: extractedChoices
      });

      setStory(storyContent);
      setChoices(extractedChoices);
      setError('');
      updateStoryHistory(storyContent);
    } catch (error) {
      console.error('Error:', error);
      const apiError = handleAPIError(error);
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewStory = async () => {
    if (!prompt.trim()) {
      setError('Please enter a story prompt!');
      return;
    }

    setError('');
    setIsLoading(true);
    setPreviousChoices([]);
    setStoryHistory([]);
    await fetchStory(prompt);
  };

  const handleChoiceClick = (choice: string) => {
    setPreviousChoices(prev => [...prev, choice]);
    setIsLoading(true);
    fetchStory(`Continue the story based on the choice: ${choice}`);
  };

  const clearStoredState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const resetStory = () => {
    setStoryHistory([]);
    setChoices([]);
    setStory('');
    setPreviousChoices([]);
    setError('');
    setPrompt('');
    clearStoredState();
  };

  return {
    prompt,
    setPrompt,
    story,
    choices,
    previousChoices,
    isLoading,
    error,
    storyHistory,
    isOffline,
    startNewStory,
    handleChoiceClick,
    resetStory
  };
};