export function mapDescriptionToAnimation(description) {
  let mappedIcon = "sunny"; // fallback

  switch (description.toLowerCase()) {
    case "clear sky":
      mappedIcon = "sunny";
      break;

    case "few clouds":
      mappedIcon = "cloudy-few";
      break;
      
    case "scattered clouds":
      mappedIcon = "cloudy-scattered";
      break;

    case "broken clouds":
    case "overcast clouds":
      mappedIcon = "cloudy";
      break;

    case "haze":
    case "mist":
    case "smoke":
    case "fog":
      mappedIcon = "mist";
      break;

    case "light rain":
      mappedIcon = "rainy"; // pakai rainy untuk simplifikasi
      break;

    case "moderate rain":
      mappedIcon = "rainy";
      break;

    case "heavy intensity rain":
    case "very heavy rain":
    case "extreme rain":
      mappedIcon = "rainy";
      break;

    case "light snow":
    case "snow":
    case "heavy snow":
      mappedIcon = "snow";
      break;

    case "thunderstorm":
    case "thunderstorm with light rain":
    case "thunderstorm with heavy rain":
    case "thunderstorm with drizzle":
      mappedIcon = "thunderstorms";
      break;

    case "wind":
    case "breezy":
      mappedIcon = "wind";
      break;

    default:
      mappedIcon = "sunny"; // fallback
      break;
  }

  return mappedIcon;
}
