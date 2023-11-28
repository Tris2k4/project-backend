const Colours = {
  blue: '#0000ff',
  brown: '#a52a2a',
  green: '#008000',
  orange: '#ffa500',
  purple: '#800080',
  red: '#ff0000',
  yellow: '#ffff00',
};

export const randomColourGenerator = () => {
  let result;
  let count = 0;
  for (const prop in Colours) if (Math.random() < 1 / ++count) result = prop;
  return result;
};
