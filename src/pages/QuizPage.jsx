useEffect(() => {
  fetch(`/.netlify/functions/fetch-notion-questions?aircraft=${aircraft}&subject=${subject}`)
    .then((res) => res.json())
    .then((data) => {
      const shuffled = subject === "all" ? [...data].sort(() => Math.random() - 0.5) : data;

      setQuestions(shuffled);
      setFilteredQuestions(shuffled);

      const tags = new Set();
      const sources = new Set();
      shuffled.forEach(q => {
        q.tags.forEach(t => tags.add(t));
        if (q.source) sources.add(q.source);
      });
      setAllTags([...tags]);
      setAllSources(["All", ...sources]);
    })
    .catch((err) => console.error("Fetch error:", err));
}, [aircraft, subject]);
