import { useState, useEffect } from 'react';

export function TypingAnimation({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const fullText = text;

      if (!isDeleting && displayedText === fullText) {
        // Pause at end before deleting
        setTimeout(() => setIsDeleting(true), 2000);
        return;
      }

      if (isDeleting && displayedText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(150);
        return;
      }

      if (isDeleting) {
        setDisplayedText(fullText.substring(0, displayedText.length - 1));
        setTypingSpeed(50);
      } else {
        setDisplayedText(fullText.substring(0, displayedText.length + 1));
        setTypingSpeed(150);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, text, loopNum, typingSpeed]);

  return (
    <span className="inline-block">
      {displayedText}
      <span className="animate-pulse ml-1 text-primary">|</span>
    </span>
  );
}
