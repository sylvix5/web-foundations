let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  const searchTerm = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(searchTerm));
}

function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  return notes.reduce((longest, current) => 
    current.text.length > longest.text.length ? current : longest
  );
}

function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }
  return counts;
}

function getSummary() {
  const counts = countByCategory();
  const totalNotes = notes.length;
  const noteWord = totalNotes === 1 ? "note" : "notes";
  
  // Convert the counts object into an array of strings like "2 personal"
  const categoryStrings = [];
  for (const category in counts) {
    categoryStrings.push(`${counts[category]} ${category}`);
  }
  
  return `${totalNotes} ${noteWord}: ${categoryStrings.join(", ")}.`;
}

function isDuplicate(text) {
  const cleanText = text.trim().toLowerCase();
  return notes.some((note) => note.text.trim().toLowerCase() === cleanText);
}

function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];
  
  if (text.length < 1 || text.length > 200) {
    console.log("Failed to add note: Text must be between 1 and 200 characters.");
    return false;
  }
  
  if (!validCategories.includes(category)) {
    console.log("Failed to add note: Invalid category. Must be personal, work, or study.");
    return false;
  }
  
  if (isDuplicate(text)) {
    console.log("Failed to add note: Note is a duplicate.");
    return false;
  }
  
  // Find highest ID to create a new unique ID
  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  
  notes.push({ id: newId, text: text, category: category });
  return true;
}

console.log("--- searchNotes ---");
console.log(searchNotes("day")); // Normal case: Expected array with id 2
console.log(searchNotes("zebra")); // Edge case: Expected empty array []

console.log("\n--- longestNote ---");
console.log(longestNote()); // Normal case: Expected object with id 3
// Expected output if notes = [] would be: null

console.log("\n--- countByCategory ---");
console.log(countByCategory()); // Normal case: Expected { personal: 2, study: 2, work: 1 }

console.log("\n--- getSummary ---");
console.log(getSummary()); // Normal case: Expected "5 notes: 2 personal, 2 study, 1 work."

console.log("\n--- isDuplicate ---");
console.log(isDuplicate("   call MUM   ")); // Normal case: Expected true (ignores case and extra spaces)
console.log(isDuplicate("Buy eggs")); // Edge case: Expected false

console.log("\n--- addNote ---");
console.log(addNote("Buy eggs", "personal")); // Normal case: Expected true (and adds note to array)
console.log(addNote("Call mum", "personal")); // Edge case (duplicate): Expected false, logs duplicate reason
