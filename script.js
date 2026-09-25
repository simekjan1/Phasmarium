let state = {
    clutches: [],
    individuals: [],
    careHistory: [],
    eggHistory: [],
    notes: []
};

    // Funkce pro bezpečné vložení textu (ochrana proti XSS)
    function escapeHTML(str) {
        if (!str) return "";
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- MODÁL ---
    let modalCallback = null;
    function openConfirm(msg, callback) {
        document.getElementById('modalMessage').innerText = msg;
        document.getElementById('customModal').style.display = 'flex';
        modalCallback = callback;
        document.getElementById('modalConfirm').focus();
    }

    document.getElementById('modalConfirm').onclick = () => {
        if(modalCallback) modalCallback();
        document.getElementById('customModal').style.display = 'none';
    };

    document.getElementById('modalCancel').onclick = () => {
        document.getElementById('customModal').style.display = 'none';
    };

document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('customModal');
    if (e.key === 'Escape' && modal.style.display === 'flex') {
        modal.style.display = 'none';
    }
});

    function save() {
        localStorage.setItem('lupenitka_v4', JSON.stringify(state));
        render();
    }

    function load() {
let saved = localStorage.getItem('lupenitka_v4');

if (!saved) {
    saved = localStorage.getItem('lupenitka_v3');
}
        if (saved) {
            try {
const parsed = JSON.parse(saved);
state = {
    clutches: parsed.clutches || [],
    individuals: parsed.individuals || [],
    careHistory: parsed.careHistory || [],
    eggHistory: parsed.eggHistory || [],
    notes: parsed.notes || []
};

            } catch(e) {
                console.error("Chyba při načítání dat z localStorage");
            }
        }
        document.getElementById('clutchDate').valueAsDate = new Date();
        render();
    }

    function logCare(type) {
        state.careHistory.push({
            type: type,
            date: new Date().toISOString()
        });
        save();
    }

function toggleForm(id) {
    const form = document.getElementById(id);
    if (form.style.display === 'none') {
        form.style.display = 'block';
        // fokus na první input
        const input = form.querySelector('input');
        if (input) input.focus();
    } else {
        form.style.display = 'none';
    }
}

    // --- INKUBÁTOR ---
    function addClutch(e) {
        e.preventDefault();
        const start = new Date(document.getElementById('clutchDate').value);
        const months = parseInt(document.getElementById('clutchHatch').value);
        const expected = new Date(start);
        expected.setMonth(expected.getMonth() + months);

        state.clutches.push({
            id: Date.now(),
            label: document.getElementById('clutchId').value,
            startDate: start.toISOString(),
            expectedDate: expected.toISOString()
        });
        e.target.reset();
        document.getElementById('clutchDate').valueAsDate = new Date();
        save();
document.getElementById('incubatorForm').style.display = 'none';
    }

    function deleteClutch(id) {
        openConfirm('Smazat záznam o této snůšce?', () => {
            state.clutches = state.clutches.filter(c => c.id !== id);
            save();
        });
    }

    function addIndividual(e) {
        e.preventDefault();
        state.individuals.push({
            id: Date.now(),
            name: document.getElementById('indName').value,
            instar: 'L1',
            history: [{instar: 'L1', date: new Date().toISOString()}]
        });
        e.target.reset();
        save();
document.getElementById('individualForm').style.display = 'none';
    }

    function updateInstar(id) {
        const ind = state.individuals.find(i => i.id === id);
        if(!ind) return;
        const phases = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'Adult'];
        const currentIdx = phases.indexOf(ind.instar);
        if(currentIdx < phases.length - 1) {
            const next = phases[currentIdx + 1];
            ind.instar = next;
            ind.history.push({instar: next, date: new Date().toISOString()});
            save();
        }
    }

    function deleteIndividual(id) {
        openConfirm('Odstranit tuto lupenitku ze seznamu?', () => {
            state.individuals = state.individuals.filter(i => i.id !== id);
            save();
        });
    }

function deleteNote(id) {
    openConfirm('Smazat tuto poznámku?', () => {
        state.notes = state.notes.filter(note => note.id !== id);
        save();
    });
}

    function addEggHistory() {
        const count = parseInt(document.getElementById('eggCount').value);
        if(count > 0) {
            state.eggHistory.push({date: new Date().toISOString(), count: count});
            document.getElementById('eggCount').value = 0;
            save();
        }
    }

