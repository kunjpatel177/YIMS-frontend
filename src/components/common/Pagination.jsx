import React from 'react';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, total } = pagination;

  const pagesArray = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);

  for (let i = start; i <= end; i++) {
    pagesArray.push(i);
  }

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-2 border-top border-light-subtle">
      <div className="small text-secondary">
        Showing page <span className="fw-semibold text-dark">{page}</span> of{' '}
        <span className="fw-semibold text-dark">{pages}</span> ({total} total records)
      </div>
      <ul className="pagination pagination-sm mb-0">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
            <i className="fas fa-chevron-left fa-xs"></i>
          </button>
        </li>

        {start > 1 && (
          <>
            <li className="page-item">
              <button className="page-link" onClick={() => onPageChange(1)}>
                1
              </button>
            </li>
            {start > 2 && <li className="page-item disabled"><span className="page-link">...</span></li>}
          </>
        )}

        {pagesArray.map((p) => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(p)}>
              {p}
            </button>
          </li>
        ))}

        {end < pages && (
          <>
            {end < pages - 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
            <li className="page-item">
              <button className="page-link" onClick={() => onPageChange(pages)}>
                {pages}
              </button>
            </li>
          </>
        )}

        <li className={`page-item ${page === pages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page + 1)} disabled={page === pages}>
            <i className="fas fa-chevron-right fa-xs"></i>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Pagination;
