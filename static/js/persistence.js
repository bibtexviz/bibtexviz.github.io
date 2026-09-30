const setupSaveButton = (buttonId, chartSelector, serializeFunction, extension) => {
    d3.select(buttonId).on('click', async function(event) {
        event.preventDefault();
        const svgElement = buildExportSvg(chartSelector);

        const name = 'publications';
        try {
            const blob = await serializeFunction(svgElement);
            saveAs(blob, name + extension);
        } catch (error) {
            console.error(`An error occurred while saving the ${extension.toUpperCase()}:`, error);
        } finally {
            svgElement.parentNode.remove();
            //restoreSVGSize(svgElement, originalHeight);
            //newData = filterData(ALL_DATA);
            //redrawLabel(newData);
        }
    });
};

//setupSaveButton('#saveSVG', '#FMFactLabelChart', serializeToSVG, '.svg');

setupSaveButton('#downloadPng', '#chart', rasterize, '.png');


const setupPDFSaveButton = (buttonId, chartSelector) => {
    d3.select(buttonId).on('click', async function(event) {
        event.preventDefault();
        const svgElement = buildExportSvg(chartSelector);

        try {
            const svgWidth = +svgElement.getAttribute("width");
            const svgHeight = +svgElement.getAttribute("height");

            const blob = await serializeToSVG(svgElement);
            const imgData = await readBlobAsDataURL(blob);

            const fm_name = window.FM_NAME;
            const svg = svgElement;
            const doc = new window.PDFDocument({ 
                size: [svgWidth, svgHeight]  // Ajusta el tamaño del PDF al tamaño del SVG
            });
            const chunks = [];
            const stream = doc.pipe({
              // writable stream implementation
              write: (chunk) => chunks.push(chunk),
              end: () => {
                const pdfBlob = new Blob(chunks, {
                  type: 'application/octet-stream',
                });
                const blobUrl = URL.createObjectURL(pdfBlob);

                // Crear un enlace de descarga
                const downloadLink = document.createElement("a");
                downloadLink.href = blobUrl;

                // Asignar un nombre al archivo PDF descargado
                downloadLink.download = 'publications.pdf';

                // Simular clic para descargar el archivo
                downloadLink.click();

                // Limpiar el objeto URL
                URL.revokeObjectURL(blobUrl);
              },
              // readable stream stub implementation
              on: (event, action) => {},
              once: (...args) => {},
              emit: (...args) => {},
            });

            // Pasar las coordenadas correctas para ajustar el SVG en el PDF
            window.SVGtoPDF(doc, svg, 0, 0, {
              width: svgWidth,
              height: svgHeight
            });
            doc.end();
        } catch (error) {
            console.error("An error occurred while saving the PDF:", error);
        } finally {
            svgElement.parentNode.remove();
            //restoreSVGSize(svgElement, originalHeight);
            //newData = filterData(ALL_DATA);
            //redrawLabel(newData);
        }
    });
};

setupPDFSaveButton('#downloadPdf', '#chart');

/**
 * Set-up the save TXT button.
 */
d3.select('#saveTXT').on('click', function () {
    const fm_name = window.FM_NAME;
    var fileData;
    if (window.TXT_CHARACTERIZATION != null) {
        fileData = window.TXT_CHARACTERIZATION;
    } else {
        fileData = pyodideInstance.FS.readFile(fm_name + ".txt", { encoding: "utf8" });
    }
    
    // Create Blob from bytes (text/plain)
    var blob = new Blob([fileData], { type: "text/plain" });
    saveAs(blob, fm_name + ".txt");
});

/**
 * Set-up the save JSON button.
 */
d3.select('#saveJSON').on('click', function () {
    const fm_name = window.FM_NAME;
    var fileData;
    if (window.JSON_CHARACTERIZATION != null) {
        fileData = window.JSON_CHARACTERIZATION;
    } else {
        const jsonString = pyodideInstance.FS.readFile(fm_name + ".json", { encoding: "utf8" });
        fileData = JSON.parse(jsonString);
    }
    // Create Blob from bytes (application/json)
    const jsonStr = JSON.stringify(fileData, null, 4);
    var blob = new Blob([jsonStr], { type: "application/json" });
    saveAs(blob, fm_name + ".json");
});

/**
 * Generic code to download a file available on the server.
 * (Not used actually.)
 */
