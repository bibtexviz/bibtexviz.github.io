const editions = ["2023", "2021", "2020", "2018", "2017", "2014", "2013", "2010", "2008"];

// memoryCache will store ranking data grouped by edition
const coreRankingCache = {};  // e.g. { "CORE2023": [ { title: "...", acronym: "...", rank: "A" }, ... ] }

async function loadCoreRankings(editions) {
  for (const year of editions) {
    const path = `/resources/core_rankings/CORE${year}.csv`;
    try {
      const response = await fetch(path);
      const csvText = await response.text();
      //const rows = csvText.trim().split('\n').map(line => line.split(','));
      const rows = d3.csvParseRows(csvText.trim());
      coreRankingCache[`CORE${year}`] = rows;
    } catch (e) {
      console.error(`Could not load CORE${year}:`, e);
    }
  }
}

function getICORERanking(conferenceName, acronym, year) {
  // find editions <= year, sorted descending
  const editions = Object.keys(coreRankingCache)
    .map(k => parseInt(k.replace('CORE', '')))
    .filter(y => y <= year)
    .sort((a, b) => b - a);

  for (const ed of editions) {
    const data = coreRankingCache[`CORE${ed}`];
    const conferenceNameLower = conferenceName.toLowerCase();
    const acronymLower = acronym.toLowerCase();
    const match = data.find(row => row[1].toLowerCase().includes(conferenceNameLower) || conferenceNameLower.includes(row[1].toLowerCase()) || row[2].toLowerCase() === acronymLower);
    if (match) {
        result = {
            edition: `CORE${ed}`,
            rank: match[4], // assuming this is the rank column (Australasian A/B/C)
        };
        if (result.rank === 'Unranked') {
            return {edition: `CORE${ed}`, rank: '-'};
        }
      return result;
    }
  }
  return {edition: `CORE${year}`, rank: '-'};; // no match found
}

(async () => {
  await loadCoreRankings(editions);
  console.log('Core rankings loaded');
})();