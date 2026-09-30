let bibtexContent = "";

const customAcronyms = {
    "Journal of Systems and Software": "J. Syst. Softw.",
    "Science of Computer Programming": "Sci. Comput. Program.",
    "IEEE Transactions on Software Engineering": "IEEE Trans. Softw. Eng.",
    "Software and Systems Modeling": "Softw. Syst. Model.",
    "Information and Software Technology": "Inf. Softw. Technol.",
    "IEEE Latin America Transactions": "IEEE Latin America Trans.",
    "Knowledge-Based Systems": "Knowl. Based Syst.",
    "Ad Hoc Networks": "Ad Hoc Networks",
    "Journal of Software: Evolution and Process": "J. Softw. Evol. Process",
    "Computers & Security": "Comput. Secur.",
    "Sensors": "Sensors",
    "ERCIM News": "ERCIM News",
    "Scientific Data": "Scientific Data",
};


document.addEventListener('DOMContentLoaded', async() => {
    if (window.coreRankingsReady) {
        await window.coreRankingsReady;
    }

    const form = document.getElementById('dataForm');

    // Dibuja el gráfico inicial con los datos de ejemplo
    //drawChart(examplePublications, "#chart");

    // Manejar el envío del formulario
    form.addEventListener('submit', async(event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const researcherName = document.getElementById('researcherName').value;
        const bibFile = document.getElementById('bibFile').files[0];
        
        if (form.checkValidity()) {
            if (bibFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    bibtexContent = e.target.result;
                    const processedPublications = processBibtexFile(bibtexContent, researcherName);
        
                    // If the processing was successful, draw the chart
                    if (processedPublications.length > 0) {
                        console.log("Parsed publication data from .bib file:", processedPublications);
                        drawChart(processedPublications, "#chart");
                        //alert('Archivo .bib cargado y gráfico actualizado.');
                    }
                };
                reader.readAsText(bibFile);
            } else {
                // If the file is not provided, search the author dblp
                bibtexContent = await getAuthorBibtex(researcherName);
                console.log("Fetched BibTeX content:", bibtexContent);
                const processedPublications = processBibtexFile(bibtexContent, researcherName);
                if (processedPublications.length > 0) {
                    console.log("Parsed publication data from .bib file:", processedPublications);
                    drawChart(processedPublications, "#chart");
                    //alert('Archivo .bib cargado y gráfico actualizado.');
                } else {
                    alert(`Researcher "${researcherName}" not found in DBLP. Please upload a .bib file.`);
                }
            }
        } else {
            form.classList.add('was-validated');
        }
    });

    // Lógica para descargar el SVG
    document.getElementById('downloadSvg').addEventListener('click', (e) => {
        e.preventDefault();
        const svgElement = buildExportSvg('#chart');
        const blob = serializeToSVG(svgElement);
        svgElement.parentNode.remove();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'publications.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
   
    document.getElementById('downloadBib').addEventListener('click', (e) => {
        e.preventDefault();
        if (!bibtexContent) {
            alert('No hay datos BibTeX para descargar.');
            return;
        }
        const blob = new Blob([bibtexContent], { type: 'application/x-bibtex' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'publications.bib';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // --- NUEVO BLOQUE: permitir carga automática por parámetros URL ---
    const params = new URLSearchParams(window.location.search);
    const researcherNameParam = params.get("researcher");
    const sourceParam = params.get("source"); // puede ser una URL o un DOI o un identificador

    if (researcherNameParam) {
        console.log(`Detected researcher from URL: ${researcherNameParam}`);
        
        // Si hay source (por ejemplo una URL o un nombre de archivo), intenta cargarlo
        if (sourceParam) {
            // Cargar desde un archivo .bib remoto (si es una URL válida)
            if (sourceParam.endsWith(".bib") || sourceParam.startsWith("http")) {
                fetch(sourceParam + "?t=" + Date.now(), { cache: "no-store" })
                    .then(response => {
                        if (!response.ok) throw new Error("Error loading .bib file");
                        return response.text();
                    })
                    .then(bibContent => {
                        bibtexContent = bibContent;
                        const processedPublications = processBibtexFile(bibtexContent, researcherNameParam);
                        if (processedPublications.length > 0) {
                            drawChart(processedPublications, "#chart");
                        } else {
                            alert("The provided BibTeX file has no valid entries.");
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        alert("Error loading the BibTeX file from URL.");
                    });
            }
            //  else {
            //     // Si no es un .bib ni URL, asumimos que es un nombre o identificador para DBLP
            //     getAuthorBibtex(sourceParam).then(bib => {
            //         bibtexContent = bib;
            //         const processedPublications = processBibtexFile(bibtexContent, researcherNameParam);
            //         if (processedPublications.length > 0) {
            //             drawChart(processedPublications, "#chart");
            //         } else {
            //             alert(`Researcher "${researcherNameParam}" not found in DBLP.`);
            //         }
            //     });
            // }
        } else {
            // Si no hay "source", intenta cargar automáticamente desde DBLP por nombre
            getAuthorBibtex(researcherNameParam).then(bib => {
                bibtexContent = bib;
                const processedPublications = processBibtexFile(bibtexContent, researcherNameParam);
                if (processedPublications.length > 0) {
                    drawChart(processedPublications, "#chart");
                } else {
                    alert(`Researcher "${researcherNameParam}" not found in DBLP.`);
                }
            });
        }
    }

});


/**
 * Processes the BibTeX content from a file and returns an array of processed publications.
 * @param {string} bibtexContent - The content of the .bib file as a string.
 * @param {string} researcherName - The name of the researcher to find their author position.
 * @returns {Array<Object>} An array of publication objects ready for D3.js, or an empty array if an error occurs.
 */
function processBibtexFile(bibtexContent, researcherName) {
  try {
    // Use bibtexParse to convert the content to a JSON array
    const publicationsJSON = bibtexParse.toJSON(bibtexContent);

    // BibTeX field names are case-insensitive (e.g., HAL exports use TITLE, AUTHOR, ...),
    // so normalize them to lowercase before accessing them
    publicationsJSON.forEach(pub => {
      if (pub.entryTags) {
        pub.entryTags = Object.fromEntries(
          Object.entries(pub.entryTags).map(([key, value]) => [key.toLowerCase(), value])
        );
      }
    });
    
    // Convert to a D3.js compatible format (this logic can be adjusted as needed)
    console.log("Parsed publication data:", publicationsJSON);

    const processedPublications = publicationsJSON.map(pub => {
      const booktitle = normalizeAccents(pub.entryTags?.booktitle || '');
      const year = parseInt(pub.entryTags?.year);
      const icoreRanking = booktitle ? getICORERanking(booktitle, getAcronymOrTruncate(booktitle, 50, customAcronyms), year) : null;
      if (icoreRanking) {
        if (!icoreRanking.rank || icoreRanking.rank === '-') {
            icoreRanking.rank = pub.entryTags?.ranking || '-';
        }
      }
      const isWorkshop = booktitle.toLowerCase().includes('workshop') || booktitle.toLowerCase().includes(' ws ');
      const entryType = pub.entryType.toLowerCase();
      const journal = normalizeAccents(pub.entryTags?.journal || '');
      const publisher = pub.entryTags?.publisher || '';
      const isNational = pub.entryTags?.scope === 'national' || '';
      const publicationType = getEntryType(entryType, journal, booktitle, isNational, isWorkshop, publisher);
      const authors = getAuthors(pub.entryTags?.author || '');

      return {
        type: publicationType,
        authors: authors,
        title: normalizeAccents(pub.entryTags?.title) || '',
        journal: journal,
        booktitle: booktitle,
        quartile: getQuartile(pub.entryTags?.jcr !== undefined ? pub.entryTags?.jcr : '?'),
        jcr: pub.entryTags?.jcr || '',
        icore: icoreRanking?.rank || null,
        authorPosition: findAuthorPosition(authors, researcherName),
        acronym: entryType === 'book' ? 'Book' : (entryType === 'phdthesis' ? 'PhD Thesis' : (publicationType === 'dataArtifacts' ? publisher : getAcronymOrTruncate(journal || booktitle || '', 25, customAcronyms))),
        track: capitalizeFirstLetter(pub.entryTags?.track) || '',
        awards: pub.entryTags?.awards ? pub.entryTags.awards.split(',').map(a => a.trim()) : [],
        notes: pub.entryTags?.note || '',
        doi: formatDoiUrl(pub.entryTags?.doi || pub.entryTags?.url || ''),
        year: year,
        month: pub.entryTags?.month?.charAt(0).toUpperCase() + pub.entryTags?.month?.slice(1) || null,
        date: pub.entryTags?.month && year ? `${year}-${getMonthNumber(pub.entryTags?.month)}-01` : `${year}-01-01`,
        publisher: normalizeAccents(publisher) || null,
        abstract: pub.entryTags?.abstract || '',
        keywords: pub.entryTags?.keywords ? pub.entryTags.keywords.split(',').map(k => k.trim()).join(', ') : '',
        address: pub.entryTags?.address || '',
        volume: pub.entryTags?.volume || '',
        calification: pub.entryTags?.calification || '',
        pages: pub.entryTags?.pages || '',
        specialissue: pub.entryTags?.specialissue || '',
        bibtexContent: generateBibtex(pub),
      };
    });

    return processedPublications;

  } catch (error) {
    console.error("Error parsing the .bib file:", error);
    alert('Error processing the .bib file. Please check the format.');
    return [];
  }
}