function downloadUsingAnchorElement() {
    const anchor = document.createElement("a");
    anchor.href = IMG_URL;
    anchor.download = FILE_NAME;
    
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

/**
 * Third-party code:
 * - For saving SVG and PNG: https://observablehq.com/@mbostock/saving-svg
 * - FileSaver (for saving files on the client-side): https://github.com/eligrey/FileSaver.js/
 */

/**
 * Builds a single SVG with the chart and, centered below it, its legend (separate SVGs on screen),
 * at their real size. The SVG is attached to the document (inside a hidden wrapper) so it
 * can be measured and rendered; the caller must remove it when done.
 */
function buildExportSvg(chartSelector = '#chart', legendSelector = '#legend') {
    const chart = document.querySelector(chartSelector);
    const legend = document.querySelector(legendSelector);
    const gap = 20;

    const chartWidth = +chart.getAttribute("width") || 0;
    const chartHeight = +chart.getAttribute("height") || 0;
    const legendWidth = legend ? +legend.getAttribute("width") || 0 : 0;
    const legendHeight = legend ? +legend.getAttribute("height") || 0 : 0;
    const width = Math.max(chartWidth, legendWidth);
    const height = chartHeight + (legendHeight ? gap + legendHeight : 0);

    const svg = document.createElementNS(svgns, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const chartGroup = document.createElementNS(svgns, "g");
    chart.childNodes.forEach(node => chartGroup.appendChild(node.cloneNode(true)));
    svg.appendChild(chartGroup);

    if (legend) {
        const legendGroup = document.createElementNS(svgns, "g");
        legendGroup.setAttribute("transform", `translate(${(width - legendWidth) / 2}, ${chartHeight + gap})`);
        legend.childNodes.forEach(node => legendGroup.appendChild(node.cloneNode(true)));
        svg.appendChild(legendGroup);
    }

    // Hide the wrapper, not the SVG, so no extra style ends up in the exported file
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "-100000px";
    wrapper.appendChild(svg);
    document.body.appendChild(wrapper);
    return svg;
}

const xmlns = "http://www.w3.org/2000/xmlns/";
const xlinkns = "http://www.w3.org/1999/xlink";
const svgns = "http://www.w3.org/2000/svg";

function serializeToSVG(svg) {
    svg = svg.cloneNode(true);
    const fragment = window.location.href + "#";
    const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
        for (const attr of walker.currentNode.attributes) {
            if (attr.value.includes(fragment)) {
                attr.value = attr.value.replace(fragment, "#");
            }
        }
    }
    svg.setAttributeNS(xmlns, "xmlns", svgns);
    svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
    const serializer = new XMLSerializer();
    const string = serializer.serializeToString(svg);
    return new Blob([string], { type: "image/svg+xml" });
}

function rasterize(svg) {
    let resolve, reject;
    const promise = new Promise((y, n) => (resolve = y, reject = n));
    const image = new Image();
    image.onerror = (e) => {
        console.error("Image onerror event:", e);
        reject(e);
    };
    image.onload = () => {
        // Use the real SVG size, not the scaled on-screen size
        const width = +svg.getAttribute("width") || svg.getBoundingClientRect().width;
        const height = +svg.getAttribute("height") || svg.getBoundingClientRect().height;
        const context = context2d(width, height);
        context.drawImage(image, 0, 0, width, height);
        context.canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    };
    const serializedSVG = serializeToSVG(svg);
    image.src = URL.createObjectURL(serializedSVG);
    return promise;
}

function context2d(width, height, dpi) {
    if (dpi == null) dpi = devicePixelRatio;
    const canvas = document.createElement("canvas");
    canvas.width = width * dpi;
    canvas.height = height * dpi;
    canvas.style.width = width + "px";
    const context = canvas.getContext("2d");
    context.scale(dpi, dpi);
    return context;
}

const adjustSVGSize = (svgElement) => {
    const originalHeight = svgElement.getAttribute("height");

    d3.select(".chart").selectAll("#collapseIcon").attr("visibility", "hidden");

    const bbox = svgElement.getBBox();
    svgElement.setAttribute("height", bbox.height);

    return originalHeight;
};

const restoreSVGSize = (svgElement, originalHeight) => {
    svgElement.setAttribute("height", originalHeight);
};

const readBlobAsDataURL = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Error reading the blob"));
        reader.readAsDataURL(blob);
    });
};

