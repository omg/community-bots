const charactersCommandJSON = {
  name: "characters",
  description: "Get the amount of characters for a word!",
  options: [
    {
      name: "query",
      description: "The text to count words from",
      type: 3,
      required: true,
    },
    {
      name: "frequency",
      description: "Whether or not to calculate character frequency",
      type: 5,
      required: false,
    },
  ],
};

// TODO
