(function () {
  'use strict';

  const form = document.querySelector('form');

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

        data.forEach((item) => {
          const match = queryKeys.reduce((res, key) => {
            return res && item[key] == query[key];
          }, true);

          document
            .querySelector(`[data-id="${item.id}"]`)
            .toggleAttribute('hidden', !match);
        });
      }

      form.addEventListener('change', search);
    });
})();
