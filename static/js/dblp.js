/**
 * Fetches all BibTeX entries for a given author from DBLP.
 * @param {string} authorName - The full name of the author (e.g., "José Miguel Horcas").
 * @returns {Promise<string>} A promise that resolves with the BibTeX content as a string,
 * or an error message if the author is not found or an error occurs.
 */
async function getAuthorBibtex(authorName) {
  // 1. Encode the author's name for the URL.
  const authorNameEncoded = encodeURIComponent(authorName);
  const searchUrl = `https://dblp.org/search/author/api?q=${authorNameEncoded}&format=json`;

  try {
    // 2. Search for the author to get their DBLP PID.
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Error searching for author: ${searchResponse.statusText}`);
    }
    const searchData = await searchResponse.json();

    const authorHits = searchData.result.hits.hit;
    if (!authorHits || authorHits.length === 0) {
      return `Author "${authorName}" not found.`;
    }

    // 3. Extract the author's profile URL from the JSON structure.
    const authorUrl = authorHits[0].info.url;

    // 4. Extract the PID from the URL.
    const authorPidMatch = authorUrl.match(/pid\/(.+)/);
    if (!authorPidMatch || authorPidMatch.length < 2) {
      return `Could not retrieve the PID for author "${authorName}".`;
    }
    const authorPid = authorPidMatch[1];

    // 5. Construct the URL for the BibTeX file using the PID.
    const bibtexUrl = `https://dblp.org/pid/${authorPid}.bib`;

    // 6. Fetch the BibTeX content.
    const bibtexResponse = await fetch(bibtexUrl);
    if (!bibtexResponse.ok) {
      throw new Error(`Error fetching BibTeX content: ${bibtexResponse.statusText}`);
    }
    const bibtexText = await bibtexResponse.text();

    // 7. Return the content.
    return bibtexText;

  } catch (error) {
    console.error("An error occurred:", error);
    return `An error occurred while processing the request for "${authorName}".`;
  }
}
;