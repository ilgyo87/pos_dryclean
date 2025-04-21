import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { styles } from './styles';

interface HighlightTextProps {
  text: string;
  highlight: string;
  style?: TextStyle;
  highlightStyle?: TextStyle;
}

/**
 * Component to highlight matching text in search results
 */
const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  highlight,
  style,
  highlightStyle,
}) => {
  if (!highlight.trim()) {
    return <Text style={style}>{text}</Text>;
  }

  // Function to escape special regex characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const highlightPattern = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
  const parts = text.split(highlightPattern);

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        const isHighlighted = part.toLowerCase() === highlight.toLowerCase();
        return (
          <Text
            key={i}
            style={isHighlighted ? [styles.highlightMatch, highlightStyle] : undefined}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
};

export default HighlightText;