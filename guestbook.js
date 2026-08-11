(function () {
  var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var apiBase = isLocal ? '' : 'https://guestbook-api.sofhrina.com';
  var form = document.getElementById('guestbook-form');
  var status = document.getElementById('form-status');
  var wall = document.getElementById('message-wall');
  var count = document.getElementById('message-count');
  var textarea = form.elements.message;
  var charCount = document.getElementById('char-count');

  function escapeDate(value) {
    try {
      return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
    } catch (_) {
      return '';
    }
  }

  function renderMessages(messages) {
    wall.replaceChildren();
    count.textContent = messages.length + (messages.length === 1 ? ' TRACE' : ' TRACES');
    if (!messages.length) {
      var empty = document.createElement('article');
      empty.className = 'message-card loading-card';
      empty.textContent = 'Be the first person to leave a trace.';
      wall.appendChild(empty);
      return;
    }
    messages.forEach(function (message) {
      var card = document.createElement('article');
      card.className = 'message-card';
      var quote = document.createElement('blockquote');
      quote.textContent = message.body;
      var meta = document.createElement('div');
      meta.className = 'message-meta';
      var name = document.createElement('span');
      name.textContent = message.nickname;
      var date = document.createElement('time');
      date.dateTime = message.created_at;
      date.textContent = escapeDate(message.created_at);
      meta.append(name, date);
      card.append(quote, meta);
      wall.appendChild(card);
    });
  }

  async function loadMessages() {
    try {
      var response = await fetch(apiBase + '/api/messages', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Messages are taking the scenic route.');
      var data = await response.json();
      renderMessages(data.messages || []);
    } catch (error) {
      count.textContent = 'OFFLINE';
      wall.innerHTML = '<article class="message-card loading-card"><p>The notes could not be reached just now. Try again soon.</p></article>';
    }
  }

  textarea.addEventListener('input', function () { charCount.textContent = textarea.value.length; });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    var submit = form.querySelector('button[type="submit"]');
    var turnstileInput = form.querySelector('[name="cf-turnstile-response"]');
    if (!isLocal && (!turnstileInput || !turnstileInput.value)) {
      status.className = 'form-status error';
      status.textContent = 'Please complete the small human check first.';
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Sending…';
    var payload = {
      nickname: form.elements.nickname.value.trim(),
      email: form.elements.email.value.trim(),
      message: textarea.value.trim(),
      website: form.elements.website.value,
      turnstileToken: turnstileInput ? turnstileInput.value : 'local-preview'
    };
    try {
      var response = await fetch(apiBase + '/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || 'That note did not make it through.');
      form.reset();
      charCount.textContent = '0';
      if (window.turnstile) window.turnstile.reset();
      status.className = 'form-status ok';
      status.textContent = 'Your note is waiting backstage. It will appear after I have read it.';
    } catch (error) {
      status.className = 'form-status error';
      status.textContent = error.message;
      if (window.turnstile) window.turnstile.reset();
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send into the universe →';
    }
  });

  loadMessages();
})();
