const response = payload => {
  const items = Array.isArray(payload) ? payload : [payload];
  const totalItems = items.length;

  return { data: { items, totalItems } };
};

const withPagination = ({ data, pagination }) => Object.assign(response(data), { pagination });

/**
 * Creates standard payload response
 *
 * @param payload Body to attach on the response
 *
 * @return        Standard object as a custom response
 */
export default (payload = []) => (payload.pagination ? withPagination(payload) : response(payload));
