import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import generator from 'generate-password';

export function generateUsername() {
  // Generate a username using unique-names-generator
  // Format: adjective-color-animal with numbers
  const config = {
    dictionaries: [adjectives, colors, animals],
    separator: '',
    length: 3,
    style: 'lowerCase'
  };
  
  const baseName = uniqueNamesGenerator(config);
  // Add a random number to make it more unique
  const randomNum = Math.floor(Math.random() * 1000);
  const username = `${baseName}${randomNum}`;
  
  // Ensure it's within the 20 character limit and valid format
  return username.substring(0, 20).replace(/[^a-zA-Z0-9_]/g, '');
}

export function generatePassword() {
  // Generate a strong password with:
  // - length: 16 characters
  // - numbers: true
  // - symbols: true
  // - uppercase: true
  // - lowercase: true
  // - excludeSimilarCharacters: true (avoid i, l, 1, L, o, 0, O)
  return generator.generate({
    length: 16,
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
    excludeSimilarCharacters: true,
    strict: true
  });
}

