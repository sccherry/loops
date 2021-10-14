const Loop = require('../lib/loop');

exports.data = {
  layout: 'default',
  tags: ['loop'],
  permalink: ({ loop }) => `/${loop.id}/index.html`,
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
    <dl>
      <dt>Prime</dt>
      <dd>${Loop.getChordsFromId(loop.prime).join(' ')}</dd>
      <dt>Negative</dt>
      <dd><a href="${this.url(`/${loop.negative}`)}">${Loop.getChordsFromId(
    loop.negative
  ).join(' ')}</a></dd>
      <dt>Rotations</dt>
      <dd>
        <ul>
          ${loop.rotations
            .map(
              (rotation) =>
                `<li>${Loop.getChordsFromId(rotation).join(' ')}</li>`
            )
            .join(' ')}
        </ul>
      </dd>
      <dt>Type</dt>
      <dd>${loop.type}</dd>
      <dt>Transitions</dt>
      <dd>${loop.transitions.join(', ')}</dd>
    </dl>
  `;
};
