let chartInstance = null;

async function loadDashboard() {
  const res = await fetch('/api/summary');
  const rows = await res.json();

  const canvas = document.getElementById('chart');
  const chartEmpty = document.getElementById('chartEmpty');
  const tableBody = document.getElementById('tableBody');
  const tableEmpty = document.getElementById('tableEmpty');
  const updatedAt = document.getElementById('updatedAt');

  updatedAt.textContent = `Updated ${new Date().toLocaleTimeString()}`;

  if (!rows.length) {
    canvas.style.display = 'none';
    chartEmpty.style.display = 'block';
    tableBody.innerHTML = '';
    tableEmpty.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  chartEmpty.style.display = 'none';
  tableEmpty.style.display = 'none';

  const labels = rows.map(r => r.shop_name);
  const salesData = rows.map(r => r.total_sales);
  const customerData = rows.map(r => r.total_customers);

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = salesData;
    chartInstance.data.datasets[1].data = customerData;
    chartInstance.update('active');
  } else {
    chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Sales ($)',
            data: salesData,
            backgroundColor: 'rgba(123,79,46,0.8)',
            borderColor: 'rgba(123,79,46,1)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'ySales',
          },
          {
            label: 'Total Customers',
            data: customerData,
            backgroundColor: 'rgba(196,149,106,0.65)',
            borderColor: 'rgba(196,149,106,1)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'yCustomers',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 12 } },
        },
        scales: {
          ySales: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Sales ($)', font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          yCustomers: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Customers', font: { size: 11 } },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  tableBody.innerHTML = rows.map(r => `
    <tr>
      <td><span class="badge">${r.shop_name}</span></td>
      <td>${Number(r.total_sales).toFixed(2)}</td>
      <td>${r.total_customers}</td>
      <td>${r.entry_count}</td>
    </tr>`).join('');
}

// Real-time update: fires when the form page writes to localStorage
window.addEventListener('storage', e => {
  if (e.key === 'log_updated') loadDashboard();
});

loadDashboard().catch(console.error);
