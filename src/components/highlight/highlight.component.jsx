import { Fragment } from 'react';

import './highlight.styles.scss';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const Highlight = ({ text, query }) => {
  const trimmedQuery = query ? query.trim() : '';

  if (!trimmedQuery) return text;

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi'));

  return (
    <Fragment>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark className='highlight' key={index}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </Fragment>
  );
};

export default Highlight;
