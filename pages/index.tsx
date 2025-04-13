import React, { useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { KeyboardHelp } from '../components/KeyboardHelp';
import { OfflineNotification } from '../components/OfflineNotification';
import { useStory } from '../hooks/useStory';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Choice icons mapping
const choiceIcons: Record<string, string> = {
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

const getIconForChoice = (choice: string): string => {
  const lowerChoice = choice.toLowerCase();
  for (const [key, icon] of Object.entries(choiceIcons)) {
    if (lowerChoice.includes(key)) {
      return icon;
    }
  }
  return choiceIcons.default;
};

export default function Home() {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const {
    prompt,
    setPrompt,
    story,
    choices,
    isLoading,
    error,
    storyHistory,
    isOffline,
    startNewStory,
    handleChoiceClick,
    resetStory
  } = useStory();

  useKeyboardShortcuts({
    onEnter: () => {
      if (storyHistory.length === 0 && prompt.trim()) {
        startNewStory();
      }
    },
    onEscape: () => {
      if (showKeyboardHelp) {
        setShowKeyboardHelp(false);
      } else if (storyHistory.length > 0) {
        resetStory();
      }
    },
    onNumber: (num) => {
      if (!isLoading && choices[num - 1]) {
        handleChoiceClick(choices[num - 1]);
      }
    }
  });

  // Add event listener for '?' key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.shiftKey) {
        event.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Head>
        <title>DJX Storyteller</title>
        <meta name="description" content="Interactive AI storytelling experience by Don Juwon Xavier" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <OfflineNotification isOffline={isOffline} />

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
                <Button
                  isFullWidth
                  isLoading={isLoading}
                  onClick={startNewStory}
                >
                  Begin Your Adventure
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-djx-yellow">Your Adventure</h2>
                  <Button
                    variant="secondary"
                    onClick={resetStory}
                  >
                    Start Over
                  </Button>
                </div>
                
                <div className="space-y-6">
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
                  
                  {story && storyHistory.length > 0 && storyHistory[storyHistory.length - 1].text !== story && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/30 p-4 rounded-lg"
                    >
                      <p className="text-white leading-relaxed">{story}</p>
                    </motion.div>
                  )}
                  
                  {isLoading ? (
                    <div className="py-8">
                      <Spinner size="large" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {choices.map((choice, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          isFullWidth
                          onClick={() => handleChoiceClick(choice)}
                          icon={getIconForChoice(choice)}
                        >
                          {choice}
                        </Button>
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

      <KeyboardHelp 
        isOpen={showKeyboardHelp} 
        onClose={() => setShowKeyboardHelp(false)} 
      />

      <button
        onClick={() => setShowKeyboardHelp(true)}
        className="fixed bottom-4 right-4 w-10 h-10 bg-djx-yellow text-black rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-djx-yellow focus:ring-offset-2 focus:ring-offset-djx-dark"
        aria-label="Show keyboard shortcuts"
      >
        ?
      </button>
    </>
  );
}