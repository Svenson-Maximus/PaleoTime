export type Confidence = "stable" | "active" | "debated";

export type LineageNode = {
  id: string;
  name: string;
  fromMya: number;
  toMya: number;
  confidence: Confidence;
  note: string;
  children?: LineageNode[];
};

export const dinosaurTree: LineageNode = {
  id: "dinosauria",
  name: "Dinosauria",
  fromMya: 233,
  toMya: 66,
  confidence: "stable",
  note: "The common lineage containing non-avian dinosaurs and birds, emerging in the Late Triassic.",
  children: [
    {
      id: "saurischia",
      name: "Saurischia",
      fromMya: 230,
      toMya: 66,
      confidence: "active",
      note: "Traditionally one of the two major dinosaur branches; relationships near the base remain actively studied.",
      children: [
        {
          id: "theropoda",
          name: "Theropoda",
          fromMya: 231,
          toMya: 0,
          confidence: "stable",
          note: "Mostly bipedal dinosaurs; includes large predators, many feathered forms, and living birds.",
        },
        {
          id: "sauropodomorpha",
          name: "Sauropodomorpha",
          fromMya: 231,
          toMya: 66,
          confidence: "stable",
          note: "Long-necked herbivorous dinosaurs, from early bipedal forms to giant sauropods.",
        },
      ],
    },
    {
      id: "ornithischia",
      name: "Ornithischia",
      fromMya: 230,
      toMya: 66,
      confidence: "active",
      note: "A diverse herbivorous lineage including armored, plated, horned, and duck-billed dinosaurs.",
      children: [
        {
          id: "thyreophora",
          name: "Thyreophora",
          fromMya: 199,
          toMya: 66,
          confidence: "stable",
          note: "Armored dinosaurs including stegosaurs and ankylosaurs.",
        },
        {
          id: "ornithopoda",
          name: "Ornithopoda",
          fromMya: 170,
          toMya: 66,
          confidence: "stable",
          note: "Beaked herbivores including iguanodontians and hadrosaurs.",
        },
        {
          id: "ceratopsia",
          name: "Ceratopsia",
          fromMya: 161,
          toMya: 66,
          confidence: "stable",
          note: "Horned dinosaurs, from small early forms to large ceratopsids.",
        },
      ],
    },
  ],
};

export const timeMarkers = [
  { label: "Triassic", start: 252, end: 201 },
  { label: "Jurassic", start: 201, end: 145 },
  { label: "Cretaceous", start: 145, end: 66 },
  { label: "K-Pg", start: 66, end: 66 },
];
