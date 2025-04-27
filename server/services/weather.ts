import axios from 'axios';

interface WeatherData {
  location: string;
  temperature: number; // in Celsius
  condition: string;
  humidity: number; // percentage
  windSpeed: number; // in m/s
  iconUrl: string;
  timestamp: number;
}

interface InsectActivityPrediction {
  overall: 'high' | 'moderate' | 'low';
  flying: 'high' | 'moderate' | 'low';
  seasonal: {
    activity: 'high' | 'moderate' | 'low';
    insects: string[];
  };
  recommendations: string[];
}

// OpenWeatherMap API base URL
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.WEATHER_API_KEY;

/**
 * Mock weather data generator when API is unavailable
 * @param lat Latitude coordinate
 * @param lon Longitude coordinate
 */
function getMockWeatherData(lat: number, lon: number): WeatherData {
  // Use fixed city name based on coordinates for consistency
  const cityNames = ['Springfield', 'Riverside', 'Oakville', 'Meadowbrook', 'Cedar Creek'];
  // Generate a deterministic index from the coordinates
  const cityIndex = Math.floor((lat * lon) % cityNames.length);
  if (cityIndex < 0) cityIndex * -1;
  
  const conditions = ['Clear', 'Clouds', 'Rain', 'Mist', 'Thunderstorm'];
  const conditionIndex = Math.floor((lat + lon) % conditions.length);
  
  // Weather icons based on condition
  const icons = ['01d', '03d', '10d', '50d', '11d'];
  
  // Generate a temperature based on latitude (cooler near poles, warmer near equator)
  const baseTemp = 15; // base temperature
  const latEffect = (90 - Math.abs(lat)) / 3; // higher temps closer to equator
  const temp = Math.round(baseTemp + latEffect);
  
  return {
    location: cityNames[Math.abs(cityIndex)],
    temperature: temp,
    condition: conditions[Math.abs(conditionIndex)],
    humidity: Math.floor(50 + Math.sin(lat * lon) * 30), // 20-80 range
    windSpeed: Math.floor(3 + Math.cos(lat + lon) * 6), // 0-9 range
    iconUrl: `https://openweathermap.org/img/wn/${icons[Math.abs(conditionIndex)]}@2x.png`,
    timestamp: Date.now() / 1000 // current timestamp in seconds
  };
}

/**
 * Fetch current weather data for a specific location
 * @param lat Latitude coordinate
 * @param lon Longitude coordinate
 */
export async function getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
  // Validate API key is present
  if (!API_KEY) {
    console.warn('WEATHER_API_KEY environment variable is not set. Using mock weather data.');
    return getMockWeatherData(lat, lon);
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        units: 'metric', // Use metric units (Celsius)
        appid: API_KEY
      }
    });

    // Check if the API response is valid
    if (response.status !== 200) {
      console.warn(`Weather API returned status ${response.status}. Using mock weather data.`);
      return getMockWeatherData(lat, lon);
    }

    const data = response.data;
    
    return {
      location: data.name,
      temperature: data.main.temp,
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      timestamp: data.dt
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    console.warn('Using mock weather data due to API error.');
    return getMockWeatherData(lat, lon);
  }
}

/**
 * Get the current season based on month and hemisphere
 * @param month Current month (1-12)
 * @param isNorthernHemisphere Whether the location is in the northern hemisphere
 */
function getCurrentSeason(month: number, isNorthernHemisphere: boolean = true): 'spring' | 'summer' | 'fall' | 'winter' {
  // Northern hemisphere seasons
  if (isNorthernHemisphere) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  } 
  // Southern hemisphere (inverted seasons)
  else {
    if (month >= 3 && month <= 5) return 'fall';
    if (month >= 6 && month <= 8) return 'winter';
    if (month >= 9 && month <= 11) return 'spring';
    return 'summer';
  }
}

/**
 * Determine the hemisphere based on latitude
 * @param latitude The latitude coordinate
 */
function isNorthernHemisphere(latitude: number): boolean {
  return latitude >= 0;
}

/**
 * Generate insect activity predictions based on weather conditions and season
 * @param weather Current weather data
 */
