import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

export function FormattedText({ text, className = '' }: FormattedTextProps) {
  // Regex para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Função para processar o texto e aplicar formatação
  const formatText = (text: string) => {
    // Dividir o texto em linhas
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Primeiro, processar URLs
      const urlParts = line.split(urlRegex);
      
      const processedLine = urlParts.map((urlPart, urlIndex) => {
        // Se for uma URL (match do regex)
        if (urlRegex.test(urlPart)) {
          return (
            <a
              key={`${lineIndex}-url-${urlIndex}`}
              href={urlPart}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline break-all"
            >
              {urlPart}
            </a>
          );
        }
        
        // Processar texto normal para negrito
        const boldParts = urlPart.split(/(\*\*.*?\*\*)/g);
        
        return boldParts.map((boldPart, boldIndex) => {
          // Se contém ** é texto em negrito
          if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
            const boldText = boldPart.slice(2, -2);
            return (
              <strong key={`${lineIndex}-${urlIndex}-bold-${boldIndex}`} className="font-bold">
                {boldText}
              </strong>
            );
          }
          return boldPart;
        });
      });
      
      return (
        <React.Fragment key={lineIndex}>
          {processedLine}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={className}>
      {formatText(text)}
    </div>
  );
}

export default FormattedText;