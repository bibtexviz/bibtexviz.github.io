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

    text = text.trim();
    // 2. Return the string as is if its length is less than or equal to N.
    if (text.length <= N) {
        return text;
    }

    // 3. Search for an acronym using a regular expression.
    const acronymRegex = /[({]([0-9a-zA-Z\- @\s]+)[})]/g;
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
    if (initialsAcronym.length > 8) {
        // ** Modified logic to truncate the acronym and keep the last N characters **
        return initialsAcronym.slice(-8);
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
    doiString = doiString.trim();
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

    cleaned = normalizeAccents(cleaned);
    
    return cleaned;
}

/**
 * Normaliza una cadena, convirtiendo caracteres especiales (ej. de formato LaTeX) a sus equivalentes Unicode.
 * @param {string} str La cadena a normalizar.
 * @returns {string} La cadena con los caracteres normalizados.
 */
function normalizeAccents(str) {
    if (!str) {
        return '';
    }
    let cleaned = str.trim();
    //cleaned = cleaned.replace(/\\.+?\{/g, ""); 
    cleaned = cleaned.replaceAll('{', '');
    cleaned = cleaned.replaceAll('}', '');
    // Un mapa de caracteres especiales a sus equivalentes normales
    const replacements = {
        "\\'a": 'á',
        "\\'e": 'é',
        "\\'i": 'í',
        "\\'o": 'ó',
        "\\'u": 'ú',
        "\\'A": 'Á',
        "\\'E": 'É',
        "\\'I": 'Í',
        "\\'O": 'Ó',
        "\\'U": 'Ú',
        '\\`a': 'à',
        '\\`e': 'è',
        '\\`i': 'ì',
        '\\`o': 'ò',
        '\\`u': 'ù',
        '\\`A': 'À',
        '\\`E': 'È',
        '\\`I': 'Ì',
        '\\`O': 'Ò',
        '\\`U': 'Ù',
        '\\~a': 'ã',
        '\\~e': 'ẽ',
        '\\~i': 'ĩ',
        '\\~o': 'õ',
        '\\~u': 'ũ',
        '\\~A': 'Ã',
        '\\~E': 'Ẽ',
        '\\~I': 'Ĩ',
        '\\~O': 'Õ',
        '\\~U': 'Ũ',
        '\\~n': 'ñ',
        '\\~N': 'Ñ',
        '\\^a': 'â',
        '\\^e': 'ê',
        '\\^i': 'î',
        '\\^o': 'ô',
        '\\^u': 'û',
        '\\^A': 'Â',
        '\\^E': 'Ê',
        '\\^I': 'Î',
        '\\^O': 'Ô',
        '\\^U': 'Û',
        '\\ss': 'ß',
        '\\ae': 'æ',
        '\\AE': 'Æ',
        '\\oe': 'œ',
        '\\OE': 'Œ',
        '\\l': 'ł',
        '\\L': 'Ł',
        '\\á': 'á',
        '\\é': 'é',
        '\\í': 'í',
        '\\ó': 'ó',
        '\\ú': 'ú',
        '\\Á': 'Á',
        '\\É': 'É',
        '\\Í': 'Í',
        '\\Ó': 'Ó',
        '\\Ú': 'Ú',
        '\\ñ': 'ñ',
        '\\Ñ': 'Ñ',
        '\\ü': 'ü',
        '\\Ü': 'Ü',
        '\\ç': 'ç',
        '\\Ç': 'Ç'
        };

    
    // Iteramos sobre el mapa y reemplazamos cada ocurrencia
    for (const specialChar in replacements) {
        cleaned = cleaned.replaceAll(specialChar, replacements[specialChar]);
    }
    
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
    authors = authorsString.split(', ')

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

function getAuthors(authorsString) {
    // Handle null or empty inputs
    if (!authorsString) {
        return '';
    }
    // Use a regular expression to handle the delimiters " and ", ",", ";"
    const delimiters = /\s+and\s+|;|,/g;
    return authorsString.split(delimiters).map(name => normalizeAccents(name)).join(', ');
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


function getEntryType(entryType, journal, booktitle, national, isWorkshop, publisher) {
  if (national) {
    return 'national';
  }
  if (entryType === 'article') {
    if (journal.toLowerCase() === 'corr') {
        return 'other';
    }
    return 'journal';
  } else if (entryType === 'proceedings') {
    return 'editorship';
  } else if (['book', 'phdthesis'].includes(entryType)) {
    return 'book';
  } else if (booktitle) {
    if (isWorkshop) {
      return 'workshop';
    } else {
      return 'conference';
    }
  } else if (entryType === 'misc' && publisher === 'Zenodo') {
    return 'dataArtifacts';
  } else {
    return 'other';
  }
}

function getQuartile(jcr) {
  if (jcr.trim() === '') {
      return '-';
  } else {
      return jcr.trim().slice(0, 2).toUpperCase();
  }
}

/**
 * Splits an array of words into two halves and joins them with a space.
 * The first half gets the extra word if the total is odd.
 * @param {string[]} words - An array of words.
 * @returns {string[]} An array with two strings: the first and second halves.
 */
function splitWordsIntoHalves(words) {
  if (words.length <= 1) {
    return words.length === 1 ? [words[0], ""] : ["", ""];
  }

  const halfwayPoint = Math.ceil(words.length / 2);
  const firstHalf = words.slice(0, halfwayPoint).join(' ');
  const secondHalf = words.slice(halfwayPoint).join(' ');

  return [firstHalf, secondHalf];
}

/**
 * Capitaliza solo la primera letra de una frase.
 * @param {string} sentence - La frase que quieres capitalizar.
 * @returns {string} La frase con solo la primera letra en mayúscula.
 */
function capitalizeFirstLetter(sentence) {
  if (typeof sentence !== 'string' || sentence.length === 0) {
    return ''; // Maneja entradas no válidas o vacías
  }
  
  // 1. Convierte toda la frase a minúsculas para un formato consistente
  const lowerCaseSentence = sentence.toLowerCase();

  // 2. Obtiene el primer carácter y lo convierte a mayúscula
  const firstLetter = lowerCaseSentence.charAt(0).toUpperCase();

  // 3. Obtiene el resto de la frase y lo une con la primera letra
  const restOfSentence = lowerCaseSentence.slice(1);
  
  return firstLetter + restOfSentence;
}

function generateBibtex(pub) {
    const type = pub.entryType;
    const key = pub.citationKey;
    const tags = pub.entryTags || {};

    // Convertimos los tags en líneas BibTeX
    const entries = Object.entries(tags)
        .map(([k, v]) => {
            if (k === 'entryType' || k === 'citationKey') return '';
            if (!v) return '';
            // Escapamos llaves y comillas
            //const safeValue = v.replace(/[{}]/g, '');
            return `  ${k} = {${v}}`;
        })
        .filter(line => line !== '')
        .join(',\n');

    return `@${type}{${key},\n${entries}\n}`;
}