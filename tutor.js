(function () {
  var original = renderLesson;
  renderLesson = function () {
    original();
    if (document.getElementById('academyTutor')) return;
    var en = S.profile.ui === 'en';
    var panel = document.createElement('details'); panel.id = 'academyTutor'; panel.className = 'simple-details';
    var summary = document.createElement('summary'); summary.textContent = en ? 'Help me understand' : 'Iga caawi fahamka'; panel.appendChild(summary);
    var note = document.createElement('p'); note.textContent = en ? 'AI help can make mistakes. Your question and lesson context are sent to Google. Do not include personal details.' : 'Caawinta AI way qaldami kartaa. Su’aasha iyo casharka waxaa loo diraa Google. Ha gelin xog gaar ah.'; panel.appendChild(note);
    var form = document.createElement('form');
    var input = document.createElement('textarea'); input.maxLength = 500; input.required = true; input.setAttribute('aria-label', en ? 'Your learning question' : 'Su’aashaada'); input.placeholder = en ? 'What would you like explained?' : 'Maxaad rabtaa in laguu sharaxo?'; form.appendChild(input);
    var button = document.createElement('button'); button.type = 'submit'; button.textContent = en ? 'Ask tutor' : 'Weydii macallinka'; form.appendChild(button);
    var output = document.createElement('p'); output.setAttribute('role', 'status'); output.style.whiteSpace = 'pre-wrap';
    form.onsubmit = async function (event) {
      event.preventDefault();
      if (!window.ACADEMY_TUTOR_URL) { output.textContent = en ? 'The tutor is awaiting secure setup.' : 'Macallinku wuxuu sugayaa habaynta amniga.'; return; }
      button.disabled = true; output.textContent = en ? 'Thinking…' : 'Waan ka fikirayaa…';
      try {
        var response = await fetch(window.ACADEMY_TUTOR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: input.value, lesson: JSON.stringify(cur).slice(0, 2500), language: en ? 'en' : 'so' }), signal: AbortSignal.timeout(25000) });
        var data = await response.json(); if (!response.ok) throw new Error(); output.textContent = data.answer;
      } catch { output.textContent = en ? 'Tutor unavailable. Please try again later.' : 'Macallinka lama heli karo. Mar kale isku day.'; }
      finally { button.disabled = false; }
    };
    panel.appendChild(form); panel.appendChild(output); app.appendChild(panel);
  };
})();
