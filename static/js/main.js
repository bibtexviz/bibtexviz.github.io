document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dataForm');
    const chart = document.getElementById('chart');

    // Dibuja el gráfico inicial con los datos de ejemplo
    drawChart(examplePublications, "#chart");

    // Manejar el envío del formulario
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const researcherName = document.getElementById('researcherName').value;
        const bibFile = document.getElementById('bibFile').files[0];
        
        if (form.checkValidity()) {
            if (bibFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const bibtexContent = e.target.result;
                    try {
                        // Usar bibtexParse para convertir el contenido a un array JSON
                        const publicationsJSON = bibtexParse.toJSON(bibtexContent);
                        // Convertir a un formato compatible con D3.js (puedes ajustar esta lógica según necesites)
                        console.log("Datos de publicaciones parseados:", publicationsJSON);
                        const processedPublications = publicationsJSON.map(pub => ({
                            // Aquí debes mapear los campos de bibtexParse a tu formato
                            // Por ejemplo, pub.entryTags.journal o pub.entryTags.year
                            // Esto es una simplificación, ya que el formato de salida de bibtexParse
                            // es distinto del array de ejemplo. Deberías adaptar la lógica
                            // de D3.js para manejarlo, o adaptar los datos aquí.
                            type: pub.entryType.toLowerCase() === "article" ? 'journal' : 'indexed_conf', // Ejemplo: "article" -> "journal"
                            quartile: pub.entryTags?.ranking || null, // Deberías extraer esta información si está disponible
                            icore: pub.entryTags?.booktitle ? getICORERanking(pub.entryTags?.booktitle || '', getAcronymOrTruncate(pub.entryTags?.booktitle || '', 50), parseInt(pub.entryTags?.year))?.rank || null : null,
                            authorPosition: findAuthorPosition(pub.entryTags?.author || '', researcherName), // Cambia el nombre según tu caso
                            acronym: getAcronymOrTruncate(pub.entryTags?.journal || pub.entryTags?.booktitle || '', 8), // Usar el título del journal o del libro
                            track: null,
                            awards: pub.entryTags?.awards ? pub.entryTags.awards.split(',').map(a => a.trim()) : [],
                            icons: [],
                            doi: formatDoiUrl(pub.entryTags?.doi || pub.entryTags?.url || ''),
                            year: parseInt(pub.entryTags?.year),
                            date: pub.entryTags?.month && pub.entryTags?.year ? `${pub.entryTags?.year}-${pub.entryTags?.month}-01` : `${pub.entryTags?.year}-01-01`
                        }));

                        console.log("Datos de publicaciones parseados del archivo .bib:", processedPublications);
                        drawChart(processedPublications, "#chart");
                        alert('Archivo .bib cargado y gráfico actualizado.');
                    } catch (error) {
                        console.error("Error al parsear el archivo .bib:", error);
                        alert('Error al procesar el archivo .bib. Por favor, revisa el formato.');
                    }
                };
                reader.readAsText(bibFile);
            } else {
                // Si no se carga un archivo, se usa el dataset de ejemplo
                drawChart(examplePublications, "#chart");
                alert('No se cargó ningún archivo. Mostrando datos de ejemplo.');
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
        a.download = 'visualizacion.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Lógica para descargar el PNG (requiere una biblioteca como canvg o html2canvas)
    document.getElementById('downloadPng').addEventListener('click', (e) => {
        e.preventDefault();
        // Implementación de la descarga PNG
        // Esto requiere convertir el SVG a un elemento canvas para luego descargarlo
        alert('La función de descarga PNG requiere una biblioteca adicional. Por favor, implementa la lógica usando canvg o similar.');
        // Ejemplo de pseudocódigo con canvg:
        /*
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const v = canvg.Canvg.fromString(ctx, new XMLSerializer().serializeToString(chart));
        v.render().then(() => {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = 'visualizacion.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
        */
    });
    
    // Lógica para descargar el PDF (requiere una biblioteca como jsPDF)
    document.getElementById('downloadPdf').addEventListener('click', (e) => {
        e.preventDefault();
        // Implementación de la descarga PDF
        alert('La función de descarga PDF requiere una biblioteca adicional. Por favor, implementa la lógica usando jsPDF o similar.');
    });
});