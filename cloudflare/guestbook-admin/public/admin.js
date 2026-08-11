(function () {
  var list = document.getElementById('messages');
  var statusLine = document.getElementById('status');
  var template = document.getElementById('message-template');
  var current = 'pending';

  function formatDate(value) {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  async function request(method, body) {
    var response = await fetch('/api/messages' + (method === 'GET' && current !== 'all' ? '?status=' + current : ''), {
      method: method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    var data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  }

  function render(messages) {
    list.replaceChildren();
    statusLine.textContent = messages.length + (messages.length === 1 ? ' NOTE' : ' NOTES');
    if (!messages.length) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Nothing waiting here.';
      list.appendChild(empty);
      return;
    }
    messages.forEach(function (message) {
      var node = template.content.cloneNode(true);
      var article = node.querySelector('article');
      article.dataset.id = message.id;
      article.querySelector('h2').textContent = message.nickname;
      var email = article.querySelector('.email');
      if (message.email) {
        email.textContent = message.email;
        email.href = 'mailto:' + message.email;
      } else {
        email.textContent = 'no reply email';
        email.removeAttribute('href');
      }
      var time = article.querySelector('time');
      time.textContent = formatDate(message.created_at);
      time.dateTime = message.created_at;
      article.querySelector('blockquote').textContent = message.body;
      list.appendChild(node);
    });
  }

  async function load() {
    statusLine.textContent = 'LOADING…';
    try { render((await request('GET')).messages || []); }
    catch (error) { statusLine.textContent = error.message; }
  }

  document.querySelector('nav').addEventListener('click', function (event) {
    var button = event.target.closest('button[data-status]');
    if (!button) return;
    current = button.dataset.status;
    document.querySelectorAll('nav button').forEach(function (item) { item.classList.toggle('active', item === button); });
    load();
  });

  list.addEventListener('click', async function (event) {
    var button = event.target.closest('button[data-action]');
    if (!button) return;
    var article = button.closest('article');
    var action = button.dataset.action;
    if (action === 'delete' && !window.confirm('Delete this note forever?')) return;
    button.disabled = true;
    try {
      await request(action === 'delete' ? 'DELETE' : 'PATCH', action === 'delete' ? { id: article.dataset.id } : { id: article.dataset.id, status: action });
      await load();
    } catch (error) {
      statusLine.textContent = error.message;
      button.disabled = false;
    }
  });

  load();
})();
