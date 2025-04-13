import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';

const API_TIMEOUT = 10000; // 10 seconds timeout

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState('');
  const [choices, setChoices] = useState([]);
  const [previousChoices, setPreviousChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [storyHistory, setStoryHistory] = useState([]);

  const fetchWithTimeout = async (url, options) => {
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
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  };

  async function startStory() {
    if (!prompt.trim()) {
      setError('Please enter a story prompt!');
      return;
    }

    setError('');
    setIsLoading(true);
    setPreviousChoices([]);
    setStoryHistory([]);
    await fetchStory(prompt);
  }

  async function fetchStory(prompt) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError('API key is not configured');
      setIsLoading(false);
      return;
    }
    
    const storyPrompt = previousChoices.length > 0
      ? `Continue the story based on the following choices: ${previousChoices.join(', ')}. ${prompt} 
         Keep it brief (max 3-4 sentences) and exciting. 
         At the end, provide 3 distinct action-oriented choices for the reader to continue the story, formatted as: [Choice 1], [Choice 2], [Choice 3].`
      : `Start a new short story (max 3-4 sentences): ${prompt}. 
         Make it exciting and engaging. 
         At the end, provide 3 distinct action-oriented choices for the reader to continue the story, formatted as: [Choice 1], [Choice 2], [Choice 3].`;

    try {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: storyPrompt }] }],
          }),
        }
      );

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response format');
      }
      
      const storyText = data.candidates[0].content.parts[0].text;

      // Extract choices from story text
      const choiceRegex = /\[(.*?)\]/g;
      const extractedChoices = [...storyText.matchAll(choiceRegex)].map(match => match[1]);
      
      if (extractedChoices.length === 0) {
        throw new Error('No choices found in the story response');
      }
      
      const storyContent = storyText.replace(choiceRegex, '').trim();

      setStory(storyContent);
      setChoices(extractedChoices);
      setError('');
      
      // Add to story history
      if (previousChoices.length > 0) {
        setStoryHistory(prev => [...prev, { text: storyContent, choice: previousChoices[previousChoices.length - 1] }]);
      } else {
        setStoryHistory([{ text: storyContent, choice: null }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to fetch story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleChoiceClick(choice) {
    setPreviousChoices(prev => [...prev, choice]);
    setIsLoading(true);
    fetchStory(`Continue the story based on the choice: ${choice}`);
  }

  // Icons for the choice buttons
  const choiceIcons = {
    fight: '⚔️',
    run: '🏃',
    hide: '🙈',
    talk: '💬',
    explore: '🔍',
    attack: '🗡️',
    defend: '🛡️',
    magic: '✨',
    stealth: '👤',
    help: '🤝',
    default: '➡️'
  };

  function getIconForChoice(choice) {
    const lowerChoice = choice.toLowerCase();
    for (const [key, icon] of Object.entries(choiceIcons)) {
      if (lowerChoice.includes(key)) {
        return icon;
      }
    }
    return choiceIcons.default;
  }

  return (
    <>
      <Head>
        <title>DJX Storyteller</title>
        <meta name="description" content="Interactive AI storytelling experience by Don Juwon Xavier" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <header className="bg-djx-darker py-6 px-4 text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-djx-yellow"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            DJX Storyteller
          </motion.h1>
          <motion.p 
            className="text-djx-light-gray mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            by Don Juwon Xavier
          </motion.p>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
          <motion.div 
            className="bg-djx-gray rounded-xl shadow-2xl p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {storyHistory.length === 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-djx-yellow">Begin Your Adventure</h2>
                <div className="relative">
                  <textarea 
                    className="w-full h-32 bg-black/50 text-white border-2 border-djx-yellow/50 focus:border-djx-yellow rounded-lg p-4 outline-none transition-all duration-300"
                    placeholder="Enter a story prompt (e.g., 'A brave knight in a magical forest')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3 text-djx-light-gray text-sm">
                    {prompt.length} characters
                  </div>
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <motion.button 
                  className="story-button w-full"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startStory}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Your Story...
                    </span>
                  ) : "Begin Your Adventure"}
                </motion.button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-djx-yellow">Your Adventure</h2>
                  <motion.button 
                    className="text-djx-yellow hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setStoryHistory([]);
                      setChoices([]);
                      setStory('');
                      setPreviousChoices([]);
                      setError('');
                    }}
                  >
                    Start Over
                  </motion.button>
                </div>
                
                <div className="space-y-6">
                  {/* Story history */}
                  <AnimatePresence>
                    {storyHistory.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-black/30 p-4 rounded-lg"
                      >
                        {item.choice && (
                          <div className="text-djx-yellow font-semibold mb-2 flex items-center">
                            <span className="mr-2">➡️</span>
                            You chose: {item.choice}
                          </div>
                        )}
                        <p className="text-white leading-relaxed">{item.text}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Current story segment */}
                  {story && storyHistory.length > 0 && storyHistory[storyHistory.length - 1].text !== story && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/30 p-4 rounded-lg"
                    >
                      <p className="text-white leading-relaxed">{story}</p>
                    </motion.div>
                  )}
                  
                  {/* Choices */}
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-pulse flex space-x-4">
                        <div className="h-12 w-12 rounded-full bg-djx-yellow/30"></div>
                        <div className="flex-1 space-y-4 py-1">
                          <div className="h-4 bg-djx-yellow/30 rounded w-3/4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-djx-yellow/30 rounded"></div>
                            <div className="h-4 bg-djx-yellow/30 rounded w-5/6"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {choices.map((choice, index) => (
                        <motion.button
                          key={index}
                          className="choice-button"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                          whileHover={{ 
                            scale: 1.02, 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            borderColor: '#FFCF00' 
                          }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleChoiceClick(choice)}
                        >
                          <span>{choice}</span>
                          <span className="text-xl">{getIconForChoice(choice)}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </main>

        <footer className="bg-djx-darker py-4 text-center text-djx-light-gray">
          <p>© 2025 DJX. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}