// Definición de la función para dibujar el gráfico
function drawChart(publications, chartId) {
    // Si no hay publicaciones, limpiamos el SVG y salimos
    if (!publications || publications.length === 0) {
        d3.select(chartId).html(''); // Limpia el SVG
        console.warn("No hay publicaciones para mostrar.");
        return;
    }

    // Iconos usados en la esquina superior izquierda
    const iconMap = {
        'best paper award': '🏆',
        'other award': '🏅',
        'external collaboration': '👥',
        'industry collaboration': '🏢',
        'international stay result': '🗺️',
    };

    const iconMeaningMap = {
        'best paper award': 'Best paper award',
        'other award': 'Other award',
        'external collaboration': 'External collaboration',
        'industry collaboration': 'Industry collaboration',
        'international stay result': 'International stay result',
    };

    // Colores por tipo de publicación
    const colorMap = {
        journal: '#c32b72',
        conference: '#196ca3',
        workshop: '#2ecc71',
        national: '#e68019',
        dataArtifacts: '#885522',
        book: '#ffd500',
        editorship: '#33c3ba',
        other: '#606b70' // Otros tipos
    };

    // types map
    const typesMap = {
        journal: 'Journal',
        conference: 'International conference',
        workshop: 'International workshop',
        national: 'National conference',
        dataArtifacts: 'Data and artifacts',
        book: 'Books and PhD thesis',
        editorship: 'Editorship',
        other: 'Informal and other publications' // Otros tipos
    };

   // Nuevo orden de apilado (de arriba a abajo)
    const typeOrder = {
        'book': 0,
        'journal': 1,
        'conference': 2,
        'workshop': 3,
        'national': 4,
        'dataArtifacts': 5,
        'editorship': 6,
        'other': 7 // Los que no tienen tipo van al final
    };

    // Orden para quartiles (Q1 arriba, Q4 abajo)
    const quartileOrder = {
        'Q1': 0,
        'Q2': 1,
        'Q3': 2,
        'Q4': 3,
        '-': 4 // Los que no tienen quartil van al final
    };

    // Orden para i-cores (A* arriba, C abajo)
    const icoreOrder = {
        'A*': 0,
        'A': 1,
        'B': 2,
        'C': 3,
        '-': 4 // Los que no tienen i-core van al final
    };

    // Agrupar por año
    const grouped = d3.groups(publications, d => d.year);

    // Calcular rango de años (inclusivo)
    const allYears = d3.range(
        d3.min(publications, d => d.year),
        d3.max(publications, d => d.year) + 1
    );

    // Convertir a mapa para fácil acceso
    const pubMap = new Map(grouped);

    // Asegurar que todos los años estén presentes, incluso si no hay publicaciones
    const groupedByYear = allYears.map(year => [year, pubMap.get(year) || []]);


    // Ordenar por tipo, ranking y fecha
    groupedByYear.forEach(([year, pubs]) => {
        pubs.sort((a, b) => {
            // 1. Ordenar por tipo de publicación (de mayor a menor prestigio)
            const typeCmp = typeOrder[a.type] - typeOrder[b.type];
            if (typeCmp !== 0) return typeCmp;

            // 2. Si son del mismo tipo, ordenar por quartil o i-core (de mayor a menor prestigio)
            if (a.type === 'journal') {
                const quartileCmp = (quartileOrder[a.quartile] ?? quartileOrder['-']) - (quartileOrder[b.quartile] ?? quartileOrder['-']);
                if (quartileCmp !== 0) return quartileCmp;
            } else if (['conference', 'workshop'].includes(a.type)) {
                // Se ha añadido la lógica para ordenar por icore
                const icoreCmp = (icoreOrder[a.icore] ?? icoreOrder['-']) - (icoreOrder[b.icore] ?? icoreOrder['-']);
                if (icoreCmp !== 0) return icoreCmp;

                // 2.1. Si hay empate en ICORE, ordenar por número de premios (más premios primero)
                const awardsA = a.awards ? a.awards.length : 0;
                const awardsB = b.awards ? b.awards.length : 0;
                const awardsCmp = awardsB - awardsA; // descendente
                if (awardsCmp !== 0) return awardsCmp;
            }

            // 3. Si todo lo anterior es igual, ordenar por fecha (de más reciente a más antiguo)
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
    });

    // Layout
    const svg = d3.select(chartId);
    
    // Limpiar el contenido anterior del SVG
    svg.html('');

    // Dibujar los cuadrados
    const squareSize = 120;
    const rowGap = 130;
    const columnGap = 150;
    const padding = 10;
    const xStart = 60;
    // Calcular la altura base automáticamente en función del año con más publicaciones
    const maxPubsInYear = Math.max(...groupedByYear.map(([, pubs]) => pubs.length));
    const yBase = maxPubsInYear * rowGap; // ajusta base en función del máximo

    // Ajustar dinámicamente la altura del SVG
    svg.attr("height", yBase + 80); // 80px extra para dejar espacio a las etiquetas de año

    const positionedPublications = [];

    // Posicionar cuadrados
    groupedByYear
        .sort((a, b) => a[0] - b[0]) // ordenar años ascendente
        .forEach(([year, pubs], columnIndex) => {
            const total = pubs.length;
            pubs.forEach((pub, i) => {
                const x = xStart + columnIndex * columnGap;
                const y = yBase - (total - i) * rowGap;
                positionedPublications.push({ ...pub, x, y, year });
            });
        });

        
    // Etiquetas de eje Y (número de publicaciones)
    const yScaleLabels = d3.range(1, maxPubsInYear + 1).reverse();
    svg.selectAll("text.y-axis-label")
        .data(yScaleLabels)
        .enter()
        .append("text")
        .attr("class", "y-axis-label")
        .attr("x", xStart - 20)
        .attr("y", (d, i) => (i * rowGap) + padding)
        .attr("dy", "14px")
        .attr("text-anchor", "end")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(d => d);

    // Línea vertical del eje Y
    svg.append("line")
        .attr("x1", xStart - 10)
        .attr("y1", 0)
        .attr("x2", xStart - 10)
        .attr("y2", yBase)
        .attr("stroke", "black")
        .attr("stroke-width", 1);

        
    // Crear grupos con enlace
    const group = svg.selectAll("a")
        .data(positionedPublications)
        .enter()
        .append("g")
        .attr("class", "pub-square-group")
        .on("click", function(event, d) {
            // Obtenemos una referencia al modal de Bootstrap
            const myModal = new bootstrap.Modal(document.getElementById('publicationModal'));
            
            // Rellenamos el contenido del modal
            const urlValue = d.doi || d.url;
            const linkText = urlValue || '-';
            const modalBody = d3.select("#publicationModal .modal-body");
            const textReference = `${d.authors}. ${d.title}.${d.journal || d.booktitle ? ` ${d.journal || d.booktitle},` : ''} ${d.year}. ${d.volume ? `${d.volume}:` : ''}${d.pages ? ` ${d.pages.replace(/--/, '-')}.` : ''}${d.address ? ` ${d.address}.` : ''} ${d.doi ? `${d.doi}` : d.url ? `${d.url}` : ''}${d.awards && d.awards.length > 0 ? ` ${d.awards.map(i => ` «${i}»`).join(', ')}` : ''}`;
            modalBody.html(`
                <p><strong>Type:</strong> ${typesMap[d.type]}</p>
                <p><strong>Authors (${d.authorPosition}):</strong> ${d.authors}</p>
                <p><strong>Title:</strong> ${d.title}</p>
                ${d.journal ? `<p><strong>Journal:</strong> ${d.journal}</p>` : ''} 
                ${d.booktitle ? `<p><strong>Conference:</strong> ${d.booktitle}</p>` : ''}
                ${d.volume ? `<p><strong>Volume:</strong> ${d.volume}</p>` : ''}
                <p><strong>Year:</strong> ${d.month ? d.month : ''} ${d.year}</p>
                ${d.address ? `<p><strong>Address:</strong> ${d.address}</p>` : ''}
                ${d.jcr ? `<p><strong>JCR:</strong> ${d.jcr}</p>` : ''}
                ${d.icore ? `<p><strong>ICORE:</strong> ${d.icore === '-' ? 'No indexed' : d.icore}</p>` : ''}
                ${d.calification ? `<p><strong>Calification:</strong> ${d.calification}</p>` : ''}
                ${d.publisher ? `<p><strong>Publisher:</strong> ${d.publisher}<p>` : ''}
                ${d.awards && d.awards.length > 0 ? `<p><strong>Awards:</strong> ${d.awards.map(i => `${d.type === 'book' ? '🏅' : '🏆'} ${i}`).join(', ')}</p>` : ''}
                ${d.notes ? `<p><strong>Notes:</strong> ${d.notes.split(',').map(i => `${iconMeaningMap[i.trim().toLowerCase()]} ${iconMap[i.trim().toLowerCase()]}` || '').join(", ")}</p>` : ''}
                <p><strong>DOI/Handle/URL:</strong> <a href="${urlValue}" target="_blank" rel="noopener noreferrer">${linkText}</a></p>
                ${d.abstract ? `<p><strong>Abstract:</strong> ${d.abstract}</p>` : ''}
                ${d.keywords ? `<p><strong>Keywords:</strong> ${d.keywords}</p>` : ''}
                <hr style="border-top: 1px solid #ccc;">
                <p><strong>Reference:</strong>
                ${textReference}
                <div class="d-flex justify-content-center mt-3">
                    <button type="button" class="btn btn-outline-dark me-2" id="copyTextBtn">🏷️ Copy Reference</button>
                    <button type="button" class="btn btn-outline-dark" id="copyBibBtn">🗎 Copy BibTeX</button>
                </div>
            `);
            
            document.getElementById("copyTextBtn").addEventListener("click", () => {
                        navigator.clipboard.writeText(textReference)
                            .then(() => alert("Text copied to clipboard!"))
                            .catch(err => console.error("Failed to copy text: ", err));
            });

            document.getElementById("copyBibBtn").addEventListener("click", () => {
                navigator.clipboard.writeText(d.bibtexContent)
                    .then(() => alert("BibTeX copied to clipboard!"))
                    .catch(err => console.error("Failed to copy BibTeX: ", err));
            });
            
            // Mostramos el modal
            myModal.show();
    });

    const squares = group.append("g")
        .attr("class", "pub-square")
        .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // Cuadrado de fondo
    squares.append("rect")
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("rx", 10)
        .attr("fill", d => colorMap[d.type] || '#ccc')
        .attr("stroke", "#333")
        .attr("stroke-width", 1.5);

    // Texto central: Quartil o Ranking o '-'
    squares.append("text")
        .attr("x", squareSize / 2)
        .attr("y", squareSize / 2 + 5)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .style("font-size", "20px") 
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(d => {
            if (d.type === 'journal') return d.quartile || '-';
            if (['conference', 'workshop'].includes(d.type)) return d.icore || '-';
            if (d.calification) return d.calification || '-';
            return '-';
        });

    // Inferior derecha: Acrónimo y track
    const textGroup = squares.append("g")
        .attr("transform", d => `translate(${squareSize - padding + 5}, ${squareSize - padding + 5})`)
        .attr("text-anchor", "end")
        .attr("font-style", "italic");

    textGroup.each(function(d) {
        const group = d3.select(this);
        let acronymText = d.acronym || '';
        const trackText = d.track ? `${d.track} @` : '';
        
        // Si el texto completo es demasiado largo, lo dividimos en dos líneas
        if ((trackText + acronymText).length > 12) {
            if (d.track) {
                // Línea superior: track
                group.append("text")
                    .attr("x", 0)
                    .attr("y", -14) // Posición ajustada para la primera línea
                    .style("font-family", "Helvetica, Arial, sans-serif")
                    .text(trackText);
            } else {
                const words = acronymText.split(' ');
                if (words.length > 1) {
                    const splitWords = splitWordsIntoHalves(words);
                    // Línea superior: track
                    group.append("text")
                        .attr("x", 0)
                        .attr("y", -14) // Posición ajustada para la primera línea
                        .style("font-family", "Helvetica, Arial, sans-serif")
                        .text(splitWords[0]);
                    acronymText = splitWords[1];
                } else {
                    acronymText = words[0];
                }
            }
            // Línea inferior: acrónimo
            group.append("text")
                .attr("x", 0)
                .attr("y", 0) // Posición ajustada para la segunda línea
                .style("font-family", "Helvetica, Arial, sans-serif")
                .text(acronymText);
        } else {
            // Si no es largo, lo mostramos todo en una sola línea
            group.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .style("font-family", "Helvetica, Arial, sans-serif")
                .text(trackText + acronymText);
        }
    });

    // Superior derecha: Trofeo si best paper
    squares.selectAll(".trophy")
        .data(d => d.awards ? d.awards : [])
        .join("image")
        .attr("class", "trophy")
        .attr("x", (award, i) => squareSize - padding -25 - i * 26) // separa cada trofeo 26px
        .attr("y", padding - 10)
        .attr("width", 36)
        .attr("height", 36)
        .attr("href", function(award) {
            // d3 selecciona 'this' como <image>, su padre es el <g> de la publicación
            const parentData = d3.select(this.parentNode).datum();
            return emojiToDataURL(parentData.type === 'book' ? '🏅' : '🏆');
    });

    // Superior izquierda: Iconos (colaboraciones, etc.)
    squares.selectAll(".note-icon")
        .data(d => d.notes ? d.notes.split(',').map(i => i.trim().toLowerCase()) : [])
        .join("image")
        .attr("class", "note-icon")
        .attr("x", (note, i) => padding - 10 + i * 30) // ajusta separación horizontal
        .attr("y", padding - 10)
        .attr("width", 36)
        .attr("height", 36)
        .attr("href", note => {
            const emoji = iconMap[note] || '';
            return emoji ? emojiToDataURL(emoji) : '';
        });

    // Inferior izquierda: Posición del autor
    squares.append("text")
        .attr("x", padding -5)
        .attr("y", squareSize - padding + 5)
        .attr("text-anchor", "start")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(d => d.authorPosition);

   // Etiquetas de año debajo de cada columna, incluyendo años sin publicaciones
    svg.selectAll("text.year-label")
    .data(groupedByYear)
    .enter()
    .append("text")
    .attr("class", "year-label")
    .attr("x", (d, i) => xStart + i * columnGap + squareSize / 2)
    .attr("y", yBase + 30)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", "14px")
    .style("font-family", "Helvetica, Arial, sans-serif")
    .text(d => d[0]);  // el año está en la primera posición de la tupla

    // ---------- Leyenda ----------
    // Calcular totales por tipo
    const totalsByType = {};
    Object.keys(typesMap).forEach(type => {
        totalsByType[type] = publications.filter(d => d.type === type).length;
    });

    const legendSpacing = 25;

    // Datos de la leyenda a partir de colorMap
    const legendData = Object.entries(typesMap).filter(([type]) => totalsByType[type] > 0);
    const legendColor = Object.entries(colorMap).filter(([type]) => totalsByType[type] > 0);


    // Posición inicial de la leyenda (a la derecha del gráfico)
    const legendX = xStart + groupedByYear.length * columnGap + 50;
    const legendY = 50;

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX}, ${legendY})`);

    legend.selectAll("rect")
        .data(legendColor)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 25)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => d[1]);

    legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 25 + 14)
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(d => `${d[1]} (${totalsByType[d[0]]})`)
        .attr("font-size", "14px")
        .attr("alignment-baseline", "middle");

    // Texto subrayado para "Publications:"
    legend.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .style("text-decoration", "underline")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text("Publications:");

    // Número sin subrayado, separado en otro <text>
    legend.append("text")
        .attr("x", 95) // ajusta según la longitud de "Publications:" para que quede alineado
        .attr("y", -5)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .style("text-decoration", "none")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(`(${publications.length})`);

    // Add quartiles and i-cores to the legend
     // Contar publicaciones por cuartil
    const quartileCounts = {
        'Q1': publications.filter(d => d.quartile === 'Q1').length,
        'Q2': publications.filter(d => d.quartile === 'Q2').length,
        'Q3': publications.filter(d => d.quartile === 'Q3').length,
        'Q4': publications.filter(d => d.quartile === 'Q4').length,
        '?: Unknown': publications.filter(d => d.quartile === '?: Unknown').length,
        '-: No indexed in JCR': publications.filter(d => d.quartile === '-: No indexed in JCR').length
    };

    const totalJCRPublications = quartileCounts['Q1'] + quartileCounts['Q2'] + quartileCounts['Q3'] + quartileCounts['Q4'];

    legend.append("text")
        .attr("x", 0)
        .attr("y", legendData.length * legendSpacing + 30) // justo debajo de la última fila de tipos
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .style("text-decoration", "underline")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text("JCR ranking:");

    legend.append("text")
        .attr("x", 95) // ajusta según la longitud de "Publications:" para que quede alineado
        .attr("y", legendData.length * legendSpacing + 30)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .style("text-decoration", "none")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(`(${totalJCRPublications})`);

    // Filtrar solo los que tienen publicaciones
    //const quartilesFiltered = Object.entries(quartileCounts).filter(([q, count]) => count > 0);
    const quartilesFiltered = Object.entries(quartileCounts);

    // Dibujar leyenda de quartiles
    const quartileStart = legendData.length * legendSpacing + 35; // espacio extra
    legend.selectAll("text.quartile")
        .data(quartilesFiltered)
        .enter()
        .append("text")
        .attr("class", "quartile")
        .attr("x", 0)
        .attr("y", (d, i) => quartileStart + i * legendSpacing + 15)
        .attr("font-size", "14px")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(d => `${d[0]} (${d[1]})`);

    // ---- Título I-CORE ----
    // Contar publicaciones por ICORE
    const icoreCounts = {
        'A*': publications.filter(d => d.icore === 'A*').length,
        'A': publications.filter(d => d.icore === 'A').length,
        'B': publications.filter(d => d.icore === 'B').length,
        'C': publications.filter(d => d.icore === 'C').length,
        '-: No indexed in ICORE': publications.filter(d => d.icore === '-').length
    };

    const totalICOREPublications = icoreCounts['A*'] + icoreCounts['A'] + icoreCounts['B'] + icoreCounts['C'];

    const icoreTitleY = quartileStart + Object.keys(quartileCounts).length * legendSpacing + 30;
    legend.append("text")
        .attr("x", 0)
        .attr("y", icoreTitleY)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .style("text-decoration", "underline")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text("ICORE ranking:");
    
    legend.append("text")
        .attr("x", 107) // ajusta según la longitud de "Publications:" para que quede alineado
        .attr("y", icoreTitleY)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .style("text-decoration", "none")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(`(${totalICOREPublications})`);


    // Filtrar solo los que tienen publicaciones
    const icoreFiltered = Object.entries(icoreCounts);
    const icoreStart = icoreTitleY + 5;

    legend.selectAll("text.icore")
        .data(icoreFiltered)
        .enter()
        .append("text")
        .attr("class", "icore")
        .attr("x", 0)
        .attr("y", (d, i) => icoreStart + i * legendSpacing + 15)
        .attr("font-size", "14px")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(d => `${d[0]} (${d[1]})`);

    // ---- Título Iconos ----
    // Contar publicaciones que usan cada icono
    const iconCounts = Object.keys(iconMap).reduce((acc, key) => {
        let count = 0;
        const keyLower = key.toLowerCase();

        publications.forEach(d => {
            if (["journal", "conference", "workshop"].includes(d.type)) {
                // Contamos 1 si notes incluye la key
                if (d.notes) {
                    const noteItems = d.notes
                        .toLowerCase()
                        .split(/[,;]+/) // separa por coma o punto y coma
                        .map(s => s.trim());

                    // Coincidencia exacta de ítem con key
                    if (noteItems.includes(keyLower)) {
                        count += 1;
                    }
                }
                // Contamos cada premio que coincide con la key
                if (d.awards?.length > 0 && key === 'best paper award') {
                    count += d.awards.length;
                }
            } else if (d.type === 'book' && key === 'other award') {  // book or phdthesis
                count += d.awards.length;
            }
        });
        acc[key] = count;
        return acc;
    }, {});

    //iconCounts['other award'] -= iconCounts['best paper award']; // adapt the count for best paper awards

    // Convertimos a array de objetos para la leyenda
    const iconEntries = Object.keys(iconCounts).map(key => ({
        icon: iconMap[key],
        meaning: iconMeaningMap[key],
        count: iconCounts[key]
    }));

    const iconTitleY = icoreStart + Object.keys(icoreFiltered).length * legendSpacing + 30;
    legend.append("text")
        .attr("x", 0)
        .attr("y", iconTitleY)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .style("text-decoration", "underline")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text("Other info:");

    const iconStart = iconTitleY + 5;

    const legendItems = legend.selectAll("g.icon-item")
        .data(iconEntries)
        .enter()
        .append("g")
        .attr("class", "icon-item")
        .attr("transform", (d, i) => `translate(0, ${iconStart + i * legendSpacing})`);

    // Añadimos la imagen del icono
    legendItems.append("image")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 16)   // tamaño del icono
        .attr("height", 16)
        .attr("href", d => emojiToDataURL(d.icon));  // aquí tu función de emoji a DataURL

    // Añadimos el texto al lado del icono
    legendItems.append("text")
        .attr("x", 20)  // separa el texto del icono
        .attr("y", 12)  // centra verticalmente respecto al icono
        .attr("font-size", "14px")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(d => `${d.meaning} (${d.count})`);
        
    // Aplicar estilos como atributos inline para que se incrusten en el SVG de cara a exportarlo a SVG y PDF
    svg.selectAll('.pub-square text')
        .attr('font-size', '12px')
        .attr('pointer-events', 'none');

    svg.selectAll('.pub-square')
        .attr('cursor', 'pointer')
        .attr('transform-origin', 'center')
        .attr('style', 'transition: transform 0.2s;');

    // Calcular el ancho total
    const numColumns = groupedByYear.length;
    const legendWidth = 500; // Ancho fijo para la leyenda
    const svgWidth = xStart + (numColumns - 1) * columnGap + squareSize + padding + legendWidth;

    d3.select("#chart")
        .attr("width", svgWidth)

}


function emojiToDataURL(emoji) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.font = "48px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'";
    ctx.fillText(emoji, 0, 48);
    return canvas.toDataURL(); // Devuelve un PNG base64
}
