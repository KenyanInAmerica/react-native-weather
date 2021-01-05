const apiKey = "723628177f1b8401a67d06b7a800d179";

export const weatherApi = (path, { zipcode, coords }, units) => {
  const suffix = zipcode ? `zip=${zipcode}` : `lat=${coords.latitude}&lon=${coords.longitude}`;
  const tempType = units === undefined || units === '' ? '' : '&units=' + units;

  return fetch(
    `https://api.openweathermap.org/data/2.5${path}?appid=${apiKey}${tempType}&${suffix}`
  ).then(response => response.json());
};
