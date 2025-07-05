// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, push, remove, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB1LCgmA9eb1tNsmdmQTuHPhRKhet4RaWM",
  authDomain: "language-entry.firebaseapp.com",
  databaseURL: "https://language-entry-default-rtdb.firebaseio.com",
  projectId: "language-entry",
  storageBucket: "language-entry.firebasestorage.app",
  messagingSenderId: "72772945167",
  appId: "1:72772945167:web:3a6f9d2c3e2083952daa7a",
  measurementId: "G-33RV4B0SP5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentEntryKey = null;
let quill;

// DOM Elements
const vocabForm = document.getElementById('vocab-form');
const entryKeyInput = document.getElementById('entry-key');
const spanishWordInput = document.getElementById('spanish-word');
const englishWordInput = document.getElementById('english-word');
const entryTypeSelect = document.getElementById('entry-type'); // Type select for the Add/Edit form
const learnedCheckbox = document.getElementById('learned-checkbox');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const newBtn = document.getElementById('new-btn');
const deleteBtn = document.getElementById('delete-btn');
const messageContainer = document.getElementById('message-container');
const entryList = document.getElementById('entry-list');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter'); // Type filter for the list
const statusFilter = document.getElementById('status-filter'); // Status filter for the list
const randomBtn = document.getElementById('random-btn');
const nextRandomBtn = document.getElementById('new-random-btn');
const darkCheckbox = document.getElementById('theme-checkbox');

// Modal Elements
const randomModal = document.getElementById('random-modal');
const randomCloseBtn = document.getElementById('random-close-btn');
const randomSpanishDiv = document.getElementById('random-spanish');
const randomEnglishDiv = document.getElementById('random-english');
const randomCommentDiv = document.getElementById('random-comment');
const randomAnswerBtn = document.getElementById('random-answer-btn');
const randomAnswerContent = document.getElementById('random-answer-content');

// Section Elements
const mainContentTitle = document.getElementById('main-content-title');
const formArea = document.getElementById('form-area');
const controlsArea = document.getElementById('controls-area');
const addElementLink = document.getElementById('add-element-link');
const visualizeMenuLink = document.getElementById('visualize-menu-link');

document.addEventListener('DOMContentLoaded', () => {
  quill = new Quill('#comment-editor', {
    theme: 'snow',
    placeholder: 'Add your comment here...',
    modules: { toolbar: [ ['bold', 'italic'], [{ 'list': 'bullet' }], ['clean'] ] }

    

  });

  // Initial fetch of entries
  fetchEntries();

  // Event Listeners
  vocabForm.addEventListener('submit', saveEntry);
  cancelBtn.addEventListener('click', resetForm);
  newBtn.addEventListener('click', resetForm);
  deleteBtn.addEventListener('click', deleteEntry);
  searchInput.addEventListener('input', fetchEntries);
  typeFilter.addEventListener('change', fetchEntries);
  statusFilter.addEventListener('change', fetchEntries);
  entryList.addEventListener('click', (e) => {
    let targetLi = e.target.closest('li');
    if (targetLi && targetLi.dataset.key) {
        editEntry(targetLi.dataset.key);
    }
  });

  // Random element functionality
  randomBtn.addEventListener('click', fetchRandomEntry);
  nextRandomBtn.addEventListener('click', fetchRandomEntry);
  randomAnswerBtn.addEventListener('click', showRandomAnswer);
  randomCloseBtn.addEventListener('click', hideRandomModal);

  // Sidebar navigation
  addElementLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
    showSection('add-element');
  });

  visualizeMenuLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('visualize-menu');
  });

  // Theme
  document.getElementById('theme-checkbox').addEventListener('change',  () => {
                                      if (darkCheckbox.checked) {
                                        document.body.classList.add('dark-mode');
                                      } else {
                                        document.body.classList.remove('dark-mode');
                                      }
                                    });

document.body.classList.add('dark-mode');

});

function showSection(section) {
  if (section === 'add-element') {
    formArea.style.display = 'block';
    controlsArea.style.display = 'none';
    mainContentTitle.textContent = 'Add New Vocabulary Entry';
    addElementLink.classList.add('active');
    visualizeMenuLink.classList.remove('active');
  } else if (section === 'visualize-menu') {
    formArea.style.display = 'none';
    controlsArea.style.display = 'block';
    mainContentTitle.textContent = 'Visualize Vocabulary';
    visualizeMenuLink.classList.add('active');
    addElementLink.classList.remove('active');
    fetchEntries();
  }
}

function saveEntry(e) {
  e.preventDefault();

  const spanish = spanishWordInput.value.trim();
  const english = englishWordInput.value.trim();
  const comment = quill.root.innerHTML.trim();
  const type = entryTypeSelect.value;
  const learned = learnedCheckbox.checked;

  if (spanish === '' || english === '') {
    showMessage('Spanish word and English translation cannot be empty!', 'error');
    return;
  }

  const entryData = {
    spanish: spanish,
    english: english,
    comment: comment,
    type: type,
    learned: learned
  };

  if (currentEntryKey) {
    // Update existing entry
    set(ref(db, 'vocabulary/' + currentEntryKey), entryData)
      .then(() => {
        showMessage('Entry updated successfully!', 'success');
        resetForm();
        fetchEntries();
      })
      .catch((error) => {
        console.error("Error updating entry: ", error);
        showMessage('Error updating entry: ' + error.message, 'error');
      });
  } else {
    // Add new entry
    const newEntryKey = push(ref(db, 'vocabulary')).key;
    set(ref(db, 'vocabulary/' + newEntryKey), entryData)
      .then(() => {
        showMessage('Entry added successfully!', 'success');
        resetForm();
        fetchEntries();
      })
      .catch((error) => {
        console.error("Error adding entry: ", error);
        showMessage('Error adding entry: ' + error.message, 'error');
      });
  }
}

