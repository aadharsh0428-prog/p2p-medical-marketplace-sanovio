export function rankByRelevance(query: string, listings: any[]) {
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length >= 3); // ["umbilical", "gloves"]
  
  return listings.map(listing => {
    let score = 0;
    const canonicalName = listing.canonicalName?.toLowerCase() || '';
    const manufacturer = listing.manufacturer?.toLowerCase() || '';
    const category = listing.category?.toLowerCase() || '';
    
    // Combine all searchable text
    const fullText = `${canonicalName} ${manufacturer} ${category}`;
    
    // ✅ MULTI-WORD SCORING: Each query word independently scores
    queryWords.forEach(word => {
      // Exact word match in canonical name
      if (canonicalName.includes(word)) {
        score += 3; // High score for name match
      }
      // Word in manufacturer
      else if (manufacturer.includes(word)) {
        score += 2;
      }
      // Word in category
      else if (category.includes(word)) {
        score += 1;
      }
      // Word anywhere in full text
      else if (fullText.includes(word)) {
        score += 0.5;
      }
    });
    
    // Bonus: Full phrase match (all words together)
    if (fullText.includes(queryLower)) {
      score += 5;
    }
    
    return { ...listing, relevanceScore: score };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}
