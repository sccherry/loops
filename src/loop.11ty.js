const Loop = require('../lib/loop');

exports.data = {
  layout: 'default',
  tags: ['loop'],
  permalink: ({ loop }) => `/${loop.prime.id}/index.html`,
  pagination: {
    data: 'loops',
    size: 1,
    alias: 'loop',
    addAllPagesToCollections: true,
    before: (data) => data.map(Loop.getLoopData),
  },
  eleventyComputed: {
    title: ({ loop }) => loop.chords.join(' '),
  },
};

exports.render = function ({ loop }) {
  return `
    <dl class="meta">
      <dt>Prime</dt>
      <dd>${loop.prime.chords.join(' ')}</dd>
      <dt>Negative</dt>
      <dd><a href="${this.url(
        `/${loop.negative.id}`
      )}">${loop.negative.chords.join(' ')}</a></dd>
      <dt>Rotations</dt>
      <dd>
        <ul>
          ${loop.rotations
            .map((rotation) => `<li>${rotation.join(' ')}</li>`)
            .join(' ')}
        </ul>
      </dd>
      <dt>Type</dt>
      <dd>${loop.type}</dd>
      <dt>Transitions</dt>
      <dd>${loop.transitions.join(', ')}</dd>
      <dt>Unique chords</dt>
      <dd>${loop.numChords}</dd>
      <dt>Chromatic chords</dd>
      <dd>${loop.numChromaticChords}</dd>
    </dl>
  `;
};
