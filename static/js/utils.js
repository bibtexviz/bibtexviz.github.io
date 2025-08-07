/**
 * Processes a text string to return it as is if it is short,
 * or to find/create an acronym if it is long. The created acronym
 * will not exceed the character limit N.
 *
 * @param {string} text The text string to be processed.
 * @param {number} N The maximum number of characters.
 * @returns {string} The original string or an acronym (possibly truncated).
 */
function getAcronymOrTruncate(text, N) {
    // 1. Handle invalid or empty input cases.
    if (typeof text !== 'string' || !text) {
        return '';
    }

    // 2. Return the string as is if its length is less than or equal to N.
    if (text.length <= N) {
        return text;
    }

    // 3. Search for an acronym using a regular expression.
    const acronymRegex = /[({]([a-zA-Z\-]+)[})]/g;
    let match;
    let lastMatch = null;

    // Iterate over all matches to find the last one.
    while ((match = acronymRegex.exec(text)) !== null) {
        lastMatch = match[1];
    }

    // If an acronym was found, return it.
    if (lastMatch) {
        return lastMatch;
    }

    // 4. If no acronym was found, build one with the initials.
    // Clean the string of special characters to get the words.
    const cleanedText = text.replace(/[^a-zA-Z\s]/g, '');

    let initialsAcronym = cleanedText
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();

    // Validate that the built acronym does not exceed the limit N
    if (initialsAcronym.length > N) {
        // ** Modified logic to truncate the acronym and keep the last N characters **
        return initialsAcronym.slice(-N);
    }

    return initialsAcronym;
}

/**
 * Formats a DOI string to ensure it is a complete URL.
 * If the string is already a URL, it returns it unchanged.
 * Otherwise, it prepends "https://doi.org/".
 *
 * @param {string} doiString The string which can be a DOI or a complete URL.
 * @returns {string} The complete URL for the DOI.
 */
function formatDoiUrl(doiString) {
    // Handle invalid or empty input cases
    if (typeof doiString !== 'string' || !doiString) {
        return '';
    }
    
    // Check if the string already starts with a URL prefix
    // Both HTTPS and HTTP are checked just in case
    if (doiString.startsWith('https://') || doiString.startsWith('http://')) {
        return doiString;
    }
    
    // If it's not a complete URL, add the standard DOI prefix
    return `https://doi.org/${doiString}`;
}


/**
 * Calculates the Levenshtein distance between two strings.
 * It's a measure of the similarity of the two strings.
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @returns {number} The Levenshtein distance.
 */
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a.charAt(j - 1) === b.charAt(i - 1) ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // Deletion
                matrix[i][j - 1] + 1,      // Insertion
                matrix[i - 1][j - 1] + cost  // Substitution
            );
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Cleans and normalizes an author's name for robust comparison.
 * Converts to lowercase, removes accents, periods, hyphens, and LaTeX characters.
 * @param {string} name The name to clean.
 * @returns {string} The normalized name.
 */
function normalizeName(name) {
    if (!name) return '';
    let cleaned = name.trim();
    
    // Removes common LaTeX characters like {\'{e}} or {-}
    cleaned = cleaned.replace(/\{\\['"`~]\s*\{?(\w)\}\s*\}/g, '$1');
    cleaned = cleaned.replace(/\{\\['"`~](\w)\}/g, '$1');
    cleaned = cleaned.replace(/\{-}/g, '');
    cleaned = cleaned.replace(/\{(\w)\}/g, '$1');
    
    // Normalizes accents and special characters (José -> Jose)
    cleaned = cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Converts to lowercase and removes periods, commas, and hyphens
    cleaned = cleaned.toLowerCase().replace(/[\.-]/g, '');

    // Normalizes multiple spaces to a single space
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

/**
 * Finds the position of an author in an author string.
 * It uses an improved fuzzy search strategy.
 *
 * @param {string} authorsString The string with the list of authors.
 * @param {string} targetName The name of the author to search for.
 * @returns {string} The position in "X/Y" format.
 */
function findAuthorPosition(authorsString, targetName) {
    // Handle null or empty inputs
    if (!authorsString) {
        return '';
    }

    // Use a regular expression to handle the delimiters " and ", ",", ";"
    const delimiters = /\s*and\s*|;|,/g;
    const authors = authorsString
        .split(delimiters)
        .map(name => name.trim());

    const totalAuthors = authors.length;
    if (totalAuthors === 0) {
        return '';
    }
    if (!targetName) {
        return `${totalAuthors}`;
    }
    
    const normalizedTargetName = normalizeName(targetName);
    const targetNameWords = normalizedTargetName.split(' ');
    const targetInitials = targetNameWords.map(word => word.charAt(0)).join('');

    let bestMatchIndex = -1;
    let maxSimilarity = 0;
    const minSimilarityThreshold = 0.8;

    // Find the most similar author using a multi-step strategy
    authors.forEach((author, index) => {
        const normalizedAuthorName = normalizeName(author);
        const authorNameWords = normalizedAuthorName.split(' ');
        const authorInitials = authorNameWords.map(word => word.charAt(0)).join('');

        let similarityScore = 0;

        // 1. Word match (subset/superset)
        const isSubset = targetNameWords.every(word => authorNameWords.includes(word));
        const isSuperset = authorNameWords.every(word => targetNameWords.includes(word));

        if (isSubset || isSuperset) {
            similarityScore = 1.0; // Perfect or strong partial match
        } else {
            // 2. Initial match
            if (authorInitials === targetInitials) {
                similarityScore = 0.95; // Initial match
            } else {
                // 3. Levenshtein fallback for typos
                const distance = levenshteinDistance(normalizedTargetName, normalizedAuthorName);
                const maxLength = Math.max(normalizedTargetName.length, normalizedAuthorName.length);
                similarityScore = 1 - (distance / maxLength);
            }
        }
        
        if (similarityScore > maxSimilarity) {
            maxSimilarity = similarityScore;
            bestMatchIndex = index;
        }
    });

    // Return the position if the similarity is above the threshold
    if (maxSimilarity >= minSimilarityThreshold) {
        // The position is 1-based, not 0-based
        return `${bestMatchIndex + 1}/${totalAuthors}`;
    } else {
        // If a valid match is not found, return 0
        return `${totalAuthors}`;
    }
}

/**
 * Converts a month string or number into a two-digit month number.
 * For example: "jan" -> "01", "February" -> "02", "3" -> "03".
 * * @param {string|number} monthString The month's name, abbreviation, or number.
 * @returns {string|null} The month number in "MM" format, or null if the input is not recognized.
 */
function getMonthNumber(monthString) {
  // Ensure the input is a string and convert it to lowercase for standardization.
  const month = String(monthString).toLowerCase();

  // Check if the input is a number (1-12) and format it with a leading zero if needed.
  if (!isNaN(month) && month.length <= 2) {
    const monthNum = parseInt(month, 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return monthNum.toString().padStart(2, '0');
    }
  }

  // A map of month names and abbreviations to their corresponding two-digit numbers.
  const monthMap = {
    'jan': '01', 'january': '01',
    'feb': '02', 'february': '02',
    'mar': '03', 'march': '03',
    'apr': '04', 'april': '04',
    'may': '05',
    'jun': '06', 'june': '06',
    'jul': '07', 'july': '07',
    'aug': '08', 'august': '08',
    'sep': '09', 'sept': '09', 'september': '09',
    'oct': '10', 'october': '10',
    'nov': '11', 'november': '11',
    'dec': '12', 'december': '12'
  };

  // Return the value from the map if it exists; otherwise, return null.
  return monthMap[month] || null;
}