export function predictInsectActivity(weather: WeatherData, latitude: number): InsectActivityPrediction {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const hemisphere = isNorthernHemisphere(latitude);
  const season = getCurrentSeason(currentMonth, hemisphere);
  
  // Factors affecting insect activity
  const isWarm = weather.temperature > 15;
  const isHot = weather.temperature > 28;
  const isRainy = weather.condition.toLowerCase().includes('rain');
  const isWindy = weather.windSpeed > 5;
  const isHumid = weather.humidity > 70;
  
  // Calculate overall activity based on conditions
  let overallActivity: 'high' | 'moderate' | 'low' = 'moderate';
  
  // Temperature is the most significant factor
  if (weather.temperature < 10) {
    overallActivity = 'low';
  } else if (isHot && isHumid) {
    overallActivity = 'high';
  } else if (isWarm && !isWindy && !isRainy) {
    overallActivity = 'high';
  } else if (isRainy || isWindy) {
    overallActivity = 'low';
  }
  
  // Flying insect activity is affected by wind and rain
  let flyingActivity: 'high' | 'moderate' | 'low' = 'moderate';
  if (isWindy || isRainy) {
    flyingActivity = 'low';
  } else if (isWarm && !isHot) {
    flyingActivity = 'high';
  }
  
  // Seasonal insects and activity level
  let seasonalActivity: 'high' | 'moderate' | 'low' = 'moderate';
  let seasonalInsects: string[] = [];
  
  switch (season) {
    case 'spring':
      seasonalActivity = isWarm && !isRainy ? 'high' : 'moderate';
      seasonalInsects = [
        'Butterflies', 'Bees', 'Ladybugs', 'Aphids', 'Beetles'
      ];
      break;
    case 'summer':
      seasonalActivity = isHot && isHumid ? 'high' : 'moderate';
      seasonalInsects = [
        'Mosquitoes', 'Flies', 'Wasps', 'Cicadas', 'Dragonflies', 'Grasshoppers'
      ];
      break;
    case 'fall':
      seasonalActivity = isWarm ? 'moderate' : 'low';
      seasonalInsects = [
        'Spiders', 'Stink Bugs', 'Beetles', 'Moths', 'Crane Flies'
      ];
      break;
    case 'winter':
      seasonalActivity = 'low';
      seasonalInsects = [
        'Indoor Pests', 'Overwintering Insects', 'Some Spiders'
      ];
      break;
  }
  
  // Generate recommendations based on current conditions
  const recommendations: string[] = [];
  
  if (overallActivity === 'high') {
    recommendations.push('Great conditions for insect spotting! Bring your camera and observation tools.');
  } else if (overallActivity === 'low') {
    recommendations.push('Limited insect activity expected. Focus on sheltered areas where insects might take refuge.');
  }
  
  if (season === 'spring') {
    recommendations.push('Look for pollinators around flowering plants and gardens.');
  } else if (season === 'summer') {
    recommendations.push('Check near water sources for diverse insect activity.');
    if (isHot && isHumid) {
      recommendations.push('Higher mosquito activity likely - consider insect repellent.');
    }
  } else if (season === 'fall') {
    recommendations.push('Focus on leaf litter and bark for insects preparing for winter.');
  } else if (season === 'winter') {
    recommendations.push('Look under logs, rocks, and in protected areas for overwintering insects.');
  }
  
  if (isRainy) {
    recommendations.push('After rain stops, check wet areas for increased ground insect activity.');
  }
  
  if (weather.condition.toLowerCase().includes('clear') && isWarm) {
    recommendations.push('Clear conditions are perfect for observing flying insects like butterflies and dragonflies.');
  }
  
  return {
    overall: overallActivity,
    flying: flyingActivity,
    seasonal: {
      activity: seasonalActivity,
      insects: seasonalInsects
    },
    recommendations
  };
}

/**
 * Get both weather data and insect activity predictions for a location
 * @param lat Latitude coordinate
 * @param lon Longitude coordinate
 */
export async function getWeatherAndInsectActivity(lat: number, lon: number): Promise<{
  weather: WeatherData;
  insectActivity: InsectActivityPrediction;
}> {
  try {
    const weatherData = await getWeatherByCoordinates(lat, lon);
    const activityPrediction = predictInsectActivity(weatherData, lat);
    
    return {
      weather: weatherData,
      insectActivity: activityPrediction
    };
  } catch (error) {
    console.error('Error getting weather and insect activity:', error);
    throw error;
  }
}