function addNote() {
    const textarea = document.getElementById('noteText');
    const text = textarea.value.trim();

    if (!text) {
        alert('Poznámka je prázdná.');
        return;
    }

    state.notes.push({
        id: Date.now(),
        date: new Date().toISOString(),
        text: text
    });

    textarea.value = '';
    save();
}

    function render() {
        const now = new Date();
        const todayStr = now.toLocaleDateString();

        // Pomocná pro hledání posledního úkonu určitého typu
        const getLastAction = (type) => {
            const actions = state.careHistory.filter(h => h.type === type);
            return actions.length > 0 ? new Date(actions[actions.length-1].date) : null;
        };

        // Alerty
        const checkSpray = (logKey, alertId) => {
            const el = document.getElementById(alertId);
            const last = getLastAction(logKey);
            const isDone = last && last.toLocaleDateString() === todayStr;
            el.style.display = isDone ? 'none' : 'block';
        };
        checkSpray('lastSprayIncubator', 'sprayIncubatorAlert');
        checkSpray('lastSprayTerrarium', 'sprayTerrariumAlert');

        const foodEl = document.getElementById('foodAlert');
        const lastFood = getLastAction('lastFood');
const lastSpray = getLastAction('lastSprayTerrarium');
const lastClean = getLastAction('lastClean');

const formatStatus = (date, okText, missingText) => {
    if (!date) return missingText;

    const isToday = date.toLocaleDateString() === todayStr;
    if (isToday) return okText;

    return date.toLocaleDateString();
};

document.getElementById('statSpray').innerText = formatStatus(
    lastSpray,
    'Dnes hotovo',
    'Chybí'
);

document.getElementById('statFood').innerText = lastFood
    ? lastFood.toLocaleDateString()
    : 'Chybí';

document.getElementById('statClean').innerText = lastClean
    ? lastClean.toLocaleDateString()
    : 'Chybí';
        if (lastFood) {
            const diff = (now - lastFood) / (1000*60*60*24);
            foodEl.style.display = diff >= 4 ? 'block' : 'none';
        } else foodEl.style.display = 'block';

        // Vajíčka
        const total = state.eggHistory.reduce((sum, item) => sum + item.count, 0);
        document.getElementById('totalEggs').innerText = total;
document.getElementById('statEggs').innerText = total;

document.getElementById('eggHistoryShort').innerHTML = state.eggHistory.slice(-5).reverse()
    .map(h => `<div>${new Date(h.date).toLocaleDateString()}: ${h.count} ks</div>`).join('');

// Poznámky
const notesContainer = document.getElementById('notesList');
if (notesContainer) {
    notesContainer.innerHTML = state.notes.slice().reverse().map(note => `
        <div class="item-card">
            <strong>${new Date(note.date).toLocaleDateString()} ${new Date(note.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</strong>
            <p>${escapeHTML(note.text).replace(/\n/g, '<br>')}</p>
            <button class="danger" onclick="deleteNote(${note.id})">Smazat poznámku</button>
        </div>
    `).join('');
}

        // Historie úkonů (posledních 10)
        const labels = {
            lastSprayIncubator: '💦 Rosil inkubátor',
            lastSprayTerrarium: '💦 Rosil terárium',
            lastFood: '🌿 Měnil krmení',
            lastClean: '🧽 Čistil terárium'
        };
        document.getElementById('careLogList').innerHTML = state.careHistory.slice(-10).reverse()
            .map(h => `<div>${new Date(h.date).toLocaleDateString()} ${new Date(h.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}: ${labels[h.type] || 'Neznámý úkon'}</div>`).join('');

        // Seznamy s ochranou proti XSS
        const clutchContainer = document.getElementById('clutchList');
        clutchContainer.innerHTML = state.clutches.map(c => `
            <div class="item-card">
                <h4>${escapeHTML(c.label)}</h4>
                <p>Založeno: ${new Date(c.startDate).toLocaleDateString()}</p>
                <p>Líhnutí cca: <strong style="color:var(--accent-color)">${new Date(c.expectedDate).toLocaleDateString()}</strong></p>
                <button class="danger" onclick="deleteClutch(${c.id})">Smazat</button>
            </div>
        `).join('');

        const indContainer = document.getElementById('individualList');
        indContainer.innerHTML = state.individuals.map(i => {
            let hist = i.history.map((h, idx) => {
                const d = new Date(h.date).toLocaleDateString();
                if(idx === 0) return `<li>Zrození: ${d}</li>`;
                const days = Math.round((new Date(h.date) - new Date(i.history[idx-1].date)) / (1000*60*60*24));
                return `<li>Svlek na ${h.instar}: ${d} (po ${days} dnech)</li>`;
            }).join('');
            return `
                <div class="item-card">
                    <h4>${escapeHTML(i.name)} - ${i.instar}</h4>
                    <div class="history-list"><ul>${hist}</ul></div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <button onclick="updateInstar(${i.id})">✨ Zapsat svlek</button>
                        <button class="danger" onclick="deleteIndividual(${i.id})">Smazat</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function exportData() {
        const dateStr = new Date().toISOString().slice(0, 10);
        const blob = new Blob([JSON.stringify(state)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `lupenitka_zaloha_${dateStr}.json`;
        a.click();
setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

function importData(e) {
    const reader = new FileReader();
    reader.onload = (ev) => { 
        try {
            const imported = JSON.parse(ev.target.result);

            // Tolerantní načtení – doplní chybějící části
state = {
    clutches: imported.clutches || [],
    individuals: imported.individuals || [],
    careHistory: imported.careHistory || [],
    eggHistory: imported.eggHistory || [],
    notes: imported.notes || []
};

            save();
            alert('Záloha byla úspěšně nahrána!');
        } catch(err) {
            alert('CHYBA: Soubor není platná záloha aplikace Lupenitka.');
        }
    };
    if(e.target.files[0]) reader.readAsText(e.target.files[0]);
}

function toggleSection(header) {
    const content = header.nextElementSibling;

    if (content.style.display === 'none') {
        content.style.display = 'block';
        header.innerText = header.innerText.replace('⬆', '⬇');
    } else {
        content.style.display = 'none';
        header.innerText = header.innerText.replace('⬇', '⬆');
    }
}

    window.onload = load;