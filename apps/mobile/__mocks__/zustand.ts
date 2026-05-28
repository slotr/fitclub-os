export const create = (fn) => {
  const state = fn(() => {}, () => {});
  return (selector) => selector(state);
};
