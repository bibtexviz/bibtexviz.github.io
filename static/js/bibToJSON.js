const bibEntry = `@article{RomeroOrganvidez2024_DataVisualizationSPL,
  author       = {David Romero{-}Organvidez and Jos{\'{e}} Miguel Horcas and Jos{\'{e}} A. Galindo and David Benavides},
  title        = {Data visualization guidance using a software product line approach},
  journal      = {J. Syst. Softw.},
  volume       = {213},
  pages        = {112029},
  year         = {2024},
  url          = {https://doi.org/10.1016/j.jss.2024.112029},
  doi          = {10.1016/J.JSS.2024.112029},
  timestamp    = {Tue, 18 Jun 2024 01:00:00 +0200},
  biburl       = {https://dblp.org/rec/journals/jss/RomeroOrganvidezHGB24.bib},
  bibsource    = {dblp computer science bibliography, https://dblp.org}
}

@InProceedings{FernandezAmoros2024_PragmaticRandomSamplingLinuxKernel,
  author    = {David Fern{\'{a}}ndez{-}Amor{\'{o}}s and Ruben Heradio and Jos{\'{e}} Miguel Horcas and Jos{\'{e}} A. Galindo and David Benavides and Lidia Fuentes},
  booktitle = {28th {ACM} International Systems and Software Product Line Conference ({SPLC})},
  title     = {Pragmatic Random Sampling of the {Linux Kernel}: Enhancing the Randomness and Correctness of the conf Tool},
  year      = {2024},
  address   = {Dommeldange, Luxembourg},
  month     = sep,
  pages     = {24--35},
  publisher = {{ACM}},
  volume    = {A},
  bibsource = {dblp computer science bibliography, https://dblp.org},
  biburl    = {https://dblp.org/rec/conf/splc/Fernandez-Amoros24.bib},
  doi       = {10.1145/3646548.3672586},
  timestamp = {Wed, 14 Aug 2024 08:59:20 +0200},
  url       = {https://doi.org/10.1145/3646548.3672586},
}`;


var sample = bibtexParse.toJSON(bibEntry);

console.log(sample);