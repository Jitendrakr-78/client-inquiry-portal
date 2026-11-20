const form = document.getElementById('inquiryForm');
const statusBox = document.getElementById('statusMessage');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusBox.textContent = 'Submitting your request...';

  const payload = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    service: document.getElementById('service').value,
    details: document.getElementById('details').value
  };

  try {
    const response = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    statusBox.textContent = `Success! Your reference ID is ${data.referenceId}.`;
    form.reset();
  } catch (err) {
    statusBox.textContent = `Error: ${err.message}`;
  }
});
