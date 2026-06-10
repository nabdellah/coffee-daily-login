const form = document.getElementById('logForm');
const status = document.getElementById('status');
const entriesBody = document.getElementById('entriesBody');

document.getElementById('date').valueAsDate = new Date();

function notifyDashboard() {
  localStorage.setItem('log_updated', Date.now());
}

function setStatus(msg, type) {
  status.textContent = msg;
  status.className = type;
}

async function loadEntries() {
  const res = await fetch('/api/entries');
  const rows = await res.json();

  if (!rows.length) {
    entriesBody.innerHTML = '<tr><td colspan="5" class="no-entries">No entries yet.</td></tr>';
    return;
  }

  entriesBody.innerHTML = rows.map(r => buildRow(r)).join('');
  entriesBody.querySelectorAll('[data-id]').forEach(attachRowHandlers);
}

function buildRow({ id, date, shop_name, sales, customers }) {
  return `
    <tr data-id="${id}">
      <td>${date}</td>
      <td>${shop_name}</td>
      <td>${Number(sales).toFixed(2)}</td>
      <td>${customers}</td>
      <td class="actions">
        <button class="btn-sm btn-edit">Edit</button>
        <button class="btn-sm btn-delete">Delete</button>
      </td>
    </tr>`;
}

function attachRowHandlers(tr) {
  tr.querySelector('.btn-edit').addEventListener('click', () => startEdit(tr));
  tr.querySelector('.btn-delete').addEventListener('click', () => deleteRow(tr));
}

function startEdit(tr) {
  const id = tr.dataset.id;
  const cells = tr.querySelectorAll('td');
  const [date, sector, sales, customers] = [
    cells[0].textContent,
    cells[1].textContent,
    cells[2].textContent,
    cells[3].textContent,
  ];

  tr.innerHTML = `
    <td><input class="inline" type="date" value="${date}"></td>
    <td><input class="inline" type="text" value="${sector}"></td>
    <td><input class="inline" type="number" min="0" step="0.01" value="${sales}"></td>
    <td><input class="inline" type="number" min="0" step="1" value="${customers}"></td>
    <td class="actions">
      <button class="btn-sm btn-save">Save</button>
      <button class="btn-sm btn-cancel">Cancel</button>
    </td>`;

  tr.querySelector('.btn-save').addEventListener('click', () => saveEdit(tr, id));
  tr.querySelector('.btn-cancel').addEventListener('click', loadEntries);
  tr.querySelector('input').focus();
}

async function saveEdit(tr, id) {
  const inputs = tr.querySelectorAll('input');
  const body = {
    date: inputs[0].value,
    shop_name: inputs[1].value.trim(),
    sales: parseFloat(inputs[2].value),
    customers: parseInt(inputs[3].value, 10),
  };

  const res = await fetch(`/api/log/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    notifyDashboard();
    loadEntries();
  } else {
    const data = await res.json();
    setStatus(data.error ?? 'Save failed', 'error');
  }
}

async function deleteRow(tr) {
  const id = tr.dataset.id;
  if (!confirm('Delete this entry?')) return;

  const res = await fetch(`/api/log/${id}`, { method: 'DELETE' });
  if (res.ok) {
    notifyDashboard();
    loadEntries();
  } else {
    setStatus('Delete failed', 'error');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('', '');

  const body = {
    date: form.date.value,
    shop_name: form.shop_name.value.trim(),
    sales: parseFloat(form.sales.value),
    customers: parseInt(form.customers.value, 10),
  };

  try {
    const res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      setStatus(`Saved (id: ${data.id})`, 'success');
      form.reset();
      document.getElementById('date').valueAsDate = new Date();
      notifyDashboard();
      loadEntries();
    } else {
      setStatus(data.error ?? 'Unknown error', 'error');
    }
  } catch {
    setStatus('Network error — is the server running?', 'error');
  }
});

loadEntries();
