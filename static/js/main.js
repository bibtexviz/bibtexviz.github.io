document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dataForm');
    const chart = document.getElementById('chart');

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
                    const bibtexContent = e.target.result;
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
                const bibtexContent = await getAuthorBibtex(researcherName);
                console.log("Fetched BibTeX content:", bibtexContent);
                const processedPublications = processBibtexFile(bibtexContent, researcherName);
                if (processedPublications.length > 0) {
                    console.log("Parsed publication data from .bib file:", processedPublications);
                    drawChart(processedPublications, "#chart");
                    //alert('Archivo .bib cargado y gráfico actualizado.');
                }
            }
        } else {
            form.classList.add('was-validated');
        }
    });

    // Lógica para descargar el SVG
    document.getElementById('downloadSvg').addEventListener('click', (e) => {
        e.preventDefault();
        const svgContent = new XMLSerializer().serializeToString(chart);
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'publications.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
   
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
    
    // Convert to a D3.js compatible format (this logic can be adjusted as needed)
    console.log("Parsed publication data:", publicationsJSON);

    const processedPublications = publicationsJSON.map(pub => {
      const booktitle = normalizeAccents(pub.entryTags?.booktitle || '');
      const year = parseInt(pub.entryTags?.year);
      const icoreRanking = booktitle ? getICORERanking(booktitle, getAcronymOrTruncate(booktitle, 50), year) : null;
      const isWorkshop = booktitle.toLowerCase().includes('workshop') || booktitle.toLowerCase().includes('ws');
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
        acronym: entryType === 'book' ? 'Book' : (entryType === 'phdthesis' ? 'PhD Thesis' : (publicationType === 'dataArtifacts' ? publisher : getAcronymOrTruncate(journal || booktitle || '', 25))),
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
      };
    });

    return processedPublications;

  } catch (error) {
    console.error("Error parsing the .bib file:", error);
    alert('Error processing the .bib file. Please check the format.');
    return [];
  }
}