function fetchEntries() {
  get(child(ref(db), 'vocabulary')).then((snapshot) => {
    entryList.innerHTML = '';
    if (snapshot.exists()) {
      const entries = snapshot.val();
      const searchTerm = searchInput.value.toLowerCase();
      const selectedType = typeFilter.value;
      const selectedStatus = statusFilter.value;

      Object.keys(entries).forEach((key) => {
        const entry = entries[key];
        const spanish = entry.spanish ? entry.spanish.toLowerCase() : '';
        const english = entry.english ? entry.english.toLowerCase() : '';
        const type = entry.type || 'expression';
        const learned = entry.learned || false;

        const matchesSearch = searchTerm === '' || spanish.includes(searchTerm) || english.includes(searchTerm);
        const matchesType = selectedType === 'all' || type === selectedType;
        const matchesStatus = (selectedStatus === 'all') ||
                              (selectedStatus === 'learned' && learned) ||
                              (selectedStatus === 'unlearned' && !learned);


        if (matchesSearch && matchesType && matchesStatus) {
          const listItem = document.createElement('li');
          listItem.dataset.key = key;
          listItem.innerHTML = `
            <span><strong>${entry.spanish}</strong> - ${entry.english} (${entry.type || 'word'}) ${learned ? '&#10003;' : ''}</span>
            <button class="edit-btn"></button>
          `;
          entryList.appendChild(listItem);

          listItem.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            editEntry(key);
          });
        }
      });
    } else {
      entryList.innerHTML = '<li style="text-align: center; color: var(--text-color);">No vocabulary entries yet. Add some!</li>';
    }
  }).catch((error) => {
    console.error("Error fetching entries: ", error);
    showMessage('Error loading entries: ' + error.message, 'error');
  });
}

function editEntry(key) {
  get(child(ref(db), 'vocabulary/' + key)).then((snapshot) => {
    if (snapshot.exists()) {
      const entry = snapshot.val();
      currentEntryKey = key;

      spanishWordInput.value = entry.spanish || '';
      englishWordInput.value = entry.english || '';
      if (quill) {
        quill.root.innerHTML = entry.comment || '';
      }
      entryTypeSelect.value = entry.type || 'word';
      learnedCheckbox.checked = entry.learned || false;

      saveBtn.textContent = 'Update Entry';
      deleteBtn.style.display = 'inline-block';
      newBtn.style.display = 'inline-block';
      showMessage('', '');
      showSection('add-element');
    } else {
      showMessage('Entry not found!', 'error');
    }
  }).catch((error) => {
    console.error("Error fetching entry for edit: ", error);
    showMessage('Error fetching entry for edit: ' + error.message, 'error');
  });
}

function deleteEntry() {
  if (currentEntryKey && confirm('Are you sure you want to delete this entry?')) {
    remove(ref(db, 'vocabulary/' + currentEntryKey))
      .then(() => {
        showMessage('Entry deleted successfully!', 'success');
        resetForm();
        fetchEntries();
      })
      .catch((error) => {
        console.error("Error deleting entry: ", error);
        showMessage('Error deleting entry: ' + error.message, 'error');
      });
  }
}

function resetForm() {
  currentEntryKey = null;
  vocabForm.reset();
  quill.root.innerHTML = '';
  entryTypeSelect.value = 'expression';
  learnedCheckbox.checked = false;
  saveBtn.textContent = 'Save Entry';
  deleteBtn.style.display = 'none';
  newBtn.style.display = 'none';
  showMessage('', '');
}

function showMessage(message, type) {
  messageContainer.textContent = message;
  messageContainer.className = 'message-container';
  if (message) {
    messageContainer.classList.add('show');
    messageContainer.classList.add(`message-${type}`);
  }
}

function fetchRandomEntry() {
  get(child(ref(db), 'vocabulary')).then((snapshot) => {
    if (snapshot.exists()) {
      const entries = snapshot.val();
      const unlearnedEntries = Object.values(entries).filter(entry => !entry.learned);

      if (unlearnedEntries.length > 0) {
        const randomIndex = Math.floor(Math.random() * unlearnedEntries.length);
        const randomEntry = unlearnedEntries[randomIndex];

        randomSpanishDiv.textContent = randomEntry.spanish;
        randomEnglishDiv.textContent = randomEntry.english;
        randomCommentDiv.innerHTML = randomEntry.comment || '';

        randomAnswerContent.style.display = 'none';
        randomAnswerBtn.style.display = 'inline-block';
        randomModal.style.display = 'flex';
      } else {
        showMessage('No unlearned entries available to pick a random one! All entries are marked as learned.', 'error');
        randomModal.style.display = 'none';
      }
    } else {
      showMessage('No entries found in your vocabulary!', 'error');
    }
  }).catch((error) => {
    console.error("Error fetching entries for random: ", error);
    showMessage('Error fetching random entry: ' + error.message, 'error');
  });
}

function showRandomAnswer() {
  randomAnswerContent.style.display = 'block';
  randomAnswerBtn.style.display = 'none';
}

function hideRandomModal() {
  randomModal.style.display = 'none';
  randomSpanishDiv.textContent = '';
  randomEnglishDiv.textContent = '';
  randomCommentDiv.innerHTML = '';
}

