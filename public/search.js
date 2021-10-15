(function () {
  'use strict';

  const form = document.querySelector('form');
  const results = document.querySelector('#results');

  function syncOutput(input) {
    const output = document.querySelector(`[data-target="${input.id}"]`);
    output.textContent = input.value;
  }

  form.querySelectorAll('input[type="range"]').forEach((input) => {
    syncOutput(input);
    input.addEventListener('input', (e) => syncOutput(e.target));
  });

  form.addEventListener('submit', (e) => e.preventDefault());

  fetch('data.json')
    .then((res) => res.json())
    .then((data) => {
      function search() {
        let query = {};
        const formData = new FormData(form);

        for (let [name, value] of formData) {
          if (value && value !== '') {
            query[name] = value;
          }
        }

        const queryKeys = Object.keys(query);

        let n = 0;

        data.forEach((item) => {
          const match = queryKeys.reduce((res, key) => {
            return res && item[key] == query[key];
          }, true);

          if (match) n += 1;

          document
            .querySelector(`[data-id="${item.id}"]`)
            .toggleAttribute('hidden', !match);
        });

        results.textContent = n;
      }

      form.addEventListener('change', search);
    });
})();
