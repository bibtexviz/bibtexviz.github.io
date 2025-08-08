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
        collab: '👥',
        industry: '🏢',
        stay: '🗺️'
    };

    // Colores por tipo de publicación
    const colorMap = {
        journal: '#c32b72',
        indexed_conf: '#196ca3',
        workshop: '#2ecc71',
        non_indexed_conf: '#95a5a6',
        book: '#ffd500',
        editorship: '#33c3ba',
        other: '#606b70' // Otros tipos
    };

   // Nuevo orden de apilado (de arriba a abajo)
    const typeOrder = {
        'book': 0,
        'journal': 1,
        'indexed_conf': 2,
        'workshop': 3,
        'non_indexed_conf': 4,
        'editorship': 5,
        'other': 6 // Los que no tienen tipo van al final
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
            } else if (['indexed_conf', 'workshop'].includes(a.type)) {
                // Se ha añadido la lógica para ordenar por icore
                const icoreCmp = (icoreOrder[a.icore] ?? icoreOrder['-']) - (icoreOrder[b.icore] ?? icoreOrder['-']);
                if (icoreCmp !== 0) return icoreCmp;
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

    // Crear grupos con enlace
    const group = svg.selectAll("a")
        .data(positionedPublications)
        .enter()
        .append("a")
        .attr("xlink:href", d => d.doi || null)
        .attr("target", "_blank");

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
        .style("font-size", "1.1em") 
        .text(d => {
            if (d.type === 'journal') return d.quartile || '-';
            if (['indexed_conf', 'workshop'].includes(d.type)) return d.icore || '-';
            return '-';
        });

    // Inferior derecha: Acrónimo y track
    const textGroup = squares.append("g")
        .attr("transform", d => `translate(${squareSize - padding}, ${squareSize - padding})`)
        .attr("text-anchor", "end")
        .attr("font-style", "italic");

    textGroup.each(function(d) {
        const group = d3.select(this);
        const acronymText = d.acronym || '';
        const trackText = d.track ? `${d.track}@` : '';
        
        // Si el texto completo es demasiado largo, lo dividimos en dos líneas
        if ((trackText + acronymText).length > 8 && d.track) {
            // Línea superior: track
            group.append("text")
                .attr("x", 0)
                .attr("y", -14) // Posición ajustada para la primera línea
                .text(trackText);
            
            // Línea inferior: acrónimo
            group.append("text")
                .attr("x", 0)
                .attr("y", 0) // Posición ajustada para la segunda línea
                .text(acronymText);
        } else {
            // Si no es largo, lo mostramos todo en una sola línea
            group.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .text(trackText + acronymText);
        }
    });

    // Superior derecha: Trofeo si best paper
    squares.append("text")
        .attr("x", squareSize - padding + 10)
        .attr("y", padding + 15)
        .attr("text-anchor", "end")
        .style("font-size", "1.5em") 
        .text(d => (d.awards && d.awards.length > 0) ? "🏆" : "");

    // Superior izquierda: Iconos (colaboraciones, etc.)
    squares.append("text")
        .attr("x", padding - 10)
        .attr("y", padding + 15)
        .attr("text-anchor", "start")
        .style("font-size", "1.5em") 
        .text(d => (d.icons || []).map(i => iconMap[i] || '').join(""));

    // Inferior izquierda: Posición del autor
    squares.append("text")
        .attr("x", padding)
        .attr("y", squareSize - padding)
        .attr("text-anchor", "start")
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
    .text(d => d[0]);  // el año está en la primera posición de la tupla

}

// Ejemplo de datos, ahora en una constante
const examplePublications = [
    {
        type: 'journal',
        quartile: 'Q1',
        icore: null,
        authorPosition: '1/3',
        acronym: 'JSS',
        track: null,
        awards: ['best'],
        icons: ['collab', 'industry'],
        doi: 'https://doi.org/10.1016/j.jss.2021.111013',
        year: 2021,
        date: '2021-07-10'
    },
    {
        type: 'journal',
        quartile: 'Q1',
        icore: null,
        authorPosition: '1/3',
        acronym: 'JSS',
        track: null,
        awards: ['best'],
        icons: ['collab', 'industry'],
        doi: 'https://doi.org/10.1016/j.jss.2021.111013',
        year: 2021,
        date: '2021-07-13'
    },
    {
        type: 'indexed_conf',
        quartile: null,
        icore: 'A+',
        authorPosition: '2/5',
        acronym: 'ICSE',
        track: 'tool',
        awards: [],
        icons: ['stay'],
        doi: 'https://doi.org/10.1145/1234567.1234568',
        year: 2021,
        date: '2021-07-12'
    },
    {
        type: 'non_indexed_conf',
        quartile: null,
        icore: null,
        authorPosition: '1/2',
        acronym: 'JISBD',
        track: null,
        awards: [],
        icons: [],
        doi: 'https://doi.org/10.1234/jisbd.2022',
        year: 2022,
        date: '2022-07-10'
    },
    {
        type: 'non_indexed_conf',
        quartile: null,
        icore: null,
        authorPosition: '1/2',
        acronym: 'JISBD',
        track: null,
        awards: [],
        icons: [],
        doi: 'https://doi.org/10.1234/jisbd.2022',
        year: 2022,
        date: '2022-07-10'
    },
    {
        type: 'non_indexed_conf',
        quartile: null,
        icore: null,
        authorPosition: '1/2',
        acronym: 'JISBD',
        track: null,
        awards: [],
        icons: [],
        doi: 'https://doi.org/10.1234/jisbd.2022',
        year: 2022,
        date: '2022-07-10'
    },
    {
        type: 'non_indexed_conf',
        quartile: null,
        icore: null,
        authorPosition: '1/2',
        acronym: 'JISBD',
        track: null,
        awards: [],
        icons: [],
        doi: 'https://doi.org/10.1234/jisbd.2022',
        year: 2022,
        date: '2022-07-10'
    },
    {
        type: 'journal',
        quartile: 'Q1',
        icore: null,
        authorPosition: '1/3',
        acronym: 'JSS',
        track: null,
        awards: ['best'],
        icons: ['collab', 'industry'],
        doi: 'https://doi.org/10.1016/j.jss.2021.111013',
        year: 2024,
        date: '2024-07-13'
    },
    {
        type: 'indexed_conf',
        quartile: null,
        icore: 'A+',
        authorPosition: '2/5',
        acronym: 'ICSE',
        track: 'tool',
        awards: [],
        icons: ['stay'],
        doi: 'https://doi.org/10.1145/1234567.1234568',
        year: 2024,
        date: '2024-07-12'
    },
];

// Llamada inicial para dibujar el gráfico con los datos de ejemplo
drawChart(examplePublications, "#chart");